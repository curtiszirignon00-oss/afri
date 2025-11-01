// src/components/DashboardPage.tsx - VERSION MIGRÉE
import { useEffect, useState } from 'react';
import { Settings, Wallet, PlusCircle, X, Eye, LineChart as ChartIcon, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Stock, UserProfile, WatchlistItem } from '../types';
import { usePortfolio } from '../hooks/usePortfolio';
import { useBuyStock, useSellStock } from '../hooks/useApi';
import { Button, Card, Input, LoadingSpinner, ErrorMessage } from './ui';

type DashboardPageProps = {
  onNavigate: (page: string, data?: any) => void;
};

const API_BASE_URL = 'http://localhost:3000/api';

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  // ✅ React Query: Hook personnalisé pour le portfolio
  const { 
    portfolio, 
    stocksData, 
    portfolioHistory, 
    loading: portfolioLoading,
    error: portfolioError,
    refetch: reloadPortfolio,
    createPortfolio,
    calculateTotalValue
  } = usePortfolio();

  // ✅ React Query: Hooks pour achat/vente
  const buyStock = useBuyStock();
  const sellStock = useSellStock();

  // États locaux
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les modals
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<any>(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedStockToBuy, setSelectedStockToBuy] = useState<Stock | null>(null);
  const [buyQuantity, setBuyQuantity] = useState(1);

  useEffect(() => {
    loadUserData();
  }, [stocksData]);

  async function loadUserData() {
    setLoading(true);
    setError(null);

    try {
      const [profileRes, watchlistRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/watchlist/my`, { credentials: 'include' })
      ]);

      if ([profileRes, watchlistRes].some(res => res.status === 401)) {
        onNavigate('login');
        return;
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserProfile({ ...profileData, first_name: profileData.name });
      }

      let watchlistTickers: string[] = [];
      if (watchlistRes.ok) {
        const watchlistItems: WatchlistItem[] = await watchlistRes.json();
        watchlistTickers = watchlistItems.map(item => item.stock_ticker);
      }

      if (watchlistTickers.length > 0 && Object.keys(stocksData).length > 0) {
        const filtered = watchlistTickers
          .map(ticker => stocksData[ticker])
          .filter((stock): stock is Stock => !!stock);
        setWatchlistStocks(filtered);
      }
    } catch (err: any) {
      console.error("Erreur chargement données dashboard:", err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Vente avec React Query mutation
  async function handleSell() {
    if (!selectedPosition || !portfolio) return;
    const stockMarketData = stocksData[selectedPosition.stock_ticker];
    if (!stockMarketData) return;
    
    try {
      await sellStock.mutateAsync({
        stockTicker: selectedPosition.stock_ticker,
        quantity: sellQuantity
      });
      
      setSellModalOpen(false);
      await reloadPortfolio();
    } catch (err) {
      console.error('Erreur vente:', err);
    }
  }

  // ✅ Achat avec React Query mutation
  async function handleBuy() {
    if (!selectedStockToBuy || !portfolio) return;
    
    try {
      await buyStock.mutateAsync({
        stockTicker: selectedStockToBuy.symbol,
        quantity: buyQuantity
      });
      
      setBuyModalOpen(false);
      await reloadPortfolio();
    } catch (err) {
      console.error('Erreur achat:', err);
    }
  }

  function formatNumber(num: number | null | undefined): string {
    if (num == null) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  }

  // ✅ Loading avec LoadingSpinner component
  if (loading || portfolioLoading) {
    return <LoadingSpinner fullScreen text="Chargement du dashboard..." />;
  }

  // ✅ Error avec ErrorMessage component
  if (portfolioError && !portfolio) {
    return (
      <ErrorMessage
        fullScreen
        message="Impossible de charger votre portfolio"
        onRetry={reloadPortfolio}
      />
    );
  }

  // Pas de portfolio: afficher formulaire de création
  if (!portfolio) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        {/* ✅ Card remplace div bg-white */}
        <Card className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Créez votre Portfolio</h2>
          <p className="text-gray-600 mb-6">
            Commencez votre simulation d'investissement dès maintenant.
          </p>
          {/* ✅ Button remplace button manuel */}
          <Button
            variant="primary"
            size="lg"
            onClick={createPortfolio}
            isLoading={portfolioLoading}
          >
            {!portfolioLoading && <PlusCircle className="w-5 h-5 mr-2" />}
            {portfolioLoading ? 'Création...' : 'Créer mon portfolio'}
          </Button>
        </Card>
      </div>
    );
  }

  const totalValue = calculateTotalValue();
  const initialBalance = portfolio.initial_balance || 0;
  const totalGainLoss = totalValue - initialBalance;
  const totalGainLossPercent = initialBalance > 0 ? (totalGainLoss / initialBalance) * 100 : 0;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bonjour, {userProfile?.name || 'Investisseur'} !
            </h1>
            <p className="text-gray-600">Bienvenue sur votre tableau de bord.</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* ✅ Button remplace button manuel */}
            <Button
              variant="secondary"
              onClick={() => onNavigate('profile')}
            >
              <Settings className="w-5 h-5 mr-2" />
              Mon Profil
            </Button>
          </div>
        </div>

        {/* Inline Error Display */}
        {error && (
          <Card variant="bordered" className="mb-4 border-red-200 bg-red-50">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 text-lg font-bold"
              >
                ×
              </button>
            </div>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Chart */}
            {/* ✅ Card remplace div bg-white */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <ChartIcon className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">Évolution du Portefeuille</h2>
              </div>
              {portfolioHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={portfolioHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total_value" stroke="#3b82f6" strokeWidth={2} name="Valeur" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucune donnée d'historique disponible.</p>
              )}
            </Card>

            {/* Résumé Portfolio */}
            <Card>
              <h3 className="text-xl font-bold mb-4">Résumé du Portefeuille</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Liquidités</p>
                  <p className="text-xl font-bold text-gray-900">{formatNumber(portfolio.cash_balance)} F</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Valeur Totale</p>
                  <p className="text-xl font-bold text-gray-900">{formatNumber(totalValue)} F</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Gain/Perte</p>
                  <p className={`text-xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalGainLoss >= 0 ? '+' : ''}{formatNumber(totalGainLoss)} F
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Performance</p>
                  <p className={`text-xl font-bold ${totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </Card>

            {/* Positions */}
            <Card>
              <h3 className="text-xl font-bold mb-4">Mes Positions</h3>
              {portfolio.positions && portfolio.positions.length > 0 ? (
                <div className="space-y-3">
                  {portfolio.positions.map((position, idx) => {
                    const stockData = stocksData[position.stock_ticker];
                    if (!stockData) return null;
                    const currentValue = position.quantity * stockData.current_price;
                    const costBasis = position.quantity * position.average_buy_price;
                    const gainLoss = currentValue - costBasis;
                    const gainLossPercent = (gainLoss / costBasis) * 100;

                    return (
                      <Card key={idx} variant="default" hoverable>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                              {stockData.logo_url ? (
                                <img src={stockData.logo_url} alt={stockData.symbol} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                stockData.symbol.substring(0, 2)
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-lg">{position.stock_ticker}</p>
                              <p className="text-sm text-gray-500">{position.quantity} actions</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">{formatNumber(currentValue)} F</p>
                            <p className={`text-sm ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {gainLoss >= 0 ? '+' : ''}{formatNumber(gainLoss)} F ({gainLossPercent.toFixed(2)}%)
                            </p>
                          </div>
                          {/* ✅ Button remplace button manuel */}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setSelectedPosition(position);
                              setSellQuantity(1);
                              setSellModalOpen(true);
                            }}
                          >
                            Vendre
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucune position.</p>
              )}
            </Card>
          </div>

          {/* Right Column (Watchlist) */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <Eye className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold">Ma Watchlist</h3>
            </div>
            {watchlistStocks.length > 0 ? (
              <div className="space-y-3">
                {watchlistStocks.map(stock => (
                  <button
                    key={stock.id}
                    onClick={() => onNavigate('stock-detail', stock)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-sm">{stock.symbol}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{stock.company_name}</p>
                    </div>
                    <div className="text-right flex-shrink-0 pl-2">
                      <p className="font-semibold text-sm">{formatNumber(stock.current_price)}</p>
                      <p className={`text-xs ${stock.daily_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.daily_change_percent >= 0 ? '+' : ''}{stock.daily_change_percent.toFixed(2)}%
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Eye className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Watchlist vide.</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Sell Modal */}
      {sellModalOpen && selectedPosition && stocksData[selectedPosition.stock_ticker] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* ✅ Card remplace div bg-white */}
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Vendre {selectedPosition.stock_ticker}</h3>
              <button
                onClick={() => setSellModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm">
                Vous détenez : <span className="font-bold">{formatNumber(selectedPosition.quantity)}</span> actions.
              </p>
              {/* ✅ Input remplace input manuel */}
              <Input
                type="number"
                label="Quantité à vendre"
                value={sellQuantity}
                onChange={(e) => setSellQuantity(Math.max(1, Math.min(Number(e.target.value), selectedPosition.quantity)))}
                min={1}
                max={selectedPosition.quantity}
              />
              <div className="flex space-x-3">
                {/* ✅ Button remplace button manuel */}
                <Button variant="secondary" onClick={() => setSellModalOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={handleSell}
                  isLoading={sellStock.isPending}
                  disabled={sellStock.isPending}
                  className="flex-1"
                >
                  {sellStock.isPending ? 'Vente...' : 'Confirmer'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Buy Modal */}
      {buyModalOpen && selectedStockToBuy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Acheter {selectedStockToBuy.symbol}</h3>
              <button
                onClick={() => setBuyModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm">
                Prix actuel : <span className="font-bold">{formatNumber(selectedStockToBuy.current_price)} F</span>
              </p>
              <Input
                type="number"
                label="Quantité à acheter"
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(Math.max(1, Number(e.target.value)))}
                min={1}
              />
              <div className="flex space-x-3">
                <Button variant="secondary" onClick={() => setBuyModalOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleBuy}
                  isLoading={buyStock.isPending}
                  disabled={buyStock.isPending}
                  className="flex-1"
                >
                  {buyStock.isPending ? 'Achat...' : 'Confirmer'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}