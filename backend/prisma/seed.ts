// prisma/seed.ts
// Script de seed pour peupler la base de données avec les achievements et rewards
// Usage: npx tsx prisma/seed.ts

/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ================================
// ACHIEVEMENTS DATA
// ================================

const achievementsData = [
  // ===== FORMATION =====
  {
    code: 'first_step',
    name: '📖 Premier Pas',
    description: 'Complète ton premier module d\'apprentissage',
    icon: '📖',
    category: 'formation',
    rarity: 'common',
    xp_reward: 100,
    criteria: { module_completed: 1 },
  },
  {
    code: 'diligent_student',
    name: '🎓 Étudiant Assidu',
    description: 'Complète 5 modules d\'apprentissage',
    icon: '🎓',
    category: 'formation',
    rarity: 'common',
    xp_reward: 300,
    criteria: { module_completed: 5 },
  },
  {
    code: 'beginner_investor',
    name: '🌱 Investisseur Débutant',
    description: 'Complète tous les modules débutants',
    icon: '🌱',
    category: 'formation',
    rarity: 'rare',
    xp_reward: 500,
    criteria: { difficulty_level: 'debutant', all_modules: true },
  },
  {
    code: 'intermediate_investor',
    name: '📈 Investisseur Intermédiaire',
    description: 'Complète tous les modules intermédiaires',
    icon: '📈',
    category: 'formation',
    rarity: 'rare',
    xp_reward: 800,
    criteria: { difficulty_level: 'intermediaire', all_modules: true },
  },
  {
    code: 'advanced_investor',
    name: '💎 Investisseur Avancé',
    description: 'Complète tous les modules avancés',
    icon: '💎',
    category: 'formation',
    rarity: 'epic',
    xp_reward: 1200,
    criteria: { difficulty_level: 'avance', all_modules: true },
  },
  {
    code: 'brvm_expert',
    name: '🏆 Expert BRVM',
    description: 'Complète TOUS les modules de formation',
    icon: '🏆',
    category: 'formation',
    rarity: 'legendary',
    xp_reward: 2000,
    criteria: { all_modules_platform: true },
  },
  {
    code: 'quiz_master',
    name: '🧠 Quiz Master',
    description: 'Réussis 5 quiz avec un score de 100%',
    icon: '🧠',
    category: 'formation',
    rarity: 'rare',
    xp_reward: 300,
    criteria: { quiz_perfect: 5 },
  },
  {
    code: 'quiz_goat',
    name: '👑 Quiz GOAT',
    description: 'Réussis 10 quiz avec un score de 100%',
    icon: '👑',
    category: 'formation',
    rarity: 'epic',
    xp_reward: 700,
    criteria: { quiz_perfect: 10 },
  },
  {
    code: 'lightning_learner',
    name: '⚡ Apprenant Éclair',
    description: 'Complète 3 modules en une seule journée',
    icon: '⚡',
    category: 'formation',
    rarity: 'rare',
    xp_reward: 200,
    criteria: { modules_per_day: 3 },
  },

  // ===== TRADING =====
  {
    code: 'first_trade',
    name: '🎯 Premier Trade',
    description: 'Effectue ta première transaction',
    icon: '🎯',
    category: 'trading',
    rarity: 'common',
    xp_reward: 200,
    criteria: { transactions: 1 },
  },
  {
    code: 'active_trader',
    name: '📈 Trader Actif',
    description: 'Effectue 50 transactions',
    icon: '📈',
    category: 'trading',
    rarity: 'rare',
    xp_reward: 500,
    criteria: { transactions: 50 },
  },
  {
    code: 'pro_investor',
    name: '💎 Investisseur Pro',
    description: 'Effectue 200 transactions',
    icon: '💎',
    category: 'trading',
    rarity: 'epic',
    xp_reward: 1500,
    criteria: { transactions: 200 },
  },
  {
    code: 'performance',
    name: '🚀 Performance',
    description: 'Atteins un ROI supérieur à 20%',
    icon: '🚀',
    category: 'trading',
    rarity: 'epic',
    xp_reward: 800,
    criteria: { roi_percent: 20 },
  },
  {
    code: 'diversification',
    name: '🏅 Diversification',
    description: 'Possède 10 positions différentes ou plus',
    icon: '🏅',
    category: 'trading',
    rarity: 'rare',
    xp_reward: 400,
    criteria: { unique_positions: 10 },
  },
  {
    code: 'long_term',
    name: '🌳 Investisseur Long Terme',
    description: 'Conserve une position pendant 90 jours',
    icon: '🌳',
    category: 'trading',
    rarity: 'rare',
    xp_reward: 600,
    criteria: { position_held_days: 90 },
  },
  {
    code: 'dividend_hunter',
    name: '💰 Chasseur de Dividendes',
    description: 'Reçois des dividendes de 5 entreprises différentes',
    icon: '💰',
    category: 'trading',
    rarity: 'epic',
    xp_reward: 1000,
    criteria: { dividend_stocks: 5 },
  },

  // ===== SOCIAL =====
  {
    code: 'new_member',
    name: '👋 Nouveau Membre',
    description: 'Crée et complète ton profil',
    icon: '👋',
    category: 'social',
    rarity: 'common',
    xp_reward: 50,
    criteria: { profile_completed: 100 },
  },
  {
    code: 'connected',
    name: '🤝 Connecté',
    description: 'Atteins 10 abonnés',
    icon: '🤝',
    category: 'social',
    rarity: 'common',
    xp_reward: 100,
    criteria: { followers: 10 },
  },
  {
    code: 'influencer',
    name: '🌟 Influenceur',
    description: 'Atteins 50 abonnés',
    icon: '🌟',
    category: 'social',
    rarity: 'rare',
    xp_reward: 200,
    criteria: { followers: 50 },
  },
  {
    code: 'rising_star',
    name: '⭐ Rising Star',
    description: 'Atteins 100 abonnés',
    icon: '⭐',
    category: 'social',
    rarity: 'rare',
    xp_reward: 400,
    criteria: { followers: 100 },
  },
  {
    code: 'super_star',
    name: '💫 Super Star',
    description: 'Atteins 150 abonnés',
    icon: '💫',
    category: 'social',
    rarity: 'epic',
    xp_reward: 600,
    criteria: { followers: 150 },
  },
  {
    code: 'celebrity',
    name: '👑 Célébrité',
    description: 'Atteins 200 abonnés',
    icon: '👑',
    category: 'social',
    rarity: 'epic',
    xp_reward: 800,
    criteria: { followers: 200 },
  },
  {
    code: 'icon',
    name: '🔥 Icône',
    description: 'Atteins 500 abonnés',
    icon: '🔥',
    category: 'social',
    rarity: 'legendary',
    xp_reward: 2000,
    criteria: { followers: 500 },
  },
  {
    code: 'sponsor',
    name: '🎁 Parrain',
    description: 'Invite 5 amis qui s\'inscrivent',
    icon: '🎁',
    category: 'social',
    rarity: 'epic',
    xp_reward: 1500,
    criteria: { referrals: 5 },
  },
  {
    code: 'super_sponsor',
    name: '🏆 Super Parrain',
    description: 'Invite 20 amis qui s\'inscrivent',
    icon: '🏆',
    category: 'social',
    rarity: 'legendary',
    xp_reward: 5000,
    criteria: { referrals: 20 },
  },

  // ===== ENGAGEMENT (STREAK) =====
  {
    code: 'streak_7',
    name: '🔥 Série 7 jours',
    description: 'Connexion quotidienne pendant 7 jours',
    icon: '🔥',
    category: 'engagement',
    rarity: 'common',
    xp_reward: 200,
    criteria: { streak_days: 7 },
  },
  {
    code: 'streak_30',
    name: '⚡ Série 30 jours',
    description: 'Connexion quotidienne pendant 30 jours',
    icon: '⚡',
    category: 'engagement',
    rarity: 'rare',
    xp_reward: 800,
    criteria: { streak_days: 30 },
  },
  {
    code: 'streak_100',
    name: '💪 Série 100 jours',
    description: 'Connexion quotidienne pendant 100 jours',
    icon: '💪',
    category: 'engagement',
    rarity: 'legendary',
    xp_reward: 3000,
    criteria: { streak_days: 100 },
  },
  {
    code: 'early_bird',
    name: '🌅 Lève-tôt',
    description: 'Connecte-toi avant 8h du matin (5 fois)',
    icon: '🌅',
    category: 'engagement',
    rarity: 'common',
    xp_reward: 150,
    criteria: { early_login: 5 },
  },
  {
    code: 'night_owl',
    name: '🌙 Noctambule',
    description: 'Connecte-toi après 22h (5 fois)',
    icon: '🌙',
    category: 'engagement',
    rarity: 'common',
    xp_reward: 150,
    criteria: { late_login: 5 },
  },
  {
    code: 'weekend_warrior',
    name: '⚔️ Guerrier du Weekend',
    description: 'Sois actif tous les weekends pendant un mois',
    icon: '⚔️',
    category: 'engagement',
    rarity: 'rare',
    xp_reward: 400,
    criteria: { weekend_activity: 4 },
  },

  // ===== SPÉCIAUX =====
  {
    code: 'anniversary',
    name: '🎂 Anniversaire',
    description: 'Un an d\'inscription sur AfriBourse !',
    icon: '🎂',
    category: 'special',
    rarity: 'epic',
    xp_reward: 1000,
    criteria: { days_since_registration: 365 },
  },
  {
    code: 'top_10_percent',
    name: '🥇 Top 10%',
    description: 'Entre dans le top 10% des investisseurs',
    icon: '🥇',
    category: 'special',
    rarity: 'epic',
    xp_reward: 500,
    criteria: { rank_percentile: 10 },
  },
  {
    code: 'monthly_champion',
    name: '🏆 Champion Mensuel',
    description: 'Meilleur ROI du mois',
    icon: '🏆',
    category: 'special',
    rarity: 'legendary',
    xp_reward: 1500,
    criteria: { monthly_top_roi: true },
  },
  {
    code: 'ambassador',
    name: '🌍 Ambassadeur',
    description: 'Aide 20+ amis à devenir actifs',
    icon: '🌍',
    category: 'special',
    rarity: 'legendary',
    xp_reward: 1200,
    criteria: { active_referrals: 20 },
  },
  {
    code: 'pioneer',
    name: '🌟 Pionnier',
    description: 'Parmi les 100 premiers inscrits',
    icon: '🌟',
    category: 'special',
    rarity: 'legendary',
    xp_reward: 2000,
    criteria: { user_rank_by_registration: 100 },
    is_hidden: true,
  },
  {
    code: 'community_helper',
    name: '🤲 Entraide Communautaire',
    description: 'Aide 50+ utilisateurs via le forum',
    icon: '🤲',
    category: 'special',
    rarity: 'epic',
    xp_reward: 1000,
    criteria: { forum_helpful_responses: 50 },
  },
];

