import { log } from '../config/logger';
// backend/src/services/weekly-challenge.service.ts
// Service pour gérer les défis hebdomadaires
// Système de gamification AfriBourse

import { prisma } from '../config/database';
import * as xpService from './xp.service';
import * as activityService from './activity.service';
import * as achievementService from './achievement.service';

// =====================================
// TYPES
// =====================================

export type ChallengeType = 'module' | 'quiz' | 'trade' | 'social' | 'streak';

export interface ChallengeTemplate {
  code: string;
  name: string;
  description: string;
  type: ChallengeType;
  target: number;
  xp_reward: number;
  badge_code?: string;
}

// =====================================
// TEMPLATES DES DÉFIS
// =====================================

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  // Formation
  {
    code: 'complete_3_modules',
    name: 'Lecteur Assidu',
    description: 'Compléter 3 modules de formation',
    type: 'module',
    target: 3,
    xp_reward: 300
  },
  {
    code: 'pass_5_quizzes',
    name: 'Champion Quiz',
    description: 'Réussir 5 quiz',
    type: 'quiz',
    target: 5,
    xp_reward: 200
  },
  {
    code: 'perfect_2_quizzes',
    name: 'Perfectionniste',
    description: 'Obtenir 100% à 2 quiz',
    type: 'quiz',
    target: 2,
    xp_reward: 150
  },

  // Trading
  {
    code: 'make_10_trades',
    name: 'Trader de la Semaine',
    description: 'Effectuer 10 transactions',
    type: 'trade',
    target: 10,
    xp_reward: 200
  },
  {
    code: 'trade_5_stocks',
    name: 'Diversificateur',
    description: 'Trader 5 actions différentes',
    type: 'trade',
    target: 5,
    xp_reward: 250
  },
  {
    code: 'profitable_3_trades',
    name: 'Précision',
    description: 'Réaliser 3 trades rentables',
    type: 'trade',
    target: 3,
    xp_reward: 300
  },

  // Social
  {
    code: 'follow_5_users',
    name: 'Networker',
    description: 'Suivre 5 nouvelles personnes',
    type: 'social',
    target: 5,
    xp_reward: 150
  },
  {
    code: 'invite_2_friends',
    name: 'Parrain',
    description: 'Inviter 2 amis',
    type: 'social',
    target: 2,
    xp_reward: 400
  },
  {
    code: 'make_10_interactions',
    name: 'Actif',
    description: 'Faire 10 interactions (likes, commentaires)',
    type: 'social',
    target: 10,
    xp_reward: 100
  },

  // Engagement
  {
    code: 'perfect_week',
    name: 'Série Parfaite',
    description: 'Être actif 7 jours sur 7',
    type: 'streak',
    target: 7,
    xp_reward: 500,
    badge_code: 'perfect_week'
  },
  {
    code: 'daily_login',
    name: 'Régularité',
    description: 'Se connecter chaque jour de la semaine',
    type: 'streak',
    target: 7,
    xp_reward: 200
  }
];

// =====================================
// GÉNÉRATION DES DÉFIS
// =====================================

/**
 * Génère les défis hebdomadaires (appelé chaque lundi à 00h00)
 * Sélectionne 5-7 défis aléatoires parmi les templates
 */
export async function generateWeeklyChallenges(challengeCount: number = 5) {
  try {
    log.debug('🎯 Génération des défis hebdomadaires...');

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    // Vérifier si des défis existent déjà pour cette semaine
    const existingChallenges = await prisma.weeklyChallenge.findMany({
      where: {
        start_date: { gte: weekStart },
        end_date: { lte: weekEnd }
      }
    });

    if (existingChallenges.length > 0) {
      log.debug(`   ⚠️ ${existingChallenges.length} défis existent déjà pour cette semaine`);
      return { created: 0, existing: existingChallenges.length };
    }

    // Sélectionner des défis aléatoires (un de chaque catégorie + bonus)
    const selectedTemplates = selectRandomChallenges(challengeCount);

    // Créer les défis
    const createdChallenges = [];
    for (const template of selectedTemplates) {
      const challenge = await prisma.weeklyChallenge.create({
        data: {
          title: template.name,
          description: template.description,
          challenge_type: template.type,
          target: template.target,
          xp_reward: template.xp_reward,
          badge_code: template.badge_code,
          start_date: weekStart,
          end_date: weekEnd,
          is_active: true
        }
      });
      createdChallenges.push(challenge);
      log.debug(`   ✅ Créé: ${template.name}`);
    }

    log.debug(`🎯 ${createdChallenges.length} défis créés pour la semaine`);

    return {
      created: createdChallenges.length,
      challenges: createdChallenges,
      week_start: weekStart,
      week_end: weekEnd
    };

  } catch (error) {
    log.error('❌ Erreur generateWeeklyChallenges:', error);
    throw error;
  }
}

