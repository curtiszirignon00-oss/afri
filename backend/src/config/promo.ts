// ── Promotion packs cohorte — RETIRÉE ────────────────────────────────────────
// Décision du 20 octobre 2026 : plein tarif sur toutes les offres webinaires.
// Plus de promo flash, plus de tarif -50 % en pré-inscription, plus de date de
// clôture des inscriptions en ligne : la pré-inscription et le paiement
// (1 fois ou 3 fois) sont ouverts en permanence.
//
// Pour relancer une promo un jour : remettre des taux dans PROMO_RATES et une
// date future dans PROMO_END_ISO. Tout le reste du code suit automatiquement.
export const PROMO_END_ISO = '2026-10-20T00:00:00Z'; // dans le passé = aucune promo

export const PROMO_RATES: Record<string, number> = {
  starter: 0,
  parcours: 0,
  investisseur: 0,
};

export function isPromoActive(now: number = Date.now()): boolean {
  return now < new Date(PROMO_END_ISO).getTime();
}

/** Taux de remise actif pour un pack (0 = plein tarif). */
export function promoRate(tier: string, now: number = Date.now()): number {
  return isPromoActive(now) ? (PROMO_RATES[tier] ?? 0) : 0;
}

/** Applique la remise à un montant (identité tant qu'aucune promo n'est active). */
export function applyPromo(tier: string, amount: number, now: number = Date.now()): number {
  const r = promoRate(tier, now);
  return r ? Math.round((amount * (1 - r)) / 100) * 100 : amount;
}
