import { log } from '../config/logger';
// backend/src/services/streak.service.ts
// Service pour gérer les séries (streaks) quotidiennes
// Inspiré de Duolingo pour AfriBourse

import { prisma } from '../config/database';
import * as xpService from './xp.service';
import * as activityService from './activity.service';
import { STREAK_ACTIONS, StreakAction, StreakStats, XP_REWARDS } from '../types/gamification.types';

// =====================================
// CONSTANTES
// =====================================

const MAX_FREEZES = 5; // Maximum de freezes stockables

/**
 * Vérifie si une action compte pour le streak
 */
export function isStreakAction(action: string): action is StreakAction {
  return STREAK_ACTIONS.includes(action as StreakAction);
}

// =====================================
// ENREGISTREMENT ACTIVITÉ
// =====================================

/**
 * Enregistre une activité pour maintenir la série
 * @param userId - ID de l'utilisateur
 * @param activityType - Type d'activité
 */
export async function recordActivity(userId: string, activityType: string) {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        current_streak: true,
        longest_streak: true,
        last_activity_date: true
      }
    });

    if (!profile) {
      throw new Error('Profil non trouvé');
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActivity = profile.last_activity_date 
      ? new Date(profile.last_activity_date.getFullYear(), profile.last_activity_date.getMonth(), profile.last_activity_date.getDate())
      : null;

    // Si déjà actif aujourd'hui, ne rien faire
    if (lastActivity && lastActivity.getTime() === today.getTime()) {
      return {
        streak_maintained: false,
        message: 'Activité déjà enregistrée aujourd\'hui',
        current_streak: profile.current_streak
      };
    }

    let newStreak = profile.current_streak;
    let longestStreak = profile.longest_streak;

    // Vérifier si c'est consécutif (hier)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastActivity && lastActivity.getTime() === yesterday.getTime()) {
      // Série maintenue !
      newStreak++;
      log.debug(`🔥 ${userId} maintient sa série ! Jour ${newStreak}`);

      // Ajouter XP pour maintien de série selon les paliers
      if (newStreak === 7) {
        await xpService.addXP(userId, XP_REWARDS.STREAK_7, 'streak_7', 'Série de 7 jours maintenue ! 🔥');
      } else if (newStreak === 30) {
        await xpService.addXP(userId, XP_REWARDS.STREAK_30, 'streak_30', 'Série de 30 jours maintenue ! ⚡');
        // Bonus: +3 freezes pour 30 jours
        await addFreezes(userId, 3, 'Bonus série 30 jours');
      } else if (newStreak === 100) {
        await xpService.addXP(userId, XP_REWARDS.STREAK_100, 'streak_100', 'Série de 100 jours maintenue ! 💪');
      } else if (newStreak === 365) {
        await xpService.addXP(userId, XP_REWARDS.STREAK_365, 'streak_365', 'Série de 365 jours - IMMORTEL ! 🏆');
      }

    } else if (!lastActivity || lastActivity.getTime() < yesterday.getTime()) {
      // Série perdue, recommencer
      if (profile.current_streak > 0) {
        log.debug(`💔 ${userId} a perdu sa série de ${profile.current_streak} jours`);
      }
      newStreak = 1;
    }

    // Mettre à jour le record personnel
    if (newStreak > longestStreak) {
      longestStreak = newStreak;
      log.debug(`🏆 ${userId} nouveau record de série : ${longestStreak} jours !`);
    }

    // Mettre à jour le profil
    await prisma.userProfile.update({
      where: { userId },
      data: {
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_date: now
      }
    });

    return {
      streak_maintained: true,
      current_streak: newStreak,
      longest_streak: longestStreak,
      is_new_record: newStreak === longestStreak && newStreak > 1
    };

  } catch (error) {
    log.error('❌ Erreur recordActivity:', error);
    throw error;
  }
}

// =====================================
// FREEZE (PROTECTION SÉRIE)
// =====================================

