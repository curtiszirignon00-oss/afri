import { useAuth } from '../contexts/AuthContext';

/**
 * Phase 0 : email vérifié → accès total
 * Phase 1 : non vérifié, J0–J13 → bandeau discret uniquement
 * Phase 2 : non vérifié, J14–J29 → bandeau + restrictions write (buy/sell)
 * Phase 3 : non vérifié, J30+ → compte suspendu (bloqué au login par le backend)
 */
export type VerificationPhase = 0 | 1 | 2 | 3;

interface EmailVerificationPhase {
  phase: VerificationPhase;
  isVerified: boolean;
  daysSinceSignup: number;
  daysUntilRestriction: number; // jours avant J+14
  daysUntilSuspension: number;  // jours avant J+30
}

export function useEmailVerificationPhase(): EmailVerificationPhase {
  const { userProfile, isLoggedIn } = useAuth();

  if (!isLoggedIn || !userProfile) {
    return { phase: 0, isVerified: true, daysSinceSignup: 0, daysUntilRestriction: 14, daysUntilSuspension: 30 };
  }

  if (userProfile.email_verified_at) {
    return { phase: 0, isVerified: true, daysSinceSignup: 0, daysUntilRestriction: 999, daysUntilSuspension: 999 };
  }

  const createdAt = userProfile.created_at ? new Date(userProfile.created_at) : new Date();
  const daysSinceSignup = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilRestriction = Math.max(0, 14 - daysSinceSignup);
  const daysUntilSuspension = Math.max(0, 30 - daysSinceSignup);

  let phase: VerificationPhase = 1;
  if (daysSinceSignup >= 30) phase = 3;
  else if (daysSinceSignup >= 14) phase = 2;

  return { phase, isVerified: false, daysSinceSignup, daysUntilRestriction, daysUntilSuspension };
}
