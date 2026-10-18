// src/components/real-portfolio/TransactionEditorModal.tsx
// Ajout / modification de transactions après l'import : même tableau de
// validation, même moteur de cohérence que l'import.

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full sm:max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Fermer"><X className="w-5 h-5" /></button>
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
        <div className="sticky bottom-0 bg-white flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Annuler</button>
          <button
            disabled={!canCommit || busy}
            onClick={save}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
