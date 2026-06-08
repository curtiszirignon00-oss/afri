import type { VercelRequest, VercelResponse } from '@vercel/node';

const SITE_URL = 'https://africbourse.com';
const TODAY = new Date().toISOString().slice(0, 10);

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

async function fetchSymbols(): Promise<string[]> {
  try {
    const res = await fetch('https://afribourse-api.onrender.com/api/stocks', {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json() as Array<{ symbol?: string }>;
    return Array.isArray(data) ? data.map(s => s.symbol ?? '').filter(Boolean) : [];
  } catch {
    return [];
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const symbols = await fetchSymbols();

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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${stockEntries}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=60');
  res.status(200).send(xml);
}
