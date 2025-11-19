import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Period = '1M' | '3M' | '6M' | '1Y' | 'ALL';

type StockChartData = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type StockChartProps = {
  symbol: string;
  data: StockChartData[];
  onPeriodChange?: (period: Period) => void;
  currentPeriod?: Period;
  isLoading?: boolean;
};

const PERIODS: { value: Period; label: string }[] = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1A' },
  { value: 'ALL', label: 'Max' }
];

export default function StockChart({
  symbol,
  data,
  onPeriodChange,
  currentPeriod = '1Y',
  isLoading = false
}: StockChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(currentPeriod);

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
    if (onPeriodChange) {
      onPeriodChange(period);
    }
  };

  // Calculer la variation sur la période
  const calculatePeriodChange = () => {
    if (!data || data.length < 2) return { value: 0, percent: 0, isPositive: true };

    const firstPrice = data[0].close;
    const lastPrice = data[data.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;

    return {
      value: change,
      percent: changePercent,
      isPositive: change >= 0
    };
  };

  const periodChange = calculatePeriodChange();

  // Formater les données pour le graphique
  const chartData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short'
    })
  }));

  // Formatter pour afficher les prix
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value);
  };

  // Formatter pour le tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800 mb-2">{data.date}</p>
          <div className="space-y-1 text-xs">
            <p className="flex justify-between gap-4">
              <span className="text-gray-600">Ouverture:</span>
              <span className="font-semibold">{formatPrice(data.open)} F</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-gray-600">Clôture:</span>
              <span className="font-semibold">{formatPrice(data.close)} F</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-gray-600">Plus haut:</span>
              <span className="font-semibold">{formatPrice(data.high)} F</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-gray-600">Plus bas:</span>
              <span className="font-semibold">{formatPrice(data.low)} F</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-gray-600">Volume:</span>
              <span className="font-semibold">{formatPrice(data.volume)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
      {/* Header avec sélecteur de période */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
            Historique de Prix - {symbol}
          </h3>
          {data.length > 0 && (
            <div className={`flex items-center space-x-2 text-sm ${periodChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {periodChange.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-semibold">
                {periodChange.isPositive ? '+' : ''}{formatPrice(periodChange.value)} FCFA
                ({periodChange.isPositive ? '+' : ''}{periodChange.percent.toFixed(2)}%)
              </span>
              <span className="text-gray-500">sur la période</span>
            </div>
          )}
        </div>

        {/* Period selector */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              onClick={() => handlePeriodChange(period.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === period.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              tickFormatter={formatPrice}
              tickLine={{ stroke: '#e5e7eb' }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line
              type="monotone"
              dataKey="close"
              name="Prix de clôture"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="open"
              name="Prix d'ouverture"
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <svg
            className="w-16 h-16 mb-4 text-gray-300"
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
    </div>
  );
}
