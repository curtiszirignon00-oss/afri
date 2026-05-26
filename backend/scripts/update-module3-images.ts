import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const mod = await prisma.learningModule.findFirst({
        where: { slug: 'acteurs-du-jeu' },
        select: { id: true, content_json: true },
    });
    if (!mod) { console.error('❌ Module introuvable'); process.exit(1); }

    const blocks: any[] = JSON.parse(mod.content_json!);
    console.log(`Total blocks avant: ${blocks.length}`);

    const img1 = {
        type: 'image',
        src: 'https://afribourse-api.onrender.com/images/module3-architecture-tripartite.png',
        caption: "L'architecture tripartite du marché financier régional",
    };

    const img2 = {
        type: 'image',
        src: 'https://afribourse-api.onrender.com/images/module3-sgi-role.png',
        caption: "Les rôles clés d'une SGI",
    };

    // Insert img2 first (higher index) so that img1 insertion at lower index stays correct
    // img2 goes after block [23]
    blocks.splice(24, 0, img2);
    console.log('✅ Image 2 insérée après bloc [23] (SGI roles list)');

    // img1 goes after block [1]
    blocks.splice(2, 0, img1);
    console.log('✅ Image 1 insérée après bloc [1] (heading architecture tripartite)');

    console.log(`Total blocks après: ${blocks.length}`);

    await prisma.learningModule.update({
        where: { id: mod.id },
        data: { content_json: JSON.stringify(blocks) },
    });
    console.log('✨ Terminé — module 3 mis à jour.');
}

main().finally(() => prisma.$disconnect());
