import { Wallet, AlertCircle } from 'lucide-react';
import StockRow from './StockRow';

interface Props {
  tickers: string[];
  allocation: Record<string, number>;
  fundamentals: Record<string, any>;
  availableCapital: number;
  totalBudget: number;
  onQtyChange: (ticker: string, qty: number) => void;
}

export default function AllocationZone({
  tickers,
  allocation,
  fundamentals,
  availableCapital,
  totalBudget,
  onQtyChange,
}: Props) {
  const spent = totalBudget - availableCapital;
  const pctSpent = totalBudget > 0 ? Math.min((spent / totalBudget) * 100, 100) : 0;
  const overBudget = availableCapital < 0;

  return (
    <div className="space-y-4">
      {/* Budget tracker */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-700">Budget disponible</span>
          </div>
          <span className={`text-sm font-bold ${overBudget ? 'text-red-600' : 'text-emerald-600'}`}>
            {Math.round(availableCapital).toLocaleString('fr-FR')} FCFA
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${overBudget ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${pctSpent}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-400">
          <span>0</span>
          <span>{Math.round(totalBudget).toLocaleString('fr-FR')} FCFA</span>
        </div>

        {overBudget && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Budget dépassé — réduisez votre allocation.</span>
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
            fundData={fundamentals[ticker] ?? {}}
            onQtyChange={onQtyChange}
            maxAffordable={Math.max(0, availableCapital)}
          />
        ))}
      </div>
    </div>
  );
}
