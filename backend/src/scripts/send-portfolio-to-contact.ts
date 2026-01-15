// Script pour envoyer un récapitulatif de portefeuille à contact@africbourse.com
import { sendPortfolioSummaryEmail } from '../services/email.service';

async function sendToContact() {
  console.log('📊 Envoi du récapitulatif de portefeuille à contact@africbourse.com\n');
  console.log('='.repeat(60));

  try {
    const testData = {
      email: 'contact@africbourse.com',
      name: 'Jean Kouadio',
      portfolioStats: {
        totalValue: 5780000, // 5,780,000 FCFA
        cashBalance: 1200000, // 1,200,000 FCFA
        investedValue: 4500000, // 4,500,000 FCFA
        totalGainLoss: 80000, // +80,000 FCFA
        totalGainLossPercent: 1.78, // +1.78%
        topPerformers: [
          { ticker: 'SIVC', gainLossPercent: 12.5, value: 1280 },
          { ticker: 'ONTBF', gainLossPercent: 8.3, value: 3250 },
          { ticker: 'BOABF', gainLossPercent: 5.2, value: 6800 },
        ],
        topLosers: [
          { ticker: 'SDCC', gainLossPercent: -3.5, value: 4100 },
          { ticker: 'TTLC', gainLossPercent: -2.1, value: 920 },
          { ticker: 'NEIC', gainLossPercent: -1.2, value: 785 },
        ],
        positionsCount: 8,
        period: 'du 1er au 14 janvier 2026',
      },
    };

    console.log('\n📋 Récapitulatif à envoyer:');
    console.log(`   → Destinataire: contact@africbourse.com`);
    console.log(`   → Valeur totale: ${testData.portfolioStats.totalValue.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Performance: +${testData.portfolioStats.totalGainLoss.toLocaleString('fr-FR')} FCFA (+${testData.portfolioStats.totalGainLossPercent}%)`);
    console.log(`   → Liquidités: ${testData.portfolioStats.cashBalance.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Investi: ${testData.portfolioStats.investedValue.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Positions: ${testData.portfolioStats.positionsCount}`);
    console.log(`   → Période: ${testData.portfolioStats.period}`);

    console.log('\n🚀 Top 3 Meilleures Performances:');
    testData.portfolioStats.topPerformers.forEach((stock, index) => {
      console.log(`   ${index + 1}. ${stock.ticker}: +${stock.gainLossPercent}% (${stock.value.toLocaleString('fr-FR')} FCFA)`);
    });

    console.log('\n📉 Top 3 Moins Bonnes Performances:');
    testData.portfolioStats.topLosers.forEach((stock, index) => {
      console.log(`   ${index + 1}. ${stock.ticker}: ${stock.gainLossPercent}% (${stock.value.toLocaleString('fr-FR')} FCFA)`);
    });

    console.log('\n📤 Envoi de l\'email en cours...\n');

    await sendPortfolioSummaryEmail(testData);

    console.log('✅ Email envoyé avec succès!');
    console.log('\n📬 Email envoyé à: contact@africbourse.com');
    console.log('   → Sujet: 📊 Résumé de Votre Portefeuille - AfriBourse');
    console.log('   → Vérifiez la boîte de réception (et les spams si nécessaire)\n');

  } catch (error: any) {
    console.error('\n❌ Erreur lors de l\'envoi de l\'email:');
    console.error(`   → ${error.message}\n`);

    if (error.message.includes('SMTP')) {
      console.log('💡 Conseils de dépannage:');
      console.log('   1. Vérifiez vos variables d\'environnement SMTP dans .env');
      console.log('   2. Assurez-vous que le serveur SMTP est accessible');
      console.log('   3. Vérifiez que les identifiants sont corrects\n');
    }
  }
}

// Exécuter l'envoi
sendToContact()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
