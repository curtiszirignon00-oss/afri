// src/components/real-portfolio/TransactionEditorModal.tsx
// Ajout / modification de transactions après l'import : même tableau de
// validation, même moteur de cohérence que l'import. Panneau en verre sombre.

import { useEffect, useState } from 'react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ValidationTable from './ValidationTable';
import { useDraftValidation } from './draft';
import { realPortfolioApi, RealPortfolioApiError, type DraftRow } from '../../services/realPortfolioApi';
import { useInvalidateRealPortfolio } from '../../hooks/useRealPortfolio';

interface Props {
  open: boolean;
  title: string;
  initialRows: DraftRow[];
  onClose: () => void;
}

export default function TransactionEditorModal({ open, title, initialRows, onClose }: Props) {
  const [rows, setRows] = useState<DraftRow[]>(initialRows);
  const [busy, setBusy] = useState(false);
  const invalidate = useInvalidateRealPortfolio();
  const isEdit = initialRows.some(r => r.existingId);
  const mode = initialRows.every(r => r.side === 'OPENING') && initialRows.length > 0 ? 'SNAPSHOT' : 'TRANSACTIONS';
  const { report, validating, canCommit, setReport } = useDraftValidation(rows, { mode }, open);

  useEffect(() => { if (open) setRows(initialRows); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const save = async () => {
    setBusy(true);
    try {
      await realPortfolioApi.commit({ rows, mode, source: 'MANUAL' });
      await invalidate();
      toast.success(isEdit ? 'Transaction mise à jour.' : 'Transaction enregistrée.');
      onClose();
    } catch (e) {
      if (e instanceof RealPortfolioApiError && e.report) setReport(e.report);
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full sm:max-w-4xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl text-white bg-stone-900/85 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-black/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-stone-900/90 backdrop-blur-xl">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full text-white/60 hover:bg-white/10 hover:text-white" aria-label="Fermer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 sm:p-5">
          <ValidationTable
            rows={rows}
            onChange={setRows}
            report={report}
            validating={validating}
            mode={mode}
            allowAdd={!isEdit}
            allowRemove={!isEdit && rows.length > 1}
            defaultDate={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 px-5 py-4 border-t border-white/10 bg-stone-900/90 backdrop-blur-xl">
          <button onClick={onClose} className="glass-pill px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20">Annuler</button>
          <button
            disabled={!canCommit || busy}
            onClick={save}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-stone-900 text-sm font-semibold hover:bg-white/90 disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
