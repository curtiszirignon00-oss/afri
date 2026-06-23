import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, Newspaper, BarChart2, X, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://africbourse.com';
const OG_IMAGE = 'https://afribourse-api.onrender.com/api/og/image/page/news';
import { API_BASE_URL } from '../config/api';
import OptimizedImage from './ui/OptimizedImage';
import FundamentalsGrid from './FundamentalsGrid';
import { BRVM_NEWS, BRVMArticle, ContentBlock } from '../data/brvm2026News';
import { BRVMDetailPanel, BRVMArticleCard } from './BRVMNewsGrid';
import { BlockRenderer } from './BlockRenderer';
import { markNewsVisited, getUnseenBrvmCount } from '../hooks/useContentUnseen';
import ArticleInteractions from './ArticleInteractions';
import HtmlArticleRenderer from './HtmlArticleRenderer';
import NewsArticleCard from './news/NewsArticleCard';
import NewsAuthGate from './news/NewsAuthGate';
import { engagementScore, type ArticleCounts } from './news/newsHelpers';
import { useAnalytics, ACTION_TYPES } from '../hooks/useAnalytics';
import { useAuth } from '../contexts/AuthContext';

// Nombre d'articles visibles pour un visiteur non connecté avant le mur d'inscription
const FREE_PREVIEW_LIMIT = 6;

