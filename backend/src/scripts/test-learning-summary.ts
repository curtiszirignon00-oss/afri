// Script de test pour envoyer un résumé d'apprentissage à un utilisateur spécifique
import { PrismaClient } from '@prisma/client';
import { getLearningStatsForUser } from '../services/learning-summary.service';
import { sendLearningSummaryEmail } from '../services/email.service';

const prisma = new PrismaClient();

async function testLearningSummary() {
  const targetEmail = process.argv[2] || 'contact@africbourse.com';

  console.log('📚 Test d\'envoi du résumé d\'apprentissage hebdomadaire');
  console.log(`📧 Email cible: ${targetEmail}`);
  console.log('─'.repeat(50));

  try {
    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
      },
    });

    if (!user) {
      console.error(`❌ Utilisateur non trouvé: ${targetEmail}`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.name} ${user.lastname || ''} (${user.id})`);

    // Calculer les statistiques
    console.log('\n📊 Calcul des statistiques d\'apprentissage...');
    const stats = await getLearningStatsForUser(user.id);

    if (!stats) {
      console.log('⚠️  Pas de données d\'apprentissage pour cet utilisateur');
      console.log('   Envoi d\'un email de test avec des données fictives...');

      // Envoyer un email de test avec des données fictives
      await sendLearningSummaryEmail({
        email: user.email,
        name: user.name || 'Utilisateur',
        learningStats: {
          totalModulesCompleted: 5,
          totalModulesAvailable: 20,
          completionPercent: 25,
          totalTimeSpentMinutes: 180,
          averageQuizScore: 85,
          weeklyModulesCompleted: 2,
          weeklyQuizzesTaken: 2,
          weeklyTimeSpentMinutes: 45,
          weeklyXpEarned: 450,
          currentStreak: 7,
          currentLevel: 3,
          totalXp: 1500,
          recentCompletedModules: [
            {
              title: 'Introduction à la Bourse',
              slug: 'introduction-bourse',
              quizScore: 90,
              completedAt: new Date(),
            },
            {
              title: 'Les Indicateurs Financiers',
              slug: 'indicateurs-financiers',
              quizScore: 80,
              completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
          ],
          suggestedModules: [
            {
              title: 'Analyse Technique',
              slug: 'analyse-technique',
              difficulty: 'intermediaire',
              durationMinutes: 30,
            },
            {
              title: 'Gestion de Portefeuille',
              slug: 'gestion-portefeuille',
              difficulty: 'avance',
              durationMinutes: 45,
            },
          ],
          recentAchievements: [
            {
              name: 'Premier Pas',
              description: 'Complétez votre premier module',
              unlockedAt: new Date(),
            },
          ],
          period: 'du 9 au 16 janvier 2026',
          isReminder: false,
        },
      });

      console.log(`\n✅ Email de test envoyé à ${user.email}`);
      return;
    }

    // Afficher les statistiques
    console.log('\n📈 Statistiques calculées:');
    console.log(`   → Modules complétés: ${stats.totalModulesCompleted}/${stats.totalModulesAvailable} (${stats.completionPercent.toFixed(1)}%)`);
    console.log(`   → Cette semaine: ${stats.weeklyModulesCompleted} modules, ${stats.weeklyQuizzesTaken} quiz`);
    console.log(`   → XP gagnés cette semaine: +${stats.weeklyXpEarned}`);
    console.log(`   → Niveau: ${stats.currentLevel} | Streak: ${stats.currentStreak} jours`);
    console.log(`   → Score moyen quiz: ${stats.averageQuizScore.toFixed(1)}%`);
    console.log(`   → Temps total: ${stats.totalTimeSpentMinutes} min`);

    if (stats.recentCompletedModules.length > 0) {
      console.log(`   → Modules complétés cette semaine:`);
      stats.recentCompletedModules.forEach(m => {
        console.log(`      - ${m.title}${m.quizScore ? ` (${m.quizScore}%)` : ''}`);
      });
    }

    if (stats.recentAchievements.length > 0) {
      console.log(`   → Badges débloqués:`);
      stats.recentAchievements.forEach(a => {
        console.log(`      - ${a.name}`);
      });
    }

    // Envoyer l'email
    console.log('\n📧 Envoi de l\'email...');
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
        isReminder: false,
      },
    });

    console.log(`\n✅ Email envoyé avec succès à ${stats.email}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testLearningSummary();