// ================================
// REWARDS DATA
// ================================

const rewardsData = [
  // TIER 1 - Débutant (0-1,000 XP)
  {
    xp_required: 500,
    reward_type: 'virtual_cash',
    reward_data: { amount: 50000, currency: 'FCFA' },
    title: '💰 Bonus Simulateur',
    description: '+50,000 FCFA ajoutés à ton portfolio virtuel',
    icon: '💰',
    tier: 1,
  },
  {
    xp_required: 1000,
    reward_type: 'virtual_cash',
    reward_data: { amount: 100000, currency: 'FCFA' },
    title: '💵 Boost Portfolio',
    description: '+100,000 FCFA ajoutés à ton portfolio virtuel',
    icon: '💵',
    tier: 1,
  },

  // TIER 2 - Intermédiaire (1,000-5,000 XP)
  {
    xp_required: 1500,
    reward_type: 'feature',
    reward_data: { featureCode: 'advanced_charts', permanent: true },
    title: '📊 Graphiques Avancés',
    description: 'Débloque les indicateurs techniques (RSI, MACD, Bollinger)',
    icon: '📊',
    tier: 2,
  },
  {
    xp_required: 2000,
    reward_type: 'virtual_cash',
    reward_data: { amount: 200000, currency: 'FCFA' },
    title: '💸 Grand Bonus',
    description: '+200,000 FCFA ajoutés à ton portfolio virtuel',
    icon: '💸',
    tier: 2,
  },
  {
    xp_required: 2500,
    reward_type: 'freeze',
    reward_data: { quantity: 3 },
    title: '🧊 Protection Série',
    description: '+3 Streak Freezes pour protéger ta série',
    icon: '🧊',
    tier: 2,
  },
  {
    xp_required: 3000,
    reward_type: 'feature',
    reward_data: { featureCode: 'ai_insights', permanent: true },
    title: '🤖 Conseils IA',
    description: 'Conseils d\'investissement personnalisés par intelligence artificielle',
    icon: '🤖',
    tier: 2,
  },
  {
    xp_required: 4000,
    reward_type: 'feature',
    reward_data: { featureCode: 'price_alerts', permanent: true },
    title: '🔔 Alertes Prix',
    description: 'Alertes personnalisées par SMS/Email sur les mouvements de prix',
    icon: '🔔',
    tier: 2,
  },
  {
    xp_required: 5000,
    reward_type: 'consultation',
    reward_data: { duration: 30, expertType: 'trader', format: 'video' },
    title: '🎓 Consultation Expert',
    description: '30 minutes de conseil avec un trader professionnel BRVM',
    icon: '🎓',
    tier: 2,
  },

  // TIER 3 - Avancé (5,000-15,000 XP)
  {
    xp_required: 6000,
    reward_type: 'virtual_cash',
    reward_data: { amount: 500000, currency: 'FCFA' },
    title: '💎 Méga Bonus',
    description: '+500,000 FCFA ajoutés à ton portfolio virtuel',
    icon: '💎',
    tier: 3,
  },
  {
    xp_required: 7500,
    reward_type: 'real_stock',
    reward_data: { ticker: 'SNTS', shares: 1, value: 5000 },
    title: '🎁 Action Réelle SNTS',
    description: '1 action SONATEL SÉNÉGAL offerte (~5,000 FCFA)',
    icon: '🎁',
    tier: 3,
  },
  {
    xp_required: 8500,
    reward_type: 'feature',
    reward_data: { featureCode: 'premium_alerts', permanent: true },
    title: '⚡ Alertes Premium',
    description: 'Alertes en temps réel sur tous les mouvements du marché',
    icon: '⚡',
    tier: 3,
  },
  {
    xp_required: 10000,
    reward_type: 'consultation',
    reward_data: { duration: 60, expertType: 'analyst', format: 'video' },
    title: '📈 Session Analyste',
    description: '1 heure de conseil personnalisé avec un analyste financier',
    icon: '📈',
    tier: 3,
  },
  {
    xp_required: 12000,
    reward_type: 'feature',
    reward_data: { featureCode: 'portfolio_analysis', permanent: true },
    title: '🔍 Analyse Portfolio',
    description: 'Analyse avancée de diversification et recommandations',
    icon: '🔍',
    tier: 3,
  },
  {
    xp_required: 15000,
    reward_type: 'real_stock',
    reward_data: { ticker: 'SONATEL', shares: 1, value: 15000 },
    title: '🌟 Action Réelle SONATEL',
    description: '1 action SONATEL offerte (~15,000 FCFA)',
    icon: '🌟',
    tier: 3,
  },

  // TIER 4 - Expert (15,000-50,000 XP)
  {
    xp_required: 17500,
    reward_type: 'virtual_cash',
    reward_data: { amount: 1000000, currency: 'FCFA' },
    title: '👑 Million Virtuel',
    description: '+1,000,000 FCFA ajoutés à ton portfolio virtuel',
    icon: '👑',
    tier: 4,
  },
  {
    xp_required: 20000,
    reward_type: 'masterclass',
    reward_data: { title: 'Stratégies Avancées BRVM', duration: 120 },
    title: '🎥 Masterclass Exclusive',
    description: 'Accès à une masterclass exclusive sur les stratégies avancées',
    icon: '🎥',
    tier: 4,
  },
  {
    xp_required: 22500,
    reward_type: 'real_cash',
    reward_data: { amount: 10000, currency: 'FCFA' },
    title: '💵 Crédit Trading Réel',
    description: '10,000 FCFA de crédit pour trading réel sur la BRVM',
    icon: '💵',
    tier: 4,
  },
  {
    xp_required: 25000,
    reward_type: 'feature',
    reward_data: { featureCode: 'priority_support', permanent: true },
    title: '⭐ Support Prioritaire',
    description: 'Support client prioritaire avec réponse sous 1h',
    icon: '⭐',
    tier: 4,
  },
  {
    xp_required: 30000,
    reward_type: 'real_stock',
    reward_data: { ticker: 'CHOICE', shares: 2, value: 40000 },
    title: '🎯 2 Actions au Choix',
    description: '2 actions réelles de ton choix (jusqu\'à 20,000 FCFA chacune)',
    icon: '🎯',
    tier: 4,
  },
  {
    xp_required: 35000,
    reward_type: 'real_cash',
    reward_data: { amount: 25000, currency: 'FCFA' },
    title: '💸 Bonus Trading',
    description: '25,000 FCFA de crédit trading réel',
    icon: '💸',
    tier: 4,
  },
  {
    xp_required: 40000,
    reward_type: 'consultation',
    reward_data: { duration: 180, expertType: 'portfolio_manager', format: 'video_or_in_person' },
    title: '🏆 Mentorat Premium',
    description: '3 heures de mentorat individuel avec un portfolio manager',
    icon: '🏆',
    tier: 4,
  },
  {
    xp_required: 50000,
    reward_type: 'feature',
    reward_data: { featureCode: 'lifetime_premium', permanent: true },
    title: '👑 Premium à Vie',
    description: 'Tous les features premium débloqués définitivement',
    icon: '👑',
    tier: 5,
  },
];

// ================================
// SEED FUNCTION
// ================================

async function main() {
  console.log('🌱 Début du seeding...\n');

  // Clear existing data (optionnel, à commenter si tu veux garder les données)
  console.log('🧹 Nettoyage des données existantes...');
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.userReward.deleteMany();
  await prisma.reward.deleteMany();
  console.log('✅ Nettoyage terminé\n');

  // Seed Achievements
  console.log('🏆 Création des achievements...');
  for (const achievement of achievementsData) {
    await prisma.achievement.create({
      data: achievement,
    });
  }
  console.log(`✅ ${achievementsData.length} achievements créés\n`);

  // Seed Rewards
  console.log('🎁 Création des rewards...');
  for (const reward of rewardsData) {
    await prisma.reward.create({
      data: reward,
    });
  }
  console.log(`✅ ${rewardsData.length} rewards créés\n`);

  // Stats
  const achievementCount = await prisma.achievement.count();
  const rewardCount = await prisma.reward.count();

  console.log('📊 Résumé du seeding:');
  console.log(`   - Achievements: ${achievementCount}`);
  console.log(`   - Rewards: ${rewardCount}`);
  console.log('\n🎉 Seeding terminé avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });