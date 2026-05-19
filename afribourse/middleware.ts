// afribourse/middleware.ts
// Vercel Edge Middleware — injecte les balises Open Graph pour les crawlers sociaux.
//
// Pourquoi ce fichier existe :
//   Les crawlers sociaux (WhatsApp, Facebook, LinkedIn...) ne peuvent pas exécuter
//   JavaScript. Ils reçoivent le shell SPA vide (index.html) sans aucune meta OG,
//   ce qui donne des previews sans image ni titre. Ce middleware les intercepte et
//   leur retourne un HTML minimal avec og:title, og:description et og:image.
//   Les utilisateurs normaux passent directement vers le SPA React.

const API_URL = 'https://afribourse-api.onrender.com/api';
const SITE_URL = 'https://africbourse.com';

const SOCIAL_CRAWLERS = [
  'whatsapp',
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'linkedinbot',
  'telegrambot',
  'slackbot',
  'discordbot',
  'googlebot',
  'bingbot',
  'applebot',
];

function isSocialCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLERS.some((bot) => ua.includes(bot));
}

function ogHtml(params: {
  title: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
}): string {
  const { title, description, imageUrl, pageUrl } = params;
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}"/>
  <meta property="og:type"         content="website"/>
  <meta property="og:site_name"    content="AfriBourse"/>
  <meta property="og:title"        content="${esc(title)}"/>
  <meta property="og:description"  content="${esc(description)}"/>
  <meta property="og:image"        content="${esc(imageUrl)}"/>
  <meta property="og:image:width"  content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:url"          content="${esc(pageUrl)}"/>
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${esc(title)}"/>
  <meta name="twitter:description" content="${esc(description)}"/>
  <meta name="twitter:image"       content="${esc(imageUrl)}"/>
  <meta http-equiv="refresh"       content="0; url=${esc(pageUrl)}"/>
</head>
<body><p>Redirection vers <a href="${esc(pageUrl)}">${esc(pageUrl)}</a>…</p></body>
</html>`;
}

// ─── Handler stock ────────────────────────────────────────────────────────────

async function handleStock(symbol: string): Promise<Response> {
  const ogImageUrl = `${API_URL}/og/image/stock/${encodeURIComponent(symbol)}`;
  const pageUrl = `${SITE_URL}/stock/${symbol}`;

  try {
    const res = await fetch(`${API_URL}/stocks/${encodeURIComponent(symbol)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const stock = (await res.json()) as {
        symbol: string;
        company_name: string;
        current_price: number;
        daily_change_percent: number;
      };
      const sign = stock.daily_change_percent >= 0 ? '+' : '';
      const title = `${stock.symbol} — ${new Intl.NumberFormat('fr-FR').format(stock.current_price)} FCFA (${sign}${stock.daily_change_percent.toFixed(2)}%) | AfriBourse`;
      const description = `${stock.company_name} sur la BRVM. Cours en temps réel, graphiques et fondamentaux.`;
      return new Response(ogHtml({ title, description, imageUrl: ogImageUrl, pageUrl }), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
      });
    }
  } catch {
    // Fallback si l'API est indisponible (timeout ou erreur réseau)
  }

  return new Response(
    ogHtml({
      title: `${symbol} — Cours BRVM | AfriBourse`,
      description: `Retrouvez le cours de ${symbol} en temps réel, les graphiques et fondamentaux sur AfriBourse.`,
      imageUrl: ogImageUrl,
      pageUrl,
    }),
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' } },
  );
}

// ─── Handler pages génériques ─────────────────────────────────────────────────

const DEFAULT_OG_IMAGE = `${SITE_URL}/images/logo_afribourse.png`;

const PAGE_META: Record<string, { title: string; description: string; image?: string }> = {
  '/markets': {
    title: 'Marchés BRVM | AfriBourse',
    description: 'Toutes les cotations de la BRVM en temps réel. Indices, volumes et variations du jour.',
  },
  '/achievements': {
    title: 'Mes Badges — AfriBourse',
    description: 'Débloquez des badges en investissant sur la BRVM et progressez sur AfriBourse.',
  },
  '/classement': {
    title: 'Classement Investisseurs | AfriBourse',
    description: 'Le top des meilleurs investisseurs BRVM sur AfriBourse. Qui performe le mieux ce mois-ci ?',
  },
  '/news': {
    title: 'Actualités BRVM | AfriBourse',
    description: 'Les dernières nouvelles des marchés financiers africains et de la BRVM.',
  },
  '/learn': {
    title: 'Apprendre à Investir | AfriBourse',
    description: 'Modules d\'apprentissage pour maîtriser l\'investissement sur la Bourse Régionale des Valeurs Mobilières.',
  },
  '/dashboard': {
    title: 'Mon Portefeuille | AfriBourse',
    description: 'Simulateur d\'investissement BRVM. Gérez votre portefeuille virtuel et progressez.',
  },
};

const DEFAULT_META = {
  title: 'AfriBourse — Plateforme d\'Investissement BRVM',
  description: 'Investissez sur la BRVM avec le simulateur AfriBourse. Analyse des marchés africains, graphiques et formations.',
};

function handleGenericPage(pathname: string): Response {
  const pageUrl = `${SITE_URL}${pathname}`;
  const meta = PAGE_META[pathname] ?? DEFAULT_META;
  const imageUrl = meta.image ?? DEFAULT_OG_IMAGE;

  return new Response(
    ogHtml({ title: meta.title, description: meta.description, imageUrl, pageUrl }),
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=600' } },
  );
}

// ─── Middleware principal ─────────────────────────────────────────────────────

export default async function middleware(request: Request): Promise<Response | undefined> {
  const userAgent = request.headers.get('user-agent') ?? '';

  // Laisse passer les utilisateurs normaux → le SPA React prend le relais
  if (!isSocialCrawler(userAgent)) return undefined;

  const url = new URL(request.url);
  const { pathname } = url;

  // /stock/:symbol  (ex: /stock/SGBC, /stock/ETIT)
  const stockMatch = pathname.match(/^\/stock\/([A-Za-z0-9]+)$/);
  if (stockMatch) {
    return handleStock(stockMatch[1].toUpperCase());
  }

  // /profile/:userId — pas d'image personnalisée (données privées)
  if (pathname.startsWith('/profile/')) {
    return handleGenericPage('/dashboard');
  }

  // Pages connues
  const knownPage = Object.keys(PAGE_META).find(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
  return handleGenericPage(knownPage ?? pathname);
}

// Applique le middleware aux routes HTML (exclut les assets statiques)
export const config = {
  matcher: [
    '/((?!api|images|assets|icons|manifest\\.json|sw\\.js|workbox|favicon\\.).*)',
  ],
};
