// src/components/real-portfolio/importDraft.ts
// Brouillon d'import conservé dans le navigateur : quitter la page en cours de
// saisie ne fait plus perdre les lignes. Clé par utilisateur (appareil partagé).

import type { DraftRow, ImportMode, ImportSource } from '../../services/realPortfolioApi';

export interface ImportDraft {
  savedAt: string;
  mode: ImportMode;
  snapshotDate: string;
  source: ImportSource;
  fileName: string | null;
  rows: DraftRow[];
  cash: string;
  declared: string;
  name: string;
  broker: string;
}

const key = (userId: string) => `afribourse:rp-import-draft:v1:${userId}`;

export function loadImportDraft(userId: string | undefined): ImportDraft | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return null;
    const d = JSON.parse(raw) as ImportDraft;
    return Array.isArray(d.rows) && d.rows.length > 0 ? d : null;
  } catch {
    return null;
  }
}

export function saveImportDraft(userId: string | undefined, draft: Omit<ImportDraft, 'savedAt'>) {
  if (!userId) return;
  try {
    localStorage.setItem(key(userId), JSON.stringify({ ...draft, savedAt: new Date().toISOString() }));
  } catch { /* stockage indisponible : le brouillon n'est simplement pas conservé */ }
}

export function clearImportDraft(userId: string | undefined) {
  if (!userId) return;
  try { localStorage.removeItem(key(userId)); } catch { /* idem */ }
}

/** Une ligne compte si l'utilisateur y a saisi quelque chose. */
export const hasContent = (rows: DraftRow[]) => rows.some(r => r.ticker.trim() || r.quantity != null || r.price != null);
