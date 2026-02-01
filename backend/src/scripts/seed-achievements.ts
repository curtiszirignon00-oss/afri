// backend/src/scripts/seed-achievements.ts
// Script pour créer tous les badges/achievements dans la base de données
// Usage: npx ts-node src/scripts/seed-achievements.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AchievementSeed {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'formation' | 'trading' | 'social' | 'engagement' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
  criteria: any;
  is_hidden?: boolean;
}

const ACHIEVEMENTS: AchievementSeed[] = [
  // =====================================
  // FORMATION (9 badges)
  // =====================================
  {
    code: 'first_step',
    name: 'Premier Pas',
    description: 'Compléter votre premier module de formation',
    icon: '📖',
    category: 'formation',
    rarity: 'common',
    xp_reward: 100,
    criteria: { type: 'modules_completed', target: 1 }
  },
  {
    code: 'diligent_student',
    name: 'Étudiant Assidu',
    description: 'Compléter 5 modules de formation',
    icon: '🎓',
    category: 'formation',
    rarity: 'common',
    xp_reward: 300,
    criteria: { type: 'modules_completed', target: 5 }
  },
  {
    code: 'beginner_investor',
    name: 'Investisseur Débutant',
    description: 'Compléter tous les modules niveau débutant',
    icon: '🌱',
    category: 'formation',
    rarity: 'rare',
    xp_reward: 500,
    criteria: { type: 'modules_level', level: 'debutant', target: 'all' }
  },
  {
    code: 'intermediate_investor',
    name: 'Investisseur Intermédiaire',
    description: 'Compléter tous les modules niveau intermédiaire',
    icon: '📈',
    category: 'formation',
    rarity: 'rare',
    xp_reward: 800,
    criteria: { type: 'modules_level', level: 'intermediaire', target: 'all' }
  },
  {
    code: 'advanced_investor',
    name: 'Investisseur Avancé',
    description: 'Compléter tous les modules niveau avancé',
    icon: '💎',
    category: 'formation',
    rarity: 'epic',
    xp_reward: 1500,
    criteria: { type: 'modules_level', level: 'avance', target: 'all' }
  },
  {
    code: 'brvm_expert',
    name: 'Expert BRVM',
    description: 'Compléter TOUS les modules de formation',
    icon: '🏆',
    category: 'formation',
    rarity: 'legendary',
    xp_reward: 2000,
    criteria: { type: 'modules_completed', target: 'all' }
  },
  {
    code: 'quiz_master',
    name: 'Quiz Master',
    description: 'Obtenir 100% à 5 quiz',
    icon: '🧠',
    category: 'formation',
    rarity: 'rare',
    xp_reward: 500,
    criteria: { type: 'perfect_quizzes', target: 5 }
  },
  {
    code: 'quiz_goat',
    name: 'Quiz GOAT',
    description: 'Obtenir 100% à 10 quiz',
    icon: '👑',
    category: 'formation',
    rarity: 'epic',
    xp_reward: 1000,
    criteria: { type: 'perfect_quizzes', target: 10 }
  },
  {
    code: 'lightning_learner',
    name: 'Apprenant Éclair',
    description: 'Compléter 3 modules en une seule journée',
    icon: '⚡',
    category: 'formation',
    rarity: 'rare',
    xp_reward: 200,
    criteria: { type: 'modules_in_day', target: 3 }
  },

  // =====================================
  // TRADING (7 badges)
  // =====================================
  {
    code: 'first_trade',
    name: 'Premier Trade',
    description: 'Effectuer votre première transaction',
    icon: '🎯',
    category: 'trading',
    rarity: 'common',
    xp_reward: 200,
    criteria: { type: 'transactions', target: 1 }
  },
  {
    code: 'active_trader',
    name: 'Trader Actif',
    description: 'Effectuer 50 transactions',
    icon: '📈',
    category: 'trading',
    rarity: 'rare',
    xp_reward: 500,
    criteria: { type: 'transactions', target: 50 }
  },
  {
    code: 'pro_investor',
    name: 'Investisseur Pro',
    description: 'Effectuer 200 transactions',
    icon: '💎',
    category: 'trading',
    rarity: 'epic',
    xp_reward: 1500,
    criteria: { type: 'transactions', target: 200 }
  },
  {
    code: 'performance',
    name: 'Performance',
    description: 'Atteindre un ROI de plus de 20%',
    icon: '🚀',
    category: 'trading',
    rarity: 'epic',
    xp_reward: 800,
    criteria: { type: 'roi', target: 20 }
  },
  {
    code: 'diversification',
    name: 'Diversification',
    description: 'Détenir 10 positions différentes simultanément',
    icon: '🏅',
    category: 'trading',
    rarity: 'rare',
    xp_reward: 400,
    criteria: { type: 'positions', target: 10 }
  },
  {
    code: 'long_term',
    name: 'Long Terme',
    description: 'Conserver une position pendant 90 jours',
    icon: '🌳',
    category: 'trading',
    rarity: 'rare',
    xp_reward: 600,
    criteria: { type: 'position_held_days', target: 90 }
  },
  {
    code: 'dividend_hunter',
    name: 'Chasseur de Dividendes',
    description: 'Recevoir des dividendes de 5 entreprises différentes',
    icon: '💰',
    category: 'trading',
    rarity: 'epic',
    xp_reward: 1000,
    criteria: { type: 'dividends_companies', target: 5 }
  },

  // =====================================
  // SOCIAL (10 badges)
  // =====================================
  {
    code: 'new_member',
    name: 'Nouveau Membre',
    description: 'Compléter votre profil à 100%',
    icon: '👋',
    category: 'social',
    rarity: 'common',
    xp_reward: 50,
    criteria: { type: 'profile_complete', target: 100 }
  },
  {
    code: 'new_member_in_community',
    name: 'Première Communauté',
    description: 'Rejoindre une communauté',
    icon: '🗣',
    category: 'social',
    rarity: 'common',
    xp_reward: 50,
    criteria: { type: 'communities_joined', target: 1 }
  },
  {
    code: 'connected',
    name: 'Connecté',
    description: 'Atteindre 10 abonnés',
    icon: '🤝',
    category: 'social',
    rarity: 'common',
    xp_reward: 100,
    criteria: { type: 'followers', target: 10 }
  },
  {
    code: 'influencer',
    name: 'Influenceur',
    description: 'Atteindre 50 abonnés',
    icon: '🌟',
    category: 'social',
    rarity: 'rare',
    xp_reward: 200,
    criteria: { type: 'followers', target: 50 }
  },
  {
    code: 'rising_star',
    name: 'Rising Star',
    description: 'Atteindre 100 abonnés',
    icon: '⭐',
    category: 'social',
    rarity: 'rare',
    xp_reward: 400,
    criteria: { type: 'followers', target: 100 }
  },
  {
    code: 'super_star',
    name: 'Super Star',
    description: 'Atteindre 150 abonnés',
    icon: '💫',
    category: 'social',
    rarity: 'epic',
    xp_reward: 600,
    criteria: { type: 'followers', target: 150 }
  },
  {
    code: 'celebrity',
    name: 'Célébrité',
    description: 'Atteindre 200 abonnés',
    icon: '👑',
    category: 'social',
    rarity: 'epic',
    xp_reward: 800,
    criteria: { type: 'followers', target: 200 }
  },
  {
    code: 'icon',
    name: 'Icône',
    description: 'Atteindre 500 abonnés',
    icon: '🔥',
    category: 'social',
    rarity: 'legendary',
    xp_reward: 2000,
    criteria: { type: 'followers', target: 500 }
  },
  {
    code: 'sponsor',
    name: 'Parrain',
    description: 'Inviter 5 amis qui s\'inscrivent',
    icon: '🎁',
    category: 'social',
    rarity: 'epic',
    xp_reward: 1500,
    criteria: { type: 'referrals', target: 5 }
  },
  {
    code: 'super_sponsor',
    name: 'Super Parrain',
    description: 'Inviter 20 amis qui s\'inscrivent',
    icon: '🏆',
    category: 'social',
    rarity: 'legendary',
    xp_reward: 5000,
    criteria: { type: 'referrals', target: 20 }
  },

  // =====================================
  // ENGAGEMENT (6 badges)
  // =====================================
  {
    code: 'streak_7',
    name: 'Série 7 jours',
    description: 'Maintenir une série de 7 jours consécutifs',
    icon: '🔥',
    category: 'engagement',
    rarity: 'common',
    xp_reward: 200,
    criteria: { type: 'streak', target: 7 }
  },
  {
    code: 'streak_30',
    name: 'Série 30 jours',
    description: 'Maintenir une série de 30 jours consécutifs',
    icon: '⚡',
    category: 'engagement',
    rarity: 'rare',
    xp_reward: 800,
    criteria: { type: 'streak', target: 30 }
  },
  {
    code: 'streak_100',
    name: 'Série 100 jours',
    description: 'Maintenir une série de 100 jours consécutifs',
    icon: '💪',
    category: 'engagement',
    rarity: 'legendary',
    xp_reward: 3000,
    criteria: { type: 'streak', target: 100 }
  },
  {
    code: 'early_bird',
    name: 'Lève-tôt',
    description: 'Se connecter avant 8h du matin 5 fois',
    icon: '🌅',
    category: 'engagement',
    rarity: 'common',
    xp_reward: 150,
    criteria: { type: 'login_before', hour: 8, target: 5 }
  },
  {
    code: 'night_owl',
    name: 'Noctambule',
    description: 'Se connecter après 22h 5 fois',
    icon: '🌙',
    category: 'engagement',
    rarity: 'common',
    xp_reward: 150,
    criteria: { type: 'login_after', hour: 22, target: 5 }
  },
  {
    code: 'weekend_warrior',
    name: 'Guerrier du Weekend',
    description: 'Être actif tous les weekends pendant 1 mois',
    icon: '⚔️',
    category: 'engagement',
    rarity: 'rare',
    xp_reward: 400,
    criteria: { type: 'weekend_activity', weeks: 4 }
  },

  // =====================================
  // SPÉCIAUX (7 badges)
  // =====================================
  {
    code: 'anniversary',
    name: 'Anniversaire',
    description: 'Être membre depuis 1 an',
    icon: '🎂',
    category: 'special',
    rarity: 'epic',
    xp_reward: 1000,
    criteria: { type: 'account_age_days', target: 365 }
  },
  {
    code: 'top_10_percent',
    name: 'Top 10%',
    description: 'Faire partie du top 10% du classement',
    icon: '🥇',
    category: 'special',
    rarity: 'rare',
    xp_reward: 500,
    criteria: { type: 'ranking_percentile', target: 10 }
  },
  {
    code: 'monthly_champion',
    name: 'Champion Mensuel',
    description: 'Avoir le meilleur ROI du mois',
    icon: '🏆',
    category: 'special',
    rarity: 'epic',
    xp_reward: 1500,
    criteria: { type: 'monthly_roi_rank', target: 1 }
  },
  {
    code: 'ambassador',
    name: 'Ambassadeur',
    description: 'Avoir 20+ amis actifs invités',
    icon: '🌍',
    category: 'special',
    rarity: 'legendary',
    xp_reward: 1200,
    criteria: { type: 'active_referrals', target: 20 }
  },
  {
    code: 'diamond_investor',
    name: 'Investisseur Diamant',
    description: 'Atteindre 30,000 XP au total',
    icon: '💎',
    category: 'special',
    rarity: 'legendary',
    xp_reward: 0, // Pas d'XP supplémentaire
    criteria: { type: 'total_xp', target: 30000 }
  },
  {
    code: 'legend',
    name: 'Légende',
    description: 'Atteindre 50,000 XP au total',
    icon: '👑',
    category: 'special',
    rarity: 'legendary',
    xp_reward: 0, // Pas d'XP supplémentaire
    criteria: { type: 'total_xp', target: 50000 }
  },
  {
    code: 'pioneer',
    name: 'Pionnier',
    description: 'Faire partie des 100 premiers inscrits',
    icon: '🌟',
    category: 'special',
    rarity: 'legendary',
    xp_reward: 500,
    criteria: { type: 'early_adopter', target: 100 },
    is_hidden: true // Badge secret
  }
];

