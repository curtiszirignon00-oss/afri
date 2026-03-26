/**
 * Utilitaires pour calculer les indicateurs techniques
 */

export interface IndicatorData {
  time: string; // date YYYY-MM-DD (BusinessDay string pour lightweight-charts)
  value: number;
}

/**
 * Calcule la Moyenne Mobile Simple (SMA)
 */
export function calculateSMA(data: { time: string; close: number }[], period: number): IndicatorData[] {
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
export function calculateEMA(data: { time: string; close: number }[], period: number): IndicatorData[] {
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
  data: { time: string; close: number }[],
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
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    const mean = sum / period;

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
export function calculateRSI(data: { time: string; close: number }[], period: number = 14): IndicatorData[] {
  const result: IndicatorData[] = [];

  if (data.length < period + 1) return result;

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

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
 * Calcule le Stochastique (%K et %D lissés)
 * %K = (Close - LowestLow) / (HighestHigh - LowestLow) × 100
 * Slow %K = SMA(%K brut, smoothK) — Slow %D = SMA(Slow %K, smoothD)
 */
export function calculateStochastic(
  data: { time: string; high: number; low: number; close: number }[],
  period: number = 14,
  smoothK: number = 3,
  smoothD: number = 3
): { k: IndicatorData[]; d: IndicatorData[] } {
  if (data.length < period) return { k: [], d: [] };

  // Fast %K brut
  const rawK: { time: string; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const lowestLow = Math.min(...slice.map(d => d.low));
    const highestHigh = Math.max(...slice.map(d => d.high));
    const range = highestHigh - lowestLow;
    rawK.push({
      time: data[i].time,
      value: range === 0 ? 50 : ((data[i].close - lowestLow) / range) * 100,
    });
  }

  // Slow %K = SMA(rawK, smoothK)
  const slowK: IndicatorData[] = [];
  for (let i = smoothK - 1; i < rawK.length; i++) {
    const avg = rawK.slice(i - smoothK + 1, i + 1).reduce((s, d) => s + d.value, 0) / smoothK;
    slowK.push({ time: rawK[i].time, value: avg });
  }

  // Slow %D = SMA(slowK, smoothD)
  const slowD: IndicatorData[] = [];
  for (let i = smoothD - 1; i < slowK.length; i++) {
    const avg = slowK.slice(i - smoothD + 1, i + 1).reduce((s, d) => s + d.value, 0) / smoothD;
    slowD.push({ time: slowK[i].time, value: avg });
  }

  return { k: slowK, d: slowD };
}

/**
 * Calcule Williams %R
 * %R = (HighestHigh₁₄ - Close) / (HighestHigh₁₄ - LowestLow₁₄) × -100
 * Plage : -100 (survente) à 0 (surachat)
 */
export function calculateWilliamsR(
  data: { time: string; high: number; low: number; close: number }[],
  period: number = 14
): IndicatorData[] {
  const result: IndicatorData[] = [];
  if (data.length < period) return result;

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...slice.map(d => d.high));
    const lowestLow = Math.min(...slice.map(d => d.low));
    const range = highestHigh - lowestLow;
    result.push({
      time: data[i].time,
      value: range === 0 ? -50 : ((highestHigh - data[i].close) / range) * -100,
    });
  }
  return result;
}

/**
 * Calcule le CCI (Commodity Channel Index)
 * CCI = (TP - SMA(TP)) / (0.015 × DévMoyenne)
 */
export function calculateCCI(
  data: { time: string; high: number; low: number; close: number }[],
  period: number = 20
): IndicatorData[] {
  const result: IndicatorData[] = [];
  if (data.length < period) return result;

  const tp = data.map(d => (d.high + d.low + d.close) / 3);

  for (let i = period - 1; i < data.length; i++) {
    const slice = tp.slice(i - period + 1, i + 1);
    const sma = slice.reduce((s, v) => s + v, 0) / period;
    const mad = slice.reduce((s, v) => s + Math.abs(v - sma), 0) / period;
    result.push({
      time: data[i].time,
      value: mad === 0 ? 0 : (tp[i] - sma) / (0.015 * mad),
    });
  }
  return result;
}

/**
 * Calcule le ROC (Rate of Change)
 * ROC = (Close / Close[n] - 1) × 100
 */
export function calculateROC(
  data: { time: string; close: number }[],
  period: number = 12
): IndicatorData[] {
  const result: IndicatorData[] = [];
  if (data.length <= period) return result;

  for (let i = period; i < data.length; i++) {
    const prev = data[i - period].close;
    result.push({
      time: data[i].time,
      value: prev === 0 ? 0 : ((data[i].close / prev) - 1) * 100,
    });
  }
  return result;
}

/**
 * Calcule le MFI (Money Flow Index) — RSI pondéré par le volume
 * MFI = 100 - 100 / (1 + MF+/MF-)
 */
export function calculateMFI(
  data: { time: string; high: number; low: number; close: number; volume: number }[],
  period: number = 14
): IndicatorData[] {
  const result: IndicatorData[] = [];
  if (data.length <= period) return result;

  const tp = data.map(d => (d.high + d.low + d.close) / 3);
  const rawMF = data.map((d, i) => tp[i] * d.volume);

  for (let i = period; i < data.length; i++) {
    let posFlow = 0;
    let negFlow = 0;
    for (let j = i - period + 1; j <= i; j++) {
      if (tp[j] > tp[j - 1]) posFlow += rawMF[j];
      else negFlow += rawMF[j];
    }
    const mfi = negFlow === 0 ? 100 : 100 - 100 / (1 + posFlow / negFlow);
    result.push({ time: data[i].time, value: mfi });
  }
  return result;
}

/**
 * Calcule l'Aroon (Up et Down)
 * Aroon Up = (N - BarsSinceHighestHigh) / N × 100
 * Aroon Down = (N - BarsSinceLowestLow) / N × 100
 */
export function calculateAroon(
  data: { time: string; high: number; low: number }[],
  period: number = 25
): { up: IndicatorData[]; down: IndicatorData[] } {
  const up: IndicatorData[] = [];
  const down: IndicatorData[] = [];
  if (data.length <= period) return { up, down };

  for (let i = period; i < data.length; i++) {
    const slice = data.slice(i - period, i + 1); // period+1 bars
    let highIdx = 0;
    let lowIdx = 0;
    for (let j = 1; j <= period; j++) {
      if (slice[j].high >= slice[highIdx].high) highIdx = j;
      if (slice[j].low <= slice[lowIdx].low) lowIdx = j;
    }
    const barsSinceHigh = period - highIdx;
    const barsSinceLow = period - lowIdx;
    up.push({ time: data[i].time, value: ((period - barsSinceHigh) / period) * 100 });
    down.push({ time: data[i].time, value: ((period - barsSinceLow) / period) * 100 });
  }
  return { up, down };
}

/**
 * Calcule le MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  data: { time: string; close: number }[],
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

  const macdLine: IndicatorData[] = [];
  const startIndex = slowPeriod - fastPeriod;

  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push({
      time: slowEMA[i].time,
      value: fastEMA[i + startIndex].value - slowEMA[i].value,
    });
  }

  const signalLine = calculateEMA(
    macdLine.map(d => ({ time: d.time, close: d.value })),
    signalPeriod
  );

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

/**
 * ATR — Average True Range (lissage de Wilder)
 * TR = max(H-L, |H-PrevC|, |L-PrevC|)
 */
export function calculateATR(
  data: { time: string; high: number; low: number; close: number }[],
  period: number = 14
): IndicatorData[] {
  const result: IndicatorData[] = [];
  if (data.length < period + 1) return result;

  // Seed : moyenne simple des TR sur les `period` premières barres
  let atr = 0;
  for (let i = 1; i <= period; i++) {
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low  - data[i - 1].close)
    );
    atr += tr;
  }
  atr /= period;
  result.push({ time: data[period].time, value: atr });

  for (let i = period + 1; i < data.length; i++) {
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low  - data[i - 1].close)
    );
    atr = (atr * (period - 1) + tr) / period;
    result.push({ time: data[i].time, value: atr });
  }
  return result;
}

