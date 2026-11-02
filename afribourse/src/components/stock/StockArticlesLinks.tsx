// Liens permanents (hors onglets) de la page action vers les articles qui la
// citent : Googlebot ne clique pas sur les onglets, sans cette section il ne
// voyait aucun lien entre /stock/SGBC et les analyses SGBC.
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { BRVM_NEWS } from '../../data/brvm2026News';

type ArticleLink = { href: string; title: string; date: string | null };

async function fetchTickerArticles(symbol: string): Promise<ArticleLink[]> {
  const res = await fetch(`${API_BASE_URL}/news?ticker=${encodeURIComponent(symbol)}&limit=10`);
  if (!res.ok) return [];
  const data = await res.json() as Array<{ id: string; slug: string | null; title: string; published_at: string | null }>;
  return (Array.isArray(data) ? data : [])
    .filter(a => a.slug)
    .map(a => ({ href: `/news/${a.slug}`, title: a.title, date: a.published_at }));
}

export default function StockArticlesLinks({ symbol, companyName }: { symbol: string; companyName?: string }) {
  const { data: dbArticles = [] } = useQuery({
    queryKey: ['ticker-articles', symbol],
    queryFn: () => fetchTickerArticles(symbol),
    enabled: !!symbol,
    staleTime: 10 * 60 * 1000,
  });

  const staticArticles: ArticleLink[] = BRVM_NEWS
    .filter(a => a.tickers.some(t => t.ticker === symbol))
    .map(a => ({ href: `/news/${a.id}`, title: a.title, date: a.publishedAt }));

  const articles = [...dbArticles, ...staticArticles]
    .filter((a, i, all) => all.findIndex(b => b.href === a.href) === i)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  if (articles.length === 0) return null;

  return (
    <section className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-5" aria-labelledby="stock-articles-title">
      <h2 id="stock-articles-title" className="text-lg font-bold text-gray-900 mb-3">
        Nos analyses sur l'action {symbol}{companyName ? ` (${companyName})` : ''}
      </h2>
      <ul className="divide-y divide-gray-100">
        {articles.map(a => (
          <li key={a.href}>
            <Link to={a.href} className="flex items-start gap-3 py-2.5 group">
              <FileText className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
              <span className="flex-1 text-sm font-medium text-gray-800 group-hover:text-blue-600">{a.title}</span>
              {a.date && (
                <time dateTime={a.date} className="text-xs text-gray-400 shrink-0">
                  {new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </time>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