/**
 * Utilise un freeze pour protéger la série
 * @param userId - ID de l'utilisateur
 */
export async function useFreeze(userId: string) {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        streak_freezes: true,
        current_streak: true,
        last_activity_date: true
      }
    });

    if (!profile) {
      throw new Error('Profil non trouvé');
    }

    if (profile.streak_freezes <= 0) {
      throw new Error('Aucun freeze disponible');
    }

    // Vérifier si un freeze est nécessaire
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActivity = profile.last_activity_date 
      ? new Date(profile.last_activity_date.getFullYear(), profile.last_activity_date.getMonth(), profile.last_activity_date.getDate())
      : null;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Si activité hier ou aujourd'hui, pas besoin de freeze
    if (lastActivity && (lastActivity.getTime() === yesterday.getTime() || lastActivity.getTime() === today.getTime())) {
      throw new Error('Pas besoin de freeze, votre série est déjà protégée');
    }

    // Utiliser un freeze
    await prisma.userProfile.update({
      where: { userId },
      data: {
        streak_freezes: { decrement: 1 },
        last_activity_date: yesterday // Rétroactif pour maintenir la série
      }
    });

    log.debug(`🧊 ${userId} a utilisé un freeze. Restant: ${profile.streak_freezes - 1}`);

    // Créer une activité
    await activityService.createActivity(
      userId,
      'milestone',
      `a utilisé un Streak Freeze pour protéger sa série de ${profile.current_streak} jours`,
      { freezes_remaining: profile.streak_freezes - 1 },
      false
    );

    return {
      message: 'Freeze utilisé avec succès',
      freezes_remaining: profile.streak_freezes - 1,
      streak_protected: profile.current_streak
    };

  } catch (error) {
    log.error('❌ Erreur useFreeze:', error);
    throw error;
  }
}

/**
 * Ajoute des freezes à un utilisateur (max 5)
 */
export async function addFreezes(userId: string, quantity: number, reason: string) {
  try {
    // Récupérer le nombre actuel de freezes
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { streak_freezes: true }
    });

    if (!profile) {
      throw new Error('Profil non trouvé');
    }

    // Calculer le nouveau nombre (max 5)
    const currentFreezes = profile.streak_freezes;
    const newTotal = Math.min(MAX_FREEZES, currentFreezes + quantity);
    const actualAdded = newTotal - currentFreezes;

    if (actualAdded <= 0) {
      return {
        message: `Vous avez déjà le maximum de freezes (${MAX_FREEZES})`,
        freezes: currentFreezes,
        added: 0
      };
    }

    await prisma.userProfile.update({
      where: { userId },
      data: {
        streak_freezes: newTotal
      }
    });

    log.debug(`🧊 ${userId} a reçu ${actualAdded} freeze(s) - ${reason} (total: ${newTotal})`);

    return {
      message: `${actualAdded} freeze(s) ajouté(s)`,
      reason,
      freezes: newTotal,
      added: actualAdded
    };

  } catch (error) {
    log.error('❌ Erreur addFreezes:', error);
    throw error;
  }
}

/**
 * Actions qui donnent des freezes automatiquement
 */
export const FREEZE_REWARDS = {
  MODULE_COMPLETE: { amount: 1, reason: 'Module complété' },
  FOLLOWER_50: { amount: 2, reason: 'Atteint 50 abonnés' },
  INVITE_FRIEND: { amount: 1, reason: 'Ami invité' },
  STREAK_30: { amount: 3, reason: 'Série de 30 jours' }
};

/**
 * Ajoute un freeze pour une action spécifique
 */
export async function rewardFreezeForAction(
  userId: string,
  actionKey: keyof typeof FREEZE_REWARDS
): Promise<ReturnType<typeof addFreezes>> {
  const reward = FREEZE_REWARDS[actionKey];
  return addFreezes(userId, reward.amount, reward.reason);
}

