import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const m = await prisma.learningModule.findFirst({
        where: { slug: 'outils-investisseur' },
        select: { content: true, content_json: true },
    });
    // Chercher les blocs contenant "Produits" ou "Module 4" ou "Prochaine"
    const blocks: any[] = JSON.parse(m!.content_json!);
    const relevant = blocks.filter((b: any) =>
        JSON.stringify(b).includes('Produit') ||
        JSON.stringify(b).includes('Prochaine') ||
        JSON.stringify(b).includes('prochaine') ||
        JSON.stringify(b).includes('Module 4') ||
        JSON.stringify(b).includes('Module 5')
    );
    console.log('Blocs JSON pertinents:', JSON.stringify(relevant, null, 2));
    // Et dans le HTML
    const htmlMatches = m!.content?.match(/.{0,30}(Produit|Prochaine|Module [45]).{0,60}/g);
    console.log('\nMatches HTML:', htmlMatches);
}
main().finally(() => prisma.$disconnect());
