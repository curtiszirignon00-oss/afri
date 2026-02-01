// backend/src/scripts/seed-rewards.ts
// Script pour créer toutes les récompenses dans la base de données
// Usage: npx ts-node src/scripts/seed-rewards.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RewardSeed {
  code: string;
  title: string;
  description: string;
  icon: string;
  reward_type: 'virtual_cash' | 'feature' | 'real_stock' | 'consultation' | 'real_cash' | 'masterclass' | 'freeze' | 'badge' | 'cosmetic';
  xp_required: number;
  reward_data: any;
  tier: number;
  is_active: boolean;
}

const REWARDS: RewardSeed[] = [
  // =====================================
  // ARGENT VIRTUEL (5 paliers)
  // =====================================
  {
    code: 'cash_500xp',
    title: 'Bonus 50,000 FCFA',
    description: 'Recevez 50,000 FCFA sur votre portefeuille virtuel',
    icon: '💰',
    reward_type: 'virtual_cash',
    xp_required: 500,
    reward_data: { amount: 50000, currency: 'FCFA' },
    tier: 1,
    is_active: true
  },
  {
    code: 'cash_1000xp',
    title: 'Bonus 50,000 FCFA',
    description: 'Recevez 50,000 FCFA supplémentaires',
    icon: '💰',
    reward_type: 'virtual_cash',
    xp_required: 1000,
    reward_data: { amount: 50000, currency: 'FCFA' },
    tier: 1,
    is_active: true
  },
  {
    code: 'cash_2000xp',
    title: 'Bonus 100,000 FCFA',
    description: 'Recevez 100,000 FCFA sur votre portefeuille virtuel',
    icon: '💵',
    reward_type: 'virtual_cash',
    xp_required: 2000,
    reward_data: { amount: 100000, currency: 'FCFA' },
    tier: 2,
    is_active: true
  },
  {
    code: 'cash_5000xp',
    title: 'Bonus 150,000 FCFA',
    description: 'Recevez 150,000 FCFA sur votre portefeuille virtuel',
    icon: '💎',
    reward_type: 'virtual_cash',
    xp_required: 5000,
    reward_data: { amount: 150000, currency: 'FCFA' },
    tier: 3,
    is_active: true
  },
  {
    code: 'cash_15000xp',
    title: 'Jackpot 1,000,000 FCFA',
    description: 'Recevez 1,000,000 FCFA sur votre portefeuille virtuel !',
    icon: '🏆',
    reward_type: 'virtual_cash',
    xp_required: 15000,
    reward_data: { amount: 1000000, currency: 'FCFA' },
    tier: 5,
    is_active: true
  },

  // =====================================
  // CONSULTATIONS EXPERT (4 paliers)
  // =====================================
  {
    code: 'consult_5000xp',
    title: 'Consultation Trader BRVM',
    description: '30 minutes avec un trader professionnel de la BRVM',
    icon: '👨‍💼',
    reward_type: 'consultation',
    xp_required: 5000,
    reward_data: {
      duration_minutes: 30,
      expert_type: 'Trader BRVM',
      booking_required: true
    },
    tier: 3,
    is_active: true
  },
  {
    code: 'consult_10000xp',
    title: 'Consultation Analyste Financier',
    description: '60 minutes avec un analyste financier certifié',
    icon: '📊',
    reward_type: 'consultation',
    xp_required: 10000,
    reward_data: {
      duration_minutes: 60,
      expert_type: 'Analyste Financier',
      booking_required: true
    },
    tier: 4,
    is_active: true
  },
  {
    code: 'consult_20000xp',
    title: 'Consultation Portfolio Manager',
    description: '90 minutes avec un gestionnaire de portefeuille',
    icon: '🎯',
    reward_type: 'consultation',
    xp_required: 20000,
    reward_data: {
      duration_minutes: 90,
      expert_type: 'Portfolio Manager',
      booking_required: true
    },
    tier: 5,
    is_active: true
  },
  {
    code: 'consult_50000xp',
    title: 'Mentorat Individuel',
    description: '3 heures de mentorat personnalisé avec un expert',
    icon: '🌟',
    reward_type: 'consultation',
    xp_required: 50000,
    reward_data: {
      duration_minutes: 180,
      expert_type: 'Mentor Senior',
      booking_required: true,
      personalized: true
    },
    tier: 5,
    is_active: true
  },

  // =====================================
  // STREAK FREEZES (3 paliers)
  // =====================================
  {
    code: 'freeze_300xp',
    title: '1 Streak Freeze',
    description: 'Protégez votre série pendant 1 jour d\'absence',
    icon: '🧊',
    reward_type: 'freeze',
    xp_required: 300,
    reward_data: { quantity: 1 },
    tier: 1,
    is_active: true
  },
  {
    code: 'freeze_800xp',
    title: '3 Streak Freezes',
    description: 'Pack de 3 freezes pour protéger votre série',
    icon: '❄️',
    reward_type: 'freeze',
    xp_required: 800,
    reward_data: { quantity: 3 },
    tier: 2,
    is_active: true
  },
  {
    code: 'freeze_2000xp',
    title: '5 Streak Freezes',
    description: 'Pack maximum de 5 freezes',
    icon: '🏔️',
    reward_type: 'freeze',
    xp_required: 2000,
    reward_data: { quantity: 5 },
    tier: 3,
    is_active: true
  },

  // =====================================
  // COSMÉTIQUES (4 paliers)
  // =====================================
  {
    code: 'banner_gold',
    title: 'Bannière Or',
    description: 'Débloquez une bannière dorée pour votre profil',
    icon: '🎖️',
    reward_type: 'cosmetic',
    xp_required: 1000,
    reward_data: {
      type: 'banner',
      asset: 'gold_banner',
      color: '#FFD700'
    },
    tier: 2,
    is_active: true
  },
  {
    code: 'badge_custom',
    title: 'Badge Personnalisé',
    description: 'Créez un badge personnalisé pour votre profil',
    icon: '🏷️',
    reward_type: 'cosmetic',
    xp_required: 2000,
    reward_data: {
      type: 'badge',
      customizable: true
    },
    tier: 3,
    is_active: true
  },
  {
    code: 'banner_diamond',
    title: 'Bannière Diamant',
    description: 'Débloquez la bannière diamant exclusive',
    icon: '💎',
    reward_type: 'cosmetic',
    xp_required: 5000,
    reward_data: {
      type: 'banner',
      asset: 'diamond_banner',
      color: '#B9F2FF',
      animated: true
    },
    tier: 4,
    is_active: true
  },
  {
    code: 'profile_photo',
    title: 'Photo de Profil',
    description: 'Débloquez la possibilité d\'ajouter une photo de profil',
    icon: '📸',
    reward_type: 'feature',
    xp_required: 10000,
    reward_data: {
      feature: 'profile_photo',
      description: 'Upload photo de profil'
    },
    tier: 4,
    is_active: true
  },

  // =====================================
  // MASTERCLASSES (2 paliers)
  // =====================================
  {
    code: 'masterclass_trading',
    title: 'Masterclass Trading',
    description: 'Accès à une masterclass exclusive sur le trading BRVM',
    icon: '🎬',
    reward_type: 'masterclass',
    xp_required: 8000,
    reward_data: {
      title: 'Masterclass Trading BRVM',
      duration_hours: 2,
      includes: ['Vidéo HD', 'Slides PDF', 'Exercices pratiques']
    },
    tier: 4,
    is_active: true
  },
  {
    code: 'masterclass_analysis',
    title: 'Masterclass Analyse Fondamentale',
    description: 'Formation complète sur l\'analyse fondamentale des actions',
    icon: '📚',
    reward_type: 'masterclass',
    xp_required: 12000,
    reward_data: {
      title: 'Analyse Fondamentale Avancée',
      duration_hours: 4,
      includes: ['Vidéo HD', 'Workbook', 'Templates Excel', 'Certification']
    },
    tier: 5,
    is_active: true
  }
];

