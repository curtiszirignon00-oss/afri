/**
 * Rate Limiter IA — Protection Anti-abus SIMBA
 *
 * Stratégie : sliding window Redis (Upstash) + fallback in-memory
 *
 * Quotas par endpoint :
 *  /coach             → 30 req / heure  (chat conversationnel)
 *  /explain           → 20 req / heure  (explications pédagogiques)
 *  /quiz              → 20 req / heure  (génération de quiz)
 *  /market-analysis   → 15 req / heure  (analyse d'action)
 *  /portfolio-analysis→ 10 req / heure  (analyse portefeuille — lourd)
 *  /tutor             → 20 req / heure  (tuteur Gemini, existant)
 *  /stock-analysis    → 15 req / heure  (analyse Gemini, existant)
 *
 * Limite globale inter-endpoints : 50 req / heure / utilisateur
 */

import type { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';
import type { AuthenticatedRequest } from './auth.middleware';

// ─── Config ───────────────────────────────────────────────────────────────────

interface RateLimitConfig {
  windowMs: number;
  max: number;
  label: string;
}

export const AI_LIMITS: Record<string, RateLimitConfig> = {
  coach:              { windowMs: 60 * 60 * 1000, max: 30,  label: 'Chat SIMBA'            },
  explain:            { windowMs: 60 * 60 * 1000, max: 20,  label: 'Explications'          },
  quiz:               { windowMs: 60 * 60 * 1000, max: 20,  label: 'Quiz'                  },
  'market-analysis':  { windowMs: 60 * 60 * 1000, max: 15,  label: 'Analyse de marché'     },
  'portfolio-analysis':{ windowMs: 60 * 60 * 1000, max: 10, label: 'Analyse portefeuille'  },
  tutor:              { windowMs: 60 * 60 * 1000, max: 20,  label: 'Tuteur'                },
  'stock-analysis':   { windowMs: 60 * 60 * 1000, max: 15,  label: 'Analyse action Gemini' },
};

const GLOBAL_LIMIT: RateLimitConfig = {
  windowMs: 60 * 60 * 1000,
  max: 50,
  label: 'Global IA',
};

// ─── Fallback in-memory (Map) ─────────────────────────────────────────────────

const memoryStore = new Map<string, number[]>();

function memoryCheck(key: string, windowMs: number, max: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (memoryStore.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= max) {
    return { allowed: false, remaining: 0 };
  }

  memoryStore.set(key, [...timestamps, now]);
  return { allowed: true, remaining: max - timestamps.length - 1 };
}

// Nettoyage périodique de la mémoire (toutes les 30 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of memoryStore.entries()) {
    const fresh = timestamps.filter((t) => now - t < 2 * 60 * 60 * 1000);
    if (fresh.length === 0) memoryStore.delete(key);
    else memoryStore.set(key, fresh);
  }
}, 30 * 60 * 1000);

// ─── Redis sliding window (ZSET) ─────────────────────────────────────────────

async function redisCheck(
  key: string,
  windowMs: number,
  max: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedisClient();
  if (!redis) throw new Error('Redis non disponible');

  const now = Date.now();
  const windowStart = now - windowMs;
  const ttlSec = Math.ceil(windowMs / 1000);

  // Pipeline : ZREMRANGEBYSCORE (purge anciens) + ZADD (ajoute) + ZCARD (compte) + EXPIRE (TTL)
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
  pipeline.zcard(key);
  pipeline.expire(key, ttlSec);

  const results = await pipeline.exec();
  const count = (results[2] as number) ?? 1;

  if (count > max) {
    // Annuler l'ajout qu'on vient de faire (on a déjà dépassé)
    await redis.zremrangebyscore(key, now, now);
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: max - count };
}

// ─── Vérification combinée endpoint + global ─────────────────────────────────

