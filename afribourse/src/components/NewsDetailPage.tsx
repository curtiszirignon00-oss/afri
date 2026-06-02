import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, ArrowLeft, Tag, Share2, ExternalLink } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

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

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: article?.title ?? '', url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

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

      {/* Hero image pleine largeur */}
      {article.image_url && (
        <div className="w-full bg-slate-900" style={{ maxHeight: '480px', overflow: 'hidden' }}>
          <OptimizedImage
            src={article.image_url}
            alt={article.title}
            className="w-full object-cover"
            style={{ maxHeight: '480px', objectPosition: 'center top' }}
            priority
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 animate-in fade-in duration-500">

        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/news" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={14} />
            Actualités
          </Link>
        </div>

        {/* Layout desktop : contenu principal + sidebar */}
        <div className="lg:grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] lg:gap-12">

          {/* ── Colonne principale ── */}
          <div className="min-w-0">

            {/* Category + featured */}
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
            </div>

            {/* Titre */}
            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-slate-900 leading-tight mb-5">
              {article.title}
            </h1>

            {/* Meta ligne */}
            <div className="flex items-center gap-4 text-sm text-slate-400 mb-8 flex-wrap border-b border-slate-100 pb-6">
              <span className="font-semibold text-slate-700">{article.author ?? 'AfriBourse'}</span>
              {formattedDate && (
                <span className="flex items-center gap-1.5"><Calendar size={13} />{formattedDate}</span>
              )}
              <span className="flex items-center gap-1.5"><Clock size={13} />{readTime} min de lecture</span>
            </div>

            {/* Image hero si pas de banner top */}
            {!article.image_url && (
              <div className="h-px bg-slate-100 mb-8" />
            )}

            {/* Lead / résumé */}
            {article.summary && (
              <p className="text-lg text-slate-600 leading-relaxed mb-8 font-medium">
                {article.summary}
              </p>
            )}

            {/* Corps de l'article */}
            {blocks ? (
              <BlockRenderer blocks={blocks} variant="module" />
            ) : article.content ? (
              <div className="prose prose-slate prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
            ) : (
              <p className="text-slate-400 italic">Aucun contenu disponible.</p>
            )}

            {/* Interactions */}
            <div className="mt-12">
              <ArticleInteractions articleId={article.id} />
            </div>

            {/* Disclaimer */}
            <p className="text-[11px] text-slate-400 italic border-t border-slate-100 pt-6 mt-8">
              {article.author ?? 'AfriBourse'} · {article.source ?? 'AfriBourse Research'} · Informations éducatives uniquement, non constitutives de conseil en investissement.
            </p>
          </div>

          {/* ── Sidebar desktop ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-6">

              {/* Partager */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Partager</p>
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  <Share2 size={14} />
                  {copied ? 'Lien copié !' : 'Copier le lien'}
                </button>
              </div>

              {/* Tickers liés */}
              {article.tickers?.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Valeurs citées</p>
                  <div className="flex flex-col gap-2">
                    {article.tickers.map(t => (
                      <Link
                        key={t}
                        to={`/stock/${t}`}
                        className="flex items-center justify-between group bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Tag size={12} className="text-slate-400" />
                          <span className="font-mono text-sm font-bold text-slate-800">{t}</span>
                        </div>
                        <ExternalLink size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Infos article */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">À propos</p>
                <dl className="space-y-3 text-sm">
                  {article.author && (
                    <div>
                      <dt className="text-xs text-slate-400 mb-0.5">Auteur</dt>
                      <dd className="font-semibold text-slate-800">{article.author}</dd>
                    </div>
                  )}
                  {formattedDate && (
                    <div>
                      <dt className="text-xs text-slate-400 mb-0.5">Publié le</dt>
                      <dd className="font-semibold text-slate-800">{formattedDate}</dd>
                    </div>
                  )}
                  {article.category && (
                    <div>
                      <dt className="text-xs text-slate-400 mb-0.5">Catégorie</dt>
                      <dd>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(article.category)}`}>
                          {getCategoryLabel(article.category)}
                        </span>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs text-slate-400 mb-0.5">Temps de lecture</dt>
                    <dd className="font-semibold text-slate-800">{readTime} min</dd>
                  </div>
                </dl>
              </div>

              {/* Retour */}
              <Link
                to="/news"
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft size={14} />
                Toutes les actualités
              </Link>
            </div>
          </aside>

        </div>

        {/* Tickers mobile (sous l'article) */}
        {article.tickers?.length > 0 && (
          <div className="lg:hidden mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Valeurs citées</p>
            <div className="flex flex-wrap gap-2">
              {article.tickers.map(t => (
                <Link
                  key={t}
                  to={`/stock/${t}`}
                  className="inline-flex items-center gap-1 font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors"
                >
                  <Tag size={10} />
                  {t}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
