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

// ─── Middleware factory ───────────────────────────────────────────────────────

/**
 * Retourne un middleware Express de rate limiting pour un endpoint IA spécifique.
 * Usage : router.post('/coach', auth, aiRateLimit('coach'), coachIA)
 */
export function aiRateLimit(endpoint: string) {
  const config = AI_LIMITS[endpoint] ?? { windowMs: 60 * 60 * 1000, max: 20, label: endpoint };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as AuthenticatedRequest).user?.id ?? req.ip ?? 'anon';

    const { allowed, remaining, resetIn, label } = await checkLimit(userId, endpoint, config);

    // Headers standard
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
