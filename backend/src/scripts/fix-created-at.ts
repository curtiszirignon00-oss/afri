/// <reference types="node" />
// Script pour corriger les created_at null dans la table users
import prisma from '../config/prisma';

async function fixCreatedAt() {
  console.log('🔧 Fixing null created_at fields...');

  try {
    // Trouver tous les utilisateurs avec created_at null
    const usersWithNullCreatedAt = await prisma.user.findMany({
      where: {
        created_at: null
      }
    });

    console.log(`Found ${usersWithNullCreatedAt.length} users with null created_at`);

    // Mettre à jour chaque utilisateur
    for (const user of usersWithNullCreatedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { created_at: new Date() }
      });
      console.log(`✅ Fixed user ${user.email}`);
    }

    console.log('✅ All users fixed!');
  } catch (error) {
    console.error('❌ Error fixing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCreatedAt();
