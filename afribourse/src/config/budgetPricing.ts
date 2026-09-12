// Cohorte "budget" (page /webinaires-eco) — prix dédiés + places limitées.
// Doit rester synchronisé avec backend (PACK_TIER_BUDGET + BUDGET_SEAT_*).
export const PACK_TIER_BUDGET: Record<string, number> = {
  starter: 35000,      // -50% (70 000)
  parcours: 50000,     // -50% (100 000)
  investisseur: 75000, // -50% (150 000)
};

// Cohorte septembre : 20 pré-inscriptions max par pack
export const BUDGET_SEAT_LIMIT = 20;

// Clôture des inscriptions EN LIGNE : ce soir à minuit (UTC/Abidjan).
// Doit rester synchronisé avec backend/src/config/promo.ts (ONLINE_REG_DEADLINE_ISO).
export const ONLINE_DEADLINE_ISO = '2026-09-13T00:00:00Z';
export function onlineDeadlineMs(): number { return new Date(ONLINE_DEADLINE_ISO).getTime(); }
export function onlineRegOpen(now: number = Date.now()): boolean { return now < onlineDeadlineMs(); }
export function onlineRemainingMs(now: number = Date.now()): number { return Math.max(0, onlineDeadlineMs() - now); }

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
