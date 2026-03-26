/**
 * AfriBourse — Signal Score Engine v2
 * Score de confiance composite hybride (0–100) :
 *   • Pilier Technique   : RSI, MACD, Bollinger, MA, Volume
 *   • Pilier Fondamental : PER, PBR, ROE, Marge nette, Dividende, D/E
 *   • Pilier Croissance  : Croissance CA, RN, Tendance EPS 3 ans
 */

// ── Types – Inputs ────────────────────────────────────────────────────────────

export interface TechnicalScoreInput {
  rsi?: number | null;
  macdHistogram?: number | null;
  /** (close - bbLower) / (bbUpper - bbLower) * 100  →  [0–100] */
  bbPosition?: number | null;
  /** (close - ma20) / ma20 * 100 */
  priceVsMA20Pct?: number | null;
  /** (close - ma50) / ma50 * 100 */
  priceVsMA50Pct?: number | null;
  /** volume_j / avg_volume_20j * 100  (ex: 150 = +50% vs moyenne) */
  volumeRatio?: number | null;
}

export interface FundamentalScoreInput {
  peRatio?: number | null;
  pbRatio?: number | null;
  roe?: number | null;
  profitMargin?: number | null;
  dividendYield?: number | null;
  debtToEquity?: number | null;
}

export interface GrowthScoreInput {
  revenueGrowthPct?: number | null;
  netIncomeGrowthPct?: number | null;
  /** [eps_year-2, eps_year-1, eps_year] – valeurs null tolérées */
  epsHistory?: (number | null)[] | null;
}

// ── Types – Outputs ───────────────────────────────────────────────────────────

export type SignalZone =
  | 'Vente Forte'
  | 'Signal Vente'
  | 'Neutre'
  | 'Signal Achat'
  | 'Achat Fort';

export type AnalysisMode = 'balanced' | 'trader' | 'investor' | 'dividend';

export interface SubScores {
  technical:   number | null;
  fundamental: number | null;
  growth:      number | null;
}

export interface ScoreReliability {
  coefficient: number;
  activeTechnicalIndicators: number;
  availableFundamentalMetrics: number;
  lowVolume: boolean;
  warningMessage: string | null;
}

export interface IndicatorRow {
  name: string;
  rawValue: string;
  normalizedScore: number;
  pillar: 'technical' | 'fundamental' | 'growth';
}

export interface SignalScoreResult {
  score: number;
  zone: SignalZone;
  phrase: string;
  subScores: SubScores;
  weights: { technical: number; fundamental: number; growth: number };
  reliability: ScoreReliability;
  mode: AnalysisMode;
  divergenceWarning: string | null;
  indicators: IndicatorRow[];
}

// ── Pondérations par mode ─────────────────────────────────────────────────────

export const MODE_WEIGHTS: Record<AnalysisMode, { technical: number; fundamental: number; growth: number }> = {
  balanced: { technical: 0.50, fundamental: 0.35, growth: 0.15 },
  trader:   { technical: 0.80, fundamental: 0.10, growth: 0.10 },
  investor: { technical: 0.20, fundamental: 0.50, growth: 0.30 },
  dividend: { technical: 0.20, fundamental: 0.60, growth: 0.20 },
};

export const ANALYSIS_MODE_LABELS: Record<AnalysisMode, string> = {
  balanced: 'Équilibré',
  trader:   'Trader court terme',
  investor: 'Investisseur long terme',
  dividend: 'Revenus & Dividendes',
};

export const ANALYSIS_MODE_DESCRIPTIONS: Record<AnalysisMode, string> = {
  balanced: 'Pondération équilibrée — idéal pour la majorité des cas. Combine les signaux court et long terme.',
  trader:   'Priorité aux signaux techniques immédiats. Les fondamentaux ne comptent que pour 20%. Adapté au swing trading.',
  investor: "Priorité aux données fondamentales et à la croissance. Le signal technique sert de timing d'entrée uniquement.",
  dividend: 'Focus sur la valeur : PER faible, rendement élevé, marge stable. Pour les titres de rendement type Sonatel, ECOBANK.',
};

