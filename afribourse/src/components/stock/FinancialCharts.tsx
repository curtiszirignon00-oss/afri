import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { AnnualFinancial } from '../../services/stockApi';

interface FinancialChartsProps {
  financials: AnnualFinancial[];
}

type ChartType = 'revenue' | 'netIncome' | 'eps' | 'per' | 'dividend';

export function FinancialCharts({ financials }: FinancialChartsProps) {
  const [selectedChart, setSelectedChart] = useState<ChartType>('revenue');

  if (!financials || financials.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune donnée financière disponible pour les graphiques
      </div>
    );
  }

  // Trier par année croissante pour les graphiques
  const sortedData = [...financials].sort((a, b) => a.year - b.year);

  const formatMillions = (value: number) => `${(value / 1_000_000).toFixed(0)}M`;

  const charts = {
    revenue: {
      title: 'Évolution du Chiffre d\'Affaires',
      dataKey: 'revenue',
      color: '#3b82f6',
      type: 'bar' as const,
      formatter: formatMillions,
      unit: ' FCFA'
    },
    netIncome: {
      title: 'Évolution du Résultat Net',
      dataKey: 'net_income',
      color: '#10b981',
      type: 'bar' as const,
      formatter: formatMillions,
      unit: ' FCFA'
    },
    eps: {
      title: 'Évolution du BNPA',
      dataKey: 'eps',
      color: '#f59e0b',
      type: 'bar' as const,
      formatter: (value: number) => value.toFixed(2),
      unit: ' FCFA'
    },
    per: {
      title: 'Évolution du PER',
      dataKey: 'pe_ratio',
      color: '#8b5cf6',
      type: 'line' as const,
      formatter: (value: number) => value.toFixed(2),
      unit: ''
    },
    dividend: {
      title: 'Évolution des Dividendes',
      dataKey: 'dividend',
      color: '#ec4899',
      type: 'bar' as const,
      formatter: (value: number) => value.toFixed(2),
      unit: ' FCFA'
    }
  };

  const currentChart = charts[selectedChart];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm" style={{ color: currentChart.color }}>
            {currentChart.title.split('du ')[1]}: {currentChart.formatter(value)}{currentChart.unit}
          </p>
          {selectedChart === 'revenue' && payload[0].payload.revenue_growth && (
            <p className="text-xs text-gray-600 mt-1">
              Croissance: +{payload[0].payload.revenue_growth.toFixed(2)}%
            </p>
          )}
          {selectedChart === 'netIncome' && payload[0].payload.net_income_growth && (
            <p className="text-xs text-gray-600 mt-1">
              Croissance: +{payload[0].payload.net_income_growth.toFixed(2)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Graphiques d'Évolution
      </h3>

      {/* Tabs pour sélectionner le graphique */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {Object.entries(charts).map(([key, chart]) => (
          <button
            key={key}
            onClick={() => setSelectedChart(key as ChartType)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedChart === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {chart.title.split('du ')[1]}
          </button>
        ))}
      </div>

      {/* Graphique */}
      <ResponsiveContainer width="100%" height={350}>
        {currentChart.type === 'line' ? (
          <LineChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => currentChart.formatter(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey={currentChart.dataKey}
              stroke={currentChart.color}
              strokeWidth={3}
              dot={{ fill: currentChart.color, r: 5 }}
              activeDot={{ r: 7 }}
              name={currentChart.title.split('du ')[1]}
            />
          </LineChart>
        ) : (
          <BarChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => currentChart.formatter(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey={currentChart.dataKey}
              fill={currentChart.color}
              radius={[8, 8, 0, 0]}
              name={currentChart.title.split('du ')[1]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Stats summary */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-500">Minimum</p>
          <p className="text-lg font-semibold" style={{ color: currentChart.color }}>
            {currentChart.formatter(
              Math.min(...sortedData.map(d => (d as any)[currentChart.dataKey] || 0))
            )}
            {currentChart.unit}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Maximum</p>
          <p className="text-lg font-semibold" style={{ color: currentChart.color }}>
            {currentChart.formatter(
              Math.max(...sortedData.map(d => (d as any)[currentChart.dataKey] || 0))
            )}
            {currentChart.unit}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Moyenne</p>
          <p className="text-lg font-semibold" style={{ color: currentChart.color }}>
            {currentChart.formatter(
              sortedData.reduce((sum, d) => sum + ((d as any)[currentChart.dataKey] || 0), 0) /
                sortedData.length
            )}
            {currentChart.unit}
          </p>
        </div>
      </div>
    </div>
  );
}
