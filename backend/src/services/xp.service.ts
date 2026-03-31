import { log } from '../config/logger';
// backend/src/services/xp.service.ts
// Service pour gérer le système XP, Level-up et Rewards
// Inspiré de Duolingo pour AfriBourse

import { prisma } from '../config/database';
import * as achievementService from './achievement.service';
import * as activityService from './activity.service';
import { createNotification } from './notification.service';
import { sendPushToUser } from './push-notification.service';
import {
  XP_REWARDS,
  LEVEL_TITLES,
  LEVEL_FEATURES,
  LevelTitle,
  UserXPStats,
  XPGainResult
} from '../types/gamification.types';

// =====================================
// CONFIGURATION XP - FORMULE DUOLINGO-STYLE
// =====================================

/**
 * Calcule l'XP TOTAL nécessaire pour atteindre un niveau N
 * Formule du document: XP = 50 × N × (N + 1)
 *
 * Exemples:
 * - Niveau 1: 100 XP
 * - Niveau 5: 1,500 XP
 * - Niveau 10: 5,500 XP
 * - Niveau 50: 127,500 XP
 * - Niveau 100: 505,000 XP
 */
export function getXPRequiredForLevel(level: number): number {
  return 50 * level * (level + 1);
}

/**
 * Calcule l'XP nécessaire UNIQUEMENT pour passer du niveau actuel au suivant
 */
export function getXPForCurrentLevel(level: number): number {
  if (level <= 1) return 100;
  return getXPRequiredForLevel(level) - getXPRequiredForLevel(level - 1);
}

/**
 * Calcule le niveau basé sur l'XP total
 * Inverse de la formule: niveau ≈ (-1 + √(1 + 4*XP/50)) / 2
 */
export function calculateLevelFromXP(totalXP: number): number {
  if (totalXP < 100) return 1;

  // Résolution de l'équation quadratique: 50*n*(n+1) = XP
  // n = (-1 + √(1 + 4*XP/50)) / 2
  const discriminant = 1 + (4 * totalXP) / 50;
  const level = Math.floor((-1 + Math.sqrt(discriminant)) / 2);

  // Vérification et ajustement
  if (getXPRequiredForLevel(level + 1) <= totalXP) {
    return level + 1;
  }
  return Math.max(1, level);
}

/**
 * Retourne le titre correspondant au niveau
 */
export function getLevelTitle(level: number): { title: LevelTitle; emoji: string } {
  const config = LEVEL_TITLES.find(
    t => level >= t.min_level && level <= t.max_level
  ) || LEVEL_TITLES[0];

  return { title: config.title, emoji: config.emoji };
}

/**
 * Retourne les stats XP complètes d'un utilisateur
 */
export async function getUserXPStats(userId: string): Promise<UserXPStats> {
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

  const totalXP = profile.total_xp;

  // Recalculer le niveau depuis le XP total pour corriger les incohérences
  const currentLevel = calculateLevelFromXP(totalXP);

  // Auto-correction si le niveau stocké ne correspond pas
  if (profile.level !== currentLevel) {
    log.warn(`⚠️ Level mismatch for ${userId}: stored=${profile.level}, calculated=${currentLevel}, xp=${totalXP}. Auto-correcting.`);
    await prisma.userProfile.update({
      where: { userId },
      data: { level: currentLevel }
    });
  }

  // Bornes correctes alignees avec calculateLevelFromXP :
  // Level 1: [0, getXPRequiredForLevel(2))  = [0, 300)
  // Level N (N>=2): [getXPRequiredForLevel(N), getXPRequiredForLevel(N+1))
  const xpLevelStart = currentLevel <= 1 ? 0 : getXPRequiredForLevel(currentLevel);
  const xpLevelEnd = getXPRequiredForLevel(currentLevel + 1);
  const currentLevelXP = Math.max(0, totalXP - xpLevelStart);
  const xpNeededForLevel = xpLevelEnd - xpLevelStart;
  const { title, emoji } = getLevelTitle(currentLevel);

  return {
    userId,
    level: currentLevel,
    total_xp: totalXP,
    current_level_xp: currentLevelXP,
    xp_for_next_level: xpLevelEnd,
    xp_needed: Math.max(0, xpLevelEnd - totalXP),
    progress_percent: xpNeededForLevel > 0 ? Math.min(100, Math.max(0, (currentLevelXP / xpNeededForLevel) * 100)) : 0,
    title,
    title_emoji: emoji
  };
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

    log.debug(`✨ ${userId} a gagné ${amount} XP (${reason})`);

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
    log.error('❌ Erreur addXP:', error);
    throw error;
  }
}

/**
 * Gère le level-up d'un utilisateur
 */