/**
 * Sélectionne des défis aléatoires équilibrés par catégorie
 */
function selectRandomChallenges(count: number): ChallengeTemplate[] {
  // Grouper par type
  const byType: { [key: string]: ChallengeTemplate[] } = {};
  for (const template of CHALLENGE_TEMPLATES) {
    if (!byType[template.type]) {
      byType[template.type] = [];
    }
    byType[template.type].push(template);
  }

  const selected: ChallengeTemplate[] = [];
  const types = Object.keys(byType);

  // Sélectionner au moins un de chaque type (si possible)
  for (const type of types) {
    if (selected.length < count && byType[type].length > 0) {
      const randomIndex = Math.floor(Math.random() * byType[type].length);
      selected.push(byType[type][randomIndex]);
      byType[type].splice(randomIndex, 1); // Retirer pour éviter les doublons
    }
  }

  // Compléter avec des défis aléatoires
  const remaining = CHALLENGE_TEMPLATES.filter(t => !selected.includes(t));
  while (selected.length < count && remaining.length > 0) {
    const randomIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining[randomIndex]);
    remaining.splice(randomIndex, 1);
  }

  return selected;
}

// =====================================
// RÉCUPÉRATION DES DÉFIS
// =====================================

/**
 * Récupère les défis de la semaine en cours
 */
export async function getCurrentWeekChallenges() {
  try {
    const now = new Date();

    const challenges = await prisma.weeklyChallenge.findMany({
      where: {
        start_date: { lte: now },
        end_date: { gte: now },
        is_active: true
      },
      orderBy: { xp_reward: 'desc' }
    });

    return challenges;

  } catch (error) {
    log.error('❌ Erreur getCurrentWeekChallenges:', error);
    throw error;
  }
}

/**
 * Récupère les défis avec la progression de l'utilisateur
 */
export async function getUserChallengesProgress(userId: string) {
  try {
    const challenges = await getCurrentWeekChallenges();

    if (challenges.length === 0) {
      return { challenges: [], message: 'Aucun défi cette semaine' };
    }

    // Récupérer la progression de l'utilisateur
    const userProgress = await prisma.userChallengeProgress.findMany({
      where: {
        userId,
        challengeId: { in: challenges.map(c => c.id) }
      }
    });

    const progressMap = new Map(userProgress.map(p => [p.challengeId, p]));

    // Combiner les défis avec la progression
    const challengesWithProgress = challenges.map(challenge => {
      const progress = progressMap.get(challenge.id);
      return {
        ...challenge,
        current: progress?.current || 0,
        completed: progress?.completed || false,
        completed_at: progress?.completed_at || null,
        claimed: progress?.claimed || false,
        progress_percent: Math.min(100, ((progress?.current || 0) / challenge.target) * 100)
      };
    });

    // Calculer les stats
    const stats = {
      total: challenges.length,
      completed: challengesWithProgress.filter(c => c.completed).length,
      claimed: challengesWithProgress.filter(c => c.claimed).length,
      xp_available: challengesWithProgress
        .filter(c => c.completed && !c.claimed)
        .reduce((sum, c) => sum + c.xp_reward, 0)
    };

    return {
      challenges: challengesWithProgress,
      stats
    };

  } catch (error) {
    log.error('❌ Erreur getUserChallengesProgress:', error);
    throw error;
  }
}

// =====================================
// MISE À JOUR DE LA PROGRESSION
// =====================================

/**
 * Met à jour la progression d'un défi pour un utilisateur
 * @param userId - ID de l'utilisateur
 * @param challengeType - Type du défi (module, quiz, trade, social, streak)
 * @param increment - Valeur à ajouter (par défaut 1)
 */
export async function updateChallengeProgress(
  userId: string,
  challengeType: ChallengeType,
  increment: number = 1
) {
  try {
    // Trouver les défis actifs de ce type
    const now = new Date();
    const activeChallenges = await prisma.weeklyChallenge.findMany({
      where: {
        challenge_type: challengeType,
        start_date: { lte: now },
        end_date: { gte: now },
        is_active: true
      }
    });

    if (activeChallenges.length === 0) {
      return { updated: 0 };
    }

    const results = [];

    for (const challenge of activeChallenges) {
      // Récupérer ou créer la progression
      let progress = await prisma.userChallengeProgress.findUnique({
        where: {
          userId_challengeId: { userId, challengeId: challenge.id }
        }
      });

      if (!progress) {
        // Créer une nouvelle progression
        progress = await prisma.userChallengeProgress.create({
          data: {
            userId,
            challengeId: challenge.id,
            current: 0,
            completed: false,
            claimed: false
          }
        });
      }

      // Si déjà complété, ne rien faire
      if (progress.completed) {
        continue;
      }

      // Mettre à jour la progression
      const newCurrent = progress.current + increment;
      const isCompleted = newCurrent >= challenge.target;

      await prisma.userChallengeProgress.update({
        where: {
          userId_challengeId: { userId, challengeId: challenge.id }
        },
        data: {
          current: newCurrent,
          completed: isCompleted,
          completed_at: isCompleted ? new Date() : null
        }
      });

      if (isCompleted) {
        log.debug(`🎯 ${userId} a complété le défi "${challenge.title}"`);

        // Créer une activité
        await activityService.createActivity(
          userId,
          'milestone',
          `a complété le défi "${challenge.title}" 🎯`,
          {
            challengeId: challenge.id,
            xp_reward: challenge.xp_reward
          },
          true
        );
      }

      results.push({
        challengeId: challenge.id,
        name: challenge.title,
        previous: progress.current,
        current: newCurrent,
        target: challenge.target,
        completed: isCompleted
      });
    }

    return {
      updated: results.length,
      results
    };

  } catch (error) {
    log.error('❌ Erreur updateChallengeProgress:', error);
    throw error;
  }
}

