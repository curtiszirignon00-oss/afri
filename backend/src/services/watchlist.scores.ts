/**
 * AfriBourse – Watchlist Signal Score (backend mirror of signalScore.ts)
 * Computes a lightweight composite score [0–100] per ticker from DB data.
 * Same normalisation tables as the frontend engine (signalScore.ts v2).
 */

import prisma from '../config/prisma';

// ── Types ──────────────────────────────────────────────────────────────────────

export type SignalZone =
  | 'Vente Forte'
  | 'Signal Vente'
  | 'Neutre'
  | 'Signal Achat'
  | 'Achat Fort';

export interface TickerScore {
  ticker: string;
  score: number;
  zone: SignalZone;
  technical: number | null;
  fundamental: number | null;
  reliability: number; // 0–1
  dataQuality: 'good' | 'partial' | 'low';
}

// ── Indicator helpers ──────────────────────────────────────────────────────────

function sma(arr: number[], period: number): number | null {
  if (arr.length < period) return null;
  const slice = arr.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function ema(arr: number[], period: number): number[] {
  if (arr.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [arr[0]];
  for (let i = 1; i < arr.length; i++) {
    out.push(arr[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) avgGain += d; else avgLoss += Math.abs(d);
  }
  avgGain /= period; avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d < 0 ? Math.abs(d) : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function macdHistogram(closes: number[]): number | null {
  if (closes.length < 35) return null;
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]).slice(25);
  if (macdLine.length < 9) return null;
  const signal = ema(macdLine, 9);
  return macdLine[macdLine.length - 1] - signal[signal.length - 1];
}

function bollingerPosition(closes: number[], period = 20): number | null {
  const m = sma(closes.slice(-period), period);
  if (m == null) return null;
  const variance =
    closes.slice(-period).reduce((s, v) => s + (v - m) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  if (std === 0) return 50;
  const last = closes[closes.length - 1];
  const upper = m + 2 * std;
  const lower = m - 2 * std;
  return Math.max(0, Math.min(100, ((last - lower) / (upper - lower)) * 100));
}

// ── Normalisation (same tables as frontend signalScore.ts) ────────────────────

const normalizeRSI = (v: number) => {
  if (v <= 20) return 8;  if (v <= 25) return 15; if (v <= 30) return 22;
  if (v <= 35) return 30; if (v <= 40) return 38; if (v <= 45) return 44;
  if (v <= 55) return 50; if (v <= 60) return 58; if (v <= 65) return 65;
  if (v <= 70) return 73; if (v <= 75) return 80; if (v <= 80) return 85;
  return 90;
};

const normalizeMACD = (h: number) => {
  if (h > 80)  return 90; if (h > 50)  return 82; if (h > 25) return 74;
  if (h > 10)  return 65; if (h > 2)   return 57; if (h >= 0) return 52;
  if (h > -2)  return 47; if (h > -10) return 42; if (h > -25) return 34;
  if (h > -50) return 24; if (h > -80) return 16;
  return 8;
};

const normalizeBB = (p: number) => {
  if (p <= 3)  return 80; if (p <= 10) return 73; if (p <= 20) return 65;
  if (p <= 35) return 57; if (p <= 50) return 50; if (p <= 65) return 44;
  if (p <= 80) return 37; if (p <= 90) return 30; if (p <= 97) return 22;
  return 15;
};

const normalizeMADev = (pct: number) => {
  if (pct >= 10) return 90; if (pct >= 7)  return 83; if (pct >= 5) return 76;
  if (pct >= 3)  return 68; if (pct >= 1)  return 60; if (pct >= 0) return 53;
  if (pct >= -1) return 47; if (pct >= -3) return 40; if (pct >= -5) return 32;
  if (pct >= -7) return 24; if (pct >= -10) return 17;
  return 8;
};

const normalizeVol = (r: number) => {
  if (r >= 250) return 82; if (r >= 200) return 76; if (r >= 150) return 68;
  if (r >= 120) return 61; if (r >= 100) return 55; if (r >= 80)  return 49;
  if (r >= 60)  return 43; if (r >= 40)  return 36; if (r >= 20)  return 28;
  return 20;
};

const normalizePER = (v: number) => {
  if (v <= 0 || v > 80) return 12;
  if (v <= 5)  return 88; if (v <= 8)  return 82; if (v <= 12) return 74;
  if (v <= 15) return 66; if (v <= 20) return 57; if (v <= 25) return 47;
  if (v <= 30) return 38; if (v <= 40) return 28; if (v <= 60) return 18;
  return 12;
};

const normalizeROE = (v: number) => {
  if (v <= 0)  return 10; if (v <= 4)  return 22; if (v <= 8)  return 35;
  if (v <= 12) return 50; if (v <= 16) return 63; if (v <= 20) return 74;
  if (v <= 25) return 83; if (v <= 30) return 88;
  return 92;
};

const normalizeMargin = (v: number) => {
  if (v <= 0)  return 8;  if (v <= 2)  return 20; if (v <= 5)  return 35;
  if (v <= 8)  return 48; if (v <= 12) return 60; if (v <= 15) return 70;
  if (v <= 20) return 78; if (v <= 25) return 84;
  return 90;
};

const normalizeDivYield = (v: number) => {
  if (v <= 0) return 28; if (v <= 1) return 38; if (v <= 2) return 48;
  if (v <= 3) return 56; if (v <= 4) return 63; if (v <= 5) return 70;
  if (v <= 6) return 77; if (v <= 8) return 83;
  return 90;
};

const normalizeDebt = (v: number) => {
  if (v < 0)    return 5;
  if (v <= 0.2) return 90; if (v <= 0.5) return 80; if (v <= 0.8) return 70;
  if (v <= 1.0) return 60; if (v <= 1.5) return 50; if (v <= 2.0) return 40;
  if (v <= 3.0) return 28; if (v <= 5.0) return 16;
  return 8;
};

// ── Zone from score ────────────────────────────────────────────────────────────

function scoreToZone(score: number): SignalZone {
  if (score >= 68) return 'Achat Fort';
  if (score >= 55) return 'Signal Achat';
  if (score >= 45) return 'Neutre';
  if (score >= 32) return 'Signal Vente';
  return 'Vente Forte';
}

// ── Core computation for one ticker ───────────────────────────────────────────

function computeScore(
  closes: number[],
  volumes: number[],
  fund: {
    pe_ratio?: number | null;
    roe?: number | null;
    profit_margin?: number | null;
    dividend_yield?: number | null;
    debt_to_equity?: number | null;
  } | null
): { score: number; zone: SignalZone; technical: number | null; fundamental: number | null; reliability: number } {
  // ── Technical ──
  const techScores: number[] = [];

  const rsiVal = rsi(closes);
  if (rsiVal != null) techScores.push(normalizeRSI(rsiVal));

  const macdH = macdHistogram(closes);
  if (macdH != null) techScores.push(normalizeMACD(macdH));

  const bbPos = bollingerPosition(closes);
  if (bbPos != null) techScores.push(normalizeBB(bbPos));

  const ma20 = sma(closes, 20);
  const last = closes[closes.length - 1];
  if (ma20 != null) {
    const dev20 = ((last - ma20) / ma20) * 100;
    techScores.push(normalizeMADev(dev20));
  }

  const ma50 = sma(closes, 50);
  if (ma50 != null) {
    const dev50 = ((last - ma50) / ma50) * 100;
    techScores.push(normalizeMADev(dev50));
  }

  if (volumes.length >= 20) {
    const avgVol20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const lastVol = volumes[volumes.length - 1];
    if (avgVol20 > 0) techScores.push(normalizeVol((lastVol / avgVol20) * 100));
  }

  const technical =
    techScores.length > 0
      ? techScores.reduce((a, b) => a + b, 0) / techScores.length
      : null;

  // ── Fundamental ──
  const fundScores: number[] = [];
  if (fund) {
    if (fund.pe_ratio != null && fund.pe_ratio > 0) fundScores.push(normalizePER(fund.pe_ratio));
    if (fund.roe != null) fundScores.push(normalizeROE(fund.roe));
    if (fund.profit_margin != null) fundScores.push(normalizeMargin(fund.profit_margin));
    if (fund.dividend_yield != null) fundScores.push(normalizeDivYield(fund.dividend_yield));
    if (fund.debt_to_equity != null) fundScores.push(normalizeDebt(fund.debt_to_equity));
  }

  const fundamental =
    fundScores.length > 0
      ? fundScores.reduce((a, b) => a + b, 0) / fundScores.length
      : null;

  // ── Reliability coefficient ──
  const totalActive = techScores.length + fundScores.length;
  const maxPossible = 11; // 6 tech + 5 fund
  const reliability = Math.min(1, totalActive / (maxPossible * 0.6));

  // ── Composite (balanced mode: 50% tech / 35% fund / rest neutral) ──
  const techW = 0.50, fundW = 0.35, neutral = 50;
  let raw = neutral;
  let usedW = 0;
  if (technical != null) { raw += (technical - 50) * techW; usedW += techW; }
  if (fundamental != null) { raw += (fundamental - 50) * fundW; usedW += fundW; }
  // Scale if only partial weights used
  const finalRaw = usedW > 0 ? 50 + (raw - 50) / Math.max(usedW, 0.5) * Math.min(usedW, 1) : 50;
  // Apply reliability squeeze toward 50
  const score = Math.round(50 + (finalRaw - 50) * reliability);
  const bounded = Math.max(0, Math.min(100, score));

  return { score: bounded, zone: scoreToZone(bounded), technical: technical ? Math.round(technical) : null, fundamental: fundamental ? Math.round(fundamental) : null, reliability };
}

// ── Main export ────────────────────────────────────────────────────────────────

export async function getWatchlistScores(userId: string): Promise<TickerScore[]> {
  // 1. Get watchlist tickers
  const items = await (prisma.watchlistItem as any).findMany({
    where: { userId },
    select: { stock_ticker: true },
  });
  if (items.length === 0) return [];

  const tickers: string[] = items.map((i: any) => i.stock_ticker);

  // 2. Fetch last 90 days of history per ticker (ordered asc for indicator calc)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 180); // 180 days to have enough bars

  const histories = await prisma.stockHistory.findMany({
    where: {
      stock_ticker: { in: tickers },
      date: { gte: cutoff },
    },
    orderBy: { date: 'asc' },
    select: { stock_ticker: true, close: true, volume: true },
  });

  // Group by ticker
  const historyMap: Record<string, { close: number; volume: number }[]> = {};
  for (const row of histories) {
    if (!historyMap[row.stock_ticker]) historyMap[row.stock_ticker] = [];
    historyMap[row.stock_ticker].push({ close: row.close, volume: row.volume });
  }

  // 3. Fetch latest fundamentals per ticker
  const fundamentals = await prisma.stockFundamental.findMany({
    where: { stock_ticker: { in: tickers } },
    select: {
      stock_ticker: true,
      pe_ratio: true,
      roe: true,
      profit_margin: true,
      dividend_yield: true,
      debt_to_equity: true,
    },
  });
  const fundMap: Record<string, typeof fundamentals[0]> = {};
  for (const f of fundamentals) fundMap[f.stock_ticker] = f;

  // 4. Compute score per ticker
  return tickers.map((ticker): TickerScore => {
    const hist = historyMap[ticker] ?? [];
    const closes = hist.map(h => h.close);
    const volumes = hist.map(h => h.volume);
    const fund = fundMap[ticker] ?? null;

    if (closes.length < 5) {
      return { ticker, score: 50, zone: 'Neutre', technical: null, fundamental: null, reliability: 0, dataQuality: 'low' };
    }

    const result = computeScore(closes, volumes, fund);
    const dataQuality = result.reliability >= 0.7 ? 'good' : result.reliability >= 0.4 ? 'partial' : 'low';
    return { ticker, ...result, dataQuality };
  });
}
