// src/components/real-portfolio/draft.ts
// Lignes brouillon + validation debouncée contre le moteur de cohérence serveur.

import { useEffect, useRef, useState } from 'react';
import type { DraftRow, FixSuggestion, ImportMode, RealTransaction, ValidationReport } from '../../services/realPortfolioApi';
import { realPortfolioApi } from '../../services/realPortfolioApi';

// ─── Validation debouncée ──────────────────────────────────────────────────

export interface DraftValidationOptions {
  mode?: ImportMode;
  declaredCapital?: number | null;
  cash?: number | null;
  replaceOpenings?: boolean;
  deletedIds?: string[];
}

export function useDraftValidation(rows: DraftRow[], opts: DraftValidationOptions, enabled = true) {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const key = JSON.stringify({ rows, opts });

  useEffect(() => {
    const id = ++seq.current;
    if (!enabled || rows.length === 0) { setReport(null); setValidating(false); return; }
    setValidating(true);
    const t = setTimeout(() => {
      realPortfolioApi.validate({ rows, ...opts })
        .then(r => { if (id === seq.current) { setReport(r); setError(null); } })
        .catch((e: Error) => { if (id === seq.current) setError(e.message); })
        .finally(() => { if (id === seq.current) setValidating(false); });
    }, 450);
    return () => clearTimeout(t);
  }, [key, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rapport périmé tant que la revalidation est en cours : jamais d'enregistrement sur un rapport ancien.
  const canCommit = !!report && report.canCommit && !validating && report.rows.length === rows.length;
  return { report, validating, error, canCommit, setReport };
}

let rowSeq = 0;
export function newRowId(): string {
  rowSeq += 1;
  return `m${Date.now().toString(36)}${rowSeq}`;
}

export function emptyRow(mode: ImportMode, date: string): DraftRow {
  return { rowId: newRowId(), ticker: '', side: mode === 'SNAPSHOT' ? 'OPENING' : 'BUY', date, quantity: null, price: null, fees: null };
}

export function applyFix(row: DraftRow, fix: FixSuggestion): DraftRow {
  const next: DraftRow = { ...row, ...fix.patch };
  if (fix.splitAdjusted) {
    next.splitAdjusted = true;
    if (row.originalQuantity == null) next.originalQuantity = row.quantity;
    if (row.originalPrice == null) next.originalPrice = row.price;
  }
  return next;
}

export function txToDraft(t: RealTransaction): DraftRow {
  return { rowId: `e-${t.id}`, existingId: t.id, ticker: t.ticker, side: t.side, date: t.date, quantity: t.quantity, price: t.price, fees: t.fees || null, splitAdjusted: t.splitAdjusted, note: t.note };
}
