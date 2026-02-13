// ========================================
// TYPES UTILISATEUR & AUTHENTIFICATION
// ========================================

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  lastname: string | null;
  first_name?: string | null;
  last_name?: string | null;
  country: string | null;
  birth_date: string | null;
  has_invested: boolean | null;
  experience_level: string | null;
  main_goals: string[] | null;
  monthly_amount: string | null;
  profile_type: string | null;
  avatar_url?: string | null;
  is_public?: boolean;
  bio?: string | null;
  social_links?: string[];
}

// ========================================
// TYPES MARCHÉ (BRVM)
// ========================================

export interface Stock {
  id: string;
  symbol: string;
  company_name: string;
  sector: string | null;
  description: string | null;
  website_url: string | null;
  current_price: number;
  previous_close: number;
  daily_change_percent: number;
  volume: number;
  market_cap: number;
  logo_url?: string | null;
}

export interface StockFundamental {
  id: string;
  stockId: string;
  year: number;
  pe_ratio: number;
  dividend_yield: number;
  eps: number;
  revenue?: number;
  net_profit?: number;
  book_value?: number;
}

export interface MarketIndex {
  id: string;
  index_name: string;
  index_value: number;
  daily_change_percent: number;
  date: string;
}

export interface MarketIndexHistory {
  id: string;
  index_name: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  daily_change_percent: number;
}

// ========================================
// TYPES PORTFOLIO & TRANSACTIONS
// ========================================

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  initial_balance: number;
  cash_balance: number;
  wallet_type?: 'SANDBOX' | 'CONCOURS';
  positions: Position[];
  transactions?: Transaction[];
}

export interface Position {
  id: string;
  portfolioId: string;
  stock_ticker: string;
  quantity: number;
  average_buy_price: number;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  stock_ticker: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price_per_share: number;
  created_at: string | null;
}

export interface WatchlistItem {
  id: string;
  stock_ticker: string;
  userId: string;
  created_at?: string | null;
}

export interface PortfolioHistoryPoint {
  date: string;
  value: number;
}

// ========================================
// TYPES PRICE ALERTS
// ========================================

export interface PriceAlert {
  id: string;
  userId: string;
  stock_ticker: string;
  alert_type: 'ABOVE' | 'BELOW';
  target_price: number;
  is_active: boolean;
  is_notified: boolean;
  triggered_at: string | null;
  triggered_price: number | null;
  notify_email: boolean;
  notify_in_app: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceAlertNotification {
  id: string;
  priceAlertId: string;
  triggered_price: number;
  notification_method: 'EMAIL' | 'IN_APP' | 'BOTH';
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
}

export interface CreatePriceAlertPayload {
  stockTicker: string;
  alertType: 'ABOVE' | 'BELOW';
  targetPrice: number;
  notifyEmail?: boolean;
  notifyInApp?: boolean;
  subscriptionTier?: 'free' | 'premium' | 'pro';
}

export interface UpdatePriceAlertPayload {
  targetPrice?: number;
  alertType?: 'ABOVE' | 'BELOW';
  notifyEmail?: boolean;
  notifyInApp?: boolean;
}

// ========================================
// TYPES CONTENU (NEWS & LEARNING)
// ========================================

export interface NewsArticle {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  content: string | null;
  category: string | null;
  author: string | null;
  source: string | null;
  country: string | null;
  sector: string | null;
  image_url: string | null;
  is_featured: boolean;
  published_at: string | null;
  created_at: string | null;
}

export interface LearningModule {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  difficulty_level: string;
  content_type: string;
  duration_minutes: number | null;
  order_index: number | null;
  is_published: boolean;
  thumbnail_url: string | null;
  video_url: string | null;
  audio_url: string | null; // URL du podcast/audio
  has_quiz: boolean; // Indique si le module a un quiz
  created_at: string | null;
  updated_at: string | null;
}

export interface LearningProgress {
  id: string;
  is_completed: boolean;
  quiz_score: number | null;
  quiz_attempts: number; // Nombre de tentatives au quiz
  last_quiz_attempt_at: string | null; // Date de la dernière tentative
  time_spent_minutes: number | null;
  last_accessed_at: string | null;
  completed_at: string | null;
  userId: string;
  moduleId: string;
  module: {
    slug: string;
    title: string;
    order_index: number;
  };
}

// Types pour les Quiz
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // Liste des réponses possibles
  correct_answer: number; // Index de la bonne réponse (0-based)
  explanation?: string; // Explication de la réponse
}

