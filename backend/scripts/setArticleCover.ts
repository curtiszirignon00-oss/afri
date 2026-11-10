// backend/scripts/setArticleCover.ts
// Convertit une image (AVIF, PNG…) en JPEG 1200px (compatible aperçus OG WhatsApp/Facebook),
// l'envoie sur le stockage (R2) comme l'upload admin, puis l'associe à l'article.
// Usage : npx tsx scripts/setArticleCover.ts <slug> "<chemin image>"

import 'dotenv/config';
import fs from 'fs';
import sharp from 'sharp';
import { prisma } from '../src/config/database';
import { persistFile, R2_ENABLED } from '../src/config/upload.config';

async function main() {
  const [slug, file] = process.argv.slice(2);
  if (!slug || !file || !fs.existsSync(file)) throw new Error('Usage : setArticleCover.ts <slug> <image>');
  if (!R2_ENABLED) throw new Error('R2 non configuré dans .env — upload impossible vers la prod.');

  const article = await prisma.newsArticle.findFirst({ where: { slug }, select: { id: true, image_url: true } });
  if (!article) throw new Error(`Article introuvable : ${slug}`);

  const buffer = await sharp(fs.readFileSync(file))
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();

  const { url } = await persistFile(
    { buffer, mimetype: 'image/jpeg', originalname: 'cover.jpg', size: buffer.length } as Express.Multer.File,
    'posts',
  );

  await prisma.newsArticle.update({ where: { id: article.id }, data: { image_url: url } });
  console.log(`✅ Cover (${(buffer.length / 1024).toFixed(0)} Ko) : ${url}`);
  if (article.image_url) console.log(`   (ancienne : ${article.image_url})`);
}

main()
  .catch(err => { console.error('❌', err.message ?? err); process.exit(1); })
  .finally(() => prisma.$disconnect());
