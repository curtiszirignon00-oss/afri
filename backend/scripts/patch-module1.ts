import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function run() {
  const mod = await p.learningModule.findFirst({
    where: { slug: 'fondations-bourse-brvm' },
    select: { id: true, content_json: true },
  });
  if (!mod?.content_json) { console.error('Module introuvable'); return; }

  const blocks = JSON.parse(mod.content_json) as any[];

  // 1. Bloc [0] objectives → ajouter subtitle
  if (blocks[0].type === 'objectives') {
    blocks[0].subtitle = 'À la fin de ce module, vous serez capable :';
    console.log('✅ [0] objectives : subtitle ajouté');
  }

  // 2. Bloc [40] callout "Prochaine étape" → mise à jour du titre du module 2
  const nextStep = blocks.find(
    (b: any) => b.type === 'callout' && b.title?.includes('Prochaine étape')
  );
  if (nextStep) {
    nextStep.paragraphs = nextStep.paragraphs.map((para: string) =>
      para.includes('Module 2')
        ? '👉 Prochaine leçon : Module 2 — Pourquoi la BRVM est la bonne opportunité pour vous'
        : para
    );
    console.log('✅ callout Prochaine étape : texte Module 2 mis à jour');
  }

  await p.learningModule.update({
    where: { id: mod.id },
    data: { content_json: JSON.stringify(blocks) },
  });

  console.log('\n🎉 Module 1 patché. Pense à vider le cache Redis.');
  await p.$disconnect();
}
run();
