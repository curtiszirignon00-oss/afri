// Cohorte "budget" (page /webinaires-eco) — prix dédiés + places limitées.
// Doit rester synchronisé avec backend (PACK_TIER_BUDGET + BUDGET_SEAT_*).
export const PACK_TIER_BUDGET: Record<string, number> = {
  starter: 35000,
  parcours: 70000,
  investisseur: 100000,
};

export const BUDGET_SEAT_LIMIT = 20;

/** Prix comptant "normal" (pour l'affichage barré). */
export const PACK_TIER_FULL: Record<string, number> = {
  starter: 70000,
  parcours: 100000,
  investisseur: 150000,
};

export function budgetPrice(tier: string): number {
  return PACK_TIER_BUDGET[tier] ?? 0;
}

export function budgetDiscountPct(tier: string): number {
  const full = PACK_TIER_FULL[tier];
  const b = PACK_TIER_BUDGET[tier];
  if (!full || !b) return 0;
  return Math.round((1 - b / full) * 100);
}
