// backend/src/services/achievement.service.ts
// Service pour gérer les achievements (badges)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =====================================
// RÉCUPÉRATION ACHIEVEMENTS
// =====================================

/**
 * Récupère tous les achievements disponibles
 */
export async function getAllAchievements() {
  try {
    const achievements = await prisma.achievement.findMany({
      where: {
        is_hidden: false // Ne pas montrer les badges secrets
      },
      orderBy: [
        { category: 'asc' },
        { xp_reward: 'asc' }
      ]
    });

    return achievements;

  } catch (error) {
    console.error('❌ Erreur getAllAchievements:', error);
    throw error;
  }
}

/**
 * Récupère les achievements d'un utilisateur
 */
export async function getUserAchievements(userId: string) {
  try {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      },
      orderBy: { unlocked_at: 'desc' }
    });

    return userAchievements;

  } catch (error) {
    console.error('❌ Erreur getUserAchievements:', error);
    throw error;
  }
}

/**
 * Récupère les achievements avec leur statut de déblocage pour un utilisateur
 */
export async function getAchievementsWithProgress(userId: string) {
  try {
    const [allAchievements, userAchievements] = await Promise.all([
      prisma.achievement.findMany({
        orderBy: [
          { category: 'asc' },
          { xp_reward: 'asc' }
        ]
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true, unlocked_at: true }
      })
    ]);

    const unlockedMap = new Map(
      userAchievements.map(ua => [ua.achievementId, ua.unlocked_at])
    );

    return allAchievements.map(achievement => ({
      ...achievement,
      unlocked: unlockedMap.has(achievement.id),
      unlocked_at: unlockedMap.get(achievement.id) || null
    }));

  } catch (error) {
    console.error('❌ Erreur getAchievementsWithProgress:', error);
    throw error;
  }
}

// =====================================
// DÉBLOCAGE ACHIEVEMENTS
// =====================================

/**
 * Débloque un achievement pour un utilisateur
 */
export async function unlockAchievement(userId: string, achievementCode: string) {
  try {
    // Trouver l'achievement
    const achievement = await prisma.achievement.findUnique({
      where: { code: achievementCode }
    });

    if (!achievement) {
      throw new Error(`Achievement ${achievementCode} non trouvé`);
    }

    // Vérifier s'il est déjà débloqué
    const existing = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id
        }
      }
    });

    if (existing) {
      return { alreadyUnlocked: true, achievement };
    }

    // Débloquer l'achievement
    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
        is_displayed: true,
        is_notified: false
      }
    });

    // Créer une activité
    await prisma.userActivity.create({
      data: {
        userId,
        type: 'badge',
        description: `a débloqué le badge "${achievement.name}"`,
        metadata: { achievementId: achievement.id, icon: achievement.icon },
        is_public: true
      }
    });

    // TODO: Ajouter les XP (via xpService)
    console.log(`🏆 ${userId} a débloqué "${achievement.name}" (+${achievement.xp_reward} XP)`);

    return {
      alreadyUnlocked: false,
      achievement,
      userAchievement,
      xp_earned: achievement.xp_reward
    };

  } catch (error) {
    console.error('❌ Erreur unlockAchievement:', error);
    throw error;
  }
}

// =====================================
// VÉRIFICATION AUTOMATIQUE
// =====================================

/**
 * Vérifie et débloque les achievements formation d'un utilisateur
 */
