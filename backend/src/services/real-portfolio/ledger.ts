// backend/src/services/real-portfolio/ledger.ts
// Rejoue les transactions d'un portefeuille réel (PRU moyen pondéré, frais
// inclus) en appliquant les splits vérifiés. Fonctions pures : aucune I/O.
//
// Convention : quantité et cours d'une transaction sont exprimés dans la base
// du jour de la transaction (valeurs « brutes », comme l'historique BRVM en
// base). Les splits postérieurs sont appliqués au fil du rejeu.

import type { Bar, DividendEvent, LedgerPosition, LedgerTx, SplitEvent } from './types';
import { eachDay } from './dates';

const SIDE_ORDER: Record<LedgerTx['side'], number> = { OPENING: 0, BUY: 1, SELL: 2 };

export function sortTxs<T extends LedgerTx>(txs: T[]): T[] {
  return [...txs].sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : SIDE_ORDER[a.side] - SIDE_ORDER[b.side]);
}

export interface Oversell {
  tx: LedgerTx;
  held: number;
}

interface TickerState {
  quantity: number;
  averageCost: number;
  realizedPnl: number;
  dividends: number;
  firstDate: string;
}

type Event =
  | { kind: 'split'; date: string; ratio: number }
  | { kind: 'dividend'; date: string; amount: number }
  | { kind: 'tx'; date: string; tx: LedgerTx };

function eventRank(e: Event): number {
  // Le jour de détachement, split et dividende s'appliquent avant les ordres du jour.
  if (e.kind === 'split') return -2;
  if (e.kind === 'dividend') return -1;
  return SIDE_ORDER[e.tx.side];
}

function buildEvents(txs: LedgerTx[], splits: SplitEvent[], dividends: DividendEvent[], until?: string): Event[] {
  const firstDate = txs.reduce((m, t) => (t.date < m ? t.date : m), '9999-12-31');
  const events: Event[] = txs.map(tx => ({ kind: 'tx' as const, date: tx.date, tx }));
  for (const s of splits) if (s.exDate > firstDate && (!until || s.exDate <= until)) events.push({ kind: 'split', date: s.exDate, ratio: s.ratio });
  for (const d of dividends) if (d.exDate > firstDate && (!until || d.exDate <= until)) events.push({ kind: 'dividend', date: d.exDate, amount: d.amount });
  return events.sort((a, b) => (a.date !== b.date ? a.date.localeCompare(b.date) : eventRank(a) - eventRank(b)));
}

function applyEvent(st: TickerState, e: Event, oversells: Oversell[]): void {
  if (e.kind === 'split') {
    st.quantity *= e.ratio;
    st.averageCost /= e.ratio;
    return;
  }
  if (e.kind === 'dividend') {
    st.dividends += st.quantity * e.amount;
    return;
  }
  const { tx } = e;
  if (tx.side === 'SELL') {
    const q = Math.min(tx.quantity, st.quantity);
    if (tx.quantity > st.quantity + 1e-9) oversells.push({ tx, held: st.quantity });
    st.realizedPnl += tx.price * q - tx.fees - st.averageCost * q;
    st.quantity -= q;
    if (st.quantity < 1e-9) { st.quantity = 0; st.averageCost = 0; }
    return;
  }
  // OPENING / BUY : PRU moyen pondéré, frais d'achat capitalisés
  const cost = st.averageCost * st.quantity + tx.price * tx.quantity + tx.fees;
  st.quantity += tx.quantity;
  st.averageCost = st.quantity > 0 ? cost / st.quantity : 0;
}

export interface ReplayResult {
  positions: LedgerPosition[]; // inclut les lignes soldées (realized only)
  oversells: Oversell[];
}

/**
 * Rejoue toutes les transactions jusqu'à `until` (inclus, défaut : tout).
 */
