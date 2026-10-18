// backend/src/services/real-portfolio/parsers.ts
// Lecture des fichiers d'import (CSV / Excel) + mapping de colonnes semi-auto.
//
// Extension v2 (relevé SGI) : ajouter un StatementParser au registre. Un
// parseur spécialisé renvoie directement un mapping complet (columnsMapped).

import * as XLSX from 'xlsx';
import type { DraftRow, ImportMode, TxSide } from './types';
import { toIso } from './dates';

export type MappedField = 'ticker' | 'date' | 'side' | 'quantity' | 'price' | 'fees' | 'amount';
export type ColumnMapping = Partial<Record<MappedField, string>>;

export interface ParsedTable {
  parserId: string;
  source: 'CSV' | 'XLSX' | `SGI_${string}`;
  headers: string[];
  rows: Record<string, unknown>[];
  suggestedMapping: ColumnMapping;
  /** Mode deviné : présence d'une colonne date/sens → relevé de transactions. */
  suggestedMode: ImportMode;
}

export interface StatementParser {
  id: string;
  canParse(fileName: string, buffer: Buffer): boolean;
  parse(fileName: string, buffer: Buffer): ParsedTable;
}

export const MAX_IMPORT_ROWS = 1000;

// ─── Mapping de colonnes ───────────────────────────────────────────────────

const SYNONYMS: Record<MappedField, string[]> = {
  ticker: ['ticker', 'symbole', 'symbol', 'code', 'valeur', 'titre', 'libelle', 'libellé', 'societe', 'société', 'action', 'instrument', 'isin', 'nom'],
  date: ['date', 'date operation', 'date opération', 'date execution', 'date exécution', 'date negociation', 'date de transaction', 'jour'],
  side: ['sens', 'type', 'operation', 'opération', 'nature', 'side', 'achat vente', 'achat/vente'],
  quantity: ['quantite', 'quantité', 'qte', 'qté', 'nombre', 'nb titres', 'nombre de titres', 'quantity', 'qty', 'volume'],
  price: ['pru', 'prix de revient', 'prix moyen', 'cours', 'prix', 'prix unitaire', 'cours unitaire', 'price', 'cours execution', 'cours d execution'],
  fees: ['frais', 'commission', 'commissions', 'fees', 'courtage'],
  amount: ['montant', 'montant brut', 'montant net', 'total', 'amount'],
};

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Synonymes trop génériques pour une correspondance partielle (« nom » ⊂ « nombre »). */
const EXACT_ONLY = new Set(['valeur', 'nom', 'code', 'titre', 'type', 'total', 'jour', 'action', 'volume', 'nature', 'side', 'qty']);

export function suggestMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<string>();
  const normHeaders = headers.map(h => [h, norm(h)] as const);
  // Exact d'abord, puis inclusion. Les synonymes sont classés par priorité
  // (ex. « PRU » passe avant « Cours » pour un snapshot).
  for (const pass of ['exact', 'contains'] as const) {
    for (const field of Object.keys(SYNONYMS) as MappedField[]) {
      if (mapping[field]) continue;
      for (const syn of SYNONYMS[field].map(norm)) {
        if (pass === 'contains' && EXACT_ONLY.has(syn)) continue;
        const hit = normHeaders.find(([h, n]) => !used.has(h) && (pass === 'exact' ? n === syn : n.includes(syn)));
        if (hit) { mapping[field] = hit[0]; used.add(hit[0]); break; }
      }
    }
  }
  return mapping;
}

// ─── Normalisation des valeurs ─────────────────────────────────────────────

/** « 1 234,50 », « 1.234,50 », « 1,234.50 », « 20 000 F » → nombre. */
export function parseNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  let s = String(v).replace(/[\s  ]/g, '').replace(/(fcfa|xof|cfa|f)$/i, '');
  if (!s) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (lastComma > -1) {
    // Une seule virgule suivie de 3 chiffres sans autre décimale → séparateur de milliers
    s = /^-?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3}){2,}$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** jj/mm/aaaa, jj-mm-aa, aaaa-mm-jj, Date, numéro de série Excel → YYYY-MM-DD. */
export function parseDate(v: unknown): string {
  if (v == null || v === '') return '';
  if (v instanceof Date && !isNaN(v.getTime())) {
    // xlsx (cellDates) crée des dates à minuit local : on garde le jour civil.
    return toIso(new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate())));
  }
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return toIso(new Date(Date.UTC(d.y, d.m - 1, d.d)));
  }
  const s = String(v).trim();
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(s);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(s);
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return s;
}

