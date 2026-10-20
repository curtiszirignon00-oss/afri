// Paiement en 3 fois des packs cohorte — affichage uniquement.
// Plein tarif + 5 000 XOF de frais d'échelonnement, proposé au choix de l'utilisateur
// à côté du paiement en 1 fois.
// Doit rester synchronisé avec backend/src/controllers/installment.controller.ts
// (PACK_TIER_INSTALLMENTS / INSTALLMENT_SURCHARGE).

export const INSTALLMENT_SURCHARGE = 5000;

export const PACK_INSTALLMENTS: Record<string, number[]> = {
  starter: [25000, 25000, 25000],      // 75 000  = 70 000 + 5 000
  parcours: [35000, 35000, 35000],     // 105 000 = 100 000 + 5 000
  investisseur: [55000, 50000, 50000], // 155 000 = 150 000 + 5 000
};

export function installmentSchedule(tier: string): number[] {
  return PACK_INSTALLMENTS[tier] ?? PACK_INSTALLMENTS.starter;
}

export function installmentTotal(tier: string): number {
  return installmentSchedule(tier).reduce((a, b) => a + b, 0);
}

/** Libellé court du 1er versement, pour les cartes de prix. */
export function installmentFirst(tier: string): number {
  return installmentSchedule(tier)[0];
}
