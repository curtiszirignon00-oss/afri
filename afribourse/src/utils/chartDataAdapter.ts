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
