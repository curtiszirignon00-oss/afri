/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { sendConfirmationEmail } from '../services/email.service';
import { generateConfirmationToken, getTokenExpirationDate } from '../utils/token.utils';
import readline from 'readline';

dotenv.config();

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

/**
 * Renvoyer l'email de confirmation à un utilisateur spécifique
 */
async function resendToSpecificUser() {
  console.log('\n📧 RENVOI D\'EMAIL DE CONFIRMATION À UN UTILISATEUR');
  console.log('='.repeat(70));

  try {
    const email = await question('\n📧 Entrez l\'email de l\'utilisateur: ');

    if (!email || !email.includes('@')) {
      console.log('❌ Email invalide');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        email_verified_at: true,
        created_at: true,
      },
    });

    if (!user) {
      console.log(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      rl.close();
      await prisma.$disconnect();
      return;
    }

    console.log('\n📋 Utilisateur trouvé:');
    console.log('-'.repeat(70));
    console.log(`Nom:               ${user.name} ${user.lastname}`);
    console.log(`Email:             ${user.email}`);
    console.log(`Inscrit le:        ${new Date(user.created_at).toLocaleString('fr-FR')}`);
    console.log(`Email confirmé:    ${user.email_verified_at ? '✅ OUI' : '❌ NON'}`);

    if (user.email_verified_at) {
      console.log('\n⚠️  Cet utilisateur a déjà confirmé son email.');
      const proceed = await question('Voulez-vous quand même renvoyer l\'email ? (oui/non): ');
      if (proceed.toLowerCase() !== 'oui' && proceed.toLowerCase() !== 'o') {
        console.log('❌ Opération annulée');
        rl.close();
        await prisma.$disconnect();
        return;
      }
    }

    // Confirmer l'envoi
    const confirm = await question('\n⚠️  Voulez-vous envoyer l\'email de confirmation ? (oui/non): ');
    if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o') {
      console.log('❌ Opération annulée');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Générer un nouveau token
    const confirmationToken = generateConfirmationToken();
    const tokenExpiration = getTokenExpirationDate(24);

    console.log('\n🔑 Génération d\'un nouveau token...');
    console.log(`   Token: ${confirmationToken.substring(0, 20)}...`);
    console.log(`   Expire le: ${tokenExpiration.toLocaleString('fr-FR')}`);

    // Mettre à jour le token dans la base de données
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_confirmation_token: confirmationToken,
        email_confirmation_expires: tokenExpiration,
      },
    });

    console.log('   ✅ Token mis à jour dans la base de données');

    // Envoyer l'email
    console.log('\n📧 Envoi de l\'email...');

    await sendConfirmationEmail({
      email: user.email,
      name: user.name,
      confirmationToken,
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ EMAIL ENVOYÉ AVEC SUCCÈS!');
    console.log('='.repeat(70));
    console.log(`\n📬 Email envoyé à: ${user.email}`);
    console.log(`\n🔗 Lien de confirmation:`);
    console.log(`${process.env.FRONTEND_URL}/confirmer-inscription?token=${confirmationToken}`);
    console.log(`\n💡 Instructions pour l'utilisateur:`);
    console.log('1. Vérifier la boîte de réception (et le dossier SPAM)');
    console.log('2. Cliquer sur le lien dans l\'email');
    console.log('3. Le lien expire dans 24 heures');
    console.log('\n' + '='.repeat(70));

  } catch (error: any) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

resendToSpecificUser()
  .then(() => {
    console.log('\n👋 Terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur critique:', error);
    process.exit(1);
  });
