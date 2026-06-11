import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const m = await prisma.learningModule.findFirst({
        where: { slug: 'outils-investisseur' },
        select: { content_json: true },
    });
    const blocks: any[] = JSON.parse(m!.content_json!);
    blocks.forEach((b, i) => {
        const txt = JSON.stringify(b).slice(0, 150);
        console.log(`[${i}] ${txt}`);
    });
}
main().finally(() => prisma.$disconnect());
