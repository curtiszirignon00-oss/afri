import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function run() {
  const mod = await p.learningModule.findFirst({
    where: { slug: 'mental-du-gagnant' },
    select: { id: true, content_json: true, order_index: true },
  });
  if (!mod?.content_json) { console.error('Module introuvable'); return; }

  const blocks = JSON.parse(mod.content_json) as any[];

  // Insérer le bloc profile-quiz juste avant le callout "Prochaine Étape"
  const nextStepIdx = blocks.findIndex(
    (b: any) => b.type === 'callout' && b.title?.includes('Prochaine')
  );

  const profileQuizBlock = { type: 'profile-quiz' };

  if (nextStepIdx !== -1) {
    blocks.splice(nextStepIdx, 0, profileQuizBlock);
    console.log(`✅ Bloc profile-quiz inséré à l'index ${nextStepIdx}`);
  } else {
    blocks.push(profileQuizBlock);
    console.log('✅ Bloc profile-quiz ajouté en fin de contenu');
  }

  await p.learningModule.update({
    where: { id: mod.id },
    data: {
      has_quiz: false,
      content_json: JSON.stringify(blocks),
    },
  });

  console.log(`🎉 Module 3 [${mod.order_index}] : has_quiz=false, profile-quiz ajouté (${blocks.length} blocs au total).`);
  console.log('💡 Vide le cache Redis pour voir les changements.');
  await p.$disconnect();
}
run();
