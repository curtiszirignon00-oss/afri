import { Plus, Minus } from 'lucide-react';

interface FundData {
  cours?: number;
  [key: string]: any;
}

interface Props {
  ticker: string;
  qty: number;
  fundData: FundData;
  onQtyChange: (ticker: string, qty: number) => void;
  maxAffordable?: number;
}

const COMMISSION = 0.012;

export default function StockRow({ ticker, qty, fundData, onQtyChange, maxAffordable }: Props) {
  const cours = fundData?.cours ?? 0;
  const costPerShare = cours * (1 + COMMISSION);
  const totalCost = qty * costPerShare;

  function increment() {
    const next = qty + 1;
    if (maxAffordable !== undefined && next * costPerShare > (qty * costPerShare) + maxAffordable) return;
    onQtyChange(ticker, next);
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

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-blue-200 transition-colors">
      {/* Ticker */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-900">{ticker}</p>
        <p className="text-xs text-gray-500">
          {cours > 0 ? `${cours.toLocaleString('fr-FR')} FCFA` : '—'}
          {cours > 0 && <span className="text-gray-400"> · +1.2% SGI</span>}
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
          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-green-100 flex items-center justify-center transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-gray-600" />
        </button>
      </div>

      {/* Cost */}
      <div className="text-right shrink-0 min-w-[90px]">
        <p className="text-sm font-bold text-gray-900">
          {totalCost > 0 ? `${Math.round(totalCost).toLocaleString('fr-FR')}` : '—'}
        </p>
        {totalCost > 0 && <p className="text-[10px] text-gray-400">FCFA</p>}
      </div>
    </div>
  );
}
