import { API_BASE_URL, authFetch } from '../config/api';
import type { SeasonalityStat, Statement, StatementPeriod } from '../lib/valuation';

export type ValuationSectorBeta = {
  id: string;
  sector: string;
  dataset: 'global' | 'emerging' | 'us' | 'europe' | 'japan';
  beta_unlevered: number;
  beta_unlevered_cash_adj: number | null;
  as_of: string;
  source: string;
};

export type ValuationAssumptionsDto = {
  stock_ticker: string;
  risk_free_rate: number;
  erp: number;
  crp: number;
  cost_of_debt: number;
  tax_rate: number;
  g_terminal: number;
  beta_source: 'BOTTOM_UP' | 'REGRESSION' | 'MANUAL';
  beta_datasets: string[];
  damodaran_sector: string | null;
  beta_unlevered_override: number | null;
  gearing_target: number;
  gearing_max_plausible: number;
  shares_outstanding: number;
  net_debt_override: number | null;
  weight_dcf: number;
  weight_ddm: number;
  weight_anc: number;
  seasonality_stat: SeasonalityStat;
  t1_anchor_weight: number;
  scenarios: unknown;
  prob_pessimistic: number;
  prob_base: number;
  prob_optimistic: number;
};

/** Un etat financier tel que la base le renvoie : postes en snake_case. */
export type FinancialStatementDto = {
  id: string;
  stock_ticker: string;
  year: number;
  period: StatementPeriod;
  source: string | null;
  note: string | null;
} & Record<string, number | string | null>;

export type ValuationInputs = {
  stock: {
    symbol: string;
    companyName: string;
    sector: string | null;
    country: string | null;
    currency: string;
    currentPrice: number;
    sharesOutstanding: number | null;
  };
  statements: FinancialStatementDto[];
  assumptions: ValuationAssumptionsDto | null;
  damodaranSector: string | null;
  sectorBetas: ValuationSectorBeta[];
  countryPremium: { erp: number; crp: number; as_of: string } | null;
  latestVersion: number;
  regression: { beta: number | null; correlation: number | null; points: number; indexName: string };
};

export type SectorComparison = {
  sector: string;
  peerCount: number;
  available: boolean;
  reason: string | null;
  modelledCount?: number;
  medians: { peRatio: number | null; pbRatio: number | null; dividendYield: number | null; upside: number | null } | null;
  peers: {
    symbol: string;
    companyName: string;
    price: number;
    peRatio: number | null;
    pbRatio: number | null;
    dividendYield: number | null;
    intrinsicValue: number | null;
    upside: number | null;
    vsMedian: { pe: number | null; pb: number | null; yield: number | null };
  }[];
};

type ApiEnvelope<T> = { success: boolean; data: T; message?: string; disclaimer?: string };

async function get<T>(path: string): Promise<T> {
  const response = await authFetch(`${API_BASE_URL}${path}`);
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !body.success) {
    throw new Error(body.message ?? `Echec de la requete ${path}`);
  }
  return body.data;
}

export function fetchValuationInputs(symbol: string): Promise<ValuationInputs> {
  return get<ValuationInputs>(`/valuation/${encodeURIComponent(symbol)}/inputs`);
}

export function fetchSectorComparison(sector: string): Promise<SectorComparison> {
  return get<SectorComparison>(`/valuation/sector/${encodeURIComponent(sector)}`);
}

/**
 * Convertit les postes snake_case de la base vers le type Statement du moteur.
 * C'est la seule frontiere de nommage du projet : le moteur reste en camelCase et
 * ignore tout ce qui vient de Prisma.
 */
const STATEMENT_FIELD_MAP: Record<string, keyof Statement> = {
  revenue: 'revenue',
  depreciation: 'depreciation',
  operating_income: 'operatingIncome',
  financial_income: 'financialIncome',
  ordinary_income: 'ordinaryIncome',
  hao_income: 'haoIncome',
  income_tax: 'incomeTax',
  net_income: 'netIncome',
  fixed_assets: 'fixedAssets',
  intangible_assets: 'intangibleAssets',
  tangible_assets: 'tangibleAssets',
  inventory: 'inventory',
  receivables: 'receivables',
  other_receivables: 'otherReceivables',
  cash_assets: 'cashAssets',
  equity: 'equity',
  financial_debt_total: 'financialDebtTotal',
  borrowings: 'borrowings',
  trade_payables: 'tradePayables',
  tax_social_payables: 'taxSocialPayables',
  customer_advances: 'customerAdvances',
  cash_liabilities: 'cashLiabilities',
  dividend_per_share: 'dividendPerShare',
  payout_ratio: 'payoutRatio',
  fictitious_assets: 'fictitiousAssets'
};

export function toStatements(dtos: FinancialStatementDto[]): Statement[] {
  return dtos.map((dto) => {
    const out: Statement = { year: dto.year, period: dto.period };
    for (const [snake, camel] of Object.entries(STATEMENT_FIELD_MAP)) {
      const value = dto[snake];
      if (typeof value === 'number' && Number.isFinite(value)) {
        (out as unknown as Record<string, number>)[camel] = value;
      }
    }
    return out;
  });
}
