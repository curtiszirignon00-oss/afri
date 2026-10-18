/**
 * BRVM Data Service — Executors Prisma pour les 5 tools de SIMBA Analyste
 * Chaque fonction correspond à un outil déclaré dans analystTools.ts
 */

import prisma from '../config/prisma';
import type { AnalystToolName } from '../ai/analystTools';
import { fmtFCFA, fmtMillionsFCFA, fmtLargeFCFA, marketCapFCFA, plausibleRatio, PLAUSIBLE_RANGES } from '../ai/format';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERIOD_TO_DAYS: Record<string, number> = {
  '1W': 7, '1M': 30, '3M': 90,
  '6M': 180, '1Y': 365, '3Y': 1095, '5Y': 1825,
};

// Montants : voir ai/format.ts (revenue, net_income, book_value… sont stockés en MILLIONS de FCFA)

// ─── Tool 1 : Données complètes d'un titre ────────────────────────────────────

async function getStockData({ symbol }: { symbol: string }) {
  const sym = symbol.toUpperCase();

  const [stock, fundamentals] = await Promise.all([
    prisma.stock.findFirst({ where: { symbol: sym, is_active: true } }),
    prisma.stockFundamental.findFirst({
      where: { stock_ticker: sym },
      orderBy: { year: 'desc' },
    }),
  ]);

  if (!stock) return { error: `Titre "${sym}" introuvable sur la BRVM.` };

  const ratio = (m: string) => plausibleRatio(m, (fundamentals as any)?.[m]) ?? 'N/D';
  const shares = fundamentals?.shares_outstanding ?? stock.shares_outstanding;

  return {
    symbol: stock.symbol,
    name: stock.company_name,
    sector: stock.sector,
    country: stock.country,
    current_price: fmtFCFA(stock.current_price),
    previous_close: fmtFCFA(stock.previous_close),
    daily_change_pct: stock.daily_change_percent,
    volume_today_shares: stock.volume,
    // Recalculée (cours × actions) : les champs market_cap stockés ont des unités hétérogènes
    market_cap: fmtLargeFCFA(marketCapFCFA(stock.current_price, shares, fundamentals?.market_cap)),
    fundamentals_year: fundamentals?.year ?? 'N/D',
    pe_ratio: ratio('pe_ratio'),
    pb_ratio: ratio('pb_ratio'),
    eps_per_share: fundamentals?.eps != null ? fmtFCFA(fundamentals.eps) : 'N/D',
    equity_book_value: fmtMillionsFCFA(fundamentals?.book_value),
    dividend_yield_pct: ratio('dividend_yield'),
    ex_dividend_date: fundamentals?.ex_dividend_date?.toISOString().split('T')[0] ?? 'N/D',
    roe_pct: ratio('roe'),
    roa_pct: ratio('roa'),
    profit_margin_pct: ratio('profit_margin'),
    debt_to_equity: ratio('debt_to_equity'),
    revenue: fmtMillionsFCFA(fundamentals?.revenue),
    net_income: fmtMillionsFCFA(fundamentals?.net_income),
    ebitda: fmtMillionsFCFA(fundamentals?.ebitda),
    free_cash_flow: fmtMillionsFCFA(fundamentals?.free_cash_flow),
    shares_outstanding: shares ?? 'N/D',
  };
}

// ─── Tool 2 : Performance historique ─────────────────────────────────────────

async function getHistoricalPerformance({ symbol, period }: { symbol: string; period: string }) {
  const sym = symbol.toUpperCase();
  const days = PERIOD_TO_DAYS[period] ?? 30;
  const since = new Date(Date.now() - days * 86_400_000);

  const [prices, brvmPrices] = await Promise.all([
    prisma.stockHistory.findMany({
      where: { stock_ticker: sym, date: { gte: since } },
      orderBy: { date: 'asc' },
      select: { date: true, close: true, volume: true, high: true, low: true },
    }),
    prisma.marketIndexHistory.findMany({
      where: { index_name: 'BRVM COMPOSITE', date: { gte: since } },
      orderBy: { date: 'asc' },
      select: { date: true, close: true },
    }),
  ]);

  if (!prices.length) {
    return { error: `Pas de données historiques pour "${sym}" sur la période ${period}.` };
  }

  const first = prices[0].close;
  const last  = prices[prices.length - 1].close;
  const perf  = ((last - first) / first) * 100;
  const high  = Math.max(...prices.map((p: any) => p.high));
  const low   = Math.min(...prices.map((p: any) => p.low));
  const avgVol = prices.reduce((s: number, p: any) => s + p.volume, 0) / prices.length;

  let brvmPerf: number | null = null;
  let outperformance: number | null = null;
  if (brvmPrices.length >= 2) {
    brvmPerf = ((brvmPrices[brvmPrices.length - 1].close - brvmPrices[0].close) / brvmPrices[0].close) * 100;
    outperformance = perf - brvmPerf;
  }

  return {
    symbol: sym,
    period,
    start_date: prices[0].date.toISOString().split('T')[0],
    end_date:   prices[prices.length - 1].date.toISOString().split('T')[0],
    start_price: fmtFCFA(first),
    end_price:   fmtFCFA(last),
    performance_pct: parseFloat(perf.toFixed(2)),
    high_period: fmtFCFA(high),
    low_period:  fmtFCFA(low),
    avg_daily_volume_shares: Math.round(avgVol),
    brvm_composite_perf_pct: brvmPerf != null ? parseFloat(brvmPerf.toFixed(2)) : 'N/D',
    outperformance_vs_brvm_pct: outperformance != null ? parseFloat(outperformance.toFixed(2)) : 'N/D',
    data_points: prices.length,
  };
}

