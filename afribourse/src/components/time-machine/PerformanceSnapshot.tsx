import { TrendingUp, TrendingDown, Wallet, BarChart3 } from 'lucide-react';

interface StepPerf {
  pfVal: number;
  pfDivCum: number;
  perfCapital: number;
  perfTotal: number;
  cagr?: number;
  byTicker?: Array<{ ticker: string; qty: number; prix: number; valeur: number; gain: number; gainPct: number }>;
}

interface Props {
  perf: StepPerf;
  year: number;
  capital: number;
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

export default function PerformanceSnapshot({ perf, year, capital }: Props) {
  return (
    <div className="space-y-4">
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

      {/* By ticker table */}
      {perf.byTicker && perf.byTicker.length > 0 && (
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
                  <td className="px-4 py-2.5 text-right text-gray-500 tabular-nums">{Math.round(row.valeur).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-2.5 text-right">
                    <PerfPill value={row.gainPct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
