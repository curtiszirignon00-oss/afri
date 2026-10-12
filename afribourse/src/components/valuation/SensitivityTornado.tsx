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

/** Choc formaté en points de pourcentage. */
function shockLabel(shock: number): string {
  const pts = shock * 100;
  const s = pts < 1 ? pts.toFixed(2) : pts.toFixed(1);
  return `±${s.replace('.', ',')} pt`;
}

/**
 * Tornado de sensibilité du prix DCF. Pour chaque driver : le choc réel appliqué,
 * le prix bas et haut, et l'écart (en F et en %) par rapport au cas de base — trié
 * par impact. Une phrase de lecture dit de quoi la valo dépend et à quoi elle est
 * insensible : sans ça, le prix de base seul ne dit rien.
 */
export default function SensitivityTornado({ bars }: { bars: SensitivityBar[] }) {
  const usable = bars.filter((b) => Number.isFinite(b.low) && Number.isFinite(b.high));
  if (usable.length === 0) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-6">
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
  const swingPct = (b: SensitivityBar) => (base !== 0 ? b.swing / Math.abs(base) : 0);

  // Phrase de lecture : les deux drivers dominants, et le moins sensible.
  const top = usable.slice(0, 2).map((b) => DRIVER_LABELS[b.driver].toLowerCase());
  const least = DRIVER_LABELS[usable[usable.length - 1].driver].toLowerCase();

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <header>
        <h3 className="text-lg font-bold" style={{ color: NAVY }}>
          Sensibilité du prix DCF
        </h3>
        <p className="text-sm text-gray-500">
          De combien le prix DCF/action bouge quand on choque chaque hypothèse, de part et
          d'autre du cas de base (<strong style={{ color: NAVY }}>{formatPerShare(base)}</strong>).
          Trié par impact.
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
                  <span className="ml-1.5 text-xs font-normal text-gray-400">{shockLabel(bar.shock)}</span>
                </span>
                <span className="text-xs tabular-nums text-gray-500">
                  {formatPerShare(lo)} → {formatPerShare(hi)}
                  <span className="ml-2 font-semibold" style={{ color: NAVY }}>
                    ±{formatPerShare(bar.swing / 2)} ({(swingPct(bar) * 100).toFixed(0)} %)
                  </span>
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
                <div className="absolute top-0 bottom-0 w-0.5" style={{ left: `${basePct}%`, backgroundColor: ORANGE }} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-5 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
        <strong style={{ color: NAVY }}>Lecture.</strong> La valorisation dépend surtout de{' '}
        <strong>{top.join(' et ')}</strong> ; elle est peu sensible à <strong>{least}</strong>. Concentrez
        l'effort d'hypothèse sur les premiers.
      </p>
    </section>
  );
}
