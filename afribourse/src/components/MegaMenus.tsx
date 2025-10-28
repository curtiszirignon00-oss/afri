import { BookOpen, GraduationCap, TrendingUp, TrendingDown, BarChart3, Lightbulb, Newspaper, Globe, DollarSign, Eye, Building2, MapPin } from 'lucide-react'; // Added TrendingDown
import { useEffect, useState } from 'react';
// import { supabase } from '../lib/supabase'; // <-- REMOVE Supabase

// --- Type Definitions ---
// Define types based on what your API endpoints return
type NewsArticle = {
  id: string;
  title: string;
  summary: string | null;
  // Add other fields if needed
};

type MarketIndex = {
  id: string;
  index_name: string;
  index_value: number;
  daily_change_percent: number;
  // Add other fields if needed
};
// --- End Types ---

const API_BASE_URL = 'http://localhost:3000/api'; // Adjust if needed

type MegaMenuProps = {
  onNavigate: (page: string, data?: any) => void;
};

// --- LearnMegaMenu (No changes needed, it's static) ---
export function LearnMegaMenu({ onNavigate }: MegaMenuProps) {
  return (
    <div className="absolute left-0 top-full w-screen max-w-full bg-white shadow-xl border-t border-gray-200 z-40"> {/* Added max-w-full */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ... Learn menu content ... */}
         <div className="grid md:grid-cols-3 gap-8">
             {/* Column 1: Links */}
             <div className="space-y-4">
               <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Parcours</h3>
               {/* Beginner */}
               <button onClick={() => onNavigate('learn', { difficulty: 'debutant' })} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors"><GraduationCap className="w-6 h-6 text-green-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Débutant</h4> <p className="text-sm text-gray-600">Les bases de la BRVM.</p> </div> </button>
               {/* Intermediate */}
               <button onClick={() => onNavigate('learn', { difficulty: 'intermediaire' })} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors"><BarChart3 className="w-6 h-6 text-yellow-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Intermédiaire</h4> <p className="text-sm text-gray-600">Approfondir.</p> </div> </button>
               {/* Advanced */}
               <button onClick={() => onNavigate('learn', { difficulty: 'avance' })} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors"><TrendingUp className="w-6 h-6 text-red-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Avancé</h4> <p className="text-sm text-gray-600">Maîtriser.</p> </div> </button>
             </div>
             {/* Column 2 & 3: Promotion */}
             <div className="md:col-span-2"> <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 h-full flex flex-col justify-between"> <div> <div className="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium mb-4">Populaire</div> <h3 className="text-2xl font-bold text-gray-900 mb-4">Commencez votre voyage</h3> <p className="text-gray-700 mb-6">Rejoignez des milliers d'investisseurs...</p> </div> <div className="flex items-center space-x-4"> <button onClick={() => onNavigate('learn')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">Démarrer</button> <div className="flex items-center space-x-2 text-sm text-gray-600"><BookOpen className="w-5 h-5" /><span>15+ modules gratuits</span></div> </div> </div> </div>
         </div>
      </div>
    </div>
  );
}
// --- END LearnMegaMenu ---

