// ── Promotion à durée limitée (packs cohorte) ────────────────────────────────
// Starter -50%, Parcours/Investisseur -30%. Fenêtre de 24h.
// Pour arrêter/prolonger la promo : changer PROMO_END_ISO (ou le mettre dans le passé).
// Lancée le 31 juillet 2026 — se termine le 1er août à 12h00 (UTC/Abidjan).
export const PROMO_END_ISO = '2026-08-01T12:00:00Z';

export const PROMO_RATES: Record<string, number> = {
  starter: 0.5,
  parcours: 0.3,
  investisseur: 0.3,
};

export function isPromoActive(now: number = Date.now()): boolean {
  return now < new Date(PROMO_END_ISO).getTime();
}

/** Taux de remise actif pour un pack (0 si promo terminée / pack inconnu). */
export function promoRate(tier: string, now: number = Date.now()): number {
  return isPromoActive(now) ? (PROMO_RATES[tier] ?? 0) : 0;
}

/** Applique la remise à un montant, arrondi aux 100 XOF (0 remise → montant inchangé). */
export function applyPromo(tier: string, amount: number, now: number = Date.now()): number {
  const r = promoRate(tier, now);
  return r ? Math.round((amount * (1 - r)) / 100) * 100 : amount;
}

// Cohorte OCTOBRE 2026 (démarrage 10 octobre). Offre -50% (pré-inscription) valable jusqu'au
// 25 septembre inclus → clôture le 26/09 à 00:00 UTC/Abidjan.
// Doit rester synchronisé avec afribourse/src/config/budgetPricing.ts (ONLINE_DEADLINE_ISO).
export const ONLINE_REG_DEADLINE_ISO = '2026-09-26T00:00:00Z';
export function isOnlineRegClosed(now: number = Date.now()): boolean {
  return now >= new Date(ONLINE_REG_DEADLINE_ISO).getTime();
}
