import { useState } from 'react';
import { AnnualFinancial } from '../../services/stockApi';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnnualFinancialsTableProps {
  financials: AnnualFinancial[];
  /** Profondeur d'historique demandée (nombre d'exercices). */
  years?: number;
  /** Appelé quand l'utilisateur change la profondeur ; sans ce callback, le sélecteur est masqué. */
  onYearsChange?: (years: number) => void;
}

type View = 'results' | 'profitability';

const DEPTHS = [5, 10, 20] as const;

export function AnnualFinancialsTable({ financials, years, onYearsChange }: AnnualFinancialsTableProps) {
  const [view, setView] = useState<View>('results');

  if (!financials || financials.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune donnée financière disponible
      </div>
    );
  }

  const formatMillions = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `${new Intl.NumberFormat('fr-FR').format(Math.round(value))} M`;
  };

  const formatPercent = (value: number | null | undefined, signed = true) => {
    if (value === null || value === undefined) return 'N/A';
    return `${signed && value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(2);
  };

  const signClass = (value: number | null | undefined) =>
    value === null || value === undefined
      ? 'text-gray-500'
      : value > 0
      ? 'text-green-600'
      : value < 0
      ? 'text-red-600'
      : 'text-gray-500';

  const GrowthIndicator = ({ value }: { value: number | null | undefined }) => {
    if (value === null || value === undefined) {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  // Trier par année décroissante
  const sorted = [...financials].sort((a, b) => b.year - a.year);

  const COLS: Record<View, string[]> = {
    results: ['Année', 'CA', 'Croissance CA', 'RN', 'Croissance RN', 'BNPA', 'PER', 'Dividende'],
    profitability: [
      'Année',
      'Marge nette',
      'Marge op.',
      'ROE',
      'ROA',
      'Capitaux propres',
      'Total actif',
      'Dettes fin.',
      'Dette/CP',
    ],
  };

  const th = (label: string, i: number) => (
    <th
      key={label}
      className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${
        i === 0 ? 'text-left' : view === 'results' && (i === 2 || i === 4) ? 'text-center' : 'text-right'
      }`}
    >
      {label}
    </th>
  );

  return (
    <div className="bg-white rounded-lg p-6 overflow-x-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm font-medium text-gray-600">
          {sorted.length} exercice{sorted.length > 1 ? 's' : ''} · {sorted[sorted.length - 1].year}–{sorted[0].year}
        </p>

        <div className="flex items-center gap-2">
          {/* Sélecteur de vue */}
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setView('results')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'results' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Résultats & valorisation
            </button>
            <button
              onClick={() => setView('profitability')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 ${
                view === 'profitability' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Rentabilité & bilan
            </button>
          </div>

          {/* Profondeur d'historique */}
          {onYearsChange && (
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {DEPTHS.map((d, i) => (
                <button
                  key={d}
                  onClick={() => onYearsChange(d)}
                  className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${i > 0 ? 'border-l border-gray-200' : ''} ${
                    years === d ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {d === 20 ? 'Max' : `${d} ans`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>{COLS[view].map(th)}</tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sorted.map((f, index) => {
            const gearing =
              f.total_dettes_financieres != null && f.total_capitaux_propres != null && f.total_capitaux_propres > 0
                ? f.total_dettes_financieres / f.total_capitaux_propres
                : null;

            return (
              <tr key={f.id} className={index === 0 ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {f.year}
                  {index === 0 && <span className="ml-2 text-xs text-blue-600">(Dernière)</span>}
                </td>

                {view === 'results' ? (
                  <>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatMillions(f.revenue)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center justify-center gap-1">
                        <GrowthIndicator value={f.revenue_growth} />
                        <span className={signClass(f.revenue_growth)}>{formatPercent(f.revenue_growth)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={f.net_income != null && f.net_income < 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                        {formatMillions(f.net_income)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex items-center justify-center gap-1">
                        <GrowthIndicator value={f.net_income_growth} />
                        <span className={signClass(f.net_income_growth)}>{formatPercent(f.net_income_growth)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatNumber(f.eps)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatNumber(f.pe_ratio)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={f.dividend ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                        {formatNumber(f.dividend)}
                      </span>
                    </td>
                  </>
                ) : (
                  <>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${signClass(f.net_margin)}`}>
                      {formatPercent(f.net_margin, false)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${signClass(f.operating_margin)}`}>
                      {formatPercent(f.operating_margin, false)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${signClass(f.roe)}`}>
                      {formatPercent(f.roe, false)}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${signClass(f.roa)}`}>
                      {formatPercent(f.roa, false)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatMillions(f.total_capitaux_propres)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatMillions(f.total_actif)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatMillions(f.total_dettes_financieres)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatNumber(gearing)}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 text-xs text-gray-500">
        {view === 'results' ? (
          <p>CA = Chiffre d'Affaires | RN = Résultat Net | BNPA = Bénéfice Net Par Action | PER = Price-to-Earnings (cours de clôture de l'exercice / BNPA)</p>
        ) : (
          <p>
            Marge nette = RN / CA | Marge op. = Résultat d'exploitation / CA | ROE = RN / Capitaux propres | ROA = RN / Total actif |
            Dette/CP = Dettes financières / Capitaux propres
          </p>
        )}
        <p className="mt-1">
          Montants en millions de FCFA. Le PER n'est pas calculé lorsque le résultat net est négatif, ni le ROE lorsque les
          capitaux propres sont négatifs.
        </p>
      </div>
    </div>
  );
}
