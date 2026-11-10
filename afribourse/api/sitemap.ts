import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BRVM_NEWS } from '../src/data/brvm2026News';

const SITE_URL = 'https://www.africbourse.com';
const TODAY = new Date().toISOString().slice(0, 10);

const STATIC_ROUTES = [
  { path: '/',              changefreq: 'daily',   priority: '1.0' },
  { path: '/markets',       changefreq: 'hourly',  priority: '0.9' },
  { path: '/indices',       changefreq: 'hourly',  priority: '0.8' },
  { path: '/news',          changefreq: 'daily',   priority: '0.8' },
  { path: '/learn',         changefreq: 'weekly',  priority: '0.8' },
  { path: '/glossary',      changefreq: 'monthly', priority: '0.7' },
  { path: '/formation',     changefreq: 'weekly',  priority: '0.7' },
  { path: '/webinaires-eco', changefreq: 'weekly',  priority: '0.7' },
  { path: '/parcours',      changefreq: 'weekly',  priority: '0.6' },
  { path: '/essai-gratuit', changefreq: 'monthly', priority: '0.6' },
  { path: '/community',     changefreq: 'daily',   priority: '0.6' },
  { path: '/communities',   changefreq: 'weekly',  priority: '0.6' },
  { path: '/classement',    changefreq: 'daily',   priority: '0.5' },
  { path: '/about',         changefreq: 'monthly', priority: '0.5' },
  { path: '/help',          changefreq: 'monthly', priority: '0.5' },
  { path: '/contact',       changefreq: 'yearly',  priority: '0.4' },
];

const API_URL = 'https://afribourse-api.onrender.com/api';

async function fetchSymbols(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/stocks`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json() as Array<{ symbol?: string }>;
    return Array.isArray(data) ? data.map(s => s.symbol ?? '').filter(Boolean) : [];
  } catch {
    return [];
  }
}

// Articles d'actualité : statiques (BRVM_NEWS, URL = id) + base de données (URL = slug)
async function fetchNewsEntries(): Promise<Array<{ path: string; lastmod: string }>> {
  const toDay = (d?: string | null) => {
    const t = d ? new Date(d) : null;
    return t && !isNaN(t.getTime()) ? t.toISOString().slice(0, 10) : TODAY;
  };
  const entries = BRVM_NEWS.map(a => ({ path: `/news/${encodeURIComponent(a.id)}`, lastmod: toDay(a.publishedAt) }));
  try {
    const res = await fetch(`${API_URL}/news`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json() as Array<{ slug?: string | null; published_at?: string | null }>;
      if (Array.isArray(data)) {
        for (const a of data) {
          if (a.slug) entries.push({ path: `/news/${encodeURIComponent(a.slug)}`, lastmod: toDay(a.published_at) });
        }
      }
    }
  } catch {
    // API indisponible : on garde les articles statiques
  }
  const seen = new Set<string>();
  return entries.filter(e => (seen.has(e.path) ? false : (seen.add(e.path), true)));
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const [symbols, news] = await Promise.all([fetchSymbols(), fetchNewsEntries()]);

  const staticEntries = STATIC_ROUTES.map(r => `
  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('');

  const stockEntries = symbols.map(s => `
  <url>
    <loc>${SITE_URL}/stock/${encodeURIComponent(s)}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`).join('');

  const newsEntries = news.map(n => `
  <url>
    <loc>${SITE_URL}${n.path}</loc>
    <lastmod>${n.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${stockEntries}
${newsEntries}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=60');
  res.status(200).send(xml);
}
