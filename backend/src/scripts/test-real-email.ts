/// <reference types="node" />
import { sendConfirmationEmail } from '../services/email.service';
import { generateConfirmationToken, getTokenExpirationDate } from '../utils/token.utils';
import dotenv from 'dotenv';
import readline from 'readline';

// Charger les variables d'environnement
dotenv.config();

/**
 * Script pour tester l'envoi d'un email de confirmation à une vraie adresse
 * Usage: npx tsx src/scripts/test-real-email.ts
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function testRealEmail() {
  console.log('\n🧪 TEST D\'ENVOI D\'EMAIL DE CONFIRMATION RÉEL');
  console.log('='.repeat(60));

  // Demander l'adresse email
  const email = await question('\n📧 Entrez votre adresse email pour recevoir le test: ');

  if (!email || !email.includes('@')) {
    console.error('❌ Adresse email invalide');
    rl.close();
    return;
  }

  const name = await question('👤 Entrez votre nom (optionnel, appuyez sur Entrée pour "Test"): ') || 'Test';

  console.log(`\n📋 Informations:`);
  console.log(`   Email: ${email}`);
  console.log(`   Nom: ${name}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`   Backend URL: ${process.env.BACKEND_URL}`);

  const confirm = await question('\n⚠️  Voulez-vous envoyer l\'email de test ? (oui/non): ');

  if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('❌ Test annulé');
    rl.close();
    return;
  }

  // Générer un token de confirmation
  const confirmationToken = generateConfirmationToken();
  const tokenExpiration = getTokenExpirationDate(24);

  console.log(`\n🔑 Token généré: ${confirmationToken.substring(0, 20)}...`);
  console.log(`⏰ Expire le: ${tokenExpiration.toISOString()}`);

  console.log('\n📧 Envoi de l\'email en cours...');

  try {
    await sendConfirmationEmail({
      email,
      name,
      confirmationToken,
    });

    console.log('\n✅ EMAIL ENVOYÉ AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log(`
📬 Vérifiez votre boîte de réception à l'adresse: ${email}

⚠️  IMPORTANT: Si vous ne voyez pas l'email:
1. Vérifiez votre dossier SPAM/Courrier indésirable
2. Attendez 1-2 minutes (délai de réception)
3. Vérifiez que l'adresse email est correcte
4. Ajoutez noreply@africbourse.com à vos contacts

🔗 Le lien de confirmation sera:
${process.env.FRONTEND_URL}/confirmer-inscription?token=${confirmationToken}

📊 Si ce lien ne fonctionne pas, cela signifie que:
- FRONTEND_URL dans .env est incorrect
- Ou le frontend n'a pas la route /confirmer-inscription
    `);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERREUR LORS DE L\'ENVOI DE L\'EMAIL');
    console.error('='.repeat(60));
    console.error(error);
    console.log('\n💡 Vérifiez:');
    console.log('1. La configuration SMTP dans .env');
    console.log('2. Que le compte Brevo est actif');
    console.log('3. Les quotas d\'envoi (300 emails/jour en gratuit)');
  }

  rl.close();
}

// Exécuter le test
testRealEmail()
  .then(() => {
    console.log('\n👋 Test terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
