// src/components/real-portfolio/RealPositionsTable.tsx
import { BarChart3, Share2, PlusCircle, MinusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RealPositionLine } from '../../services/realPortfolioApi';
import { getStockLogo } from '../../utils/stockLogos';
import { sharePercentOnly } from './share';

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)} %`;
const tone = (n: number) => (n >= 0 ? 'text-emerald-300' : 'text-rose-300');

interface Props {
  positions: RealPositionLine[];
  onBuy: (p: RealPositionLine) => void;
  onSell: (p: RealPositionLine) => void;
}

export default function RealPositionsTable({ positions, onBuy, onSell }: Props) {

  return (
    <div className="glass-card rounded-3xl p-5 md:p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-orange-300" /> Mes positions</h3>
      {positions.length === 0 ? (
        <p className="text-center text-white/55 py-8">Aucune ligne ouverte.</p>
      ) : (
        <div className="divide-y divide-white/10">
          {positions.map(p => {
            const logo = getStockLogo(p.ticker);
            return (
              <div key={p.ticker} className="py-3 px-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors grid grid-cols-[1fr_auto] md:grid-cols-[1.6fr_1fr_1fr_1fr_auto] gap-x-4 gap-y-1 items-center">
                <Link to={`/stock/${p.ticker}`} className="flex items-center gap-3 text-left min-w-0">
                  {logo ? <img src={logo} alt="" className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 border border-white/20" /> : <span className="w-9 h-9 rounded-xl bg-white/15 border border-white/15 text-orange-200 text-xs font-bold flex items-center justify-center">{p.ticker.slice(0, 3)}</span>}
                  <span className="min-w-0">
                    <span className="block font-semibold">{p.ticker}</span>
                    <span className="block text-xs text-white/55 truncate">{p.name} · {fmt(p.quantity)} titres</span>
                  </span>
                </Link>
                <div className="text-right md:text-left">
                  <p className="font-semibold">{fmt(p.marketValue)} F</p>
                  <p className="text-xs text-white/55">{p.weight.toFixed(1)} % du total</p>
                </div>
                <div className="text-sm">
                  <p className="text-white/55 text-xs">PRU → cours</p>
                  <p className="text-white/85">{fmt(p.averageCost)} → {fmt(p.lastPrice)} F</p>
                </div>
                <div className="text-sm text-right md:text-left">
                  <p className={`font-semibold ${tone(p.unrealizedPnl)}`}>{p.unrealizedPnl >= 0 ? '+' : ''}{fmt(p.unrealizedPnl)} F</p>
                  <p className={`text-xs ${tone(p.unrealizedPct)}`}>{pct(p.unrealizedPct)} · jour {pct(p.dayChangePct)}</p>
                </div>
                <div className="col-span-2 md:col-span-1 flex justify-end gap-1">
                  <button onClick={() => onBuy(p)} title="Enregistrer un achat" className="p-2 rounded-full text-emerald-300 hover:bg-emerald-400/15"><PlusCircle className="w-4 h-4" /></button>
                  <button onClick={() => onSell(p)} title="Enregistrer une vente" className="p-2 rounded-full text-rose-300 hover:bg-rose-400/15"><MinusCircle className="w-4 h-4" /></button>
                  <button
                    onClick={() => sharePercentOnly(`Ma ligne ${p.ticker} : ${pct(p.unrealizedPct)} depuis l'achat. Suivi sur AfriBourse.`)}
                    title="Partager (pourcentage uniquement)"
                    className="p-2 rounded-full text-white/60 hover:bg-white/10"
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
