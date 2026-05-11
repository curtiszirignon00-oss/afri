import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

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

function PerfPill({ value }: { value: number }) {
  const pos = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${pos ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
      {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pos ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}

export default function PerformanceSnapshot({ perf, year, capital }: Props) {
  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Valeur PF</p>
          <p className="text-base font-bold text-gray-900">{Math.round(perf.pfVal).toLocaleString('fr-FR')}</p>
          <p className="text-[10px] text-gray-400">FCFA</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Dividendes</p>
          <p className="text-base font-bold text-gray-900">{Math.round(perf.pfDivCum).toLocaleString('fr-FR')}</p>
          <p className="text-[10px] text-gray-400">FCFA cumulés</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Perf. capital</p>
          <PerfPill value={perf.perfCapital} />
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Perf. totale</p>
          <PerfPill value={perf.perfTotal} />
        </div>
      </div>

      {/* By ticker table */}
      {perf.byTicker && perf.byTicker.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-2">Titre</th>
                <th className="text-right px-4 py-2">Qté</th>
                <th className="text-right px-4 py-2">Valeur</th>
                <th className="text-right px-4 py-2">Gain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {perf.byTicker.map(row => (
                <tr key={row.ticker} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-bold text-gray-900">{row.ticker}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{row.qty}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{Math.round(row.valeur).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-2 text-right">
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
