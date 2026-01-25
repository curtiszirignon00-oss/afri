/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Vérifier un utilisateur spécifique
 */
async function checkUser() {
  const email = 'louisclaver08@gmail.com';

  console.log(`\n🔍 Vérification de l'utilisateur: ${email}`);
  console.log('='.repeat(70));

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        email_verified_at: true,
        email_confirmation_token: true,
        email_confirmation_expires: true,
        created_at: true,
      },
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log('\n📋 Informations de l\'utilisateur:');
    console.log('-'.repeat(70));
    console.log(`ID:                    ${user.id}`);
    console.log(`Email:                 ${user.email}`);
    console.log(`Nom:                   ${user.name} ${user.lastname}`);
    console.log(`Date d'inscription:    ${new Date(user.created_at).toLocaleString('fr-FR')}`);
    console.log(`Email vérifié:         ${user.email_verified_at ? '✅ OUI (' + new Date(user.email_verified_at).toLocaleString('fr-FR') + ')' : '❌ NON'}`);
    console.log(`Token de confirmation: ${user.email_confirmation_token ? user.email_confirmation_token.substring(0, 20) + '...' : '❌ Aucun'}`);

    if (user.email_confirmation_expires) {
      const expiresAt = new Date(user.email_confirmation_expires);
      const now = new Date();
      const isExpired = expiresAt < now;
      console.log(`Token expire le:       ${expiresAt.toLocaleString('fr-FR')} ${isExpired ? '⏰ EXPIRÉ' : '✅ Valide'}`);
    } else {
      console.log(`Token expire le:       ❌ Non défini`);
    }

    console.log('\n💡 Statut:');
    console.log('-'.repeat(70));
    if (!user.email_verified_at) {
      console.log('⚠️  CET UTILISATEUR N\'A PAS CONFIRMÉ SON EMAIL');
      console.log('   → Il ne peut pas se connecter à la plateforme');
      console.log('   → Un email de confirmation doit être renvoyé');
    } else {
      console.log('✅ Cet utilisateur a confirmé son email');
      console.log('   → Il peut se connecter normalement');
    }

    // Vérifier aussi les utilisateurs inscrits après le 14 décembre
    console.log('\n\n🔍 Vérification des utilisateurs inscrits après le 14 décembre 2024');
    console.log('='.repeat(70));

    const cutoffDate = new Date('2024-12-14T00:00:00.000Z');

    const recentUsers = await prisma.user.findMany({
      where: {
        created_at: { gte: cutoffDate },
        email_verified_at: null,
      },
      select: {
        email: true,
        name: true,
        lastname: true,
        created_at: true,
        email_verified_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    console.log(`\n📊 Utilisateurs inscrits après le 14/12/2024 sans confirmation:`);
    console.log(`   Total: ${recentUsers.length}`);

    if (recentUsers.length > 0) {
      console.log('\n📋 Liste:');
      console.log('-'.repeat(70));
      recentUsers.forEach((u, i) => {
        console.log(`${i + 1}. ${u.email}`);
        console.log(`   Nom: ${u.name} ${u.lastname}`);
        console.log(`   Inscrit le: ${new Date(u.created_at).toLocaleString('fr-FR')}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('💥 Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