// ─── Tool 3 : Comparaison multi-titres ───────────────────────────────────────

async function compareStocks({ symbols, metrics }: { symbols: string[]; metrics?: string[] }) {
  const syms = symbols.map((s) => s.toUpperCase());
  // roe / roa / profit_margin / dividend_yield en %, eps en FCFA par action
  const ALL_METRICS = ['pe_ratio', 'pb_ratio', 'roe', 'roa', 'profit_margin',
    'dividend_yield', 'debt_to_equity', 'eps', 'market_cap'];
  const selectedMetrics = metrics?.length ? metrics : ALL_METRICS;

  const [stocks, fundamentalsAll] = await Promise.all([
    prisma.stock.findMany({ where: { symbol: { in: syms }, is_active: true } }),
    prisma.stockFundamental.findMany({
      where: { stock_ticker: { in: syms } },
      orderBy: { year: 'desc' },
    }),
  ]);

  const latestFundamentals: Record<string, any> = {};
  for (const f of fundamentalsAll) {
    if (!latestFundamentals[f.stock_ticker]) latestFundamentals[f.stock_ticker] = f;
  }

  return syms.map((sym) => {
    const stock = stocks.find((s: any) => s.symbol === sym);
    const fund  = latestFundamentals[sym];
    if (!stock) return { symbol: sym, error: 'Titre introuvable' };

    // Unités explicites dans les libellés pour que le modèle ne les confonde pas
    const metricMap: Record<string, any> = {
      pe_ratio:      plausibleRatio('pe_ratio', fund?.pe_ratio),
      pb_ratio:      plausibleRatio('pb_ratio', fund?.pb_ratio),
      roe:           plausibleRatio('roe', fund?.roe),
      roa:           plausibleRatio('roa', fund?.roa),
      profit_margin: plausibleRatio('profit_margin', fund?.profit_margin),
      dividend_yield: plausibleRatio('dividend_yield', fund?.dividend_yield),
      debt_to_equity: plausibleRatio('debt_to_equity', fund?.debt_to_equity),
      eps:           fund?.eps != null ? fmtFCFA(fund.eps) : null,
      market_cap:    fmtLargeFCFA(marketCapFCFA(stock.current_price, fund?.shares_outstanding ?? stock.shares_outstanding, fund?.market_cap)),
    };

    const result: Record<string, any> = {
      symbol: sym,
      name: stock.company_name,
      sector: stock.sector,
      current_price: fmtFCFA(stock.current_price),
      daily_change_pct: stock.daily_change_percent,
      fundamentals_year: fund?.year ?? 'N/D',
    };
    selectedMetrics.forEach((m) => { result[m] = metricMap[m] ?? 'N/D'; });
    return result;
  });
}

// ─── Tool 4 : Benchmark sectoriel ────────────────────────────────────────────