async function seedAchievements() {
  console.log('🏆 Début du seeding des achievements...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const achievement of ACHIEVEMENTS) {
    try {
      // Vérifier si l'achievement existe déjà
      const existing = await prisma.achievement.findUnique({
        where: { code: achievement.code }
      });

      if (existing) {
        // Mettre à jour
        await prisma.achievement.update({
          where: { code: achievement.code },
          data: {
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            category: achievement.category,
            rarity: achievement.rarity,
            xp_reward: achievement.xp_reward,
            criteria: achievement.criteria,
            is_hidden: achievement.is_hidden || false
          }
        });
        console.log(`  ✏️  Mis à jour: ${achievement.name}`);
        updated++;
      } else {
        // Créer
        await prisma.achievement.create({
          data: {
            code: achievement.code,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            category: achievement.category,
            rarity: achievement.rarity,
            xp_reward: achievement.xp_reward,
            criteria: achievement.criteria,
            is_hidden: achievement.is_hidden || false
          }
        });
        console.log(`  ✅ Créé: ${achievement.name}`);
        created++;
      }
    } catch (error) {
      console.error(`  ❌ Erreur pour ${achievement.code}:`, error);
      skipped++;
    }
  }

  console.log('\n📊 Résumé du seeding:');
  console.log(`   - Créés: ${created}`);
  console.log(`   - Mis à jour: ${updated}`);
  console.log(`   - Erreurs: ${skipped}`);
  console.log(`   - Total badges: ${ACHIEVEMENTS.length}`);
}

// Exécuter le script
seedAchievements()
  .then(() => {
    console.log('\n✅ Seeding terminé avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
