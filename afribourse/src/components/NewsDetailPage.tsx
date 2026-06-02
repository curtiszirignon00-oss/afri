import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, ArrowLeft, Tag } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import OptimizedImage from './ui/OptimizedImage';
import { BlockRenderer } from './BlockRenderer';
import { ContentBlock } from '../data/brvm2026News';
import ArticleInteractions from './ArticleInteractions';

const SITE_URL = 'https://afribourse.com';

type NewsArticle = {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  content: string | null;
  rich_content: string | null;
  tickers: string[];
  category: string | null;
  author: string | null;
  source: string | null;
  image_url: string | null;
  is_featured: boolean;
  published_at: string | null;
};

function getCategoryLabel(cat: string | null): string {
  if (!cat) return 'Non classé';
  const map: Record<string, string> = {
    marches:    'Marchés',
    analyse:    'Analyse',
    startup:    'Startup',
    economie:   'Économie',
    interview:  'Interview',
    resultats:  'Résultats 2025',
    dividendes: 'Dividendes',
  };
  return map[cat.toLowerCase()] ?? cat.charAt(0).toUpperCase() + cat.slice(1);
}

function getCategoryColor(cat: string | null): string {
  if (!cat) return 'bg-slate-100 text-slate-700 border-slate-200';
  const map: Record<string, string> = {
    marches:    'bg-blue-50 text-blue-600 border-blue-100',
    analyse:    'bg-green-50 text-green-600 border-green-100',
    startup:    'bg-purple-50 text-purple-600 border-purple-100',
    economie:   'bg-orange-50 text-orange-600 border-orange-100',
    interview:  'bg-pink-50 text-pink-600 border-pink-100',
    dividendes: 'bg-teal-50 text-teal-700 border-teal-200',
  };
  return map[cat.toLowerCase()] ?? 'bg-slate-50 text-slate-600 border-slate-100';
}

function calcReadTime(content: string | null): number {
  return Math.ceil((content ? content.split(/\s+/).length : 0) / 200) || 3;
}

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    fetch(`${API_BASE_URL}/news/${slug}`)
      .then(res => {
        if (res.status === 404) { setNotFound(true); return null; }
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json();
      })
      .then(data => { if (data) setArticle(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl font-black text-slate-200 mb-4">404</p>
        <p className="text-slate-600 mb-6">Article introuvable ou supprimé.</p>
        <Link to="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
          <ArrowLeft size={14} /> Retour aux actualités
        </Link>
      </div>
    );
  }

  const blocks: ContentBlock[] | null = (() => {
    if (!article.rich_content) return null;
    try { return JSON.parse(article.rich_content); } catch { return null; }
  })();

  const canonicalUrl = `${SITE_URL}/news/${article.slug ?? slug}`;
  const ogImage = article.image_url ?? `https://afribourse-api.onrender.com/api/og/image/page/news`;
  const publishedIso = article.published_at ? new Date(article.published_at).toISOString() : undefined;
  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const readTime = calcReadTime(article.content ?? article.rich_content);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary ?? undefined,
    image: article.image_url ?? undefined,
    datePublished: publishedIso,
    author: { '@type': 'Person', name: article.author ?? 'AfriBourse' },
    publisher: { '@type': 'Organization', name: 'AfriBourse', url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  };

  return (
    <>
      <Helmet>
        <title>{article.title} | AfriBourse</title>
        <meta name="description" content={article.summary ?? article.title} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="AfriBourse" />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.summary ?? article.title} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={canonicalUrl} />
        {publishedIso && <meta property="article:published_time" content={publishedIso} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AfriBourse" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.summary ?? article.title} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 animate-in fade-in duration-500">

        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/news" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={14} />
            Actualités
          </Link>
        </div>

        {/* Category + tickers */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {article.category && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getCategoryColor(article.category)}`}>
              {getCategoryLabel(article.category)}
            </span>
          )}
          {article.is_featured && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-100">
              À la une
            </span>
          )}
          {article.tickers?.map(t => (
            <Link
              key={t}
              to={`/stock/${t}`}
              className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-200 transition-colors"
            >
              <Tag size={10} />
              {t}
            </Link>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-4">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-6 flex-wrap">
          <span className="font-medium text-slate-600">{article.author ?? 'AfriBourse'}</span>
          {formattedDate && (
            <span className="flex items-center gap-1"><Calendar size={12} />{formattedDate}</span>
          )}
          <span className="flex items-center gap-1"><Clock size={12} />{readTime} min de lecture</span>
        </div>

        {/* Hero image */}
        {article.image_url && (
          <div className="rounded-2xl overflow-hidden mb-8 aspect-video bg-slate-100">
            <OptimizedImage
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        )}

        {/* Summary lead */}
        {article.summary && (
          <p className="text-base text-slate-600 leading-relaxed mb-8 pb-8 border-b border-slate-100 font-medium">
            {article.summary}
          </p>
        )}

        {/* Body */}
        {blocks ? (
          <BlockRenderer blocks={blocks} variant="module" />
        ) : article.content ? (
          <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
        ) : (
          <p className="text-slate-400 italic text-sm">Aucun contenu disponible.</p>
        )}

        {/* Interactions */}
        <div className="mt-10">
          <ArticleInteractions articleId={article.id} />
        </div>

        {/* Footer disclaimer */}
        <p className="text-[11px] text-slate-400 italic text-center border-t border-slate-100 pt-6 mt-8">
          {article.author ?? 'AfriBourse'} · {article.source ?? 'AfriBourse Research'} · Informations éducatives uniquement, non constitutives de conseil en investissement.
        </p>
      </div>
    </>
  );
}
