// Page /webinaires-eco — mêmes prix que /webinaires (plein tarif), avec places limitées.
// Le tarif -50 % en pré-inscription et la date de clôture des inscriptions en ligne ont
// été retirés le 20 octobre 2026 : la réservation et le paiement sont ouverts en permanence.

/** Prix comptant par pack (plein tarif). */
export const PACK_TIER_FULL: Record<string, number> = {
  starter: 70000,
  parcours: 100000,
  investisseur: 150000,
};

/** Places par pack sur la cohorte courante (une réservation occupe une place). */
export const BUDGET_SEAT_LIMIT = 20;

export function packPrice(tier: string): number {
  return PACK_TIER_FULL[tier] ?? 0;
}
