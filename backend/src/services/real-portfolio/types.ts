// backend/src/services/real-portfolio/types.ts
// Types partagés par le moteur de cohérence, le ledger et les parseurs du
// portefeuille réel. Les dates métier circulent en 'YYYY-MM-DD' (UTC).

export type TxSide = 'OPENING' | 'BUY' | 'SELL';
export type ImportMode = 'SNAPSHOT' | 'TRANSACTIONS';
export type RowStatus = 'VALID' | 'WARNING' | 'BLOCKING';
export type Severity = 'WARNING' | 'BLOCKING';

/** Ligne saisie / importée, avant validation. */
export interface DraftRow {
  rowId: string;
  ticker: string; // symbole ou nom de société, tel que saisi
  side: TxSide;
  date: string; // YYYY-MM-DD
  quantity: number | null;
  price: number | null;
  fees?: number | null;
  /** Transaction déjà enregistrée que cette ligne modifie. */
  existingId?: string;
  // Traçabilité des corrections appliquées dans le tableau de validation
  splitAdjusted?: boolean;
  originalQuantity?: number | null;
  originalPrice?: number | null;
  note?: string | null;
}

export interface FixSuggestion {
  label: string;
  patch: Partial<Pick<DraftRow, 'ticker' | 'date' | 'quantity' | 'price'>>;
  /** Marque la ligne comme ajustée d'un split (traçabilité). */
  splitAdjusted?: boolean;
}

export interface Issue {
  code: string;
  severity: Severity;
  field?: 'ticker' | 'date' | 'quantity' | 'price' | 'fees' | 'side';
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
  /** Contrôles globaux (cohérence arithmétique…), jamais bloquants. */
  checks: Issue[];
  summary: { valid: number; warning: number; blocking: number };
  canCommit: boolean;
}

// ─── Référentiel marché ────────────────────────────────────────────────────

export interface StockRef {
  symbol: string;
  name: string;
  listedAt: string | null;
  delistedAt: string | null;
  firstHistoryDate: string | null;
  lastPrice: number;
  previousClose?: number;
  sector?: string | null;
}

export interface Bar {
  date: string;
  low: number;
  high: number;
  close: number;
}

export interface SplitEvent {
  exDate: string;
  /** 1 ancienne action = ratio nouvelles (split 1:10 → 10, regroupement 10:1 → 0.1). */
  ratio: number;
}

export interface DividendEvent {
  exDate: string;
  amount: number;
}

export interface MarketContext {
  today: string;
  stocks: StockRef[];
  bars: (ticker: string) => Bar[]; // triées par date croissante
  splits: (ticker: string) => SplitEvent[]; // vérifiés uniquement, triés
  dividends?: (ticker: string) => DividendEvent[];
}

/** Transaction normalisée (ticker résolu) consommée par le ledger. */
export interface LedgerTx {
  id?: string;
  ticker: string;
  side: TxSide;
  date: string;
  quantity: number;
  price: number;
  fees: number;
}

export interface LedgerPosition {
  ticker: string;
  quantity: number; // base actuelle (après splits)
  averageCost: number; // base actuelle, frais d'achat inclus
  costBasis: number;
  realizedPnl: number;
  dividends: number;
  firstDate: string;
}
