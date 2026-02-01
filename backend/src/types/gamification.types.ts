// backend/src/types/gamification.types.ts
// Types pour le système de gamification AfriBourse

// =====================================
// XP ET NIVEAUX
// =====================================

export interface XPRewardConfig {
  amount: number;
  reason: string;
  description?: string;
}

export interface XPGainResult {
  xp_added: number;
  old_xp: number;
  new_xp: number;
  old_level: number;
  new_level: number;
  leveled_up: boolean;
  rewards_unlocked?: UnlockedReward[];
  achievements_unlocked?: string[];
}

export interface UserXPStats {
  userId: string;
  level: number;
  total_xp: number;
  current_level_xp: number;
  xp_for_next_level: number;
  xp_needed: number;
  progress_percent: number;
  title: LevelTitle;
  title_emoji: string;
}

// =====================================
// TITRES ET NIVEAUX
// =====================================

export type LevelTitle = 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Expert' | 'Maître';

export interface LevelTitleConfig {
  min_level: number;
  max_level: number;
  title: LevelTitle;
  emoji: string;
}

export const LEVEL_TITLES: LevelTitleConfig[] = [
  { min_level: 1, max_level: 10, title: 'Débutant', emoji: '🌱' },
  { min_level: 11, max_level: 25, title: 'Intermédiaire', emoji: '📈' },
  { min_level: 26, max_level: 50, title: 'Avancé', emoji: '💎' },
  { min_level: 51, max_level: 75, title: 'Expert', emoji: '🏆' },
  { min_level: 76, max_level: 100, title: 'Maître', emoji: '👑' }
];

// =====================================
// CONSTANTES XP PAR ACTION
// =====================================

export const XP_REWARDS = {
  // Formation
  MODULE_COMPLETE: 200,
  QUIZ_PASS: 50,
  QUIZ_PERFECT_BONUS: 50,
  DAILY_3_MODULES_BONUS: 200,

  // Trading
  FIRST_TRADE: 200,
  TRANSACTION: 10,
  BADGE_50_TRADES: 500,
  BADGE_200_TRADES: 1500,
  BADGE_ROI_20: 800,
  BADGE_DIVERSIFICATION: 400,

  // Social
  PROFILE_COMPLETE: 250,
  FOLLOWER_MILESTONE: 200, // par palier de 50
  INVITE_FRIEND: 500,
  PROFILE_VISIT: 1,
  PROFILE_UPDATE: 5,

  // Engagement / Streaks
  STREAK_7: 200,
  STREAK_30: 800,
  STREAK_100: 3000,
  STREAK_365: 10000,
  EARLY_BIRD_BADGE: 150,
  NIGHT_OWL_BADGE: 150
} as const;

// =====================================
// ACTIONS STREAK
// =====================================

export const STREAK_ACTIONS = [
  'module_complete',
  'quiz_pass',
  'transaction',
  'article_read',
  'profile_visit',
  'profile_edit',
  'follow_user',
  'comment'
] as const;

export type StreakAction = typeof STREAK_ACTIONS[number];

export interface StreakStats {
  current_streak: number;
  longest_streak: number;
  last_activity_date: Date | null;
  streak_freezes: number;
  is_active_today: boolean;
}

// =====================================
// RÉCOMPENSES
// =====================================

export type RewardType =
  | 'virtual_cash'
  | 'feature'
  | 'real_stock'
  | 'consultation'
  | 'real_cash'
  | 'masterclass'
  | 'freeze'
  | 'badge'
  | 'cosmetic';

export interface UnlockedReward {
  rewardId: string;
  title: string;
  type: RewardType;
  xp_required: number;
}

// =====================================
// FEATURES DÉBLOQUÉES PAR NIVEAU
// =====================================

export interface LevelFeature {
  level: number;
  feature: string;
  description: string;
  value: number | boolean;
}

