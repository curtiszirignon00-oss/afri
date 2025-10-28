import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, TrendingUp, TrendingDown, Filter, Star, AlertTriangle } from 'lucide-react'; // Ajout de Star, AlertTriangle
// import { supabase, type Stock } from '../lib/supabase'; // <-- SUPPRIMER Supabase
import toast from 'react-hot-toast';

// --- Définitions des Types ---
type Stock = {
  id: string;
  symbol: string;
  company_name: string;
  sector: string | null;
  current_price: number;
  daily_change_percent: number;
  volume: number;
  market_cap: number;
  // Ajouter d'autres champs si nécessaire
};

type WatchlistItem = {
    id: string;
    stock_ticker: string;
    userId: string;
};
// --- Fin Types ---

type MarketsPageProps = {
  onNavigate: (page: string, data?: any) => void;
};

const API_BASE_URL = 'http://localhost:3000/api'; // Ajuster si besoin

export default function MarketsPage({ onNavigate }: MarketsPageProps) {
  const [stocks, setStocks] = useState<Stock[]>([]); // Contient les actions filtrées/triées de l'API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [sortBy, setSortBy] = useState<'change' | 'price' | 'volume' | 'name'>('name'); // Tri par défaut par nom

  // --- État de la Watchlist ---
  const [watchlistTickers, setWatchlistTickers] = useState<Set<string>>(new Set());
  const [loadingWatchlist, setLoadingWatchlist] = useState(true); // État pour le chargement initial de la watchlist
  const [togglingTicker, setTogglingTicker] = useState<string | null>(null); // Pour désactiver une seule étoile pendant l'appel API

  // --- Récupérer la Watchlist au Montage ---
  useEffect(() => {
    async function fetchWatchlist() {
        setLoadingWatchlist(true);
        try {
            // Appel API pour récupérer la watchlist de l'utilisateur
            const response = await fetch(`${API_BASE_URL}/watchlist/my`, { credentials: 'include' }); // Envoie le cookie d'authentification
            if (response.ok) {
                const items: WatchlistItem[] = await response.json();
                // Stocke les tickers dans un Set pour une vérification rapide (O(1))
                setWatchlistTickers(new Set(items.map(item => item.stock_ticker)));
            } else if (response.status === 401) {
                // L'utilisateur n'est pas connecté, la watchlist sera vide
                setWatchlistTickers(new Set());
            } else {
                // Autre erreur API
                console.error("Échec de la récupération de la watchlist", response.statusText);
                setWatchlistTickers(new Set()); // Fallback : watchlist vide
            }
        } catch (err) {
            console.error("Erreur fetch watchlist:", err);
            setWatchlistTickers(new Set()); // Fallback : watchlist vide
        } finally {
            setLoadingWatchlist(false);
        }
    }
    fetchWatchlist();
  }, []); // Exécuter une seule fois au montage

  // --- useEffect MIS À JOUR pour charger les actions basé sur les filtres ---
  useEffect(() => {
    async function loadStocks() {
      setLoading(true); // Indicateur de chargement pour le tableau principal
      setError(null);
      try {
        // Construit les paramètres de requête pour l'API
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedSector !== 'all') params.append('sector', selectedSector);
        params.append('sort', sortBy); // L'API backend gère maintenant le tri

        // Appelle l'API GET /api/stocks avec les filtres
        const response = await fetch(`${API_BASE_URL}/stocks?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: Impossible de charger les actions.`);
        }
        const data: Stock[] = await response.json();
        setStocks(data || []); // Met à jour l'état avec les données (déjà filtrées et triées par le backend)
      } catch (err: any) {
        console.error('Erreur chargement actions:', err);
        setError(err.message || "Une erreur est survenue.");
        setStocks([]); // Vide le tableau en cas d'erreur
      } finally {
        setLoading(false);
      }
    }

    // Debounce: Attend un peu après la saisie avant de lancer l'appel API
    const timer = setTimeout(() => {
        loadStocks();
    }, 300); // Délai de 300ms

    // Nettoyage: Annule le timer si les dépendances changent avant la fin du délai
    return () => clearTimeout(timer);

  }, [searchTerm, selectedSector, sortBy]); // Ré-exécute quand un filtre change
  // --- FIN useEffect MIS À JOUR ---


  // --- Gestionnaires d'Actions Watchlist ---
  const handleToggleWatchlist = useCallback(async (stockSymbol: string) => {
      setTogglingTicker(stockSymbol); // Désactive l'étoile cliquée
      const isInWatchlist = watchlistTickers.has(stockSymbol);
      const url = `${API_BASE_URL}/watchlist/my${isInWatchlist ? `/${stockSymbol}` : ''}`; // URL pour DELETE ou POST
      const method = isInWatchlist ? 'DELETE' : 'POST';

      // Mise à jour optimiste de l'UI (change l'étoile immédiatement)
      const newSet = new Set(watchlistTickers);
      if (isInWatchlist) newSet.delete(stockSymbol);
      else newSet.add(stockSymbol);
      setWatchlistTickers(newSet);

      try {
          const response = await fetch(url, {
              method: method,
              headers: isInWatchlist ? {} : { 'Content-Type': 'application/json' }, // Header seulement pour POST
              credentials: 'include', // Envoie le cookie d'authentification
              body: isInWatchlist ? null : JSON.stringify({ stockTicker: stockSymbol }), // Body seulement pour POST
          });

          if (response.status === 401) { // Gère le cas où l'utilisateur s'est déconnecté entre-temps
              toast.error("Connectez-vous pour gérer la watchlist.");
              setWatchlistTickers(new Set(watchlistTickers)); // Annule la mise à jour optimiste
              // Optionnel : rediriger vers login ? onNavigate('login');
              return;
          }
          // 204 No Content est une réponse succès pour DELETE
          if (!response.ok && response.status !== 204) {
              const errorData = await response.json().catch(() => ({ message: "Erreur serveur watchlist" }));
              throw new Error(errorData.message || "Erreur serveur watchlist");
          }
          // Le succès est déjà reflété par la mise à jour optimiste
          toast.success(isInWatchlist ? `"${stockSymbol}" retiré de la watchlist` : `"${stockSymbol}" ajouté à la watchlist`);

      } catch (err: any) {
          console.error("Erreur toggle watchlist:", err);
          toast.error(`Erreur : ${err.message}`);
          setWatchlistTickers(new Set(watchlistTickers)); // Annule la mise à jour optimiste en cas d'erreur
      } finally {
          setTogglingTicker(null); // Réactive l'étoile
      }
  }, [watchlistTickers]); // Dépendance : watchlistTickers
  // --- FIN Gestionnaires Watchlist ---


  // --- Fonctions Utilitaires (Gèrent null/undefined) ---
  function formatNumber(num: number | null | undefined): string {
      if (num === null || num === undefined) return 'N/A';
      return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  }
  function formatCurrency(num: number | null | undefined): string {
      if (num === null || num === undefined) return 'N/A';
      if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)} Mds F`;
      if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)} M F`;
      return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num) + ' F'; // Ajout FCFA
  }
  // --- FIN Utilitaires ---


  // --- Calcul des secteurs uniques pour le filtre ---
  const sectors = useMemo(() => {
      const uniqueSectors = new Set(stocks.map((s) => s.sector).filter((s): s is string => !!s)); // Filtre null/undefined/empty
      return ['all', ...Array.from(uniqueSectors).sort()];
  }, [stocks]);
  // --- FIN Secteurs ---

  // --- États Chargement/Erreur ---
   if (loading && stocks.length === 0) { // Spinner seulement au premier chargement
     return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
   }
  // --- FIN États ---

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête Page */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marchés BRVM</h1>
        <p className="text-gray-600">Consultez les cotations des actions de la Bourse Régionale.</p>
      </div>

      {/* Barre de Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <input type="text" placeholder="Rechercher symbole ou nom..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>
          {/* Filtres Select */}
          <div className="flex flex-col sm:flex-row gap-4">
             <div className="relative flex-grow sm:flex-grow-0"> <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" /> <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className="w-full sm:w-auto h-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer" aria-label="Filtrer par secteur"> <option value="all">Tous les secteurs</option> {sectors.slice(1).map((sector) => (<option key={sector} value={sector}>{sector}</option>))} </select> </div>
             <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full sm:w-auto h-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer" aria-label="Trier par"> <option value="name">Nom (A-Z)</option> <option value="change">Variation (% Desc)</option> <option value="price">Prix (Desc)</option> <option value="volume">Volume (Desc)</option> </select>
          </div>
        </div>
      </div>

      {/* Affichage Erreur */}
      {error && ( <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center" role="alert"> <strong className="font-bold">Erreur!</strong> <span className="block sm:inline"> {error}</span> </div> )}

      {/* Tableau des Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto relative"> {/* Ajout relative pour overlay */}
          {/* Overlay de chargement pendant le filtrage */}
          {loading && stocks.length > 0 && (
              <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
          )}
          <table className="w-full text-sm min-w-[768px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-8"></th> {/* Étoile Watchlist */}
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Entreprise</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Secteur</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Prix</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Variation</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Volume</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Cap. Bours.</th>
              </tr>
            </thead>
            {/* Affiche le corps seulement si pas en chargement initial */}
            {!loading && (
                <tbody className="divide-y divide-gray-200">
                  {stocks.map((stock) => {
                    const isWatched = watchlistTickers.has(stock.symbol);
                    const isTogglingThis = togglingTicker === stock.symbol;
                    return (
                        <tr key={stock.id} onClick={(e) => { if ((e.target as HTMLElement).closest('.watchlist-toggle')) return; onNavigate('stock-detail', stock) }} className="hover:bg-blue-50 cursor-pointer transition-colors group">
                            {/* Bouton Watchlist */}
                            <td className="px-1 py-1 text-center"><button className="watchlist-toggle p-2 rounded-full hover:bg-yellow-100 disabled:opacity-30 disabled:cursor-wait" onClick={() => handleToggleWatchlist(stock.symbol)} disabled={loadingWatchlist || isTogglingThis} aria-label={isWatched ? "Retirer" : "Ajouter"}> <Star className={`w-4 h-4 transition-all duration-150 ${isTogglingThis ? 'animate-pulse text-yellow-300' : isWatched ? 'text-yellow-500 fill-yellow-400' : 'text-gray-300 group-hover:text-yellow-400'}`} /> </button></td>
                            {/* Nom & Symbole */}
                            <td className="px-6 py-4 whitespace-nowrap"><div className="font-semibold text-gray-900">{stock.symbol}</div><div className="text-xs text-gray-600 line-clamp-1">{stock.company_name}</div></td>
                            {/* Secteur */}
                            <td className="px-6 py-4 hidden sm:table-cell">{stock.sector && (<span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{stock.sector}</span>)}</td>
                            {/* Prix */}
                            <td className="px-6 py-4 text-right whitespace-nowrap"><div className="font-semibold text-gray-900">{formatNumber(stock.current_price)} F</div></td>
                            {/* Variation */}
                            <td className="px-6 py-4 text-right whitespace-nowrap"><div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${stock.daily_change_percent >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{stock.daily_change_percent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}<span>{stock.daily_change_percent >= 0 ? '+' : ''}{stock.daily_change_percent?.toFixed(2) ?? '0.00'}%</span></div></td>
                            {/* Volume */}
                            <td className="px-6 py-4 text-right text-gray-700 hidden md:table-cell">{formatNumber(stock.volume)}</td>
                            {/* Cap. Bours. */}
                            <td className="px-6 py-4 text-right text-gray-700 hidden lg:table-cell">{formatCurrency(stock.market_cap)}</td>
                        </tr>
                    );
                  })}
                </tbody>
             )}
          </table>
        </div>

        {/* État Vide */}
        {!loading && !error && stocks.length === 0 && (
          <div className="text-center py-16">
             <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
             <p className="text-gray-500">Aucune action trouvée pour vos filtres.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Implémentation Fonctions Helper ---
// (Identique à la version précédente)
// ... formatNumber ...
// ... formatCurrency ...