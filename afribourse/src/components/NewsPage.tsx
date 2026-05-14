import { useEffect, useState } from 'react';
import { Calendar, Clock, ChevronRight, Newspaper, BarChart2, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import OptimizedImage from './ui/OptimizedImage';
import FundamentalsGrid from './FundamentalsGrid';
import { BRVM_NEWS, BRVMArticle } from '../data/brvm2026News';
import { BRVMDetailPanel, BRVMArticleCard } from './BRVMNewsGrid';
import { markNewsVisited, getUnseenBrvmCount } from '../hooks/useContentUnseen';

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

export default function NewsPage() {
  const [articles, setArticles]       = useState<NewsArticle[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBRVM, setSelectedBRVM] = useState<BRVMArticle | null>(null);
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

  const brvmFiltered = BRVM_NEWS
    .filter(a => selectedCategory === 'all' || BRVM_CATEGORY_MAP[a.category] === selectedCategory)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const featuredArticle = articles.find(a => a.is_featured);
  const listArticles    = selectedCategory === 'all' ? articles.filter(a => !a.is_featured) : articles;
  const isStaticOnly    = STATIC_ONLY.includes(selectedCategory);

  if (loading && articles.length === 0 && !isStaticOnly) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 animate-in fade-in duration-500">

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
            <BRVMArticleCard key={a.id} article={a} onOpen={() => setSelectedBRVM(a)} />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Featured (2/3) */}
          {selectedCategory === 'all' && featuredArticle && (
            <div className="lg:col-span-2 group cursor-pointer">
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-md">
                <OptimizedImage
                  src={featuredArticle.image_url || '/images/default-news.jpg'}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider mb-3 inline-block">
                    {getCategoryLabel(featuredArticle.category)}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight group-hover:text-blue-200 transition-colors">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-slate-200 line-clamp-2 mb-4 max-w-2xl">{featuredArticle.summary}</p>
                  <div className="flex items-center gap-4 text-slate-400 text-xs font-medium">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Il y a {formatTimeAgo(featuredArticle.published_at)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{calcReadTime(featuredArticle.content)} min de lecture</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Article list */}
          <div className={selectedCategory === 'all' && featuredArticle ? 'lg:col-span-1' : 'lg:col-span-3'}>
            {selectedCategory === 'all' && featuredArticle && (
              <h3 className="font-bold text-slate-900 mb-4">Dernières dépêches</h3>
            )}

            <div className={selectedCategory === 'all' && featuredArticle ? 'space-y-4' : 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'}>
              {listArticles.map(article => (
                <div
                  key={article.id}
                  className={`bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden ${
                    selectedCategory === 'all' && featuredArticle ? 'p-4' : ''
                  }`}
                >
                  {selectedCategory === 'all' && featuredArticle ? (
                    <div className="flex items-start gap-4">
                      {article.image_url && (
                        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-200">
                          <OptimizedImage src={article.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryColor(article.category)}`}>
                            {getCategoryLabel(article.category)}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm">
                          {article.title}
                        </h4>
                        <div className="flex items-center gap-3 text-slate-400 text-[10px]">
                          <span>Il y a {formatTimeAgo(article.published_at)}</span>
                          <span>•</span>
                          <span>{calcReadTime(article.content)} min</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {article.image_url && (
                        <div className="h-40 overflow-hidden bg-slate-200">
                          <OptimizedImage src={article.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryColor(article.category)}`}>
                            {getCategoryLabel(article.category)}
                          </span>
                          {article.is_featured && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-50 text-yellow-600 border border-yellow-100">
                              À la une
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {article.title}
                        </h4>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{article.summary}</p>
                        <div className="flex items-center justify-between text-slate-400 text-xs pt-3 border-t border-slate-100">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Il y a {formatTimeAgo(article.published_at)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{calcReadTime(article.content)} min</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {listArticles.length === 0 && brvmFiltered.length === 0 && (
                <div className="py-12 text-center text-slate-400 col-span-full">
                  Aucune actualité dans cette catégorie pour le moment.
                </div>
              )}
            </div>

            {selectedCategory === 'all' && featuredArticle && listArticles.length > 0 && (
              <button className="w-full mt-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                Voir toute l'actualité <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* BRVM 2026 intelligence — inline below API articles */}
      {!isStaticOnly && !loading && brvmFiltered.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} className="text-[#00D4A8]" />
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Intelligence de marché BRVM 2026</h3>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {brvmFiltered.length} article{brvmFiltered.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brvmFiltered.map(a => (
              <BRVMArticleCard key={a.id} article={a} onOpen={() => setSelectedBRVM(a)} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isStaticOnly && !loading && articles.length === 0 && brvmFiltered.length === 0 && (
        <div className="text-center py-16">
          <Newspaper className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">
            Aucun article trouvé{selectedCategory !== 'all' ? ` dans "${getCategoryLabel(selectedCategory)}"` : ''}.
          </p>
        </div>
      )}

      {/* BRVM article detail panel */}
      {selectedBRVM && <BRVMDetailPanel article={selectedBRVM} onClose={() => setSelectedBRVM(null)} />}
    </div>
  );
}
