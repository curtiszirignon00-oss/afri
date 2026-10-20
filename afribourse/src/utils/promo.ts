// ── Promotion packs cohorte — RETIRÉE ────────────────────────────
// Décision du 20 octobre 2026 : plein tarif sur toutes les offres webinaires.
// Les packs sont à 70 000 / 100 000 / 150 000 XOF sur /webinaires et /webinaires-eco,
// payables en 1 fois ou en 3 fois (plein tarif + 5 000 de frais d'échelonnement).
// Doit rester synchronisé avec backend/src/config/promo.ts
//
// Pour relancer une promo : remettre des taux dans PROMO_RATES et une date future
// dans PROMO_END_ISO (ici et côté serveur). Le reste du code suit automatiquement.
export const PROMO_END_ISO = '2026-10-20T00:00:00Z'; // dans le passé = aucune promo

export const PROMO_RATES: Record<string, number> = {
  starter: 0,
  parcours: 0,
  investisseur: 0,
};

export function promoEndMs(): number {
  return new Date(PROMO_END_ISO).getTime();
}

export function isPromoActive(now: number = Date.now()): boolean {
  return now < promoEndMs();
}

/** Taux de remise actif pour un pack (0 = plein tarif). */
export function promoRate(tier: string, now: number = Date.now()): number {
  return isPromoActive(now) ? (PROMO_RATES[tier] ?? 0) : 0;
}

/** Pourcentage de remise entier pour affichage (0 tant qu'aucune promo n'est active). */
export function promoPercent(tier: string, now: number = Date.now()): number {
  return Math.round(promoRate(tier, now) * 100);
}

/** Applique la remise à un montant (identité tant qu'aucune promo n'est active). */
export function applyPromo(tier: string, amount: number, now: number = Date.now()): number {
  const r = promoRate(tier, now);
  return r ? Math.round((amount * (1 - r)) / 100) * 100 : amount;
}

/** Millisecondes restantes avant la fin de la promo (0 si terminée). */
export function promoRemainingMs(now: number = Date.now()): number {
  return Math.max(0, promoEndMs() - now);
}

/** Formatte un compte à rebours en "HHh MMm SSs" — utilisé aussi par l'étagère analyses. */
export function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}
