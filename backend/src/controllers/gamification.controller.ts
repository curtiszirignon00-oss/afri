// backend/src/controllers/gamification.controller.ts
// Contrôleur pour le système de gamification AfriBourse

import { Request, Response, NextFunction } from 'express';
import * as xpService from '../services/xp.service';
import * as achievementService from '../services/achievement.service';
import * as streakService from '../services/streak.service';
import * as weeklyChallengeService from '../services/weekly-challenge.service';
import * as gamificationLeaderboardService from '../services/gamification-leaderboard.service';
import {
  LEVEL_TITLES,
  LEVEL_FEATURES,
  XP_REWARDS,
  WEEKLY_CHALLENGES
} from '../types/gamification.types';

// =====================================
// XP ENDPOINTS
// =====================================

/**
 * GET /api/gamification/xp/me
 * Récupère les stats XP de l'utilisateur connecté
 */
export async function getMyXPStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const stats = await xpService.getUserXPStats(userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gamification/xp/history
 * Récupère l'historique XP de l'utilisateur
 */
export async function getXPHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const history = await xpService.getXPHistory(userId, limit);
    res.json(history);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/gamification/xp/add (INTERNAL/ADMIN)
 * Ajoute manuellement de l'XP à un utilisateur
 */
export async function addXP(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, amount, reason, description, metadata } = req.body;

    if (!userId || !amount || !reason) {
      return res.status(400).json({ error: 'userId, amount et reason sont requis' });
    }

    const result = await xpService.addXP(userId, amount, reason, description, metadata);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// =====================================
// LEVELS ENDPOINTS
// =====================================

/**
 * GET /api/gamification/levels
 * Récupère la configuration des niveaux et titres
 */
export async function getLevelsConfig(_req: Request, res: Response) {
  res.json({
    titles: LEVEL_TITLES,
    features: LEVEL_FEATURES,
    formula: 'XP = 50 × N × (N + 1)',
    max_level: 100
  });
}

/**
 * GET /api/gamification/levels/features
 * Récupère les features débloquées par niveau pour l'utilisateur
 */
export async function getMyUnlockedFeatures(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const unlockedFeatures = await xpService.getUnlockedFeatures(userId);
    const stats = await xpService.getUserXPStats(userId);

    // Toutes les features avec statut débloqué ou non
    const allFeatures = LEVEL_FEATURES.map(feature => ({
      ...feature,
      unlocked: stats.level >= feature.level,
      levels_until_unlock: Math.max(0, feature.level - stats.level)
    }));

    res.json({
      current_level: stats.level,
      unlocked_features: unlockedFeatures,
      all_features: allFeatures
    });
  } catch (error) {
    next(error);
  }
}

// =====================================
// STREAK ENDPOINTS
// =====================================

/**
 * GET /api/gamification/streak/me
 * Récupère les stats de streak de l'utilisateur
 */