// ── Normalisation – Technique ─────────────────────────────────────────────────

function normalizeRSI(v: number): number {
  if (v <= 20) return 8;  if (v <= 25) return 15; if (v <= 30) return 22;
  if (v <= 35) return 30; if (v <= 40) return 38; if (v <= 45) return 44;
  if (v <= 55) return 50; if (v <= 60) return 58; if (v <= 65) return 65;
  if (v <= 70) return 73; if (v <= 75) return 80; if (v <= 80) return 85;
  return 90;
}

function normalizeMACD(h: number): number {
  if (h > 80)  return 90; if (h > 50)  return 82; if (h > 25) return 74;
  if (h > 10)  return 65; if (h > 2)   return 57; if (h >= 0) return 52;
  if (h > -2)  return 47; if (h > -10) return 42; if (h > -25) return 34;
  if (h > -50) return 24; if (h > -80) return 16;
  return 8;
}

function normalizeBBPosition(p: number): number {
  if (p <= 3)  return 80; if (p <= 10) return 73; if (p <= 20) return 65;
  if (p <= 35) return 57; if (p <= 50) return 50; if (p <= 65) return 44;
  if (p <= 80) return 37; if (p <= 90) return 30; if (p <= 97) return 22;
  return 15;
}

function normalizeMADev(pct: number): number {
  if (pct >= 10) return 90; if (pct >= 7)  return 83; if (pct >= 5) return 76;
  if (pct >= 3)  return 68; if (pct >= 1)  return 60; if (pct >= 0) return 53;
  if (pct >= -1) return 47; if (pct >= -3) return 40; if (pct >= -5) return 32;
  if (pct >= -7) return 24; if (pct >= -10) return 17;
  return 8;
}

function normalizeVolume(r: number): number {
  if (r >= 250) return 82; if (r >= 200) return 76; if (r >= 150) return 68;
  if (r >= 120) return 61; if (r >= 100) return 55; if (r >= 80)  return 49;
  if (r >= 60)  return 43; if (r >= 40)  return 36; if (r >= 20)  return 28;
  return 20;
}

// ── Normalisation – Fondamental (calibré BRVM/UEMOA) ─────────────────────────

function normalizePER(v: number): number {
  if (v <= 0 || v > 80) return 12;
  if (v <= 5)  return 88; if (v <= 8)  return 82; if (v <= 12) return 74;
  if (v <= 15) return 66; if (v <= 20) return 57; if (v <= 25) return 47;
  if (v <= 30) return 38; if (v <= 40) return 28; if (v <= 60) return 18;
  return 12;
}

function normalizePBR(v: number): number {
  if (v <= 0) return 15;
  if (v <= 0.5) return 90; if (v <= 0.8) return 82; if (v <= 1.0) return 75;
  if (v <= 1.5) return 65; if (v <= 2.0) return 54; if (v <= 2.5) return 44;
  if (v <= 3.0) return 35; if (v <= 4.0) return 25;
  return 15;
}

function normalizeROE(v: number): number {
  if (v <= 0)  return 10; if (v <= 4)  return 22; if (v <= 8)  return 35;
  if (v <= 12) return 50; if (v <= 16) return 63; if (v <= 20) return 74;
  if (v <= 25) return 83; if (v <= 30) return 88;
  return 92;
}

function normalizeMargin(v: number): number {
  if (v <= 0)  return 8;  if (v <= 2)  return 20; if (v <= 5)  return 35;
  if (v <= 8)  return 48; if (v <= 12) return 60; if (v <= 15) return 70;
  if (v <= 20) return 78; if (v <= 25) return 84;
  return 90;
}

