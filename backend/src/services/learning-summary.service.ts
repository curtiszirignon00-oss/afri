// Service pour calculer les statistiques d'apprentissage et envoyer les résumés hebdomadaires
import { PrismaClient } from '@prisma/client';
import { sendLearningSummaryEmail } from './email.service';

const prisma = new PrismaClient();

interface UserLearningStats {
  userId: string;
  email: string;
  name: string;
  // Statistiques globales
  totalModulesCompleted: number;
  totalModulesAvailable: number;
  completionPercent: number;
  totalTimeSpentMinutes: number;
  averageQuizScore: number;
  // Statistiques de la semaine
  weeklyModulesCompleted: number;
  weeklyQuizzesTaken: number;
  weeklyTimeSpentMinutes: number;
  weeklyXpEarned: number;
  // Streak et niveau
  currentStreak: number;
  currentLevel: number;
  totalXp: number;
  // Modules récemment complétés cette semaine
  recentCompletedModules: Array<{
    title: string;
    slug: string;
    quizScore?: number;
    completedAt: Date;
  }>;
  // Prochains modules suggérés
  suggestedModules: Array<{
    title: string;
    slug: string;
    difficulty: string;
    durationMinutes?: number;
  }>;
  // Badges récemment débloqués
  recentAchievements: Array<{
    name: string;
    description: string;
    unlockedAt: Date;
  }>;
  // Période du résumé
  period: string;
}

/**
 * Calcule la période hebdomadaire (par exemple: "du 9 au 16 janvier 2026")
 */
function getWeeklyPeriod(): string {
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);

  const formatDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.toLocaleDateString('fr-FR', { month: 'long' });
    const year = date.getFullYear();
    const dayStr = day === 1 ? '1er' : day.toString();
    return `${dayStr} ${month} ${year}`;
  };

  return `du ${formatDate(oneWeekAgo)} au ${formatDate(now)}`;
}

/**
 * Récupère la date d'il y a une semaine
 */
function getOneWeekAgo(): Date {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  oneWeekAgo.setHours(0, 0, 0, 0);
  return oneWeekAgo;
}

/**
 * Calcule les statistiques d'apprentissage d'un utilisateur
 */
