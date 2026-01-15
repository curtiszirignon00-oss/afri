/// <reference types="node" />
// Script pour envoyer un email d'alerte de test à votre adresse
import { sendPriceAlertEmail } from '../services/email.service';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function sendTestEmail() {
  console.log('📧 Envoi d\'un email d\'alerte de test\n');
  console.log('='.repeat(60));

  try {
    // Demander l'email de destination
    const email = await question('\nEntrez votre adresse email pour recevoir le test: ');

    if (!email || !email.includes('@')) {
      console.error('❌ Adresse email invalide');
      rl.close();
      return;
    }

    console.log('\n📋 Configuration de l\'email de test:');
    console.log(`   → Destinataire: ${email}`);
    console.log('   → Action: SIVC');
    console.log('   → Type d\'alerte: Au-dessus');
    console.log('   → Prix cible: 1,250 FCFA');
    console.log('   → Prix actuel: 1,280 FCFA');

    const confirm = await question('\n⚠️  Voulez-vous envoyer cet email de test? (o/n): ');

    if (confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'oui') {
      console.log('❌ Envoi annulé');
      rl.close();
      return;
    }

    console.log('\n📤 Envoi de l\'email en cours...\n');

    await sendPriceAlertEmail({
      email: email,
      name: 'Utilisateur Test',
      stockTicker: 'SIVC',
      alertType: 'ABOVE',
      targetPrice: 1250,
      currentPrice: 1280,
    });

    console.log('\n✅ Email envoyé avec succès!');
    console.log(`\n📬 Vérifiez votre boîte de réception: ${email}`);
    console.log('   → Sujet: 🔔 Alerte Prix: SIVC a atteint 1 280 FCFA');
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
sendTestEmail()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