export interface Quiz {
  id: string;
  moduleId: string;
  questions: QuizQuestion[];
  passing_score: number; // Score minimum pour réussir (en %)
  created_at: string | null;
}

// ========================================
// TYPES NAVIGATION & API
// ========================================

export type Page =
  | 'home'
  | 'markets'
  | 'stock-detail'
  | 'news'
  | 'learn'
  | 'glossary'
  | 'signup'
  | 'login'
  | 'dashboard'
  | 'profile'
  | 'transactions';

export interface Navigation {
  page: Page;
  data?: any;
}
// src/types/index.ts - EXTRAIT MODIFIÉ pour UserProfile

// ========================================
// TYPES UTILISATEUR & AUTHENTIFICATION
// ========================================

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  lastname: string | null;
  telephone?: string | null; // <-- AJOUT: Numéro de téléphone

  // Données personnelles
  first_name?: string | null;
  last_name?: string | null;
  country: string | null;
  birth_date: string | null;

  // Profil investisseur
  has_invested: boolean | null;
  experience_level: string | null;
  main_goals: string[] | null;
  monthly_amount: string | null;
  profile_type: string | null;

  // <-- AJOUT: Préférences d'apprentissage
  topic_interests?: string[] | null;  // Nouveaux sujets d'intérêt

  // <-- AJOUT: Feedback & Amélioration
  discovery_channel?: string | null;  // Comment découvert AfriBourse
  key_feature?: string | null;        // Fonctionnalité préférée

  // Personnalisation
  avatar_url?: string | null;
  is_public?: boolean;
  bio?: string | null;
  social_links?: string[];
}

// <-- AJOUT: Options pour les nouvelles questions (à utiliser dans les formulaires)
export const TOPIC_INTERESTS = [
  'Analyse Fondamentale (PER, ROE)',
  'Analyse Technique (Graphiques)',
  'Stratégies de Dividendes',
  'Obligations',
  'Actualités Économiques',
  'Fiscalité des investissements'
] as const;

export const DISCOVERY_CHANNELS = [
  'Recommandation',
  'Réseaux sociaux (LinkedIn, FB...)',
  'Recherche Google',
  'Publicité',
  'Média en ligne'
] as const;

export const KEY_FEATURES = [
  'La qualité des formations',
  'La précision du simulateur',
  'Les données de marché en temps réel',
  'Les analyses d\'experts'
] as const;

// Types stricts basés sur les constantes
export type TopicInterest = typeof TOPIC_INTERESTS[number];
export type DiscoveryChannel = typeof DISCOVERY_CHANNELS[number];
export type KeyFeature = typeof KEY_FEATURES[number];

// ========================================
// TYPES STOCK DETAILS (Améliorations)
// ========================================

export type Signal = 'Achat' | 'Vente' | 'Neutre' | 'Achat Fort' | 'Vente Forte';

export interface ChartDataPoint {
  date: string;
  price: number;
}

export interface TechnicalIndicator {
  name: string;
  value: string;
  signal: Signal;
}

export interface FinancialYear {
  year: string;
  ca: number;
  caGrowth: number | null;
  rn: number;
  rnGrowth: number | null;
  bnpa: number;
  per: number;
  div: string;
}

export interface Shareholder {
  name: string;
  value: number;
  color: string;
}

export interface StockNewsItem {
  id: number;
  title: string;
  source: string;
  date: string;
  tag: string;
  summary: string;
}

// ========================================
// TYPES GAMIFICATION
// ========================================

// --- XP & Niveaux ---
export interface XPStats {
  userId?: string;
  total_xp: number;
  level: number;
  current_level_xp: number;
  xp_for_next_level: number;
  xp_needed: number;
  progress_percent: number;
  title: string;
  title_emoji: string;
}

export interface XPHistoryEntry {
  id: string;
  amount: number;
  reason: string;
  description?: string;
  created_at: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  emoji: string;
  min_xp: number;
  max_xp: number;
  color: string;
}

