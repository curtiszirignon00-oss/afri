// ── ÉTAGÈRE 2 · « J'accède aux analyses » ────────────────────────────────────
// Affichage uniquement : le prix réellement débité est recalculé côté serveur.
// Doit rester synchronisé avec backend/src/config/analysisPacks.ts

export type AnalysisPackId = 'essentiel' | 'elargi' | 'integral';

/** planId / webinarId de l'étagère (le pack choisi est passé dans `pack`). */
export const ANALYSIS_PACK_ID = 'pack-analyses-brvm';

export const ANALYSIS_SEAT_LIMIT = 20;

// TODO DATE À CONFIRMER — fin du tarif de lancement -50 % (compte à rebours).
export const ANALYSIS_DEADLINE_ISO = '2026-10-31T23:59:59Z';
export const ANALYSIS_DEADLINE_LABEL = '31 octobre';
// TODO DATES À CONFIRMER — sessions live de décorticage.
export const ANALYSIS_SESSION_DATES_LABEL = 'novembre 2026';

export function analysisDeadlineMs(): number { return new Date(ANALYSIS_DEADLINE_ISO).getTime(); }
export function analysisOfferOpen(now: number = Date.now()): boolean { return now < analysisDeadlineMs(); }
export function analysisRemainingMs(now: number = Date.now()): number { return Math.max(0, analysisDeadlineMs() - now); }

export interface AnalysisPack {
  id: AnalysisPackId;
  scope: string;
  name: string;
  tagline: string;
  price: number;
  full: number;
  perShare: string;
  badge: string | null;
  highlight: boolean;
  features: string[];
  cta: string;
}

export const ANALYSIS_PACKS: AnalysisPack[] = [
  {
    id: 'essentiel',
    scope: 'Cœur de cote · 10 valeurs',
    name: 'Essentiel',
    tagline: 'Les 10 valeurs les plus liquides et les plus détenues de la BRVM — celles que tout investisseur doit maîtriser.',
    price: 40000,
    full: 80000,
    perShare: "soit 4 000 XOF l'action",
    badge: null,
    highlight: false,
    features: [
      '10 actions entièrement analysées et valorisées',
      'Fiche société + fondamentaux sur 3–5 ans',
      'Prix cible règle du triangle (FCFA) par valeur',
      'Verdict sous / sur-évaluée + risque & liquidité',
      'Classement des 10 par potentiel',
      'Rapport PDF + tableau de synthèse',
      '1 session live de décorticage des valeurs',
      'Template de valorisation (règle du triangle) + atelier mise à jour',
    ],
    cta: 'Choisir Essentiel',
  },
  {
    id: 'elargi',
    scope: 'Marché investissable · 25 valeurs',
    name: 'Élargi',
    tagline: "Le cœur de cote plus 15 mid caps sectorielles — de quoi diversifier sur l'essentiel du marché réellement investissable.",
    price: 75000,
    full: 150000,
    perShare: "soit 3 000 XOF l'action",
    badge: '★ Meilleur rapport couverture / prix',
    highlight: true,
    features: [
      "Tout l'Essentiel, plus 15 valeurs",
      '25 actions analysées et valorisées',
      'Comparatif sectoriel (banques, agro, distribution…)',
      'Prix cible règle du triangle (FCFA) par valeur',
      'Tableau de bord sous / sur-évaluation du marché',
      'Rapport PDF + tableau de synthèse',
      '2 sessions live de décorticage (dont 1 spéciale banques)',
      'Template triangle + template bancaire + atelier mise à jour',
    ],
    cta: 'Choisir Élargi',
  },
  {
    id: 'integral',
    scope: 'Toute la cote · ~46 valeurs',
    name: 'Intégral',
    tagline: "L'ensemble des valeurs cotées à la BRVM, small caps et titres peu liquides compris. Vue complète du marché.",
    price: 130000,
    full: 260000,
    perShare: "soit ≈ 2 800 XOF l'action",
    badge: null,
    highlight: false,
    features: [
      "Tout l'Élargi, plus le reste de la cote",
      'Les ~46 valeurs analysées et valorisées',
      'Small caps & titres illiquides signalés',
      'Prix cible règle du triangle (FCFA) par valeur',
      'Tableau de bord complet de toute la cote',
      'Rapport PDF + tableau de synthèse',
      '3 sessions live de décorticage de la cote',
      'Templates tous profils + atelier : mettre à jour en autonomie',
    ],
    cta: 'Choisir Intégral',
  },
];

export const ANALYSIS_DELIVERABLES = [
  { title: 'Fiche & secteur', desc: 'Modèle économique, position concurrentielle, lecture du secteur.' },
  { title: 'Fondamentaux 3–5 ans', desc: 'BPA (résultat net part du groupe), PER, ROE, rendement — chiffres tracés, jamais tombés du ciel.' },
  { title: 'Valorisation — règle du triangle', desc: 'PER médian secteur → prix cible · ROE → PER justifié → prix cible · rendement en test de risque.' },
  { title: 'Verdict', desc: 'Sous ou sur-évaluée, fourchette de prix cible en FCFA, niveau de risque et de liquidité.' },
];

export function getAnalysisPack(id: string | null): AnalysisPack {
  return ANALYSIS_PACKS.find((p) => p.id === id) ?? ANALYSIS_PACKS[0];
}

/** Prix affiché : lancement tant que l'offre court, plein tarif ensuite (comme le serveur). */
export function analysisDisplayPrice(p: AnalysisPack, now: number = Date.now()): number {
  return analysisOfferOpen(now) ? p.price : p.full;
}
