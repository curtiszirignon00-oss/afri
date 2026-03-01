import type { OHLCVData } from '../types/chart.types';

/**
 * Convertit une date string en timestamp unix (secondes)
 */
export const dateToTimestamp = (dateString: string): number => {
  const date = new Date(dateString);
  return Math.floor(date.getTime() / 1000);
};

/**
 * Interface pour les données brutes de l'ancien format
 */
export interface RawStockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Convertit les données de l'ancien format (avec date string) vers le nouveau format OHLCVData
 * @param rawData - Données au format brut avec date string
 * @returns Données au format OHLCVData avec timestamp
 */
export const convertToOHLCVData = (rawData: RawStockData[]): OHLCVData[] => {
  return rawData
    .map((item) => ({
      date: item.date,
      time: dateToTimestamp(item.date),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }))
    .sort((a, b) => a.time - b.time); // Trier par ordre chronologique
};

/**
 * Génère des données mock pour les tests (optionnel)
 */
export const generateMockOHLCVData = (
  days: number = 365,
  startPrice: number = 10000
): OHLCVData[] => {
  const data: OHLCVData[] = [];
  let currentPrice = startPrice;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Générer des variations aléatoires
    const volatility = currentPrice * 0.02;
    const open = currentPrice;
    const change = (Math.random() - 0.5) * volatility;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    data.push({
      date: date.toISOString().split('T')[0],
      time: Math.floor(date.getTime() / 1000),
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume,
    });

    currentPrice = close;
  }

  return data;
};

/**
 * Filtre les données selon l'intervalle de temps sélectionné
 */
export const filterDataByInterval = (
  data: OHLCVData[],
  interval: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | 'ALL'
): OHLCVData[] => {
  if (interval === 'ALL' || data.length === 0) {
    return data;
  }

  const now = new Date();
  let startDate = new Date();

  switch (interval) {
    case '1D':
      startDate.setDate(now.getDate() - 1);
      break;
    case '5D':
      startDate.setDate(now.getDate() - 5);
      break;
    case '1M':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '3M':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6M':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case '1Y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  return data.filter((item) => item.time >= startTimestamp);
};

/**
 * Agrège des données journalières en bougies hebdomadaires (lundi → vendredi).
 * 1 bougie = 1 semaine : open=lundi, close=vendredi, high=max, low=min, volume=somme.
 */
export const aggregateToWeekly = (data: OHLCVData[]): OHLCVData[] => {
  if (data.length === 0) return data;

  const weeks = new Map<string, OHLCVData[]>();

  for (const bar of data) {
    const d = new Date(bar.time * 1000);
    // Ramener au lundi de la semaine (ISO week)
    const day = d.getUTCDay(); // 0=dim, 1=lun, ...6=sam
    const diff = (day === 0 ? -6 : 1 - day); // décalage vers lundi
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() + diff);
    const key = monday.toISOString().slice(0, 10);
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(bar);
  }

  const result: OHLCVData[] = [];
  for (const [key, bars] of Array.from(weeks.entries()).sort()) {
    const sorted = bars.sort((a, b) => a.time - b.time);
    result.push({
      date: key,
      time: Math.floor(new Date(key + 'T00:00:00Z').getTime() / 1000),
      open: sorted[0].open,
      high: Math.max(...sorted.map(b => b.high)),
      low: Math.min(...sorted.map(b => b.low)),
      close: sorted[sorted.length - 1].close,
      volume: sorted.reduce((s, b) => s + b.volume, 0),
    });
  }

  return result;
};

/**
 * Agrège des données journalières en bougies mensuelles.
 * 1 bougie = 1 mois : open=1er jour, close=dernier jour, high=max, low=min, volume=somme.
 */
export const aggregateToMonthly = (data: OHLCVData[]): OHLCVData[] => {
  if (data.length === 0) return data;

  const months = new Map<string, OHLCVData[]>();

  for (const bar of data) {
    const d = new Date(bar.time * 1000);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!months.has(key)) months.set(key, []);
    months.get(key)!.push(bar);
  }

  const result: OHLCVData[] = [];
  for (const [key, bars] of Array.from(months.entries()).sort()) {
    const sorted = bars.sort((a, b) => a.time - b.time);
    const firstDay = key + '-01';
    result.push({
      date: firstDay,
      time: Math.floor(new Date(firstDay + 'T00:00:00Z').getTime() / 1000),
      open: sorted[0].open,
      high: Math.max(...sorted.map(b => b.high)),
      low: Math.min(...sorted.map(b => b.low)),
      close: sorted[sorted.length - 1].close,
      volume: sorted.reduce((s, b) => s + b.volume, 0),
    });
  }

  return result;
};

/**
 * Agrège des données journalières en bougies trimestrielles (Q1/Q2/Q3/Q4).
 * 1 bougie = 3 mois
 */
export const aggregateToQuarterly = (data: OHLCVData[]): OHLCVData[] => {
  if (data.length === 0) return data;

  const quarters = new Map<string, OHLCVData[]>();

  for (const bar of data) {
    const d = new Date(bar.time * 1000);
    const year = d.getUTCFullYear();
    const q = Math.floor(d.getUTCMonth() / 3) + 1; // 1..4
    const key = `${year}-Q${q}`;
    if (!quarters.has(key)) quarters.set(key, []);
    quarters.get(key)!.push(bar);
  }

  const result: OHLCVData[] = [];
  for (const [key, bars] of Array.from(quarters.entries()).sort()) {
    const sorted = bars.sort((a, b) => a.time - b.time);
    // Début du trimestre : Jan=0, Avr=3, Jul=6, Oct=9
    const [yearStr, qStr] = key.split('-Q');
    const startMonth = (parseInt(qStr) - 1) * 3;
    const firstDay = `${yearStr}-${String(startMonth + 1).padStart(2, '0')}-01`;
    result.push({
      date: firstDay,
      time: Math.floor(new Date(firstDay + 'T00:00:00Z').getTime() / 1000),
      open: sorted[0].open,
      high: Math.max(...sorted.map(b => b.high)),
      low: Math.min(...sorted.map(b => b.low)),
      close: sorted[sorted.length - 1].close,
      volume: sorted.reduce((s, b) => s + b.volume, 0),
    });
  }

  return result;
};

