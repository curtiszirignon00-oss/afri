// src/components/real-portfolio/QuickStartCard.tsx
// Démarrage rapide : une seule ligne (titre, quantité, PRU) suffit pour créer
// le portefeuille réel. Le reste se complète ensuite depuis le dashboard.

import { useId, useState } from 'react';
import { Zap, Loader2, ArrowRight } from 'lucide-react';
import { useStockOptions } from './ValidationTable';

export interface QuickStartValues { ticker: string; quantity: number; price: number }

const toNumber = (s: string) => {
  const n = Number(s.replace(/[\s  ]/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export default function QuickStartCard({ busy, onSubmit }: { busy: boolean; onSubmit: (v: QuickStartValues) => void }) {
  const stocks = useStockOptions();
  const listId = useId();
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  const q = toNumber(quantity);
  const p = toNumber(price);
  const ready = ticker.trim().length > 0 && q != null && p != null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ready && !busy) onSubmit({ ticker: ticker.trim(), quantity: q!, price: p! });
  };

  const input = 'glass-input w-full rounded-xl px-3 py-2.5 text-sm';

  return (
    <form onSubmit={submit} className="glass-card rounded-3xl p-5 md:p-6 !border-orange-300/30">
      <div className="flex items-center gap-2">
        <span className="inline-flex p-1.5 rounded-full bg-orange-400/20 border border-orange-300/30 text-orange-200"><Zap className="w-4 h-4" /></span>
        <h2 className="text-lg font-semibold">Démarrer en 30 secondes</h2>
      </div>
      <p className="mt-1 text-sm text-white/65">Ajoute une seule ligne pour commencer. Tu compléteras les autres quand tu veux.</p>

      <datalist id={listId}>
        {stocks.map(st => <option key={st.symbol} value={st.symbol}>{st.company_name}</option>)}
      </datalist>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-2.5 items-end">
        <label className="col-span-2 sm:col-span-1 text-sm">
          <span className="block text-white/70 mb-1">Titre</span>
          <input list={listId} value={ticker} onChange={e => setTicker(e.target.value)} placeholder="ex. SNTS ou Sonatel" autoComplete="off" className={input} />
        </label>
        <label className="text-sm">
          <span className="block text-white/70 mb-1">Quantité</span>
          <input inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="100" className={input} />
        </label>
        <label className="text-sm">
          <span className="block text-white/70 mb-1">PRU (F CFA)</span>
          <input inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder="20 000" className={input} />
        </label>
        <button
          type="submit"
          disabled={!ready || busy}
          className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-stone-900 font-semibold hover:bg-white/90 shadow-lg shadow-black/20 disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Ajouter
        </button>
      </div>
      <p className="mt-2 text-xs text-white/50">PRU = prix de revient unitaire, indiqué sur ton relevé SGI.</p>
    </form>
  );
}
