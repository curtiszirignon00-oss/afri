import { useEffect, useState } from 'react';
import { Calendar, Clock, ChevronRight, AlertTriangle, Newspaper } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import OptimizedImage from './ui/OptimizedImage';

// --- Updated Type Definition ---
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
// --- End Type Definition ---

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // --- UPDATED useEffect to load articles based on category ---
  useEffect(() => {
    async function loadArticles() {
      setLoading(true);
      setError(null);
      const url = `${API_BASE_URL}/news${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: Impossible de charger les actualités.`);
        }
        const data: NewsArticle[] = await response.json();
        setArticles(data || []);
      } catch (err: any) {
        console.error('Error loading articles:', err);
        setError(err.message || "Une erreur est survenue.");
        setArticles([]);
      } finally {
        setLoading(false);
      }
    }

    loadArticles();
  }, [selectedCategory]);

  // --- Helper functions ---
  function formatTimeAgo(dateString: string | null): string {
    if (!dateString) return 'Date inconnue';
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

      if (diffInHours < 1) return "moins d'une heure";
      if (diffInHours < 24) return `${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;

      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return 'Date invalide';
    }
  }

  function calculateReadTime(content: string | null): number {
    const wordsPerMinute = 200;
    const words = content ? content.split(/\s+/).length : 0;
    return Math.ceil(words / wordsPerMinute) || 3;
  }

  function getCategoryLabel(category: string | null): string {
    if (!category) return 'Non classé';
    const labels: Record<string, string> = {
      'marches': 'Marchés',
      'analyse': 'Analyse',
      'startup': 'Startup',
      'economie': 'Économie',
      'interview': 'Interview',
    };
    return labels[category.toLowerCase()] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  function getCategoryColor(category: string | null): string {
    if (!category) return 'bg-slate-100 text-slate-700';
    const colors: Record<string, string> = {
      'marches': 'bg-blue-50 text-blue-600 border-blue-100',
      'analyse': 'bg-green-50 text-green-600 border-green-100',
      'startup': 'bg-purple-50 text-purple-600 border-purple-100',
      'economie': 'bg-orange-50 text-orange-600 border-orange-100',
      'interview': 'bg-pink-50 text-pink-600 border-pink-100',
    };
    return colors[category.toLowerCase()] || 'bg-slate-50 text-slate-600 border-slate-100';
  }

  const categories = ['all', 'marches', 'analyse', 'economie', 'interview'];

  // Get featured article and list articles
  const featuredArticle = articles.find(a => a.is_featured);
  const listArticles = selectedCategory === 'all'
    ? articles.filter(a => !a.is_featured)
    : articles;

  // --- Loading State ---
  if (loading && articles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 animate-in fade-in duration-500">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Actualités Financières</h1>
          <p className="text-slate-500 mt-1">L'essentiel de l'information boursière de l'UEMOA.</p>
        </div>

        {/* Filter tabs */}
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

      {/* Loading Indicator (for filtering) */}
      {loading && articles.length > 0 && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}

      {/* Error Display */}
      {!loading && error && (
        <div className="text-center py-12 px-4">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-400 mb-3" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Main Content Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured Article (2/3) */}
          {selectedCategory === 'all' && featuredArticle && (
            <div className="lg:col-span-2 group cursor-pointer">
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-md">
                <OptimizedImage
                  src={featuredArticle.image_url || '/images/default-news.jpg'}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>

                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider mb-3 inline-block">
                    {getCategoryLabel(featuredArticle.category)}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight group-hover:text-blue-200 transition-colors">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-slate-200 line-clamp-2 mb-4 max-w-2xl">
                    {featuredArticle.summary}
                  </p>
                  <div className="flex items-center gap-4 text-slate-400 text-xs font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Il y a {formatTimeAgo(featuredArticle.published_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {calculateReadTime(featuredArticle.content)} min de lecture
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* News List */}
          <div className={`${selectedCategory === 'all' && featuredArticle ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
            {selectedCategory === 'all' && featuredArticle && (
              <h3 className="font-bold text-slate-900 mb-4">Dernières dépêches</h3>
            )}

            <div className={`${selectedCategory === 'all' && featuredArticle ? 'space-y-4' : 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
              {listArticles.map((article) => (
                <div
                  key={article.id}
                  className={`bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden ${
                    selectedCategory === 'all' && featuredArticle ? 'p-4' : ''
                  }`}
                >
                  {/* Compact layout for sidebar */}
                  {selectedCategory === 'all' && featuredArticle ? (
                    <div className="flex items-start gap-4">
                      {article.image_url && (
                        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-200">
                          <OptimizedImage
                            src={article.image_url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
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
                          <span>{calculateReadTime(article.content)} min</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Card layout for grid view */
                    <>
                      {article.image_url && (
                        <div className="h-40 overflow-hidden bg-slate-200">
                          <OptimizedImage
                            src={article.image_url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
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
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                          {article.summary}
                        </p>
                        <div className="flex items-center justify-between text-slate-400 text-xs pt-3 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Il y a {formatTimeAgo(article.published_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {calculateReadTime(article.content)} min
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {listArticles.length === 0 && (
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

      {/* No Articles Found State */}
      {!loading && !error && articles.length === 0 && (
        <div className="text-center py-16">
          <Newspaper className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">Aucun article trouvé {selectedCategory !== 'all' ? `dans la catégorie "${getCategoryLabel(selectedCategory)}"` : ''}.</p>
        </div>
      )}
    </div>
  );
}
