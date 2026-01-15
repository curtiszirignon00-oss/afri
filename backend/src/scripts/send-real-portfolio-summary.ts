/// <reference types="node" />
// Script pour envoyer un résumé de portefeuille avec des vraies données calculées
import { getPortfolioStatsForUser } from '../services/portfolio-summary.service';
import { sendPortfolioSummaryEmail } from '../services/email.service';
import prisma from '../config/prisma';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function sendRealPortfolioSummary() {
  console.log('📊 Envoi de résumé de portefeuille avec données réelles\n');
  console.log('='.repeat(60));

  try {
    // Chercher un utilisateur avec un portefeuille actif
    const usersWithPortfolio = await prisma.user.findMany({
      where: {
        portfolios: {
          some: {
            is_virtual: true,
            positions: {
              some: {
                quantity: { gt: 0 },
              },
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
      },
      take: 5,
    });

    if (usersWithPortfolio.length === 0) {
      console.log('❌ Aucun utilisateur avec portefeuille actif trouvé');
      console.log('💡 Créez d\'abord un portefeuille de test dans la base de données');
      rl.close();
      return;
    }

    console.log(`\n📋 ${usersWithPortfolio.length} utilisateur(s) avec portefeuille trouvé(s):\n`);
    usersWithPortfolio.forEach((user, index) => {
      const name = user.name ? `${user.name} ${user.lastname || ''}`.trim() : user.email;
      console.log(`   ${index + 1}. ${name} (${user.email})`);
    });

    const userChoice = await question('\nChoisissez un utilisateur (1-' + usersWithPortfolio.length + '): ');
    const userIndex = parseInt(userChoice) - 1;

    if (userIndex < 0 || userIndex >= usersWithPortfolio.length) {
      console.log('❌ Choix invalide');
      rl.close();
      return;
    }

    const selectedUser = usersWithPortfolio[userIndex];
    console.log(`\n✅ Utilisateur sélectionné: ${selectedUser.email}`);

    // Calculer les stats réelles du portefeuille
    console.log('\n🔄 Calcul des statistiques du portefeuille...\n');
    const stats = await getPortfolioStatsForUser(selectedUser.id);

    if (!stats) {
      console.log('❌ Impossible de calculer les statistiques du portefeuille');
      rl.close();
      return;
    }

    // Afficher les stats calculées
    console.log('📊 Statistiques calculées:');
    console.log('='.repeat(60));
    console.log(`   → Nom: ${stats.name}`);
    console.log(`   → Email: ${stats.email}`);
    console.log(`   → Valeur totale: ${stats.totalValue.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Liquidités: ${stats.cashBalance.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Investi: ${stats.investedValue.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Gain/Perte: ${stats.totalGainLoss >= 0 ? '+' : ''}${stats.totalGainLoss.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Performance: ${stats.totalGainLossPercent >= 0 ? '+' : ''}${stats.totalGainLossPercent.toFixed(2)}%`);
    console.log(`   → Positions: ${stats.positionsCount}`);
    console.log(`   → Période: ${stats.period}`);

    if (stats.topPerformers.length > 0) {
      console.log('\n🚀 Top Performers:');
      stats.topPerformers.forEach((perf, index) => {
        console.log(`   ${index + 1}. ${perf.ticker}: +${perf.gainLossPercent.toFixed(2)}% (Valeur: ${perf.value.toLocaleString('fr-FR')} FCFA)`);
      });
    }

    if (stats.topLosers.length > 0) {
      console.log('\n📉 Top Losers:');
      stats.topLosers.forEach((perf, index) => {
        console.log(`   ${index + 1}. ${perf.ticker}: ${perf.gainLossPercent.toFixed(2)}% (Valeur: ${perf.value.toLocaleString('fr-FR')} FCFA)`);
      });
    }

    console.log('\n' + '='.repeat(60));

    // Demander l'email de destination
    const emailDest = await question('\nEmail de destination (Entrée pour ' + stats.email + '): ');
    const finalEmail = emailDest.trim() || stats.email;

    const confirm = await question(`\n⚠️  Envoyer le résumé à ${finalEmail}? (o/n): `);

    if (confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'oui') {
      console.log('❌ Envoi annulé');
      rl.close();
      return;
    }

    console.log('\n📤 Envoi de l\'email en cours...\n');

    // Envoyer l'email
    await sendPortfolioSummaryEmail({
      email: finalEmail,
      name: stats.name,
      portfolioStats: {
        totalValue: stats.totalValue,
        cashBalance: stats.cashBalance,
        investedValue: stats.investedValue,
        totalGainLoss: stats.totalGainLoss,
        totalGainLossPercent: stats.totalGainLossPercent,
        topPerformers: stats.topPerformers,
        topLosers: stats.topLosers,
        positionsCount: stats.positionsCount,
        period: stats.period,
      },
    });

    console.log('✅ Email envoyé avec succès!');
    console.log(`\n📬 Email envoyé à: ${finalEmail}`);
    console.log('   → Sujet: 📊 Résumé de Votre Portefeuille - AfriBourse');
    console.log('   → Vérifiez la boîte de réception (et les spams si nécessaire)\n');

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Exécuter
sendRealPortfolioSummary()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
