// ── Académie : modules gratuits vs Formation Complète (achat unique) ─────────
// SOURCE UNIQUE côté front : /learn (cartes, paywall), /formation (page de vente),
// accueil et menus doivent tous dériver d'ici pour ne plus se contredire.
// Le prix réellement débité est fixé côté serveur (pawapay.controller : 'premium-modules').

/** Premier order_index payant. Modules 0 à 8 gratuits, 9 à 19 dans la Formation Complète. */
export const FORMATION_PREMIUM_FROM_INDEX = 9;

export const FORMATION_PRICE = 15000;
export const FORMATION_PRICE_LABEL = '15 000 FCFA';

/** Nombre total de modules publiés (mis à jour à la main si on en ajoute). */
export const FORMATION_TOTAL_MODULES = 20;
export const FORMATION_FREE_COUNT = FORMATION_PREMIUM_FROM_INDEX;                          // 9
export const FORMATION_PREMIUM_COUNT = FORMATION_TOTAL_MODULES - FORMATION_FREE_COUNT;      // 11

/** Libellés « M0–M8 » / « M9–M19 ». */
export const FORMATION_FREE_RANGE = `M0–M${FORMATION_PREMIUM_FROM_INDEX - 1}`;
export const FORMATION_PREMIUM_RANGE = `M${FORMATION_PREMIUM_FROM_INDEX}–M${FORMATION_TOTAL_MODULES - 1}`;

export function isFormationPremiumModule(orderIndex: number | null | undefined): boolean {
  return (orderIndex ?? 0) >= FORMATION_PREMIUM_FROM_INDEX;
}

/** Abonnements / achats qui débloquent les modules payants. */
export const FORMATION_UNLOCK_TIERS = ['premium', 'max', 'pro', 'formation'];
