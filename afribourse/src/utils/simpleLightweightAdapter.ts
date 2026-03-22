/**
 * Adaptateur SIMPLE pour lightweight-charts
 * Convertit les données de l'API vers le format lightweight-charts
 */

export interface APIStockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface LightweightChartData {
  date: string; // date ISO string
  time: string; // date YYYY-MM-DD — lightweight-charts l'interprète comme BusinessDay (ignore sam/dim)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Convertit les données API vers le format lightweight-charts.
 * - time au format YYYY-MM-DD → lightweight-charts traite comme BusinessDay (ignore sam/dim)
 * - filtre les jours non-ouvrés BRVM et les bougies fantômes (volume=0 + OHLC identiques)
 */
export function convertToLightweightData(apiData: APIStockData[]): LightweightChartData[] {
  if (!apiData || apiData.length === 0) return [];

  const result = apiData
    .filter(item => {
      const dateStr = item.date.slice(0, 10);
      const date = new Date(dateStr + 'T12:00:00Z');
      const dow = date.getUTCDay();
      // Exclure weekends
      if (dow === 0 || dow === 6) return false;
      // Exclure bougies fantômes (pas de cotation réelle)
      if (item.open === item.close && item.high === item.low && item.volume === 0) return false;
      return true;
    })
    .map(item => ({
      date: item.date,
      time: item.date.slice(0, 10), // YYYY-MM-DD strict → BusinessDay dans lightweight-charts
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }))
    .sort((a, b) => a.time.localeCompare(b.time));

  console.log('[BRVM] convertToLightweightData:', {
    avant: apiData.length,
    après: result.length,
    filtrés: apiData.length - result.length,
    premierPoint: result[0]?.time,
    dernierPoint: result[result.length - 1]?.time,
    exempleTime: typeof result[0]?.time, // doit être "string"
  });

  return result;
}