async function handleLevelUp(userId: string, oldLevel: number, newLevel: number) {
  try {
    log.debug(`🎉 ${userId} est passé du niveau ${oldLevel} au niveau ${newLevel} !`);

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

    // Notification in-app level-up
    try {
      await createNotification({
        userId,
        type: 'LEVEL_UP',
        title: `Niveau ${newLevel} atteint !`,
        message: `Bravo ! Vous êtes passé du niveau ${oldLevel} au niveau ${newLevel}. Continuez comme ça !`,
        metadata: { old_level: oldLevel, new_level: newLevel }
      });
    } catch (e) { /* non-bloquant */ }

    // Push notification level-up
    try {
      await sendPushToUser(userId, {
        title: `Niveau ${newLevel} atteint !`,
        body: `Félicitations ! Vous êtes maintenant niveau ${newLevel} sur AfriBourse.`,
        url: '/profile',
        tag: 'level-up',
      });
    } catch (e) { /* push optionnel */ }

  } catch (error) {
    log.error('❌ Erreur handleLevelUp:', error);
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

      log.debug(`🎁 ${userId} a débloqué la récompense "${reward.title}"`);

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
    log.error('❌ Erreur checkRewardUnlocks:', error);
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
    log.error('❌ Erreur getUserRewards:', error);
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

    log.debug(`✅ ${userId} a réclamé la récompense "${userReward.reward.title}"`);

    return {
      message: 'Récompense réclamée avec succès',
      reward: userReward.reward
    };

  } catch (error) {
    log.error('❌ Erreur claimReward:', error);
    throw error;
  }
}

/**
 * Applique une récompense selon son type
 */
async function applyReward(userId: string, reward: any) {
  const rewardData = reward.reward_data as Record<string, unknown>;

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
        log.debug(`💰 +${rewardData.amount} FCFA ajoutés au portfolio`);
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
      log.debug(`🧊 +${rewardData.quantity} freezes ajoutés`);
      break;

    case 'feature':
      // Débloquer une feature (à implémenter selon vos besoins)
      log.debug(`⚡ Feature "${rewardData.featureCode}" débloquée`);
      // TODO: Stocker les features débloquées
      break;

    case 'real_stock':
    case 'real_cash':
    case 'consultation':
    case 'masterclass':
      // Ces récompenses nécessitent une action manuelle
      log.debug(`🎁 Récompense "${reward.title}" nécessite une livraison manuelle`);
      break;

    default:
      log.debug(`⚠️ Type de récompense inconnu: ${reward.reward_type}`);
  }
}

// =====================================
// FEATURES PAR NIVEAU
// =====================================

/**
 * Vérifie et débloque les features selon le niveau
 * Selon le document de gamification AfriBourse
 */
async function checkFeatureUnlocks(userId: string, level: number) {
  const featureConfig = LEVEL_FEATURES.find(f => f.level === level);

  if (!featureConfig) {
    return;
  }

  log.debug(`🔓 Niveau ${level} atteint ! Feature "${featureConfig.feature}" débloquée`);

  try {
    // Appliquer la feature selon son type
    switch (featureConfig.feature) {
      case 'bonus_cash':
      case 'second_simulator':
      case 'bonus_simulator':
        // Ajouter de l'argent au portfolio SANDBOX
        const portfolio = await prisma.portfolio.findFirst({
          where: { userId, wallet_type: 'SANDBOX' }
        });

        if (portfolio) {
          await prisma.portfolio.update({
            where: { id: portfolio.id },
            data: {
              cash_balance: { increment: featureConfig.value as number }
            }
          });
          log.debug(`💰 +${featureConfig.value} FCFA ajoutés au portfolio (niveau ${level})`);
        }
        break;

      case 'verified_badge':
        // Mettre à jour le profil avec le badge vérifié
        await prisma.userProfile.update({
          where: { userId },
          data: { verified_investor: true }
        });
        log.debug(`✅ Badge "Verified Investor" attribué`);
        break;

      case 'extra_alerts':
      case 'extra_watchlist':
      case 'extra_comparator':
      case 'create_community':
      case 'premium_webinars':
        // Ces features sont vérifiées dynamiquement selon le niveau
        // Pas besoin de stocker, on vérifie le niveau de l'utilisateur
        log.debug(`⚡ Feature "${featureConfig.feature}" débloquée pour niveau ${level}`);
        break;
    }

    // Créer une activité pour la feature débloquée
    await activityService.createActivity(
      userId,
      'milestone',
      `a débloqué : ${featureConfig.description}`,
      { level, feature: featureConfig.feature, value: featureConfig.value },
      true
    );

  } catch (error) {
    log.error(`❌ Erreur lors du déblocage de feature niveau ${level}:`, error);
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
    log.error('❌ Erreur checkAchievementUnlocks:', error);
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
    log.error('❌ Erreur getXPHistory:', error);
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
    log.error('❌ Erreur getXPToNextLevel:', error);
    throw error;
  }
}

// =====================================
// ACTIONS XP PRÉDÉFINIES
// Basé sur le document de gamification AfriBourse
// =====================================

