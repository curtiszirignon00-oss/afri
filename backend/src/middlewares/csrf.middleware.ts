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
  // Lier le token à l'identité de l'utilisateur.
  // Pour les utilisateurs non authentifiés, on utilise 'anonymous' (fixe) plutôt que
  // req.sessionID car express-session avec saveUninitialized:false ne pose pas de cookie
  // de session pour les visiteurs non authentifiés → sessionID change à chaque requête.
  getSessionIdentifier: (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.id ?? 'anonymous';
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
