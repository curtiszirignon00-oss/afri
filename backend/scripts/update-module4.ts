import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const mod = await prisma.learningModule.findFirst({
        where: { slug: 'outils-investisseur' },
        select: { id: true, content_json: true },
    });
    if (!mod) { console.error('❌ Module introuvable'); process.exit(1); }

    const blocks: any[] = JSON.parse(mod.content_json!);
    console.log(`Total blocks avant: ${blocks.length}`);

    // 1. Update objectives subtitle
    if (blocks[0]?.type === 'objectives') {
        blocks[0].subtitle = 'À la fin de ce module, vous serez capable de :';
        console.log('✅ Subtitle objectifs mis à jour');
    }

    // 2. Find block index for "obligation, c'est un contrat de confiance"
    const obligIdx = blocks.findIndex((b: any) =>
        b.type === 'callout' &&
        JSON.stringify(b).includes('contrat de confiance')
    );
    if (obligIdx === -1) { console.error('❌ Bloc obligation not found'); process.exit(1); }
    console.log(`   Bloc obligation trouvé à [${obligIdx}]`);

    // 3. Find block index for ETF BRVM Composite paragraph
    const etfIdx = blocks.findIndex((b: any) =>
        b.type === 'paragraph' &&
        JSON.stringify(b).includes('BRVM Composite')
    );
    if (etfIdx === -1) { console.error('❌ Bloc ETF not found'); process.exit(1); }
    console.log(`   Bloc ETF trouvé à [${etfIdx}]`);

    // 4. Find block index for "Aucun investissement n'est sans risque"
    const risqueIdx = blocks.findIndex((b: any) =>
        b.type === 'callout' &&
        JSON.stringify(b).includes('sans risque')
    );
    if (risqueIdx === -1) { console.error('❌ Bloc risque not found'); process.exit(1); }
    console.log(`   Bloc risque trouvé à [${risqueIdx}]`);

    const img1 = {
        type: 'image',
        src: 'https://afribourse-api.onrender.com/images/module4-obligation.png',
        caption: 'Une obligation : un contrat de confiance',
    };
    const img2 = {
        type: 'image',
        src: 'https://afribourse-api.onrender.com/images/module4-etf-brvm.png',
        caption: 'Fonctionnement d\'un ETF BRVM',
    };
    const img3 = {
        type: 'image',
        src: 'https://afribourse-api.onrender.com/images/module4-risque-rendement.png',
        caption: 'Risque vs Rendement : choisir selon son profil',
    };

    // Insert in reverse order (highest index first) to preserve positions
    blocks.splice(risqueIdx + 1, 0, img3);
    console.log(`✅ Image 3 insérée après bloc [${risqueIdx}]`);

    blocks.splice(etfIdx + 1, 0, img2);
    console.log(`✅ Image 2 insérée après bloc [${etfIdx}]`);

    blocks.splice(obligIdx + 1, 0, img1);
    console.log(`✅ Image 1 insérée après bloc [${obligIdx}]`);

    console.log(`Total blocks après: ${blocks.length}`);

    await prisma.learningModule.update({
        where: { id: mod.id },
        data: { content_json: JSON.stringify(blocks) },
    });
    console.log('✨ Terminé — module 4 mis à jour.');
}

main().finally(() => prisma.$disconnect());
