// backend/src/services/xp.service.ts
// Service pour gérer le système XP, Level-up et Rewards

import { PrismaClient } from '@prisma/client';
import * as achievementService from './achievement.service';
import * as activityService from './activity.service';

const prisma = new PrismaClient();

// =====================================
// CONFIGURATION XP
// =====================================

/**
 * Calcule l'XP nécessaire pour atteindre un niveau
 * Formule : 100 * (level ^ 1.5)
 */
function getXPRequiredForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Calcule le niveau basé sur l'XP total
 */
function calculateLevelFromXP(totalXP: number): number {
  let level = 1;
  while (totalXP >= getXPRequiredForLevel(level + 1)) {
    level++;
  }
  return level;
}

// =====================================
// AJOUT XP
// =====================================

/**
 * Ajoute de l'XP à un utilisateur
 * @param userId - ID de l'utilisateur
 * @param amount - Quantité d'XP à ajouter
 * @param reason - Raison de l'ajout (code)
 * @param description - Description détaillée (optionnel)
 * @param metadata - Données supplémentaires (optionnel)
 */
export async function addXP(
  userId: string,
  amount: number,
  reason: string,
  description?: string,
  metadata?: any
) {
  try {
    // Récupérer le profil actuel
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        total_xp: true,
        level: true
      }
    });

    if (!profile) {
      throw new Error('Profil non trouvé');
    }

    const oldXP = profile.total_xp;
    const oldLevel = profile.level;
    const newXP = oldXP + amount;
    const newLevel = calculateLevelFromXP(newXP);

    // Mettre à jour le profil
    await prisma.userProfile.update({
      where: { userId },
      data: {
        total_xp: newXP,
        level: newLevel
      }
    });

    // Enregistrer dans l'historique
    await prisma.xPHistory.create({
      data: {
        userId,
        amount,
        reason,
        description: description || `+${amount} XP - ${reason}`,
        metadata
      }
    });

    console.log(`✨ ${userId} a gagné ${amount} XP (${reason})`);

    // Vérifier level-up
    const leveledUp = newLevel > oldLevel;
    if (leveledUp) {
      await handleLevelUp(userId, oldLevel, newLevel);
    }

    // Vérifier déblocage de rewards
    await checkRewardUnlocks(userId, newXP);

    // Vérifier déblocage d'achievements (selon la raison)
    await checkAchievementUnlocks(userId, reason);

    return {
      xp_added: amount,
      old_xp: oldXP,
      new_xp: newXP,
      old_level: oldLevel,
      new_level: newLevel,
      leveled_up: leveledUp
    };

  } catch (error) {
    console.error('❌ Erreur addXP:', error);
    throw error;
  }
}

/**
 * Gère le level-up d'un utilisateur
 */
async function handleLevelUp(userId: string, oldLevel: number, newLevel: number) {
  try {
    console.log(`🎉 ${userId} est passé du niveau ${oldLevel} au niveau ${newLevel} !`);

    // Créer une activité
    await activityService.createActivity(
      userId,
      'level_up',
      `est passé au niveau ${newLevel} !`,
      { old_level: oldLevel, new_level: newLevel },
      true
    );

    // Vérifier déblocage de features selon le niveau
    await checkFeatureUnlocks(userId, newLevel);

    // TODO: Envoyer une notification

  } catch (error) {
    console.error('❌ Erreur handleLevelUp:', error);
    throw error;
  }
}

// =====================================
// REWARDS
// =====================================

/**
 * Vérifie et débloque les rewards éligibles
 */
