import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const m = await prisma.learningModule.findFirst({
        where: { slug: 'acteurs-du-jeu' },
        select: { content_json: true },
    });
    const blocks: any[] = JSON.parse(m!.content_json!);
    blocks.forEach((b, i) => {
        const txt = JSON.stringify(b).slice(0, 120);
        console.log(`[${i}] ${txt}`);
    });
}
main().finally(() => prisma.$disconnect());
