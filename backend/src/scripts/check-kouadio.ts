/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function check() {
  console.log('\n🔍 Vérification de kouadioangewilliam@gmail.com');
  console.log('='.repeat(70));

  const user = await prisma.user.findUnique({
    where: { email: 'kouadioangewilliam@gmail.com' },
  });

  if (!user) {
    console.log('❌ Utilisateur NON trouvé');
    await prisma.$disconnect();
    return;
  }

  console.log('\n✅ Utilisateur trouvé:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Nom: ${user.name} ${user.lastname}`);
  console.log(`   Inscrit le: ${new Date(user.created_at!).toLocaleString('fr-FR')}`);
  console.log(`   Email vérifié: ${user.email_verified_at ? 'OUI ✅' : 'NON ❌'}`);
  console.log(`   Token: ${user.email_confirmation_token ? user.email_confirmation_token.substring(0, 20) + '...' : 'AUCUN ❌'}`);

  if (user.email_confirmation_expires) {
    const expires = new Date(user.email_confirmation_expires);
    const now = new Date();
    const isExpired = expires < now;
    console.log(`   Expire le: ${expires.toLocaleString('fr-FR')} ${isExpired ? '⏰ EXPIRÉ' : '✅ Valide'}`);
  }

  // Chercher dans les logs du serveur
  console.log('\n📋 Analyse:');
  if (!user.email_confirmation_token) {
    console.log('⚠️  AUCUN TOKEN de confirmation !');
    console.log('   Cela signifie que l\'inscription n\'a PAS créé de token');
    console.log('   → L\'email n\'a donc PAS pu être envoyé');
  }

  await prisma.$disconnect();
}

check()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
