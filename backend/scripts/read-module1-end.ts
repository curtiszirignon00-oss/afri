import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const mod = await p.learningModule.findFirst({
    where: { slug: 'fondations-bourse-brvm' },
    select: { id: true, content_json: true },
  });
  if (!mod?.content_json) { console.log('pas de content_json'); return; }
  const blocks = JSON.parse(mod.content_json) as any[];
  const last = blocks.slice(38);
  const offset = 38;
  last.forEach((b: any, i: number) => {
    console.log(`\n[${offset + i}] type=${b.type}`);
    console.log(JSON.stringify(b).slice(0, 400));
  });
  console.log('\nTotal blocs:', blocks.length);
  await p.$disconnect();
}
run();
