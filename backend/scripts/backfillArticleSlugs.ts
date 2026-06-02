// backend/scripts/backfillArticleSlugs.ts
// Génère les slugs manquants pour tous les articles en base

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function backfillSlugs() {
  console.log('🔍 Recherche des articles sans slug...\n');

  const articles = await prisma.newsArticle.findMany({
    where: { slug: null },
    select: { id: true, title: true },
    orderBy: { published_at: 'asc' },
  });

  console.log(`📰 ${articles.length} article(s) sans slug trouvé(s)\n`);
  if (articles.length === 0) {
    console.log('✅ Tous les articles ont déjà un slug.');
    return;
  }

  // Charger les slugs existants pour détecter les collisions
  const existing = await prisma.newsArticle.findMany({
    where: { slug: { not: null } },
    select: { slug: true },
  });
  const usedSlugs = new Set(existing.map(a => a.slug as string));

  let updated = 0;
  let skipped = 0;

  for (const article of articles) {
    const base = slugify(article.title);
    if (!base) {
      console.log(`⚠️  Titre vide ou invalide pour id=${article.id}, ignoré`);
      skipped++;
      continue;
    }

    // Résoudre les collisions : base, base-2, base-3, …
    let slug = base;
    let counter = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${counter++}`;
    }
    usedSlugs.add(slug);

    await prisma.newsArticle.update({
      where: { id: article.id },
      data: { slug },
    });

    console.log(`✅ [${article.id}] "${article.title.slice(0, 60)}" → ${slug}`);
    updated++;
  }

  console.log(`\n🎉 Terminé : ${updated} slug(s) générés, ${skipped} ignorés.`);
}

backfillSlugs()
  .catch(err => { console.error('❌ Erreur :', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
