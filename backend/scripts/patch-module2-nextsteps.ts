import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function run() {
  const mod = await p.learningModule.findFirst({
    where: { slug: 'brvm-en-chiffres' },
    select: { id: true, content_json: true },
  });
  if (!mod?.content_json) { console.error('Module introuvable'); return; }

  const blocks = JSON.parse(mod.content_json) as any[];

  // Trouver le bloc list qui contient les prochaines étapes (après le heading 🧭)
  const listBlock = blocks.find(
    (b: any) => b.type === 'list' &&
      b.items?.some((it: string) => it.includes('Les Acteurs du Jeu') || it.includes('Les Instruments'))
  );

  if (!listBlock) { console.error('Bloc list Prochaines Étapes introuvable'); return; }

  listBlock.items = [
    '<strong>Module 3 :</strong> Objectifs &amp; Profil — Définir ses Objectifs et son Horizon',
    '<strong>Module 4 :</strong> Les Acteurs du Jeu – Qui fait quoi sur le marché ?',
  ];
  console.log('✅ Prochaines Étapes mis à jour');

  await p.learningModule.update({
    where: { id: mod.id },
    data: { content_json: JSON.stringify(blocks) },
  });

  console.log('🎉 Module 2 patché. Vide le cache Redis pour voir les changements.');
  await p.$disconnect();
}
run();