async function calculateUserLearningStats(userId: string): Promise<UserLearningStats | null> {
  try {
    const oneWeekAgo = getOneWeekAgo();

    // Récupérer l'utilisateur avec ses données
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        profile: {
          select: {
            level: true,
            total_xp: true,
            current_streak: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Récupérer les progrès d'apprentissage de l'utilisateur
    const allProgress = await prisma.learningProgress.findMany({
      where: { userId },
      include: {
        module: {
          select: {
            title: true,
            slug: true,
            difficulty_level: true,
            duration_minutes: true,
          },
        },
      },
    });

    // Récupérer le nombre total de modules disponibles
    const totalModulesAvailable = await prisma.learningModule.count({
      where: { is_published: true },
    });

    // Progrès complétés
    const completedProgress = allProgress.filter(p => p.is_completed);
    const totalModulesCompleted = completedProgress.length;

    // Modules complétés cette semaine
    const weeklyCompletedModules = completedProgress.filter(
      p => p.completed_at && new Date(p.completed_at) >= oneWeekAgo
    );
    const weeklyModulesCompleted = weeklyCompletedModules.length;

    // Quiz pris cette semaine
    const weeklyQuizzes = allProgress.filter(
      p => p.last_quiz_attempt_at && new Date(p.last_quiz_attempt_at) >= oneWeekAgo
    );
    const weeklyQuizzesTaken = weeklyQuizzes.length;

    // Temps total passé
    const totalTimeSpentMinutes = allProgress.reduce(
      (sum, p) => sum + (p.time_spent_minutes || 0),
      0
    );

    // Temps passé cette semaine (approximation basée sur les modules accédés cette semaine)
    const weeklyAccessedModules = allProgress.filter(
      p => p.last_accessed_at && new Date(p.last_accessed_at) >= oneWeekAgo
    );
    const weeklyTimeSpentMinutes = weeklyAccessedModules.reduce(
      (sum, p) => sum + (p.time_spent_minutes || 0),
      0
    );

    // Score moyen des quiz
    const quizScores = allProgress.filter(p => p.quiz_score !== null).map(p => p.quiz_score!);
    const averageQuizScore = quizScores.length > 0
      ? quizScores.reduce((sum, s) => sum + s, 0) / quizScores.length
      : 0;

    // XP gagnés cette semaine
    const weeklyXpHistory = await prisma.xPHistory.findMany({
      where: {
        userId,
        created_at: { gte: oneWeekAgo },
      },
    });
    const weeklyXpEarned = weeklyXpHistory.reduce((sum, h) => sum + h.amount, 0);

    // Modules récemment complétés (cette semaine)
    const recentCompletedModules = weeklyCompletedModules.slice(0, 5).map(p => ({
      title: p.module.title,
      slug: p.module.slug,
      quizScore: p.quiz_score || undefined,
      completedAt: p.completed_at!,
    }));

    // Prochains modules suggérés (non complétés)
    const completedModuleIds = new Set(completedProgress.map(p => p.moduleId));
    const suggestedModulesData = await prisma.learningModule.findMany({
      where: {
        is_published: true,
        id: { notIn: Array.from(completedModuleIds) },
      },
      orderBy: { order_index: 'asc' },
      take: 3,
      select: {
        title: true,
        slug: true,
        difficulty_level: true,
        duration_minutes: true,
      },
    });

    const suggestedModules = suggestedModulesData.map(m => ({
      title: m.title,
      slug: m.slug,
      difficulty: m.difficulty_level,
      durationMinutes: m.duration_minutes || undefined,
    }));

    // Badges récemment débloqués (cette semaine)
    const recentAchievementsData = await prisma.userAchievement.findMany({
      where: {
        userId,
        unlocked_at: { gte: oneWeekAgo },
      },
      include: {
        achievement: {
          select: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: { unlocked_at: 'desc' },
      take: 5,
    });

    const recentAchievements = recentAchievementsData.map(ua => ({
      name: ua.achievement.name,
      description: ua.achievement.description || '',
      unlockedAt: ua.unlocked_at,
    }));

    const userName = user.name
      ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}`
      : 'Apprenant';

    const completionPercent = totalModulesAvailable > 0
      ? (totalModulesCompleted / totalModulesAvailable) * 100
      : 0;

    return {
      userId: user.id,
      email: user.email,
      name: userName,
      totalModulesCompleted,
      totalModulesAvailable,
      completionPercent,
      totalTimeSpentMinutes,
      averageQuizScore,
      weeklyModulesCompleted,
      weeklyQuizzesTaken,
      weeklyTimeSpentMinutes,
      weeklyXpEarned,
      currentStreak: user.profile?.current_streak || 0,
      currentLevel: user.profile?.level || 1,
      totalXp: user.profile?.total_xp || 0,
      recentCompletedModules,
      suggestedModules,
      recentAchievements,
      period: getWeeklyPeriod(),
    };
  } catch (error) {
    console.error(`[LEARNING SUMMARY] Erreur calcul stats pour user ${userId}:`, error);
    return null;
  }
}

/**
 * Envoie les résumés d'apprentissage à tous les utilisateurs avec de l'activité d'apprentissage
 */
export async function sendWeeklyLearningSummaries(): Promise<void> {
  console.log('📚 Début de l\'envoi des résumés hebdomadaires d\'apprentissage...');

  try {
    const oneWeekAgo = getOneWeekAgo();

    // Récupérer tous les utilisateurs qui ont eu de l'activité d'apprentissage
    // (soit un progrès créé/modifié, soit un module complété, soit un quiz passé)
    const usersWithLearningActivity = await prisma.user.findMany({
      where: {
        OR: [
          // Utilisateurs avec au moins un module commencé
          {
            learningProgress: {
              some: {},
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    console.log(`📧 ${usersWithLearningActivity.length} utilisateur(s) avec activité d'apprentissage trouvé(s)`);

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of usersWithLearningActivity) {
      try {
        // Calculer les stats d'apprentissage
        const stats = await calculateUserLearningStats(user.id);

        if (!stats) {
          console.log(`⏭️  Pas de stats disponibles pour user ${user.id}`);
          skippedCount++;
          continue;
        }

        // Vérifier s'il y a eu de l'activité cette semaine
        const hasWeeklyActivity =
          stats.weeklyModulesCompleted > 0 ||
          stats.weeklyQuizzesTaken > 0 ||
          stats.weeklyXpEarned > 0 ||
          stats.recentAchievements.length > 0;

        // Si aucune activité cette semaine mais a commencé à apprendre, envoyer un rappel
        const shouldSendReminder = !hasWeeklyActivity && stats.totalModulesCompleted > 0;

        // Si jamais commencé et aucune activité, skip
        if (!hasWeeklyActivity && stats.totalModulesCompleted === 0) {
          console.log(`⏭️  Aucune activité pour user ${user.id}, skip`);
          skippedCount++;
          continue;
        }

        // Envoyer l'email
        await sendLearningSummaryEmail({
          email: stats.email,
          name: stats.name,
          learningStats: {
            totalModulesCompleted: stats.totalModulesCompleted,
            totalModulesAvailable: stats.totalModulesAvailable,
            completionPercent: stats.completionPercent,
            totalTimeSpentMinutes: stats.totalTimeSpentMinutes,
            averageQuizScore: stats.averageQuizScore,
            weeklyModulesCompleted: stats.weeklyModulesCompleted,
            weeklyQuizzesTaken: stats.weeklyQuizzesTaken,
            weeklyTimeSpentMinutes: stats.weeklyTimeSpentMinutes,
            weeklyXpEarned: stats.weeklyXpEarned,
            currentStreak: stats.currentStreak,
            currentLevel: stats.currentLevel,
            totalXp: stats.totalXp,
            recentCompletedModules: stats.recentCompletedModules,
            suggestedModules: stats.suggestedModules,
            recentAchievements: stats.recentAchievements,
            period: stats.period,
            isReminder: shouldSendReminder,
          },
        });

        console.log(`✅ Email envoyé à ${stats.email} (${stats.name})${shouldSendReminder ? ' [Rappel]' : ''}`);
        successCount++;

        // Petit délai pour éviter de surcharger le serveur SMTP
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`❌ Erreur envoi email pour user ${user.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📚 Résumé de l'envoi:`);
    console.log(`   → Succès: ${successCount}`);
    console.log(`   → Ignorés: ${skippedCount}`);
    console.log(`   → Erreurs: ${errorCount}`);
    console.log(`   → Total: ${usersWithLearningActivity.length}`);
  } catch (error) {
    console.error('[LEARNING SUMMARY] Erreur globale:', error);
    throw error;
  }
}

/**
 * Calcule et retourne les stats d'un utilisateur spécifique (pour tests)
 */
export async function getLearningStatsForUser(userId: string): Promise<UserLearningStats | null> {
  return calculateUserLearningStats(userId);
}
