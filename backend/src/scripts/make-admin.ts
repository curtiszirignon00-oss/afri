import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  try {
    console.log(`🔍 Recherche de l'utilisateur avec l'email: ${email}...`);

    // Trouver l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      console.log('💡 Assurez-vous que l\'utilisateur existe d\'abord.');
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.name} ${user.lastname || ''} (${user.email})`);
    console.log(`📋 Rôle actuel: ${user.role}`);

    // Mettre à jour le rôle en admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'admin' },
    });

    console.log(`\n🎉 Succès! ${updatedUser.email} est maintenant administrateur!`);
    console.log(`📋 Nouveau rôle: ${updatedUser.role}`);
    console.log(`\n✅ L'utilisateur peut maintenant accéder à /admin/subscription-stats`);

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'email depuis les arguments de la ligne de commande
const email = process.argv[2];

if (!email) {
  console.error('❌ Erreur: Veuillez fournir un email');
  console.log('\n📖 Usage: npx ts-node src/scripts/make-admin.ts <email>');
  console.log('📖 Exemple: npx ts-node src/scripts/make-admin.ts user@example.com');
  process.exit(1);
}

makeAdmin(email);
