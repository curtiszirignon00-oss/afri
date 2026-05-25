// src/data/nudges.ts
// Catalogue des nudges contextuels AfriBourse

export interface NudgeConfig {
  id: string;
  trigger: string;
  title: string;
  message: string;
  cta_label: string;
  cta_action: string;
  style: 'banner' | 'toast' | 'tooltip' | 'modal';
  delay_ms: number;
  icon: string;
  no_dedupe?: boolean;
}

export const NUDGES: NudgeConfig[] = [
  {
    id: 'watchlist_repeat_visit',
    trigger: 'STOCK_VISITED_3_TIMES',
    title: 'Tu reviens souvent ici',
    message: 'Tu reviens souvent sur cette action. Suis-la en 1 clic ⭐',
    cta_label: 'Ajouter à ma Watchlist',
    cta_action: 'OPEN_WATCHLIST',
    style: 'banner',
    delay_ms: 2000,
    icon: 'Star',
  },
  {
    id: 'alert_price_dip',
    trigger: 'STOCK_PRICE_DOWN_2PCT',
    title: 'Cours en baisse',
    message: 'Le cours a baissé aujourd\'hui. Veux-tu être prévenu si ça remonte ? 🔔',
    cta_label: 'Créer une alerte de prix',
    cta_action: 'OPEN_ALERT_MODAL',
    style: 'toast',
    delay_ms: 1000,
    icon: 'Bell',
  },
  {
    id: 'comparator_first_visit',
    trigger: 'STOCK_VISITED_COMPARATOR_NEVER_USED',
    title: 'Comparer les actions',
    message: 'Savais-tu que tu peux comparer cette action avec d\'autres valeurs BRVM ? 📊',
    cta_label: 'Comparer maintenant',
    cta_action: 'OPEN_COMPARATOR',
    style: 'tooltip',
    delay_ms: 4000,
    icon: 'BarChart2',
  },
  {
    id: 'alert_quota_reminder',
    trigger: 'USER_HAS_ZERO_ALERTS_AFTER_3_SESSIONS',
    title: 'Aucune alerte active',
    message: 'Tu n\'as pas encore d\'alertes actives. Sois le premier prévenu quand un cours bouge !',
    cta_label: 'Créer ma 1ère alerte',
    cta_action: 'NAVIGATE:/watchlist',
    style: 'banner',
    delay_ms: 3000,
    icon: 'BellPlus',
  },
  {
    id: 'watchlist_empty_dashboard',
    trigger: 'DASHBOARD_WATCHLIST_EMPTY',
    title: 'Watchlist vide',
    message: 'Ta watchlist est vide. Ajoute des actions pour les suivre ici chaque jour.',
    cta_label: 'Découvrir les actions BRVM',
    cta_action: 'NAVIGATE:/markets',
    style: 'banner',
    delay_ms: 0,
    icon: 'Star',
  },
  {
    id: 'filter_screener_hint',
    trigger: 'MARKETS_VISITED_TWICE_NO_SCREENER',
    title: 'Filtre les meilleures actions',
    message: 'Le screener te permet de filtrer les meilleures actions BRVM en quelques secondes 🔍',
    cta_label: 'Essayer le screener',
    cta_action: 'OPEN_SCREENER',
    style: 'tooltip',
    delay_ms: 5000,
    icon: 'SlidersHorizontal',
  },
  {
    id: 'heatmap_first_time',
    trigger: 'MARKETS_FIRST_VISIT',
    title: 'Visualise le marché d\'un coup d\'œil',
    message: 'La heatmap te montre d\'un coup d\'œil quelles actions montent ou descendent 🟩🟥',
    cta_label: 'Voir la heatmap',
    cta_action: 'OPEN_HEATMAP',
    style: 'banner',
    delay_ms: 3000,
    icon: 'LayoutGrid',
  },
  {
    id: 'upgrade_limit_reached',
    trigger: 'FREEMIUM_LIMIT_REACHED',
    title: 'Limite atteinte',
    message: 'Tu as atteint la limite du plan gratuit (3 max). Passe à Investisseur+ pour en avoir 15.',
    cta_label: 'Voir les plans',
    cta_action: 'NAVIGATE:/subscriptions',
    style: 'modal',
    delay_ms: 0,
    icon: 'Lock',
    no_dedupe: true,
  },
];

export function getNudgeById(id: string): NudgeConfig | undefined {
  return NUDGES.find(n => n.id === id);
}
