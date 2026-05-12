import { Plus, Minus } from 'lucide-react';

interface FundData {
  cours?: number;
  [key: string]: any;
}

interface Props {
  ticker: string;
  qty: number;
  prevQty: number;
  fundData: FundData;
  onQtyChange: (ticker: string, qty: number) => void;
  cash: number;
}

const COMMISSION_BUY  = 0.012;
const COMMISSION_SELL = 0.006;

export default function StockRow({ ticker, qty, prevQty, fundData, onQtyChange, cash }: Props) {
  const cours = fundData?.cours ?? 0;
  const delta = qty - prevQty;
  const canBuyMore = !(cours > 0 && cours * (1 + COMMISSION_BUY) > cash + 1);

  function increment() {
    if (!canBuyMore) return;
    onQtyChange(ticker, qty + 1);
  }

  function decrement() {
    if (qty <= 0) return;
    onQtyChange(ticker, qty - 1);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value, 10);
    if (isNaN(v) || v < 0) return onQtyChange(ticker, 0);
    onQtyChange(ticker, v);
  }

  const totalValue = qty * cours;

  const borderCls = delta > 0
    ? 'border-emerald-500/30 bg-emerald-500/5'
    : delta < 0
    ? 'border-red-500/30 bg-red-500/5'
    : 'border-white/10 bg-white/5';

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 border rounded-xl hover:border-amber-500/30 transition-all duration-150 ${borderCls}`}>
      {/* Ticker + info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-sm text-white">{ticker}</p>
          {delta > 0 && (
            <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
              +{delta} achat
            </span>
          )}
          {delta < 0 && (
            <span className="text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">
              {delta} vente
            </span>
          )}
          {prevQty > 0 && qty === prevQty && (
            <span className="text-[9px] font-bold bg-white/5 text-slate-500 border border-white/10 px-1.5 py-0.5 rounded-full">
              conservé
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {cours > 0 ? `${cours.toLocaleString('fr-FR')} FCFA` : '—'}
          {cours > 0 && delta > 0 && <span className="text-slate-600"> · +1.2% SGI</span>}
          {cours > 0 && delta < 0 && <span className="text-slate-600"> · −0.6% SGI</span>}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={decrement}
          disabled={qty <= 0}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-20 flex items-center justify-center transition-all cursor-pointer"
        >
          <Minus className="w-3 h-3 text-slate-400" />
        </button>

        <input
          type="number"
          min={0}
          value={qty}
          onChange={handleInput}
          className="w-14 text-center text-sm font-bold bg-white/5 border border-white/10 rounded-lg py-1 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
        />

        <button
          onClick={increment}
          disabled={!canBuyMore}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 disabled:opacity-20 flex items-center justify-center transition-all cursor-pointer"
        >
          <Plus className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Value */}
      <div className="text-right shrink-0 min-w-[80px]">
        {totalValue > 0 ? (
          <>
            <p className="text-sm font-bold text-white">{Math.round(totalValue).toLocaleString('fr-FR')}</p>
            <p className="text-[9px] text-slate-600">FCFA</p>
          </>
        ) : (
          <p className="text-sm text-slate-700">—</p>
        )}
      </div>
    </div>
  );
}
