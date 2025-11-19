import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Shareholder } from '../../services/stockApi';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface ShareholdersPieChartProps {
  shareholders: Shareholder[];
}

export function ShareholdersPieChart({ shareholders }: ShareholdersPieChartProps) {
  if (!shareholders || shareholders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune donnée d'actionnaires disponible
      </div>
    );
  }

  const data = shareholders.map(sh => ({
    name: sh.name,
    value: sh.percentage,
    is_public: sh.is_public
  }));

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            {payload[0].value.toFixed(2)}%
          </p>
          {payload[0].payload.is_public && (
            <p className="text-xs text-blue-600 mt-1">Public (BRVM)</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Structure de Propriété
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-sm">
                {value} {entry.payload.is_public && '(Public)'}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-6 space-y-2">
        {shareholders.map((sh, index) => (
          <div key={sh.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-gray-700">{sh.name}</span>
              {sh.is_public && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  Public
                </span>
              )}
            </div>
            <span className="font-semibold text-gray-900">{sh.percentage.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
