// backend/src/services/achievement.service.ts
// Service pour gérer les achievements (badges)
// Système de gamification AfriBourse

import { PrismaClient } from '@prisma/client';
import * as xpService from './xp.service';
import * as activityService from './activity.service';

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
    await activityService.createActivity(
      userId,
      'badge',
      `a débloqué le badge "${achievement.name}" ${achievement.icon}`,
      {
        achievementId: achievement.id,
        icon: achievement.icon,
        rarity: achievement.rarity,
        xp_reward: achievement.xp_reward
      },
      true
    );

    // Ajouter les XP si > 0
    if (achievement.xp_reward > 0) {
      await xpService.addXP(
        userId,
        achievement.xp_reward,
        `badge_${achievement.code}`,
        `Badge débloqué: ${achievement.name}`
      );
    }

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

    // Vérifier modules par niveau (comparaison au nombre réel de modules publiés)
    const [totalDebutant, totalIntermediaire, totalAvance] = await Promise.all([
      prisma.learningModule.count({ where: { difficulty_level: 'debutant', is_published: true } }),
      prisma.learningModule.count({ where: { difficulty_level: 'intermediaire', is_published: true } }),
      prisma.learningModule.count({ where: { difficulty_level: 'avance', is_published: true } })
    ]);

    if (totalDebutant > 0 && completedByLevel.debutant >= totalDebutant) toUnlock.push('beginner_investor');
    if (totalIntermediaire > 0 && completedByLevel.intermediaire >= totalIntermediaire) toUnlock.push('intermediate_investor');
    if (totalAvance > 0 && completedByLevel.avance >= totalAvance) toUnlock.push('advanced_investor');

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
 * Vérifie et débloque les achievements engagement d'un utilisateur
 */
export async function checkEngagementAchievements(userId: string) {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        current_streak: true,
        longest_streak: true
      }
    });

    if (!profile) {
      return [];
    }

    const toUnlock: string[] = [];

    // Vérifier les achievements de streak
    const maxStreak = Math.max(profile.current_streak, profile.longest_streak);
    if (maxStreak >= 7) toUnlock.push('streak_7');
    if (maxStreak >= 30) toUnlock.push('streak_30');
    if (maxStreak >= 100) toUnlock.push('streak_100');

    // TODO: Vérifier early_bird, night_owl, weekend_warrior
    // Nécessite un tracking des heures de connexion

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
    console.error('❌ Erreur checkEngagementAchievements:', error);
    throw error;
  }
}

/**
 * Vérifie et débloque les achievements spéciaux d'un utilisateur
 */
export async function checkSpecialAchievements(userId: string) {
  try {
    const [profile, user] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId },
        select: {
          total_xp: true,
          global_rank: true
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          created_at: true
        }
      })
    ]);

    if (!profile || !user) {
      return [];
    }

    const toUnlock: string[] = [];

    // Vérifier XP total
    if (profile.total_xp >= 30000) toUnlock.push('diamond_investor');
    if (profile.total_xp >= 50000) toUnlock.push('legend');

    // Vérifier anniversaire (1 an)
    const accountAgeMs = Date.now() - new Date(user.created_at).getTime();
    const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);
    if (accountAgeDays >= 365) toUnlock.push('anniversary');

    // Vérifier top 10%
    if (profile.global_rank) {
      const totalUsers = await prisma.userProfile.count({
        where: { total_xp: { gt: 0 } }
      });
      const percentile = (profile.global_rank / totalUsers) * 100;
      if (percentile <= 10) toUnlock.push('top_10_percent');
    }

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
    console.error('❌ Erreur checkSpecialAchievements:', error);
    throw error;
  }
}

/**
 * Calcule la progression vers les badges non encore débloqués
 * et retourne les 3 badges les plus proches d'être obtenus
 */
