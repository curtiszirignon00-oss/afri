import { useEffect, useState } from 'react';
import { Calendar, User, Tag, AlertTriangle, Newspaper } from 'lucide-react'; // Added Newspaper
// import { supabase, type NewsArticle } from '../lib/supabase'; // <-- REMOVE Supabase

// --- Updated Type Definition ---
type NewsArticle = {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  content: string | null;
  category: string | null; // Keep category as string
  author: string | null;
  source: string | null;
  country: string | null;
  sector: string | null;
  image_url: string | null;
  is_featured: boolean;
  published_at: string | null; // Prisma dates can be null
  created_at: string | null;
};
// --- End Type Definition ---

const API_BASE_URL = 'http://localhost:3000/api'; // Adjust if needed

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]); // Holds articles fetched from API
  // filteredArticles state is no longer needed if filtering happens server-side
  // const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Add error state
  const [selectedCategory, setSelectedCategory] = useState('all'); // Filter state

  // --- UPDATED useEffect to load articles based on category ---
  useEffect(() => {
    // Define the async function inside useEffect
    async function loadArticles() {
      setLoading(true);
      setError(null);
      // Construct the URL with the category query parameter
      const url = `${API_BASE_URL}/news${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: Impossible de charger les actualités.`);
        }
        const data: NewsArticle[] = await response.json();
        setArticles(data || []); // Update state with data from API (already filtered)
      } catch (err: any) {
        console.error('Error loading articles:', err);
        setError(err.message || "Une erreur est survenue.");
        setArticles([]); // Clear articles on error
      } finally {
        setLoading(false);
      }
    }

    loadArticles(); // Call the function

  }, [selectedCategory]); // Re-run effect when selectedCategory changes
  // --- END UPDATED useEffect ---


  // Client-side filtering is no longer needed
  // useEffect(() => { filterArticles(); }, [articles, selectedCategory]);
  // function filterArticles() { ... }

  // --- Helper functions (Keep as they are, but check category strings) ---
   // Format date safely
  function formatDate(dateString: string | null): string {
      if (!dateString) return 'Date inconnue';
      try {
          const date = new Date(dateString);
          return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', /* hour: '2-digit', minute: '2-digit' */ }); // Removed time part for brevity
      } catch (e) {
          return 'Date invalide';
      }
  }

  // Map category slugs to labels
  function getCategoryLabel(category: string | null): string {
    if (!category) return 'Non classé';
    const labels: Record<string, string> = {
      // Use the exact category strings your backend/database uses
      'marches': 'Marchés', 
      'analyse': 'Analyse',
      'startup': 'Startup',
      'economie': 'Économie',
      'interview': 'Interview',
      // Add other categories from your data
    };
    // Capitalize if no specific label found
    return labels[category.toLowerCase()] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  // Map category slugs to colors
  function getCategoryColor(category: string | null): string {
    if (!category) return 'bg-gray-100 text-gray-700';
    const colors: Record<string, string> = {
      'marches': 'bg-blue-100 text-blue-700',
      'analyse': 'bg-green-100 text-green-700',
      'startup': 'bg-purple-100 text-purple-700',
      'economie': 'bg-orange-100 text-orange-700',
      'interview': 'bg-pink-100 text-pink-700',
      // Add other categories
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-700';
  }

  // Define categories for filter buttons (should match backend/database values)
  const categories = ['all', 'marches', 'analyse', /*'startup',*/ 'economie', 'interview']; // Removed 'startup' based on previous decision
  // --- END Helper Functions ---

  // --- Loading State ---
  if (loading && articles.length === 0) { // Show spinner only on initial load
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  // --- END Loading State ---

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Actualités & Analyses</h1>
        <p className="text-gray-600 text-lg">
          Suivez les dernières nouvelles des marchés financiers et de l'économie africaine.
        </p>
      </div>

      {/* Category Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-8 sticky top-20 z-10"> {/* Made filters sticky */}
        <div className="flex flex-wrap gap-2 md:gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'Tout' : getCategoryLabel(category)}
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

      {/* Article List */}
      {!loading && !error && (
        <div className="space-y-6">
          {articles.map((article, index) => ( // Use 'articles' directly, it's filtered by API
            <article
              key={article.id}
              // Special layout for first featured article? Only if needed.
              // className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${ index === 0 && article.is_featured ? 'md:flex' : '' }`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col md:flex-row" // Consistent layout
            >
              {/* Image Column */}
              {article.image_url && (
                <div className="md:w-1/3 h-48 md:h-auto flex-shrink-0 bg-gray-200">
                    <img src={article.image_url} alt={article.title} className="w-full h-full object-cover"/>
                </div>
              )}
              {/* Content Column */}
              <div className="p-5 md:p-6 flex flex-col justify-between flex-grow">
                  <div> {/* Top part: category, title, summary */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                            {getCategoryLabel(article.category)}
                          </span>
                          {article.is_featured && (
                            <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              À la une
                            </span>
                          )}
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                          {/* Optional: Wrap title in a link if articles have detail pages */}
                          {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{article.summary}</p>
                  </div>
                   {/* Bottom part: metadata */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-auto pt-3 border-t border-gray-100">
                      {article.author && (
                        <div className="flex items-center space-x-1"> <User className="w-3.5 h-3.5" /> <span>{article.author}</span> </div>
                      )}
                      <div className="flex items-center space-x-1"> <Calendar className="w-3.5 h-3.5" /> <span>{formatDate(article.published_at)}</span> </div>
                      {article.sector && (
                        <div className="flex items-center space-x-1"> <Tag className="w-3.5 h-3.5" /> <span>{article.sector}</span> </div>
                      )}
                  </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* No Articles Found State */}
      {!loading && !error && articles.length === 0 && (
        <div className="text-center py-16">
           <Newspaper className="w-12 h-12 mx-auto text-gray-300 mb-4" /> {/* Use appropriate icon */}
          <p className="text-gray-500">Aucun article trouvé {selectedCategory !== 'all' ? `dans la catégorie "${getCategoryLabel(selectedCategory)}"` : ''}.</p>
        </div>
      )}
    </div> // End Main Container
  );
}