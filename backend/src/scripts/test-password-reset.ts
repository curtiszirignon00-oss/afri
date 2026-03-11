/// <reference types="node" />
/**
 * Script pour tester l'envoi d'email de réinitialisation
 * Usage: npx ts-node src/scripts/test-password-reset.ts <email>
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/email.service';

const prisma = new PrismaClient();

function generateConfirmationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function getTokenExpirationDate(hours: number): Date {
  const now = new Date();
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log('❌ Usage: npx ts-node src/scripts/test-password-reset.ts <email>');
    process.exit(1);
  }

  console.log(`🔍 Recherche de l'utilisateur: ${email}...\n`);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        email_verified_at: true,
      },
    });

    if (!user) {
      console.log(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      console.log('\n💡 Assurez-vous que l\'email existe dans la base de données.');
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé:`);
    console.log(`   - Nom: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Vérifié: ${user.email_verified_at ? '✅ Oui' : '❌ Non'}\n`);

    // Générer un token de test
    const resetToken = generateConfirmationToken();
    const tokenExpiration = getTokenExpirationDate(1); // 1 heure

    console.log(`🔐 Génération du token de réinitialisation...`);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_reset_token: resetToken,
        password_reset_expires: tokenExpiration,
      },
    });

    console.log(`✅ Token généré et enregistré\n`);

    console.log(`📧 Envoi de l'email de réinitialisation...`);

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetToken,
    });

    console.log(`✅ Email envoyé avec succès à ${email}!`);
    console.log(`📬 Vérifiez votre boîte email (y compris les spams)`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
