import { doubleCsrf } from 'csrf-csrf';
import { Request } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

const isProduction = process.env.NODE_ENV === 'production';

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error('SESSION_SECRET is required for CSRF protection');
    return secret;
  },
  // Lier le token à l'identité de l'utilisateur (user ID si connecté, sinon session ID)
  getSessionIdentifier: (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id ?? req.sessionID ?? 'anonymous';
  },
  cookieName: isProduction ? '__Host-x-csrf-token' : 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/',
  },
  // Lire le token depuis l'en-tête X-CSRF-Token envoyé par le frontend
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] as string | undefined,
  // Ne pas vérifier les méthodes idempotentes
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  size: 64,
});

export { doubleCsrfProtection, generateCsrfToken };
