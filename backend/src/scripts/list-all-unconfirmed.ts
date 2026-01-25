/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function listAll() {
  console.log('\n👥 TOUS LES UTILISATEURS NON CONFIRMÉS');
  console.log('='.repeat(80));

  try {
    const unconfirmed = await prisma.user.findMany({
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

    console.log(`\n📊 Total: ${unconfirmed.length} utilisateurs non confirmés`);

    if (unconfirmed.length === 0) {
      console.log('\n✅ Aucun utilisateur non confirmé !');
      await prisma.$disconnect();
      return;
    }

    console.log('\n📋 LISTE COMPLÈTE:');
    console.log('='.repeat(80));

    const now = new Date();

    unconfirmed.forEach((user, index) => {
      const createdDate = new Date(user.created_at);
      const hasToken = user.email_confirmation_token ? '✅' : '❌';

      let tokenStatus = 'Pas de token';
      if (user.email_confirmation_expires) {
        const expiresAt = new Date(user.email_confirmation_expires);
        const isExpired = expiresAt < now;
        tokenStatus = isExpired ? '⏰ EXPIRÉ' : '✅ Valide';
      }

      console.log(`\n${index + 1}. ${user.email}`);
      console.log(`   Nom: ${user.name} ${user.lastname}`);
      console.log(`   Inscrit le: ${createdDate.toLocaleString('fr-FR')}`);
      console.log(`   Token: ${hasToken} | Statut: ${tokenStatus}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 Pour renvoyer les emails à TOUS ces utilisateurs:');
    console.log('   npx tsx src/scripts/resend-confirmation-emails.ts');

    console.log('\n💡 Pour renvoyer à UN utilisateur spécifique:');
    console.log('   curl -X POST http://localhost:3001/api/resend-confirmation \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"email":"utilisateur@example.com"}\'');

  } catch (error) {
    console.error('\n💥 Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAll()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
