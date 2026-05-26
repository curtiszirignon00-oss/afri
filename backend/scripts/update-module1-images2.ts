/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const module = await prisma.learningModule.findFirst({
        where: { slug: 'fondations-bourse-brvm' },
        select: { id: true, content_json: true },
    });

    if (!module?.content_json) { console.error('❌ Module introuvable'); process.exit(1); }

    const blocks: any[] = JSON.parse(module.content_json);

    // ── Image 1 : après section-title 1.2 + paragraph "Comprendre cette distinction…" ──
    const idx12 = blocks.findIndex(
        (b: any) => b.type === 'section-title' && b.text?.includes('1.2')
    );
    if (idx12 === -1) { console.error('❌ Section 1.2 introuvable'); process.exit(1); }

    // Le paragraph "Comprendre cette distinction est fondamental :" est juste après le section-title
    const afterParagraphIdx = blocks[idx12 + 1]?.type === 'paragraph' ? idx12 + 1 : idx12;

    if (!blocks.some((b: any) => b.src?.includes('module1-marche-primaire-secondaire'))) {
        blocks.splice(afterParagraphIdx + 1, 0, {
            type: 'image',
            src: '/images/module1-marche-primaire-secondaire.png',
            caption: 'Marché primaire vs marché secondaire : deux étapes du même circuit financier',
        });
        console.log('✅ Image 1 insérée après §1.2 + paragraph');
    } else {
        console.log('ℹ️  Image 1 déjà présente');
    }

    // ── Image 2 : après heading "🌍 Une bourse régionale unique au monde" ──
    const idxUemoa = blocks.findIndex(
        (b: any) => b.type === 'heading' && b.text?.includes('bourse régionale unique')
    );
    if (idxUemoa === -1) { console.error('❌ Heading UEMOA introuvable'); process.exit(1); }

    if (!blocks.some((b: any) => b.src?.includes('module1-carte-uemoa'))) {
        blocks.splice(idxUemoa + 1, 0, {
            type: 'image',
            src: '/images/module1-carte-uemoa.jpg',
            caption: 'Les 8 pays membres de l\'UEMOA partageant la BRVM',
        });
        console.log('✅ Image 2 insérée après heading UEMOA');
    } else {
        console.log('ℹ️  Image 2 déjà présente');
    }

    await prisma.learningModule.update({
        where: { id: module.id },
        data: { content_json: JSON.stringify(blocks) },
    });

    console.log('✨ Module 1 mis à jour.');
}

main()
    .catch(err => { console.error('❌', err); process.exit(1); })
    .finally(() => prisma.$disconnect());
