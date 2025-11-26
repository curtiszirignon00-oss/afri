import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Period } from '../../services/stockApi';

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
        <div className="flex bg-gray-100 rounded-lg p-1">
          {PERIODS.map((period) => (
            <button
              key={period.value}
              onClick={() => handlePeriodChange(period.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                selectedPeriod === period.value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
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
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={periodChange.isPositive ? "#10b981" : "#ef4444"}
                  stopOpacity={0.15}
                />
                <stop
                  offset="95%"
                  stopColor={periodChange.isPositive ? "#10b981" : "#ef4444"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              minTickGap={30}
            />
            <YAxis
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={formatPrice}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="close"
              stroke={periodChange.isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
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
