import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const mod = await p.learningModule.findFirst({
    where: { slug: 'fondations-bourse-brvm' },
    select: { id: true, content_json: true },
  });
  if (!mod?.content_json) { console.log('pas de content_json'); return; }
  const blocks = JSON.parse(mod.content_json) as any[];
  blocks.forEach((b: any, i: number) => {
    if (b.type === 'objectives' || b.type === 'list' || b.type === 'paragraph' || b.type === 'heading') {
      console.log(`\n[${i}] type=${b.type}`);
      if (b.title) console.log('  title:', b.title);
      if (b.subtitle) console.log('  subtitle:', b.subtitle);
      if (b.text) console.log('  text:', b.text.slice(0, 120));
      if (b.items) b.items.forEach((it: string, j: number) => console.log(`  item[${j}]:`, it.slice(0, 100)));
    }
  });
  await p.$disconnect();
}
run();
