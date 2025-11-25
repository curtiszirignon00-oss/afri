/**
 * Utilitaires pour calculer les indicateurs techniques
 */

export interface IndicatorData {
  time: number;
  value: number;
}

/**
 * Calcule la Moyenne Mobile Simple (SMA)
 */
export function calculateSMA(data: { time: number; close: number }[], period: number): IndicatorData[] {
  const result: IndicatorData[] = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({
      time: data[i].time,
      value: sum / period,
    });
  }

  return result;
}

/**
 * Calcule la Moyenne Mobile Exponentielle (EMA)
 */
export function calculateEMA(data: { time: number; close: number }[], period: number): IndicatorData[] {
  const result: IndicatorData[] = [];
  const multiplier = 2 / (period + 1);

  // Première valeur = SMA
  let ema = 0;
  for (let i = 0; i < period; i++) {
    ema += data[i].close;
  }
  ema = ema / period;

  result.push({
    time: data[period - 1].time,
    value: ema,
  });

  // Calcul EMA pour les valeurs suivantes
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result.push({
      time: data[i].time,
      value: ema,
    });
  }

  return result;
}

/**
 * Calcule les Bandes de Bollinger
 */
export function calculateBollingerBands(
  data: { time: number; close: number }[],
  period: number = 20,
  stdDev: number = 2
): {
  upper: IndicatorData[];
  middle: IndicatorData[];
  lower: IndicatorData[];
} {
  const middle = calculateSMA(data, period);
  const upper: IndicatorData[] = [];
  const lower: IndicatorData[] = [];

  for (let i = period - 1; i < data.length; i++) {
    // Calculer la moyenne
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    const mean = sum / period;

    // Calculer l'écart-type
    let variance = 0;
    for (let j = 0; j < period; j++) {
      variance += Math.pow(data[i - j].close - mean, 2);
    }
    const standardDeviation = Math.sqrt(variance / period);

    const time = data[i].time;
    upper.push({
      time,
      value: mean + stdDev * standardDeviation,
    });
    lower.push({
      time,
      value: mean - stdDev * standardDeviation,
    });
  }

  return { upper, middle, lower };
}

/**
 * Calcule le RSI (Relative Strength Index)
 */
export function calculateRSI(data: { time: number; close: number }[], period: number = 14): IndicatorData[] {
  const result: IndicatorData[] = [];

  if (data.length < period + 1) return result;

  // Calculer les gains et pertes
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  // Première moyenne
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < data.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    result.push({
      time: data[i].time,
      value: rsi,
    });
  }

  return result;
}

/**
 * Calcule le MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  data: { time: number; close: number }[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macd: IndicatorData[];
  signal: IndicatorData[];
  histogram: IndicatorData[];
} {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // Calculer MACD line
  const macdLine: IndicatorData[] = [];
  const startIndex = slowPeriod - fastPeriod;

  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push({
      time: slowEMA[i].time,
      value: fastEMA[i + startIndex].value - slowEMA[i].value,
    });
  }

  // Calculer signal line (EMA du MACD)
  const signalLine = calculateEMA(
    macdLine.map(d => ({ time: d.time, close: d.value })),
    signalPeriod
  );

  // Calculer histogram
  const histogram: IndicatorData[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    const macdIndex = macdLine.findIndex(m => m.time === signalLine[i].time);
    if (macdIndex !== -1) {
      histogram.push({
        time: signalLine[i].time,
        value: macdLine[macdIndex].value - signalLine[i].value,
      });
    }
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
  };
}
