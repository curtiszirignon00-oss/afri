import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { OverridableLine, ProjectedYear, Projection } from '../../lib/valuation';
import { NAVY, ORANGE, formatMillions, formatPercent } from './ValuationFormat';

type LineDef = {
  key: OverridableLine | 'revenueGrowth' | 'operatingMargin' | 'tax' | 'deltaWorkingCapital' | 'fcff' | 'earningsPerShare' | 'workingCapitalRatio';
  label: string;
  /** Une ligne éditable porte un override ; les autres sont dérivées. */
  editable: boolean;
  format: 'millions' | 'percent' | 'perShare';
  emphasis?: boolean;
  indent?: boolean;
};

const LINES: LineDef[] = [
  { key: 'revenue', label: "Chiffre d'affaires", editable: true, format: 'millions', emphasis: true },
  { key: 'revenueGrowth', label: 'Croissance', editable: false, format: 'percent', indent: true },
  { key: 'operatingIncome', label: "Résultat d'exploitation", editable: true, format: 'millions' },
  { key: 'operatingMargin', label: "Marge d'exploitation", editable: false, format: 'percent', indent: true },
  { key: 'tax', label: 'Impôt théorique', editable: false, format: 'millions', indent: true },
  { key: 'depreciation', label: 'Dotations aux amortissements', editable: true, format: 'millions' },
  { key: 'capex', label: 'Investissements', editable: true, format: 'millions' },
  { key: 'workingCapital', label: 'BFR', editable: true, format: 'millions' },
  { key: 'workingCapitalRatio', label: 'BFR / CA', editable: false, format: 'percent', indent: true },
  { key: 'deltaWorkingCapital', label: 'Variation du BFR', editable: false, format: 'millions', indent: true },
  { key: 'fcff', label: 'Flux de trésorerie disponible', editable: false, format: 'millions', emphasis: true },
  { key: 'netIncome', label: 'Résultat net', editable: true, format: 'millions' },
  { key: 'earningsPerShare', label: 'Résultat par action', editable: false, format: 'perShare', indent: true },
  { key: 'dividendPerShare', label: 'Dividende par action', editable: true, format: 'perShare', emphasis: true }
];

function rawValue(year: ProjectedYear, key: LineDef['key']): number {
  switch (key) {
    case 'revenue':
    case 'operatingIncome':
    case 'depreciation':
    case 'capex':
    case 'workingCapital':
    case 'netIncome':
    case 'dividendPerShare':
      return year[key].value;
    default:
      return year[key] as number;
  }
}

function isForced(year: ProjectedYear, key: LineDef['key']): boolean {
  switch (key) {
    case 'revenue':
    case 'operatingIncome':
    case 'depreciation':
    case 'capex':
    case 'workingCapital':
    case 'netIncome':
    case 'dividendPerShare':
      return year[key].forced;
    default:
      return false;
  }
}

/**
 * Vue projection complète : tous les postes × tous les exercices. Les lignes
 * éditables se forcent cellule par cellule ; une cellule forcée porte un badge et
 * se remet au calcul automatique d'un clic. Les lignes dérivées se recalculent.
 */
export default function ProjectionGrid({
  projection,
  onOverride,
  onClearAll,
  readOnly = false
}: {
  projection: Projection;
  onOverride: (line: OverridableLine, year: number, value: number | null) => void;
  onClearAll: () => void;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState<{ line: OverridableLine; year: number } | null>(null);
  const [draft, setDraft] = useState('');

  const years = projection.years;
  const forcedCount = years.reduce(
    (a, y) => a + LINES.filter((l) => l.editable && isForced(y, l.key)).length,
    0
  );

  const format = (v: number, kind: LineDef['format']) => {
    if (kind === 'percent') return formatPercent(v, 2);
    if (kind === 'perShare') return `${Math.round(v).toLocaleString('fr-FR')}`;
    return formatMillions(v);
  };

  const commit = (line: OverridableLine, year: number) => {
    const v = Number(draft.replace(',', '.'));
    onOverride(line, year, Number.isFinite(v) ? v : null);
    setEditing(null);
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold" style={{ color: NAVY }}>
            Projection
          </h3>
          <p className="text-sm text-gray-500">
            Montants en millions de FCFA, valeurs par action en FCFA. Cliquez une cellule
            grasse pour la forcer.
          </p>
        </div>
        {forcedCount > 0 && !readOnly && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {forcedCount} valeur{forcedCount > 1 ? 's' : ''} forcée{forcedCount > 1 ? 's' : ''}
          </button>
        )}
      </header>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 pr-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                Poste
              </th>
              {years.map((y) => (
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
            {LINES.map((line) => (
              <tr key={line.key} className="border-b border-gray-50 last:border-0">
                <td
                  className={`py-1.5 pr-4 whitespace-nowrap ${
                    line.emphasis ? 'font-bold' : line.indent ? 'pl-4 text-gray-500' : 'text-gray-700'
                  }`}
                  style={line.emphasis ? { color: NAVY } : undefined}
                >
                  {line.label}
                </td>

                {years.map((y) => {
                  const value = rawValue(y, line.key);
                  const forced = isForced(y, line.key);
                  const isEditing =
                    editing?.line === (line.key as OverridableLine) && editing.year === y.year;

                  if (isEditing) {
                    return (
                      <td key={y.year} className="py-1 px-1">
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={() => commit(line.key as OverridableLine, y.year)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commit(line.key as OverridableLine, y.year);
                            if (e.key === 'Escape') setEditing(null);
                          }}
                          className="w-full rounded border border-orange-500 px-1.5 py-1 text-right text-sm tabular-nums focus:outline-none"
                        />
                      </td>
                    );
                  }

                  const clickable = line.editable && !readOnly;
                  return (
                    <td
                      key={y.year}
                      onClick={
                        clickable
                          ? () => {
                              setDraft(String(Number(value.toFixed(4))));
                              setEditing({ line: line.key as OverridableLine, year: y.year });
                            }
                          : undefined
                      }
                      title={forced ? `Calcul automatique : ${format(rawValue(y, line.key), line.format)}` : undefined}
                      className={`py-1.5 px-2 text-right tabular-nums ${
                        line.emphasis ? 'font-bold' : line.indent ? 'text-gray-500' : 'text-gray-800'
                      } ${clickable ? 'cursor-pointer rounded hover:bg-orange-50' : ''} ${
                        line.key === 'fcff' && value < 0 ? 'text-red-600' : ''
                      }`}
                      style={line.emphasis && !(line.key === 'fcff' && value < 0) ? { color: NAVY } : undefined}
                    >
                      {format(value, line.format)}
                      {forced && (
                        <>
                          <span
                            className="ml-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                            style={{ backgroundColor: ORANGE }}
                            aria-label="valeur forcée"
                          />
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOverride(line.key as OverridableLine, y.year, null);
                              }}
                              className="ml-1 text-[10px] text-gray-400 hover:text-gray-700"
                              title="Revenir au calcul automatique"
                            >
                              ↺
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-gray-400">
        Une valeur forcée est marquée d'un point orange ; les exercices suivants se
        recalculent à partir d'elle.
      </p>
    </section>
  );
}