function normalizeDivYield(v: number): number {
  if (v <= 0) return 28; if (v <= 1)  return 38; if (v <= 2) return 48;
  if (v <= 3) return 56; if (v <= 4)  return 63; if (v <= 5) return 70;
  if (v <= 6) return 77; if (v <= 8)  return 83; if (v <= 10) return 88;
  return 90;
}

function normalizeDebt(v: number): number {
  if (v < 0)    return 5;
  if (v <= 0.2) return 90; if (v <= 0.5) return 80; if (v <= 0.8) return 70;
  if (v <= 1.0) return 60; if (v <= 1.5) return 50; if (v <= 2.0) return 40;
  if (v <= 3.0) return 28; if (v <= 5.0) return 16;
  return 8;
}

// ── Normalisation – Croissance ────────────────────────────────────────────────

function normalizeRevenueGrowth(v: number): number {
  if (v >= 30)  return 92; if (v >= 20) return 84; if (v >= 12) return 76;
  if (v >= 8)   return 67; if (v >= 4)  return 57; if (v >= 0)  return 50;
  if (v >= -5)  return 40; if (v >= -10) return 30; if (v >= -20) return 20;
  return 8;
}

function normalizeNIGrowth(v: number): number {
  if (v >= 50)  return 92; if (v >= 30) return 85; if (v >= 20) return 78;
  if (v >= 10)  return 68; if (v >= 5)  return 58; if (v >= 0)  return 50;
  if (v >= -10) return 38; if (v >= -25) return 25; if (v >= -50) return 15;
  return 5;
}

function normalizeEPSTrend(hist: (number | null)[]): number {
  const pts: { x: number; y: number }[] = [];
  hist.forEach((v, i) => { if (v != null && !isNaN(v)) pts.push({ x: i, y: v }); });
  if (pts.length < 2) return 50;
  const n = pts.length;
  const sx = pts.reduce((s, p) => s + p.x, 0);
  const sy = pts.reduce((s, p) => s + p.y, 0);
  const sxy = pts.reduce((s, p) => s + p.x * p.y, 0);
  const sx2 = pts.reduce((s, p) => s + p.x * p.x, 0);
  const den = n * sx2 - sx * sx;
  if (den === 0) return 50;
  const slope = (n * sxy - sx * sy) / den;
  const avg = sy / n;
  if (avg === 0) return 50;
  const rel = (slope / Math.abs(avg)) * 100;
  if (rel >= 20) return 92; if (rel >= 12) return 84; if (rel >= 7)  return 76;
  if (rel >= 3)  return 65; if (rel >= 0)  return 54; if (rel >= -3) return 45;
  if (rel >= -7) return 36; if (rel >= -12) return 26; if (rel >= -20) return 16;
  return 8;
}

// ── Sous-scores par pilier ────────────────────────────────────────────────────

type WS = { score: number; weight: number; name: string; rawValue: string };

function techScore(inp: TechnicalScoreInput): { score: number | null; count: number; rows: WS[] } {
  const rows: WS[] = [];
  const W = { rsi: 0.25, macd: 0.20, ma20: 0.20, ma50: 0.15, bb: 0.10, vol: 0.10 };

  if (inp.rsi != null)
    rows.push({ score: normalizeRSI(inp.rsi), weight: W.rsi, name: 'RSI (14)', rawValue: inp.rsi.toFixed(1) });
  if (inp.macdHistogram != null)
    rows.push({ score: normalizeMACD(inp.macdHistogram), weight: W.macd, name: 'MACD Histogramme', rawValue: `${inp.macdHistogram >= 0 ? '+' : ''}${inp.macdHistogram.toFixed(0)}` });
  if (inp.priceVsMA20Pct != null)
    rows.push({ score: normalizeMADev(inp.priceVsMA20Pct), weight: W.ma20, name: 'Prix vs MA20', rawValue: `${inp.priceVsMA20Pct >= 0 ? '+' : ''}${inp.priceVsMA20Pct.toFixed(1)}%` });
  if (inp.priceVsMA50Pct != null)
    rows.push({ score: normalizeMADev(inp.priceVsMA50Pct), weight: W.ma50, name: 'Prix vs MA50', rawValue: `${inp.priceVsMA50Pct >= 0 ? '+' : ''}${inp.priceVsMA50Pct.toFixed(1)}%` });
  if (inp.bbPosition != null)
    rows.push({ score: normalizeBBPosition(inp.bbPosition), weight: W.bb, name: 'BB Position', rawValue: `${inp.bbPosition.toFixed(0)}%` });
  if (inp.volumeRatio != null)
    rows.push({ score: normalizeVolume(inp.volumeRatio), weight: W.vol, name: 'Volume relatif', rawValue: `${inp.volumeRatio.toFixed(0)}%` });

  if (rows.length === 0) return { score: null, count: 0, rows: [] };
  const tw = rows.reduce((s, r) => s + r.weight, 0);
  const sc = rows.reduce((s, r) => s + (r.score * r.weight) / tw, 0);
  return { score: Math.round(sc), count: rows.length, rows };
}

