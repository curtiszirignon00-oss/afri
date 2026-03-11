// Validation CSRF sans cookie — approche HMAC stateless.
// Le cookie double-submit posait des problèmes de transmission cross-origin
// (localhost:5173 → localhost:3001, SameSite, restrictions navigateur).
// Ici : token = HMAC(SESSION_SECRET, 'csrf-token'), renvoyé dans le body de
// GET /api/csrf-token, stocké côté client en mémoire, envoyé en header
// X-CSRF-Token sur toutes les mutations. Le serveur recompute et compare.
// Sécurité : CORS empêche les autres origines d'appeler /csrf-token OU de
// définir des headers custom X-CSRF-Token → protection CSRF maintenue.

import { createHmac } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';

const IGNORED_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function computeToken(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is required for CSRF protection');
  return createHmac('sha256', secret).update('csrf-token').digest('hex');
}

export function generateCsrfToken(_req: Request, _res: Response): string {
  return computeToken();
}

export function doubleCsrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (IGNORED_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  const token = req.headers['x-csrf-token'];
  if (typeof token !== 'string' || token.trim() === '' || token !== computeToken()) {
    return next(createHttpError(403, 'invalid csrf token', { code: 'EBADCSRFTOKEN' }));
  }

  next();
}
