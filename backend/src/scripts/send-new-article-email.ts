/**
 * Diffuse l'email « nouvel article » à tous les utilisateurs, pour un article
 * déjà en base (utile quand l'article a été inséré directement en base, sans
 * passer par l'API admin qui déclenche l'envoi automatiquement).
 *
 * Usage (par slug) :
 *   SLUG=agl-ci-sdsc-benefice-qui-cache-une-perte npx tsx src/scripts/send-new-article-email.ts
 * Usage (par id) :
 *   ARTICLE_ID=6a... npx tsx src/scripts/send-new-article-email.ts
 * Dry-run (aucun envoi, juste le décompte) :
 *   DRY_RUN=true SLUG=... npx tsx src/scripts/send-new-article-email.ts
 * Options :
 *   DELAY_MS=1500          délai entre envois (défaut 1500)
 *   VERIFIED_ONLY=true     n'envoyer qu'aux emails vérifiés (défaut : tous)
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { broadcastNewArticleEmail } from '../services/article-email.service';

dotenv.config();

const prisma = new PrismaClient();

async function run() {
  const slug = process.env.SLUG?.trim();
  const articleIdEnv = process.env.ARTICLE_ID?.trim();
  const dryRun = process.env.DRY_RUN === 'true';
  const delayMs = process.env.DELAY_MS ? parseInt(process.env.DELAY_MS, 10) : 1500;
  const verifiedOnly = process.env.VERIFIED_ONLY === 'true';

  if (!slug && !articleIdEnv) {
    console.error('❌ Précisez SLUG=... ou ARTICLE_ID=...');
    process.exit(1);
  }

  let articleId = articleIdEnv;
  if (!articleId && slug) {
    const a = await prisma.newsArticle.findFirst({ where: { slug }, select: { id: true, title: true } });
    if (!a) {
      console.error(`❌ Aucun article avec le slug « ${slug} ».`);
      process.exit(1);
    }
    articleId = a.id;
    console.log(`📰 Article trouvé : "${a.title}" (${a.id})`);
  }

  console.log('='.repeat(60));
  console.log(dryRun ? '⚠️  MODE DRY-RUN — aucun email ne sera envoyé' : '📬 Envoi réel en cours…');
  console.log('='.repeat(60));

  const res = await broadcastNewArticleEmail(articleId!, { delayMs, dryRun, verifiedOnly });

  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT');
  console.log('='.repeat(60));
  console.log(`Destinataires : ${res.total}`);
  console.log(`✅ Envoyés     : ${res.sent}`);
  console.log(`❌ Échecs      : ${res.failed}`);
  if (dryRun) console.log('\n💡 Relancez sans DRY_RUN=true pour envoyer réellement.');
  console.log('');
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Erreur fatale :', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