function fundScore(inp: FundamentalScoreInput): { score: number | null; count: number; rows: WS[] } {
  const rows: WS[] = [];
  const W = { pe: 0.28, roe: 0.22, margin: 0.20, div: 0.15, pb: 0.10, dte: 0.05 };

  if (inp.peRatio != null)
    rows.push({ score: normalizePER(inp.peRatio), weight: W.pe, name: 'PER', rawValue: `${inp.peRatio.toFixed(1)}x` });
  if (inp.roe != null)
    rows.push({ score: normalizeROE(inp.roe), weight: W.roe, name: 'ROE', rawValue: `${inp.roe.toFixed(1)}%` });
  if (inp.profitMargin != null)
    rows.push({ score: normalizeMargin(inp.profitMargin), weight: W.margin, name: 'Marge nette', rawValue: `${inp.profitMargin.toFixed(1)}%` });
  if (inp.dividendYield != null)
    rows.push({ score: normalizeDivYield(inp.dividendYield), weight: W.div, name: 'Div. Yield', rawValue: `${inp.dividendYield.toFixed(1)}%` });
  if (inp.pbRatio != null)
    rows.push({ score: normalizePBR(inp.pbRatio), weight: W.pb, name: 'PBR', rawValue: `${inp.pbRatio.toFixed(2)}x` });
  if (inp.debtToEquity != null)
    rows.push({ score: normalizeDebt(inp.debtToEquity), weight: W.dte, name: 'Dette/FP', rawValue: `${inp.debtToEquity.toFixed(2)}x` });

  if (rows.length === 0) return { score: null, count: 0, rows: [] };
  const tw = rows.reduce((s, r) => s + r.weight, 0);
  const sc = rows.reduce((s, r) => s + (r.score * r.weight) / tw, 0);
  return { score: Math.round(sc), count: rows.length, rows };
}

