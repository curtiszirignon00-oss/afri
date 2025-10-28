import { useEffect, useState } from 'react';
import { User, Settings, Wallet, PlusCircle, ShoppingCart, TrendingUp, TrendingDown, X, Eye, LineChart as ChartIcon, AlertCircle } from 'lucide-react'; // Added AlertCircle
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- Type Definitions (Matching Prisma Schema) ---
type Stock = {
  id: string;
  symbol: string;
  company_name: string;
  sector: string | null;
  current_price: number;
  daily_change_percent: number;
  // Add other fields if needed for display
};

type UserProfile = {
    id: string; // User ID
    email: string;
    name: string | null;
    lastname: string | null;
    first_name?: string | null;
};

type Portfolio = {
    id: string;
    userId: string;
    name: string;
    initial_balance: number;
    cash_balance: number;
    positions: Position[];
};

type Position = {
    id: string;
    portfolioId: string;
    stock_ticker: string;
    quantity: number;
    average_buy_price: number;
};

type WatchlistItem = {
    id: string;
    stock_ticker: string;
    userId: string;
};

type PortfolioHistoryPoint = {
    date: string;
    value: number;
};
// --- End Type Definitions ---

type DashboardPageProps = {
  onNavigate: (page: string, data?: any) => void;
};

const API_BASE_URL = 'http://localhost:3000/api';

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [stocksData, setStocksData] = useState<{ [key: string]: Stock }>({});
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [isSelling, setIsSelling] = useState(false);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedStockToBuy, setSelectedStockToBuy] = useState<Stock | null>(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    setLoading(true);
    setError(null);
    try {
      const [portfolioRes, profileRes, watchlistRes, historyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/portfolios/my`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/watchlist/my`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/portfolios/my/history`, { credentials: 'include' })
      ]);

      if ([portfolioRes, profileRes, watchlistRes, historyRes].some(res => res.status === 401)) {
           toast.error("Session expirée ou invalide. Veuillez vous reconnecter.");
           onNavigate('login');
           return;
      }

      let currentPortfolio: Portfolio | null = null;
      if (portfolioRes.ok) {
        currentPortfolio = await portfolioRes.json();
        setPortfolio(currentPortfolio);
      } else if (portfolioRes.status !== 404) {
        throw new Error(`Erreur ${portfolioRes.status}: Impossible de charger le portefeuille.`);
      } else {
         setPortfolio(null); // 404 means no portfolio yet
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserProfile({ ...profileData, first_name: profileData.name });
      } else {
          console.warn("Impossible de charger le profil utilisateur.");
          setUserProfile({ id:'error-id', email:'error', name:'Investisseur', lastname:'', first_name: 'Investisseur' });
      }

      let watchlistTickers: string[] = [];
      if (watchlistRes.ok) {
        const watchlistItems: WatchlistItem[] = await watchlistRes.json();
        watchlistTickers = watchlistItems.map(item => item.stock_ticker);
      } else {
        console.warn("Impossible de charger la watchlist.");
      }

      if (historyRes.ok) {
          const historyData: PortfolioHistoryPoint[] = await historyRes.json();
          historyData.sort((a, b) => a.date.localeCompare(b.date));
          setPortfolioHistory(historyData);
      } else {
          console.warn("Impossible de charger l'historique du portefeuille.");
          setPortfolioHistory([]);
      }

      const tickersToFetch = new Set<string>();
      if (currentPortfolio) {
          currentPortfolio.positions.forEach(p => tickersToFetch.add(p.stock_ticker));
      }
      watchlistTickers.forEach(t => tickersToFetch.add(t));

      if (tickersToFetch.size > 0) {
            const stocksResponse = await fetch(`${API_BASE_URL}/stocks`);
            if (!stocksResponse.ok) throw new Error("Impossible de charger les données de marché.");
            const allStocks: Stock[] = await stocksResponse.json();
            const stockDataMap = allStocks.reduce((acc, stock) => { acc[stock.symbol] = stock; return acc; }, {} as { [key: string]: Stock });
            setStocksData(stockDataMap);
            const filteredWatchlistStocks = watchlistTickers.map(ticker => stockDataMap[ticker]).filter((stock): stock is Stock => !!stock);
            setWatchlistStocks(filteredWatchlistStocks);
      } else {
          setStocksData({});
          setWatchlistStocks([]);
      }
    } catch (err: any) {
      console.error("Erreur chargement données dashboard:", err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  async function createPortfolio() {
    setIsCreating(true);
    const toastId = toast.loading('Création...'); setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/portfolios/my`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({}) });
      if (!response.ok) { const d = await response.json(); throw new Error(d.message || 'Erreur création'); }
      toast.success('Portefeuille créé !', { id: toastId }); await loadUserData();
    } catch (err: any) { console.error("Erreur création:", err); toast.error(`Erreur : ${err.message}`, { id: toastId }); setError(err.message); }
    finally { setIsCreating(false); }
  }

  async function handleLogout() {
     try { await fetch(`${API_BASE_URL}/users/logout`, { method: 'POST', credentials: 'include' }); }
     catch (err) { console.error("Logout fetch error:", err); }
     finally { onNavigate('home'); }
  }

  async function handleSell() {
    if (!selectedPosition || !portfolio) return;
    const stockMarketData = stocksData[selectedPosition.stock_ticker];
    if (!stockMarketData) return toast.error("Données marché non trouvées.");
    setIsSelling(true);
    const toastId = toast.loading('Vente...'); setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/portfolios/my/sell`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ stockTicker: selectedPosition.stock_ticker, quantity: sellQuantity, pricePerShare: stockMarketData.current_price }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Erreur vente');
      toast.success('Vente réussie !', { id: toastId }); setSellModalOpen(false);
      // Reload data after successful sell
      await loadUserData();
    } catch (err: any) { console.error("Erreur vente:", err); toast.error(`Erreur : ${err.message}`, { id: toastId }); setError(err.message); }
    finally { setIsSelling(false); }
  }

  async function handleBuy() {
    if (!selectedStockToBuy || !portfolio || buyQuantity <= 0) return;

    setIsBuying(true);
    const toastId = toast.loading('Achat en cours...');
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/portfolios/my/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          stockTicker: selectedStockToBuy.symbol,
          quantity: buyQuantity,
          pricePerShare: selectedStockToBuy.current_price // Utilise le prix actuel affiché
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erreur lors de l'achat");
      }

      toast.success('Achat réussi !', { id: toastId });
      setBuyModalOpen(false);
      // Reload data after successful buy
      await loadUserData();

    } catch (err: any) {
      console.error("Erreur achat action:", err);
      toast.error(`Erreur : ${err.message}`, { id: toastId });
      setError(err.message);
    } finally {
      setIsBuying(false);
    }
}

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  }

  const positions = portfolio?.positions || [];
  const stocksValue = positions.reduce((acc, pos) => { const d = stocksData[pos.stock_ticker]; return d ? acc + (pos.quantity * d.current_price) : acc; }, 0);
  const totalPortfolioValue = portfolio ? portfolio.cash_balance + stocksValue : 0;

  if (loading) { return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>; }

  // --- General Error Display ---
  if (error && !portfolio) {
    return (
        <div className="flex items-center justify-center min-h-[60vh] text-center px-4">
           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Erreur!</strong>
                <span className="block sm:inline"> {error} - Veuillez rafraîchir ou vous reconnecter. </span>
                <button onClick={handleLogout} className="ml-4 px-2 py-1 bg-red-600 text-white text-xs rounded align-middle">Déconnexion</button>
           </div>
        </div>
    );
  }
  // --- END General Error Display ---

  // --- Main JSX ---
  return (
    <> {/* Fragment starts here */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bonjour, {userProfile?.name || 'Investisseur'} !</h1>
            <p className="text-gray-600">Bienvenue sur votre tableau de bord.</p>
          </div>
          <div className="flex items-center space-x-4">
             <button onClick={() => onNavigate('profile')} className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"><Settings className="w-5 h-5" /><span>Mon Profil</span></button>
             <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Déconnexion</button>
          </div>
        </div>

         {/* Inline Error Display */}
         {error && portfolio && (
             <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
               <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
               <p className="text-sm text-red-800">{error}</p>
               <button onClick={()=> setError(null)} className="ml-auto text-red-500 hover:text-red-700 text-lg font-bold">×</button>
             </div>
         )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (Portfolio Details) */}
          <div className="lg:col-span-2 space-y-8">
            {portfolio ? (
              <>
                {/* Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                   <div className="flex items-center space-x-3 mb-4"><ChartIcon className="w-6 h-6 text-indigo-600" /><h2 className="text-2xl font-bold text-gray-900">Évolution du Portefeuille</h2></div>
                   {portfolioHistory.length > 0 ? ( <div style={{ width: '100%', height: 300 }}><ResponsiveContainer><LineChart data={portfolioHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" /><XAxis dataKey="date" fontSize={12} tick={{ fill: '#6b7280' }} /><YAxis width={80} fontSize={12} tick={{ fill: '#6b7280' }} tickFormatter={(v) => new Intl.NumberFormat('fr-FR',{notation:'compact'}).format(v as number)}/><Tooltip contentStyle={{ borderRadius: '0.75rem', borderColor: '#e5e7eb' }} formatter={(v)=>[`${formatNumber(v as number)} FCFA`,'Valeur']}/><Legend wrapperStyle={{fontSize:"14px"}}/><Line type="monotone" dataKey="value" name="Valeur du portefeuille" stroke="#4f46e5" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div> ) : <p className="text-gray-500 text-center py-10">Données historique non disponibles.</p> }
                </div>
                {/* Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><div className="flex justify-between items-center mb-4"><div className="flex items-center space-x-3"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><Wallet className="w-6 h-6 text-blue-600" /></div><h2 className="text-2xl font-bold">{portfolio.name}</h2></div><button onClick={() => onNavigate('transactions')} className="text-sm font-semibold text-blue-600 hover:text-blue-800">Voir historique</button></div><div className="grid grid-cols-2 gap-6"><div className="bg-blue-50 rounded-lg p-4"><p className="text-sm text-gray-600 mb-2">Valeur Totale Estimée</p><p className="text-3xl font-bold">{formatNumber(totalPortfolioValue)} FCFA</p></div><div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-600 mb-2">Liquidités</p><p className="text-3xl font-bold">{formatNumber(portfolio.cash_balance)} FCFA</p></div></div></div>
                {/* Positions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><h3 className="text-xl font-bold text-gray-900 mb-4">Mes Positions</h3>{positions.length > 0 ? (<div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-500 uppercase bg-gray-50"><tr><th className="px-4 py-3">Action</th><th className="px-4 py-3 text-right">Quantité</th><th className="px-4 py-3 text-right">Prix Actuel</th><th className="px-4 py-3 text-right">Valeur</th><th className="px-4 py-3 text-right">P/L Estimé</th><th className="px-4 py-3 text-center">Action</th></tr></thead><tbody className="divide-y divide-gray-200">{positions.map(p => { const stockMarketData = stocksData[p.stock_ticker]; if (!stockMarketData) return (<tr key={p.id} className="opacity-50"><td className="px-4 py-4 font-bold">{p.stock_ticker}</td><td colSpan={5} className="px-4 py-4 text-center text-gray-500">Données marché non chargées...</td></tr>); const currentVal = p.quantity * stockMarketData.current_price; const buyVal = p.quantity * p.average_buy_price; const pnl = currentVal - buyVal; const pnlPercent = buyVal > 0 ? (pnl / buyVal) * 100 : 0; return (<tr key={p.id}><td className="px-4 py-4"><div className="font-bold">{stockMarketData.symbol}</div><div className="text-gray-600 text-xs">{stockMarketData.company_name}</div></td><td className="px-4 py-4 text-right">{formatNumber(p.quantity)}</td><td className="px-4 py-4 text-right">{formatNumber(stockMarketData.current_price)}</td><td className="px-4 py-4 text-right font-medium">{formatNumber(currentVal)}</td><td className="px-4 py-4 text-right"><div className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>{pnl >= 0 ? '+' : ''}{formatNumber(pnl)} FCFA</div><div className={`text-xs ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)</div></td><td className="px-4 py-4 text-center"><button onClick={() => { setSelectedPosition(p); setSellQuantity(1); setSellModalOpen(true); }} className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold hover:bg-red-200">Vendre</button></td></tr>); })}</tbody></table></div>) : (<div className="text-center py-8"><ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-4" /><h4 className="font-semibold">Aucune action détenue</h4><p className="text-gray-500 mt-2">Explorez les marchés pour acheter.</p><button onClick={() => onNavigate('markets')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Explorer Marchés</button></div>)}</div>
              </>
            ) : ( /* Create Portfolio Button */ <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center flex flex-col items-center"><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4"><Wallet className="w-8 h-8 text-blue-600" /></div><h2 className="text-xl font-semibold mb-2">Commencez simulation</h2><p className="text-gray-600 mb-6 max-w-sm">Créez un portefeuille virtuel gratuit.</p><button onClick={createPortfolio} disabled={isCreating} className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700">{isCreating ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div> : <PlusCircle className="w-5 h-5" />}<span>{isCreating ? 'Création...' : 'Créer portefeuille'}</span></button></div> )}
          </div>

          {/* Right Column (Watchlist) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4"><Eye className="w-6 h-6 text-purple-600" /><h3 className="text-xl font-bold">Ma Watchlist</h3></div>
            {watchlistStocks.length > 0 ? (
              <div className="space-y-3">
                {watchlistStocks.map(stock => (
                   <button key={stock.id} onClick={() => onNavigate('stock-detail', stock)} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                     <div><p className="font-bold text-sm">{stock.symbol}</p><p className="text-xs text-gray-500 line-clamp-1">{stock.company_name}</p></div>
                     <div className="text-right flex-shrink-0 pl-2"><p className="font-semibold text-sm">{formatNumber(stock.current_price)}</p><p className={`text-xs ${stock.daily_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{stock.daily_change_percent >= 0 ? '+' : ''}{stock.daily_change_percent.toFixed(2)}%</p></div>
                   </button>
                ))}
              </div>
            ) : (
                 <div className="text-center py-6"><Eye className="w-10 h-10 mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">Watchlist vide.</p></div>
             )}
          </div>
        </div> {/* End Main Grid */}
      </div> {/* End Main Container */}

      {/* Sell Modal */}
      {sellModalOpen && selectedPosition && stocksData[selectedPosition.stock_ticker] && ( <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Vendre {selectedPosition.stock_ticker}</h3><button onClick={() => setSellModalOpen(false)} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X className="w-5 h-5"/></button></div><div><p className="text-sm mb-2">Vous détenez : <span className="font-bold">{formatNumber(selectedPosition.quantity)}</span> actions.</p><label htmlFor="sellQuantity" className="block text-sm font-medium text-gray-700 mb-2">Quantité à vendre</label><input type="number" id="sellQuantity" value={sellQuantity} onChange={(e) => { const v = parseInt(e.target.value,10)||0; setSellQuantity(Math.max(1, Math.min(v, selectedPosition.quantity))); }} min="1" max={selectedPosition.quantity} step="1" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/></div><div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm"><div className="flex justify-between"><span>Prix actuel / action</span><span className="font-medium">{formatNumber(stocksData[selectedPosition.stock_ticker].current_price)} FCFA</span></div><div className="flex justify-between font-bold text-base"><span>Revenu estimé</span><span className="text-green-600">{formatNumber(sellQuantity * stocksData[selectedPosition.stock_ticker].current_price)} FCFA</span></div></div><div className="mt-6 flex gap-4"><button onClick={() => setSellModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Annuler</button><button onClick={handleSell} disabled={isSelling} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-red-700 transition-colors">{isSelling ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mx-auto"></div> : `Confirmer Vente`}</button></div></div></div> )}

      {/* Buy Modal */}
      {buyModalOpen && selectedStockToBuy && portfolio && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold">Acheter {selectedStockToBuy.symbol}</h3>
               <button onClick={() => setBuyModalOpen(false)} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"><X className="w-5 h-5"/></button>
             </div>
             <div>
               <label htmlFor="buyQuantity" className="block text-sm font-medium text-gray-700 mb-2">Quantité à acheter</label>
               <input type="number" id="buyQuantity" value={buyQuantity} onChange={(e) => setBuyQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))} min="1" step="1" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
             </div>
             <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
               <div className="flex justify-between"><span>Prix actuel / action</span><span className="font-medium">{formatNumber(selectedStockToBuy.current_price)} FCFA</span></div>
               <div className="flex justify-between"><span>Liquidités disponibles</span><span className="font-medium">{formatNumber(portfolio.cash_balance)} FCFA</span></div>
               <div className="flex justify-between font-bold text-base"><span>Coût total estimé</span><span className="text-red-600">{formatNumber(buyQuantity * selectedStockToBuy.current_price)} FCFA</span></div>
               {(buyQuantity * selectedStockToBuy.current_price > portfolio.cash_balance) && <p className="text-red-600 text-xs text-center pt-2">Fonds insuffisants.</p>}
             </div>
             <div className="mt-6 flex gap-4">
               <button onClick={() => setBuyModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Annuler</button>
               <button onClick={handleBuy} disabled={isBuying || (buyQuantity * selectedStockToBuy.current_price > portfolio.cash_balance)} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-green-700 transition-colors">{isBuying ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mx-auto"></div> : `Confirmer Achat`}</button>
             </div>
           </div>
         </div>
      )}
    </> // Fragment ends here
  ); // return ends here
} // Component ends here