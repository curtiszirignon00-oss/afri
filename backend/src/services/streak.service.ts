// backend/src/services/streak.service.ts
// Service pour gérer les séries (streaks) quotidiennes

import { PrismaClient } from '@prisma/client';
import * as xpService from './xp.service';
import * as activityService from './activity.service';

const prisma = new PrismaClient();

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
      console.log(`🔥 ${userId} maintient sa série ! Jour ${newStreak}`);

      // Ajouter XP pour maintien de série
      if (newStreak === 7) {
        await xpService.addXP(userId, 200, 'streak_maintained', 'Série de 7 jours maintenue !');
      } else if (newStreak === 30) {
        await xpService.addXP(userId, 800, 'streak_maintained', 'Série de 30 jours maintenue !');
      }

    } else if (!lastActivity || lastActivity.getTime() < yesterday.getTime()) {
      // Série perdue, recommencer
      if (profile.current_streak > 0) {
        console.log(`💔 ${userId} a perdu sa série de ${profile.current_streak} jours`);
      }
      newStreak = 1;
    }

    // Mettre à jour le record personnel
    if (newStreak > longestStreak) {
      longestStreak = newStreak;
      console.log(`🏆 ${userId} nouveau record de série : ${longestStreak} jours !`);
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
    console.error('❌ Erreur recordActivity:', error);
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

    console.log(`🧊 ${userId} a utilisé un freeze. Restant: ${profile.streak_freezes - 1}`);

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
    console.error('❌ Erreur useFreeze:', error);
    throw error;
  }
}

/**
 * Ajoute des freezes à un utilisateur
 */
export async function addFreezes(userId: string, quantity: number, reason: string) {
  try {
    await prisma.userProfile.update({
      where: { userId },
      data: {
        streak_freezes: { increment: quantity }
      }
    });

    console.log(`🧊 ${userId} a reçu ${quantity} freeze(s) - ${reason}`);

    return {
      message: `${quantity} freeze(s) ajouté(s)`,
      reason
    };

  } catch (error) {
    console.error('❌ Erreur addFreezes:', error);
    throw error;
  }
}

// =====================================
// VÉRIFICATION QUOTIDIENNE (CRON)
// =====================================

/**
 * Vérifie les séries de tous les utilisateurs (CRON quotidien)
 * Réinitialise les séries non maintenues
 */
export async function checkAllStreaks() {
  try {
    console.log('🔍 Vérification des séries...');

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
        last_activity_date: true
      }
    });

    console.log(`📊 ${profiles.length} profils avec série à risque`);

    let streaksLost = 0;

    for (const profile of profiles) {
      // Vérifier si l'utilisateur a des freezes
      const fullProfile = await prisma.userProfile.findUnique({
        where: { userId: profile.userId },
        select: { streak_freezes: true }
      });

      // TODO: Implémenter l'utilisation automatique des freezes si souhaité

      // Réinitialiser la série
      await prisma.userProfile.update({
        where: { userId: profile.userId },
        data: {
          current_streak: 0
        }
      });

      console.log(`💔 ${profile.userId} a perdu sa série de ${profile.current_streak} jours`);
      streaksLost++;
    }

    console.log(`✅ Vérification terminée. ${streaksLost} série(s) perdue(s).`);

    return {
      checked: profiles.length,
      streaks_lost: streaksLost
    };

  } catch (error) {
    console.error('❌ Erreur checkAllStreaks:', error);
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
    console.error('❌ Erreur getStreakStats:', error);
    throw error;
  }
}