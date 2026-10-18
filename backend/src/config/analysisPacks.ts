// ── ÉTAGÈRE 2 · « J'accède aux analyses » ────────────────────────────────────
// Packs d'analyses de valeurs BRVM (analyse + valorisation règle du triangle,
// sessions live de décorticage, templates). Offre limitée : places par pack +
// tarif de lancement -50 % avec date de fin.
//
// SOURCE DE VÉRITÉ des prix côté serveur — le montant envoyé par le frontend est ignoré.
// Doit rester synchronisé avec afribourse/src/config/analysisPacks.ts

export type AnalysisPackId = 'essentiel' | 'elargi' | 'integral';

export const ANALYSIS_PACK_IDS: AnalysisPackId[] = ['essentiel', 'elargi', 'integral'];

/** planId / webinarId unique de l'étagère (le pack choisi vit dans le champ `pack`). */
export const ANALYSIS_PACK_ID = 'pack-analyses-brvm';

/** Prix de lancement (-50 %) — appliqués tant que l'offre est ouverte. */
export const ANALYSIS_PACK_PRICES: Record<AnalysisPackId, number> = {
  essentiel: 40000,
  elargi: 75000,
  integral: 130000,
};

/** Prix plein (affichage barré, et prix appliqué une fois le lancement terminé). */
export const ANALYSIS_PACK_FULL: Record<AnalysisPackId, number> = {
  essentiel: 80000,
  elargi: 150000,
  integral: 260000,
};

/** Places par pack sur la série courante (toute réservation occupe une place). */
export const ANALYSIS_SEAT_LIMIT = 20;

/** Série courante : seules les réservations portant ce tag comptent.
 *  Pour repartir de zéro sur une nouvelle série : changer ce tag (l'historique est conservé). */
export const CURRENT_ANALYSIS_SERIES = 'analyses-s1';

// TODO DATE À CONFIRMER — fin du tarif de lancement -50 % (compte à rebours de la page).
// Doit rester synchronisé avec afribourse/src/config/analysisPacks.ts (ANALYSIS_DEADLINE_ISO).
export const ANALYSIS_DEADLINE_ISO = '2026-10-31T23:59:59Z';

// TODO DATE À CONFIRMER — libellé lisible de la date ci-dessus (emails + page).
export const ANALYSIS_DEADLINE_LABEL = '31 octobre 2026';

// TODO DATES À CONFIRMER — dates des sessions live de décorticage (emails + page).
export const ANALYSIS_SESSION_DATES_LABEL = 'novembre 2026 — dates communiquées par email et WhatsApp';

export function analysisDeadlineMs(): number {
  return new Date(ANALYSIS_DEADLINE_ISO).getTime();
}

/** L'offre de lancement est-elle terminée ? */
export function isAnalysisOfferClosed(now: number = Date.now()): boolean {
  return now >= analysisDeadlineMs();
}

export function isAnalysisPack(pack: unknown): pack is AnalysisPackId {
  return typeof pack === 'string' && (ANALYSIS_PACK_IDS as string[]).includes(pack);
}

/** Prix serveur d'un pack : tarif de lancement si l'offre court, sinon plein tarif. */
export function analysisPackPrice(pack: AnalysisPackId, now: number = Date.now()): number {
  return isAnalysisOfferClosed(now) ? ANALYSIS_PACK_FULL[pack] : ANALYSIS_PACK_PRICES[pack];
}

export const ANALYSIS_PACK_NAMES: Record<AnalysisPackId, string> = {
  essentiel: 'Pack Analyses Essentiel',
  elargi: 'Pack Analyses Élargi',
  integral: 'Pack Analyses Intégral',
};

/** Périmètre couvert par chaque pack (sert aux emails). */
export const ANALYSIS_PACK_SCOPE: Record<AnalysisPackId, string> = {
  essentiel: 'Cœur de cote · 10 valeurs',
  elargi: 'Marché investissable · 25 valeurs',
  integral: 'Toute la cote · ~46 valeurs',
};

/** Nombre de sessions live de décorticage incluses. */
export const ANALYSIS_PACK_SESSIONS: Record<AnalysisPackId, number> = {
  essentiel: 1,
  elargi: 2,
  integral: 3,
};
