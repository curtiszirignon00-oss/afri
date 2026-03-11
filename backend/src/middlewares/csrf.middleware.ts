import { doubleCsrf } from 'csrf-csrf';
import { Request } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error('SESSION_SECRET is required for CSRF protection');
    return secret;
  },
  // Identifiant fixe 'anonymous' pour tous les utilisateurs (authentifiés ou non).
  // La route /csrf-token ne passe pas par le middleware auth, donc req.user est
  // toujours undefined lors de la génération du token. Si on retournait req.user?.id,
  // le token serait généré pour 'anonymous' mais validé avec le user ID sur les routes
  // protégées → mismatch → 403. La sécurité CSRF repose sur l'impossibilité pour
  // l'attaquant de lire le cookie (same-origin), pas sur le binding par utilisateur.
  getSessionIdentifier: (_req: Request) => 'anonymous',
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
