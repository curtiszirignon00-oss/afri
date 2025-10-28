import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, BookOpen, Newspaper, BarChart3, Users, FileText, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
// Importer Recharts si nécessaire pour sparklines futures
// import { LineChart, Line, ResponsiveContainer } from 'recharts';

// --- Types (Vérifier qu'ils correspondent à l'API) ---
type Stock = {
    id: string;
    symbol: string;
    company_name: string;
    sector: string | null;
    current_price: number;
    daily_change_percent: number;
    volume: number;
    market_cap: number;
    logo_url?: string | null;
};
// type MarketIndex = { /* ... Type retiré ... */ }; // Type retiré car section supprimée
type NewsArticle = {
    id: string;
    title: string;
    summary: string | null;
    category: string | null;
    image_url: string | null;
    published_at: string | null;
};
// --- Fin Types ---

type HomePageProps = {
  onNavigate: (page: string, data?: any) => void;
  isLoggedIn: boolean; // Prop pour savoir si l'utilisateur est connecté
};

// L'API renvoie maintenant seulement topStocks et featuredNews
interface HomePageData {
    // indices: MarketIndex[]; // Propriété retirée
    topStocks: Stock[];
    featuredNews: NewsArticle[];
}

const API_BASE_URL = 'http://localhost:3000/api'; // Ajuster si besoin

