import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, AlertTriangle, Star, Bell } from 'lucide-react';
import { apiFetch } from '../hooks/useApi';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import { Stock, Portfolio, WatchlistItem } from '../types';
import PriceAlertModal from './price-alerts/PriceAlertModal';
import PriceAlertList from './price-alerts/PriceAlertList';

// Import des nouveaux composants
import {
  StockChart,
  StockChartNew,
  StockTabs,
  StockOverview,
  StockNews,
  StockFundamentals,
  StockAnalysis,
  TabId
} from './stock';
import { convertToLightweightData } from '../utils/simpleLightweightAdapter';

// Import des hooks
import {
  useStockHistory,
  useStockFundamentals,
  useCompanyInfo,
  useStockNews
} from '../hooks/useStockDetails';
import { Period } from '../services/stockApi';

type StockDetailPageEnhancedProps = {};

export default function StockDetailPageEnhanced() {
  const { symbol } = useParams<{ symbol: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Récupérer le stock depuis le state ou depuis l'API
  const [stock, setStock] = useState<Stock | null>(location.state as Stock || null);
  // État local
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isTogglingWatchlist, setIsTogglingWatchlist] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // État pour les onglets et période
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1Y');

  // Hooks React Query pour charger les données - DOIVENT être appelés avant tout early return
  // IMPORTANT: Toujours utiliser symbol (du paramètre URL) pour éviter les violations des règles des hooks
  const { data: historyData, isLoading: historyLoading } = useStockHistory(symbol || '', selectedPeriod);
  const { data: fundamentals, isLoading: fundamentalsLoading } = useStockFundamentals(symbol || '');
  const { data: companyInfo, isLoading: companyLoading } = useCompanyInfo(symbol || '');
  const { data: newsData, isLoading: newsLoading } = useStockNews(symbol || '', 10);

  // Charger le stock depuis l'API si non disponible dans state
  useEffect(() => {
    async function loadStock() {
      if (!stock && symbol) {
        setLoading(true);
        try {
          const stockData = await apiFetch<Stock>(`/stocks/${symbol}`);
          setStock(stockData);
        } catch (err) {
          console.error("Erreur chargement stock:", err);
          setError("Impossible de charger les informations de l'action");
        } finally {
          setLoading(false);
        }
      } else {
        // Si le stock est déjà dans le state, on n'est plus en loading
        setLoading(false);
      }
    }

    // Appeler la fonction async sans retourner la promesse
    void loadStock();
  }, [symbol, stock]);

  // Charger portfolio et watchlist status
  useEffect(() => {
    // S'assurer qu'on a un stock avant de charger
    if (!stock) return;

    // Capturer la valeur de stock pour éviter les problèmes de null check
    const currentStock = stock;

    async function loadData() {
      // Ne pas remettre loading à true ici, sinon on affiche le spinner
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
          const found = watchlistItems.some(item => item.stock_ticker === currentStock.symbol);
          setIsInWatchlist(found);
        } else {
          setIsInWatchlist(false);
        }
      } catch (err: any) {
        console.error("Erreur chargement données:", err);
        setError("Impossible de charger certaines informations.");
      }
    }

    // Appeler la fonction async sans retourner la promesse
    void loadData();
  }, [stock?.symbol, symbol, stock]);

  // Préparer les données pour lightweight-charts (mémoïsées) - AVANT les early returns
  const lightweightData = React.useMemo(() => {
    if (!historyData?.data || historyData.data.length === 0) return [];
    return convertToLightweightData(historyData.data);
  }, [historyData?.data]);

  // Afficher un loader si le stock est en cours de chargement
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Afficher une erreur si le stock n'a pas pu être chargé
  if (!stock) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-semibold mb-2">Action introuvable</p>
          <p className="text-red-600">Impossible de charger les informations de l'action {symbol}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // Handler pour le toggle watchlist
  async function handleToggleWatchlist() {
    if (!stock) return;

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
    if (!stock) return;

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
      setTimeout(() => navigate('/dashboard'), 1500);
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

  const totalCost = stock ? quantity * stock.current_price : 0;

  // Calcul des sentiments et signaux (gardé de l'ancienne version)
  function calculateMarketSentiment(): { score: number; label: string; color: string } {
    if (!stock) return { score: 0, label: 'Neutre', color: 'yellow' };

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
    if (!stock) return { label: 'Neutre', color: 'yellow', description: 'Pas de données' };

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

  // État pour afficher/cacher le panneau d'ordre sur mobile
  const [showMobileOrder, setShowMobileOrder] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Bouton retour */}
          <button
            onClick={() => navigate('/markets')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm sm:text-base">Retour aux marchés</span>
          </button>

          {/* Informations de l'action */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Ligne 1: Symbole + Boutons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{stock.symbol}</h1>
                {stock.sector && (
                  <span className="hidden sm:inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {stock.sector}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Watchlist Button */}
                <button
                  onClick={handleToggleWatchlist}
                  disabled={isTogglingWatchlist}
                  className={`p-2 rounded-full hover:bg-yellow-100 transition-colors ${isTogglingWatchlist ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  title={isInWatchlist ? 'Retirer de la watchlist' : 'Ajouter à la watchlist'}
                >
                  {isTogglingWatchlist ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                  ) : (
                    <Star
                      className={`w-5 h-5 ${isInWatchlist ? 'text-yellow-500 fill-yellow-400' : 'text-gray-400 hover:text-yellow-500'
                        }`}
                    />
                  )}
                </button>
                {/* Price Alert Button */}
                <button
                  onClick={() => setIsAlertModalOpen(true)}
                  className="p-2 rounded-full hover:bg-orange-100 transition-colors"
                  title="Créer une alerte de prix"
                >
                  <Bell className="w-5 h-5 text-gray-400 hover:text-orange-600" />
                </button>
              </div>
            </div>

            {/* Ligne 2: Nom complet + Secteur mobile */}
            <div>
              <h2 className="text-lg sm:text-xl text-gray-700">{stock.company_name}</h2>
              {stock.sector && (
                <span className="sm:hidden inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {stock.sector}
                </span>
              )}
            </div>

            {/* Ligne 3: Prix actuel - Format mobile optimisé */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Prix actuel</p>
                  <p className="text-2xl sm:text-4xl font-bold text-gray-900">{formatNumber(stock.current_price)} <span className="text-base sm:text-xl">FCFA</span></p>
                </div>
                <div
                  className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-lg font-semibold ${stock.daily_change_percent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                >
                  {stock.daily_change_percent >= 0 ? <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                  <span>
                    {stock.daily_change_percent >= 0 ? '+' : ''}
                    {stock.daily_change_percent?.toFixed(2) ?? '0.00'}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <StockTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Graphique TradingView */}
            <div>
              {historyLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex justify-center items-center h-64 sm:h-96">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
                  </div>
                </div>
              ) : lightweightData.length > 0 ? (
                <StockChartNew
                  symbol={stock.symbol}
                  data={lightweightData}
                  isLoading={false}
                  theme="light"
                  onIntervalChange={(interval) => {
                    const periodMap: Record<string, Period> = {
                      '1D': '1D',
                      '5D': '5D',
                      '1W': '1W',
                      '1M': '1M',
                      '3M': '3M',
                      '6M': '6M',
                      '1Y': '1Y',
                      '5Y': '5Y',
                      'ALL': 'ALL'
                    };
                    setSelectedPeriod(periodMap[interval] || '1Y');
                  }}
                  currentInterval={
                    selectedPeriod === '1D' ? '1D' :
                      selectedPeriod === '5D' ? '5D' :
                        selectedPeriod === '1W' ? '1W' :
                          selectedPeriod === '1M' ? '1M' :
                            selectedPeriod === '3M' ? '3M' :
                              selectedPeriod === '6M' ? '6M' :
                                selectedPeriod === '1Y' ? '1Y' :
                                  selectedPeriod === '5Y' ? '5Y' :
                                    'ALL'
                  }
                />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex flex-col justify-center items-center h-64 sm:h-96 text-gray-500">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-base sm:text-lg font-medium mb-2">Données de graphique indisponibles</p>
                    <p className="text-xs sm:text-sm text-center max-w-md px-4">
                      Les données historiques pour cette action ne sont pas disponibles pour le moment.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Indicateurs (toujours visibles) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Indicateurs de Décision</h3>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Sentiment du Marché</h4>
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${sentiment.color === 'green'
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
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Signal Technique</h4>
                  <span
                    className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold inline-block ${technicalSignal.color === 'green'
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
                  <p className="text-xs text-gray-600 mt-1 sm:mt-2 hidden sm:block">{technicalSignal.description}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 sm:mt-6 border-t border-gray-100 pt-3">
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

          {/* Colonne latérale - Panel d'ordre (DESKTOP ONLY) */}
          <div className="hidden lg:block lg:col-span-1">
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
                  <button onClick={() => navigate('/login')} className="text-blue-600 font-semibold hover:underline">
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

            {/* Price Alerts List */}
            <div className="mt-6">
              <PriceAlertList
                stockTicker={stock.symbol}
                currentPrice={stock.current_price}
                companyName={stock.company_name}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOBILE: Fixed Bottom Bar ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Prix actuel</p>
            <p className="text-lg font-bold text-gray-900">{formatNumber(stock.current_price)} F</p>
          </div>
          <button
            onClick={() => setShowMobileOrder(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            {portfolio ? 'Acheter' : 'Se connecter'}
          </button>
        </div>
      </div>

      {/* ===== MOBILE: Order Modal ===== */}
      {showMobileOrder && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileOrder(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full bg-white rounded-t-2xl p-6 pb-8 max-h-[80vh] overflow-y-auto animate-slide-up">
            {/* Handle */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            <h3 className="text-xl font-bold text-gray-900 mb-4">Ordre de Simulation</h3>

            {/* Cash balance */}
            {portfolio ? (
              <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Wallet className="w-5 h-5 text-gray-400" />
                  <span>Liquidités</span>
                </div>
                <span className="font-semibold text-gray-800">{formatNumber(portfolio.cash_balance)} FCFA</span>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <button
                  onClick={() => {
                    setShowMobileOrder(false);
                    navigate('/login');
                  }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Connectez-vous
                </button>{' '}
                pour simuler des achats.
              </div>
            )}

            {portfolio && (
              <>
                {/* Quantité */}
                <div className="mb-4">
                  <label htmlFor="quantity-mobile" className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-lg text-xl font-bold text-gray-600 hover:bg-gray-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      id="quantity-mobile"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      min="1"
                      step="1"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-semibold"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-lg text-xl font-bold text-gray-600 hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Récapitulatif */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Prix / action</span>
                    <span className="font-medium text-gray-800">{formatNumber(stock.current_price)} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Quantité</span>
                    <span className="font-medium text-gray-800">{quantity}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                    <span className="text-gray-900">Total</span>
                    <span className="text-blue-600">{formatNumber(totalCost)} FCFA</span>
                  </div>
                </div>

                {/* Avertissement fonds insuffisants */}
                {totalCost > portfolio.cash_balance && (
                  <p className="text-red-600 text-sm text-center mb-4 bg-red-50 p-2 rounded-lg">
                    ⚠️ Fonds insuffisants pour cet ordre.
                  </p>
                )}

                {/* Erreur inline */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2 text-sm mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                {/* Boutons action */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMobileOrder(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      handleBuy();
                      setShowMobileOrder(false);
                    }}
                    disabled={totalCost > portfolio.cash_balance || isBuying}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isBuying ? 'Achat...' : 'Confirmer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Price Alert Modal */}
      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        stockTicker={stock.symbol}
        currentPrice={stock.current_price}
        companyName={stock.company_name}
      />
    </div>
  );
}

