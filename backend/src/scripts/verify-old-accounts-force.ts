/**
 * Script FORCE pour auto-vérifier les anciens comptes
 * Ce script vérifie automatiquement tous les comptes sans token de confirmation
 */

import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('🚀 Auto-vérification FORCE des anciens comptes\n');

    // Mettre à jour directement tous les comptes sans token
    const result = await prisma.user.updateMany({
      where: {
        AND: [
          { email_verified_at: null },
          { email_confirmation_token: null }
        ]
      },
      data: {
        email_verified_at: new Date(),
      },
    });

    console.log(`✅ ${result.count} compte(s) vérifié(s) automatiquement`);
    console.log('🎉 Tous les anciens comptes peuvent maintenant se connecter!');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