async function checkRewardUnlocks(userId: string, currentXP: number) {
  try {
    // Trouver les rewards éligibles non encore débloqués
    const eligibleRewards = await prisma.reward.findMany({
      where: {
        xp_required: { lte: currentXP },
        is_active: true,
        NOT: {
          users: {
            some: { userId }
          }
        }
      }
    });

    if (eligibleRewards.length === 0) {
      return [];
    }

    // Débloquer les rewards
    const unlocked = [];
    for (const reward of eligibleRewards) {
      const userReward = await prisma.userReward.create({
        data: {
          userId,
          rewardId: reward.id,
          claimed: false,
          delivery_status: 'pending'
        }
      });

      console.log(`🎁 ${userId} a débloqué la récompense "${reward.title}"`);

      // Créer une activité
      await activityService.createActivity(
        userId,
        'milestone',
        `a débloqué une récompense : ${reward.title}`,
        { rewardId: reward.id, xp_required: reward.xp_required },
        true
      );

      unlocked.push({ reward, userReward });
    }

    return unlocked;

  } catch (error) {
    console.error('❌ Erreur checkRewardUnlocks:', error);
    throw error;
  }
}

/**
 * Récupère les rewards d'un utilisateur
 */
export async function getUserRewards(userId: string) {
  try {
    const userRewards = await prisma.userReward.findMany({
      where: { userId },
      include: {
        reward: true
      },
      orderBy: { unlocked_at: 'desc' }
    });

    return userRewards;

  } catch (error) {
    console.error('❌ Erreur getUserRewards:', error);
    throw error;
  }
}

/**
 * Réclamer une récompense
 */
export async function claimReward(userId: string, rewardId: string) {
  try {
    const userReward = await prisma.userReward.findUnique({
      where: {
        userId_rewardId: { userId, rewardId }
      },
      include: { reward: true }
    });

    if (!userReward) {
      throw new Error('Récompense non débloquée');
    }

    if (userReward.claimed) {
      throw new Error('Récompense déjà réclamée');
    }

    // Marquer comme réclamée
    await prisma.userReward.update({
      where: {
        userId_rewardId: { userId, rewardId }
      },
      data: {
        claimed: true,
        claimed_at: new Date(),
        delivery_status: 'processing'
      }
    });

    // Appliquer la récompense selon son type
    await applyReward(userId, userReward.reward);

    console.log(`✅ ${userId} a réclamé la récompense "${userReward.reward.title}"`);

    return {
      message: 'Récompense réclamée avec succès',
      reward: userReward.reward
    };

  } catch (error) {
    console.error('❌ Erreur claimReward:', error);
    throw error;
  }
}

/**
 * Applique une récompense selon son type
 */
async function applyReward(userId: string, reward: any) {
  const rewardData = reward.reward_data as any;

  switch (reward.reward_type) {
    case 'virtual_cash':
      // Ajouter de l'argent au portfolio
      const portfolio = await prisma.portfolio.findFirst({
        where: { userId }
      });
      
      if (portfolio) {
        await prisma.portfolio.update({
          where: { id: portfolio.id },
          data: {
            cash_balance: { increment: rewardData.amount }
          }
        });
        console.log(`💰 +${rewardData.amount} FCFA ajoutés au portfolio`);
      }
      break;

    case 'freeze':
      // Ajouter des freezes
      await prisma.userProfile.update({
        where: { userId },
        data: {
          streak_freezes: { increment: rewardData.quantity }
        }
      });
      console.log(`🧊 +${rewardData.quantity} freezes ajoutés`);
      break;

    case 'feature':
      // Débloquer une feature (à implémenter selon vos besoins)
      console.log(`⚡ Feature "${rewardData.featureCode}" débloquée`);
      // TODO: Stocker les features débloquées
      break;

    case 'real_stock':
    case 'real_cash':
    case 'consultation':
    case 'masterclass':
      // Ces récompenses nécessitent une action manuelle
      console.log(`🎁 Récompense "${reward.title}" nécessite une livraison manuelle`);
      break;

    default:
      console.log(`⚠️ Type de récompense inconnu: ${reward.reward_type}`);
  }
}

// =====================================
// FEATURES PAR NIVEAU
// =====================================

/**
 * Vérifie et débloque les features selon le niveau
 */
