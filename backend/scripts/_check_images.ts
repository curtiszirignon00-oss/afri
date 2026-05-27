import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  await prisma.$connect();

  const articles = await (prisma as any).article.findMany({ select: { image_url: true, title: true }, take: 3 });
  console.log('=== ARTICLE IMAGE URLs ===');
  articles.forEach((a: any) => console.log(a.image_url));

  console.log('\n=== MODULE IMAGE BLOCKS ===');
  const mods = await prisma.learningModule.findMany({ select: { slug: true, order_index: true, content_json: true } });
  let found = 0;
  for (const m of mods) {
    const blocks = JSON.parse(m.content_json || '[]') as any[];
    const imgs = blocks.filter((b: any) => b.type === 'image' || b.type === 'img');
    if (imgs.length) {
      found++;
      console.log('M' + m.order_index, m.slug);
      imgs.forEach((b: any) => console.log('  ', JSON.stringify(b)));
    }
  }
  if (!found) console.log('(aucun bloc image trouvé dans les modules)');

  await prisma.$disconnect();
}
main().catch(console.error);
