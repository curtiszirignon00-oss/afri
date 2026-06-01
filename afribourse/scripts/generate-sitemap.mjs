#!/usr/bin/env node
/**
 * scripts/generate-sitemap.mjs
 *
 * Génère public/sitemap.xml au moment du build :
 *   1. Routes statiques connues
 *   2. Fetch des symboles actions depuis l'API → URLs /stock/:symbol
 *
 * Usage : node scripts/generate-sitemap.mjs
 * Appelé automatiquement par "build" dans package.json.
 */

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'public', 'sitemap.xml');
const SITE_URL    = 'https://africbourse.com';
const API_URL     = 'https://afribourse-api.onrender.com/api';
const TODAY       = new Date().toISOString().slice(0, 10);

const STATIC_ROUTES = [
  { path: '/',              changefreq: 'daily',   priority: '1.0' },
  { path: '/markets',       changefreq: 'hourly',  priority: '0.9' },
  { path: '/indices',       changefreq: 'hourly',  priority: '0.8' },
  { path: '/news',          changefreq: 'daily',   priority: '0.8' },
  { path: '/learn',         changefreq: 'weekly',  priority: '0.8' },
  { path: '/glossary',      changefreq: 'monthly', priority: '0.7' },
  { path: '/formation',     changefreq: 'weekly',  priority: '0.7' },
  { path: '/essai-gratuit', changefreq: 'monthly', priority: '0.6' },
  { path: '/community',     changefreq: 'daily',   priority: '0.6' },
  { path: '/communities',   changefreq: 'weekly',  priority: '0.6' },
  { path: '/classement',    changefreq: 'daily',   priority: '0.5' },
  { path: '/about',         changefreq: 'monthly', priority: '0.5' },
  { path: '/help',          changefreq: 'monthly', priority: '0.5' },
  { path: '/contact',       changefreq: 'yearly',  priority: '0.4' },
];

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchSymbols() {
  try {
    const res = await fetch(`${API_URL}/stocks`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data.map(s => s.symbol).filter(Boolean) : [];
  } catch (err) {
    console.warn('[sitemap] API inaccessible, URLs /stock/* ignorées :', err.message);
    return [];
  }
}

async function main() {
  console.log('[sitemap] Génération de sitemap.xml...');

  const symbols = await fetchSymbols();
  console.log(`[sitemap] ${symbols.length} symboles récupérés`);

  const staticEntries = STATIC_ROUTES.map(r =>
    urlEntry({ loc: `${SITE_URL}${r.path}`, lastmod: TODAY, changefreq: r.changefreq, priority: r.priority })
  ).join('');

  const stockEntries = symbols.map(symbol =>
    urlEntry({
      loc: `${SITE_URL}/stock/${encodeURIComponent(symbol)}`,
      lastmod: TODAY,
      changefreq: 'daily',
      priority: '0.6',
    })
  ).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${stockEntries}
</urlset>
`;

  writeFileSync(OUTPUT_PATH, xml, 'utf8');
  console.log(`[sitemap] Écrit dans ${OUTPUT_PATH} (${STATIC_ROUTES.length} routes statiques + ${symbols.length} actions BRVM)`);
}

main();