function growthScore(inp: GrowthScoreInput): { score: number | null; count: number; rows: WS[] } {
  const rows: WS[] = [];
  const W = { rev: 0.35, ni: 0.40, eps: 0.25 };

  if (inp.revenueGrowthPct != null)
    rows.push({ score: normalizeRevenueGrowth(inp.revenueGrowthPct), weight: W.rev, name: 'Croissance CA', rawValue: `${inp.revenueGrowthPct >= 0 ? '+' : ''}${inp.revenueGrowthPct.toFixed(1)}%` });
  if (inp.netIncomeGrowthPct != null)
    rows.push({ score: normalizeNIGrowth(inp.netIncomeGrowthPct), weight: W.ni, name: 'Croissance RN', rawValue: `${inp.netIncomeGrowthPct >= 0 ? '+' : ''}${inp.netIncomeGrowthPct.toFixed(1)}%` });
  if (inp.epsHistory && inp.epsHistory.length >= 2) {
    const s = normalizeEPSTrend(inp.epsHistory);
    const slope = (() => {
      const pts = inp.epsHistory!.map((v, i) => ({ x: i, y: v })).filter(p => p.y != null) as { x: number; y: number }[];
      if (pts.length < 2) return 0;
      const n = pts.length, sx = pts.reduce((a, p) => a + p.x, 0), sy = pts.reduce((a, p) => a + p.y, 0);
      const sxy = pts.reduce((a, p) => a + p.x * p.y, 0), sx2 = pts.reduce((a, p) => a + p.x * p.x, 0);
      const d = n * sx2 - sx * sx;
      return d === 0 ? 0 : (n * sxy - sx * sy) / d;
    })();
    rows.push({ score: s, weight: W.eps, name: 'Tendance EPS', rawValue: slope > 1 ? '↑↑' : slope > 0 ? '↑' : slope < -1 ? '↓↓' : slope < 0 ? '↓' : '→' });
  }

  if (rows.length === 0) return { score: null, count: 0, rows: [] };
  const tw = rows.reduce((s, r) => s + r.weight, 0);
  const sc = rows.reduce((s, r) => s + (r.score * r.weight) / tw, 0);
  return { score: Math.round(sc), count: rows.length, rows };
}

// ── Fiabilité ─────────────────────────────────────────────────────────────────

function computeReliability(
  techCount: number, fundCount: number,
  volumeRatio: number | null | undefined,
  mode: AnalysisMode
): ScoreReliability {
  const w = MODE_WEIGHTS[mode];
  let coef = 1.0;
  const warns: string[] = [];

  if (techCount === 0 && w.technical > 0.3)  { coef *= 0.55; warns.push('Aucun indicateur technique'); }
  else if (techCount <= 2)                    { coef *= 0.78; if (w.technical > 0.3) warns.push(`${techCount} indicateur(s) technique(s) seulement`); }
  else if (techCount <= 4)                    { coef *= 0.90; }

  if (fundCount === 0 && w.fundamental > 0.3) { coef *= 0.60; warns.push('Aucune donnée fondamentale'); }
  else if (fundCount <= 2 && w.fundamental > 0.3) { coef *= 0.82; warns.push('Données fondamentales incomplètes'); }

  const lowVolume = volumeRatio != null && volumeRatio < 50;
  const veryLow   = volumeRatio != null && volumeRatio < 20;
  if (veryLow)       { coef *= 0.70; warns.push('Volume très faible — marché illiquide'); }
  else if (lowVolume){ coef *= 0.85; warns.push('Volume faible — signal moins fiable'); }

  coef = Math.max(0.40, Math.min(1.0, coef));
  return {
    coefficient: Math.round(coef * 100) / 100,
    activeTechnicalIndicators: techCount,
    availableFundamentalMetrics: fundCount,
    lowVolume,
    warningMessage: warns.length > 0 ? warns.join(' · ') : null,
  };
}

// ── Zones & interprétation ────────────────────────────────────────────────────

function getZone(score: number): SignalZone {
  if (score <= 25) return 'Vente Forte';
  if (score <= 40) return 'Signal Vente';
  if (score <= 59) return 'Neutre';
  if (score <= 74) return 'Signal Achat';
  return 'Achat Fort';
}

const ZONE_PHRASES: Record<SignalZone, string> = {
  'Vente Forte':  "Pression baissière forte — tous les piliers convergent vers une faiblesse. Éviter toute entrée en position.",
  'Signal Vente': "Plusieurs signaux indiquent une faiblesse probable. Prudence recommandée — surveiller une stabilisation avant d'agir.",
  'Neutre':       "Signaux mixtes ou équilibrés. Aucune direction claire — attendre une confirmation supplémentaire avant de décider.",
  'Signal Achat': "Tendance haussière probable — les piliers s'alignent positivement. Signal d'achat modéré confirmé.",
  'Achat Fort':   "Signal d'achat fort et convergent. Les piliers technique, fondamental et/ou croissance confirment le potentiel.",
};

