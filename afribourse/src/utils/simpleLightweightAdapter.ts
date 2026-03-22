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
 * Utilise le format BusinessDay string (YYYY-MM-DD) pour éliminer les weekends.
 */
export function convertToLightweightData(apiData: APIStockData[]): LightweightChartData[] {
  console.log('convertToLightweightData: Starting conversion', {
    inputLength: apiData?.length || 0,
    sampleInput: apiData?.[0]
  });

  if (!apiData || apiData.length === 0) {
    console.log('convertToLightweightData: No data to convert');
    return [];
  }

  const result = apiData
    .map(item => ({
      date: item.date,
      time: item.date.slice(0, 10), // YYYY-MM-DD
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }))
    .sort((a, b) => a.time.localeCompare(b.time)); // Tri chronologique

  console.log('convertToLightweightData: Conversion complete', {
    outputLength: result.length,
    sampleOutput: result[0],
    firstTime: result[0]?.time,
    lastTime: result[result.length - 1]?.time
  });

  return result;
}
