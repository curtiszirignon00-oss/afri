import type { ValuationEngineResult } from '../../lib/valuation';
import { NAVY, ORANGE, formatPerShare, formatUpside } from './ValuationFormat';

type Row = { key: keyof ValuationEngineResult['range']; label: string };

const ROWS: Row[] = [
  { key: 'dcf', label: 'DCF (flux de trésorerie)' },
  { key: 'ddmGordon', label: 'DDM Gordon (1 phase)' },
  { key: 'ddmTwoStage', label: 'DDM 2 phases' },
  { key: 'anc', label: 'Actif net comptable' },
  { key: 'weighted', label: 'Synthèse pondérée' }
];

/**
 * Football field : pour chaque méthode, la fourchette min-max sur les trois
 * scénarios, la valeur du cas de base, et le cours pour repère. On n'affiche
 * jamais un chiffre unique sans sa fourchette.
 */
export default function FootballField({ result }: { result: ValuationEngineResult }) {
  const price = result.price;

  // Échelle commune à toutes les barres, cours inclus, pour que les longueurs
  // soient comparables d'une méthode à l'autre.
  const values = ROWS.flatMap((r) => [result.range[r.key].min, result.range[r.key].max]);
  if (price !== null) values.push(price);
  const rawMin = Math.min(...values, 0);
  const rawMax = Math.max(...values, 0);
  const span = rawMax - rawMin || 1;
  const pad = span * 0.06;
  const min = rawMin - pad;
  const max = rawMax + pad;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <header className="mb-1">
        <h3 className="text-lg font-bold" style={{ color: NAVY }}>
          Fourchettes de valorisation
        </h3>
        <p className="text-sm text-gray-500">
          Amplitude sur les trois scénarios. Le trait vertical marque le cas de base.
        </p>
      </header>

      <div className="mt-6 space-y-5">
        {ROWS.map((row) => {
          const { min: lo, max: hi } = result.range[row.key];
          const base = result.values.base[row.key];
          const flat = Math.abs(hi - lo) < 1e-6;

          return (
            <div key={row.key}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">{row.label}</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: NAVY }}>
                  {flat ? formatPerShare(base) : `${formatPerShare(lo)} — ${formatPerShare(hi)}`}
                </span>
              </div>

              <div className="relative h-7 rounded bg-gray-100">
                {/* Repère du zéro, utile dès qu'une méthode ressort négative. */}
                {min < 0 && max > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-gray-400"
                    style={{ left: `${pct(0)}%` }}
                    aria-hidden
                  />
                )}
                <div
                  className="absolute top-1 bottom-1 rounded"
                  style={{
                    left: `${pct(lo)}%`,
                    width: `${Math.max(pct(hi) - pct(lo), 0.6)}%`,
                    backgroundColor: row.key === 'weighted' ? ORANGE : NAVY,
                    opacity: row.key === 'weighted' ? 0.9 : 0.35
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-900"
                  style={{ left: `${pct(base)}%` }}
                  title={`Cas de base : ${formatPerShare(base)}`}
                />
                {price !== null && (
                  <div
                    className="absolute -top-1 -bottom-1 w-0.5"
                    style={{ left: `${pct(price)}%`, backgroundColor: ORANGE }}
                    title={`Cours : ${formatPerShare(price)}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {price !== null && (
        <footer className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <div>
            <span className="text-xs uppercase tracking-wide text-gray-500">Cours</span>
            <p className="text-lg font-bold" style={{ color: ORANGE }}>
              {formatPerShare(price)}
            </p>
          </div>
          {(['pessimistic', 'base', 'optimistic'] as const).map((id) => {
            const up = formatUpside(result.upside[id]);
            return (
              <div key={id}>
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  {id === 'pessimistic' ? 'Pessimiste' : id === 'base' ? 'Base' : 'Optimiste'}
                </span>
                <p className={`text-lg font-bold ${up.className}`}>{up.text}</p>
              </div>
            );
          })}
        </footer>
      )}
    </section>
  );
}