/**
 * Agrège des données journalières en bougies semestrielles (S1/S2).
 * 1 bougie = 6 mois
 */
export const aggregateToSemiAnnual = (data: OHLCVData[]): OHLCVData[] => {
  if (data.length === 0) return data;

  const halves = new Map<string, OHLCVData[]>();

  for (const bar of data) {
    const d = new Date(bar.time * 1000);
    const year = d.getUTCFullYear();
    const h = d.getUTCMonth() < 6 ? 1 : 2;
    const key = `${year}-H${h}`;
    if (!halves.has(key)) halves.set(key, []);
    halves.get(key)!.push(bar);
  }

  const result: OHLCVData[] = [];
  for (const [key, bars] of Array.from(halves.entries()).sort()) {
    const sorted = bars.sort((a, b) => a.time - b.time);
    const [yearStr, hStr] = key.split('-H');
    const startMonth = hStr === '1' ? '01' : '07';
    const firstDay = `${yearStr}-${startMonth}-01`;
    result.push({
      date: firstDay,
      time: Math.floor(new Date(firstDay + 'T00:00:00Z').getTime() / 1000),
      open: sorted[0].open,
      high: Math.max(...sorted.map(b => b.high)),
      low: Math.min(...sorted.map(b => b.low)),
      close: sorted[sorted.length - 1].close,
      volume: sorted.reduce((s, b) => s + b.volume, 0),
    });
  }

  return result;
};

/**
 * Agrège des données journalières en bougies annuelles.
 * 1 bougie = 1 an
 */
export const aggregateToAnnual = (data: OHLCVData[]): OHLCVData[] => {
  if (data.length === 0) return data;

  const years = new Map<string, OHLCVData[]>();

  for (const bar of data) {
    const d = new Date(bar.time * 1000);
    const key = String(d.getUTCFullYear());
    if (!years.has(key)) years.set(key, []);
    years.get(key)!.push(bar);
  }

  const result: OHLCVData[] = [];
  for (const [key, bars] of Array.from(years.entries()).sort()) {
    const sorted = bars.sort((a, b) => a.time - b.time);
    const firstDay = `${key}-01-01`;
    result.push({
      date: firstDay,
      time: Math.floor(new Date(firstDay + 'T00:00:00Z').getTime() / 1000),
      open: sorted[0].open,
      high: Math.max(...sorted.map(b => b.high)),
      low: Math.min(...sorted.map(b => b.low)),
      close: sorted[sorted.length - 1].close,
      volume: sorted.reduce((s, b) => s + b.volume, 0),
    });
  }

  return result;
};

// ─── Système de résolution ───────────────────────────────────────────────────

export type CandleResolution =
  | 'hourly'       // 1H  – données horaires (fallback: journalier)
  | 'daily'        // 1J  – 1 bougie = 1 jour
  | 'weekly'       // 5J  – 1 bougie = 1 semaine
  | 'monthly'      // 1M  – 1 bougie = 1 mois
  | 'quarterly'    // 3M  – 1 bougie = 3 mois
  | 'semiannual'   // 6M  – 1 bougie = 6 mois
  | 'annual';      // 1A  – 1 bougie = 1 an

export const RESOLUTION_LABEL: Record<CandleResolution, string> = {
  hourly:     '1 bougie ≈ 1 heure',
  daily:      '1 bougie = 1 jour',
  weekly:     '1 bougie = 1 semaine',
  monthly:    '1 bougie = 1 mois',
  quarterly:  '1 bougie = 3 mois',
  semiannual: '1 bougie = 6 mois',
  annual:     '1 bougie = 1 an',
};

/**
 * Applique l'agrégation selon la résolution demandée.
 * Les données doivent déjà être filtrées par plage si nécessaire.
 */
export const applyResolution = (
  data: OHLCVData[],
  resolution: CandleResolution
): OHLCVData[] => {
  switch (resolution) {
    case 'hourly':
    case 'daily':
      return data;
    case 'weekly':
      return aggregateToWeekly(data);
    case 'monthly':
      return aggregateToMonthly(data);
    case 'quarterly':
      return aggregateToQuarterly(data);
    case 'semiannual':
      return aggregateToSemiAnnual(data);
    case 'annual':
      return aggregateToAnnual(data);
  }
};

// ─── Ancienne API maintenue pour compatibilité ───────────────────────────────

/** @deprecated Utiliser applyResolution() */
export const getResolutionForInterval = (
  interval: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | 'ALL'
): CandleResolution => {
  switch (interval) {
    case '1D':
    case '5D':
    case '1M':
      return 'daily';
    case '3M':
    case '6M':
    case '1Y':
      return 'weekly';
    case 'ALL':
      return 'monthly';
  }
};

/** @deprecated Utiliser applyResolution() */
export const prepareChartData = (
  data: OHLCVData[],
  interval: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | 'ALL'
): OHLCVData[] => {
  const filtered = filterDataByInterval(data, interval);
  return applyResolution(filtered, getResolutionForInterval(interval));
};