// =====================================
// RÉCLAMATION DES RÉCOMPENSES
// =====================================

/**
 * Réclame la récompense d'un défi complété
 */
export async function claimChallengeReward(userId: string, challengeId: string) {
  try {
    // Récupérer la progression
    const progress = await prisma.userChallengeProgress.findUnique({
      where: {
        userId_challengeId: { userId, challengeId }
      },
      include: {
        challenge: true
      }
    });

    if (!progress) {
      throw new Error('Progression non trouvée');
    }

    if (!progress.completed) {
      throw new Error('Défi non complété');
    }

    if (progress.claimed) {
      throw new Error('Récompense déjà réclamée');
    }

    // Marquer comme réclamé
    await prisma.userChallengeProgress.update({
      where: {
        userId_challengeId: { userId, challengeId }
      },
      data: {
        claimed: true
      }
    });

    // Ajouter les XP
    const xpResult = await xpService.addXP(
      userId,
      progress.challenge.xp_reward,
      'challenge_completed',
      `Défi complété: ${progress.challenge.title}`
    );

    // Débloquer le badge si présent
    if (progress.challenge.badge_code) {
      await achievementService.unlockAchievement(userId, progress.challenge.badge_code);
    }

    log.debug(`✅ ${userId} a réclamé ${progress.challenge.xp_reward} XP pour "${progress.challenge.title}"`);

    return {
      success: true,
      challenge: progress.challenge,
      xp_earned: progress.challenge.xp_reward,
      xp_result: xpResult,
      badge_unlocked: progress.challenge.badge_code || null
    };

  } catch (error) {
    log.error('❌ Erreur claimChallengeReward:', error);
    throw error;
  }
}

/**
 * Réclame toutes les récompenses des défis complétés
 */
export async function claimAllChallengeRewards(userId: string) {
  try {
    // Trouver tous les défis complétés non réclamés
    const unclaimedProgress = await prisma.userChallengeProgress.findMany({
      where: {
        userId,
        completed: true,
        claimed: false
      },
      include: {
        challenge: true
      }
    });

    if (unclaimedProgress.length === 0) {
      return { claimed: 0, message: 'Aucune récompense à réclamer' };
    }

    let totalXP = 0;
    const claimed = [];

    for (const progress of unclaimedProgress) {
      const result = await claimChallengeReward(userId, progress.challengeId);
      totalXP += progress.challenge.xp_reward;
      claimed.push({
        name: progress.challenge.title,
        xp: progress.challenge.xp_reward
      });
    }

    return {
      claimed: claimed.length,
      total_xp: totalXP,
      details: claimed
    };

  } catch (error) {
    log.error('❌ Erreur claimAllChallengeRewards:', error);
    throw error;
  }
}

// =====================================
// ARCHIVAGE
// =====================================

/**
 * Archive les défis expirés
 */
export async function archiveExpiredChallenges() {
  try {
    const now = new Date();

    // Désactiver les défis expirés
    const result = await prisma.weeklyChallenge.updateMany({
      where: {
        end_date: { lt: now },
        is_active: true
      },
      data: {
        is_active: false
      }
    });

    log.debug(`📦 ${result.count} défis archivés`);

    return { archived: result.count };

  } catch (error) {
    log.error('❌ Erreur archiveExpiredChallenges:', error);
    throw error;
  }
}

// =====================================
// HELPERS
// =====================================

/**
 * Retourne le temps restant avant la fin de la semaine
 */
export function getTimeUntilWeekEnd(): { days: number; hours: number; minutes: number } {
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
  nextMonday.setHours(0, 0, 0, 0);

  const diffMs = nextMonday.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    days: diffDays,
    hours: diffHours,
    minutes: diffMinutes
  };
}
