import { Wallet, Briefcase, AlertCircle } from 'lucide-react';
import StockRow from './StockRow';

interface Props {
  tickers: string[];
  allocation: Record<string, number>;
  prevHoldings: Record<string, number>;
  fundamentals: Record<string, any>;
  cash: number;
  portfolioValue: number;
  onQtyChange: (ticker: string, qty: number) => void;
}

export default function AllocationZone({
  tickers,
  allocation,
  prevHoldings,
  fundamentals,
  cash,
  portfolioValue,
  onQtyChange,
}: Props) {
  const totalAccount = portfolioValue + Math.max(0, cash);
  const overBudget = cash < 0;
  const cashPct = totalAccount > 0 ? (Math.max(0, cash) / totalAccount) * 100 : 0;
  const pfPct = totalAccount > 0 ? (portfolioValue / totalAccount) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Account summary */}
      <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Cash</p>
            </div>
            <p className={`text-base font-extrabold ${overBudget ? 'text-red-400' : 'text-amber-400'}`}>
              {Math.round(cash).toLocaleString('fr-FR')} F
            </p>
            {!overBudget && totalAccount > 0 && (
              <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${cashPct}%` }} />
              </div>
            )}
          </div>

          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Briefcase className="w-3.5 h-3.5 text-violet-400" />
              <p className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">Portefeuille</p>
            </div>
            <p className="text-base font-extrabold text-violet-400">
              {Math.round(portfolioValue).toLocaleString('fr-FR')} F
            </p>
            {totalAccount > 0 && (
              <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pfPct}%` }} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-2">
          <p className="text-xs text-slate-500 font-semibold">Total compte</p>
          <p className="text-sm font-extrabold text-white">
            {Math.round(totalAccount).toLocaleString('fr-FR')} FCFA
          </p>
        </div>

        {overBudget && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Cash insuffisant — vendez des positions ou réduisez vos achats.</span>
          </div>
        )}
      </div>

      {/* Stock rows */}
      <div className="space-y-2">
        {tickers.map(ticker => (
          <StockRow
            key={ticker}
            ticker={ticker}
            qty={allocation[ticker] ?? 0}
            prevQty={prevHoldings[ticker] ?? 0}
            fundData={fundamentals[ticker] ?? {}}
            onQtyChange={onQtyChange}
            cash={cash}
          />
        ))}
      </div>
    </div>
  );
}
