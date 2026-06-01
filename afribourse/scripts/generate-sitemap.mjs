#!/usr/bin/env node
/**
 * scripts/generate-sitemap.mjs
 *
 * 1. Génère public/sitemap.xml (routes statiques + actions BRVM depuis l'API)
 * 2. Ping Google sitemap endpoint → crawl immédiat
 * 3. Ping IndexNow (Bing, Yandex) → indexation en quelques heures
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

// Clé IndexNow — doit aussi être déposée dans public/ (fait ci-dessous)
const INDEXNOW_KEY = 'afribourse-indexnow-2026';

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

// Ping Google pour dire "sitemap mis à jour, viens crawler"
async function pingGoogle(sitemapUrl) {
  try {
    const url = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const res = await fetch(url);
    console.log(`[ping] Google : ${res.status} ${res.status === 200 ? '✓' : '?'}`);
  } catch (err) {
    console.warn('[ping] Google inaccessible :', err.message);
  }
}

// IndexNow : signale les URLs mises à jour à Bing/Yandex/Google (quelques heures)
async function pingIndexNow(urls) {
  try {
    const body = {
      host: 'africbourse.com',
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    };
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    console.log(`[ping] IndexNow (Bing/Yandex) : ${res.status} ${res.status === 200 || res.status === 202 ? '✓' : '?'}`);
  } catch (err) {
    console.warn('[ping] IndexNow inaccessible :', err.message);
  }
}

async function main() {
  console.log('[sitemap] Génération de sitemap.xml...');

  const symbols = await fetchSymbols();
  console.log(`[sitemap] ${symbols.length} symboles récupérés`);

  const staticUrls = STATIC_ROUTES.map(r => `${SITE_URL}${r.path}`);
  const stockUrls  = symbols.map(s => `${SITE_URL}/stock/${encodeURIComponent(s)}`);
  const allUrls    = [...staticUrls, ...stockUrls];

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

  // Fichier de vérification IndexNow (doit être accessible à africbourse.com/<clé>.txt)
  const keyFilePath = join(__dirname, '..', 'public', `${INDEXNOW_KEY}.txt`);
  writeFileSync(keyFilePath, INDEXNOW_KEY, 'utf8');

  // Ne pas pinger en dev local — seulement en CI/Vercel
  if (process.env.VERCEL || process.env.CI) {
    const sitemapUrl = `${SITE_URL}/sitemap.xml`;
    console.log('[ping] Notification des moteurs de recherche...');
    await pingGoogle(sitemapUrl);
    // IndexNow : envoyer les 14 pages statiques prioritaires (limite raisonnable)
    await pingIndexNow(staticUrls);
    console.log('[ping] Terminé. Pages soumises à indexation immédiate.');
  } else {
    console.log('[ping] Mode local — pings désactivés (ne tournent que sur Vercel/CI).');
  }
}

main();
