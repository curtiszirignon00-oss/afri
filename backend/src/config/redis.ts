import { Redis } from '@upstash/redis';
import config from './environnement';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!config.redis.enabled) {
    return null;
  }

  if (!redisClient) {
    if (!config.redis.url || !config.redis.token) {
      console.warn('[Redis] CACHE_ENABLED=true mais REDIS_URL ou REDIS_TOKEN non defini. Cache desactive.');
      return null;
    }

    redisClient = new Redis({
      url: config.redis.url,
      token: config.redis.token,
    });

    console.info('[Redis] Client initialise (Upstash REST)');
  }

  return redisClient;
}

export default getRedisClient;
