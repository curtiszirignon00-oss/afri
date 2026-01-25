/// <reference types="node" />
/**
 * Script pour vérifier l'état des comptes utilisateurs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('🔍 Vérification de l\'état des comptes utilisateurs...\n');

  // Tous les utilisateurs
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      email_verified_at: true,
      email_confirmation_token: true,
      email_confirmation_expires: true,
    },
  });

  console.log(`📊 Total: ${allUsers.length} compte(s)\n`);

  // Comptes vérifiés
  const verifiedUsers = allUsers.filter(u => u.email_verified_at !== null);
  console.log(`✅ Vérifiés: ${verifiedUsers.length} compte(s)`);

  // Comptes non vérifiés avec token
  const unverifiedWithToken = allUsers.filter(
    u => u.email_verified_at === null && u.email_confirmation_token !== null
  );
  console.log(`⏳ Non vérifiés avec token: ${unverifiedWithToken.length} compte(s)`);

  // Comptes non vérifiés sans token (problématiques)
  const unverifiedWithoutToken = allUsers.filter(
    u => u.email_verified_at === null && u.email_confirmation_token === null
  );
  console.log(`❌ Non vérifiés sans token: ${unverifiedWithoutToken.length} compte(s)`);

  if (unverifiedWithoutToken.length > 0) {
    console.log('\n📝 Comptes problématiques (non vérifiés sans token):');
    unverifiedWithoutToken.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name})`);
    });
  }

  if (unverifiedWithToken.length > 0) {
    console.log('\n📝 Comptes en attente de vérification (avec token):');
    unverifiedWithToken.forEach((user, index) => {
      const isExpired = user.email_confirmation_expires && new Date(user.email_confirmation_expires) < new Date();
      const status = isExpired ? '⏰ EXPIRÉ' : '✓ Valide';
      console.log(`${index + 1}. ${user.email} (${user.name}) - ${status}`);
    });
  }
}

async function main() {
  try {
    await checkUsers();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
