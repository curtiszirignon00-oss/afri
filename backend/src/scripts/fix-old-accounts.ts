/// <reference types="node" />
/**
 * Script pour gérer les comptes créés avant le système de confirmation d'email
 *
 * Ce script a deux options :
 * 1. Marquer automatiquement les anciens comptes comme vérifiés
 * 2. Générer des tokens de confirmation pour les anciens comptes
 *
 * Usage:
 * - Option 1 (auto-verify): npx ts-node src/scripts/fix-old-accounts.ts verify
 * - Option 2 (generate tokens): npx ts-node src/scripts/fix-old-accounts.ts generate
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Fonction pour générer un token de confirmation
function generateConfirmationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Fonction pour obtenir la date d'expiration (24 heures)
function getTokenExpirationDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

async function autoVerifyOldAccounts() {
  console.log('🔍 Recherche des comptes non vérifiés sans token de confirmation...');

  const oldAccounts = await prisma.user.findMany({
    where: {
      email_verified_at: null,
      email_confirmation_token: null,
    },
  });

  console.log(`📊 ${oldAccounts.length} compte(s) trouvé(s)`);

  if (oldAccounts.length === 0) {
    console.log('✅ Aucun compte à mettre à jour');
    return;
  }

  console.log('\n📝 Liste des comptes à vérifier automatiquement :');
  oldAccounts.forEach((account, index) => {
    console.log(`${index + 1}. ${account.email} (${account.name})`);
  });

  // Mettre à jour tous les anciens comptes pour les marquer comme vérifiés
  const result = await prisma.user.updateMany({
    where: {
      email_verified_at: null,
      email_confirmation_token: null,
    },
    data: {
      email_verified_at: new Date(),
    },
  });

  console.log(`\n✅ ${result.count} compte(s) marqué(s) comme vérifié(s)`);
  console.log('🎉 Migration terminée avec succès !');
}

async function generateTokensForOldAccounts() {
  console.log('🔍 Recherche des comptes non vérifiés sans token de confirmation...');

  const oldAccounts = await prisma.user.findMany({
    where: {
      email_verified_at: null,
      email_confirmation_token: null,
    },
  });

  console.log(`📊 ${oldAccounts.length} compte(s) trouvé(s)`);

  if (oldAccounts.length === 0) {
    console.log('✅ Aucun compte à mettre à jour');
    return;
  }

  console.log('\n📝 Génération des tokens de confirmation...');

  let updatedCount = 0;

  for (const account of oldAccounts) {
    const confirmationToken = generateConfirmationToken();
    const tokenExpiration = getTokenExpirationDate();

    await prisma.user.update({
      where: { id: account.id },
      data: {
        email_confirmation_token: confirmationToken,
        email_confirmation_expires: tokenExpiration,
      },
    });

    console.log(`✅ Token généré pour ${account.email}`);
    updatedCount++;
  }

  console.log(`\n✅ ${updatedCount} token(s) de confirmation généré(s)`);
  console.log('📧 Les utilisateurs peuvent maintenant demander un nouvel email de confirmation');
  console.log('🎉 Migration terminée avec succès !');
}

async function main() {
  const args = process.argv.slice(2);
  const option = args[0];

  console.log('🚀 Script de migration pour les anciens comptes\n');

  try {
    if (option === 'verify') {
      console.log('📌 Mode: Auto-vérification des anciens comptes\n');
      await autoVerifyOldAccounts();
    } else if (option === 'generate') {
      console.log('📌 Mode: Génération de tokens pour les anciens comptes\n');
      await generateTokensForOldAccounts();
    } else {
      console.log('❌ Option invalide. Utilisation:');
      console.log('   npx ts-node src/scripts/fix-old-accounts.ts verify      - Marquer les anciens comptes comme vérifiés');
      console.log('   npx ts-node src/scripts/fix-old-accounts.ts generate    - Générer des tokens de confirmation');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
