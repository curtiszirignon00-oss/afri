// src/components/real-portfolio/RealPositionsTable.tsx
import { BarChart3, Share2, PlusCircle, MinusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { RealPositionLine } from '../../services/realPortfolioApi';
import { getStockLogo } from '../../utils/stockLogos';
import { sharePercentOnly } from './share';

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)} %`;
const tone = (n: number) => (n >= 0 ? 'text-emerald-600' : 'text-red-600');

interface Props {
  positions: RealPositionLine[];
  onBuy: (p: RealPositionLine) => void;
  onSell: (p: RealPositionLine) => void;
}

export default function RealPositionsTable({ positions, onBuy, onSell }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /> Mes positions</h3>
      {positions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Aucune ligne ouverte.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {positions.map(p => {
            const logo = getStockLogo(p.ticker);
            return (
              <div key={p.ticker} className="py-3 grid grid-cols-[1fr_auto] md:grid-cols-[1.6fr_1fr_1fr_1fr_auto] gap-x-4 gap-y-1 items-center">
                <button onClick={() => navigate(`/stock/${p.ticker}`)} className="flex items-center gap-3 text-left min-w-0">
                  {logo ? <img src={logo} alt="" className="w-9 h-9 rounded-lg object-contain bg-white border border-gray-100" /> : <span className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center">{p.ticker.slice(0, 3)}</span>}
                  <span className="min-w-0">
                    <span className="block font-semibold text-gray-900">{p.ticker}</span>
                    <span className="block text-xs text-gray-500 truncate">{p.name} · {fmt(p.quantity)} titres</span>
                  </span>
                </button>
                <div className="text-right md:text-left">
                  <p className="font-semibold text-gray-900">{fmt(p.marketValue)} F</p>
                  <p className="text-xs text-gray-500">{p.weight.toFixed(1)} % du total</p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-500 text-xs">PRU → cours</p>
                  <p className="text-gray-800">{fmt(p.averageCost)} → {fmt(p.lastPrice)} F</p>
                </div>
                <div className="text-sm text-right md:text-left">
                  <p className={`font-semibold ${tone(p.unrealizedPnl)}`}>{p.unrealizedPnl >= 0 ? '+' : ''}{fmt(p.unrealizedPnl)} F</p>
                  <p className={`text-xs ${tone(p.unrealizedPct)}`}>{pct(p.unrealizedPct)} · jour {pct(p.dayChangePct)}</p>
                </div>
                <div className="col-span-2 md:col-span-1 flex justify-end gap-1">
                  <button onClick={() => onBuy(p)} title="Enregistrer un achat" className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50"><PlusCircle className="w-4 h-4" /></button>
                  <button onClick={() => onSell(p)} title="Enregistrer une vente" className="p-2 rounded-lg text-red-600 hover:bg-red-50"><MinusCircle className="w-4 h-4" /></button>
                  <button
                    onClick={() => sharePercentOnly(`Ma ligne ${p.ticker} : ${pct(p.unrealizedPct)} depuis l'achat. Suivi sur AfriBourse.`)}
                    title="Partager (pourcentage uniquement)"
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
