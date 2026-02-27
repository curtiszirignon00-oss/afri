// src/components/MarketsPageRefactored.tsx
import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Star, Info, PlusCircle, CheckCircle, LayoutGrid, List } from 'lucide-react';
import { useStocks, useWatchlist, useAddToWatchlist, useRemoveFromWatchlist, apiFetch, type StockFilters, type Stock } from '../hooks/useApi';
import type { MarketIndex } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Card, Input, LoadingSpinner, ErrorMessage } from './ui';
import { useAnalytics, ACTION_TYPES } from '../hooks/useAnalytics';
import StockComparison from './markets/StockComparison';
import BRVMMarketMap from './markets/BRVMMarketMap';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

import { useNavigate } from 'react-router-dom';

// Limites de comparaison selon l'abonnement
const COMPARISON_LIMITS: Record<string, number> = {
  free: 2,
  premium: 4,
  pro: Infinity,
  max: Infinity,
};
type MarketsPageRefactoredProps = {};

export default function MarketsPageRefactored() {
  const navigate = useNavigate();
  const { trackAction } = useAnalytics();
  const { userProfile } = useAuth();

  // Déterminer la limite de comparaison selon le tier
  const subscriptionTier = (userProfile as any)?.subscriptionTier || 'free';
  const comparisonLimit = COMPARISON_LIMITS[subscriptionTier] ?? COMPARISON_LIMITS.free;
  // États locaux pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'change' | 'price' | 'volume' | 'pe' | 'dividend'>('change');

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minMarketCap, setMinMarketCap] = useState<number | undefined>(undefined);
  const [maxMarketCap, setMaxMarketCap] = useState<number | undefined>(undefined);
  const [minPE, setMinPE] = useState<number | undefined>(undefined);
  const [maxPE, setMaxPE] = useState<number | undefined>(undefined);
  const [minDividend, setMinDividend] = useState<number | undefined>(undefined);
  const [maxDividend, setMaxDividend] = useState<number | undefined>(undefined);

  // Vue : liste ou carte de marché
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Stock comparison
  const [comparisonStocks, setComparisonStocks] = useState<Stock[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Debounce du terme de recherche
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Préparer les filtres pour React Query
  const filters: StockFilters = useMemo(() => ({
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    ...(selectedSector !== 'all' && { sector: selectedSector }),
    sort: sortBy,
    ...(minMarketCap !== undefined && { minMarketCap: minMarketCap.toString() }),
    ...(maxMarketCap !== undefined && { maxMarketCap: maxMarketCap.toString() }),
    ...(minPE !== undefined && { minPE: minPE.toString() }),
    ...(maxPE !== undefined && { maxPE: maxPE.toString() }),
    ...(minDividend !== undefined && { minDividend: minDividend.toString() }),
    ...(maxDividend !== undefined && { maxDividend: maxDividend.toString() }),
  }), [debouncedSearchTerm, selectedSector, sortBy, minMarketCap, maxMarketCap, minPE, maxPE, minDividend, maxDividend]);

  // Indices du marché
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  useEffect(() => {
    apiFetch<MarketIndex[]>('/indices/latest?limit=2').then(setMarketIndices).catch(() => {});
  }, []);

  // Hooks React Query
  const { data: stocks = [], isLoading, error, refetch } = useStocks(filters);
  const { data: watchlist = [] } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  // Set des tickers dans la watchlist
  const watchlistTickers = new Set(watchlist.map(item => item.stock_ticker));

  // Track les recherches
  useEffect(() => {
    if (debouncedSearchTerm) {
      trackAction(ACTION_TYPES.SEARCH_STOCK, 'Recherche d\'action', { query: debouncedSearchTerm });
    }
  }, [debouncedSearchTerm]);

  // Track les filtres par secteur
  useEffect(() => {
    if (selectedSector !== 'all') {
      trackAction(ACTION_TYPES.FILTER_STOCKS, 'Filtre par secteur', { sector: selectedSector });
    }
  }, [selectedSector]);

  // Liste des secteurs BRVM
  const sectors = [
    'all',
    'Consommation de Base',
    'Consommation Discrétionnaire',
    'Energie',
    'Industriels',
    'Services Financiers',
    'Services Publics',
    'Télécommunications'
  ];

  // Fonction pour formater les nombres
  const formatNumber = (num: number, decimals = 0) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedSector !== 'all') count++;
    if (minMarketCap !== undefined) count++;
    if (maxMarketCap !== undefined) count++;
    if (minPE !== undefined) count++;
    if (maxPE !== undefined) count++;
    if (minDividend !== undefined) count++;
    if (maxDividend !== undefined) count++;
    return count;
  }, [selectedSector, minMarketCap, maxMarketCap, minPE, maxPE, minDividend, maxDividend]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSector('all');
    setMinMarketCap(undefined);
    setMaxMarketCap(undefined);
    setMinPE(undefined);
    setMaxPE(undefined);
    setMinDividend(undefined);
    setMaxDividend(undefined);
  };

  // Comparison functions
  const addToComparison = (stock: Stock) => {
    if (comparisonStocks.length >= comparisonLimit) {
      const tierName = subscriptionTier === 'free' ? 'gratuit' : subscriptionTier;
      toast.error(
        `Limite de comparaison atteinte (${comparisonLimit} actions). ${
          subscriptionTier === 'free' || subscriptionTier === 'premium'
            ? 'Passez à un plan supérieur pour comparer plus d\'actions.'
            : ''
        }`,
        { duration: 4000 }
      );
      return;
    }
    if (comparisonStocks.find(s => s.id === stock.id)) {
      toast.error('Cette action est déjà dans la comparaison');
      return;
    }
    setComparisonStocks([...comparisonStocks, stock]);
    setShowComparison(true);
    toast.success(`${stock.symbol} ajouté à la comparaison`);
  };

  const removeFromComparison = (stockId: string) => {
    const newStocks = comparisonStocks.filter(s => s.id !== stockId);
    setComparisonStocks(newStocks);
    if (newStocks.length === 0) {
      setShowComparison(false);
    }
  };

  const closeComparison = () => {
    setComparisonStocks([]);
    setShowComparison(false);
  };

  const isInComparison = (stock: Stock) => {
    return comparisonStocks.some(s => s.id === stock.id);
  };

  // <-- AJOUT : Fonction pour obtenir la couleur du badge selon le secteur
  const getSectorColor = (sector: string | null) => {
    if (!sector) return 'bg-gray-100 text-gray-700';

    const colors: Record<string, string> = {
      'Consommation de Base': 'bg-green-100 text-green-700',
      'Consommation Discrétionnaire': 'bg-purple-100 text-purple-700',
      'Energie': 'bg-orange-100 text-orange-700',
      'Industriels': 'bg-blue-100 text-blue-700',
      'Services Financiers': 'bg-indigo-100 text-indigo-700',
      'Services Publics': 'bg-teal-100 text-teal-700',
      'Télécommunications': 'bg-pink-100 text-pink-700',
    };

    return colors[sector] || 'bg-gray-100 text-gray-700';
  };

  // Load comparison from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const compareIds = params.get('compare');

    if (compareIds && stocks.length > 0) {
      const ids = compareIds.split(',');
      const stocksToCompare = stocks.filter(s => ids.includes(s.id));

      if (stocksToCompare.length > 0) {
        setComparisonStocks(stocksToCompare);
        setShowComparison(true);
        toast.success(`${stocksToCompare.length} action(s) chargée(s) pour comparaison`);
      }
    }
  }, [stocks]);

  // Gestion de la watchlist
  const handleToggleWatchlist = async (stockTicker: string) => {
    const isInWatchlist = watchlistTickers.has(stockTicker);

    try {
      if (isInWatchlist) {
        await removeFromWatchlist.mutateAsync(stockTicker);
        trackAction(ACTION_TYPES.REMOVE_FROM_WATCHLIST, 'Retrait de la watchlist', { ticker: stockTicker });
      } else {
        await addToWatchlist.mutateAsync(stockTicker);
        trackAction(ACTION_TYPES.ADD_TO_WATCHLIST, 'Ajout à la watchlist', { ticker: stockTicker });
      }
    } catch (error) {
      console.error('Erreur watchlist:', error);
    }
  };

  // Affichage du loading
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Chargement des marchés..." />;
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <ErrorMessage
        fullScreen
        message={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Marchés BRVM</h1>
          <p className="text-sm sm:text-base text-gray-600">
            {stocks.length} action{stocks.length > 1 ? 's' : ''} disponible{stocks.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Indices du marché */}
        {marketIndices.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Indices BRVM</h2>
              <button
                onClick={() => navigate('/indices')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir tous les indices &rarr;
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {marketIndices.map((index) => (
                <div
                  key={index.id}
                  onClick={() => navigate('/indices')}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{index.index_name}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(index.index_value, 2)}
                    </p>
                  </div>
                  <div
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                      index.daily_change_percent >= 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <span>
                      {index.daily_change_percent >= 0 ? '+' : ''}
                      {index.daily_change_percent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtres */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <Input
                icon={<Search className="w-5 h-5" />}
                placeholder="Rechercher une action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm !== debouncedSearchTerm && (
                <p className="text-xs text-gray-500 mt-1 ml-1">Recherche en cours...</p>
              )}
            </div>

            {/* Filtre secteur */}
            <div className="relative w-full md:w-64">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer appearance-none"
              >
                <option value="all">Tous les secteurs</option>
                {sectors.slice(1).map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="name">Nom (A-Z)</option>
              <option value="change">Variation (%)</option>
              <option value="price">Prix</option>
              <option value="volume">Volume</option>
              <option value="pe">P/E Ratio</option>
              <option value="dividend">Dividende (%)</option>
            </select>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              variant="outline"
              className="relative"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres avancés
              {activeFiltersCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                onClick={resetFilters}
                variant="ghost"
                className="text-gray-500 hover:text-gray-700"
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </Card>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <Card className="mb-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres avancés</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Market Cap Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capitalisation boursière (FCFA)
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min (ex: 1000000)"
                      value={minMarketCap ?? ''}
                      onChange={(e) => setMinMarketCap(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max (ex: 100000000)"
                      value={maxMarketCap ?? ''}
                      onChange={(e) => setMaxMarketCap(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: 1M = 1000000, 1Mrd = 1000000000
                  </p>
                </div>

                {/* P/E Ratio Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ratio P/E (Price to Earnings)
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min (ex: 5)"
                      value={minPE ?? ''}
                      onChange={(e) => setMinPE(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max (ex: 20)"
                      value={maxPE ?? ''}
                      onChange={(e) => setMaxPE(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Valeurs typiques: 10-20
                  </p>
                </div>

                {/* Dividend Yield Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rendement du dividende (%)
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min (ex: 2)"
                      value={minDividend ?? ''}
                      onChange={(e) => setMinDividend(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max (ex: 10)"
                      value={maxDividend ?? ''}
                      onChange={(e) => setMaxDividend(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Valeurs typiques: 2-10%
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Stock Comparison Section */}
        {showComparison && (
          <StockComparison
            stocks={comparisonStocks}
            onRemove={removeFromComparison}
            onClose={closeComparison}
          />
        )}

        {/* Bascule vue liste / carte de marché */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Liste</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'map'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Carte de marché</span>
            </button>
          </div>

          {/* Indication scroll (visible uniquement en vue liste sur mobile) */}
          {viewMode === 'list' && (
            <div className="flex md:hidden items-center gap-2 text-xs text-gray-500 px-1">
              <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Glissez pour voir P/E, Dividende, Cap. Boursière</span>
            </div>
          )}
        </div>

        {/* Vue Carte de marché */}
        {viewMode === 'map' && (
          <BRVMMarketMap stocks={stocks} loading={isLoading} />
        )}

        {/* Tableau des actions (vue liste) */}
        {viewMode === 'list' && <Card padding="none">
          {stocks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {debouncedSearchTerm || selectedSector !== 'all'
                  ? 'Aucune action trouvée avec ces critères.'
                  : 'Aucune action disponible.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span className="sr-only">Actions</span>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[120px] after:content-[''] after:absolute after:top-0 after:right-0 after:bottom-0 after:w-px after:bg-gray-200 md:after:hidden">
                      Action
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Prix
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Variation
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Volume
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Cap. Bours.
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 group relative">
                        <span>P/E</span>
                        <div className="relative hidden sm:block">
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          <div className="invisible group-hover:visible absolute right-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                            <div className="font-semibold mb-1">Price to Earnings Ratio</div>
                            <div className="text-gray-300">Ratio cours/bénéfice. Un P/E bas peut indiquer une action sous-évaluée. Typiquement entre 10-20.</div>
                            <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                          </div>
                        </div>
                      </div>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 group relative">
                        <span>Div. (%)</span>
                        <div className="relative hidden sm:block">
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          <div className="invisible group-hover:visible absolute right-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                            <div className="font-semibold mb-1">Rendement du Dividende</div>
                            <div className="text-gray-300">Pourcentage du prix de l'action versé en dividendes annuels. Un rendement élevé (5-10%) est attractif pour les investisseurs.</div>
                            <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                          </div>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stocks.map((stock) => (
                    <tr
                      key={stock.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors group/row"
                    >
                      {/* Compare + Watchlist buttons */}
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isInComparison(stock)) {
                                removeFromComparison(stock.id);
                              } else {
                                addToComparison(stock);
                              }
                            }}
                            className="text-gray-400 hover:text-blue-600 transition-colors p-0.5"
                            title={isInComparison(stock) ? "Retirer de la comparaison" : "Ajouter à la comparaison"}
                          >
                            {isInComparison(stock) ? (
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            ) : (
                              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWatchlist(stock.symbol);
                            }}
                            className="p-0.5 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${watchlistTickers.has(stock.symbol)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                                }`}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Info action - Sticky column */}
                      <td
                        className="px-3 sm:px-6 py-3 sm:py-4 sticky left-0 bg-white group-hover/row:bg-gray-50 z-10 min-w-[120px] after:content-[''] after:absolute after:top-0 after:right-0 after:bottom-0 after:w-px after:bg-gray-200 md:after:hidden"
                        onClick={() => navigate(`/stock/${stock.symbol}`, { state: stock })}
                      >
                        <div>
                          <div className="font-bold text-gray-900 text-sm sm:text-base">{stock.symbol}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[100px] sm:max-w-xs">
                            {stock.company_name}
                          </div>
                          {stock.sector && (
                            <span className={`hidden sm:inline-block mt-1 px-2 py-0.5 text-xs rounded font-medium ${getSectorColor(stock.sector)}`}>
                              {stock.sector}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Prix */}
                      <td
                        className="px-3 sm:px-6 py-3 sm:py-4 text-right font-semibold text-sm sm:text-base whitespace-nowrap"
                        onClick={() => navigate(`/stock/${stock.symbol}`, { state: stock })}
                      >
                        {formatNumber(stock.current_price)} F
                      </td>

                      {/* Variation */}
                      <td
                        className="px-3 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap"
                        onClick={() => navigate(`/stock/${stock.symbol}`, { state: stock })}
                      >
                        <span
                          className={`font-semibold text-sm sm:text-base ${stock.daily_change_percent >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                            }`}
                        >
                          {stock.daily_change_percent >= 0 ? '+' : ''}
                          {stock.daily_change_percent.toFixed(2)}%
                        </span>
                      </td>

                      {/* Volume */}
                      <td
                        className="px-3 sm:px-6 py-3 sm:py-4 text-right text-gray-600 text-sm whitespace-nowrap"
                        onClick={() => navigate(`/stock/${stock.symbol}`, { state: stock })}
                      >
                        {formatNumber(stock.volume)}
                      </td>

                      {/* Cap. Boursière */}
                      <td
                        className="px-3 sm:px-6 py-3 sm:py-4 text-right text-gray-600 text-sm whitespace-nowrap"
                        onClick={() => navigate(`/stock/${stock.symbol}`, { state: stock })}
                      >
                        {formatNumber(stock.market_cap / 1000000)} M
                      </td>

                      {/* P/E Ratio */}
                      <td
                        className="px-3 sm:px-6 py-3 sm:py-4 text-right text-gray-600 text-sm whitespace-nowrap"
                        onClick={() => navigate(`/stock/${stock.symbol}`, { state: stock })}
                      >
                        {stock.pe_ratio ? formatNumber(stock.pe_ratio, 2) : '-'}
                      </td>

                      {/* Dividend Yield */}
                      <td
                        className="px-3 sm:px-6 py-3 sm:py-4 text-right text-gray-600 text-sm whitespace-nowrap"
                        onClick={() => navigate(`/stock/${stock.symbol}`, { state: stock })}
                      >
                        {stock.dividend_yield ? `${formatNumber(stock.dividend_yield, 2)}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>}

        {/* Stats rapides */}
        <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-3 sm:gap-6">
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-xs sm:text-sm mb-1">Actions</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{stocks.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-xs sm:text-sm mb-1">Secteurs</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{sectors.length - 1}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-xs sm:text-sm mb-1">Watchlist</p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">{watchlist.length}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}