// --- UPDATED NewsMegaMenu ---
export function NewsMegaMenu({ onNavigate }: MegaMenuProps) {
  const [latestArticle, setLatestArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch latest article from backend API
  useEffect(() => {
    async function loadLatest() {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/news/latest`);
        if (response.ok) {
          const data: NewsArticle = await response.json();
          setLatestArticle(data);
        } else {
          console.error("Failed to load latest article");
          setLatestArticle(null);
        }
      } catch (error) {
        console.error("Error fetching latest article:", error);
        setLatestArticle(null);
      } finally {
          setLoading(false);
      }
    }
    loadLatest();
  }, []); // Run once on mount

  return (
    <div className="absolute left-0 top-full w-screen max-w-full bg-white shadow-xl border-t border-gray-200 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Column 1: Categories */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Catégories</h3>
            {/* Markets */}
            <button onClick={() => onNavigate('news', { category: 'marches' })} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors"><TrendingUp className="w-6 h-6 text-blue-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Marchés</h4> <p className="text-sm text-gray-600">Tendances BRVM.</p> </div> </button>
            {/* Startups (Remove if you removed startups) */}
            {/* <button onClick={() => onNavigate('news', { category: 'startups' })} className="..."> ... Startups ... </button> */}
            {/* Economy */}
            <button onClick={() => onNavigate('news', { category: 'economie' })} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors"><Globe className="w-6 h-6 text-orange-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Économie</h4> <p className="text-sm text-gray-600">Actus UEMOA.</p> </div> </button>
          </div>
          {/* Column 2 & 3: Latest Article */}
          <div className="md:col-span-2">
            {loading ? (
                <div className="bg-gray-100 rounded-xl p-6 h-full flex items-center justify-center min-h-[150px]"> <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div> </div>
            ) : latestArticle ? (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 h-full flex flex-col justify-between">
                <div> <div className="flex items-center space-x-2 mb-4"> <Newspaper className="w-5 h-5 text-orange-600" /> <span className="text-sm font-medium text-orange-600 uppercase">Dernière actualité</span> </div> <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{latestArticle.title}</h3> <p className="text-sm text-gray-700 line-clamp-3">{latestArticle.summary || 'Lire la suite pour plus de détails.'}</p> </div>
                <button onClick={() => onNavigate('news')} /* Pass article ID/slug if needed */ className="mt-6 px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold self-start text-sm">Lire la suite</button>
              </div>
            ) : (
                <div className="bg-gray-100 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center min-h-[150px]"> <Newspaper className="w-8 h-8 text-gray-400 mb-2"/> <p className="text-sm text-gray-500">Aucune actualité récente trouvée.</p> </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// --- END UPDATED NewsMegaMenu ---

// --- UPDATED MarketsMegaMenu ---
export function MarketsMegaMenu({ onNavigate }: MegaMenuProps) {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch latest indices from backend API
  useEffect(() => {
    async function loadIndices() {
        setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/indices/latest?limit=2`); // Fetch latest 2
        if (response.ok) {
          const data: MarketIndex[] = await response.json();
          setIndices(data);
        } else {
           console.error("Failed to load latest indices");
           setIndices([]);
        }
      } catch (error) {
          console.error("Error fetching latest indices:", error);
          setIndices([]);
      } finally {
          setLoading(false);
      }
    }
    loadIndices();
  }, []); // Run once on mount

  // Helper function
  function formatIndexValue(num: number | null | undefined): string {
      if (num === null || num === undefined) return 'N/A';
      return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  }

  return (
    <div className="absolute left-0 top-full w-screen max-w-full bg-white shadow-xl border-t border-gray-200 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
           {/* Column 1: Links */}
           <div className="space-y-4">
             <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Navigation</h3>
             {/* All Stocks */}
             <button onClick={() => onNavigate('markets')} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors"><BarChart3 className="w-6 h-6 text-blue-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Actions</h4> <p className="text-sm text-gray-600">Toutes les valeurs.</p> </div> </button>
             {/* Screener */}
             <button onClick={() => onNavigate('markets')} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors"><TrendingUp className="w-6 h-6 text-green-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Screener</h4> <p className="text-sm text-gray-600">Filtrer & Trier.</p> </div> </button>
             {/* Obligations (Link might go elsewhere) */}
             {/* <button onClick={() => onNavigate('bonds')} className="..."> ... Obligations ... </button> */}
           </div>
           {/* Column 2 & 3: Indices */}
           <div className="md:col-span-2">
             <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
               <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Indices BRVM</h3>
               {loading ? (
                    <div className="grid md:grid-cols-2 gap-4 min-h-[100px] items-center justify-center"> <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div> </div>
               ) : indices.length > 0 ? (
                 <div className="grid md:grid-cols-2 gap-4">
                   {indices.map((index) => (
                     <div key={index.id} className="bg-white rounded-lg p-4 shadow-sm">
                       <p className="text-xs text-gray-600 mb-1 truncate">{index.index_name}</p>
                       <div className="flex items-end justify-between">
                         <p className="text-xl font-bold text-gray-900">{formatIndexValue(index.index_value)}</p>
                         <div className={`flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${ index.daily_change_percent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700' }`}>
                           {index.daily_change_percent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                           <span>{index.daily_change_percent >= 0 ? '+' : ''}{index.daily_change_percent?.toFixed(2) ?? '0.00'}%</span>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Impossible de charger les indices.</p>
               )}
               <button onClick={() => onNavigate('markets')} className="mt-6 w-full px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm">Voir toutes les cotations</button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
// --- END UPDATED MarketsMegaMenu ---


// --- StartupsMegaMenu (Can be removed if you removed startups) ---
// export function StartupsMegaMenu({ onNavigate }: MegaMenuProps) { ... }


// --- PortfolioMegaMenu (No changes needed, it's static) ---
export function PortfolioMegaMenu({ onNavigate }: MegaMenuProps) {
    // Check login status (passed from Header or using context)
    // const isLoggedIn = ...;
    const isLoggedIn = false; // Placeholder - Replace with actual login status check

    return (
     <div className="absolute left-0 top-full w-screen max-w-full bg-white shadow-xl border-t border-gray-200 z-40">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <div className="grid md:grid-cols-3 gap-8">
             {/* Links */}
             <div className="space-y-4">
               <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Mes Outils</h3>
               <button onClick={() => onNavigate(isLoggedIn ? 'dashboard' : 'login')} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors"><BarChart3 className="w-6 h-6 text-blue-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Mon Portefeuille</h4> <p className="text-sm text-gray-600">Suivi simulation.</p> </div> </button>
               <button onClick={() => onNavigate(isLoggedIn ? 'dashboard' : 'login')} /* Point to watchlist section? */ className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors"><Eye className="w-6 h-6 text-green-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Ma Watchlist</h4> <p className="text-sm text-gray-600">Actions suivies.</p> </div> </button>
             </div>
             {/* Promotion */}
             <div className="md:col-span-2"> <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 h-full flex flex-col justify-between"> <div> <h3 className="text-2xl font-bold text-gray-900 mb-4">Suivez vos simulations</h3> <p className="text-gray-700 mb-6">Créez votre portefeuille virtuel gratuit...</p> </div> <button onClick={() => onNavigate(isLoggedIn ? 'dashboard' : 'login')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold self-start">{isLoggedIn ? 'Accéder au Dashboard' : 'Connectez-vous'}</button> </div> </div>
         </div>
       </div>
     </div>
    );
}

// --- SGIMegaMenu (Can be removed if you removed SGI focus) ---
// export function SGIMegaMenu({ onNavigate }: MegaMenuProps) { ... }