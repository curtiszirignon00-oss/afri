import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import NewsArticleCard, { type NewsCardArticle } from './NewsArticleCard';

type RelatedArticle = NewsCardArticle & { slug: string | null };

interface Props {
  articleId: string;
  tickers?: string[];
  category?: string | null;
}

export default function RelatedArticles({ articleId, tickers, category }: Props) {
  const navigate = useNavigate();
  const [related, setRelated] = useState<RelatedArticle[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const ticker = tickers?.[0];
      const urls: string[] = [];
      if (ticker)   urls.push(`${API_BASE_URL}/news?ticker=${encodeURIComponent(ticker)}&limit=4`);
      if (category) urls.push(`${API_BASE_URL}/news?category=${encodeURIComponent(category)}&limit=4`);
      if (urls.length === 0) return;

      try {
        const results = await Promise.all(
          urls.map(u => fetch(u).then(r => (r.ok ? r.json() : [])).catch(() => [])),
        );
        const merged: RelatedArticle[] = [];
        const seen = new Set<string>([articleId]);
        for (const list of results) {
          for (const a of (list as RelatedArticle[])) {
            if (seen.has(a.id)) continue;
            seen.add(a.id);
            merged.push(a);
          }
        }
        if (!cancelled) setRelated(merged.slice(0, 3));
      } catch { /* ignore */ }
    }

    load();
    return () => { cancelled = true; };
  }, [articleId, tickers, category]);

  if (related.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-slate-100">
      <h3 className="text-lg font-bold text-slate-900 mb-5">À lire aussi</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {related.map(a => (
          <NewsArticleCard
            key={a.id}
            article={a}
            compact
            onOpen={() => a.slug ? navigate(`/news/${a.slug}`) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
