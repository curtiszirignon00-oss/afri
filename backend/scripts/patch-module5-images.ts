import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const module = await prisma.learningModule.findFirst({
    where: { slug: 'acteurs-du-jeu' },
    select: { id: true, content_json: true },
  });

  if (!module?.content_json) {
    console.error('Module not found or no content_json');
    await prisma.$disconnect();
    return;
  }

  const blocks: any[] = JSON.parse(module.content_json);

  // Image 1: after "5.1 architecture tripartite" section-title (index 1), before paragraph (index 2)
  const idx1 = blocks.findIndex(
    (b) => b.type === 'section-title' && b.text.includes('architecture tripartite')
  );

  // Image 2: before "5.5 Autres Acteurs" section-title
  const idx2 = blocks.findIndex(
    (b) => b.type === 'section-title' && b.text.includes('5.5')
  );

  if (idx1 === -1 || idx2 === -1) {
    console.error('Could not find insertion points. idx1:', idx1, 'idx2:', idx2);
    await prisma.$disconnect();
    return;
  }

  console.log(`Inserting image 1 after index ${idx1} ("${blocks[idx1].text}")`);
  console.log(`Inserting image 2 before index ${idx2} ("${blocks[idx2].text}")`);

  // Insert image 2 first (higher index) so idx1 position stays valid
  blocks.splice(idx2, 0, {
    type: 'image',
    src: '/images/module3-sgi-role.png',
    caption: 'Le rôle de la SGI dans la chaîne de traitement des ordres',
  });

  // Insert image 1 after section-title at idx1
  blocks.splice(idx1 + 1, 0, {
    type: 'image',
    src: '/images/module3-architecture-tripartite.png',
    caption: "L'architecture tripartite du marché financier UEMOA",
  });

  await prisma.learningModule.update({
    where: { id: module.id },
    data: { content_json: JSON.stringify(blocks) },
  });

  console.log(`✅ Done — ${blocks.length} blocks total`);
  console.log('Block types:', blocks.map((b, i) => `${i}:${b.type}`).join(', '));
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
