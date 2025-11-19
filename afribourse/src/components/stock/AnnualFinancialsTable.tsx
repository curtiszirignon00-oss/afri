import React from 'react';
import { AnnualFinancial } from '../../services/stockApi';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnnualFinancialsTableProps {
  financials: AnnualFinancial[];
}

export function AnnualFinancialsTable({ financials }: AnnualFinancialsTableProps) {
  if (!financials || financials.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune donnée financière disponible
      </div>
    );
  }

  const formatMillions = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value / 1_000_000).toFixed(0)} M`;
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(2);
  };

  const GrowthIndicator = ({ value }: { value: number | null | undefined }) => {
    if (value === null || value === undefined) {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
    if (value > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    if (value < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  // Trier par année décroissante
  const sortedFinancials = [...financials].sort((a, b) => b.year - a.year);

  return (
    <div className="bg-white rounded-lg p-6 overflow-x-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Historique Financier (5 ans)
      </h3>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Année
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              CA (FCFA)
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Croissance CA
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              RN (FCFA)
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Croissance RN
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              BNPA
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              PER
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dividende
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedFinancials.map((financial, index) => (
            <tr
              key={financial.id}
              className={index === 0 ? 'bg-blue-50' : 'hover:bg-gray-50'}
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                {financial.year}
                {index === 0 && (
                  <span className="ml-2 text-xs text-blue-600">(Dernière)</span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                {formatMillions(financial.revenue)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <div className="flex items-center justify-center gap-1">
                  <GrowthIndicator value={financial.revenue_growth} />
                  <span
                    className={
                      financial.revenue_growth && financial.revenue_growth > 0
                        ? 'text-green-600'
                        : financial.revenue_growth && financial.revenue_growth < 0
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }
                  >
                    {formatPercent(financial.revenue_growth)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                <span
                  className={
                    financial.net_income && financial.net_income < 0
                      ? 'text-red-600 font-semibold'
                      : 'text-gray-900'
                  }
                >
                  {formatMillions(financial.net_income)}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <div className="flex items-center justify-center gap-1">
                  <GrowthIndicator value={financial.net_income_growth} />
                  <span
                    className={
                      financial.net_income_growth && financial.net_income_growth > 0
                        ? 'text-green-600'
                        : financial.net_income_growth && financial.net_income_growth < 0
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }
                  >
                    {formatPercent(financial.net_income_growth)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                {formatNumber(financial.eps)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                {formatNumber(financial.pe_ratio)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                <span className="text-green-600 font-semibold">
                  {formatNumber(financial.dividend)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 text-xs text-gray-500">
        <p>CA = Chiffre d'Affaires | RN = Résultat Net | BNPA = Bénéfice Net Par Action | PER = Price-to-Earnings Ratio</p>
        <p className="mt-1">Montants en millions de FCFA</p>
      </div>
    </div>
  );
}
