import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  const m = await p.learningModule.findFirst({
    where: { slug: 'mental-du-gagnant' },
    select: { has_quiz: true, content_json: true, order_index: true },
  });
  if (!m) { console.log('NOT FOUND'); return; }
  console.log('has_quiz:', m.has_quiz);
  const blocks = JSON.parse(m.content_json || '[]') as any[];
  console.log('total blocks:', blocks.length);
  const hasProfileQuiz = blocks.some(b => b.type === 'profile-quiz');
  console.log('has profile-quiz block:', hasProfileQuiz);
  console.log('block types:', blocks.map(b => b.type).join(', '));
  await p.$disconnect();
}
run();