async function checkLimit(
  userId: string,
  endpoint: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number; resetIn: number; label: string }> {
  const endpointKey = `rl:ai:${endpoint}:${userId}`;
  const globalKey   = `rl:ai:global:${userId}`;

  try {
    // Vérifier le global en premier (plus restrictif)
    const global = await redisCheck(globalKey, GLOBAL_LIMIT.windowMs, GLOBAL_LIMIT.max);
    if (!global.allowed) {
      return { allowed: false, remaining: 0, resetIn: GLOBAL_LIMIT.windowMs, label: GLOBAL_LIMIT.label };
    }

    const endpoint_ = await redisCheck(endpointKey, config.windowMs, config.max);
    return {
      allowed: endpoint_.allowed,
      remaining: Math.min(global.remaining, endpoint_.remaining),
      resetIn: config.windowMs,
      label: config.label,
    };
  } catch {
    // Fallback in-memory
    const global = memoryCheck(`global:${userId}`, GLOBAL_LIMIT.windowMs, GLOBAL_LIMIT.max);
    if (!global.allowed) {
      return { allowed: false, remaining: 0, resetIn: GLOBAL_LIMIT.windowMs, label: GLOBAL_LIMIT.label };
    }
    const ep = memoryCheck(`${endpoint}:${userId}`, config.windowMs, config.max);
    return {
      allowed: ep.allowed,
      remaining: Math.min(global.remaining, ep.remaining),
      resetIn: config.windowMs,
      label: config.label,
    };
  }
}

// ─── Quota freemium : 4 messages IA par jour ─────────────────────────────────

const FREE_DAILY_LIMIT = 4;

/** TTL en secondes jusqu'à minuit UTC (reset quotidien). */
function secondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
}

// Fallback in-memory pour le quota freemium (si Redis indisponible)
const freeQuotaMemory = new Map<string, { count: number; resetAt: number }>();

async function checkFreeQuota(userId: string): Promise<{
  allowed: boolean;
  used: number;
  resetAt: Date;
}> {
  const key = `rl:ai:free_daily:${userId}`;
  const ttl = secondsUntilMidnightUTC();
  const resetAt = new Date(Date.now() + ttl * 1000);

  try {
    const redis = getRedisClient();
    if (!redis) throw new Error('Redis non disponible');

    // INCR atomique + EXPIRE si nouvelle clé
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, ttl);
    }

    if (count > FREE_DAILY_LIMIT) {
      // Annuler l'incrément — on a dépassé
      await redis.decr(key);
      return { allowed: false, used: FREE_DAILY_LIMIT, resetAt };
    }
    return { allowed: true, used: count, resetAt };
  } catch {
    // Fallback in-memory
    const now = Date.now();
    const entry = freeQuotaMemory.get(userId);

    if (!entry || now >= entry.resetAt) {
      freeQuotaMemory.set(userId, { count: 1, resetAt: now + ttl * 1000 });
      return { allowed: true, used: 1, resetAt };
    }
    if (entry.count >= FREE_DAILY_LIMIT) {
      return { allowed: false, used: FREE_DAILY_LIMIT, resetAt: new Date(entry.resetAt) };
    }
    entry.count++;
    return { allowed: true, used: entry.count, resetAt: new Date(entry.resetAt) };
  }
}

// ─── Middleware factory ───────────────────────────────────────────────────────

/**
 * Retourne un middleware Express de rate limiting pour un endpoint IA spécifique.
 * Usage : router.post('/coach', auth, aiRateLimit('coach'), coachIA)
 *
 * Pour les comptes freemium (subscriptionTier === 'free'), applique en premier
 * un quota de FREE_DAILY_LIMIT messages par jour avant le rate limit Redis standard.
 */
export function aiRateLimit(endpoint: string) {
  const config = AI_LIMITS[endpoint] ?? { windowMs: 60 * 60 * 1000, max: 20, label: endpoint };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;
    const userId = user?.id ?? req.ip ?? 'anon';

    // ── Quota freemium (avant le rate limit standard) ──────────────────────
    if (user?.subscriptionTier === 'free') {
      const quota = await checkFreeQuota(userId);
      res.setHeader('X-AI-Questions-Used', quota.used);
      res.setHeader('X-AI-Questions-Limit', FREE_DAILY_LIMIT);

      if (!quota.allowed) {
        res.status(402).json({
          success: false,
          paywallHit: true,
          message: `Vous avez utilisé vos ${FREE_DAILY_LIMIT} questions IA gratuites aujourd'hui.`,
          questionsUsed: FREE_DAILY_LIMIT,
          questionsLimit: FREE_DAILY_LIMIT,
          resetAt: quota.resetAt.toISOString(),
        });
        return;
      }
    }

    // ── Rate limit standard (anti-abus, tous comptes) ──────────────────────
    const { allowed, remaining, resetIn, label } = await checkLimit(userId, endpoint, config);

    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + resetIn) / 1000));

    if (!allowed) {
      res.status(429).json({
        success: false,
        message: `Limite ${label} atteinte (${config.max} req/heure). Réessayez dans ${Math.ceil(resetIn / 60000)} min.`,
        retryAfter: Math.ceil(resetIn / 1000),
      });
      return;
    }

    next();
  };
}