export async function getMyStreak(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const streakStats = await streakService.getStreakStats(userId);
    res.json(streakStats);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/gamification/streak/freeze
 * Utilise un freeze de streak
 */
export async function useStreakFreeze(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const result = await streakService.useFreeze(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// =====================================
// ACHIEVEMENTS ENDPOINTS
// =====================================

/**
 * GET /api/gamification/achievements
 * Liste tous les badges disponibles
 */
export async function getAllAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const achievements = await achievementService.getAllAchievements();
    res.json(achievements);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gamification/achievements/me
 * Récupère les badges de l'utilisateur connecté
 */
export async function getMyAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const achievements = await achievementService.getUserAchievements(userId);
    res.json(achievements);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gamification/achievements/me/progress
 * Récupère tous les badges avec le statut de déblocage
 */
export async function getAchievementsProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const progress = await achievementService.getAchievementsWithProgress(userId);
    res.json(progress);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/gamification/achievements/check
 * Vérifie et débloque les achievements éligibles
 */
export async function checkAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { category } = req.body;

    let result;
    if (category) {
      switch (category) {
        case 'formation':
          result = await achievementService.checkFormationAchievements(userId);
          break;
        case 'trading':
          result = await achievementService.checkTradingAchievements(userId);
          break;
        case 'social':
          result = await achievementService.checkSocialAchievements(userId);
          break;
        default:
          result = await achievementService.checkAllAchievements(userId);
      }
    } else {
      result = await achievementService.checkAllAchievements(userId);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
}

// =====================================
// REWARDS ENDPOINTS
// =====================================

/**
 * GET /api/gamification/rewards
 * Liste toutes les récompenses disponibles
 */
export async function getAllRewards(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const stats = userId ? await xpService.getUserXPStats(userId) : null;

    // Importer le client Prisma
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const rewards = await prisma.reward.findMany({
      where: { is_active: true },
      orderBy: { xp_required: 'asc' }
    });

    // Ajouter le statut débloqué si l'utilisateur est connecté
    const rewardsWithStatus = rewards.map(reward => ({
      ...reward,
      unlocked: stats ? stats.total_xp >= reward.xp_required : false,
      xp_needed: stats ? Math.max(0, reward.xp_required - stats.total_xp) : reward.xp_required
    }));

    res.json(rewardsWithStatus);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gamification/rewards/me
 * Récupère les récompenses de l'utilisateur
 */
export async function getMyRewards(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const rewards = await xpService.getUserRewards(userId);
    res.json(rewards);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/gamification/rewards/:id/claim
 * Réclame une récompense
 */
export async function claimReward(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { id } = req.params;
    const result = await xpService.claimReward(userId, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// =====================================
// CONFIG ENDPOINTS
// =====================================

/**
 * GET /api/gamification/config
 * Récupère toute la configuration de gamification (public)
 */
export async function getGamificationConfig(_req: Request, res: Response) {
  res.json({
    xp_rewards: XP_REWARDS,
    level_titles: LEVEL_TITLES,
    level_features: LEVEL_FEATURES,
    weekly_challenges: WEEKLY_CHALLENGES,
    formula: {
      description: 'XP nécessaire pour niveau N = 50 × N × (N + 1)',
      examples: [
        { level: 1, xp: 100 },
        { level: 5, xp: 1500 },
        { level: 10, xp: 5500 },
        { level: 25, xp: 32500 },
        { level: 50, xp: 127500 },
        { level: 100, xp: 505000 }
      ]
    },
    streak_actions: [
      'Compléter un module',
      'Réussir un quiz',
      'Effectuer une transaction',
      'Lire un article (3+ min)',
      'Visiter un profil',
      'Modifier son profil',
      "S'abonner à un utilisateur",
      'Commenter une activité'
    ]
  });
}

/**
 * GET /api/gamification/summary
 * Récupère un résumé complet de la gamification pour l'utilisateur
 */
export async function getGamificationSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer toutes les données en parallèle
    const [xpStats, streakStats, achievements, rewards] = await Promise.all([
      xpService.getUserXPStats(userId),
      streakService.getStreakStats(userId),
      achievementService.getUserAchievements(userId),
      xpService.getUserRewards(userId)
    ]);

    res.json({
      xp: xpStats,
      streak: streakStats,
      achievements: {
        total_unlocked: achievements.length,
        recent: achievements.slice(0, 5)
      },
      rewards: {
        total_unlocked: rewards.length,
        unclaimed: rewards.filter((r: any) => !r.claimed).length
      }
    });
  } catch (error) {
    next(error);
  }
}

// =====================================
// WEEKLY CHALLENGES ENDPOINTS
// =====================================

/**
 * GET /api/gamification/challenges
 * Récupère les défis de la semaine en cours
 */
export async function getWeeklyChallenges(req: Request, res: Response, next: NextFunction) {
  try {
    const challenges = await weeklyChallengeService.getCurrentWeekChallenges();
    const timeRemaining = weeklyChallengeService.getTimeUntilWeekEnd();

    res.json({
      challenges,
      time_remaining: timeRemaining
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gamification/challenges/progress
 * Récupère les défis avec la progression de l'utilisateur
 */
export async function getMyChallengesProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const progress = await weeklyChallengeService.getUserChallengesProgress(userId);
    const timeRemaining = weeklyChallengeService.getTimeUntilWeekEnd();

    res.json({
      ...progress,
      time_remaining: timeRemaining
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/gamification/challenges/:id/claim
 * Réclame la récompense d'un défi complété
 */
export async function claimChallengeReward(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { id } = req.params;
    const result = await weeklyChallengeService.claimChallengeReward(userId, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/gamification/challenges/claim-all
 * Réclame toutes les récompenses des défis complétés
 */
export async function claimAllChallengeRewards(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const result = await weeklyChallengeService.claimAllChallengeRewards(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// =====================================
// LEADERBOARD ENDPOINTS
// =====================================

/**
 * GET /api/gamification/leaderboard/global
 * Récupère le classement global par XP
 */
export async function getGlobalLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 100;

    let leaderboard;
    if (userId) {
      leaderboard = await gamificationLeaderboardService.getGlobalLeaderboardWithUserRank(userId, limit);
    } else {
      leaderboard = await gamificationLeaderboardService.getGlobalLeaderboard(limit);
    }

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gamification/leaderboard/country
 * Récupère le classement du pays de l'utilisateur
 */
export async function getCountryLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const countryCode = req.query.country as string;
    const limit = parseInt(req.query.limit as string) || 50;

    let leaderboard;
    if (countryCode) {
      leaderboard = await gamificationLeaderboardService.getCountryLeaderboard(countryCode, limit);
    } else if (userId) {
      leaderboard = await gamificationLeaderboardService.getCountryLeaderboardForUser(userId, limit);
    } else {
      return res.status(400).json({ error: 'Paramètre country requis ou authentification nécessaire' });
    }

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gamification/leaderboard/friends
 * Récupère le classement parmi les amis
 */
export async function getFriendsLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const leaderboard = await gamificationLeaderboardService.getFriendsLeaderboard(userId);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gamification/leaderboard/roi
 * Récupère le classement ROI mensuel
 */
export async function getROILeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const leaderboard = await gamificationLeaderboardService.getMonthlyROILeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/gamification/leaderboard/streaks
 * Récupère le classement par streak
 */
export async function getStreakLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const leaderboard = await gamificationLeaderboardService.getStreakLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
}
