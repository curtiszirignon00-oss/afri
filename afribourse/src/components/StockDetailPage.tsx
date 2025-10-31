import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink, Wallet, AlertTriangle, Star } from 'lucide-react';
// import { supabase, type Stock, type StockFundamental } from '../lib/supabase'; // <-- REMOVE Supabase
import toast from 'react-hot-toast';

// --- Type Definitions (Ensure these match your actual Prisma schema / API responses) ---
import { Stock, StockFundamental, Portfolio, WatchlistItem } from '../types';
// --- End Type Definitions ---

type StockDetailPageProps = {
  stock: Stock; // Stock data passed as prop
  onNavigate: (page: string, data?: any) => void;
};

const API_BASE_URL = 'http://localhost:3000/api'; // Adjust if needed

export default function StockDetailPage({ stock, onNavigate }: StockDetailPageProps) {
  // If stock data wasn't passed correctly
  if (!stock) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        {/* ... Error display ... */}
      </div>
    );
  }

  // --- State Variables ---
  const [fundamentals, setFundamentals] = useState<StockFundamental[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Add error state
  const [isBuying, setIsBuying] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isTogglingWatchlist, setIsTogglingWatchlist] = useState(false); // Loading state for watchlist button

  // --- useEffect to load additional data ---
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // --- Fetch Fundamentals (Needs Backend Endpoint) ---
        // TODO: Create GET /api/stocks/:symbol/fundamentals endpoint
        // const fundamentalsResponse = await fetch(`${API_BASE_URL}/stocks/${stock.symbol}/fundamentals`);
        // if (fundamentalsResponse.ok) {
        //     const data = await fundamentalsResponse.json();
        //     setFundamentals(data || []);
        // } else {
        //     console.warn("Could not load fundamentals");
        //     setFundamentals([]);
        // }
         setFundamentals([]); // Placeholder

        // --- Fetch Portfolio and Watchlist Status (Parallel) ---
        // These require authentication (cookies are sent via credentials: 'include')
        const [portfolioRes, watchlistRes] = await Promise.all([
             fetch(`${API_BASE_URL}/portfolios/my`, { credentials: 'include' }), // Fetch minimal portfolio info
             fetch(`${API_BASE_URL}/watchlist/my`, { credentials: 'include' }) // Fetch full watchlist
        ]);

        // Process Portfolio (only need cash_balance here)
        if (portfolioRes.ok) {
            const portfolioData = await portfolioRes.json();
           setPortfolio({ 
  id: portfolioData.id, 
  userId: portfolioData.userId || '',
  name: portfolioData.name || 'Mon Portfolio',
  initial_balance: portfolioData.initial_balance || 0,
  cash_balance: portfolioData.cash_balance,
  positions: portfolioData.positions || []
});
        } else if (portfolioRes.status === 401) {
             // Not logged in, that's okay for viewing, just can't buy
             setPortfolio(null);
        } else if (portfolioRes.status === 404) {
             // Logged in but no portfolio created yet
             setPortfolio(null); // Treat as no portfolio for buying purposes
        } else {
             console.warn("Could not load portfolio status");
             setPortfolio(null);
        }

        // Process Watchlist Status
        if (watchlistRes.ok) {
            const watchlistItems: WatchlistItem[] = await watchlistRes.json();
            // Check if the current stock's symbol is in the fetched list
            const found = watchlistItems.some(item => item.stock_ticker === stock.symbol);
            setIsInWatchlist(found);
        } else if (watchlistRes.status === 401) {
             setIsInWatchlist(false); // Not logged in, can't be in watchlist
        } else {
            console.warn("Could not load watchlist status");
            setIsInWatchlist(false);
        }

      } catch (err: any) {
        console.error("Erreur chargement données StockDetail:", err);
        setError("Impossible de charger les informations supplémentaires.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [stock.symbol]); // Reload if stock symbol changes

  // --- UPDATED handleToggleWatchlist ---
  async function handleToggleWatchlist() {
    setIsTogglingWatchlist(true); // Set loading state for button
    setError(null);
    const currentStatus = isInWatchlist; // Store current status before API call
    const url = `${API_BASE_URL}/watchlist/my${currentStatus ? `/${stock.symbol}` : ''}`; // Use DELETE url if removing
    const method = currentStatus ? 'DELETE' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: currentStatus ? {} : { 'Content-Type': 'application/json' }, // Only need header for POST
            credentials: 'include', // Send auth cookie
            body: currentStatus ? null : JSON.stringify({ stockTicker: stock.symbol }), // Only need body for POST
        });

        if (response.status === 401) {
            toast.error("Veuillez vous connecter pour gérer la watchlist.");
            setIsTogglingWatchlist(false);
            return;
        }

        if (!response.ok && response.status !== 204) { // 204 is success for DELETE
             const errorData = await response.json();
             throw new Error(errorData.message || 'Erreur serveur watchlist');
        }

        // Toggle state visually
        const newStatus = !currentStatus;
        setIsInWatchlist(newStatus);
        toast.success(newStatus ? 'Action ajoutée à la watchlist !' : 'Action retirée de la watchlist.');

    } catch (err: any) {
        console.error("Erreur watchlist toggle:", err);
        toast.error(`Erreur : ${err.message}`);
        // Optional: Revert visual state if API call failed
        // setIsInWatchlist(currentStatus);
    } finally {
        setIsTogglingWatchlist(false); // Turn off loading state
    }
  }
  // --- END UPDATED handleToggleWatchlist ---

  // --- UPDATED handleBuy ---
  async function handleBuy() {
    if (!portfolio) { return toast.error("Connectez-vous et créez un portefeuille pour acheter."); }
    const totalCost = quantity * stock.current_price;
    if (totalCost > portfolio.cash_balance) { return toast.error("Fonds insuffisants."); }

    setIsBuying(true);
    const toastId = toast.loading('Achat en cours...');
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/portfolios/my/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send auth cookie
        body: JSON.stringify({
          stockTicker: stock.symbol,
          quantity: quantity,
          pricePerShare: stock.current_price
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erreur lors de l'achat");
      }

      toast.success(`Achat de ${quantity} action(s) de ${stock.symbol} réussi !`, { id: toastId });
      // Navigate to dashboard after success
      setTimeout(() => onNavigate('dashboard'), 1500);

    } catch (error: any) {
      console.error("Erreur achat:", error);
      toast.error(`Erreur : ${error.message}`, { id: toastId });
      setError(error.message); // Show error inline as well
      setIsBuying(false); // Ensure button is re-enabled on error
    }
    // No finally setLoading(false) here because we navigate away on success
  }
  // --- END UPDATED handleBuy ---

  // --- Utility functions (Keep as they are) ---
  function formatNumber(num: number): string { return new Intl.NumberFormat('fr-FR').format(num); }
  function formatCurrency(num: number): string {
    if (!num) return 'N/A';
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)} Mds`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)} M`;
    return formatNumber(num);
  }
  // --- End Utilities ---

  const latestFundamentals = fundamentals[0]; // Still works even if fundamentals is empty
  const totalCost = quantity * stock.current_price;

  // --- Calculation functions (Keep as they are, but check field names) ---
  function calculateMarketSentiment(): { score: number; label: string; color: string } {
    const changePercent = stock.daily_change_percent ?? 0; // Use nullish coalescing
    const volumeScore = (stock.volume ?? 0) > 30000 ? 1 : 0.5;
    const priceScore = changePercent >= 2 ? 2 : changePercent >= 0 ? 1 : changePercent >= -2 ? 0 : -1;
    const totalScore = (priceScore + volumeScore) / 3 * 100;
    // ... rest of sentiment logic
     if (totalScore >= 60) return { score: totalScore, label: 'Très Positif', color: 'green' };
     if (totalScore >= 30) return { score: totalScore, label: 'Positif', color: 'lime' };
     if (totalScore >= -30) return { score: totalScore, label: 'Neutre', color: 'yellow' };
     if (totalScore >= -60) return { score: totalScore, label: 'Négatif', color: 'orange' };
     return { score: totalScore, label: 'Très Négatif', color: 'red' };
  }

  function calculateTechnicalSignal(): { label: string; color: string; description: string } {
    const changePercent = stock.daily_change_percent ?? 0;
    const priceVsPrevious = (stock.previous_close ?? 0) > 0 ? stock.current_price / stock.previous_close : 1;
    // ... rest of technical signal logic
     if (changePercent >= 3 && priceVsPrevious > 1.025) return { label: 'Achat Fort', color: 'green', description: 'Forte tendance haussière' };
     if (changePercent >= 1 && priceVsPrevious > 1.01) return { label: 'Achat', color: 'lime', description: 'Tendance haussière modérée' };
     if (changePercent <= -3 && priceVsPrevious < 0.975) return { label: 'Vente Forte', color: 'red', description: 'Forte tendance baissière' };
     if (changePercent <= -1 && priceVsPrevious < 0.99) return { label: 'Vente', color: 'orange', description: 'Tendance baissière modérée' };
     return { label: 'Neutre', color: 'yellow', description: 'Pas de signal clair' };
  }
  // --- End Calculations ---

  const sentiment = calculateMarketSentiment();
  const technicalSignal = calculateTechnicalSignal();

  // --- JSX Rendering ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button onClick={() => onNavigate('markets')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"><ArrowLeft className="w-5 h-5" /><span>Retour aux marchés</span></button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Stock Info, Indicators, Fundamentals) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stock Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              {/* Left Side: Name, Desc, Watchlist */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{stock.symbol}</h1>
                  {stock.sector && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium whitespace-nowrap">{stock.sector}</span>}
                  {/* Watchlist Button with Loading State */}
                  <button onClick={handleToggleWatchlist} disabled={isTogglingWatchlist} className={`p-2 rounded-full hover:bg-yellow-100 transition-colors ${isTogglingWatchlist ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isTogglingWatchlist ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                    ) : (
                        <Star className={`w-5 h-5 ${isInWatchlist ? 'text-yellow-500 fill-yellow-400' : 'text-gray-400 hover:text-yellow-500'}`} />
                    )}
                  </button>
                </div>
                <h2 className="text-xl text-gray-700 mb-4">{stock.company_name}</h2>
                <p className="text-gray-600 leading-relaxed text-sm">{stock.description || 'Description non disponible.'}</p>
                {stock.website_url && <a href={stock.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mt-4 text-sm"><span>Site web</span><ExternalLink className="w-4 h-4" /></a>}
              </div>
              {/* Right Side: Price Box */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6 min-w-full md:min-w-[280px] text-center md:text-left">
                <p className="text-sm text-gray-600 mb-1 md:mb-2">Prix actuel</p>
                <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">{formatNumber(stock.current_price)} FCFA</p>
                <div className={`inline-flex items-center space-x-2 px-3 py-1 md:px-4 md:py-2 rounded-lg text-base md:text-lg font-semibold ${stock.daily_change_percent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {stock.daily_change_percent >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span>{stock.daily_change_percent >= 0 ? '+' : ''}{stock.daily_change_percent?.toFixed(2) ?? '0.00'}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Indicators */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Indicateurs de Décision</h3>
            <div className="grid md:grid-cols-2 gap-8">
               {/* Sentiment */}
               <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Sentiment du Marché</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${ sentiment.color === 'green' ? 'bg-green-100 text-green-800' : sentiment.color === 'lime' ? 'bg-lime-100 text-lime-800' : sentiment.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : sentiment.color === 'orange' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800' }`}>{sentiment.label}</span>
                  {/* Optional: Add a small progress bar or gauge */}
               </div>
               {/* Signal */}
               <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Signal Technique</h4>
                  <span className={`px-4 py-2 rounded-lg text-sm font-semibold inline-block ${ technicalSignal.color === 'green' ? 'bg-green-100 text-green-800' : technicalSignal.color === 'lime' ? 'bg-lime-100 text-lime-800' : technicalSignal.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : technicalSignal.color === 'orange' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800' }`}>{technicalSignal.label}</span>
                  <p className="text-xs text-gray-600 mt-2">{technicalSignal.description}</p>
               </div>
            </div>
            <p className="text-xs text-gray-500 mt-6 border-t border-gray-100 pt-3">
                <strong>Note :</strong> Ces indicateurs sont générés automatiquement et ne constituent pas un conseil en investissement.
            </p>
          </div>

          {/* Fundamentals (Conditional Display) */}
          {loading ? (
             <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
          ) : latestFundamentals ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Données Fondamentales ({latestFundamentals.year})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                 {/* Map over available fundamentals */}
                <div className="bg-gray-50 rounded-lg p-3 md:p-4"><p className="text-xs md:text-sm text-gray-600">Ratio P/E</p><p className="text-lg md:text-2xl font-bold text-gray-900">{latestFundamentals.pe_ratio?.toFixed(2) ?? 'N/A'}</p></div>
                <div className="bg-gray-50 rounded-lg p-3 md:p-4"><p className="text-xs md:text-sm text-gray-600">Rend. Div.</p><p className="text-lg md:text-2xl font-bold text-gray-900">{latestFundamentals.dividend_yield?.toFixed(2) ?? 'N/A'}%</p></div>
                <div className="bg-gray-50 rounded-lg p-3 md:p-4"><p className="text-xs md:text-sm text-gray-600">BPA</p><p className="text-lg md:text-2xl font-bold text-gray-900">{latestFundamentals.eps ? formatNumber(latestFundamentals.eps) + ' F' : 'N/A'}</p></div>
                {/* Add other fundamentals if available */}
              </div>
               {/* Add link/button to see more historical fundamentals if needed */}
            </div>
          ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 text-center">
                 <p className="text-gray-500">Données fondamentales non disponibles pour cette action.</p>
              </div>
          )}

        </div>

        {/* Right Column (Buy/Sell Box) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4"> {/* Adjusted top */}
            <h3 className="text-xl font-bold text-gray-900">Ordre de Simulation</h3>
            {/* Display Cash Balance */}
            {portfolio ? (
              <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600"><Wallet className="w-5 h-5 text-gray-400"/><span>Liquidités</span></div>
                  <span className="font-semibold text-gray-800">{formatNumber(portfolio.cash_balance)} FCFA</span>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <button onClick={() => onNavigate('login')} className="text-blue-600 font-semibold hover:underline">Connectez-vous</button> pour simuler.
              </div>
            )}
            {/* Quantity Input */}
            <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                <input
                    type="number" id="quantity" value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    min="1" step="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!portfolio} // Disable if not logged in/no portfolio
                />
            </div>
            {/* Price Info */}
            <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-gray-600">Prix / action</span>
                <span className="font-medium text-gray-800">{formatNumber(stock.current_price)} FCFA</span>
            </div>
            {/* Total Cost */}
            <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-3 mt-2">
                <span className="text-gray-900">Coût Total</span>
                <span className="text-blue-600">{formatNumber(totalCost)} FCFA</span>
            </div>
            {/* Insufficient Funds Warning */}
            {portfolio && totalCost > portfolio.cash_balance && (
                <p className="text-red-600 text-xs text-center">Fonds insuffisants pour cet ordre.</p>
            )}
            {/* Inline Error Display */}
            {error && (
                 <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start space-x-2 text-xs">
                   <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                   <p className="text-red-800">{error}</p>
                 </div>
            )}
            {/* Buy Button */}
            <button
                onClick={handleBuy}
                disabled={!portfolio || totalCost > (portfolio?.cash_balance ?? 0) || isBuying}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isBuying ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div> : `Acheter ${quantity} action(s)`}
            </button>
             {/* Optional: Add Sell Button if user owns this stock (needs position check) */}
             {/* <button disabled={!portfolio || !userOwnsStock} className="...">Vendre</button> */}
          </div>
        </div>
      </div>
    </div>
  );
}