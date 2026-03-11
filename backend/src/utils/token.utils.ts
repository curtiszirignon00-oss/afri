import crypto from 'crypto';

/**
 * Génère un token de confirmation unique et sécurisé
 * @returns Token aléatoire de 64 caractères hexadécimaux (32 bytes)
 */
export function generateConfirmationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash un token pour stockage sécurisé en base de données.
 * Le token brut est envoyé à l'utilisateur, le hash est stocké en DB.
 * Même avec un accès direct à la DB, le hash seul est inutilisable.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Calcule la date d'expiration du token
 * @param minutes Nombre de minutes avant expiration (défaut: 15)
 * @returns Date d'expiration
 */
export function getTokenExpirationDate(minutes: number = 15): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Vérifie si un token a expiré
 * @param expirationDate Date d'expiration du token
 * @returns true si le token a expiré, false sinon
 */
export function isTokenExpired(expirationDate: Date | null | undefined): boolean {
  if (!expirationDate) return true;
  return new Date() > new Date(expirationDate);
}
