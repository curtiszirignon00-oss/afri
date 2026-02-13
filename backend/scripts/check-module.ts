// backend/scripts/check-module.ts
// Script de diagnostic pour vérifier si le module 0 existe dans la base de données

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkModule() {
    console.log('🔍 Vérification du module "pret-decollage" (Module 0)...\n');

    try {
        // Chercher le module par slug
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'pret-decollage' },
        });

        if (module) {
            console.log('✅ Module trouvé dans la base de données:');
            console.log(`   - ID: ${module.id}`);
            console.log(`   - Titre: ${module.title}`);
            console.log(`   - Slug: ${module.slug}`);
            console.log(`   - Order Index: ${module.order_index}`);
            console.log(`   - Publié: ${module.is_published}`);
            console.log(`   - Niveau: ${module.difficulty_level}`);
        } else {
            console.log('❌ Module "pret-decollage" NON TROUVÉ dans la base de données!');
            console.log('\n📋 Solution: Exécutez le script de seed pour créer les modules:');
            console.log('   npx ts-node src/seed-learning.ts');
        }

        // Lister tous les modules existants
        console.log('\n📚 Liste de tous les modules dans la base de données:');
        const allModules = await prisma.learningModule.findMany({
            select: {
                id: true,
                title: true,
                slug: true,
                order_index: true,
                is_published: true,
            },
            orderBy: { order_index: 'asc' },
        });

        if (allModules.length === 0) {
            console.log('   ⚠️ Aucun module trouvé! Exécutez: npx ts-node src/seed-learning.ts');
        } else {
            allModules.forEach((m, i) => {
                console.log(`   ${i + 1}. [${m.order_index}] ${m.title} (slug: ${m.slug}) - ${m.is_published ? '✅ Publié' : '❌ Non publié'}`);
            });
        }

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkModule();
