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
  time: number; // timestamp en secondes
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Convertit une date ISO string en timestamp unix (secondes)
 */
function dateToTimestamp(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

/**
 * Convertit les données API vers le format lightweight-charts
 * SIMPLE et DIRECT
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
      time: dateToTimestamp(item.date),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }))
    .sort((a, b) => a.time - b.time); // Tri chronologique IMPORTANT

  console.log('convertToLightweightData: Conversion complete', {
    outputLength: result.length,
    sampleOutput: result[0],
    firstTime: result[0]?.time,
    lastTime: result[result.length - 1]?.time
  });

  return result;
}
