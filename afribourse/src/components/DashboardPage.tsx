// src/components/DashboardPage.tsx - VERSION AMÉLIORÉE
import { useEffect, useState } from 'react';
import { Settings, Wallet, PlusCircle, X, Eye, LineChart as ChartIcon, AlertCircle, TrendingUp, TrendingDown, Activity, PieChart as PieChartIcon, BarChart3, ExternalLink, Clock } from 'lucide-react'; // <-- AJOUT: Nouvelles icônes
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'; // <-- AJOUT: PieChart pour allocation
import { Stock, UserProfile, WatchlistItem, Transaction, MarketIndex } from '../types'; // <-- AJOUT: Transaction et MarketIndex
import { usePortfolio } from '../hooks/usePortfolio';
import { useBuyStock, useSellStock, apiFetch } from '../hooks/useApi';
import { Button, Card, Input, LoadingSpinner, ErrorMessage } from './ui';
import { API_BASE_URL } from '../config/api';

type DashboardPageProps = {};

// <-- AJOUT: Couleurs pour le graphique d'allocation
const ALLOCATION_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// <-- AJOUT: Type pour les filtres de temps du graphique
type TimeFilter = '1W' | '1M' | '3M' | '6M' | '1Y' | 'MAX';

export default function DashboardPage() {
  const navigate = useNavigate();
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
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]); // <-- AJOUT: Transactions récentes
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]); // <-- AJOUT: Indices du marché
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // <-- AJOUT: État pour le filtre de temps du graphique
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('MAX');
  
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

  // Valider les calculs quand le portfolio ou les données des stocks changent
  useEffect(() => {
    if (portfolio && Object.keys(stocksData).length > 0 && portfolioHistory.length > 0) {
      validateCalculations();
    }
  }, [portfolio, stocksData, portfolioHistory]);

  async function loadUserData() {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 [DASHBOARD] Loading user data...');

      // Utiliser apiFetch qui ajoute automatiquement le token sur mobile
      const [profileData, watchlistItems, transactionsData, indicesData] = await Promise.all([
        apiFetch<any>('/users/me').catch(err => {
          console.error('Profile fetch error:', err);
          if (err.message.includes('401') || err.message.includes('Unauthorized')) {
            navigate('/login');
            throw err;
          }
          return null;
        }),
        apiFetch<WatchlistItem[]>('/watchlist/my').catch(err => {
          console.warn('Watchlist fetch error:', err);
          return [];
        }),
        apiFetch<Transaction[]>('/portfolios/my/transactions').catch(err => {
          console.warn('Transactions fetch error:', err);
          return [];
        }),
        apiFetch<MarketIndex[]>('/indices/latest').catch(err => {
          console.warn('Indices fetch error:', err);
          return [];
        })
      ]);

      console.log('✅ [DASHBOARD] Data loaded successfully');

      if (profileData) {
        setUserProfile({ ...profileData, first_name: profileData.name });
      }

      const watchlistTickers = watchlistItems.map(item => item.stock_ticker);
      if (watchlistTickers.length > 0 && Object.keys(stocksData).length > 0) {
        const filtered = watchlistTickers
          .map(ticker => stocksData[ticker])
          .filter((stock): stock is Stock => !!stock);
        setWatchlistStocks(filtered);
      }

      setRecentTransactions(transactionsData.slice(0, 5)); // Les 5 dernières
      setMarketIndices(indicesData);

    } catch (err: any) {
      console.error("❌ [DASHBOARD] Error loading data:", err);
      // Ne pas définir d'erreur si on a déjà redirigé vers login
      if (!err.message?.includes('401')) {
        setError(err.message || "Une erreur est survenue.");
      }
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
        quantity: sellQuantity,
        pricePerShare: stockMarketData.current_price
      });

      setSellModalOpen(false);
      await reloadPortfolio();
      await loadUserData(); // <-- AJOUT: Recharger les transactions
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
        quantity: buyQuantity,
        pricePerShare: selectedStockToBuy.current_price
      });

      setBuyModalOpen(false);
      await reloadPortfolio();
      await loadUserData(); // <-- AJOUT: Recharger les transactions
    } catch (err) {
      console.error('Erreur achat:', err);
    }
  }

  function formatNumber(num: number | null | undefined): string {
    if (num == null) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  }

  // <-- AJOUT: Fonction pour formater les dates
  function formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // <-- AJOUT: Fonction pour filtrer l'historique selon le filtre de temps
  function getFilteredHistory() {
    if (!portfolioHistory.length) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch (timeFilter) {
      case '1W':
        startDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'MAX':
        return portfolioHistory;
    }
    
    return portfolioHistory.filter(point => new Date(point.date) >= startDate);
  }

  // <-- AJOUT: Calculer la performance du jour (amélioré)
  function calculateDailyPerformance(): { value: number; percent: number } {
    if (portfolioHistory.length < 2) return { value: 0, percent: 0 };

    const today = portfolioHistory[portfolioHistory.length - 1];

    // Chercher le point d'hier (ou le dernier point avant aujourd'hui)
    const todayDate = new Date(today.date);
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    // Trouver le point le plus proche d'hier (en remontant dans le temps)
    let previousPoint = portfolioHistory[portfolioHistory.length - 2];
    for (let i = portfolioHistory.length - 2; i >= 0; i--) {
      const pointDate = new Date(portfolioHistory[i].date);
      if (pointDate < todayDate) {
        previousPoint = portfolioHistory[i];
        break;
      }
    }

    const dailyChange = today.value - previousPoint.value;
    const dailyChangePercent = previousPoint.value > 0
      ? (dailyChange / previousPoint.value) * 100
      : 0;

    return { value: dailyChange, percent: dailyChangePercent };
  }

  // <-- AJOUT: Calculer la meilleure et la pire performance journalière
  function getBestWorstPerformance(): {
    best: { date: string; value: number; percent: number } | null;
    worst: { date: string; value: number; percent: number } | null;
  } {
    if (portfolioHistory.length < 2) {
      return { best: null, worst: null };
    }

    const dailyChanges: { date: string; value: number; percent: number }[] = [];

    for (let i = 1; i < portfolioHistory.length; i++) {
      const today = portfolioHistory[i];
      const yesterday = portfolioHistory[i - 1];
      const change = today.value - yesterday.value;
      const percent = yesterday.value > 0 ? (change / yesterday.value) * 100 : 0;

      dailyChanges.push({
        date: today.date,
        value: change,
        percent: percent
      });
    }

    if (dailyChanges.length === 0) {
      return { best: null, worst: null };
    }

    const best = dailyChanges.reduce((max, curr) =>
      curr.percent > max.percent ? curr : max
    );
    const worst = dailyChanges.reduce((min, curr) =>
      curr.percent < min.percent ? curr : min
    );

    return { best, worst };
  }

  // <-- AJOUT: Valider la cohérence des calculs (pour debug)
  function validateCalculations() {
    if (!portfolio) return;

    const totalValue = calculateTotalValue();
    const stocksValue = portfolio.positions.reduce((acc, pos) => {
      const stock = stocksData[pos.stock_ticker];
      return stock ? acc + (pos.quantity * stock.current_price) : acc;
    }, 0);
    const cashBalance = portfolio.cash_balance;

    // Vérification 1 : Valeur totale = liquidités + valeur actions
    const calculatedTotal = cashBalance + stocksValue;
    if (Math.abs(calculatedTotal - totalValue) > 0.01) {
      console.warn('⚠️ Incohérence: Valeur totale', {
        totalValue,
        calculatedTotal,
        difference: calculatedTotal - totalValue
      });
    }

    // Vérification 2 : Allocation totale = 100%
    const allocationData = getAllocationData();
    const totalAllocation = allocationData.reduce((sum, item) => sum + item.percent, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      console.warn('⚠️ Incohérence: Allocation totale', {
        totalAllocation,
        expected: 100,
        difference: totalAllocation - 100
      });
    }

    // Vérification 3 : Gain/Perte = Valeur actuelle - Solde initial
    const initialBalance = portfolio.initial_balance || 0;
    const totalGainLoss = totalValue - initialBalance;
    const calculatedGainLoss = cashBalance + stocksValue - initialBalance;
    if (Math.abs(totalGainLoss - calculatedGainLoss) > 0.01) {
      console.warn('⚠️ Incohérence: Gain/Perte', {
        totalGainLoss,
        calculatedGainLoss,
        difference: totalGainLoss - calculatedGainLoss
      });
    }

    console.log('✅ Validation des calculs:', {
      totalValue,
      cashBalance,
      stocksValue,
      totalAllocation: totalAllocation.toFixed(2) + '%',
      totalGainLoss
    });
  }

  // <-- AJOUT: Préparer les données pour le graphique d'allocation
  function getAllocationData() {
    if (!portfolio) return [];

    const totalValue = calculateTotalValue();
    const data: { name: string; value: number; percent: number }[] = [];

    // Ajouter les positions
    portfolio.positions.forEach(position => {
      const stock = stocksData[position.stock_ticker];
      if (stock) {
        const value = position.quantity * stock.current_price;
        data.push({
          name: position.stock_ticker,
          value,
          percent: (value / totalValue) * 100
        });
      }
    });
    
    // Ajouter les liquidités
    if (portfolio.cash_balance > 0) {
      data.push({
        name: 'Liquidités',
        value: portfolio.cash_balance,
        percent: (portfolio.cash_balance / totalValue) * 100
      });
    }
    
    return data.sort((a, b) => b.value - a.value);
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
        <Card className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Créez votre Portfolio</h2>
          <p className="text-gray-600 mb-6">
            Commencez votre simulation d'investissement dès maintenant.
          </p>
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
  const dailyPerf = calculateDailyPerformance(); // <-- AJOUT
  const allocationData = getAllocationData(); // <-- AJOUT
  const filteredHistory = getFilteredHistory(); // <-- AJOUT
  const stocksValue = totalValue - portfolio.cash_balance; // <-- AJOUT: Valeur des actions

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
            <Button
              variant="secondary"
              onClick={() => navigate('/profile')}
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

        {/* <-- NOUVEAU: Vue d'Ensemble - Le Solde Principal */}
        <Card className="mb-8 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* KPI Principal */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-2">
                <Wallet className="w-5 h-5 text-blue-200" />
                <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Valeur Totale du Portefeuille</p>
              </div>
              <h2 className="text-5xl font-extrabold mb-4">{formatNumber(totalValue)} FCFA</h2>
              
              {/* Performance Totale */}
              <div className="flex items-center space-x-6 mb-4">
                <div className="flex items-center space-x-2">
                  {totalGainLoss >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-300" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-300" />
                  )}
                  <span className={`text-lg font-semibold ${totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {totalGainLoss >= 0 ? '+' : ''}{formatNumber(totalGainLoss)} FCFA
                  </span>
                  <span className={`text-sm ${totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    ({totalGainLoss >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* <-- AJOUT: Performance du Jour */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 inline-flex items-center space-x-3">
                <Activity className="w-5 h-5 text-blue-200" />
                <div>
                  <p className="text-xs text-blue-200 mb-0.5">Aujourd'hui</p>
                  <p className={`text-lg font-bold ${dailyPerf.value >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {dailyPerf.value >= 0 ? '+' : ''}{formatNumber(dailyPerf.value)} FCFA
                    <span className="text-sm ml-2">
                      ({dailyPerf.percent >= 0 ? '+' : ''}{dailyPerf.percent.toFixed(2)}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* <-- AJOUT: KPIs Secondaires */}
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-blue-100 mb-1">💰 Liquidités</p>
                <p className="text-2xl font-bold">{formatNumber(portfolio.cash_balance)} FCFA</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-blue-100 mb-1">📊 Valeur des Actions</p>
                <p className="text-2xl font-bold">{formatNumber(stocksValue)} FCFA</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* <-- CORRECTION: Graphique d'Évolution avec Filtres de Temps */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <ChartIcon className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Évolution du Portefeuille</h2>
                </div>
                
                {/* <-- AJOUT: Filtres de temps */}
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                  {(['1W', '1M', '3M', '6M', '1Y', 'MAX'] as TimeFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        timeFilter === filter
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              
              {filteredHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={filteredHistory}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${(value / 1000)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${formatNumber(value)} FCFA`, 'Valeur']}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                      fill="url(#colorValue)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80 text-gray-500">
                  <div className="text-center">
                    <ChartIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucune donnée d'historique disponible.</p>
                  </div>
                </div>
              )}
            </Card>

            {/* <-- CORRECTION: Mes Positions avec Bouton Vendre et Colonnes Améliorées */}
            <Card>
              <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span>Mes Positions</span>
              </h3>
              
              {portfolio.positions && portfolio.positions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Action</th>
                        <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">Quantité</th>
                        <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">P.R.U.</th>
                        <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">Prix Actuel</th>
                        <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">Valeur</th>
                        <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600">P/L</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.positions.map((position, idx) => {
                        const stockData = stocksData[position.stock_ticker];
                        if (!stockData) return null;
                        
                        const currentValue = position.quantity * stockData.current_price;
                        const costBasis = position.quantity * position.average_buy_price;
                        const gainLoss = currentValue - costBasis;
                        const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

                        return (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-2">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                  {stockData.logo_url ? (
                                    <img src={stockData.logo_url} alt={stockData.symbol} className="w-full h-full object-cover rounded-lg" />
                                  ) : (
                                    stockData.symbol.substring(0, 2)
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900">{position.stock_ticker}</p>
                                  <p className="text-xs text-gray-500">{stockData.company_name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-right font-medium text-gray-700">{position.quantity}</td>
                            <td className="py-4 px-2 text-right text-gray-700">{formatNumber(position.average_buy_price)} F</td>
                            <td className="py-4 px-2 text-right font-semibold text-gray-900">{formatNumber(stockData.current_price)} F</td>
                            <td className="py-4 px-2 text-right font-bold text-gray-900">{formatNumber(currentValue)} F</td>
                            <td className="py-4 px-2 text-right">
                              <div className="flex flex-col items-end">
                                <span className={`font-bold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {gainLoss >= 0 ? '+' : ''}{formatNumber(gainLoss)} F
                                </span>
                                <span className={`text-xs ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ({gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-center">
                              {/* <-- AJOUT: Bouton Vendre dans le tableau */}
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
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Vous n'avez aucune position actuellement.</p>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => navigate('/markets')}
                    className="mt-4"
                  >
                    Explorer le Marché
                  </Button>
                </div>
              )}
            </Card>

            {/* <-- AJOUT: Historique des Transactions Récentes */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <span>Historique Récent</span>
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/transactions')}
                >
                  Voir Tout
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {recentTransactions.length > 0 ? (
                <div className="space-y-2">
                  {recentTransactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === 'BUY' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'BUY' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {transaction.type === 'BUY' ? 'Achat' : 'Vente'} - {transaction.stock_ticker}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {transaction.quantity} × {formatNumber(transaction.price_per_share)} F
                        </p>
                        <p className={`text-sm font-semibold ${
                          transaction.type === 'BUY' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'BUY' ? '-' : '+'}{formatNumber(transaction.quantity * transaction.price_per_share)} F
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune transaction récente.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            
            {/* <-- AJOUT: Allocation du Portefeuille (Donut Chart) */}
            <Card>
              <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <PieChartIcon className="w-5 h-5 text-indigo-600" />
                <span>Allocation</span>
              </h3>
              
              {allocationData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `${formatNumber(value)} FCFA`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-2 mt-4">
                    {allocationData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] }}
                          ></div>
                          <span className="text-sm font-medium text-gray-700">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{item.percent.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <PieChartIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune donnée d'allocation.</p>
                </div>
              )}
            </Card>

            {/* <-- AJOUT: Aperçu du Marché */}
            <Card>
              <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <span>Aperçu du Marché</span>
              </h3>
              
              {marketIndices.length > 0 ? (
                <div className="space-y-3">
                  {marketIndices.map((index) => (
                    <div key={index.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-700">{index.index_name}</p>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          index.daily_change_percent >= 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {index.daily_change_percent >= 0 ? '+' : ''}{index.daily_change_percent.toFixed(2)}%
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(index.index_value)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune donnée d'indice disponible.</p>
                </div>
              )}
            </Card>

            {/* <-- CORRECTION: Ma Watchlist avec Bouton Acheter Rapide */}
            <Card>
              <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                <span>Ma Watchlist</span>
              </h3>
              
              {watchlistStocks.length > 0 ? (
                <div className="space-y-3">
                  {watchlistStocks.map((stock) => (
                    <div 
                      key={stock.id} 
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                            {stock.logo_url ? (
                              <img src={stock.logo_url} alt={stock.symbol} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              stock.symbol.substring(0, 2)
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{stock.symbol}</p>
                            <p className="text-xs text-gray-500">{stock.company_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatNumber(stock.current_price)} F</p>
                          <p className={`text-xs font-semibold ${
                            stock.daily_change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stock.daily_change_percent >= 0 ? '+' : ''}{stock.daily_change_percent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      {/* <-- AJOUT: Bouton Acheter Rapide */}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStockToBuy(stock);
                          setBuyQuantity(1);
                          setBuyModalOpen(true);
                        }}
                        className="w-full"
                      >
                        Acheter
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm mb-3">Aucune action dans votre watchlist.</p>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => navigate('/markets')}
                  >
                    Ajouter des Actions
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Vente */}
      {sellModalOpen && selectedPosition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Vendre {selectedPosition.stock_ticker}</h3>
              <button onClick={() => setSellModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Quantité disponible: {selectedPosition.quantity}</p>
                <Input
                  type="number"
                  min="1"
                  max={selectedPosition.quantity}
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(Math.max(1, Math.min(selectedPosition.quantity, parseInt(e.target.value) || 1)))}
                  label="Quantité à vendre"
                />
              </div>

              {stocksData[selectedPosition.stock_ticker] && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Prix actuel:</span>
                    <span className="font-semibold">{formatNumber(stocksData[selectedPosition.stock_ticker].current_price)} F</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total à recevoir:</span>
                    <span className="font-bold text-green-600">
                      {formatNumber(sellQuantity * stocksData[selectedPosition.stock_ticker].current_price)} F
                    </span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <Button variant="secondary" onClick={() => setSellModalOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={handleSell}
                  isLoading={sellStock.isPending}
                  className="flex-1"
                >
                  Vendre
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal d'Achat */}
      {buyModalOpen && selectedStockToBuy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Acheter {selectedStockToBuy.symbol}</h3>
              <button onClick={() => setBuyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  type="number"
                  min="1"
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  label="Quantité"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Prix unitaire:</span>
                  <span className="font-semibold">{formatNumber(selectedStockToBuy.current_price)} F</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total à payer:</span>
                  <span className="font-bold text-red-600">
                    {formatNumber(buyQuantity * selectedStockToBuy.current_price)} F
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                  <span className="text-gray-600">Liquidités disponibles:</span>
                  <span className="font-semibold">{formatNumber(portfolio.cash_balance)} F</span>
                </div>
              </div>

              {buyQuantity * selectedStockToBuy.current_price > portfolio.cash_balance && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">Liquidités insuffisantes pour cet achat.</p>
                </div>
              )}

              <div className="flex space-x-3">
                <Button variant="secondary" onClick={() => setBuyModalOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleBuy}
                  isLoading={buyStock.isPending}
                  disabled={buyQuantity * selectedStockToBuy.current_price > portfolio.cash_balance}
                  className="flex-1"
                >
                  Acheter
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}