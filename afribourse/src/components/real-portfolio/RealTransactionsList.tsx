// src/components/real-portfolio/RealTransactionsList.tsx
import { useState } from 'react';
import { History, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { RealPortfolioApiError, type DraftRow, type RealTransaction } from '../../services/realPortfolioApi';
import { txToDraft } from './draft';
import { useDeleteRealTransaction } from '../../hooks/useRealPortfolio';

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');
const SIDE: Record<RealTransaction['side'], { label: string; cls: string }> = {
  OPENING: { label: 'Ouverture', cls: 'bg-slate-100 text-slate-700' },
  BUY: { label: 'Achat', cls: 'bg-emerald-50 text-emerald-700' },
  SELL: { label: 'Vente', cls: 'bg-red-50 text-red-700' },
};
interface Props {
  transactions: RealTransaction[];
  loading?: boolean;
  onEdit: (row: DraftRow) => void;
}

export default function RealTransactionsList({ transactions, loading, onEdit }: Props) {
  const [showAll, setShowAll] = useState(false);
  const del = useDeleteRealTransaction();
  const list = showAll ? transactions : transactions.slice(0, 8);

  const remove = (t: RealTransaction) => {
    if (!window.confirm(`Supprimer ${SIDE[t.side].label.toLowerCase()} de ${fmt(t.quantity)} ${t.ticker} du ${t.date} ?`)) return;
    del.mutate(t.id, {
      onSuccess: () => toast.success('Transaction supprimée.'),
      // Le moteur refuse une suppression qui rendrait une vente ultérieure incohérente.
      onError: (e: Error) => toast.error((e instanceof RealPortfolioApiError && e.report?.checks?.[0]?.message) || e.message),
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><History className="w-5 h-5 text-indigo-600" /> Historique des transactions</h3>
      {loading ? (
        <div className="h-32 animate-pulse bg-gray-50 rounded-xl" />
      ) : transactions.length === 0 ? (
        <p className="text-center text-gray-500 py-6">Aucune transaction.</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-100">
            {list.map(t => (
              <li key={t.id} className="py-2.5 flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${SIDE[t.side].cls}`}>{SIDE[t.side].label}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{t.ticker}</span> · {fmt(t.quantity)} × {fmt(t.price)} F
                    {t.fees > 0 && <span className="text-gray-500"> + {fmt(t.fees)} F frais</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(t.date).toLocaleDateString('fr-FR')}
                    {t.splitAdjusted && ' · ajusté d’un split'}
                  </p>
                </div>
                {t.status === 'WARNING' && (
                  <span title={(t.flags ?? []).map(f => f.message).join('\n')} className="text-amber-500"><AlertTriangle className="w-4 h-4" /></span>
                )}
                <button onClick={() => onEdit(txToDraft(t))} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100" aria-label="Modifier"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remove(t)} disabled={del.isPending} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50" aria-label="Supprimer"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
          {transactions.length > 8 && (
            <button onClick={() => setShowAll(v => !v)} className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800">
              {showAll ? 'Réduire' : `Voir les ${transactions.length} transactions`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
