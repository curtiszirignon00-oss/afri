// backend/src/services/splitAdjust.service.ts
// Ajustement des cours aux fractionnements, à la lecture.
//
// StockHistory et IntradaySnapshot gardent les cours BRUTS (tels que cotés).
// Les lecteurs qui comparent des cours dans le temps (graphique, variations,
// rapports, SIMBA…) divisent les séances antérieures à un split vérifié par son
// ratio : un cours d'avant le split SNTS 1:10 du 26/10/2026 (43 850) est servi
// à 4 385, dans la base actuelle.
//
// Les CorporateAction history_adjusted=true (historique déjà divisé en base) sont
// ignorées ici pour ne pas ajuster deux fois.

import prisma from '../config/prisma';

const SPLIT_TYPES = ['SPLIT', 'REVERSE_SPLIT', 'BONUS'];
const TTL_MS = 10 * 60 * 1000;

type Split = { exDate: Date; ratio: number };
let cache: { at: number; byTicker: Map<string, Split[]> } | null = null;

async function loadSplits(): Promise<Map<string, Split[]>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.byTicker;
  const actions = await prisma.corporateAction.findMany({
    where: { verified: true, type: { in: SPLIT_TYPES }, history_adjusted: { not: true } },
    select: { stock_ticker: true, ex_date: true, ratio: true },
  });
  const byTicker = new Map<string, Split[]>();
  for (const a of actions) {
    if (!a.ratio || a.ratio <= 0) continue;
    byTicker.set(a.stock_ticker, [...(byTicker.get(a.stock_ticker) ?? []), { exDate: a.ex_date, ratio: a.ratio }]);
  }
  cache = { at: Date.now(), byTicker };
  return byTicker;
}

/** Fractionnements d'un titre ajustés à la lecture (bascule « Ajusté / Brut » du graphique). */
export async function getSplitsFor(ticker: string): Promise<{ ex_date: string; ratio: number }[]> {
  const splits = (await loadSplits()).get(ticker) ?? [];
  return splits
    .map(s => ({ ex_date: s.exDate.toISOString().slice(0, 10), ratio: s.ratio }))
    .sort((a, b) => a.ex_date.localeCompare(b.ex_date));
}

/** À appeler après l'enregistrement d'une opération sur titres. */
export function invalidateSplitCache() {
  cache = null;
}

/**
 * Diviseur à appliquer à un cours daté `date`. Les imports Excel datent certaines
 * séances à 22:00/23:00 UTC la veille : une ligne à partir de J-1 22:00 UTC
 * appartient déjà à la séance de l'ex-date.
 */
function factorAt(splits: Split[] | undefined, date: Date): number {
  if (!splits) return 1;
  const t = date.getTime();
  return splits.reduce((f, s) => (t < s.exDate.getTime() - 2 * 3600e3 ? f * s.ratio : f), 1);
}

const PRICE_KEYS = ['open', 'high', 'low', 'close', 'price'] as const;

/**
 * Renvoie des copies des lignes ajustées : champs de cours (open/high/low/close/price)
 * divisés, volume multiplié. Les lignes sans split postérieur sont renvoyées telles quelles.
 */
export async function adjustForSplits<T extends object>(
  rows: T[],
  tickerOf: (r: T) => string,
  dateOf: (r: T) => Date,
): Promise<T[]> {
  if (rows.length === 0) return rows;
  const splits = await loadSplits();
  if (splits.size === 0) return rows;
  return rows.map(r => {
    const f = factorAt(splits.get(tickerOf(r)), dateOf(r));
    if (f === 1) return r;
    const out = { ...r } as Record<string, unknown>;
    for (const k of PRICE_KEYS) if (typeof out[k] === 'number') out[k] = (out[k] as number) / f;
    if (typeof out.volume === 'number') out.volume = Math.round((out.volume as number) * f);
    return out as T;
  });
}

/** Raccourci pour les lignes StockHistory (stock_ticker + date). */
export function adjustHistoryRows<T extends { stock_ticker: string; date: Date }>(rows: T[]): Promise<T[]> {
  return adjustForSplits(rows, r => r.stock_ticker, r => r.date);
}
