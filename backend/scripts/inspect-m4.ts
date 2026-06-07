import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const m = await prisma.learningModule.findFirst({
        where: { slug: 'outils-investisseur' },
        select: { content_json: true, content: true },
    });
    const blocks = JSON.parse(m!.content_json!);
    const b = blocks.find((b: any) => JSON.stringify(b).includes('Produit') || JSON.stringify(b).includes('prochaine') || JSON.stringify(b).includes('Prochaine'));
    console.log('Bloc trouvé:', JSON.stringify(b));
    const raw = m!.content_json!;
    const idx = raw.indexOf('Prochaine');
    if (idx >= 0) console.log('Extrait JSON raw:', raw.slice(idx, idx + 150));

    const htmlIdx = m!.content?.indexOf('Prochaine');
    if (htmlIdx && htmlIdx >= 0) console.log('Extrait HTML raw:', m!.content?.slice(htmlIdx, htmlIdx + 150));
}
main().finally(() => prisma.$disconnect());
