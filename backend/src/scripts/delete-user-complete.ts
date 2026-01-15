/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Script pour supprimer COMPLÈTEMENT un utilisateur de TOUTES les tables
 * Usage: npx tsx src/scripts/delete-user-complete.ts
 */

const EMAIL_TO_DELETE = 'curtiszirignon00@gmail.com';

async function deleteUserCompletely() {
  console.log('\n🗑️  SUPPRESSION COMPLÈTE D\'UN UTILISATEUR');
  console.log('='.repeat(70));
  console.log(`\n📧 Email à supprimer : ${EMAIL_TO_DELETE}\n`);

  try {
    // 1. Trouver l'utilisateur
    console.log('🔍 Recherche de l\'utilisateur...');
    const user = await prisma.user.findUnique({
      where: { email: EMAIL_TO_DELETE },
      include: {
        portfolios: true,
        watchlists: true,
        progress: true,
        quizAttempts: true,
      },
    });

    if (!user) {
      console.log(`❌ Aucun utilisateur trouvé avec l'email : ${EMAIL_TO_DELETE}`);
      console.log('   L\'utilisateur n\'existe pas ou a déjà été supprimé.\n');
      await prisma.$disconnect();
      process.exit(0);
    }

    console.log(`✅ Utilisateur trouvé :`);
    console.log(`   → ID: ${user.id}`);
    console.log(`   → Nom: ${user.name} ${user.lastname}`);
    console.log(`   → Email: ${user.email}`);
    console.log(`   → Créé le: ${new Date(user.created_at!).toLocaleString('fr-FR')}`);
    console.log(`   → Email vérifié: ${user.email_verified_at ? 'OUI ✅' : 'NON ❌'}`);
    console.log('');

    // 2. Afficher les données liées
    console.log('📊 Données liées à supprimer :');
    console.log(`   → Portfolios: ${user.portfolios?.length || 0}`);
    console.log(`   → Watchlists: ${user.watchlists?.length || 0}`);
    console.log(`   → Progression modules: ${user.progress?.length || 0}`);
    console.log(`   → Quiz tentatives: ${user.quizAttempts?.length || 0}`);
    console.log('');

    // 3. Supprimer les portfolios et leurs contenus
    if (user.portfolios && user.portfolios.length > 0) {
      console.log('🗑️  Suppression des portfolios...');

      for (const portfolio of user.portfolios) {
        // Supprimer les transactions du portfolio
        const transactionsCount = await prisma.transaction.deleteMany({
          where: { portfolio_id: portfolio.id },
        });
        console.log(`   → Portfolio "${portfolio.name}" : ${transactionsCount.count} transactions supprimées`);

        // Supprimer les positions du portfolio
        const positionsCount = await prisma.position.deleteMany({
          where: { portfolio_id: portfolio.id },
        });
        console.log(`   → Portfolio "${portfolio.name}" : ${positionsCount.count} positions supprimées`);
      }

      // Supprimer les portfolios eux-mêmes
      const portfoliosDeleted = await prisma.portfolio.deleteMany({
        where: { user_id: user.id },
      });
      console.log(`   ✅ ${portfoliosDeleted.count} portfolio(s) supprimé(s)\n`);
    }

    // 4. Supprimer les watchlists
    if (user.watchlists && user.watchlists.length > 0) {
      console.log('🗑️  Suppression des watchlists...');
      const watchlistsDeleted = await prisma.watchlist.deleteMany({
        where: { user_id: user.id },
      });
      console.log(`   ✅ ${watchlistsDeleted.count} watchlist(s) supprimée(s)\n`);
    }

    // 5. Supprimer les progressions de modules
    if (user.progress && user.progress.length > 0) {
      console.log('🗑️  Suppression des progressions de modules...');
      const progressDeleted = await prisma.userProgress.deleteMany({
        where: { user_id: user.id },
      });
      console.log(`   ✅ ${progressDeleted.count} progression(s) supprimée(s)\n`);
    }

    // 6. Supprimer les tentatives de quiz
    if (user.quizAttempts && user.quizAttempts.length > 0) {
      console.log('🗑️  Suppression des tentatives de quiz...');
      const quizAttemptsDeleted = await prisma.quizAttempt.deleteMany({
        where: { user_id: user.id },
      });
      console.log(`   ✅ ${quizAttemptsDeleted.count} tentative(s) de quiz supprimée(s)\n`);
    }

    // 7. Supprimer le UserProfile (si existe)
    console.log('🗑️  Suppression du profil utilisateur...');
    try {
      const profileDeleted = await prisma.userProfile.deleteMany({
        where: { user_id: user.id },
      });
      if (profileDeleted.count > 0) {
        console.log(`   ✅ ${profileDeleted.count} profil(s) supprimé(s)\n`);
      } else {
        console.log(`   ℹ️  Aucun profil à supprimer\n`);
      }
    } catch (error) {
      console.log(`   ℹ️  Aucun profil à supprimer (table UserProfile peut-être absente)\n`);
    }

    // 8. Supprimer l'utilisateur lui-même
    console.log('🗑️  Suppression de l\'utilisateur...');
    await prisma.user.delete({
      where: { id: user.id },
    });
    console.log(`   ✅ Utilisateur supprimé\n`);

    // 9. Résumé final
    console.log('='.repeat(70));
    console.log('✅ SUPPRESSION COMPLÈTE RÉUSSIE !');
    console.log('='.repeat(70));
    console.log('');
    console.log(`L'utilisateur ${EMAIL_TO_DELETE} a été complètement supprimé de la base de données.`);
    console.log('');
    console.log('📝 Vous pouvez maintenant :');
    console.log('   1. Retester l\'inscription avec cet email');
    console.log('   2. Vérifier que l\'email de confirmation arrive');
    console.log('   3. Tester la confirmation d\'email');
    console.log('   4. Tester la réinitialisation de mot de passe');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ ERREUR lors de la suppression :');
    console.error(`   → ${error.message || 'Erreur inconnue'}`);
    console.error('');

    if (error.code === 'P2003') {
      console.error('🔍 DIAGNOSTIC :');
      console.error('   Il y a des contraintes de clés étrangères qui empêchent la suppression.');
      console.error('   Certaines données liées n\'ont peut-être pas été supprimées.');
      console.error('');
    }

    console.error('Stack trace complète :');
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation avant suppression
console.log('\n⚠️  ATTENTION : SUPPRESSION DÉFINITIVE !');
console.log('='.repeat(70));
console.log(`Vous êtes sur le point de supprimer COMPLÈTEMENT l'utilisateur :`);
console.log(`📧 ${EMAIL_TO_DELETE}`);
console.log('');
console.log('Cette action supprimera :');
console.log('   • L\'utilisateur');
console.log('   • Tous ses portfolios');
console.log('   • Toutes ses transactions');
console.log('   • Toutes ses positions');
console.log('   • Toutes ses watchlists');
console.log('   • Toute sa progression de modules');
console.log('   • Toutes ses tentatives de quiz');
console.log('   • Son profil utilisateur');
console.log('');
console.log('⚠️  Cette action est IRRÉVERSIBLE !');
console.log('='.repeat(70));
console.log('');
console.log('Lancement dans 3 secondes...\n');

// Délai de 3 secondes pour annuler si nécessaire
setTimeout(() => {
  deleteUserCompletely()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}, 3000);