// Marque une vue (dédup par session via localStorage)
function trackArticleView(articleId: string) {
  try {
    const key = `viewed:${articleId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    fetch(`${API_BASE_URL}/articles/${encodeURIComponent(articleId)}/view`, { method: 'POST' }).catch(() => {});
  } catch { /* ignore */ }
}

const BRVM_CATEGORY_MAP: Record<string, string> = {
  'Marché':                 'marches',
  'Macroéconomie':          'economie',
  'Matières premières':     'analyse',
  'Secteur bancaire':       'analyse',
  'Télécoms':               'analyse',
  'Dividendes':             'dividendes',
  'Réglementation':         'economie',
  'Agro-industrie':         'analyse',
  'Analyse':                 'analyse',
};

const STATIC_ONLY = ['resultats', 'dividendes'];

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
  country: string | null;
  sector: string | null;
  image_url: string | null;
  is_featured: boolean;
  published_at: string | null;
  created_at: string | null;
};

function DBArticlePanel({ article, onClose }: { article: NewsArticle; onClose: () => void }) {
  const blocks: ContentBlock[] | null = (() => {
    if (!article.rich_content) return null;
    try { return JSON.parse(article.rich_content); } catch { return null; }
  })();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-y-auto flex flex-col" style={{ animation: 'slideIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-5 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              {article.category && (
                <span className="text-xs font-semibold text-[#00D4A8] uppercase tracking-wide">{article.category}</span>
              )}
              <h2 className="font-bold text-slate-900 text-base leading-snug mt-0.5">{article.title}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {article.tickers?.map(t => (
                  <span key={t} className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{t}</span>
                ))}
                {article.published_at && (
                  <span className="text-xs text-slate-400">
                    {new Date(article.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 px-6 py-6">
          {article.summary && (
            <p className="text-sm text-slate-600 leading-relaxed mb-5 pb-5 border-b border-slate-100">{article.summary}</p>
          )}
          {blocks ? (
            <BlockRenderer blocks={blocks} variant="news" />
          ) : article.content ? (
            <HtmlArticleRenderer html={article.content} />
          ) : (
            <p className="text-sm text-slate-500 italic">Aucun contenu disponible.</p>
          )}
          <ArticleInteractions articleId={article.id} />
          <p className="text-[10px] text-slate-400 italic text-center border-t border-slate-100 pt-4 mt-6">
            {article.author ?? 'AfriBourse'} · {article.source ?? 'AfriBourse Research'} · Informations éducatives uniquement.
          </p>
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}

export default function NewsPage() {
  const navigate = useNavigate();
  const [articles, setArticles]       = useState<NewsArticle[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBRVM, setSelectedBRVM] = useState<BRVMArticle | null>(null);
  const [selectedDBArticle, setSelectedDBArticle] = useState<NewsArticle | null>(null);
  const [counts, setCounts] = useState<Record<string, ArticleCounts>>({});
  const [search, setSearch] = useState('');
  const { trackAction } = useAnalytics();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const gated = !authLoading && !isLoggedIn;

  function openDBArticle(article: NewsArticle) {
    trackAction(ACTION_TYPES.VIEW_ARTICLE, article.title, {
      article_id: article.id, category: article.category, is_featured: article.is_featured,
    });
    if (article.slug) {
      navigate(`/news/${article.slug}`);
    } else {
      trackArticleView(article.id);
      setSelectedDBArticle(article);
    }
  }

  function openArticle(article: BRVMArticle) {
    trackAction(ACTION_TYPES.VIEW_ARTICLE, article.title, {
      article_id:  article.id,
      category:    article.category,
      is_featured: article.isFeatured,
    });
    navigate(`/news/${article.id}`);
  }
  // Notification banner : calculé avant de marquer comme lu
  const [newBrvmCount]    = useState(() => getUnseenBrvmCount());
  const [bannerVisible, setBannerVisible] = useState(() => getUnseenBrvmCount() > 0);

  // Marquer la page comme visitée dès le montage → reset le badge header
  useEffect(() => { markNewsVisited(); }, []);

  useEffect(() => {
    if (STATIC_ONLY.includes(selectedCategory)) {
      setLoading(false);
      setArticles([]);
      return;
    }
    async function loadArticles() {
      setLoading(true);
      const url = `${API_BASE_URL}/news${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data: NewsArticle[] = await res.json();
        setArticles(data || []);

        // Compteurs (likes + commentaires + vues) en une requête batch
        const ids = (data || []).map(a => a.id);
        if (ids.length > 0) {
          fetch(`${API_BASE_URL}/articles/batch-counts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          })
            .then(r => r.ok ? r.json() : {})
            .then((c: Record<string, ArticleCounts>) => setCounts(c || {}))
            .catch(() => {});
        }
      } catch (err) {
        console.error('Error loading articles:', err);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
  }, [selectedCategory]);

  function formatTimeAgo(dateString: string | null): string {
    if (!dateString) return 'Date inconnue';
    try {
      const now  = new Date();
      const date = new Date(dateString);
      const diffH = Math.floor((now.getTime() - date.getTime()) / 3600000);
      if (diffH < 1)  return "moins d'une heure";
      if (diffH < 24) return `${diffH} heure${diffH > 1 ? 's' : ''}`;
      const diffD = Math.floor(diffH / 24);
      if (diffD < 7)  return `${diffD} jour${diffD > 1 ? 's' : ''}`;
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return 'Date invalide'; }
  }

  function calcReadTime(content: string | null): number {
    return Math.ceil((content ? content.split(/\s+/).length : 0) / 200) || 3;
  }

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
    const k = cat.toLowerCase();
    return map[k] ?? cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  function getCategoryColor(cat: string | null): string {
    if (!cat) return 'bg-slate-100 text-slate-700';
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

  const categories = ['all', 'marches', 'analyse', 'economie', 'interview', 'resultats', 'dividendes'];

  // Recherche (titre / ticker / catégorie / résumé / tags)
  const q = search.trim().toLowerCase();
  const matchesDB = (a: NewsArticle) => {
    if (!q) return true;
    const hay = [a.title, a.summary, getCategoryLabel(a.category), (a.tickers ?? []).join(' ')]
      .filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  };
  const matchesBRVM = (a: BRVMArticle) => {
    if (!q) return true;
    const hay = [
      a.title, a.summary, a.category,
      (a.tickers ?? []).map(t => t.ticker).join(' '),
      (a.tags ?? []).join(' '),
    ].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  };

  const brvmFiltered = BRVM_NEWS
    .filter(a => selectedCategory === 'all' || BRVM_CATEGORY_MAP[a.category] === selectedCategory)
    .filter(matchesBRVM)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // En recherche : pas de hero, on inclut tous les articles correspondants (même featured)
  const featuredArticle = q ? undefined : articles.find(a => a.is_featured);
  const listArticles    = (q
    ? articles
    : (selectedCategory === 'all' ? articles.filter(a => !a.is_featured) : articles)
  ).filter(matchesDB);
  const isStaticOnly    = STATIC_ONLY.includes(selectedCategory);

  // Articles « populaires » : top ~20% par engagement, au-dessus d'un plancher
  const popularIds = (() => {
    const scored = articles
      .map(a => ({ id: a.id, score: engagementScore(counts[a.id]) }))
      .filter(s => s.score > 5)
      .sort((a, b) => b.score - a.score);
    const topN = Math.max(1, Math.ceil(scored.length * 0.2));
    return new Set(scored.slice(0, topN).map(s => s.id));
  })();

  if (loading && articles.length === 0 && !isStaticOnly) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 animate-in fade-in duration-500">
      <Helmet>
        <title>Actualités Financières BRVM et UEMOA | AfriBourse</title>
        <meta name="description" content="Toute l'actualité boursière de la BRVM et de l'UEMOA : résultats d'entreprises, dividendes, analyses sectorielles et nouvelles macroéconomiques d'Afrique de l'Ouest." />
        <meta name="keywords" content="brvm, brvm actualités, brvm news, brvm aujourd'hui, brvm action news, actualités brvm, brvm dividende, résultats brvm, brvm marché, brvm analyse, news bourse afrique, UEMOA actualités, dividendes BRVM, résultats entreprises BRVM" />
        <link rel="canonical" href={`${SITE_URL}/news`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AfriBourse" />
        <meta property="og:title" content="Actualités Financières BRVM et UEMOA | AfriBourse" />
        <meta property="og:description" content="L'essentiel de l'information boursière de l'UEMOA : résultats, dividendes, analyses et actualités macroéconomiques." />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={`${SITE_URL}/news`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AfriBourse" />
        <meta name="twitter:title" content="Actualités BRVM & UEMOA | AfriBourse" />
        <meta name="twitter:description" content="Résultats, dividendes et analyses sectorielles de la bourse d'Afrique de l'Ouest." />
        <meta name="twitter:image" content={OG_IMAGE} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://africbourse.com/" },
            { "@type": "ListItem", "position": 2, "name": "Actualités Financières", "item": "https://africbourse.com/news" }
          ]
        })}</script>
      </Helmet>

      {/* Banner nouvelles analyses */}
      {bannerVisible && newBrvmCount > 0 && (
        <div className="flex items-center justify-between bg-[#00D4A8]/10 border border-[#00D4A8]/40 rounded-xl px-4 py-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4A8] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00D4A8]" />
            </span>
            <span className="text-sm font-semibold text-[#007A72]">
              {newBrvmCount} nouvelle{newBrvmCount > 1 ? 's' : ''} analyse{newBrvmCount > 1 ? 's' : ''} publiée{newBrvmCount > 1 ? 's' : ''}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">— défiler vers les analyses BRVM</span>
          </div>
          <button
            onClick={() => setBannerVisible(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header + category tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Actualités Financières</h1>
          <p className="text-slate-500 mt-1">L'essentiel de l'information boursière de l'UEMOA.</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'TOUT' : getCategoryLabel(cat).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un article, un ticker (BICC, BOABF…), un thème…"
          className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00D4A8]/30 focus:border-[#00D4A8] placeholder:text-slate-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Effacer la recherche"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Résultats fondamentaux */}
      {selectedCategory === 'resultats' && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={18} className="text-[#00D4A8]" />
            <h2 className="text-lg font-bold text-slate-900">Résultats annuels 2025</h2>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Fondamentaux BRVM</span>
          </div>
          <FundamentalsGrid />
        </div>
      )}

      {/* Dividendes tab — static BRVM articles only */}
      {selectedCategory === 'dividendes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brvmFiltered.map(a => (
            <BRVMArticleCard key={a.id} article={a} onOpen={() => openArticle(a)} />
          ))}
          {brvmFiltered.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400">
              Aucun article dans cette catégorie pour le moment.
            </div>
          )}
        </div>
      )}

      {/* Filtering spinner */}
      {!isStaticOnly && loading && articles.length > 0 && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      )}

      {/* Main content — API articles */}
      {!isStaticOnly && !loading && (
        <div>

          {/* Featured hero — pleine largeur, uniquement sur "Tout" */}
          {selectedCategory === 'all' && featuredArticle && (
            <div className="group cursor-pointer mb-8" onClick={() => openDBArticle(featuredArticle)}>
              <div className="relative h-[320px] sm:h-[380px] rounded-2xl overflow-hidden shadow-md">
                <img
                  src={featuredArticle.image_url || '/images/default-news.jpg'}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider inline-block">
                      {getCategoryLabel(featuredArticle.category)}
                    </span>
                    {featuredArticle.tickers?.slice(0, 3).map(t => (
                      <span key={t} className="font-mono text-[10px] font-bold text-white bg-white/15 border border-white/25 px-1.5 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight group-hover:text-blue-200 transition-colors max-w-3xl">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-slate-200 line-clamp-2 mb-4 max-w-2xl">{featuredArticle.summary}</p>
                  <div className="flex items-center gap-4 text-slate-300 text-xs font-medium">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Il y a {formatTimeAgo(featuredArticle.published_at)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{calcReadTime(featuredArticle.content)} min de lecture</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grille uniforme — toutes les actualités, même style de card */}
          {listArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(gated ? listArticles.slice(0, FREE_PREVIEW_LIMIT) : listArticles).map(article => (
                <NewsArticleCard
                  key={article.id}
                  article={article}
                  counts={counts[article.id]}
                  popular={popularIds.has(article.id)}
                  onOpen={() => openDBArticle(article)}
                />
              ))}
            </div>
          )}

          {/* Mur d'inscription gratuit pour les visiteurs non connectés */}
          {gated && (
            <div className="mt-8">
              <NewsAuthGate variant="list" />
            </div>
          )}
        </div>
      )}

      {/* BRVM 2026 intelligence — même grille de cards uniforme (masqué si non connecté) */}
      {!isStaticOnly && !loading && !gated && brvmFiltered.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} className="text-[#00D4A8]" />
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Intelligence de marché BRVM 2026</h3>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {brvmFiltered.length} article{brvmFiltered.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brvmFiltered.map(a => (
              <BRVMArticleCard key={a.id} article={a} onOpen={() => openArticle(a)} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isStaticOnly && !loading && listArticles.length === 0 && brvmFiltered.length === 0 && (
        <div className="text-center py-16">
          <Newspaper className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">
            {q
              ? `Aucun résultat pour « ${search.trim()} ».`
              : `Aucun article trouvé${selectedCategory !== 'all' ? ` dans "${getCategoryLabel(selectedCategory)}"` : ''}.`}
          </p>
        </div>
      )}

      {/* BRVM article detail panel */}
      {selectedBRVM && <BRVMDetailPanel article={selectedBRVM} onClose={() => setSelectedBRVM(null)} />}

      {/* DB article detail panel */}
      {selectedDBArticle && <DBArticlePanel article={selectedDBArticle} onClose={() => setSelectedDBArticle(null)} />}
    </div>
  );
}
