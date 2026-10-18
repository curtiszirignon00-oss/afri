// backend/src/services/real-portfolio/market-data.ts
// Construit le MarketContext du moteur à partir du référentiel BRVM en base
// (Stock, StockHistory, CorporateAction). Chargements groupés par ticker.

import prisma from '../../config/prisma';
import type { Bar, DividendEvent, MarketContext, SplitEvent, StockRef } from './types';
import { addDays, toIso } from './dates';

const REF_TTL_MS = 10 * 60 * 1000;
let refCache: { at: number; stocks: StockRef[] } | null = null;

/** Référentiel des titres (+ première date d'historique), mis en cache 10 min. */
export async function loadStockRefs(): Promise<StockRef[]> {
  if (refCache && Date.now() - refCache.at < REF_TTL_MS) return refCache.stocks;
  const [stocks, firsts] = await Promise.all([
    prisma.stock.findMany({
      select: {
        symbol: true, company_name: true, current_price: true, previous_close: true, sector: true,
        listed_at: true, delisted_at: true,
      },
    }),
    prisma.stockHistory.groupBy({ by: ['stock_ticker'], _min: { date: true } }),
  ]);
  const firstBy = new Map(firsts.map(f => [f.stock_ticker, f._min.date]));
  const refs: StockRef[] = stocks.map(s => ({
    symbol: s.symbol,
    name: s.company_name,
    listedAt: s.listed_at ? toIso(s.listed_at) : null,
    delistedAt: s.delisted_at ? toIso(s.delisted_at) : null,
    firstHistoryDate: firstBy.get(s.symbol) ? toIso(firstBy.get(s.symbol)!) : null,
    lastPrice: s.current_price || 0,
    previousClose: s.previous_close || 0,
    sector: s.sector,
  }));
  refCache = { at: Date.now(), stocks: refs };
  return refs;
}

export interface BarRequest {
  ticker: string;
  /** Date la plus ancienne utile ; null = tout l'historique. */
  from: string | null;
}

/**
 * Charge cours, splits et dividendes vérifiés pour un ensemble de tickers.
 * Les cours sont chargés à partir de `from - 15 j` (séances encadrantes).
 */
export async function loadMarketContext(
  requests: BarRequest[],
  stocks?: StockRef[],
  /** false : opérations sur titres seulement (valorisation au dernier cours, sans historique). */
  withBars = true,
): Promise<MarketContext> {
  const refs = stocks ?? (await loadStockRefs());
  const fromBy = new Map<string, string | null>();
  for (const r of requests) {
    const prev = fromBy.get(r.ticker);
    if (prev === null) continue;
    fromBy.set(r.ticker, r.from === null || prev === undefined ? r.from : (r.from < prev ? r.from : prev));
  }
  const tickers = Array.from(fromBy.keys());

  const [histories, actions] = await Promise.all([
    Promise.all((withBars ? tickers : []).map(t => {
      const from = fromBy.get(t);
      return prisma.stockHistory.findMany({
        where: { stock_ticker: t, ...(from ? { date: { gte: new Date(`${addDays(from, -15)}T00:00:00.000Z`) } } : {}) },
        select: { date: true, low: true, high: true, close: true },
        orderBy: { date: 'asc' },
      });
    })),
    tickers.length
      ? prisma.corporateAction.findMany({ where: { stock_ticker: { in: tickers }, verified: true }, orderBy: { ex_date: 'asc' } })
      : Promise.resolve([]),
  ]);

  const bars = new Map<string, Bar[]>();
  histories.forEach((h, i) => bars.set(tickers[i], h.map(b => ({ date: toIso(b.date), low: b.low, high: b.high, close: b.close }))));

  const splits = new Map<string, SplitEvent[]>();
  const dividends = new Map<string, DividendEvent[]>();
  for (const a of actions) {
    const exDate = toIso(a.ex_date);
    if ((a.type === 'SPLIT' || a.type === 'REVERSE_SPLIT' || a.type === 'BONUS') && a.ratio && a.ratio > 0) {
      const list = splits.get(a.stock_ticker) ?? [];
      list.push({ exDate, ratio: a.ratio });
      splits.set(a.stock_ticker, list);
    } else if (a.type === 'DIVIDEND' && a.amount && a.amount > 0) {
      const list = dividends.get(a.stock_ticker) ?? [];
      list.push({ exDate, amount: a.amount });
      dividends.set(a.stock_ticker, list);
    }
  }

  return {
    today: toIso(new Date()),
    stocks: refs,
    bars: t => bars.get(t) ?? [],
    splits: t => splits.get(t) ?? [],
    dividends: t => dividends.get(t) ?? [],
  };
}