export const LEVEL_FEATURES: LevelFeature[] = [
  { level: 5, feature: 'bonus_cash', description: '+250,000 FCFA sur le portefeuille virtuel', value: 250000 },
  { level: 10, feature: 'extra_alerts', description: '+3 alertes prix supplémentaires', value: 3 },
  { level: 15, feature: 'extra_watchlist', description: '+3 actions dans la watchlist', value: 3 },
  { level: 20, feature: 'extra_comparator', description: '+1 action dans le comparateur', value: 1 },
  { level: 30, feature: 'create_community', description: 'Peut créer sa propre communauté', value: true },
  { level: 40, feature: 'verified_badge', description: 'Badge "Verified Investor" sur le profil', value: true },
  { level: 50, feature: 'premium_webinars', description: 'Accès aux webinaires premium', value: true },
  { level: 65, feature: 'second_simulator', description: '2ème simulateur de 1,000,000 FCFA', value: 1000000 },
  { level: 80, feature: 'bonus_simulator', description: '+10,000,000 FCFA sur le simulateur', value: 10000000 }
];

// =====================================
// BADGES / ACHIEVEMENTS
// =====================================

export type AchievementCategory = 'formation' | 'trading' | 'social' | 'engagement' | 'special';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementDefinition {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xp_reward: number;
  criteria: AchievementCriteria;
  is_hidden?: boolean;
}

export interface AchievementCriteria {
  type: string;
  target?: number;
  condition?: string;
}

// =====================================
// DÉFIS HEBDOMADAIRES
// =====================================

export type ChallengeType = 'module' | 'quiz' | 'trade' | 'social' | 'streak';

export interface WeeklyChallengeDefinition {
  code: string;
  name: string;
  description: string;
  type: ChallengeType;
  target: number;
  xp_reward: number;
  badge_code?: string;
}

export const WEEKLY_CHALLENGES: WeeklyChallengeDefinition[] = [
  // Formation
  { code: 'complete_3_modules', name: 'Lecteur Assidu', description: 'Compléter 3 modules', type: 'module', target: 3, xp_reward: 300 },
  { code: 'pass_5_quizzes', name: 'Champion Quiz', description: 'Réussir 5 quiz', type: 'quiz', target: 5, xp_reward: 200 },
  { code: 'perfect_2_quizzes', name: 'Perfectionniste', description: '2 quiz à 100%', type: 'quiz', target: 2, xp_reward: 150 },

  // Trading
  { code: 'make_10_trades', name: 'Trader de la Semaine', description: '10 transactions', type: 'trade', target: 10, xp_reward: 200 },
  { code: 'trade_5_stocks', name: 'Diversificateur', description: '5 actions différentes', type: 'trade', target: 5, xp_reward: 250 },
  { code: 'profitable_3_trades', name: 'Précision', description: '3 trades rentables', type: 'trade', target: 3, xp_reward: 300 },

  // Social
  { code: 'follow_5_users', name: 'Networker', description: 'Suivre 5 personnes', type: 'social', target: 5, xp_reward: 150 },
  { code: 'invite_2_friends', name: 'Parrain', description: 'Inviter 2 amis', type: 'social', target: 2, xp_reward: 400 },
  { code: 'make_10_interactions', name: 'Actif', description: '10 interactions', type: 'social', target: 10, xp_reward: 100 },

  // Engagement
  { code: 'perfect_week', name: 'Série Parfaite', description: '7/7 jours actifs', type: 'streak', target: 7, xp_reward: 500, badge_code: 'perfect_week' }
];

// =====================================
// CLASSEMENTS
// =====================================

export type LeaderboardType = 'global' | 'country' | 'friends' | 'roi';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar_url?: string;
  level: number;
  total_xp: number;
  country?: string;
  value?: number; // Pour ROI
}

export interface LeaderboardResponse {
  type: LeaderboardType;
  entries: LeaderboardEntry[];
  user_rank?: number;
  user_percentile?: number;
  total_participants: number;
  updated_at: Date;
}

// =====================================
// NOTIFICATIONS GAMIFICATION
// =====================================

export type GamificationNotificationType =
  | 'xp_gained'
  | 'level_up'
  | 'achievement_unlocked'
  | 'reward_unlocked'
  | 'streak_milestone'
  | 'streak_broken'
  | 'streak_protected'
  | 'challenge_completed'
  | 'rank_changed';

export interface GamificationNotification {
  type: GamificationNotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}
