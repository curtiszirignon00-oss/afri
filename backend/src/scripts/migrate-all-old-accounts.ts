/// <reference types="node" />
/**
 * Script de migration pour TOUS les anciens comptes
 *
 * Ce script:
 * 1. Trouve TOUS les utilisateurs
 * 2. Pour ceux qui n'ont PAS email_verified_at défini (date valide)
 * 3. Les marque comme vérifiés
 *
 * Utilisation: npx ts-node src/scripts/migrate-all-old-accounts.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Migration globale des anciens comptes\n');

  try {
    // Récupérer TOUS les utilisateurs
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        email_verified_at: true,
        email_confirmation_token: true,
      },
    });

    console.log(`📊 Total: ${allUsers.length} utilisateur(s) dans la base\n`);

    // Filtrer ceux qui ne sont pas vérifiés
    const unverifiedUsers = allUsers.filter(user => !user.email_verified_at);

    console.log(`❌ Non vérifiés: ${unverifiedUsers.length} utilisateur(s)`);

    if (unverifiedUsers.length === 0) {
      console.log('✅ Tous les utilisateurs sont déjà vérifiés!');
      return;
    }

    console.log('\n📝 Liste des comptes à vérifier:');
    unverifiedUsers.forEach((user, index) => {
      const hasToken = user.email_confirmation_token ? '🔑 Avec token' : '❌ Sans token';
      console.log(`${index + 1}. ${user.email} (${user.name}) - ${hasToken}`);
    });

    console.log('\n🔄 Mise à jour en cours...');

    // Mettre à jour chaque utilisateur individuellement
    let updated = 0;
    for (const user of unverifiedUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email_verified_at: new Date(),
          // Si pas de token, on le laisse null
        },
      });
      updated++;
    }

    console.log(`\n✅ ${updated} compte(s) vérifié(s) avec succès!`);
    console.log('🎉 Tous les utilisateurs peuvent maintenant se connecter!');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
