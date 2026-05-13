import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface EvolutionRow {
  ticker: string;
  prevCours: number;
  currCours: number;
  pct: number;
}

interface Props {
  evolutions: EvolutionRow[];
  prevYear: number;
  year: number;
  prevHoldings: Record<string, number>;
}

export default function MarketEvolutionCard({ evolutions, prevYear, year, prevHoldings }: Props) {
  if (evolutions.length === 0) return null;

  // Sort: held positions first, then by absolute % descending
  const sorted = [...evolutions].sort((a, b) => {
    const aHeld = (prevHoldings[a.ticker] ?? 0) > 0 ? 1 : 0;
    const bHeld = (prevHoldings[b.ticker] ?? 0) > 0 ? 1 : 0;
    if (aHeld !== bHeld) return bHeld - aHeld;
    return Math.abs(b.pct) - Math.abs(a.pct);
  });

  const gainers = evolutions.filter(e => e.pct > 0).length;
  const losers  = evolutions.filter(e => e.pct < 0).length;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-sky-500 rounded-full inline-block" />
          Marchés — <span className="text-amber-600">{prevYear}</span>
          <span className="text-gray-300 mx-0.5">→</span>
          <span className="text-amber-600">{year}</span>
        </h2>
        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
            {gainers} ↑
          </span>
          <span className="bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">
            {losers} ↓
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="space-y-1.5">
        {sorted.map(({ ticker, prevCours, currCours, pct }) => {
          const held = (prevHoldings[ticker] ?? 0) > 0;
          const pos = pct > 0;
          const flat = Math.abs(pct) < 0.1;

          return (
            <div
              key={ticker}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors ${
                held
                  ? pos
                    ? 'bg-emerald-50 border-emerald-200'
                    : flat
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-100'
              }`}
            >
              {/* Ticker + held badge */}
              <div className="w-16 shrink-0">
                <p className="text-xs font-bold text-gray-900">{ticker}</p>
                {held && (
                  <span className="text-[9px] font-semibold text-violet-600">
                    ×{prevHoldings[ticker]}
                  </span>
                )}
              </div>

              {/* Price journey */}
              <div className="flex-1 flex items-center gap-1.5 text-[10px] text-gray-500 tabular-nums min-w-0">
                <span className="font-semibold text-gray-700">{prevCours.toLocaleString('fr-FR')}</span>
                <span className="text-gray-300">→</span>
                <span className={`font-bold ${pos ? 'text-emerald-700' : flat ? 'text-gray-600' : 'text-red-600'}`}>
                  {currCours.toLocaleString('fr-FR')}
                </span>
                <span className="text-gray-300 text-[9px]">FCFA</span>
              </div>

              {/* % badge */}
              <div className={`shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                pos
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                  : flat
                  ? 'bg-gray-100 text-gray-500 border-gray-200'
                  : 'bg-red-100 text-red-600 border-red-300'
              }`}>
                {flat
                  ? <Minus className="w-2.5 h-2.5" />
                  : pos
                  ? <TrendingUp className="w-2.5 h-2.5" />
                  : <TrendingDown className="w-2.5 h-2.5" />
                }
                {pos ? '+' : ''}{pct.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-gray-400 text-center">
        Les cours affichés sont ceux de fin {prevYear} (gauche) et début {year} (droite) — prix réels BRVM.
      </p>
    </div>
  );
}
