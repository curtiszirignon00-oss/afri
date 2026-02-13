import { getRedisClient } from '../config/redis';

// TTLs en secondes
export const CACHE_TTL = {
  STOCKS: 3600,            // 1 heure
  STOCK_DETAIL: 1800,      // 30 minutes
  LEADERBOARD: 300,        // 5 minutes
  CHALLENGE_STATS: 600,    // 10 minutes
  LEARNING_MODULES: 86400, // 24 heures
  LEARNING_MODULE: 86400,  // 24 heures
  PROFILE: 600,            // 10 minutes
  NEWS: 1800,              // 30 minutes
} as const;

// Generateurs de cles
export const CACHE_KEYS = {
  stocks: (filtersHash: string) => `stocks:list:${filtersHash}`,
  stockDetail: (symbol: string) => `stock:${symbol}`,
  leaderboard: (limit: number) => `leaderboard:${limit}`,
  userRank: (userId: string) => `leaderboard:user:${userId}`,
  challengeStats: () => `challenge:stats`,
  learningModules: (difficulty: string) => `learning:modules:${difficulty || 'all'}`,
  learningModule: (slug: string) => `learning:module:${slug}`,
  profile: (userId: string) => `profile:${userId}`,
  news: (page: number) => `news:page:${page}`,
} as const;

/**
 * Recuperer une valeur du cache. Retourne null si miss ou cache desactive.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
    return null;
  } catch (error) {
    console.error(`[Cache] Erreur GET ${key}:`, error);
    return null;
  }
}

/**
 * Stocker une valeur dans le cache avec TTL.
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error(`[Cache] Erreur SET ${key}:`, error);
  }
}

/**
 * Supprimer une cle du cache.
 */
export async function cacheDelete(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error(`[Cache] Erreur DELETE ${key}:`, error);
  }
}

/**
 * Invalider toutes les cles correspondant a un pattern.
 * Utilise SCAN pour eviter le blocage.
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    let cursor = 0;
    do {
      const result = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => redis.del(key)));
      }
    } while (cursor !== 0);
  } catch (error) {
    console.error(`[Cache] Erreur INVALIDATE ${pattern}:`, error);
  }
}

/**
 * Genere un hash deterministe pour un objet de filtres (pour les cles de cache).
 */
export function hashFilters(filters: Record<string, any>): string {
  const sorted = Object.keys(filters)
    .sort()
    .reduce((acc, key) => {
      if (filters[key] !== undefined && filters[key] !== null) {
        acc[key] = filters[key];
      }
      return acc;
    }, {} as Record<string, any>);
  return Buffer.from(JSON.stringify(sorted)).toString('base64url');
}