export default function HomePage({ onNavigate, isLoggedIn }: HomePageProps) {
  // const [indices, setIndices] = useState<MarketIndex[]>([]); // État retiré
  const [topStocks, setTopStocks] = useState<Stock[]>([]);
  const [featuredNews, setFeaturedNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const newsContainerRef = useRef<HTMLDivElement>(null); // Pour le carousel d'actualités

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true); setError(null);
    try {
      // L'API /homepage renvoie { topStocks, featuredNews }
      const response = await fetch(`${API_BASE_URL}/homepage`);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data: HomePageData = await response.json();
      // setIndices(data.indices || []); // Ligne retirée
      setTopStocks(data.topStocks || []);
      setFeaturedNews(data.featuredNews || []);
    } catch (err: any) { console.error('Erreur chargement:', err); setError(err.message || 'Impossible de charger.'); }
    finally { setLoading(false); }
  }

  // --- Fonctions Utilitaires (inchangées) ---
  function formatNumber(num: number | null | undefined, options?: Intl.NumberFormatOptions): string {
      if (num === null || num === undefined) return 'N/A';
      return new Intl.NumberFormat('fr-FR', options).format(num);
  }
   function formatCurrency(num: number | null | undefined): string {
       if (num === null || num === undefined) return 'N/A';
       if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)} Mds F`;
       if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} M F`;
       return formatNumber(num, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' F';
   }
   function formatDate(dateString: string | null): string {
        if (!dateString) return '';
        try { return new Date(dateString).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }); }
        catch (e) { return ''; }
   }
  // --- Fin Utilitaires ---

  // --- Scroll News Carousel (inchangé) ---
  const scrollNews = (direction: 'left' | 'right') => {
      const container = newsContainerRef.current;
      if (container) {
          const scrollAmount = container.offsetWidth * 0.8; // Scroll 80%
          container.scrollBy({ left: direction === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
      }
  };
  useEffect(() => {
    if (featuredNews.length <= 3) return; // Pas d'auto-scroll si peu d'items

    const interval = setInterval(() => {
        const container = newsContainerRef.current;
        // Vérifie si le conteneur existe et si la souris n'est pas dessus
        if (container && !container.matches(':hover')) {
            const isAtEnd = container.scrollLeft + container.offsetWidth >= container.scrollWidth - 20; // Tolerance
            if (isAtEnd) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                scrollNews('right');
            }
        }
    }, 5000); // Change slide toutes les 5 secondes

    return () => clearInterval(interval); // Nettoyage
  }, [featuredNews]); // Dépend de featuredNews
  // --- Fin Scroll News ---

  // --- États Chargement/Erreur ---
  if (loading && topStocks.length === 0) { // Spinner seulement au tout premier chargement
     return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
  }
  if (error) { // Affichage d'erreur général
     return (
         <div className="flex items-center justify-center min-h-screen text-center px-4">
             <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded relative shadow-md" role="alert">
                 <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-3"/>
                 <strong className="font-bold block mb-1">Erreur de chargement!</strong>
                 <span className="block">{error}</span>
                 <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700">Réessayer</button>
             </div>
         </div>
     );
  }
  // --- Fin États ---

  return (
    // Remplacement de space-y par des marges manuelles mt-
    <div className="pb-16 md:pb-24">

      {/* === Section Héros avec Fond === */}
      <section className="relative bg-gradient-to-tr from-blue-700 via-indigo-900 to-gray-900 text-white pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <img src="/images/african-market-background.jpg" alt="Marché financier africain" className="absolute inset-0 w-full h-full object-cover opacity-20"/>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="max-w-3xl text-center mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">INVESTIR <span className="text-blue-400">MIEUX</span></h1>
            <p className="text-lg md:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">Prenez des décisions éclairées pour votre avenir financier. Formations gratuites, données en temps réel et analyses d'experts pour investir intelligemment sur la BRVM.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={() => onNavigate('learn')} className="px-8 py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center justify-center space-x-2 shadow-lg"><BookOpen className="w-5 h-5" /><span>Commencer à Apprendre</span></button>
              <button onClick={() => onNavigate('markets')} className="px-8 py-3 bg-blue-600 text-white rounded-lg border border-blue-500 hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center space-x-2"><span>Explorer les Données</span><ArrowRight className="w-5 h-5" /></button>
            </div>
          </div>
          {/* Stats */}
          <div className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
              <div><p className="text-3xl font-bold text-blue-300">10,000+</p><p className="text-sm text-indigo-200 uppercase tracking-wider">Investisseurs Actifs</p></div>
              <div><p className="text-3xl font-bold text-blue-300">{topStocks.length}</p><p className="text-sm text-indigo-200 uppercase tracking-wider">Actions Suivies</p></div>
              <div><p className="text-3xl font-bold text-blue-300">50+</p><p className="text-sm text-indigo-200 uppercase tracking-wider">Modules d'Apprentissage</p></div>
              <div><p className="text-3xl font-bold text-blue-300">24/7</p><p className="text-sm text-indigo-200 uppercase tracking-wider">Accès Plateforme</p></div>
          </div>
        </div>
      </section>

      {/* === Section Indices Clés (SUPPRIMÉE) === */}

      {/* === Section Apprendre === */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
         <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-sm">
             <div className="flex-1 text-center md:text-left"> <span className="inline-block px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-semibold mb-4">Nouveau sur AfriBourse ?</span> <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Commencez Votre Parcours d'Apprentissage</h2> <p className="text-gray-700 mb-8 md:max-w-2xl">Nos modules gratuits vous guident pas à pas, de la découverte de la BRVM aux stratégies d'investissement avancées. Apprenez à votre rythme.</p> <button onClick={() => onNavigate(isLoggedIn ? 'learn' : 'signup')} className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center space-x-2 shadow-md mx-auto md:mx-0"> <FileText className="w-5 h-5" /> <span>{isLoggedIn ? 'Accéder à l\'Académie' : 'Créer un Compte Gratuit'}</span> <ArrowRight className="w-5 h-5" /> </button> </div>
             <div className="grid grid-cols-2 gap-4 w-full md:w-auto"> <div className="bg-white rounded-lg p-4 shadow text-center transform hover:scale-105 transition-transform"><span className="text-2xl font-bold text-green-500 block mb-1">1</span><span className="text-sm font-semibold block">Niveau Débutant</span><span className="text-xs text-gray-500 block">Les bases</span></div> <div className="bg-white rounded-lg p-4 shadow text-center transform hover:scale-105 transition-transform"><span className="text-2xl font-bold text-yellow-500 block mb-1">2</span><span className="text-sm font-semibold block">Intermédiaire</span><span className="text-xs text-gray-500 block">Analyse</span></div> <div className="bg-white rounded-lg p-4 shadow text-center transform hover:scale-105 transition-transform"><span className="text-2xl font-bold text-orange-500 block mb-1">3</span><span className="text-sm font-semibold block">Avancé</span><span className="text-xs text-gray-500 block">Stratégies</span></div> <div className="bg-white rounded-lg p-4 shadow text-center transform hover:scale-105 transition-transform"><span className="text-2xl font-bold text-red-500 block mb-1">✓</span><span className="text-sm font-semibold block">Certification</span><span className="text-xs text-gray-500 block">Validez</span></div> </div>
         </div>
      </section>

      {/* === Section Top Actions (avec Logos) === */}
      {topStocks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
           <div className="flex items-center justify-between mb-8"> <h2 className="text-3xl font-bold text-gray-900">Top Performances</h2> <button onClick={() => onNavigate('markets')} className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 text-sm"><span>Voir le marché</span><ArrowRight className="w-4 h-4" /></button> </div>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topStocks.map((stock) => (
                 <button key={stock.id} onClick={() => onNavigate('stock-detail', stock)} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-left flex flex-col justify-between group">
                    <div> <div className="flex justify-between items-start mb-3"> <div className="flex items-center space-x-3"> <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm overflow-hidden">{stock.logo_url ? <img src={stock.logo_url} alt={stock.symbol} className="w-full h-full object-contain"/> : stock.symbol.substring(0, 3)}</div> <div> <h3 className="font-bold text-base text-gray-900 group-hover:text-blue-600 transition-colors">{stock.symbol}</h3> <p className="text-xs text-gray-500 line-clamp-1">{stock.company_name}</p> </div> </div> <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold ${ stock.daily_change_percent >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}> {stock.daily_change_percent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} <span>{stock.daily_change_percent >= 0 ? '+' : ''}{stock.daily_change_percent?.toFixed(2) ?? '0.00'}%</span> </div> </div> <p className="text-xl font-bold text-gray-900 mb-1">{formatNumber(stock.current_price, {minimumFractionDigits: 0, maximumFractionDigits: 0})} F</p> </div>
                    <div className="pt-3 border-t border-gray-100 mt-3 text-xs text-gray-500 flex justify-between"> <span>Cap: {formatCurrency(stock.market_cap)}</span> {stock.sector && <span>{stock.sector}</span>} </div>
                 </button>
              ))}
           </div>
        </section>
      )}

      {/* === Section Actualités (Carousel) === */}
      {featuredNews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
           <div className="flex items-center justify-between mb-8"> <h2 className="text-3xl font-bold text-gray-900">Actualités du Jour</h2> <div className="flex items-center space-x-2"> <button onClick={() => scrollNews('left')} aria-label="Précédent" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50"><ChevronLeft className="w-5 h-5"/></button> <button onClick={() => scrollNews('right')} aria-label="Suivant" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50"><ChevronRight className="w-5 h-5"/></button> <button onClick={() => onNavigate('news')} className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 text-sm ml-4"><span>Voir tout</span><ArrowRight className="w-4 h-4" /></button> </div> </div>
           {/* Conteneur Carousel */}
           <div ref={newsContainerRef} className="flex space-x-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4" style={{ scrollPadding: '1rem' }}>
              {featuredNews.map((article) => (
                 <div key={article.id} className="snap-start flex-shrink-0 w-[80%] sm:w-[45%] md:w-[30%] lg:w-[23%]"> {/* Largeur cartes */}
                     <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden h-full flex flex-col group transition-shadow hover:shadow-md"> {article.image_url ? ( <div className="h-32 bg-gray-200"><img src={article.image_url} alt={article.title} className="w-full h-full object-cover"/></div> ) : ( <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"><Newspaper className="w-8 h-8 text-gray-400"/></div> )} <div className="p-4 flex flex-col flex-grow"> {article.category && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium self-start mb-2">{article.category}</span>} <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors flex-grow">{article.title}</h3> <span className="text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100">{formatDate(article.published_at)}</span> </div> </div>
                 </div>
              ))}
           </div>
        </section>
      )}

       {/* === Section Confiance & Sécurité (Peut être supprimée ou déplacée dans le footer) === */}
       {/* <section className="...">...</section> */}

    </div> // Fin div principal
  );
}

// --- Implémentation Fonctions Helper ---
// (Les fonctions formatNumber, formatCurrency, formatDate restent les mêmes que dans le code précédent)