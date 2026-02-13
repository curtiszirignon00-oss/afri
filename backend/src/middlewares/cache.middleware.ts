import { Request, Response, NextFunction } from 'express';
import { cacheGet, cacheSet } from '../services/cache.service';

/**
 * Middleware Express pour cacher automatiquement les reponses JSON.
 * @param keyGenerator - Fonction pour generer la cle de cache depuis la requete
 * @param ttlSeconds - Duree de vie du cache en secondes
 */
export function cacheResponse(
  keyGenerator: (req: Request) => string,
  ttlSeconds: number
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = keyGenerator(req);

    const cached = await cacheGet<{ statusCode: number; body: any }>(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(cached.statusCode).json(cached.body);
    }

    // Intercepter res.json() pour cacher la reponse
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(cacheKey, { statusCode: res.statusCode, body }, ttlSeconds).catch(() => {});
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}
