/// <reference types="node" />
// backend/scripts/update-module1-image.ts
// Insère le bloc image dans le content_json du module 1 (fondations-bourse-brvm)
// juste après le section-title "🧩 1.1 Qu'est-ce qu'un marché financier ?"

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const module = await prisma.learningModule.findFirst({
        where: { slug: 'fondations-bourse-brvm' },
        select: { id: true, title: true, content_json: true },
    });

    if (!module) {
        console.error('❌ Module "fondations-bourse-brvm" introuvable.');
        process.exit(1);
    }

    if (!module.content_json) {
        console.error('❌ Le module n\'a pas de content_json.');
        process.exit(1);
    }

    const blocks: any[] = JSON.parse(module.content_json);

    // Trouver l'index du section-title 1.1
    const idx = blocks.findIndex(
        (b: any) => b.type === 'section-title' && b.text?.includes('1.1')
    );

    if (idx === -1) {
        console.error('❌ Section-title "1.1" introuvable dans le content_json.');
        process.exit(1);
    }

    // Vérifier si l'image est déjà présente juste après
    const next = blocks[idx + 1];
    if (next?.type === 'image' && next?.src?.includes('module1-marche-financier')) {
        console.log('ℹ️  Bloc image déjà présent, aucune modification nécessaire.');
        process.exit(0);
    }

    // Insérer le bloc image après le section-title
    const imageBlock = {
        type: 'image',
        src: '/images/module1-marche-financier.png',
        caption: "Le marché financier : là où l'épargne rencontre l'investissement",
    };

    blocks.splice(idx + 1, 0, imageBlock);

    await prisma.learningModule.update({
        where: { id: module.id },
        data: { content_json: JSON.stringify(blocks) },
    });

    console.log(`✅ Bloc image inséré après le point 1.1 dans "${module.title}"`);
}

main()
    .catch(err => { console.error('❌', err); process.exit(1); })
    .finally(() => prisma.$disconnect());
