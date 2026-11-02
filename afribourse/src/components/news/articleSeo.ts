// SEO des articles : relie chaque article aux actions qu'il cite pour qu'une
// recherche « action SGBC », « Société Générale CI analyse »… puisse y mener.
import { useMemo } from 'react';
import { useStocks } from '../../hooks/useApi';

// Robots des moteurs de recherche. Sert uniquement à leur montrer le texte
// complet d'un article réservé aux membres, ce que Google autorise si la page
// déclare le contenu payant (isAccessibleForFree + hasPart, voir paywallJsonLd).
const SEARCH_CRAWLER_RE = /googlebot|google-inspectiontool|bingbot|duckduckbot|yandex|baiduspider|applebot/i;

export function isSearchCrawler(): boolean {
  return typeof navigator !== 'undefined' && SEARCH_CRAWLER_RE.test(navigator.userAgent);
}

// Classe CSS posée sur le bloc réservé aux membres (référencée par le JSON-LD).
export const PAYWALL_CLASS = 'paywalled-content';

export const paywallJsonLd = {
  isAccessibleForFree: false,
  hasPart: {
    '@type': 'WebPageElement',
    isAccessibleForFree: false,
    cssSelector: `.${PAYWALL_CLASS}`,
  },
};

/** Tickers → nom de société (données /stocks déjà en cache React Query). */
export function useCompanyNames(tickers: string[]): Record<string, string> {
  const { data: stocks } = useStocks();
  return useMemo(() => {
    const names: Record<string, string> = {};
    for (const s of stocks ?? []) {
      if (tickers.includes(s.symbol) && s.company_name) names[s.symbol] = s.company_name;
    }
    return names;
  }, [stocks, tickers]);
}

export function buildTickerSeo(tickers: string[], names: Record<string, string>) {
  const unique = [...new Set(tickers.filter(Boolean))];
  const label = (t: string) => (names[t] ? `${names[t]} (${t})` : t);

  const keywords = unique.flatMap(t => [
    t, `action ${t}`, `cours ${t}`, `${t} BRVM`, `analyse ${t}`,
    ...(names[t] ? [names[t], `action ${names[t]}`] : []),
  ]);

  // Données structurées : chaque société citée, avec son ticker BRVM
  const about = unique.map(t => ({
    '@type': 'Corporation',
    name: names[t] ?? t,
    tickerSymbol: `BRVM:${t}`,
    url: `https://www.africbourse.com/stock/${encodeURIComponent(t)}`,
  }));

  // Phrase ajoutée à la meta description quand l'article cible peu d'actions
  const mention = unique.length > 0 && unique.length <= 3
    ? `Action${unique.length > 1 ? 's' : ''} ${unique.map(label).join(', ')} — BRVM.`
    : '';

  return { keywords: [...keywords, 'BRVM', 'AfriBourse'].join(', '), about, mention };
}

export function withMention(description: string, mention: string): string {
  if (!mention) return description;
  return `${mention} ${description}`.slice(0, 300);
}