export const XP_ACTIONS = {
  // === FORMATION ===
  MODULE_COMPLETED: { amount: XP_REWARDS.MODULE_COMPLETE, reason: 'module_completed', description: 'Module complété' },
  QUIZ_PASS: { amount: XP_REWARDS.QUIZ_PASS, reason: 'quiz_pass', description: 'Quiz réussi (≥80%)' },
  QUIZ_PERFECT: { amount: XP_REWARDS.QUIZ_PASS + XP_REWARDS.QUIZ_PERFECT_BONUS, reason: 'quiz_perfect', description: 'Quiz parfait (100%)' },
  DAILY_3_MODULES: { amount: XP_REWARDS.DAILY_3_MODULES_BONUS, reason: 'daily_3_modules', description: 'Challenge quotidien: 3 modules' },

  // === TRADING ===
  FIRST_TRADE: { amount: XP_REWARDS.FIRST_TRADE, reason: 'first_trade', description: 'Premier investissement' },
  TRADE: { amount: XP_REWARDS.TRANSACTION, reason: 'trade', description: 'Transaction effectuée' },

  // === SOCIAL ===
  PROFILE_COMPLETED: { amount: XP_REWARDS.PROFILE_COMPLETE, reason: 'profile_completed', description: 'Profil complété à 100%' },
  FOLLOWER_MILESTONE: { amount: XP_REWARDS.FOLLOWER_MILESTONE, reason: 'follower_milestone', description: 'Palier de 50 abonnés' },
  INVITE_FRIEND: { amount: XP_REWARDS.INVITE_FRIEND, reason: 'referral', description: 'Ami invité et actif' },
  PROFILE_VISIT: { amount: XP_REWARDS.PROFILE_VISIT, reason: 'profile_visit', description: 'Visite de profil' },
  PROFILE_UPDATE: { amount: XP_REWARDS.PROFILE_UPDATE, reason: 'profile_update', description: 'Modification de profil' },

  // === ENGAGEMENT / STREAKS ===
  STREAK_7: { amount: XP_REWARDS.STREAK_7, reason: 'streak_7', description: 'Série de 7 jours' },
  STREAK_30: { amount: XP_REWARDS.STREAK_30, reason: 'streak_30', description: 'Série de 30 jours' },
  STREAK_100: { amount: XP_REWARDS.STREAK_100, reason: 'streak_100', description: 'Série de 100 jours' },
  STREAK_365: { amount: XP_REWARDS.STREAK_365, reason: 'streak_365', description: 'Série de 365 jours' },
  EARLY_BIRD: { amount: XP_REWARDS.EARLY_BIRD_BADGE, reason: 'early_bird', description: 'Connexion avant 8h (5x)' },
  NIGHT_OWL: { amount: XP_REWARDS.NIGHT_OWL_BADGE, reason: 'night_owl', description: 'Connexion après 22h (5x)' },

  // === BADGES (XP attribués lors du déblocage) ===
  BADGE_50_TRADES: { amount: XP_REWARDS.BADGE_50_TRADES, reason: 'badge_active_trader', description: 'Badge: Trader Actif (50 transactions)' },
  BADGE_200_TRADES: { amount: XP_REWARDS.BADGE_200_TRADES, reason: 'badge_pro_investor', description: 'Badge: Investisseur Pro (200 transactions)' },
  BADGE_ROI_20: { amount: XP_REWARDS.BADGE_ROI_20, reason: 'badge_performance', description: 'Badge: Performance (ROI > 20%)' },
  BADGE_DIVERSIFICATION: { amount: XP_REWARDS.BADGE_DIVERSIFICATION, reason: 'badge_diversification', description: 'Badge: Diversification (10+ positions)' }
};

// =====================================
// HELPERS PUBLICS
// =====================================

/**
 * Ajoute de l'XP pour une action prédéfinie
 */
export async function addXPForAction(
  userId: string,
  actionKey: keyof typeof XP_ACTIONS,
  metadata?: any
): Promise<XPGainResult> {
  const action = XP_ACTIONS[actionKey];
  return addXP(userId, action.amount, action.reason, action.description, metadata);
}

/**
 * Vérifie si l'utilisateur a atteint un niveau requis pour une feature
 */
export async function hasLevelFeature(userId: string, featureName: string): Promise<boolean> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { level: true }
  });

  if (!profile) return false;

  const featureConfig = LEVEL_FEATURES.find(f => f.feature === featureName);
  if (!featureConfig) return false;

  return profile.level >= featureConfig.level;
}

/**
 * Retourne toutes les features débloquées pour un utilisateur
 */
export async function getUnlockedFeatures(userId: string): Promise<typeof LEVEL_FEATURES> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { level: true }
  });

  if (!profile) return [];

  return LEVEL_FEATURES.filter(f => profile.level >= f.level);
}