function detectDivergence(techSc: number | null, fundSc: number | null): string | null {
  if (techSc == null || fundSc == null) return null;
  const diff = techSc - fundSc;
  if (Math.abs(diff) < 28) return null;
  if (diff > 0) return `⚠️ Divergence : signal technique positif (${techSc}/100) mais fondamentaux faibles (${fundSc}/100). Opportunité spéculative court terme uniquement.`;
  return `⚠️ Divergence : titre fondamentalement solide (${fundSc}/100) mais sous pression technique (${techSc}/100). Potentiel point d'entrée si la tendance technique se stabilise.`;
}

// ── Fonction principale ───────────────────────────────────────────────────────

export function calculateSignalScore(
  technical: TechnicalScoreInput = {},
  fundamental: FundamentalScoreInput = {},
  growth: GrowthScoreInput = {},
  mode: AnalysisMode = 'balanced'
): SignalScoreResult {
  const weights = MODE_WEIGHTS[mode];

  const tResult = techScore(technical);
  const fResult = fundScore(fundamental);
  const gResult = growthScore(growth);

  let raw = 0, used = 0;
  if (tResult.score != null) { raw += tResult.score * weights.technical;   used += weights.technical; }
  if (fResult.score != null) { raw += fResult.score * weights.fundamental; used += weights.fundamental; }
  if (gResult.score != null) { raw += gResult.score * weights.growth;      used += weights.growth; }

  if (used === 0) {
    return {
      score: 50, zone: 'Neutre',
      phrase: 'Données insuffisantes pour calculer un signal fiable.',
      subScores: { technical: null, fundamental: null, growth: null },
      weights, reliability: { coefficient: 0.40, activeTechnicalIndicators: 0, availableFundamentalMetrics: 0, lowVolume: false, warningMessage: 'Aucune donnée disponible' },
      mode, divergenceWarning: null, indicators: [],
    };
  }

  raw /= used;
  const reliability = computeReliability(tResult.count, fResult.count, technical.volumeRatio, mode);
  const adjusted = 50 + (raw - 50) * reliability.coefficient;
  const finalScore = Math.min(100, Math.max(0, Math.round(adjusted)));
  const zone = getZone(finalScore);

  let phrase = ZONE_PHRASES[zone];
  if (reliability.warningMessage) phrase += ` (Fiabilité réduite : ${reliability.warningMessage})`;

  const indicators: IndicatorRow[] = [
    ...tResult.rows.map(r => ({ name: r.name, rawValue: r.rawValue, normalizedScore: r.score, pillar: 'technical' as const })),
    ...fResult.rows.map(r => ({ name: r.name, rawValue: r.rawValue, normalizedScore: r.score, pillar: 'fundamental' as const })),
    ...gResult.rows.map(r => ({ name: r.name, rawValue: r.rawValue, normalizedScore: r.score, pillar: 'growth' as const })),
  ];

  return {
    score: finalScore,
    zone,
    phrase,
    subScores: { technical: tResult.score, fundamental: fResult.score, growth: gResult.score },
    weights,
    reliability,
    mode,
    divergenceWarning: detectDivergence(tResult.score, fResult.score),
    indicators,
  };
}

// ── Utilitaires ───────────────────────────────────────────────────────────────

export function getScoreHexColor(score: number): string {
  if (score <= 25) return '#dc2626';
  if (score <= 40) return '#f97316';
  if (score <= 59) return '#6b7280';
  if (score <= 74) return '#22c55e';
  return '#16a34a';
}

export function computeBBPosition(close: number, upper: number, lower: number): number | null {
  const bw = upper - lower;
  if (bw <= 0) return null;
  return Math.min(100, Math.max(0, Math.round(((close - lower) / bw) * 100)));
}

export function computeMADeviation(close: number, ma: number): number | null {
  if (ma <= 0) return null;
  return Math.round(((close - ma) / ma) * 1000) / 10;
}
