import crypto from 'crypto';

/**
 * Génère un token de confirmation unique et sécurisé
 * @returns Token aléatoire de 32 caractères hexadécimaux
 */
export function generateConfirmationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calcule la date d'expiration du token (24 heures par défaut)
 * @param hours Nombre d'heures avant expiration (défaut: 24)
 * @returns Date d'expiration
 */
export function getTokenExpirationDate(hours: number = 24): Date {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + hours);
  return expirationDate;
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