async function checkFeatureUnlocks(userId: string, level: number) {
  const features: { [key: number]: string } = {
    5: 'advanced_charts',
    10: 'watchlist',
    15: 'forum_access',
    20: 'ai_insights',
    30: 'verified_badge',
    50: 'premium_webinars'
  };

  if (features[level]) {
    console.log(`🔓 Niveau ${level} atteint ! Feature "${features[level]}" débloquée`);
    // TODO: Stocker les features débloquées
  }
}

// =====================================
// ACHIEVEMENTS AUTOMATIQUES
// =====================================

/**
 * Vérifie et débloque les achievements selon la raison
 */
async function checkAchievementUnlocks(userId: string, reason: string) {
  try {
    switch (reason) {
      case 'module_completed':
        await achievementService.checkFormationAchievements(userId);
        break;
      
      case 'quiz_100':
        await achievementService.checkFormationAchievements(userId);
        break;
      
      case 'first_trade':
      case 'trade':
        await achievementService.checkTradingAchievements(userId);
        break;
      
      case 'new_follower':
        await achievementService.checkSocialAchievements(userId);
        break;
      
      case 'streak_maintained':
        // Vérifier achievements de streak
        const profile = await prisma.userProfile.findUnique({
          where: { userId },
          select: { current_streak: true }
        });
        
        if (profile) {
          if (profile.current_streak === 7) {
            await achievementService.unlockAchievement(userId, 'streak_7');
          } else if (profile.current_streak === 30) {
            await achievementService.unlockAchievement(userId, 'streak_30');
          } else if (profile.current_streak === 100) {
            await achievementService.unlockAchievement(userId, 'streak_100');
          }
        }
        break;
    }
  } catch (error) {
    console.error('❌ Erreur checkAchievementUnlocks:', error);
  }
}

// =====================================
// HELPERS
// =====================================

/**
 * Récupère l'historique XP d'un utilisateur
 */
export async function getXPHistory(userId: string, limit: number = 50) {
  try {
    const history = await prisma.xPHistory.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' },
      take: limit
    });

    return history;

  } catch (error) {
    console.error('❌ Erreur getXPHistory:', error);
    throw error;
  }
}

/**
 * Calcule les XP nécessaires pour le prochain niveau
 */
export async function getXPToNextLevel(userId: string) {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        total_xp: true,
        level: true
      }
    });

    if (!profile) {
      throw new Error('Profil non trouvé');
    }

    const xpForNextLevel = getXPRequiredForLevel(profile.level + 1);
    const xpNeeded = xpForNextLevel - profile.total_xp;

    return {
      current_level: profile.level,
      current_xp: profile.total_xp,
      xp_for_next_level: xpForNextLevel,
      xp_needed: xpNeeded,
      progress_percent: Math.min(100, (profile.total_xp / xpForNextLevel) * 100)
    };

  } catch (error) {
    console.error('❌ Erreur getXPToNextLevel:', error);
    throw error;
  }
}

// =====================================
// ACTIONS XP PRÉDÉFINIES
// =====================================

export const XP_ACTIONS = {
  MODULE_COMPLETED: { amount: 200, reason: 'module_completed' },
  QUIZ_PERFECT: { amount: 50, reason: 'quiz_100' },
  FIRST_TRADE: { amount: 200, reason: 'first_trade' },
  TRADE: { amount: 10, reason: 'trade' },
  STREAK_7: { amount: 200, reason: 'streak_maintained' },
  STREAK_30: { amount: 800, reason: 'streak_maintained' },
  INVITE_FRIEND: { amount: 500, reason: 'referral' },
  NEW_FOLLOWER: { amount: 200, reason: 'new_follower' }, // Par palier de 50
  PROFILE_COMPLETED: { amount: 250, reason: 'profile_completed' },
  PROFILE_VISIT: { amount: 1, reason: 'profile_visit' },
  PROFILE_UPDATE: { amount: 5, reason: 'profile_update' }
};