/**
 * ADX / DMI — Average Directional Index + DI+ et DI-
 * Retourne { diPlus, diMinus, adx }
 */
export function calculateADX(
  data: { time: string; high: number; low: number; close: number }[],
  period: number = 14
): { diPlus: IndicatorData[]; diMinus: IndicatorData[]; adx: IndicatorData[] } {
  const diPlus: IndicatorData[]  = [];
  const diMinus: IndicatorData[] = [];
  const adxLine: IndicatorData[] = [];

  if (data.length < period * 2 + 1) return { diPlus, diMinus, adx: adxLine };

  // Calcul des TR et DM bruts
  const trs: number[]  = [];
  const dmP: number[]  = [];
  const dmM: number[]  = [];

  for (let i = 1; i < data.length; i++) {
    const upMove   = data[i].high - data[i - 1].high;
    const downMove = data[i - 1].low - data[i].low;
    dmP.push(upMove > downMove && upMove > 0 ? upMove : 0);
    dmM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    trs.push(Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low  - data[i - 1].close)
    ));
  }

  // Seed : somme simple sur `period` barres
  let smTR = trs.slice(0, period).reduce((s, v) => s + v, 0);
  let smP  = dmP.slice(0, period).reduce((s, v) => s + v, 0);
  let smM  = dmM.slice(0, period).reduce((s, v) => s + v, 0);

  const dxValues: { time: string; value: number }[] = [];

  for (let i = period; i < trs.length; i++) {
    smTR = smTR - smTR / period + trs[i];
    smP  = smP  - smP  / period + dmP[i];
    smM  = smM  - smM  / period + dmM[i];

    const dp = smTR === 0 ? 0 : (smP / smTR) * 100;
    const dm = smTR === 0 ? 0 : (smM / smTR) * 100;
    const dx = (dp + dm) === 0 ? 0 : (Math.abs(dp - dm) / (dp + dm)) * 100;

    const t = data[i + 1].time; // +1 car trs[i] correspond à data[i+1]
    diPlus.push({ time: t, value: dp });
    diMinus.push({ time: t, value: dm });
    dxValues.push({ time: t, value: dx });
  }

  // ADX = lissage Wilder du DX sur `period` barres
  if (dxValues.length < period) return { diPlus, diMinus, adx: adxLine };
  let adxVal = dxValues.slice(0, period).reduce((s, d) => s + d.value, 0) / period;
  adxLine.push({ time: dxValues[period - 1].time, value: adxVal });

  for (let i = period; i < dxValues.length; i++) {
    adxVal = (adxVal * (period - 1) + dxValues[i].value) / period;
    adxLine.push({ time: dxValues[i].time, value: adxVal });
  }

  return { diPlus, diMinus, adx: adxLine };
}

