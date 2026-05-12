import { Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';

interface FundData {
  cours?: number;
  [key: string]: any;
}

interface Props {
  ticker: string;
  qty: number;
  prevQty: number;
  fundData: FundData;
  prevCours?: number;
  onQtyChange: (ticker: string, qty: number) => void;
  cash: number;
}

const COMMISSION_BUY  = 0.012;
const COMMISSION_SELL = 0.006;

export default function StockRow({ ticker, qty, prevQty, fundData, prevCours, onQtyChange, cash }: Props) {
  const cours = fundData?.cours ?? 0;
  const delta = qty - prevQty;
  const canBuyMore = !(cours > 0 && cours * (1 + COMMISSION_BUY) > cash + 1);

  // Évolution du cours depuis l'étape précédente
  const evolution = prevCours && prevCours > 0 && cours > 0
    ? ((cours - prevCours) / prevCours) * 100
    : null;

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
    ? 'border-emerald-300 bg-emerald-50 hover:border-emerald-400'
    : delta < 0
    ? 'border-red-300 bg-red-50 hover:border-red-400'
    : 'border-gray-200 bg-white hover:border-amber-300';

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 border rounded-xl transition-all duration-150 ${borderCls}`}>
      {/* Ticker + info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-sm text-gray-900">{ticker}</p>
          {delta > 0 && (
            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
              +{delta} achat
            </span>
          )}
          {delta < 0 && (
            <span className="text-[9px] font-bold bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">
              {delta} vente
            </span>
          )}
          {prevQty > 0 && qty === prevQty && (
            <span className="text-[9px] font-bold bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full">
              conservé
            </span>
          )}
        </div>

        {/* Prix courant + évolution depuis étape précédente */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-[10px] text-gray-500">
            {cours > 0 ? `${cours.toLocaleString('fr-FR')} FCFA` : '—'}
          </p>

          {evolution !== null && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
              evolution >= 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {evolution >= 0
                ? <TrendingUp className="w-2.5 h-2.5" />
                : <TrendingDown className="w-2.5 h-2.5" />
              }
              {evolution >= 0 ? '+' : ''}{evolution.toFixed(1)}%
            </span>
          )}

          {cours > 0 && delta > 0 && <span className="text-[9px] text-gray-300">· +1.2% SGI</span>}
          {cours > 0 && delta < 0 && <span className="text-[9px] text-gray-300">· −0.6% SGI</span>}
        </div>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={decrement}
          disabled={qty <= 0}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 disabled:opacity-30 flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer"
        >
          <Minus className="w-3 h-3 text-gray-500" />
        </button>

        <input
          type="number"
          min={0}
          value={qty}
          onChange={handleInput}
          className="w-14 text-center text-sm font-bold bg-white border border-gray-200 rounded-lg py-1 text-gray-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
        />

        <button
          onClick={increment}
          disabled={!canBuyMore}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-emerald-100 hover:text-emerald-600 disabled:opacity-30 flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-90 cursor-pointer"
        >
          <Plus className="w-3 h-3 text-gray-500" />
        </button>
      </div>

      {/* Value */}
      <div className="text-right shrink-0 min-w-[80px]">
        {totalValue > 0 ? (
          <>
            <p className="text-sm font-bold text-gray-900 tabular-nums">{Math.round(totalValue).toLocaleString('fr-FR')}</p>
            <p className="text-[9px] text-gray-400">FCFA</p>
          </>
        ) : (
          <p className="text-sm text-gray-300">—</p>
        )}
      </div>
    </div>
  );
}
