/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Charger les variables d'environnement
dotenv.config();

const prisma = new PrismaClient();

/**
 * Script pour lister tous les utilisateurs non confirmés
 * Usage: npx tsx src/scripts/list-unconfirmed-users.ts
 */

async function listUnconfirmedUsers() {
  console.log('\n👥 LISTE DES UTILISATEURS NON CONFIRMÉS');
  console.log('='.repeat(80));

  try {
    // 1. Récupérer tous les utilisateurs non confirmés
    const unconfirmedUsers = await prisma.user.findMany({
      where: {
        email_verified_at: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        created_at: true,
        email_confirmation_token: true,
        email_confirmation_expires: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // 2. Statistiques globales
    const totalUsers = await prisma.user.count();
    const confirmedUsers = await prisma.user.count({
      where: {
        email_verified_at: { not: null },
      },
    });

    console.log('\n📊 STATISTIQUES GLOBALES');
    console.log('-'.repeat(80));
    console.log(`Total d'utilisateurs:         ${totalUsers}`);
    console.log(`Utilisateurs confirmés:       ${confirmedUsers} (${((confirmedUsers / totalUsers) * 100).toFixed(1)}%)`);
    console.log(`Utilisateurs NON confirmés:   ${unconfirmedUsers.length} (${((unconfirmedUsers.length / totalUsers) * 100).toFixed(1)}%)`);

    if (unconfirmedUsers.length === 0) {
      console.log('\n✅ Aucun utilisateur non confirmé !');
      await prisma.$disconnect();
      return;
    }

    // 3. Analyser les tokens expirés
    const now = new Date();
    const expiredTokens = unconfirmedUsers.filter(user => {
      return user.email_confirmation_expires && new Date(user.email_confirmation_expires) < now;
    });

    const validTokens = unconfirmedUsers.filter(user => {
      return user.email_confirmation_expires && new Date(user.email_confirmation_expires) >= now;
    });

    const noToken = unconfirmedUsers.filter(user => !user.email_confirmation_token);

    console.log('\n📋 ANALYSE DES TOKENS');
    console.log('-'.repeat(80));
    console.log(`Tokens valides (non expirés): ${validTokens.length}`);
    console.log(`Tokens expirés:               ${expiredTokens.length}`);
    console.log(`Sans token:                   ${noToken.length}`);

    // 4. Grouper par date d'inscription
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const todayUsers = unconfirmedUsers.filter(u => new Date(u.created_at) >= today);
    const yesterdayUsers = unconfirmedUsers.filter(u => {
      const created = new Date(u.created_at);
      return created >= yesterday && created < today;
    });
    const lastWeekUsers = unconfirmedUsers.filter(u => {
      const created = new Date(u.created_at);
      return created >= lastWeek && created < yesterday;
    });
    const lastMonthUsers = unconfirmedUsers.filter(u => {
      const created = new Date(u.created_at);
      return created >= lastMonth && created < lastWeek;
    });
    const olderUsers = unconfirmedUsers.filter(u => new Date(u.created_at) < lastMonth);

    console.log('\n📅 RÉPARTITION PAR DATE D\'INSCRIPTION');
    console.log('-'.repeat(80));
    console.log(`Aujourd'hui:          ${todayUsers.length}`);
    console.log(`Hier:                 ${yesterdayUsers.length}`);
    console.log(`7 derniers jours:     ${lastWeekUsers.length}`);
    console.log(`30 derniers jours:    ${lastMonthUsers.length}`);
    console.log(`Plus ancien:          ${olderUsers.length}`);

    // 5. Liste détaillée
    console.log('\n📋 LISTE DÉTAILLÉE DES UTILISATEURS NON CONFIRMÉS');
    console.log('-'.repeat(80));
    console.log('Format: #ID | Email | Nom | Date inscription | Token expiré ?');
    console.log('-'.repeat(80));

    unconfirmedUsers.forEach((user, index) => {
      const createdDate = new Date(user.created_at).toLocaleString('fr-FR');
      const isExpired = user.email_confirmation_expires && new Date(user.email_confirmation_expires) < now;
      const hasToken = user.email_confirmation_token ? '✅' : '❌';
      const expiredStatus = isExpired ? '⏰ EXPIRÉ' : '✅ Valide';

      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Nom: ${user.name} ${user.lastname}`);
      console.log(`   Inscrit le: ${createdDate}`);
      console.log(`   Token: ${hasToken} | Statut: ${expiredStatus}`);
      console.log('');
    });

    // 6. Recommandations
    console.log('='.repeat(80));
    console.log('💡 RECOMMANDATIONS');
    console.log('='.repeat(80));

    if (expiredTokens.length > 0 || noToken.length > 0) {
      console.log(`\n⚠️  ${expiredTokens.length + noToken.length} utilisateurs ont besoin d'un nouveau token`);
      console.log('\n📧 Pour renvoyer les emails de confirmation:');
      console.log('   npx tsx src/scripts/resend-confirmation-emails.ts');
    }

    if (olderUsers.length > 0) {
      console.log(`\n⏰ ${olderUsers.length} utilisateurs sont inscrits depuis plus d'un mois sans confirmation`);
      console.log('   Considérez de les supprimer ou de les contacter directement');
    }

    console.log('\n✅ Pour confirmer manuellement un utilisateur (si besoin):');
    console.log('   npx prisma studio');
    console.log('   → Ouvrir la table User');
    console.log('   → Modifier email_verified_at avec la date actuelle');

    // 7. Export CSV (optionnel)
    console.log('\n📄 Export CSV disponible:');
    console.log('   Les données sont affichées ci-dessus');
    console.log('   Vous pouvez rediriger la sortie vers un fichier:');
    console.log('   npx tsx src/scripts/list-unconfirmed-users.ts > unconfirmed-users.txt');

  } catch (error) {
    console.error('\n💥 Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
listUnconfirmedUsers()
  .then(() => {
    console.log('\n👋 Terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur critique:', error);
    process.exit(1);
  });
