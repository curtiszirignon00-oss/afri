// backend/scripts/publishArticleBanquesCI9M2026.ts
// Publie « Banques ivoiriennes : le grand écart » (résultats 9M 2026) sur /news.
// Notification in-app uniquement — AUCUN email (broadcastNewArticleEmail non appelé).
// Usage : npx tsx scripts/publishArticleBanquesCI9M2026.ts "<chemin du .html>"

import 'dotenv/config';
import fs from 'fs';
import { prisma } from '../src/config/database';
import { notifyAllUsersOfNewArticle } from '../src/services/notification.service';

const TITLE = 'Banques ivoiriennes : le grand écart';
const SLUG = 'banques-ivoiriennes-grand-ecart-resultats-9m-2026';
const SUMMARY =
  "Même marché, même baisse de taux, mêmes clients : pourtant le résultat net à 9 mois va de +14,7 % chez BICICI à −26,6 % chez NSIA Banque. " +
  "BICICI, SIB, SGCI, NSIA Banque CI et Ecobank CI passées au crible : les dépôts affluent, le crédit stagne, et la différence se fait sur la capacité " +
  "à faire travailler cette liquidité sans dégrader le risque. Trimestres isolés, coefficients d'exploitation, ratio crédits/dépôts, risque souverain et notre classement.";

async function main() {
  const file = process.argv[2];
  if (!file || !fs.existsSync(file)) throw new Error(`Fichier HTML introuvable : ${file}`);
  const html = fs.readFileSync(file, 'utf8');

  const existing = await prisma.newsArticle.findFirst({ where: { OR: [{ slug: SLUG }, { title: TITLE }] }, select: { id: true } });
  if (existing) throw new Error(`Article déjà publié (id=${existing.id}) — rien à faire.`);

  const article = await prisma.newsArticle.create({
    data: {
      title: TITLE,
      slug: SLUG,
      summary: SUMMARY,
      content: html,
      rich_content: null,
      tickers: ['BICC', 'SIBC', 'SGBC', 'NSBC', 'ECOC'],
      category: 'resultats',
      author: 'AfriBourse Research',
      source: 'AfriBourse Research',
      country: "Côte d'Ivoire",
      sector: 'Banques',
      image_url: null,
      is_featured: false,
      published_at: new Date(),
    },
  });
  console.log(`✅ Article créé : ${article.id} → https://www.africbourse.com/news/${article.slug}`);

  const n = await notifyAllUsersOfNewArticle(article.id, article.title, article.slug, article.category);
  console.log(`🔔 ${n} notifications in-app créées (aucun email envoyé).`);
}

main()
  .catch(err => { console.error('❌', err.message ?? err); process.exit(1); })
  .finally(() => prisma.$disconnect());
