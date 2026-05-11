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

  function increment() {
    const addCost = cours * (1 + COMMISSION_BUY);
    if (addCost > cash + 1) return;
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

  let deltaBadge: React.ReactNode = null;
  if (delta > 0) {
    deltaBadge = (
      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
        +{delta} achat
      </span>
    );
  } else if (delta < 0) {
    deltaBadge = (
      <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
        {delta} vente
      </span>
    );
  } else if (prevQty > 0 && qty === prevQty) {
    deltaBadge = (
      <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
        conservé
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-white border rounded-xl hover:border-blue-200 transition-colors ${delta > 0 ? 'border-emerald-200' : delta < 0 ? 'border-red-200' : 'border-gray-100'}`}>
      {/* Ticker */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-sm text-gray-900">{ticker}</p>
          {deltaBadge}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {cours > 0 ? `${cours.toLocaleString('fr-FR')} FCFA` : '—'}
          {cours > 0 && delta > 0 && <span className="text-gray-400"> · +1.2% SGI</span>}
          {cours > 0 && delta < 0 && <span className="text-gray-400"> · −0.6% SGI</span>}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={decrement}
          disabled={qty <= 0}
          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100 disabled:opacity-30 flex items-center justify-center transition-colors"
        >
          <Minus className="w-3.5 h-3.5 text-gray-600" />
        </button>

        <input
          type="number"
          min={0}
          value={qty}
          onChange={handleInput}
          className="w-14 text-center text-sm font-bold border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        <button
          onClick={increment}
          disabled={cours > 0 && cours * (1 + COMMISSION_BUY) > cash + 1}
          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-green-100 disabled:opacity-30 flex items-center justify-center transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-gray-600" />
        </button>
      </div>

      {/* Value */}
      <div className="text-right shrink-0 min-w-[90px]">
        <p className="text-sm font-bold text-gray-900">
          {totalValue > 0 ? `${Math.round(totalValue).toLocaleString('fr-FR')}` : '—'}
        </p>
        {totalValue > 0 && <p className="text-[10px] text-gray-400">FCFA</p>}
      </div>
    </div>
  );
}
