/**
 * Jobs de Gamification Automatiques - AfriBourse
 *
 * Jobs planifiés:
 * - 01h00 quotidien: Vérification des streaks (checkAllStreaks)
 * - 02h00 quotidien: Calcul des classements (calculateRankings)
 * - 00h00 lundi: Génération des défis hebdomadaires (createWeeklyChallenges)
 * - 03h00 1er du mois: Nettoyage des anciennes activités (cleanOldActivities)
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import * as streakService from '../services/streak.service';

const prisma = new PrismaClient();

// =====================================
// CONFIGURATION DES SCHEDULES
// =====================================

const SCHEDULES = {
  CHECK_STREAKS: '0 1 * * *',        // Tous les jours à 01h00
  CALCULATE_RANKINGS: '0 2 * * *',   // Tous les jours à 02h00
  WEEKLY_CHALLENGES: '0 0 * * 1',    // Lundi à 00h00
  CLEANUP: '0 3 1 * *'               // 1er du mois à 03h00
};

// =====================================
// JOB 1: VÉRIFICATION DES STREAKS (01h00)
// =====================================

async function runStreakCheck() {
  console.log('\n' + '='.repeat(60));
  console.log('🔥 [GAMIFICATION] Vérification des séries...');
  console.log('='.repeat(60));

  try {
    const result = await streakService.checkAllStreaks();
    console.log(`✅ [GAMIFICATION] Streaks vérifiés:`);
    console.log(`   - Profils vérifiés: ${result.checked}`);
    console.log(`   - Freezes utilisés: ${result.freezes_used}`);
    console.log(`   - Séries perdues: ${result.streaks_lost}`);
    return result;
  } catch (error: any) {
    console.error('❌ [GAMIFICATION] Erreur vérification streaks:', error.message);
    throw error;
  }
}

// =====================================
// JOB 2: CALCUL DES CLASSEMENTS (02h00)
// =====================================

async function runRankingsCalculation() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 [GAMIFICATION] Calcul des classements...');
  console.log('='.repeat(60));

  try {
    // Récupérer tous les profils avec XP > 0
    const profiles = await prisma.userProfile.findMany({
      where: { total_xp: { gt: 0 } },
      orderBy: { total_xp: 'desc' },
      select: {
        userId: true,
        total_xp: true,
        country: true
      }
    });

    console.log(`   📈 ${profiles.length} profils à classer`);

    // Calculer le classement global
    let globalRank = 1;
    const countryRanks: { [country: string]: number } = {};

    for (const profile of profiles) {
      const country = profile.country || 'unknown';

      // Initialiser le rang par pays
      if (!countryRanks[country]) {
        countryRanks[country] = 1;
      }

      // Mettre à jour les rangs
      await prisma.userProfile.update({
        where: { userId: profile.userId },
        data: {
          global_rank: globalRank,
          country_rank: countryRanks[country]
        }
      });

      globalRank++;
      countryRanks[country]++;
    }

    const countriesCount = Object.keys(countryRanks).length;
    console.log(`✅ [GAMIFICATION] Classements calculés:`);
    console.log(`   - Profils classés: ${profiles.length}`);
    console.log(`   - Pays: ${countriesCount}`);

    return { profiles_ranked: profiles.length, countries: countriesCount };

  } catch (error: any) {
    console.error('❌ [GAMIFICATION] Erreur calcul rankings:', error.message);
    throw error;
  }
}

// =====================================
// JOB 3: DÉFIS HEBDOMADAIRES (Lundi 00h00)
// =====================================

async function runWeeklyChallengesGeneration() {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 [GAMIFICATION] Génération des défis hebdomadaires...');
  console.log('='.repeat(60));

  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Archiver les défis de la semaine précédente
    const archivedCount = await prisma.userChallengeProgress.updateMany({
      where: {
        challenge: {
          end_date: { lt: now }
        },
        completed: false
      },
      data: {
        // Marquer comme expiré (si le champ existe)
      }
    });

    console.log(`   📦 ${archivedCount.count} défis archivés`);

    // Définir les défis de la semaine
    const challengeTemplates = [
      // Formation
      { name: 'Lecteur Assidu', description: 'Compléter 3 modules', type: 'module', target: 3, xp_reward: 300 },
      { name: 'Champion Quiz', description: 'Réussir 5 quiz', type: 'quiz', target: 5, xp_reward: 200 },
      // Trading
      { name: 'Trader Semaine', description: '10 transactions', type: 'trade', target: 10, xp_reward: 200 },
      { name: 'Diversificateur', description: '5 actions différentes', type: 'trade', target: 5, xp_reward: 250 },
      // Engagement
      { name: 'Série Parfaite', description: '7/7 jours actifs', type: 'streak', target: 7, xp_reward: 500 }
    ];

    // Sélectionner 5 défis aléatoires
    const selectedChallenges = challengeTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    // Créer les défis
    let created = 0;
    for (const template of selectedChallenges) {
      await prisma.weeklyChallenge.create({
        data: {
          title: template.name,
          description: template.description,
          challenge_type: template.type as any,
          target: template.target,
          xp_reward: template.xp_reward,
          start_date: weekStart,
          end_date: weekEnd,
          is_active: true
        }
      });
      created++;
    }

    // Récupérer les utilisateurs actifs (actifs dans les 30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await prisma.userProfile.findMany({
      where: {
        last_activity_date: { gte: thirtyDaysAgo }
      },
      select: { userId: true }
    });

    console.log(`✅ [GAMIFICATION] Défis hebdomadaires créés:`);
    console.log(`   - Nouveaux défis: ${created}`);
    console.log(`   - Utilisateurs actifs: ${activeUsers.length}`);

    return { challenges_created: created, active_users: activeUsers.length };

  } catch (error: any) {
    console.error('❌ [GAMIFICATION] Erreur génération défis:', error.message);
    throw error;
  }
}

// =====================================
// JOB 4: NETTOYAGE (1er du mois 03h00)
// =====================================

async function runCleanup() {
  console.log('\n' + '='.repeat(60));
  console.log('🧹 [GAMIFICATION] Nettoyage des données anciennes...');
  console.log('='.repeat(60));

  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Supprimer les activités > 90 jours (sauf badges et milestones)
    const deletedActivities = await prisma.userActivity.deleteMany({
      where: {
        created_at: { lt: ninetyDaysAgo },
        type: { notIn: ['badge', 'level_up', 'milestone'] }
      }
    });

    // Supprimer l'historique XP > 90 jours
    const deletedXPHistory = await prisma.xPHistory.deleteMany({
      where: {
        created_at: { lt: ninetyDaysAgo }
      }
    });

    // Nettoyer les défis expirés
    const deletedChallenges = await prisma.userChallengeProgress.deleteMany({
      where: {
        challenge: {
          end_date: { lt: ninetyDaysAgo }
        }
      }
    });

    console.log(`✅ [GAMIFICATION] Nettoyage terminé:`);
    console.log(`   - Activités supprimées: ${deletedActivities.count}`);
    console.log(`   - Historique XP supprimé: ${deletedXPHistory.count}`);
    console.log(`   - Progressions défis supprimées: ${deletedChallenges.count}`);

    return {
      activities_deleted: deletedActivities.count,
      xp_history_deleted: deletedXPHistory.count,
      challenges_deleted: deletedChallenges.count
    };

  } catch (error: any) {
    console.error('❌ [GAMIFICATION] Erreur nettoyage:', error.message);
    throw error;
  }
}

// =====================================
// INITIALISATION DES JOBS
// =====================================

console.log('🎮 [GAMIFICATION JOBS] Initialisation...');

// Job 1: Vérification des streaks (01h00)
cron.schedule(SCHEDULES.CHECK_STREAKS, runStreakCheck, {
  timezone: 'Africa/Abidjan'
});
console.log('   ✅ Job streaks activé (01h00 quotidien)');

// Job 2: Calcul des classements (02h00)
cron.schedule(SCHEDULES.CALCULATE_RANKINGS, runRankingsCalculation, {
  timezone: 'Africa/Abidjan'
});
console.log('   ✅ Job rankings activé (02h00 quotidien)');

// Job 3: Défis hebdomadaires (Lundi 00h00)
cron.schedule(SCHEDULES.WEEKLY_CHALLENGES, runWeeklyChallengesGeneration, {
  timezone: 'Africa/Abidjan'
});
console.log('   ✅ Job défis hebdo activé (Lundi 00h00)');

// Job 4: Nettoyage (1er du mois 03h00)
cron.schedule(SCHEDULES.CLEANUP, runCleanup, {
  timezone: 'Africa/Abidjan'
});
console.log('   ✅ Job nettoyage activé (1er du mois 03h00)');

console.log('🎮 [GAMIFICATION JOBS] Tous les jobs sont actifs!');

// =====================================
// EXPORTS POUR EXÉCUTION MANUELLE
// =====================================

export {
  runStreakCheck,
  runRankingsCalculation,
  runWeeklyChallengesGeneration,
  runCleanup
};

export default {
  runStreakCheck,
  runRankingsCalculation,
  runWeeklyChallengesGeneration,
  runCleanup
};
