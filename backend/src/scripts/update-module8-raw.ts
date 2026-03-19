/**
 * update-module8-raw.ts
 * Uses Prisma $runCommandRaw to update module 8 without needing prisma generate.
 * Run: npx ts-node src/scripts/update-module8-raw.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find the module 8 _id first
    const module8 = await prisma.learningModule.findFirst({
        where: { order_index: 8 },
        select: { id: true, title: true, slug: true },
    });

    if (!module8) {
        console.error('Module 8 introuvable');
        process.exit(1);
    }

    console.log(`Module trouvé: ${module8.title} (${module8.slug})`);

    // Use raw MongoDB command to update (bypasses Prisma type check)
    const result = await prisma.$runCommandRaw({
        update: 'learning_modules',
        updates: [
            {
                q: { _id: { $oid: module8.id } },
                u: {
                    $set: {
                        attachment_url: '/files/UNIWAX_Rapport_Analyse_Complete_2026.pdf',
                        dashboard_url: 'https://www.africbourse.com/stock/UNXC/UNIWAX_Dashboard_Analytique',
                    },
                },
            },
        ],
    });

    console.log('Résultat:', JSON.stringify(result));
    console.log('Module 8 mis à jour avec succès.');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
