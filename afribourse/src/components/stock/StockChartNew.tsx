import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useStockChart } from '../../hooks/useStockChart';
import type { ChartType, TimeInterval, OHLCVData, PriceChange } from '../../types/chart.types';

interface StockChartProps {
  symbol: string;
  data: OHLCVData[];
  onIntervalChange?: (interval: TimeInterval) => void;
  currentInterval?: TimeInterval;
  isLoading?: boolean;
  theme?: 'light' | 'dark';
}

const TIME_INTERVALS: { value: TimeInterval; label: string }[] = [
  { value: '1D', label: '1J' },
  { value: '5D', label: '5J' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1A' },
  { value: 'ALL', label: 'Max' },
];

const CHART_TYPES: { value: ChartType; label: string; icon: string }[] = [
  { value: 'candlestick', label: 'Chandeliers', icon: '📊' },
  { value: 'area', label: 'Aires', icon: '📈' },
  { value: 'line', label: 'Ligne', icon: '📉' },
  { value: 'bar', label: 'Barres', icon: '📊' },
];

export default function StockChartNew({
  symbol,
  data,
  onIntervalChange,
  currentInterval = '1Y',
  isLoading = false,
  theme = 'light',
}: StockChartProps) {
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>(currentInterval);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('candlestick');

  const { chartContainerRef, isReady } = useStockChart({
    chartType: selectedChartType,
    theme,
    data,
  });

  // Debug logs
  console.log('StockChartNew render:', {
    symbol,
    dataLength: data.length,
    isReady,
    isLoading,
    selectedChartType,
    firstDataPoint: data[0],
    lastDataPoint: data[data.length - 1]
  });

  // Calculer la variation sur la période
  const periodChange = useMemo((): PriceChange => {
    if (!data || data.length < 2) {
      return { value: 0, percent: 0, isPositive: true };
    }

    const firstPrice = data[0].close;
    const lastPrice = data[data.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;

    return {
      value: change,
      percent: changePercent,
      isPositive: change >= 0,
    };
  }, [data]);

  const handleIntervalChange = (interval: TimeInterval) => {
    setSelectedInterval(interval);
    if (onIntervalChange) {
      onIntervalChange(interval);
    }
  };

  const handleChartTypeChange = (chartType: ChartType) => {
    setSelectedChartType(chartType);
  };

  // Formatter pour afficher les prix
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const containerClasses = theme === 'dark'
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200';

  const textClasses = theme === 'dark'
    ? 'text-gray-100'
    : 'text-gray-900';

  const mutedTextClasses = theme === 'dark'
    ? 'text-gray-400'
    : 'text-gray-500';

  const buttonBgClasses = theme === 'dark'
    ? 'bg-gray-700'
    : 'bg-gray-100';

  const buttonActiveBgClasses = theme === 'dark'
    ? 'bg-gray-600 text-blue-400'
    : 'bg-white text-blue-600';

  const buttonHoverBgClasses = theme === 'dark'
    ? 'hover:bg-gray-600'
    : 'hover:bg-gray-200';

  if (isLoading) {
    return (
      <div className={`${containerClasses} rounded-xl shadow-sm border p-6 md:p-8`}>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClasses} rounded-xl shadow-sm border p-4 md:p-6`}>
      {/* Header avec sélecteurs */}
      <div className="flex flex-col space-y-4 mb-6">
        {/* Titre et variation */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className={`text-xl md:text-2xl font-bold ${textClasses} mb-1`}>
              {symbol}
            </h3>
            {data.length > 0 && (
              <div
                className={`flex items-center space-x-2 text-sm ${
                  periodChange.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {periodChange.isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-semibold">
                  {periodChange.isPositive ? '+' : ''}
                  {formatPrice(periodChange.value)} FCFA (
                  {periodChange.isPositive ? '+' : ''}
                  {periodChange.percent.toFixed(2)}%)
                </span>
                <span className={mutedTextClasses}>sur la période</span>
              </div>
            )}
          </div>

          {/* Sélecteur d'intervalle */}
          <div className={`flex ${buttonBgClasses} rounded-lg p-1`}>
            {TIME_INTERVALS.map((interval) => (
              <button
                key={interval.value}
                onClick={() => handleIntervalChange(interval.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  selectedInterval === interval.value
                    ? `${buttonActiveBgClasses} shadow-sm`
                    : `${mutedTextClasses} ${buttonHoverBgClasses}`
                }`}
              >
                {interval.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sélecteur de type de graphique */}
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${mutedTextClasses}`}>Type:</span>
          <div className={`flex ${buttonBgClasses} rounded-lg p-1`}>
            {CHART_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleChartTypeChange(type.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center space-x-1 ${
                  selectedChartType === type.value
                    ? `${buttonActiveBgClasses} shadow-sm`
                    : `${mutedTextClasses} ${buttonHoverBgClasses}`
                }`}
                title={type.label}
              >
                <span>{type.icon}</span>
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Graphique */}
      {data.length > 0 ? (
        <div>
          <div
            ref={chartContainerRef}
            className="w-full relative"
            style={{ height: '500px', minHeight: '500px', backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff' }}
          />
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center h-96 ${mutedTextClasses}`}>
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-sm">Aucune donnée d'historique disponible pour cette période</p>
        </div>
      )}

      {/* Légende */}
      <div className={`mt-4 text-xs ${mutedTextClasses} flex flex-wrap gap-4 justify-center`}>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Hausse</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Baisse</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>📊</span>
          <span>Volume en bas</span>
        </div>
      </div>
    </div>
  );
}