// --- Streaks ---
export interface StreakData {
  current_streak: number;
  longest_streak: number;
  streak_freezes: number;
  last_activity_date: string | null;
  is_active_today?: boolean;
  streak_at_risk?: boolean;
}

// --- Achievements/Badges ---
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'formation' | 'trading' | 'social' | 'engagement' | 'special';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  xp_reward: number;
  criteria: any;
  required_level?: number | null;
  is_hidden: boolean;
  is_secret?: boolean;
  created_at?: string;
}

export interface UserAchievement {
  id: string;
  achievement: Achievement;
  unlocked_at: string;
  is_displayed: boolean;
}

// --- Weekly Challenges ---
export type GamificationChallengeType = 'module' | 'quiz' | 'trade' | 'social' | 'streak';

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: GamificationChallengeType;
  target: number;
  xp_reward: number;
  badge_code?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface ChallengeProgress {
  id: string;
  challengeId: string;
  challenge: WeeklyChallenge;
  current: number;
  completed: boolean;
  completed_at?: string;
  claimed: boolean;
  claimed_at?: string;
}

// --- Gamification Leaderboard ---
export interface GamificationLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  title: string;
  title_emoji: string;
  country?: string;
  badges_count?: number;
}

export interface GamificationLeaderboardResponse {
  type: 'global' | 'country' | 'friends' | 'roi' | 'streak';
  entries: GamificationLeaderboardEntry[];
  user_rank?: number;
  user_entry?: GamificationLeaderboardEntry;
  total_participants: number;
  percentile?: number;
  updated_at: string;
}

// --- Rewards ---
export type RewardType = 'virtual_cash' | 'freeze' | 'consultation' | 'cosmetic' | 'feature' | 'masterclass';

export interface Reward {
  id: string;
  title: string;
  description: string;
  reward_type: RewardType;
  xp_required: number;
  reward_data: any;
  icon: string;
  is_active: boolean;
  tier: number;
  unlocked?: boolean;
  xp_needed?: number;
  created_at?: string;
}

export interface UserReward {
  id: string;
  reward: Reward;
  claimed_at: string;
  applied: boolean;
}

// --- Gamification Summary ---
export interface GamificationSummary {
  xp: XPStats;
  streak: StreakData;
  achievements: {
    total_unlocked: number;
    recent: any[];
  };
  rewards: {
    total_unlocked: number;
    unclaimed: number;
  };
}

// --- XP Gain Response (from API) ---
export interface XPGainResponse {
  gamification: {
    xpGained: number;
    bonusXP?: { reason: string; amount: number } | null;
    newAchievements: string[];
  };
}

// Rarity colors
export const RARITY_COLORS: Record<AchievementRarity, { bg: string; text: string; border: string }> = {
  common: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  rare: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' },
  epic: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-400' },
  legendary: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-400' }
};

// Level titles
export const LEVEL_TITLES: LevelInfo[] = [
  { level: 1, title: 'Débutant', emoji: '🌱', min_xp: 0, max_xp: 100, color: 'text-gray-500' },
  { level: 5, title: 'Apprenti', emoji: '📚', min_xp: 1500, max_xp: 3000, color: 'text-green-500' },
  { level: 10, title: 'Investisseur', emoji: '💼', min_xp: 5500, max_xp: 6600, color: 'text-blue-500' },
  { level: 20, title: 'Trader', emoji: '📊', min_xp: 21000, max_xp: 23100, color: 'text-indigo-500' },
  { level: 30, title: 'Expert', emoji: '🎯', min_xp: 46500, max_xp: 49600, color: 'text-purple-500' },
  { level: 40, title: 'Maître', emoji: '🏆', min_xp: 82000, max_xp: 86100, color: 'text-amber-500' },
  { level: 50, title: 'Légende', emoji: '⭐', min_xp: 127500, max_xp: 132600, color: 'text-orange-500' },
  { level: 65, title: 'Champion', emoji: '👑', min_xp: 214500, max_xp: 221100, color: 'text-red-500' },
  { level: 80, title: 'Titan', emoji: '💎', min_xp: 324000, max_xp: 332100, color: 'text-cyan-500' },
  { level: 100, title: 'Immortel', emoji: '🌟', min_xp: 505000, max_xp: 515100, color: 'text-yellow-500' }
];