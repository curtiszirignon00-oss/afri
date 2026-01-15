/// <reference types="node" />
// Script pour envoyer un résumé de portefeuille à contact@africbourse.com
// Utilise des données réelles si disponibles, sinon des données de test
import { getPortfolioStatsForUser } from '../services/portfolio-summary.service';
import { sendPortfolioSummaryEmail } from '../services/email.service';
import prisma from '../config/prisma';

async function sendSummaryToContact() {
  console.log('📊 Envoi de résumé de portefeuille à contact@africbourse.com\n');
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
      take: 1,
    });

    let emailData;

    if (usersWithPortfolio.length > 0) {
      // Utiliser des données réelles
      const user = usersWithPortfolio[0];
      console.log(`\n✅ Utilisateur trouvé: ${user.name} ${user.lastname || ''} (${user.email})`);
      console.log('🔄 Calcul des statistiques réelles du portefeuille...\n');

      const stats = await getPortfolioStatsForUser(user.id);

      if (!stats) {
        throw new Error('Impossible de calculer les statistiques du portefeuille');
      }

      // Afficher les stats calculées
      console.log('📊 Statistiques calculées (VRAIES DONNÉES):');
      console.log('='.repeat(60));
      console.log(`   → Nom: ${stats.name}`);
      console.log(`   → Email original: ${stats.email}`);
      console.log(`   → Valeur totale: ${stats.totalValue.toLocaleString('fr-FR')} FCFA`);
      console.log(`   → Liquidités: ${stats.cashBalance.toLocaleString('fr-FR')} FCFA`);
      console.log(`   → Investi: ${stats.investedValue.toLocaleString('fr-FR')} FCFA`);
      console.log(`   → Gain/Perte: ${stats.totalGainLoss >= 0 ? '+' : ''}${stats.totalGainLoss.toLocaleString('fr-FR')} FCFA`);
      console.log(`   → Performance: ${stats.totalGainLossPercent >= 0 ? '+' : ''}${stats.totalGainLossPercent.toFixed(2)}%`);
      console.log(`   → Positions: ${stats.positionsCount}`);

      if (stats.topPerformers.length > 0) {
        console.log('\n🚀 Top Performers:');
        stats.topPerformers.forEach((perf, index) => {
          console.log(`   ${index + 1}. ${perf.ticker}: +${perf.gainLossPercent.toFixed(2)}% (Valeur position: ${perf.value.toLocaleString('fr-FR')} FCFA)`);
        });
      }

      if (stats.topLosers.length > 0) {
        console.log('\n📉 Top Losers:');
        stats.topLosers.forEach((perf, index) => {
          console.log(`   ${index + 1}. ${perf.ticker}: ${perf.gainLossPercent.toFixed(2)}% (Valeur position: ${perf.value.toLocaleString('fr-FR')} FCFA)`);
        });
      }

      emailData = {
        email: 'contact@africbourse.com',
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
      };

    } else {
      // Utiliser des données de test
      console.log('\n⚠️  Aucun utilisateur avec portefeuille actif trouvé');
      console.log('📝 Utilisation de données de TEST\n');

      const testData = {
        email: 'contact@africbourse.com',
        name: 'Investisseur Test',
        portfolioStats: {
          totalValue: 5780000,
          cashBalance: 1200000,
          investedValue: 4500000,
          totalGainLoss: 80000,
          totalGainLossPercent: 1.78,
          topPerformers: [
            { ticker: 'SIVC', gainLossPercent: 12.5, value: 256000 }, // 200 actions × 1280 FCFA
            { ticker: 'ONTBF', gainLossPercent: 8.3, value: 325000 }, // 100 actions × 3250 FCFA
            { ticker: 'BOABF', gainLossPercent: 5.2, value: 680000 }, // 100 actions × 6800 FCFA
          ],
          topLosers: [
            { ticker: 'SDCC', gainLossPercent: -3.5, value: 410000 }, // 100 actions × 4100 FCFA
            { ticker: 'TTLC', gainLossPercent: -2.1, value: 92000 }, // 100 actions × 920 FCFA
            { ticker: 'NEIC', gainLossPercent: -1.2, value: 78500 }, // 100 actions × 785 FCFA
          ],
          positionsCount: 8,
          period: 'du 1er au 14 janvier 2026',
        },
      };

      console.log('📊 Données de TEST:');
      console.log('='.repeat(60));
      console.log(`   → Nom: ${testData.name}`);
      console.log(`   → Valeur totale: ${testData.portfolioStats.totalValue.toLocaleString('fr-FR')} FCFA`);
      console.log(`   → Liquidités: ${testData.portfolioStats.cashBalance.toLocaleString('fr-FR')} FCFA`);
      console.log(`   → Performance: +${testData.portfolioStats.totalGainLoss.toLocaleString('fr-FR')} FCFA (+${testData.portfolioStats.totalGainLossPercent}%)`);
      console.log(`   → Positions: ${testData.portfolioStats.positionsCount}`);

      emailData = testData;
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📤 Envoi de l\'email à contact@africbourse.com...\n');

    // Envoyer l'email
    await sendPortfolioSummaryEmail(emailData);

    console.log('✅ Email envoyé avec succès!');
    console.log('\n📬 Détails de l\'envoi:');
    console.log(`   → Destinataire: contact@africbourse.com`);
    console.log(`   → Nom affiché: ${emailData.name}`);
    console.log(`   → Sujet: 📊 Résumé de Votre Portefeuille - AfriBourse`);
    console.log(`   → Valeur totale: ${emailData.portfolioStats.totalValue.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Performance: ${emailData.portfolioStats.totalGainLossPercent >= 0 ? '+' : ''}${emailData.portfolioStats.totalGainLossPercent.toFixed(2)}%`);
    console.log('\n✉️  Vérifiez la boîte de réception de contact@africbourse.com\n');

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter
sendSummaryToContact()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