export function parseSide(v: unknown, mode: ImportMode): TxSide | null {
  if (mode === 'SNAPSHOT') return 'OPENING';
  const s = norm(String(v ?? ''));
  if (!s) return null;
  if (/^(a|achat|buy|b|acq|acquisition|souscription)/.test(s)) return 'BUY';
  if (/^(v|vente|sell|s|cession)/.test(s)) return 'SELL';
  return null;
}

/** Applique le mapping choisi par l'utilisateur → lignes brouillon pour le moteur. */
export function toDraftRows(
  rows: Record<string, unknown>[],
  mapping: ColumnMapping,
  mode: ImportMode,
  snapshotDate: string,
): DraftRow[] {
  return rows.map((r, i) => {
    const get = (f: MappedField) => (mapping[f] ? r[mapping[f]!] : undefined);
    const quantity = parseNumber(get('quantity'));
    let price = parseNumber(get('price'));
    // Pas de colonne cours mais un montant : cours = montant / quantité
    if (price == null && quantity) {
      const amount = parseNumber(get('amount'));
      if (amount != null) price = Math.round((Math.abs(amount) / quantity) * 100) / 100;
    }
    const date = mode === 'SNAPSHOT' && !mapping.date ? snapshotDate : parseDate(get('date'));
    return {
      rowId: `r${i + 1}`,
      ticker: String(get('ticker') ?? '').trim(),
      side: (parseSide(get('side'), mode) ?? (mode === 'SNAPSHOT' ? 'OPENING' : 'BUY')) as TxSide,
      date,
      quantity: quantity == null ? null : Math.abs(quantity),
      price,
      fees: parseNumber(get('fees')),
    };
  });
}

// ─── Parseur tabulaire générique ───────────────────────────────────────────

function isEmptyRow(r: Record<string, unknown>): boolean {
  return Object.values(r).every(v => v == null || String(v).trim() === '');
}

/** Trouve la ligne d'en-tête (les exports SGI ont souvent un bandeau au-dessus). */
function locateHeader(matrix: unknown[][]): number {
  let best = 0, bestScore = -1;
  for (let i = 0; i < Math.min(matrix.length, 15); i++) {
    const cells = (matrix[i] ?? []).map(c => String(c ?? '')).filter(Boolean);
    const score = Object.keys(suggestMapping(cells)).length;
    if (score > bestScore) { best = i; bestScore = score; }
  }
  return best;
}

export const tabularParser: StatementParser = {
  id: 'tabular',
  canParse: name => /\.(csv|txt|xlsx|xls|ods)$/i.test(name),
  parse(name, buffer) {
    const isCsv = /\.(csv|txt)$/i.test(name);
    const wb = isCsv
      ? XLSX.read(buffer.toString('utf8').replace(/^﻿/, ''), { type: 'string', raw: true, FS: detectSeparator(buffer) })
      : XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) throw new Error('Fichier vide.');
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: !isCsv, defval: '' });
    const headerIdx = locateHeader(matrix);
    const headers = (matrix[headerIdx] ?? []).map((h, i) => String(h ?? '').trim() || `Colonne ${i + 1}`);
    const rows = matrix.slice(headerIdx + 1)
      .map(line => Object.fromEntries(headers.map((h, i) => [h, (line as unknown[])[i] ?? ''])))
      .filter(r => !isEmptyRow(r));
    if (rows.length > MAX_IMPORT_ROWS) throw new Error(`Fichier trop volumineux (max ${MAX_IMPORT_ROWS} lignes).`);
    const suggestedMapping = suggestMapping(headers);
    return {
      parserId: 'tabular',
      source: isCsv ? 'CSV' : 'XLSX',
      headers,
      rows,
      suggestedMapping,
      suggestedMode: suggestedMapping.date || suggestedMapping.side ? 'TRANSACTIONS' : 'SNAPSHOT',
    };
  },
};

function detectSeparator(buffer: Buffer): string {
  const firstLine = buffer.toString('utf8', 0, Math.min(buffer.length, 2000)).split(/\r?\n/)[0] ?? '';
  const counts = [';', ',', '\t'].map(sep => [sep, firstLine.split(sep).length - 1] as const);
  return counts.sort((a, b) => b[1] - a[1])[0][1] > 0 ? counts[0][0] : ',';
}

/** Registre ordonné : les parseurs spécialisés (SGI, v2) passent avant le générique. */
const PARSERS: StatementParser[] = [tabularParser];

export function registerParser(p: StatementParser): void {
  PARSERS.unshift(p);
}

export function parseStatementFile(fileName: string, buffer: Buffer): ParsedTable {
  const parser = PARSERS.find(p => p.canParse(fileName, buffer));
  if (!parser) throw new Error('Format non pris en charge (CSV ou Excel attendu).');
  return parser.parse(fileName, buffer);
}
