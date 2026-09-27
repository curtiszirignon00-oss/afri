import type { HistoricalYear } from '../../lib/valuation';
import { NAVY, formatMillions, formatPercent } from './ValuationFormat';

type Row = {
  key: keyof HistoricalYear;
  label: string;
  format: 'millions' | 'percent' | 'perShare';
  emphasis?: boolean;
  indent?: boolean;
};

// Série historique retraitée : les postes publiés (CA, REX, RN, capitaux propres)
// et les retraitements qui nourrissent la projection (capex reconstruit, BFR,
// dette nette, FCFF). C'est la matière première sur laquelle les drivers sont calibrés.
const ROWS: Row[] = [
  { key: 'revenue', label: "Chiffre d'affaires", format: 'millions', emphasis: true },
  { key: 'revenueGrowth', label: 'Croissance', format: 'percent', indent: true },
  { key: 'operatingIncome', label: "Résultat d'exploitation", format: 'millions' },
  { key: 'operatingMargin', label: "Marge d'exploitation", format: 'percent', indent: true },
  { key: 'depreciation', label: 'Dotations aux amortissements', format: 'millions' },
  { key: 'capex', label: 'Investissements (reconstruits)', format: 'millions' },
  { key: 'workingCapital', label: 'BFR', format: 'millions' },
  { key: 'workingCapitalRatio', label: 'BFR / CA', format: 'percent', indent: true },
  { key: 'deltaWorkingCapital', label: 'Variation du BFR', format: 'millions', indent: true },
  { key: 'fcff', label: 'Flux de trésorerie disponible', format: 'millions', emphasis: true },
  { key: 'netIncome', label: 'Résultat net', format: 'millions' },
  { key: 'netMargin', label: 'Marge nette', format: 'percent', indent: true },
  { key: 'equity', label: 'Capitaux propres', format: 'millions' },
  { key: 'netDebt', label: 'Dette nette', format: 'millions' },
  { key: 'economicAsset', label: 'Actif économique', format: 'millions' },
  { key: 'dividendPerShare', label: 'Dividende par action', format: 'perShare' },
  { key: 'payoutRatio', label: 'Taux de distribution', format: 'percent', indent: true }
];

/**
 * Historique des états financiers retraités, transposé (postes en lignes,
 * exercices en colonnes) — pendant lecture seule de la grille de projection.
 */
export default function HistoricalStatements({ history }: { history: HistoricalYear[] }) {
  if (history.length === 0) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Aucun état financier historique disponible.</p>
      </section>
    );
  }

  const format = (v: number | null, kind: Row['format']) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
    if (kind === 'percent') return formatPercent(v, 2);
    if (kind === 'perShare') return Math.round(v).toLocaleString('fr-FR');
    return formatMillions(v);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <header>
        <h3 className="text-lg font-bold" style={{ color: NAVY }}>
          États financiers
        </h3>
        <p className="text-sm text-gray-500">
          Historique publié et retraité — montants en millions de FCFA, valeurs par action en FCFA.
          C'est sur ces exercices que les drivers de la projection sont calibrés.
        </p>
      </header>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 pr-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                Poste
              </th>
              {history.map((y) => (
                <th
                  key={y.year}
                  className="py-2 px-2 text-right text-xs font-bold uppercase tracking-wide text-gray-500"
                >
                  {y.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key} className="border-b border-gray-50 last:border-0">
                <td
                  className={`py-1.5 pr-4 whitespace-nowrap ${
                    row.emphasis ? 'font-bold' : row.indent ? 'pl-4 text-gray-500' : 'text-gray-700'
                  }`}
                  style={row.emphasis ? { color: NAVY } : undefined}
                >
                  {row.label}
                </td>
                {history.map((y) => {
                  const value = y[row.key];
                  const numeric = typeof value === 'number' ? value : null;
                  return (
                    <td
                      key={y.year}
                      className={`py-1.5 px-2 text-right tabular-nums ${
                        row.emphasis ? 'font-bold' : row.indent ? 'text-gray-500' : 'text-gray-800'
                      } ${row.key === 'fcff' && numeric !== null && numeric < 0 ? 'text-red-600' : ''}`}
                      style={
                        row.emphasis && !(row.key === 'fcff' && numeric !== null && numeric < 0)
                          ? { color: NAVY }
                          : undefined
                      }
                    >
                      {format(numeric, row.format)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-gray-400">
        Le capex est reconstruit (Δ immobilisations + amortissements ± cessions) ; la dette nette
        inclut les concours bancaires courants, hors BFR d'exploitation.
      </p>
    </section>
  );
}