async function seedRewards() {
  console.log('🎁 Début du seeding des récompenses...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const reward of REWARDS) {
    try {
      // Vérifier si la récompense existe déjà (par code)
      const existing = await prisma.reward.findFirst({
        where: {
          OR: [
            { title: reward.title, xp_required: reward.xp_required }
          ]
        }
      });

      if (existing) {
        // Mettre à jour
        await prisma.reward.update({
          where: { id: existing.id },
          data: {
            title: reward.title,
            description: reward.description,
            icon: reward.icon,
            reward_type: reward.reward_type,
            xp_required: reward.xp_required,
            reward_data: reward.reward_data,
            tier: reward.tier,
            is_active: reward.is_active
          }
        });
        console.log(`  ✏️  Mis à jour: ${reward.title}`);
        updated++;
      } else {
        // Créer
        await prisma.reward.create({
          data: {
            title: reward.title,
            description: reward.description,
            icon: reward.icon,
            reward_type: reward.reward_type,
            xp_required: reward.xp_required,
            reward_data: reward.reward_data,
            tier: reward.tier,
            is_active: reward.is_active
          }
        });
        console.log(`  ✅ Créé: ${reward.title}`);
        created++;
      }
    } catch (error) {
      console.error(`  ❌ Erreur pour ${reward.title}:`, error);
      skipped++;
    }
  }

  console.log('\n📊 Résumé du seeding:');
  console.log(`   - Créées: ${created}`);
  console.log(`   - Mises à jour: ${updated}`);
  console.log(`   - Erreurs: ${skipped}`);
  console.log(`   - Total récompenses: ${REWARDS.length}`);
}

// Exécuter le script
seedRewards()
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