export async function checkFormationAchievements(userId: string) {
  try {
    const progressData = await prisma.learningProgress.findMany({
      where: { userId, is_completed: true },
      include: {
        module: {
          select: {
            difficulty_level: true
          }
        }
      }
    });

    const completedCount = progressData.length;
    const completedByLevel = {
      debutant: progressData.filter(p => p.module.difficulty_level === 'debutant').length,
      intermediaire: progressData.filter(p => p.module.difficulty_level === 'intermediaire').length,
      avance: progressData.filter(p => p.module.difficulty_level === 'avance').length
    };

    // Compter les quiz à 100%
    const perfectQuizzes = progressData.filter(p => p.quiz_score === 100).length;

    const toUnlock: string[] = [];

    // Vérifier les achievements
    if (completedCount >= 1) toUnlock.push('first_step');
    if (completedCount >= 5) toUnlock.push('diligent_student');
    if (perfectQuizzes >= 5) toUnlock.push('quiz_master');
    if (perfectQuizzes >= 10) toUnlock.push('quiz_goat');

    // Vérifier modules par niveau (TODO: comparer au nombre total de modules par niveau)
    // Pour l'instant, on suppose qu'il y a 10 modules par niveau
    if (completedByLevel.debutant >= 10) toUnlock.push('beginner_investor');
    if (completedByLevel.intermediaire >= 10) toUnlock.push('intermediate_investor');
    if (completedByLevel.avance >= 10) toUnlock.push('advanced_investor');

    // Débloquer les achievements
    const unlocked = [];
    for (const code of toUnlock) {
      const result = await unlockAchievement(userId, code);
      if (!result.alreadyUnlocked) {
        unlocked.push(result);
      }
    }

    return unlocked;

  } catch (error) {
    console.error('❌ Erreur checkFormationAchievements:', error);
    throw error;
  }
}

/**
 * Vérifie et débloque les achievements trading d'un utilisateur
 */
export async function checkTradingAchievements(userId: string) {
  try {
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId },
      include: {
        transactions: true,
        positions: true
      }
    });

    if (!portfolio) {
      return [];
    }

    const transactionsCount = portfolio.transactions.length;
    const positionsCount = portfolio.positions.length;

    // Calculer ROI
    const totalValue = portfolio.cash_balance + 
      portfolio.positions.reduce((sum, p) => sum + (p.quantity * p.average_buy_price), 0);
    const roi = ((totalValue - portfolio.initial_balance) / portfolio.initial_balance) * 100;

    const toUnlock: string[] = [];

    // Vérifier les achievements
    if (transactionsCount >= 1) toUnlock.push('first_trade');
    if (transactionsCount >= 50) toUnlock.push('active_trader');
    if (transactionsCount >= 200) toUnlock.push('pro_investor');
    if (roi >= 20) toUnlock.push('performance');
    if (positionsCount >= 10) toUnlock.push('diversification');

    // Débloquer
    const unlocked = [];
    for (const code of toUnlock) {
      const result = await unlockAchievement(userId, code);
      if (!result.alreadyUnlocked) {
        unlocked.push(result);
      }
    }

    return unlocked;

  } catch (error) {
    console.error('❌ Erreur checkTradingAchievements:', error);
    throw error;
  }
}

/**
 * Vérifie et débloque les achievements sociaux d'un utilisateur
 */
export async function checkSocialAchievements(userId: string) {
  try {
    const followersCount = await prisma.follow.count({
      where: { followingId: userId }
    });

    // TODO: Compter les referrals (nécessite un système de parrainage)

    const toUnlock: string[] = [];

    // Vérifier les achievements
    if (followersCount >= 10) toUnlock.push('connected');
    if (followersCount >= 50) toUnlock.push('influencer');
    if (followersCount >= 100) toUnlock.push('rising_star');
    if (followersCount >= 150) toUnlock.push('super_star');
    if (followersCount >= 200) toUnlock.push('celebrity');
    if (followersCount >= 500) toUnlock.push('icon');

    // Débloquer
    const unlocked = [];
    for (const code of toUnlock) {
      const result = await unlockAchievement(userId, code);
      if (!result.alreadyUnlocked) {
        unlocked.push(result);
      }
    }

    return unlocked;

  } catch (error) {
    console.error('❌ Erreur checkSocialAchievements:', error);
    throw error;
  }
}

/**
 * Vérifie tous les achievements d'un utilisateur (fonction générique)
 */
export async function checkAllAchievements(userId: string) {
  try {
    const [formation, trading, social] = await Promise.all([
      checkFormationAchievements(userId),
      checkTradingAchievements(userId),
      checkSocialAchievements(userId)
    ]);

    return {
      formation,
      trading,
      social,
      total: formation.length + trading.length + social.length
    };

  } catch (error) {
    console.error('❌ Erreur checkAllAchievements:', error);
    throw error;
  }
}