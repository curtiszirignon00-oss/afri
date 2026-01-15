/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Vérification directe de la base de données
 */
async function directCheck() {
  console.log('\n🔍 VÉRIFICATION DIRECTE DE LA BASE DE DONNÉES');
  console.log('='.repeat(80));

  try {
    // 1. Compter TOUS les utilisateurs
    const totalUsers = await prisma.user.count();
    console.log(`\n📊 Total d'utilisateurs dans la base: ${totalUsers}`);

    // 2. Compter ceux avec email_verified_at NOT NULL
    const verifiedCount = await prisma.user.count({
      where: {
        email_verified_at: {
          not: null,
        },
      },
    });
    console.log(`✅ Utilisateurs avec email_verified_at NOT NULL: ${verifiedCount}`);

    // 3. Compter ceux avec email_verified_at NULL
    const unverifiedCount = await prisma.user.count({
      where: {
        email_verified_at: null,
      },
    });
    console.log(`❌ Utilisateurs avec email_verified_at NULL: ${unverifiedCount}`);

    // Vérification
    console.log(`\n🔢 Vérification: ${verifiedCount} + ${unverifiedCount} = ${verifiedCount + unverifiedCount} (devrait être ${totalUsers})`);

    // 4. Lister les 20 derniers utilisateurs inscrits avec leur statut
    console.log('\n📋 Les 20 derniers utilisateurs inscrits:');
    console.log('-'.repeat(80));

    const recentUsers = await prisma.user.findMany({
      take: 20,
      orderBy: {
        created_at: 'desc',
      },
      select: {
        email: true,
        name: true,
        created_at: true,
        email_verified_at: true,
      },
    });

    recentUsers.forEach((user, i) => {
      const status = user.email_verified_at ? '✅ Confirmé' : '❌ NON confirmé';
      const date = new Date(user.created_at!).toLocaleString('fr-FR');
      console.log(`${i + 1}. ${user.email}`);
      console.log(`   ${user.name} | ${date} | ${status}`);
    });

    // 5. Chercher spécifiquement Louis Claver
    console.log('\n\n🔍 Recherche spécifique: louisclaver08@gmail.com');
    console.log('-'.repeat(80));

    const louis = await prisma.user.findUnique({
      where: {
        email: 'louisclaver08@gmail.com',
      },
      select: {
        id: true,
        email: true,
        name: true,
        email_verified_at: true,
        email_confirmation_token: true,
        created_at: true,
      },
    });

    if (louis) {
      console.log(`\n✅ Trouvé!`);
      console.log(`   ID: ${louis.id}`);
      console.log(`   Email: ${louis.email}`);
      console.log(`   Nom: ${louis.name}`);
      console.log(`   Inscrit: ${new Date(louis.created_at!).toLocaleString('fr-FR')}`);
      console.log(`   email_verified_at: ${louis.email_verified_at || 'NULL'}`);
      console.log(`   email_confirmation_token: ${louis.email_confirmation_token ? louis.email_confirmation_token.substring(0, 20) + '...' : 'NULL'}`);

      if (!louis.email_verified_at) {
        console.log(`\n⚠️  Louis Claver N'A PAS CONFIRMÉ son email!`);
      }
    } else {
      console.log('\n❌ Louis Claver non trouvé dans la base!');
    }

    // 6. Lister TOUS les emails non confirmés
    console.log('\n\n📧 TOUS les utilisateurs NON confirmés:');
    console.log('='.repeat(80));

    const allUnconfirmed = await prisma.user.findMany({
      where: {
        email_verified_at: null,
      },
      select: {
        email: true,
        name: true,
        lastname: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (allUnconfirmed.length === 0) {
      console.log('\n✅ Aucun utilisateur non confirmé trouvé!');
      console.log('\nCela signifie que:');
      console.log('• Soit TOUS les utilisateurs ont confirmé leur email');
      console.log('• Soit il y a un problème avec le champ email_verified_at');
    } else {
      console.log(`\n📊 Total: ${allUnconfirmed.length} utilisateurs non confirmés\n`);
      allUnconfirmed.forEach((user, i) => {
        console.log(`${i + 1}. ${user.email}`);
        console.log(`   ${user.name} ${user.lastname}`);
        console.log(`   Inscrit: ${new Date(user.created_at!).toLocaleString('fr-FR')}\n`);
      });
    }

  } catch (error) {
    console.error('\n💥 Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

directCheck()
  .then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur critique:', error);
    process.exit(1);
  });