export function replay(
  txs: LedgerTx[],
  splitsOf: (t: string) => SplitEvent[],
  dividendsOf: (t: string) => DividendEvent[] = () => [],
  until?: string,
): ReplayResult {
  const byTicker = new Map<string, LedgerTx[]>();
  for (const tx of txs) {
    if (until && tx.date > until) continue;
    const arr = byTicker.get(tx.ticker) ?? [];
    arr.push(tx);
    byTicker.set(tx.ticker, arr);
  }

  const positions: LedgerPosition[] = [];
  const oversells: Oversell[] = [];
  for (const [ticker, list] of byTicker) {
    const st: TickerState = { quantity: 0, averageCost: 0, realizedPnl: 0, dividends: 0, firstDate: list[0].date };
    for (const e of buildEvents(list, splitsOf(ticker), dividendsOf(ticker), until)) {
      if (e.kind === 'tx' && e.date < st.firstDate) st.firstDate = e.date;
      applyEvent(st, e, oversells);
    }
    positions.push({
      ticker,
      quantity: round(st.quantity),
      averageCost: st.averageCost,
      costBasis: st.averageCost * st.quantity,
      realizedPnl: st.realizedPnl,
      dividends: st.dividends,
      firstDate: st.firstDate,
    });
  }
  return { positions, oversells };
}

function round(q: number): number {
  return Math.abs(q - Math.round(q)) < 1e-6 ? Math.round(q) : q;
}

// ─── Historique de cours nettoyé ──────────────────────────────────────────

/**
 * Écarte les cours aberrants de l'historique brut (lignes parasites aux anciens
 * prix autour des splits 2014-2017). Un saut ×3 n'est accepté que s'il coïncide
 * avec un split vérifié ou s'il est confirmé par les deux séances suivantes.
 */
export function cleanBars(bars: Bar[], splits: SplitEvent[] = []): Bar[] {
  const splitDates = splits.map(s => s.exDate);
  const out: Bar[] = [];
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    if (!(b.close > 0)) continue;
    const prev = out[out.length - 1];
    if (!prev) { out.push(b); continue; }
    const r = b.close / prev.close;
    if (r <= 3 && r >= 1 / 3) { out.push(b); continue; }
    if (splitDates.some(d => d > prev.date && d <= b.date)) { out.push(b); continue; }
    const next = bars.slice(i + 1, i + 3).filter(n => n.close > 0);
    const confirmed = next.length === 2 && next.every(n => Math.abs(n.close / b.close - 1) < 0.25);
    if (confirmed) out.push(b);
  }
  return out;
}

export interface SeriesPoint {
  date: string;
  value: number; // valeur de marché des titres
  invested: number; // coût de revient des lignes détenues
}

/**
 * Série journalière de valorisation des titres, de la première transaction à
 * `to`. Les quantités et les cours sont dans la même base (brute) à chaque date.
 */
export function buildValueSeries(
  txs: LedgerTx[],
  barsOf: (t: string) => Bar[],
  splitsOf: (t: string) => SplitEvent[],
  to: string,
  lastPriceOf: (t: string) => number,
): SeriesPoint[] {
  if (txs.length === 0) return [];
  const sorted = sortTxs(txs);
  const from = sorted[0].date;
  const tickers = Array.from(new Set(sorted.map(t => t.ticker)));

  // Événements par ticker (transactions + splits) consommés au fil des jours.
  const queues = new Map<string, Event[]>();
  const states = new Map<string, TickerState>();
  const prices = new Map<string, { bars: Bar[]; idx: number; last: number }>();
  for (const t of tickers) {
    const list = sorted.filter(x => x.ticker === t);
    queues.set(t, buildEvents(list, splitsOf(t), [], to));
    states.set(t, { quantity: 0, averageCost: 0, realizedPnl: 0, dividends: 0, firstDate: list[0].date });
    prices.set(t, { bars: cleanBars(barsOf(t), splitsOf(t)), idx: 0, last: 0 });
  }

  const ignored: Oversell[] = [];
  const series: SeriesPoint[] = [];
  for (const day of eachDay(from, to)) {
    let value = 0;
    let invested = 0;
    for (const t of tickers) {
      const q = queues.get(t)!;
      const st = states.get(t)!;
      while (q.length && q[0].date <= day) applyEvent(st, q.shift()!, ignored);

      const p = prices.get(t)!;
      while (p.idx < p.bars.length && p.bars[p.idx].date <= day) p.last = p.bars[p.idx++].close;
      // Dernier jour : cours courant du référentiel. Pas encore de cours connu :
      // on valorise au prix de revient.
      const live = day === to ? lastPriceOf(t) : 0;
      const px = live || p.last || st.averageCost || lastPriceOf(t);
      value += st.quantity * px;
      invested += st.quantity * st.averageCost;
    }
    series.push({ date: day, value, invested });
  }
  return series;
}
