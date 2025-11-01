// src/components/MarketsPageRefactored.tsx
import { useState, useMemo } from 'react'; // <-- AJOUT : import useMemo
import { Search, Filter, Star } from 'lucide-react';
import { useStocks, useWatchlist, useAddToWatchlist, useRemoveFromWatchlist, type StockFilters } from '../hooks/useApi';
import { useDebounce } from '../hooks/useDebounce'; // <-- AJOUT : import du hook useDebounce
import { Button, Card, Input, LoadingSpinner, ErrorMessage } from './ui';

type MarketsPageRefactoredProps = {
  onNavigate: (page: string, data?: any) => void;
};

export default function MarketsPageRefactored({ onNavigate }: MarketsPageRefactoredProps) {
  // États locaux pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'change' | 'price' | 'volume'>('change');

  // <-- AJOUT : Debounce du terme de recherche (300ms de délai)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // <-- CORRECTION : Utiliser debouncedSearchTerm au lieu de searchTerm
  const filters: StockFilters = useMemo(() => ({
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }), // <-- CORRECTION
    ...(selectedSector !== 'all' && { sector: selectedSector }),
    sort: sortBy,
  }), [debouncedSearchTerm, selectedSector, sortBy]); // <-- CORRECTION : dependencies

  // Hooks React Query
  const { data: stocks = [], isLoading, isFetching, error, refetch } = useStocks(filters);
  const { data: watchlist = [] } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  // Set des tickers dans la watchlist pour un accès rapide
  const watchlistTickers = new Set(watchlist.map(item => item.stock_ticker));

  // <-- CORRECTION : Liste des secteurs mise à jour selon la classification BRVM
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

  // Gestion de la watchlist avec optimistic update
  const handleToggleWatchlist = async (stockTicker: string) => {
    const isInWatchlist = watchlistTickers.has(stockTicker);

    try {
      if (isInWatchlist) {
        await removeFromWatchlist.mutateAsync(stockTicker);
      } else {
        await addToWatchlist.mutateAsync(stockTicker);
      }
    } catch (error) {
      // L'erreur est déjà gérée dans le hook avec toast
      console.error('Erreur watchlist:', error);
    }
  };

  // Affichage du loading initial uniquement (pas lors des recherches)
  if (isLoading && !stocks.length) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Marchés BRVM</h1>
          <p className="text-gray-600">
            {stocks.length} action{stocks.length > 1 ? 's' : ''} disponible{stocks.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <Input
                icon={<Search className="w-5 h-5" />}
                placeholder="Rechercher une action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} // <-- Garde l'input réactif
              />
              {/* <-- AJOUT : Indicateur de recherche en cours */}
              {(searchTerm !== debouncedSearchTerm || isFetching) && (
                <p className="text-xs text-gray-500 mt-1 ml-1">
                  {isFetching ? 'Chargement...' : 'Recherche en cours...'}
                </p>
              )}
            </div>

            {/* Filtre secteur */}
            <div className="relative w-full md:w-48">
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
            </select>
          </div>
        </Card>

        {/* Tableau des actions */}
        <Card padding="none">
          {stocks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {debouncedSearchTerm || selectedSector !== 'all'
                  ? 'Aucune action trouvée avec ces critères.'
                  : 'Aucune action disponible.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Watchlist
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variation
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cap. Boursière
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stocks.map((stock) => (
                    <tr
                      key={stock.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {/* Watchlist Star */}
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWatchlist(stock.symbol);
                          }}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              watchlistTickers.has(stock.symbol)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Info action */}
                      <td
                        className="px-6 py-4"
                        onClick={() => onNavigate('stock-detail', stock)}
                      >
                        <div>
                          <div className="font-bold text-gray-900">{stock.symbol}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {stock.company_name}
                          </div>
                          {stock.sector && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                              {stock.sector}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Prix */}
                      <td
                        className="px-6 py-4 text-right font-semibold"
                        onClick={() => onNavigate('stock-detail', stock)}
                      >
                        {formatNumber(stock.current_price)} F
                      </td>

                      {/* Variation */}
                      <td
                        className="px-6 py-4 text-right"
                        onClick={() => onNavigate('stock-detail', stock)}
                      >
                        <span
                          className={`font-semibold ${
                            stock.daily_change_percent >= 0
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
                        className="px-6 py-4 text-right text-gray-600"
                        onClick={() => onNavigate('stock-detail', stock)}
                      >
                        {formatNumber(stock.volume)}
                      </td>

                      {/* Cap. Boursière */}
                      <td
                        className="px-6 py-4 text-right text-gray-600"
                        onClick={() => onNavigate('stock-detail', stock)}
                      >
                        {formatNumber(stock.market_cap / 1000000)} M
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Stats rapides */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">Actions disponibles</p>
              <p className="text-3xl font-bold text-gray-900">{stocks.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">Secteurs</p>
              <p className="text-3xl font-bold text-gray-900">{sectors.length - 1}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">Dans ma watchlist</p>
              <p className="text-3xl font-bold text-gray-900">{watchlist.length}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}