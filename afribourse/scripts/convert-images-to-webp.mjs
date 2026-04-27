#!/usr/bin/env node
// Conversion PNG → WebP pour les images chargées par le client.
// On garde les originaux en place (Git history + fallback). Les WebP sont les fichiers servis.
//
// Usage: node scripts/convert-images-to-webp.mjs

import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// Cibles : PNG > 50 KB dans ces sous-dossiers (les autres restent en PNG).
const TARGET_DIRS = [
  'screenshot',  // PWA screenshots (manifest.json)
  'avatars',     // Avatars HomePage testimonials
  'images',      // Articles HomePage
];

const QUALITY = 82; // bon compromis qualité/taille pour photos & captures
const MIN_SIZE_BYTES = 50 * 1024; // 50 KB

async function findPngs(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await findPngs(p)));
    } else if (e.isFile() && extname(e.name).toLowerCase() === '.png') {
      const s = await stat(p);
      if (s.size >= MIN_SIZE_BYTES) out.push({ path: p, size: s.size });
    }
  }
  return out;
}

function fmt(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

async function main() {
  let totalIn = 0, totalOut = 0, count = 0;
  for (const sub of TARGET_DIRS) {
    const dir = join(PUBLIC_DIR, sub);
    const pngs = await findPngs(dir);
    if (!pngs.length) {
      console.log(`(skip) ${sub}/ — aucun PNG > ${fmt(MIN_SIZE_BYTES)}`);
      continue;
    }
    console.log(`\n>> ${sub}/ — ${pngs.length} fichier(s)`);
    for (const { path, size } of pngs) {
      const outPath = path.replace(/\.png$/i, '.webp');
      try {
        await sharp(path).webp({ quality: QUALITY }).toFile(outPath);
        const outSize = (await stat(outPath)).size;
        const ratio = ((1 - outSize / size) * 100).toFixed(1);
        console.log(`  ✓ ${basename(path)} ${fmt(size)} → ${fmt(outSize)} (-${ratio}%)`);
        totalIn += size;
        totalOut += outSize;
        count++;
      } catch (err) {
        console.error(`  ✗ ${basename(path)} — ${err.message}`);
      }
    }
  }
  if (count > 0) {
    const saved = totalIn - totalOut;
    const ratio = ((saved / totalIn) * 100).toFixed(1);
    console.log(`\n=== Total: ${count} fichiers, ${fmt(totalIn)} → ${fmt(totalOut)} (économie ${fmt(saved)} / -${ratio}%)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
