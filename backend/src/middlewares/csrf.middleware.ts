// Validation CSRF sans cookie — nonce aléatoire par appel, stocké côté serveur.
// Le cookie double-submit posait des problèmes de transmission cross-origin
// (localhost:5173 → localhost:3001, SameSite, restrictions navigateur).
// Ici : token = HMAC(SESSION_SECRET, nonce_aléatoire), renvoyé dans le body de
// GET /api/csrf-token, stocké côté client en mémoire, envoyé en header
// X-CSRF-Token sur toutes les mutations. Le serveur vérifie la présence du token
// dans son store interne (Map avec TTL).
// Sécurité : chaque token est unique et imprévisible. CORS empêche les autres
// origines d'appeler /csrf-token OU de définir des headers custom X-CSRF-Token.

import { randomBytes, createHmac } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';

const IGNORED_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// TTL : 6 heures (couvre une session utilisateur standard)
const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;

// Store en mémoire : token → timestamp d'expiration
const tokenStore = new Map<string, number>();

// Nettoyage périodique des tokens expirés (toutes les 30 min)
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of tokenStore) {
    if (now > expiry) tokenStore.delete(token);
  }
}, 30 * 60 * 1000).unref();

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is required for CSRF protection');
  return secret;
}

export function generateCsrfToken(_req: Request, _res: Response): string {
  const nonce = randomBytes(32).toString('hex');
  const token = createHmac('sha256', getSecret()).update(nonce).digest('hex');
  tokenStore.set(token, Date.now() + TOKEN_TTL_MS);
  return token;
}

export function doubleCsrfProtection(req: Request, _res: Response, next: NextFunction): void {
  if (IGNORED_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  const headerToken = req.headers['x-csrf-token'];
  if (typeof headerToken !== 'string' || headerToken.trim() === '') {
    return next(createHttpError(403, 'invalid csrf token', { code: 'EBADCSRFTOKEN' }));
  }

  const expiry = tokenStore.get(headerToken);
  if (!expiry || Date.now() > expiry) {
    return next(createHttpError(403, 'invalid csrf token', { code: 'EBADCSRFTOKEN' }));
  }

  next();
}
