import { TrendingUp, TrendingDown, Wallet, BarChart3, ArrowRight } from 'lucide-react';

interface StepPerf {
  pfVal: number;
  pfDivCum: number;
  perfCapital: number;
  perfTotal: number;
  cagr?: number;
  byTicker?: Array<{ ticker: string; qty: number; prix: number; valeur: number; gain: number; gainPct: number }>;
}

interface MarketMove {
  ticker: string;
  prevCours: number;
  currCours: number;
  pct: number;
}

interface Props {
  perf: StepPerf;
  year: number;
  capital: number;
  prevYear?: number;
  marketEvolution?: MarketMove[];
}

function PerfPill({ value }: { value: number | undefined | null }) {
  if (value === undefined || value === null || isNaN(value)) return <span className="text-xs text-gray-400">—</span>;
  const pos = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
      pos ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
    }`}>
      {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pos ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

function CoursMove({ move, held }: { move: MarketMove; held: boolean }) {
  const pos = move.pct >= 0;
  return (
    <div className={`flex flex-col gap-1.5 p-3 rounded-xl border transition-all ${
      held
        ? pos
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-red-50 border-red-200'
        : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Ticker + badge "détenu" */}
      <div className="flex items-center justify-between gap-1">
        <span className={`text-xs font-extrabold ${held ? (pos ? 'text-emerald-800' : 'text-red-700') : 'text-gray-700'}`}>
          {move.ticker}
        </span>
        {held && (
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
            pos ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-600 border-red-200'
          }`}>
            détenu
          </span>
        )}
      </div>

      {/* Prix précédent → prix actuel */}
      <div className="flex items-center gap-1 text-[10px] text-gray-500">
        <span className="tabular-nums">{move.prevCours.toLocaleString('fr-FR')}</span>
        <ArrowRight className="w-2.5 h-2.5 shrink-0 text-gray-400" />
        <span className={`font-semibold tabular-nums ${pos ? 'text-emerald-700' : 'text-red-600'}`}>
          {move.currCours.toLocaleString('fr-FR')}
        </span>
      </div>

      {/* % évolution */}
      <span className={`self-start inline-flex items-center gap-0.5 text-[11px] font-bold ${pos ? 'text-emerald-700' : 'text-red-600'}`}>
        {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {pos ? '+' : ''}{move.pct.toFixed(1)}%
      </span>
    </div>
  );
}

export default function PerformanceSnapshot({ perf, year, capital, prevYear, marketEvolution = [] }: Props) {
  const heldTickers = new Set((perf.byTicker ?? []).filter(r => r.qty > 0).map(r => r.ticker));

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Wallet className="w-3 h-3 text-gray-400" />
            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Valeur PF</p>
          </div>
          <p className="text-base font-extrabold text-gray-900 tabular-nums">{Math.round(perf.pfVal ?? 0).toLocaleString('fr-FR')}</p>
          <p className="text-[9px] text-gray-400 mt-0.5">FCFA</p>
        </div>

        <div className="bg-amber-50 border border-amber-100 shadow-sm rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BarChart3 className="w-3 h-3 text-amber-400" />
            <p className="text-[9px] text-amber-500 uppercase font-bold tracking-widest">Dividendes</p>
          </div>
          <p className="text-base font-extrabold text-amber-600 tabular-nums">{Math.round(perf.pfDivCum ?? 0).toLocaleString('fr-FR')}</p>
          <p className="text-[9px] text-amber-400 mt-0.5">FCFA cumulés</p>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-3 flex flex-col items-center justify-center gap-2">
          <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Perf. capital</p>
          <PerfPill value={perf.perfCapital} />
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-3 flex flex-col items-center justify-center gap-2">
          <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Perf. totale</p>
          <PerfPill value={perf.perfTotal} />
        </div>
      </div>

      {/* Market evolution — évolution des cours entre les deux années */}
      {marketEvolution.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">
              Évolution des cours
            </p>
            {prevYear && (
              <span className="text-[10px] text-gray-400 font-medium">
                {prevYear} → {year}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {marketEvolution
              .sort((a, b) => {
                // Titres détenus en premier, puis par performance décroissante
                const aHeld = heldTickers.has(a.ticker) ? 1 : 0;
                const bHeld = heldTickers.has(b.ticker) ? 1 : 0;
                if (aHeld !== bHeld) return bHeld - aHeld;
                return b.pct - a.pct;
              })
              .map(move => (
                <CoursMove
                  key={move.ticker}
                  move={move}
                  held={heldTickers.has(move.ticker)}
                />
              ))}
          </div>
        </div>
      )}

      {/* By ticker table — positions détenues */}
      {perf.byTicker && perf.byTicker.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Vos positions</p>
          <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Titre</th>
                  <th className="text-right px-4 py-2.5 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Qté</th>
                  <th className="text-right px-4 py-2.5 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Valeur</th>
                  <th className="text-right px-4 py-2.5 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Gain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {perf.byTicker.map(row => (
                  <tr key={row.ticker} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-gray-900">{row.ticker}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500 tabular-nums">{row.qty}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500 tabular-nums">{Math.round(row.valeur ?? 0).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-2.5 text-right">
                      <PerfPill value={row.gainPct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
