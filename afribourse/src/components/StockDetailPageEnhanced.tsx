import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, AlertTriangle, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import { Stock, Portfolio, WatchlistItem } from '../types';

// Import des nouveaux composants
import StockChartNew from './stock/StockChartNew';
import {
  StockTabs,
  StockOverview,
  StockNews,
  StockFundamentals,
  StockAnalysis,
  TabId
} from './stock';
import { convertToOHLCVData } from '../utils/chartDataAdapter';
import type { TimeInterval } from '../types/chart.types';

// Import des hooks
import {
  useStockHistory,
  useStockFundamentals,
  useCompanyInfo,
  useStockNews
} from '../hooks/useStockDetails';
import { Period } from '../services/stockApi';

type StockDetailPageEnhancedProps = {
  stock: Stock;
  onNavigate: (page: string, data?: any) => void;
};

export default function StockDetailPageEnhanced({ stock, onNavigate }: StockDetailPageEnhancedProps) {
  // État local
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isTogglingWatchlist, setIsTogglingWatchlist] = useState(false);

  // État pour les onglets et période
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1Y');
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('1Y');

  // Hooks React Query pour charger les données
  const { data: historyData, isLoading: historyLoading } = useStockHistory(stock.symbol, selectedPeriod);
  const { data: fundamentals, isLoading: fundamentalsLoading } = useStockFundamentals(stock.symbol);
  const { data: companyInfo, isLoading: companyLoading } = useCompanyInfo(stock.symbol);
  const { data: newsData, isLoading: newsLoading } = useStockNews(stock.symbol, 10);

  // Vérification de l'existence du stock
  if (!stock) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-red-600">Stock non trouvé</p>
      </div>
    );
  }

  // Charger portfolio et watchlist status
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [portfolioRes, watchlistRes] = await Promise.all([
          fetch(`${API_BASE_URL}/portfolios/my`, { credentials: 'include' }),
          fetch(`${API_BASE_URL}/watchlist/my`, { credentials: 'include' })
        ]);

        // Portfolio
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
        } else if (portfolioRes.status === 401 || portfolioRes.status === 404) {
          setPortfolio(null);
        }

        // Watchlist
        if (watchlistRes.ok) {
          const watchlistItems: WatchlistItem[] = await watchlistRes.json();
          const found = watchlistItems.some(item => item.stock_ticker === stock.symbol);
          setIsInWatchlist(found);
        } else {
          setIsInWatchlist(false);
        }
      } catch (err: any) {
        console.error("Erreur chargement données:", err);
        setError("Impossible de charger certaines informations.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [stock.symbol]);

  // Handler pour le toggle watchlist
  async function handleToggleWatchlist() {
    setIsTogglingWatchlist(true);
    setError(null);
    const currentStatus = isInWatchlist;
    const url = `${API_BASE_URL}/watchlist/my${currentStatus ? `/${stock.symbol}` : ''}`;
    const method = currentStatus ? 'DELETE' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: currentStatus ? {} : { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: currentStatus ? null : JSON.stringify({ stockTicker: stock.symbol }),
      });

      if (response.status === 401) {
        toast.error("Veuillez vous connecter pour gérer la watchlist.");
        setIsTogglingWatchlist(false);
        return;
      }

      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur serveur watchlist');
      }

      const newStatus = !currentStatus;
      setIsInWatchlist(newStatus);
      toast.success(newStatus ? 'Action ajoutée à la watchlist !' : 'Action retirée de la watchlist.');
    } catch (err: any) {
      console.error("Erreur watchlist toggle:", err);
      toast.error(`Erreur : ${err.message}`);
    } finally {
      setIsTogglingWatchlist(false);
    }
  }

  // Handler pour l'achat
  async function handleBuy() {
    if (!portfolio) {
      return toast.error("Connectez-vous et créez un portefeuille pour acheter.");
    }
    const totalCost = quantity * stock.current_price;
    if (totalCost > portfolio.cash_balance) {
      return toast.error("Fonds insuffisants.");
    }

    setIsBuying(true);
    const toastId = toast.loading('Achat en cours...');
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/portfolios/my/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      setTimeout(() => onNavigate('dashboard'), 1500);
    } catch (error: any) {
      console.error("Erreur achat:", error);
      toast.error(`Erreur : ${error.message}`, { id: toastId });
      setError(error.message);
      setIsBuying(false);
    }
  }

  // Fonctions utilitaires
  function formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR').format(num);
  }

  const totalCost = quantity * stock.current_price;

  // Calcul des sentiments et signaux (gardé de l'ancienne version)
  function calculateMarketSentiment(): { score: number; label: string; color: string } {
    const changePercent = stock.daily_change_percent ?? 0;
    const volumeScore = (stock.volume ?? 0) > 30000 ? 1 : 0.5;
    const priceScore = changePercent >= 2 ? 2 : changePercent >= 0 ? 1 : changePercent >= -2 ? 0 : -1;
    const totalScore = (priceScore + volumeScore) / 3 * 100;

    if (totalScore >= 60) return { score: totalScore, label: 'Très Positif', color: 'green' };
    if (totalScore >= 30) return { score: totalScore, label: 'Positif', color: 'lime' };
    if (totalScore >= -30) return { score: totalScore, label: 'Neutre', color: 'yellow' };
    if (totalScore >= -60) return { score: totalScore, label: 'Négatif', color: 'orange' };
    return { score: totalScore, label: 'Très Négatif', color: 'red' };
  }

  function calculateTechnicalSignal(): { label: string; color: string; description: string } {
    const changePercent = stock.daily_change_percent ?? 0;
    const priceVsPrevious = (stock.previous_close ?? 0) > 0 ? stock.current_price / stock.previous_close : 1;

    if (changePercent >= 3 && priceVsPrevious > 1.025)
      return { label: 'Achat Fort', color: 'green', description: 'Forte tendance haussière' };
    if (changePercent >= 1 && priceVsPrevious > 1.01)
      return { label: 'Achat', color: 'lime', description: 'Tendance haussière modérée' };
    if (changePercent <= -3 && priceVsPrevious < 0.975)
      return { label: 'Vente Forte', color: 'red', description: 'Forte tendance baissière' };
    if (changePercent <= -1 && priceVsPrevious < 0.99)
      return { label: 'Vente', color: 'orange', description: 'Tendance baissière modérée' };
    return { label: 'Neutre', color: 'yellow', description: 'Pas de signal clair' };
  }

  const sentiment = calculateMarketSentiment();
  const technicalSignal = calculateTechnicalSignal();

  // Convertir TimeInterval en Period pour l'API
  const mapIntervalToPeriod = (interval: TimeInterval): Period => {
    const mapping: Record<TimeInterval, Period> = {
      '1D': '1M',
      '5D': '1M',
      '1M': '1M',
      '3M': '3M',
      '6M': '6M',
      '1Y': '1Y',
      'ALL': 'ALL',
    };
    return mapping[interval];
  };

  // Handler pour le changement d'intervalle
  const handleIntervalChange = (interval: TimeInterval) => {
    setSelectedInterval(interval);
    const newPeriod = mapIntervalToPeriod(interval);
    if (newPeriod !== selectedPeriod) {
      setSelectedPeriod(newPeriod);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Bouton retour */}
          <button
            onClick={() => onNavigate('markets')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour aux marchés</span>
          </button>

          {/* Informations de l'action */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{stock.symbol}</h1>
                {stock.sector && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {stock.sector}
                  </span>
                )}
                {/* Watchlist Button */}
                <button
                  onClick={handleToggleWatchlist}
                  disabled={isTogglingWatchlist}
                  className={`p-2 rounded-full hover:bg-yellow-100 transition-colors ${
                    isTogglingWatchlist ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isTogglingWatchlist ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                  ) : (
                    <Star
                      className={`w-5 h-5 ${
                        isInWatchlist ? 'text-yellow-500 fill-yellow-400' : 'text-gray-400 hover:text-yellow-500'
                      }`}
                    />
                  )}
                </button>
              </div>
              <h2 className="text-xl text-gray-700">{stock.company_name}</h2>
            </div>

            {/* Prix actuel */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 min-w-[280px]">
              <p className="text-sm text-gray-600 mb-2">Prix actuel</p>
              <p className="text-4xl font-bold text-gray-900 mb-4">{formatNumber(stock.current_price)} FCFA</p>
              <div
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-lg font-semibold ${
                  stock.daily_change_percent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {stock.daily_change_percent >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <span>
                  {stock.daily_change_percent >= 0 ? '+' : ''}
                  {stock.daily_change_percent?.toFixed(2) ?? '0.00'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <StockTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2">
            {/* Graphique (toujours visible) */}
            <div className="mb-8">
              {(() => {
                // Debug: vérifier les données avant conversion
                const rawData = historyData?.data || [];
                console.log('StockDetailPageEnhanced - Raw API data:', {
                  hasData: !!historyData,
                  dataLength: rawData.length,
                  firstItem: rawData[0],
                  lastItem: rawData[rawData.length - 1]
                });

                const convertedData = convertToOHLCVData(rawData.map(d => ({
                  date: d.date,
                  open: d.open,
                  high: d.high,
                  low: d.low,
                  close: d.close,
                  volume: d.volume
                })));

                console.log('StockDetailPageEnhanced - Converted data:', {
                  length: convertedData.length,
                  first: convertedData[0],
                  last: convertedData[convertedData.length - 1]
                });

                return (
                  <StockChartNew
                    symbol={stock.symbol}
                    data={convertedData}
                    onIntervalChange={handleIntervalChange}
                    currentInterval={selectedInterval}
                    isLoading={historyLoading}
                    theme="light"
                  />
                );
              })()}
            </div>

            {/* Indicateurs (toujours visibles) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Indicateurs de Décision</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Sentiment du Marché</h4>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      sentiment.color === 'green'
                        ? 'bg-green-100 text-green-800'
                        : sentiment.color === 'lime'
                        ? 'bg-lime-100 text-lime-800'
                        : sentiment.color === 'yellow'
                        ? 'bg-yellow-100 text-yellow-800'
                        : sentiment.color === 'orange'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {sentiment.label}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Signal Technique</h4>
                  <span
                    className={`px-4 py-2 rounded-lg text-sm font-semibold inline-block ${
                      technicalSignal.color === 'green'
                        ? 'bg-green-100 text-green-800'
                        : technicalSignal.color === 'lime'
                        ? 'bg-lime-100 text-lime-800'
                        : technicalSignal.color === 'yellow'
                        ? 'bg-yellow-100 text-yellow-800'
                        : technicalSignal.color === 'orange'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {technicalSignal.label}
                  </span>
                  <p className="text-xs text-gray-600 mt-2">{technicalSignal.description}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-6 border-t border-gray-100 pt-3">
                <strong>Note :</strong> Ces indicateurs sont générés automatiquement et ne constituent pas un conseil en
                investissement.
              </p>
            </div>

            {/* Contenu selon l'onglet actif */}
            {activeTab === 'overview' && <StockOverview stock={stock} companyInfo={companyInfo} />}
            {activeTab === 'analysis' && <StockAnalysis />}
            {activeTab === 'fundamentals' && (
              <StockFundamentals
                fundamentals={fundamentals}
                isLoading={fundamentalsLoading}
                symbol={stock.symbol}
              />
            )}
            {activeTab === 'news' && <StockNews news={newsData || []} isLoading={newsLoading} />}
          </div>

          {/* Colonne latérale - Panel d'ordre */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Ordre de Simulation</h3>

              {/* Cash balance */}
              {portfolio ? (
                <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Wallet className="w-5 h-5 text-gray-400" />
                    <span>Liquidités</span>
                  </div>
                  <span className="font-semibold text-gray-800">{formatNumber(portfolio.cash_balance)} FCFA</span>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <button onClick={() => onNavigate('login')} className="text-blue-600 font-semibold hover:underline">
                    Connectez-vous
                  </button>{' '}
                  pour simuler.
                </div>
              )}

              {/* Quantité */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  min="1"
                  step="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!portfolio}
                />
              </div>

              {/* Infos de prix */}
              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-gray-600">Prix / action</span>
                <span className="font-medium text-gray-800">{formatNumber(stock.current_price)} FCFA</span>
              </div>

              {/* Coût total */}
              <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-3 mt-2">
                <span className="text-gray-900">Coût Total</span>
                <span className="text-blue-600">{formatNumber(totalCost)} FCFA</span>
              </div>

              {/* Avertissement fonds insuffisants */}
              {portfolio && totalCost > portfolio.cash_balance && (
                <p className="text-red-600 text-xs text-center">Fonds insuffisants pour cet ordre.</p>
              )}

              {/* Erreur inline */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start space-x-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Bouton achat */}
              <button
                onClick={handleBuy}
                disabled={!portfolio || totalCost > (portfolio?.cash_balance ?? 0) || isBuying}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isBuying ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                ) : (
                  `Acheter ${quantity} action(s)`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
