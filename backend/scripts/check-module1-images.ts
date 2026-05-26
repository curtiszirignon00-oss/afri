import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const m = await prisma.learningModule.findFirst({ where: { slug: 'fondations-bourse-brvm' }, select: { content_json: true } });
    const blocks = JSON.parse(m!.content_json!);
    const images = blocks.filter((b: any) => b.type === 'image');
    console.log('Blocs image trouvés:', JSON.stringify(images, null, 2));
}
main().finally(() => prisma.$disconnect());