export async function getNextAchievements(userId: string, limit: number = 3) {
  try {
    // 1. Récupérer tous les achievements et ceux déjà débloqués
    const [allAchievements, userAchievements] = await Promise.all([
      prisma.achievement.findMany({ where: { is_hidden: false } }),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true }
      })
    ]);

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));
    const lockedAchievements = allAchievements.filter(a => !unlockedIds.has(a.id));

    if (lockedAchievements.length === 0) {
      return [];
    }

    // 2. Récupérer les données utilisateur en parallèle
    const [
      learningProgress,
      portfolio,
      followersCount,
      profile,
      user,
      moduleCounts
    ] = await Promise.all([
      prisma.learningProgress.findMany({
        where: { userId, is_completed: true },
        include: { module: { select: { difficulty_level: true } } }
      }),
      prisma.portfolio.findFirst({
        where: { userId },
        include: { transactions: true, positions: true }
      }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.userProfile.findUnique({
        where: { userId },
        select: { current_streak: true, longest_streak: true, total_xp: true, global_rank: true }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { created_at: true }
      }),
      Promise.all([
        prisma.learningModule.count({ where: { difficulty_level: 'debutant', is_published: true } }),
        prisma.learningModule.count({ where: { difficulty_level: 'intermediaire', is_published: true } }),
        prisma.learningModule.count({ where: { difficulty_level: 'avance', is_published: true } }),
        prisma.learningModule.count({ where: { is_published: true } })
      ])
    ]);

    const [totalDebutant, totalIntermediaire, totalAvance, totalModules] = moduleCounts;

    // 3. Calculer les métriques utilisateur
    const completedCount = learningProgress.length;
    const completedByLevel = {
      debutant: learningProgress.filter(p => p.module.difficulty_level === 'debutant').length,
      intermediaire: learningProgress.filter(p => p.module.difficulty_level === 'intermediaire').length,
      avance: learningProgress.filter(p => p.module.difficulty_level === 'avance').length
    };
    const perfectQuizzes = learningProgress.filter(p => p.quiz_score === 100).length;
    const transactionsCount = portfolio?.transactions.length || 0;
    const positionsCount = portfolio?.positions.length || 0;
    const maxStreak = Math.max(profile?.current_streak || 0, profile?.longest_streak || 0);
    const totalXP = profile?.total_xp || 0;

    let roi = 0;
    if (portfolio) {
      const totalValue = portfolio.cash_balance +
        portfolio.positions.reduce((sum, p) => sum + (p.quantity * p.average_buy_price), 0);
      roi = ((totalValue - portfolio.initial_balance) / portfolio.initial_balance) * 100;
    }

    const accountAgeDays = user
      ? (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    // 4. Calculer la progression pour chaque badge verrouillé
    const progressList: Array<{
      achievement: typeof allAchievements[0];
      current: number;
      target: number;
      percent: number;
      remaining: string;
    }> = [];

    for (const achievement of lockedAchievements) {
      const criteria = achievement.criteria as any;
      if (!criteria || !criteria.type) continue;

      let current = 0;
      let target = 0;
      let remaining = '';

      switch (criteria.type) {
        case 'modules_completed':
          target = criteria.target === 'all' ? totalModules : criteria.target;
          current = completedCount;
          remaining = `${Math.max(0, target - current)} module(s) restant(s)`;
          break;

        case 'modules_level':
          if (criteria.level === 'debutant') {
            target = totalDebutant;
            current = completedByLevel.debutant;
          } else if (criteria.level === 'intermediaire') {
            target = totalIntermediaire;
            current = completedByLevel.intermediaire;
          } else if (criteria.level === 'avance') {
            target = totalAvance;
            current = completedByLevel.avance;
          }
          remaining = `${Math.max(0, target - current)} module(s) ${criteria.level} restant(s)`;
          break;

        case 'perfect_quizzes':
          target = criteria.target;
          current = perfectQuizzes;
          remaining = `${Math.max(0, target - current)} quiz parfait(s) restant(s)`;
          break;

        case 'transactions':
          target = criteria.target;
          current = transactionsCount;
          remaining = `${Math.max(0, target - current)} transaction(s) restante(s)`;
          break;

        case 'roi':
          target = criteria.target;
          current = Math.max(0, roi);
          remaining = `${Math.max(0, target - current).toFixed(1)}% de ROI restant`;
          break;

        case 'positions':
          target = criteria.target;
          current = positionsCount;
          remaining = `${Math.max(0, target - current)} position(s) restante(s)`;
          break;

        case 'followers':
          target = criteria.target;
          current = followersCount;
          remaining = `${Math.max(0, target - current)} abonné(s) restant(s)`;
          break;

        case 'streak':
          target = criteria.target;
          current = maxStreak;
          remaining = `${Math.max(0, target - current)} jour(s) de série restant(s)`;
          break;

        case 'total_xp':
          target = criteria.target;
          current = totalXP;
          remaining = `${Math.max(0, target - current)} XP restant(s)`;
          break;

        case 'account_age_days':
          target = criteria.target;
          current = Math.floor(accountAgeDays);
          remaining = `${Math.max(0, target - current)} jour(s) restant(s)`;
          break;

        default:
          // Badges qu'on ne peut pas calculer (referrals, login times, etc.)
          continue;
      }

      if (target > 0) {
        const percent = Math.min(100, Math.round((current / target) * 100));
        progressList.push({
          achievement,
          current,
          target,
          percent,
          remaining
        });
      }
    }

    // 5. Trier par pourcentage décroissant (les plus proches d'abord)
    progressList.sort((a, b) => b.percent - a.percent);

    return progressList.slice(0, limit);

  } catch (error) {
    console.error('❌ Erreur getNextAchievements:', error);
    throw error;
  }
}

/**
 * Vérifie tous les achievements d'un utilisateur (fonction générique)
 */
export async function checkAllAchievements(userId: string) {
  try {
    const [formation, trading, social, engagement, special] = await Promise.all([
      checkFormationAchievements(userId),
      checkTradingAchievements(userId),
      checkSocialAchievements(userId),
      checkEngagementAchievements(userId),
      checkSpecialAchievements(userId)
    ]);

    return {
      formation,
      trading,
      social,
      engagement,
      special,
      total: formation.length + trading.length + social.length + engagement.length + special.length
    };

  } catch (error) {
    console.error('❌ Erreur checkAllAchievements:', error);
    throw error;
  }
}