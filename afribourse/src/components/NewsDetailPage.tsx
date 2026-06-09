import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Calendar, Clock, ArrowLeft, Tag, Share2,
  ExternalLink, TrendingUp, TrendingDown, BarChart2,
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import OptimizedImage from './ui/OptimizedImage';
import { BlockRenderer } from './BlockRenderer';
import { BRVM_NEWS, BRVMArticle, ImpactType, ContentBlock } from '../data/brvm2026News';
import ArticleInteractions from './ArticleInteractions';
import HtmlArticleRenderer from './HtmlArticleRenderer';
import RelatedArticles from './news/RelatedArticles';

const SITE_URL = 'https://afribourse.com';

// ── Types ──────────────────────────────────────────────────────────────────────

type DBArticle = {
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

// ── Helpers ────────────────────────────────────────────────────────────────────

const CAT_LABELS: Record<string, string> = {
  marches: 'Marchés', analyse: 'Analyse', startup: 'Startup',
  economie: 'Économie', interview: 'Interview',
  resultats: 'Résultats 2025', dividendes: 'Dividendes',
};

const CAT_COLORS: Record<string, string> = {
  marches:    'bg-blue-50 text-blue-600 border-blue-100',
  analyse:    'bg-green-50 text-green-600 border-green-100',
  startup:    'bg-purple-50 text-purple-600 border-purple-100',
  economie:   'bg-orange-50 text-orange-600 border-orange-100',
  interview:  'bg-pink-50 text-pink-600 border-pink-100',
  dividendes: 'bg-teal-50 text-teal-700 border-teal-200',
};

const IMPACT_STYLES: Record<ImpactType, string> = {
  Positif: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Négatif: 'bg-red-50 text-red-700 border-red-200',
  Neutre:  'bg-slate-50 text-slate-500 border-slate-200',
  Mixte:   'bg-amber-50 text-amber-700 border-amber-200',
};

const IMPACT_DOT: Record<ImpactType, string> = {
  Positif: 'bg-emerald-500',
  Négatif: 'bg-red-500',
  Neutre:  'bg-slate-400',
  Mixte:   'bg-amber-500',
};

function catLabel(cat: string | null) {
  if (!cat) return 'Non classé';
  return CAT_LABELS[cat.toLowerCase()] ?? cat.charAt(0).toUpperCase() + cat.slice(1);
}

function catColor(cat: string | null) {
  if (!cat) return 'bg-slate-100 text-slate-700 border-slate-200';
  return CAT_COLORS[cat.toLowerCase()] ?? 'bg-slate-50 text-slate-600 border-slate-100';
}

function calcReadTime(s: string | null) {
  return Math.ceil((s ? s.split(/\s+/).length : 0) / 200) || 3;
}

// ── Composants partagés ────────────────────────────────────────────────────────

function ShareButton() {
  const [copied, setCopied] = useState(false);
  function handle() {
    const url = window.location.href;
    if (navigator.share) { navigator.share({ url }); }
    else { navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }
  }
  return (
    <button
      onClick={handle}
      className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
    >
      <Share2 size={14} />
      {copied ? 'Lien copié !' : 'Copier le lien'}
    </button>
  );
}

// ── Page article DB ────────────────────────────────────────────────────────────

function DBArticlePage({ article }: { article: DBArticle }) {
  const blocks: ContentBlock[] | null = (() => {
    if (!article.rich_content) return null;
    try { return JSON.parse(article.rich_content); } catch { return null; }
  })();

  // Comptage de vue (dédup par session)
  useEffect(() => {
    try {
      const key = `viewed:${article.id}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      fetch(`${API_BASE_URL}/articles/${encodeURIComponent(article.id)}/view`, { method: 'POST' }).catch(() => {});
    } catch { /* ignore */ }
  }, [article.id]);

  const canonicalUrl = `${SITE_URL}/news/${article.slug}`;
  const ogImage = article.image_url ?? `https://afribourse-api.onrender.com/api/og/image/page/news`;
  const publishedIso = article.published_at ? new Date(article.published_at).toISOString() : undefined;
  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const readTime = calcReadTime(article.content ?? article.rich_content);

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
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.summary ?? article.title} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'NewsArticle',
          headline: article.title, description: article.summary ?? undefined,
          image: article.image_url ?? undefined, datePublished: publishedIso,
          author: { '@type': 'Person', name: article.author ?? 'AfriBourse' },
          publisher: { '@type': 'Organization', name: 'AfriBourse', url: SITE_URL },
          mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
        })}</script>
      </Helmet>

      {article.image_url && (
        <div className="w-full bg-slate-900" style={{ maxHeight: 480, overflow: 'hidden' }}>
          <OptimizedImage src={article.image_url} alt={article.title} className="w-full object-cover" style={{ maxHeight: 480, objectPosition: 'center top' }} priority />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 animate-in fade-in duration-500">
        <div className="mb-6">
          <Link to="/news" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={14} /> Actualités
          </Link>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] lg:gap-12">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {article.category && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${catColor(article.category)}`}>{catLabel(article.category)}</span>
              )}
              {article.is_featured && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-100">À la une</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-slate-900 leading-tight mb-5">{article.title}</h1>

            <div className="flex items-center gap-4 text-sm text-slate-400 mb-8 flex-wrap border-b border-slate-100 pb-6">
              <span className="font-semibold text-slate-700">{article.author ?? 'AfriBourse'}</span>
              {formattedDate && <span className="flex items-center gap-1.5"><Calendar size={13} />{formattedDate}</span>}
              <span className="flex items-center gap-1.5"><Clock size={13} />{readTime} min de lecture</span>
            </div>

            {article.summary && (
              <p className="text-lg text-slate-600 leading-relaxed mb-8 font-medium">{article.summary}</p>
            )}

            {blocks ? (
              <BlockRenderer blocks={blocks} variant="module" />
            ) : article.content ? (
              <HtmlArticleRenderer html={article.content} />
            ) : (
              <p className="text-slate-400 italic">Aucun contenu disponible.</p>
            )}

            <div className="mt-12"><ArticleInteractions articleId={article.id} /></div>

            <RelatedArticles articleId={article.id} tickers={article.tickers} category={article.category} />

            <p className="text-[11px] text-slate-400 italic border-t border-slate-100 pt-6 mt-8">
              {article.author ?? 'AfriBourse'} · {article.source ?? 'AfriBourse Research'} · Informations éducatives uniquement.
            </p>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Partager</p>
                <ShareButton />
              </div>

              {article.tickers?.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Valeurs citées</p>
                  <div className="flex flex-col gap-2">
                    {article.tickers.map(t => (
                      <Link key={t} to={`/stock/${t}`} className="flex items-center justify-between group bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 transition-colors">
                        <div className="flex items-center gap-2"><Tag size={12} className="text-slate-400" /><span className="font-mono text-sm font-bold text-slate-800">{t}</span></div>
                        <ExternalLink size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">À propos</p>
                <dl className="space-y-3 text-sm">
                  {article.author && <div><dt className="text-xs text-slate-400 mb-0.5">Auteur</dt><dd className="font-semibold text-slate-800">{article.author}</dd></div>}
                  {formattedDate && <div><dt className="text-xs text-slate-400 mb-0.5">Publié le</dt><dd className="font-semibold text-slate-800">{formattedDate}</dd></div>}
                  {article.category && <div><dt className="text-xs text-slate-400 mb-0.5">Catégorie</dt><dd><span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${catColor(article.category)}`}>{catLabel(article.category)}</span></dd></div>}
                  <div><dt className="text-xs text-slate-400 mb-0.5">Temps de lecture</dt><dd className="font-semibold text-slate-800">{readTime} min</dd></div>
                </dl>
              </div>

              <Link to="/news" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                <ArrowLeft size={14} /> Toutes les actualités
              </Link>
            </div>
          </aside>
        </div>

        {article.tickers?.length > 0 && (
          <div className="lg:hidden mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Valeurs citées</p>
            <div className="flex flex-wrap gap-2">
              {article.tickers.map(t => (
                <Link key={t} to={`/stock/${t}`} className="inline-flex items-center gap-1 font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors">
                  <Tag size={10} />{t}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Page article BRVM statique ─────────────────────────────────────────────────

function BRVMArticlePage({ article }: { article: BRVMArticle }) {
  const canonicalUrl = `${SITE_URL}/news/${article.id}`;
  const ogImage = article.image_url ?? `https://afribourse-api.onrender.com/api/og/image/page/news`;
  const publishedIso = new Date(article.publishedAt).toISOString();
  const formattedDate = new Date(article.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const posCount = article.tickers.filter(t => t.impact === 'Positif').length;
  const negCount = article.tickers.filter(t => t.impact === 'Négatif').length;

  const catCls = (cat: string) => {
    const map: Record<string, string> = {
      'Secteur bancaire': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Analyse Fondamentale': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Marché': 'bg-blue-50 text-blue-700 border-blue-200',
      'Macroéconomie': 'bg-violet-50 text-violet-700 border-violet-200',
      'Télécoms': 'bg-cyan-50 text-cyan-700 border-cyan-200',
      'Dividendes': 'bg-teal-50 text-teal-700 border-teal-200',
      'Agro-industrie': 'bg-lime-50 text-lime-700 border-lime-200',
    };
    return map[cat] ?? 'bg-slate-100 text-slate-600 border-slate-300';
  };

  return (
    <>
      <Helmet>
        <title>{article.title} | AfriBourse</title>
        <meta name="description" content={article.summary} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="AfriBourse" />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.summary} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="article:published_time" content={publishedIso} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.summary} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org', '@type': 'NewsArticle',
          headline: article.title, description: article.summary,
          image: article.image_url ?? undefined, datePublished: publishedIso,
          author: { '@type': 'Organization', name: 'AfriBourse Research' },
          publisher: { '@type': 'Organization', name: 'AfriBourse', url: SITE_URL },
          mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
        })}</script>
      </Helmet>

      {article.image_url && (
        <div className="w-full bg-slate-900" style={{ maxHeight: 480, overflow: 'hidden' }}>
          <img src={article.image_url} alt={article.title} className="w-full object-cover" style={{ maxHeight: 480, objectPosition: 'center top' }} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 animate-in fade-in duration-500">
        <div className="mb-6">
          <Link to="/news" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={14} /> Actualités
          </Link>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] lg:gap-12">
          {/* ── Colonne principale ── */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${catCls(article.category)}`}>{article.category}</span>
              {article.isFeatured && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#00D4A8]/10 text-[#007A72] border border-[#00D4A8]/30">À la une</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-slate-900 leading-tight mb-5">{article.title}</h1>

            <div className="flex items-center gap-4 text-sm text-slate-400 mb-8 flex-wrap border-b border-slate-100 pb-6">
              <span className="font-semibold text-slate-700">AfriBourse Research</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} />{formattedDate}</span>
              {posCount > 0 && <span className="flex items-center gap-1 text-emerald-600"><TrendingUp size={13} />{posCount} positif{posCount > 1 ? 's' : ''}</span>}
              {negCount > 0 && <span className="flex items-center gap-1 text-red-500"><TrendingDown size={13} />{negCount} négatif{negCount > 1 ? 's' : ''}</span>}
            </div>

            {/* Lead */}
            <p className="text-lg text-slate-600 leading-relaxed mb-8 font-medium border-l-4 border-[#00D4A8] pl-5 py-1">
              {article.summary}
            </p>

            {/* Corps riche */}
            {article.richContent ? (
              <BlockRenderer blocks={article.richContent} variant="module" />
            ) : article.content ? (
              <div className="prose prose-slate prose-lg max-w-none">
                {article.content.split('\n\n').map((p, i) =>
                  p.trim() ? <p key={i} className="text-slate-700 leading-relaxed">{p.trim()}</p> : null
                )}
              </div>
            ) : null}

            {/* Tableau d'impact des tickers */}
            {article.tickers.length > 0 && (
              <div className="mt-10">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
                  <BarChart2 size={16} className="text-[#00D4A8]" /> Actions concernées
                </h2>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-white text-xs">
                        <th className="text-left px-4 py-3 font-semibold">Ticker</th>
                        <th className="px-4 py-3 font-semibold text-center">Impact</th>
                        <th className="text-left px-4 py-3 font-semibold">Analyse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {article.tickers.map((t, i) => (
                        <tr key={t.ticker} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-4 py-3">
                            <Link to={`/stock/${t.ticker}`} className="font-mono font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-xs transition-colors">{t.ticker}</Link>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${IMPACT_STYLES[t.impact]}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${IMPACT_DOT[t.impact]}`} />
                              {t.impact}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs leading-relaxed">{t.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-12"><ArticleInteractions articleId={article.id} /></div>

            <p className="text-[11px] text-slate-400 italic border-t border-slate-100 pt-6 mt-8">
              AfriBourse Research · Sources : publications officielles BRVM · Informations éducatives uniquement.
            </p>
          </div>

          {/* ── Sidebar desktop ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Partager</p>
                <ShareButton />
              </div>

              {/* Tickers liés */}
              {article.tickers.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Valeurs citées</p>
                  <div className="flex flex-col gap-2">
                    {article.tickers.map(t => (
                      <Link key={t.ticker} to={`/stock/${t.ticker}`} className="flex items-center justify-between group bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${IMPACT_DOT[t.impact]}`} />
                          <span className="font-mono text-sm font-bold text-slate-800">{t.ticker}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${IMPACT_STYLES[t.impact]}`}>{t.impact}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Infos */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">À propos</p>
                <dl className="space-y-3 text-sm">
                  <div><dt className="text-xs text-slate-400 mb-0.5">Source</dt><dd className="font-semibold text-slate-800">AfriBourse Research</dd></div>
                  <div><dt className="text-xs text-slate-400 mb-0.5">Publié le</dt><dd className="font-semibold text-slate-800">{formattedDate}</dd></div>
                  <div><dt className="text-xs text-slate-400 mb-0.5">Catégorie</dt><dd><span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${catCls(article.category)}`}>{article.category}</span></dd></div>
                </dl>
              </div>

              {/* Sources */}
              {article.sources.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Sources</p>
                  <ul className="space-y-2">
                    {article.sources.map((s, i) => (
                      <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00D4A8] shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {article.tags.map(t => (
                      <span key={t} className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">#{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <Link to="/news" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                <ArrowLeft size={14} /> Toutes les actualités
              </Link>
            </div>
          </aside>
        </div>

        {/* Tags + sources mobile */}
        <div className="lg:hidden mt-8 pt-6 border-t border-slate-100 space-y-4">
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map(t => (
                <span key={t} className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [dbArticle, setDbArticle] = useState<DBArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Vérifier d'abord si c'est un article BRVM statique
  const brvmArticle = slug ? BRVM_NEWS.find(a => a.id === slug) ?? null : null;

  useEffect(() => {
    if (brvmArticle) { setLoading(false); return; }
    if (!slug) { setLoading(false); setNotFound(true); return; }

    setLoading(true);
    setNotFound(false);
    fetch(`${API_BASE_URL}/news/${slug}`)
      .then(res => {
        if (res.status === 404) { setNotFound(true); return null; }
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json();
      })
      .then(data => { if (data) setDbArticle(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, brvmArticle]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (brvmArticle) return <BRVMArticlePage article={brvmArticle} />;

  if (notFound || !dbArticle) {
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

  return <DBArticlePage article={dbArticle} />;
}