async function getSectorBenchmark({ symbol }: { symbol: string }) {
  const sym = symbol.toUpperCase();

  const stock = await prisma.stock.findFirst({ where: { symbol: sym, is_active: true } });
  if (!stock) return { error: `Titre "${sym}" introuvable.` };

  const fund = await prisma.stockFundamental.findFirst({
    where: { stock_ticker: sym },
    orderBy: { year: 'desc' },
  });

  const sectorStocks = await prisma.stock.findMany({
    where: { sector: stock.sector ?? undefined, is_active: true, symbol: { not: sym } },
  });
  const sectorSymbols = sectorStocks.map((s: any) => s.symbol);

  const sectorFunds = await prisma.stockFundamental.findMany({
    where: { stock_ticker: { in: sectorSymbols } },
    orderBy: { year: 'desc' },
  });

  const latestByTicker: Record<string, any> = {};
  for (const f of sectorFunds) {
    if (!latestByTicker[f.stock_ticker]) latestByTicker[f.stock_ticker] = f;
  }
  const peers = Object.values(latestByTicker);

  // Bornes plausibles partagées (ai/format.ts) : hors bornes ⇒ erreur de saisie ou d'unité
  const isPlausible = (m: string, v: unknown): v is number => plausibleRatio(m, v) != null && m in PLAUSIBLE_RANGES;

  // Médiane plutôt que moyenne : un seul pair atypique ne déplace plus la référence sectorielle
  const median = (key: string): { value: number | null; n: number } => {
    const vals = peers.map((p: any) => p[key]).filter((v: unknown) => isPlausible(key, v)).sort((a: number, b: number) => a - b);
    if (!vals.length) return { value: null, n: 0 };
    const mid = Math.floor(vals.length / 2);
    const med = vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
    return { value: parseFloat(med.toFixed(2)), n: vals.length };
  };

  const RATIO_METRICS = ['pe_ratio', 'pb_ratio', 'roe', 'roa', 'profit_margin', 'dividend_yield', 'debt_to_equity'];
  const benchmark: Record<string, any> = {};

  for (const m of RATIO_METRICS) {
    const rawStockVal = fund?.[m] ?? null;
    const stockVal = isPlausible(m, rawStockVal) ? rawStockVal : null;
    const { value: sectorMedian, n: peersUsed } = median(m);
    // Moins de 2 pairs exploitables : pas de référence sectorielle fiable
    const sectorAvg = peersUsed >= 2 ? sectorMedian : null;
    const diff = stockVal != null && sectorAvg != null
      ? parseFloat(((stockVal - sectorAvg) / sectorAvg * 100).toFixed(1))
      : null;

    const lowerIsBetter = ['pe_ratio', 'pb_ratio', 'debt_to_equity'].includes(m);
    let interpretation = 'N/D';
    if (diff != null) {
      if (lowerIsBetter) {
        interpretation = diff > 15 ? 'premium élevé' : diff < -15 ? 'décote significative' : 'dans la norme';
      } else {
        interpretation = diff > 15 ? 'supérieur au secteur' : diff < -15 ? 'inférieur au secteur' : 'dans la norme';
      }
    }

    benchmark[m] = {
      stock: stockVal ?? (rawStockVal != null ? 'N/D (valeur incohérente écartée)' : 'N/D'),
      sector_median: sectorAvg ?? 'N/D',
      sector_peers_used: peersUsed,
      vs_sector_pct: diff != null ? `${diff > 0 ? '+' : ''}${diff}%` : 'N/D',
      interpretation,
    };
  }

  return {
    symbol: sym,
    name: stock.company_name,
    sector: stock.sector,
    sector_peers_count: peers.length,
    fundamentals_year: fund?.year ?? 'N/D',
    benchmark,
  };
}

// ─── Tool 5 : Top/Flop performers ────────────────────────────────────────────

async function getTopPerformers({
  period,
  sector,
  limit = 5,
  direction = 'top',
}: {
  period: string;
  sector?: string;
  limit?: number;
  direction?: 'top' | 'bottom';
}) {
  const days = PERIOD_TO_DAYS[period] ?? 30;
  const since = new Date(Date.now() - days * 86_400_000);
  const maxResults = Math.min(limit, 10);

  const stocks = await prisma.stock.findMany({
    where: { is_active: true, ...(sector ? { sector } : {}) },
    select: { symbol: true, company_name: true, sector: true, current_price: true },
  });

  const perfs = await Promise.all(
    stocks.map(async (stock: any) => {
      const firstPrice = await prisma.stockHistory.findFirst({
        where: { stock_ticker: stock.symbol, date: { gte: since } },
        orderBy: { date: 'asc' },
        select: { close: true, date: true },
      });
      if (!firstPrice || !stock.current_price) return null;
      const perf = ((stock.current_price - firstPrice.close) / firstPrice.close) * 100;
      return {
        symbol: stock.symbol,
        name: stock.company_name,
        sector: stock.sector,
        start_price: firstPrice.close,
        current_price: stock.current_price,
        performance_pct: parseFloat(perf.toFixed(2)),
        since_date: firstPrice.date.toISOString().split('T')[0],
      };
    }),
  );

  return perfs
    .filter(Boolean)
    .sort((a: any, b: any) =>
      direction === 'top' ? b.performance_pct - a.performance_pct : a.performance_pct - b.performance_pct,
    )
    .slice(0, maxResults);
}

// ─── Map outil → executor ─────────────────────────────────────────────────────

export const TOOL_EXECUTORS: Record<AnalystToolName, (args: any) => Promise<any>> = {
  getStockData,
  getHistoricalPerformance,
  compareStocks,
  getSectorBenchmark,
  getTopPerformers,
};