/**
 * OBV — On-Balance Volume
 * OBV += Vol si C > PrevC, sinon -= Vol (inchangé si égal)
 */
export function calculateOBV(
  data: { time: string; close: number; volume: number }[]
): IndicatorData[] {
  const result: IndicatorData[] = [];
  if (data.length === 0) return result;

  let obv = 0;
  result.push({ time: data[0].time, value: obv });

  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close)      obv += data[i].volume;
    else if (data[i].close < data[i - 1].close) obv -= data[i].volume;
    result.push({ time: data[i].time, value: obv });
  }
  return result;
}

/**
 * VWAP — Volume Weighted Average Price (cumulatif)
 * VWAP = Σ(TP × Vol) / ΣVol depuis le début du jeu de données
 */
export function calculateVWAP(
  data: { time: string; high: number; low: number; close: number; volume: number }[]
): IndicatorData[] {
  const result: IndicatorData[] = [];
  let cumTPV = 0;
  let cumVol = 0;

  for (const d of data) {
    const tp = (d.high + d.low + d.close) / 3;
    cumTPV += tp * d.volume;
    cumVol += d.volume;
    result.push({ time: d.time, value: cumVol === 0 ? tp : cumTPV / cumVol });
  }
  return result;
}

/**
 * Ichimoku Kinko Hyo
 * Tenkan-sen  : (highest_high + lowest_low) / 2 sur 9 périodes
 * Kijun-sen   : (highest_high + lowest_low) / 2 sur 26 périodes
 * Senkou A    : (Tenkan + Kijun) / 2, décalé +26 barres en avant
 * Senkou B    : (H+L)/2 sur 52 périodes, décalé +26 barres en avant
 * Chikou      : clôture actuelle décalée -26 barres en arrière
 */
