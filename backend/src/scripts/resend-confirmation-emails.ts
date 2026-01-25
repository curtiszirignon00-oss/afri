/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { sendConfirmationEmail } from '../services/email.service';
import { generateConfirmationToken, getTokenExpirationDate } from '../utils/token.utils';
import readline from 'readline';

// Charger les variables d'environnement
dotenv.config();

const prisma = new PrismaClient();

/**
 * Script pour renvoyer les emails de confirmation aux utilisateurs non confirmés
 * Usage: npx tsx src/scripts/resend-confirmation-emails.ts
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

interface EmailResult {
  email: string;
  name: string;
  success: boolean;
  error?: string;
}

async function resendConfirmationEmails() {
  console.log('\n📧 RENVOI DES EMAILS DE CONFIRMATION');
  console.log('='.repeat(70));

  try {
    // 1. Trouver tous les utilisateurs non confirmés
    console.log('\n🔍 Recherche des utilisateurs non confirmés...');

    const unconfirmedUsers = await prisma.user.findMany({
      where: {
        email_verified_at: null, // Email non confirmé
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        created_at: true,
        email_confirmation_token: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (unconfirmedUsers.length === 0) {
      console.log('✅ Aucun utilisateur non confirmé trouvé !');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    console.log(`\n📊 Nombre d'utilisateurs non confirmés: ${unconfirmedUsers.length}`);
    console.log('\n📋 Liste des utilisateurs:');
    console.log('-'.repeat(70));

    // Afficher les 10 premiers
    const displayLimit = Math.min(10, unconfirmedUsers.length);
    for (let i = 0; i < displayLimit; i++) {
      const user = unconfirmedUsers[i];
      const createdDate = new Date(user.created_at).toLocaleDateString('fr-FR');
      console.log(`${i + 1}. ${user.email} - ${user.name} ${user.lastname} (Inscrit le: ${createdDate})`);
    }

    if (unconfirmedUsers.length > 10) {
      console.log(`... et ${unconfirmedUsers.length - 10} autres utilisateurs`);
    }

    console.log('-'.repeat(70));

    // 2. Demander confirmation
    const confirm = await question(`\n⚠️  Voulez-vous renvoyer les emails de confirmation à ces ${unconfirmedUsers.length} utilisateurs ? (oui/non): `);

    if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Opération annulée');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // 3. Option de test avec seulement quelques utilisateurs
    let usersToProcess = unconfirmedUsers;

    if (unconfirmedUsers.length > 5) {
      const testMode = await question(`\n🧪 Voulez-vous d'abord tester avec seulement 5 utilisateurs ? (oui/non): `);

      if (testMode.toLowerCase() === 'oui' || testMode.toLowerCase() === 'o' || testMode.toLowerCase() === 'y' || testMode.toLowerCase() === 'yes') {
        usersToProcess = unconfirmedUsers.slice(0, 5);
        console.log(`\n🧪 MODE TEST: Envoi à seulement ${usersToProcess.length} utilisateurs`);
      }
    }

    // 4. Renvoyer les emails
    console.log(`\n📧 Envoi des emails en cours...`);
    console.log('='.repeat(70));

    const results: EmailResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < usersToProcess.length; i++) {
      const user = usersToProcess[i];
      const progress = `[${i + 1}/${usersToProcess.length}]`;

      try {
        console.log(`\n${progress} Traitement de: ${user.email}`);

        // Générer un nouveau token
        const confirmationToken = generateConfirmationToken();
        const tokenExpiration = getTokenExpirationDate(24); // 24 heures

        // Mettre à jour le token dans la base de données
        await prisma.user.update({
          where: { id: user.id },
          data: {
            email_confirmation_token: confirmationToken,
            email_confirmation_expires: tokenExpiration,
          },
        });

        console.log(`   → Nouveau token généré: ${confirmationToken.substring(0, 15)}...`);

        // Envoyer l'email
        await sendConfirmationEmail({
          email: user.email,
          name: user.name,
          confirmationToken,
        });

        console.log(`   ✅ Email envoyé avec succès!`);

        results.push({
          email: user.email,
          name: user.name,
          success: true,
        });
        successCount++;

        // Petit délai entre chaque email pour éviter le rate limiting
        if (i < usersToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 seconde
        }

      } catch (error: any) {
        console.error(`   ❌ ERREUR: ${error.message}`);

        results.push({
          email: user.email,
          name: user.name,
          success: false,
          error: error.message,
        });
        errorCount++;
      }
    }

    // 5. Résumé final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSUMÉ DE L\'OPÉRATION');
    console.log('='.repeat(70));
    console.log(`Total traité:     ${usersToProcess.length}`);
    console.log(`✅ Succès:         ${successCount}`);
    console.log(`❌ Erreurs:        ${errorCount}`);
    console.log(`📈 Taux de succès: ${((successCount / usersToProcess.length) * 100).toFixed(1)}%`);

    if (errorCount > 0) {
      console.log('\n❌ Emails en erreur:');
      console.log('-'.repeat(70));
      results.filter(r => !r.success).forEach((result, index) => {
        console.log(`${index + 1}. ${result.email} - Erreur: ${result.error}`);
      });
    }

    // 6. Statistiques Brevo
    console.log('\n💡 IMPORTANT:');
    console.log('-'.repeat(70));
    console.log('• Les emails peuvent prendre 1-2 minutes pour être reçus');
    console.log('• Demandez aux utilisateurs de vérifier leur dossier SPAM');
    console.log('• Plan gratuit Brevo: 300 emails/jour maximum');
    console.log(`• Emails envoyés aujourd\'hui: ~${successCount} (+ autres envois)`);

    if (successCount > 250) {
      console.log('\n⚠️  ATTENTION: Vous approchez de la limite quotidienne Brevo (300 emails/jour)');
    }

    // 7. Si mode test, proposer d'envoyer au reste
    if (usersToProcess.length < unconfirmedUsers.length) {
      const remaining = unconfirmedUsers.length - usersToProcess.length;
      console.log(`\n🧪 Mode test terminé. Il reste ${remaining} utilisateurs.`);

      const sendRest = await question(`\nVoulez-vous envoyer aux ${remaining} utilisateurs restants ? (oui/non): `);

      if (sendRest.toLowerCase() === 'oui' || sendRest.toLowerCase() === 'o') {
        console.log('\n🔄 Redémarrez le script et choisissez "non" au mode test pour envoyer à tous.');
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Opération terminée!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n💥 Erreur fatale:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Exécuter le script
resendConfirmationEmails()
  .then(() => {
    console.log('\n👋 Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur critique:', error);
    process.exit(1);
  });
