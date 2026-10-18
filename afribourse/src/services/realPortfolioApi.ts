// src/services/realPortfolioApi.ts
// Client du portefeuille réel importé (/api/real-portfolio).
// Distinct du simulateur : aucune donnée réelle ne transite par /portfolios.

import { API_BASE_URL, authFetch } from '../config/api';

export type TxSide = 'OPENING' | 'BUY' | 'SELL';
export type ImportMode = 'SNAPSHOT' | 'TRANSACTIONS';
export type RowStatus = 'VALID' | 'WARNING' | 'BLOCKING';
export type MappedField = 'ticker' | 'date' | 'side' | 'quantity' | 'price' | 'fees' | 'amount';
export type ColumnMapping = Partial<Record<MappedField, string>>;

export interface DraftRow {
  rowId: string;
  ticker: string;
  side: TxSide;
  date: string;
  quantity: number | null;
  price: number | null;
  fees?: number | null;
  existingId?: string;
  splitAdjusted?: boolean;
  originalQuantity?: number | null;
  originalPrice?: number | null;
  note?: string | null;
}

export interface FixSuggestion {
  label: string;
  patch: Partial<Pick<DraftRow, 'ticker' | 'date' | 'quantity' | 'price'>>;
  splitAdjusted?: boolean;
}

export interface Issue {
  code: string;
  severity: 'WARNING' | 'BLOCKING';
  field?: keyof DraftRow;
  message: string;
  fixes?: FixSuggestion[];
}

export interface RowResult {
  rowId: string;
  status: RowStatus;
  resolvedTicker: string | null;
  issues: Issue[];
}

export interface ValidationReport {
  rows: RowResult[];
  checks: Issue[];
  summary: { valid: number; warning: number; blocking: number };
  canCommit: boolean;
}

export interface ParsedTable {
  parserId: string;
  source: 'CSV' | 'XLSX';
  headers: string[];
  rows: Record<string, unknown>[];
  suggestedMapping: ColumnMapping;
  suggestedMode: ImportMode;
  fileName: string;
}

export interface RealPositionLine {
  ticker: string;
  name: string;
  sector: string;
  quantity: number;
  averageCost: number;
  costBasis: number;
  lastPrice: number;
  previousClose: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPct: number;
  dayChange: number;
  dayChangePct: number;
  realizedPnl: number;
  dividends: number;
  firstDate: string;
  weight: number;
}

export interface RealDashboard {
  portfolio: { id: string; name: string; broker: string | null; importMode: ImportMode; declaredCapital: number | null; createdAt: string };
  cash: { amount: number; asOf: string | null };
  totals: {
    totalValue: number;
    securitiesValue: number;
    costBasis: number;
    unrealizedPnl: number;
    unrealizedPct: number;
    realizedPnl: number;
    dividends: number;
    dayChange: number;
    dayChangePct: number;
    positionsCount: number;
    topWeight: number;
    herfindahl: number;
  };
  positions: RealPositionLine[];
  allocationBySector: { name: string; value: number; weight: number }[];
  transactionsCount: number;
  flaggedCount: number;
  firstTradeDate: string | null;
  priceDate: string;
}

export interface RealTransaction {
  id: string;
  ticker: string;
  side: TxSide;
  date: string;
  quantity: number;
  price: number;
  fees: number;
  source: string;
  status: 'VALID' | 'WARNING';
  flags: { code: string; severity: string; message: string }[] | null;
  splitAdjusted: boolean;
  note: string | null;
}

export interface HistoryPoint { date: string; value: number; invested: number }

export class RealPortfolioApiError extends Error {
  constructor(public status: number, message: string, public report?: ValidationReport) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const res = await authFetch(`${API_BASE_URL}/real-portfolio${path}`, {
    ...init,
    headers: isForm ? init.headers : { 'Content-Type': 'application/json', ...(init.headers as Record<string, string>) },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = res.status === 429 ? 'Trop de requêtes, réessayez dans une minute.' : data.message || data.error || `Erreur ${res.status}`;
    throw new RealPortfolioApiError(res.status, msg, data.report);
  }
  return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const realPortfolioApi = {
  /** null si l'utilisateur n'a pas encore de portefeuille réel. */
  async getDashboard(): Promise<RealDashboard | null> {
    try {
      return await call<RealDashboard>('');
    } catch (e) {
      if (e instanceof RealPortfolioApiError && e.status === 404) return null;
      throw e;
    }
  },
  getHistory: () => call<{ points: HistoryPoint[]; cash: number }>('/history'),
  getTransactions: () => call<RealTransaction[]>('/transactions'),

  parseFile(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return call<ParsedTable>('/parse', { method: 'POST', body: fd });
  },
  mapRows: (body: { rows: Record<string, unknown>[]; mapping: ColumnMapping; mode: ImportMode; snapshotDate?: string }) =>
    call<{ rows: DraftRow[]; report: ValidationReport }>('/map', json('POST', body)),
  validate: (body: { rows: DraftRow[]; mode?: ImportMode; declaredCapital?: number | null; cash?: number | null; replaceOpenings?: boolean; deletedIds?: string[] }) =>
    call<ValidationReport>('/validate', json('POST', body)),
  commit: (body: {
    rows: DraftRow[]; mode?: ImportMode; declaredCapital?: number | null; cash?: number | null; replaceOpenings?: boolean;
    source?: 'MANUAL' | 'CSV' | 'XLSX'; fileName?: string | null; name?: string; broker?: string | null;
  }) => call<{ portfolioId: string; report: ValidationReport }>('/commit', json('POST', body)),
  deleteTransaction: (id: string) => call<{ report: ValidationReport }>(`/transactions/${id}`, { method: 'DELETE' }),
  updateCash: (amount: number) => call('/cash', json('PUT', { amount })),
  updateSettings: (body: { name?: string; broker?: string | null; declaredCapital?: number | null }) => call('', json('PATCH', body)),
  deletePortfolio: () => call<void>('', { method: 'DELETE' }),
};