export function calculateIchimoku(
  data: { time: string; high: number; low: number; close: number }[]
): {
  tenkan: IndicatorData[];
  kijun: IndicatorData[];
  spanA: IndicatorData[];
  spanB: IndicatorData[];
  chikou: IndicatorData[];
} {
  const tenkan: IndicatorData[] = [];
  const kijun:  IndicatorData[] = [];
  const spanA:  IndicatorData[] = [];
  const spanB:  IndicatorData[] = [];
  const chikou: IndicatorData[] = [];

  const mid = (period: number, idx: number) => {
    const slice = data.slice(idx - period + 1, idx + 1);
    return (Math.max(...slice.map(d => d.high)) + Math.min(...slice.map(d => d.low))) / 2;
  };

  for (let i = 0; i < data.length; i++) {
    if (i >= 8)  tenkan.push({ time: data[i].time, value: mid(9,  i) });
    if (i >= 25) kijun.push({  time: data[i].time, value: mid(26, i) });

    // Chikou : close[i] tracé 26 barres en arrière
    if (i >= 26) chikou.push({ time: data[i - 26].time, value: data[i].close });

    // Spans décalés +26 barres en avant (si la date existe dans le dataset)
    if (i >= 25 && i + 26 < data.length) {
      const futureTime = data[i + 26].time;
      const t = mid(9, i);  // Tenkan à i
      const k = mid(26, i); // Kijun à i
      spanA.push({ time: futureTime, value: (t + k) / 2 });
    }
    if (i >= 51 && i + 26 < data.length) {
      spanB.push({ time: data[i + 26].time, value: mid(52, i) });
    }
  }

  return { tenkan, kijun, spanA, spanB, chikou };
}

/**
 * Pivot Points (Classic)
 * P = (H + L + C) / 3 de la barre précédente
 * R1 = 2P - L,  S1 = 2P - H
 * R2 = P + (H - L),  S2 = P - (H - L)
 */
export function calculatePivotPoints(
  data: { time: string; high: number; low: number; close: number }[]
): {
  p:  IndicatorData[];
  r1: IndicatorData[];
  r2: IndicatorData[];
  s1: IndicatorData[];
  s2: IndicatorData[];
} {
  const p:  IndicatorData[] = [];
  const r1: IndicatorData[] = [];
  const r2: IndicatorData[] = [];
  const s1: IndicatorData[] = [];
  const s2: IndicatorData[] = [];

  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const pivot = (prev.high + prev.low + prev.close) / 3;
    const range = prev.high - prev.low;
    p.push({  time: data[i].time, value: pivot });
    r1.push({ time: data[i].time, value: 2 * pivot - prev.low });
    r2.push({ time: data[i].time, value: pivot + range });
    s1.push({ time: data[i].time, value: 2 * pivot - prev.high });
    s2.push({ time: data[i].time, value: pivot - range });
  }
  return { p, r1, r2, s1, s2 };
}
