/// <reference types="node" />
// Script pour envoyer un email de résumé de portefeuille de test
import { sendPortfolioSummaryEmail } from '../services/email.service';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function sendTestPortfolioSummary() {
  console.log('📊 Envoi d\'un email de résumé de portefeuille de test\n');
  console.log('='.repeat(60));

  try {
    // Demander l'email de destination
    const email = await question('\nEntrez votre adresse email pour recevoir le test: ');

    if (!email || !email.includes('@')) {
      console.error('❌ Adresse email invalide');
      rl.close();
      return;
    }

    // Données de test avec un portefeuille réaliste
    const testData = {
      email: email,
      name: 'Jean Kouadio',
      portfolioStats: {
        totalValue: 5780000, // 5,780,000 FCFA
        cashBalance: 1200000, // 1,200,000 FCFA
        investedValue: 4500000, // 4,500,000 FCFA
        totalGainLoss: 80000, // +80,000 FCFA
        totalGainLossPercent: 1.78, // +1.78%
        topPerformers: [
          { ticker: 'SIVC', gainLossPercent: 12.5, currentPrice: 1280 },
          { ticker: 'ONTBF', gainLossPercent: 8.3, currentPrice: 3250 },
          { ticker: 'BOABF', gainLossPercent: 5.2, currentPrice: 6800 },
        ],
        topLosers: [
          { ticker: 'SDCC', gainLossPercent: -3.5, currentPrice: 4100 },
          { ticker: 'TTLC', gainLossPercent: -2.1, currentPrice: 920 },
          { ticker: 'NEIC', gainLossPercent: -1.2, currentPrice: 785 },
        ],
        positionsCount: 8,
        period: 'du 1er au 14 janvier 2026',
      },
    };

    console.log('\n📋 Configuration de l\'email de test:');
    console.log(`   → Destinataire: ${email}`);
    console.log(`   → Valeur totale: ${testData.portfolioStats.totalValue.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Performance: ${testData.portfolioStats.totalGainLossPercent > 0 ? '+' : ''}${testData.portfolioStats.totalGainLossPercent}%`);
    console.log(`   → Positions: ${testData.portfolioStats.positionsCount}`);
    console.log(`   → Période: ${testData.portfolioStats.period}`);

    const confirm = await question('\n⚠️  Voulez-vous envoyer cet email de test? (o/n): ');

    if (confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'oui') {
      console.log('❌ Envoi annulé');
      rl.close();
      return;
    }

    console.log('\n📤 Envoi de l\'email en cours...\n');

    await sendPortfolioSummaryEmail(testData);

    console.log('\n✅ Email envoyé avec succès!');
    console.log(`\n📬 Vérifiez votre boîte de réception: ${email}`);
    console.log('   → Sujet: 📊 Résumé de Votre Portefeuille - AfriBourse');
    console.log('   → N\'oubliez pas de vérifier les spams si vous ne le voyez pas\n');

  } catch (error: any) {
    console.error('\n❌ Erreur lors de l\'envoi de l\'email:');
    console.error(`   → ${error.message}\n`);

    if (error.message.includes('SMTP')) {
      console.log('💡 Conseils de dépannage:');
      console.log('   1. Vérifiez vos variables d\'environnement SMTP dans .env');
      console.log('   2. Assurez-vous que le serveur SMTP est accessible');
      console.log('   3. Vérifiez que les identifiants sont corrects');
      console.log('   4. Consultez les logs complets ci-dessus\n');
    }
  } finally {
    rl.close();
  }
}

// Exécuter le test
sendTestPortfolioSummary()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