// =====================================
// VÉRIFICATION QUOTIDIENNE (CRON)
// =====================================

/**
 * Vérifie les séries de tous les utilisateurs (CRON quotidien à 01h00)
 * Utilise automatiquement les freezes ou réinitialise les séries
 */
export async function checkAllStreaks() {
  try {
    log.debug('🔍 Vérification des séries...');

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Trouver les profils avec série active mais pas d'activité hier
    const profiles = await prisma.userProfile.findMany({
      where: {
        current_streak: { gt: 0 },
        OR: [
          { last_activity_date: null },
          { last_activity_date: { lt: yesterday } }
        ]
      },
      select: {
        userId: true,
        current_streak: true,
        longest_streak: true,
        last_activity_date: true,
        streak_freezes: true
      }
    });

    log.debug(`📊 ${profiles.length} profils avec série à risque`);

    let streaksLost = 0;
    let freezesUsed = 0;

    for (const profile of profiles) {
      if (profile.streak_freezes > 0) {
        // Utiliser automatiquement un freeze pour protéger la série
        await prisma.userProfile.update({
          where: { userId: profile.userId },
          data: {
            streak_freezes: { decrement: 1 },
            last_activity_date: yesterday // Rétroactif pour maintenir la série
          }
        });

        log.debug(`🧊 ${profile.userId} - Freeze automatique utilisé. Série de ${profile.current_streak} jours protégée`);
        freezesUsed++;

        // Créer une notification/activité
        await activityService.createActivity(
          profile.userId,
          'milestone',
          `Streak Freeze utilisé automatiquement ! Série de ${profile.current_streak} jours protégée 🧊`,
          {
            streak: profile.current_streak,
            freezes_remaining: profile.streak_freezes - 1,
            auto_used: true
          },
          false
        );

        // TODO: Envoyer notification push
      } else {
        // Pas de freeze, série perdue
        await prisma.userProfile.update({
          where: { userId: profile.userId },
          data: {
            current_streak: 0
          }
        });

        log.debug(`💔 ${profile.userId} a perdu sa série de ${profile.current_streak} jours`);
        streaksLost++;

        // Créer une activité de série perdue
        await activityService.createActivity(
          profile.userId,
          'milestone',
          `A perdu sa série de ${profile.current_streak} jours 💔`,
          {
            lost_streak: profile.current_streak,
            longest_streak: profile.longest_streak
          },
          false
        );

        // TODO: Envoyer notification push de série perdue
      }
    }

    log.debug(`✅ Vérification terminée.`);
    log.debug(`   - ${freezesUsed} freeze(s) utilisé(s) automatiquement`);
    log.debug(`   - ${streaksLost} série(s) perdue(s)`);

    return {
      checked: profiles.length,
      freezes_used: freezesUsed,
      streaks_lost: streaksLost
    };

  } catch (error) {
    log.error('❌ Erreur checkAllStreaks:', error);
    throw error;
  }
}

// =====================================
// STATISTIQUES
// =====================================

/**
 * Récupère les statistiques de série d'un utilisateur
 */
export async function getStreakStats(userId: string) {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        current_streak: true,
        longest_streak: true,
        streak_freezes: true,
        last_activity_date: true
      }
    });

    if (!profile) {
      throw new Error('Profil non trouvé');
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActivity = profile.last_activity_date 
      ? new Date(profile.last_activity_date.getFullYear(), profile.last_activity_date.getMonth(), profile.last_activity_date.getDate())
      : null;

    const isActiveToday = lastActivity && lastActivity.getTime() === today.getTime();

    return {
      current_streak: profile.current_streak,
      longest_streak: profile.longest_streak,
      streak_freezes: profile.streak_freezes,
      is_active_today: isActiveToday,
      last_activity_date: profile.last_activity_date
    };

  } catch (error) {
    log.error('❌ Erreur getStreakStats:', error);
    throw error;
  }
}