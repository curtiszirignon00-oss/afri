/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function grantAdminPremium(email: string) {
  try {
    console.log(`🔍 Recherche de l'utilisateur: ${email}...`);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.name} ${user.lastname || ''}`);
    console.log(`   Rôle actuel: ${user.role}`);
    console.log(`   Abonnement actuel: ${user.subscriptionTier}`);

    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: 'admin',
        subscriptionTier: 'max',
      },
    });

    console.log(`\n🎉 Succès!`);
    console.log(`   Nouveau rôle: ${updated.role}`);
    console.log(`   Nouvel abonnement: ${updated.subscriptionTier}`);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

grantAdminPremium('contact@africbourse.com');
