// src/components/markets/ComparisonChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStockHistory } from '../../hooks/useStockHistory';
import PeriodSelector from './PeriodSelector';
import type { Stock } from '../../hooks/useApi';

interface ComparisonChartProps {
    stocks: Stock[];
    period: 7 | 30 | 90;
    onPeriodChange: (period: 7 | 30 | 90) => void;
}

export default function ComparisonChart({ stocks, period, onPeriodChange }: ComparisonChartProps) {
    const symbols = stocks.map(s => s.symbol);
    const { data, isLoading, error } = useStockHistory(symbols, period);

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement du graphique...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center text-red-600">
                    <p className="font-semibold">Erreur de chargement</p>
                    <p className="text-sm mt-2">{error.message}</p>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center text-gray-500">
                    <p className="font-semibold">Aucune donnée disponible</p>
                    <p className="text-sm mt-2">Pas d'historique pour cette période</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-2 sm:p-4">
            {/* Period Selector */}
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Évolution des prix</h3>
                <PeriodSelector selected={period} onChange={onPeriodChange} />
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={280} className="sm:h-[400px]">
                <LineChart data={data} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                        dataKey="date"
                        stroke="#6B7280"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                    />
                    <YAxis
                        stroke="#6B7280"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value} F`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#FFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '12px',
                        }}
                        labelFormatter={(label) => {
                            const date = new Date(label);
                            return date.toLocaleDateString('fr-FR');
                        }}
                        formatter={(value: number | undefined) => [`${value?.toFixed(0) || 0} FCFA`, '']}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                    />
                    {stocks.map((stock, index) => (
                        <Line
                            key={stock.id}
                            type="monotone"
                            dataKey={stock.symbol}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            name={stock.symbol}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            {/* Legend Info */}
           <div className="mt-4 flex flex-wrap gap-2 sm:gap-4 justify-center">
                {stocks.map((stock, index) => (
                  <div key={stock.id} className="flex items-center gap-1.5 sm:gap-2">
  <div 
    className="w-3 sm:w-4 h-0.5" 
    style={{ backgroundColor: colors[index % colors.length] }}
  ></div>
  <span className="text-xs sm:text-sm text-gray-700 font-medium">{stock.symbol}</span>
  <span className="text-xs text-gray-500 hidden sm:inline">{stock.company_name}</span>
</div>
                ))}
            </div>
        </div>
    );
}
