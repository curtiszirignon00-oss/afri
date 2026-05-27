import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const mods = await p.learningModule.findMany({
    select: { order_index: true, slug: true, has_quiz: true },
    orderBy: { order_index: 'asc' },
    take: 10,
  });
  mods.forEach(m => console.log(`[${m.order_index}] has_quiz=${m.has_quiz}  ${m.slug}`));
  await p.$disconnect();
}
run();
