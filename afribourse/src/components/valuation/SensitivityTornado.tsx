import type { SensitivityBar, SensitivityDriver } from '../../lib/valuation';
import { NAVY, ORANGE, formatPerShare } from './ValuationFormat';

const DRIVER_LABELS: Record<SensitivityDriver, string> = {
  revenueGrowthRest: 'Croissance du CA',
  operatingMarginRest: "Marge d'exploitation",
  capexRatio: 'Investissements / CA',
  workingCapitalRatioTarget: 'BFR / CA (cible)',
  wacc: 'WACC',
  gTerminal: "Croissance à l'infini (g)"
};

/**
 * Tornado de sensibilité du prix DCF. L'amplitude de choc de chaque driver est
 * la demi-amplitude entre le scénario optimiste et le pessimiste : un choc
 * uniforme ne comparerait rien, 1 point sur g étant un mouvement bien plus
 * large en relatif qu'1 point sur un ratio de BFR de 55 %.
 */
export default function SensitivityTornado({ bars }: { bars: SensitivityBar[] }) {
  const usable = bars.filter((b) => Number.isFinite(b.low) && Number.isFinite(b.high));
  if (usable.length === 0) {
    return (
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold" style={{ color: NAVY }}>
          Sensibilité
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Aucun choc calculable : les hypothèses actuelles violent le garde-fou WACC &gt; g.
        </p>
      </section>
    );
  }

  const base = usable[0].base;
  const extremes = usable.flatMap((b) => [b.low, b.high, base]);
  const min = Math.min(...extremes);
  const max = Math.max(...extremes);
  const span = max - min || 1;
  const pct = (v: number) => ((v - min) / span) * 100;
  const basePct = pct(base);

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <header>
        <h3 className="text-lg font-bold" style={{ color: NAVY }}>
          Sensibilité du prix DCF
        </h3>
        <p className="text-sm text-gray-500">
          Impact de chaque driver, choqué de sa demi-amplitude entre scénarios. Cas de base :{' '}
          <strong style={{ color: NAVY }}>{formatPerShare(base)}</strong>.
        </p>
      </header>

      <div className="mt-6 space-y-4">
        {usable.map((bar) => {
          const lo = Math.min(bar.low, bar.high);
          const hi = Math.max(bar.low, bar.high);
          return (
            <div key={bar.driver}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {DRIVER_LABELS[bar.driver]}
                  <span className="ml-1.5 text-xs font-normal text-gray-400">
                    ±{(bar.shock * 100).toFixed(bar.shock < 0.01 ? 2 : 1).replace('.', ',')} pt
                    {bar.shockSource === 'DEFAULT' && ' (défaut)'}
                  </span>
                </span>
                <span className="text-xs tabular-nums text-gray-500">
                  {formatPerShare(lo)} → {formatPerShare(hi)}
                </span>
              </div>
              <div className="relative h-6 rounded bg-gray-100">
                <div
                  className="absolute top-1 bottom-1 rounded"
                  style={{
                    left: `${pct(lo)}%`,
                    width: `${Math.max(pct(hi) - pct(lo), 0.6)}%`,
                    backgroundColor: NAVY,
                    opacity: 0.35
                  }}
                />
                {/* Axe du cas de base : la lecture se fait par l'écart à ce trait. */}
                <div
                  className="absolute top-0 bottom-0 w-0.5"
                  style={{ left: `${basePct}%`, backgroundColor: ORANGE }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
