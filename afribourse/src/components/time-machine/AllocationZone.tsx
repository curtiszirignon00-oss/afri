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

  return (
    <div className="space-y-4">
      {/* Account summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">Cash disponible</p>
            </div>
            <p className={`text-base font-extrabold ${overBudget ? 'text-red-600' : 'text-blue-700'}`}>
              {Math.round(cash).toLocaleString('fr-FR')} F
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Briefcase className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Portefeuille</p>
            </div>
            <p className="text-base font-extrabold text-gray-700">
              {Math.round(portfolioValue).toLocaleString('fr-FR')} F
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
          <p className="text-xs text-gray-500 font-semibold">Total compte</p>
          <p className="text-sm font-extrabold text-gray-900">
            {Math.round(totalAccount).toLocaleString('fr-FR')} FCFA
          </p>
        </div>

        {overBudget && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
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
