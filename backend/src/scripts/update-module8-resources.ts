/**
 * Script: update-module8-resources.ts
 * Updates module 8 (order_index=8) with PDF attachment and dashboard URL.
 * Run: npx ts-node src/scripts/update-module8-resources.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const module8 = await prisma.learningModule.findFirst({
        where: { order_index: 8 },
        select: { id: true, title: true, slug: true },
    });

    if (!module8) {
        console.error('Module 8 introuvable (order_index=8)');
        process.exit(1);
    }

    console.log(`Module trouvé: ${module8.title} (${module8.slug})`);

    await prisma.learningModule.update({
        where: { id: module8.id },
        data: {
            attachment_url: '/files/UNIWAX_Rapport_Analyse_Complete_2026.pdf',
            dashboard_url: 'https://www.africbourse.com/stock/UNXC/UNIWAX_Dashboard_Analytique',
        },
    });

    console.log('Module 8 mis à jour avec succès :');
    console.log('  attachment_url → /files/UNIWAX_Rapport_Analyse_Complete_2026.pdf');
    console.log('  dashboard_url  → https://www.africbourse.com/stock/UNXC/UNIWAX_Dashboard_Analytique');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
