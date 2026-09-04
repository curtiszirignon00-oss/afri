import React, { useState, useMemo } from 'react';
import { AlertTriangle, TrendingUp, MessageCircle, Sparkles } from 'lucide-react';
import { StockAnalystChat } from './StockAnalystChat';
import type { Stock } from '../../types';
import {
  calculateSignalScore,
  computeBBPosition,
  computeMADeviation,
  ANALYSIS_MODE_LABELS,
  ANALYSIS_MODE_DESCRIPTIONS,
  MODE_WEIGHTS,
  type AnalysisMode,
  type SignalScoreResult,
  type TechnicalScoreInput,
  type FundamentalScoreInput,
  type GrowthScoreInput,
} from '../../utils/signalScore';
import {
  calculateRSI,
  calculateMACD,
  calculateSMA,
  calculateBollingerBands,
} from '../../utils/indicators';
import type { OHLCVData } from '../../types/chart.types';
import type { StockFundamental, AnnualFinancial } from '../../services/stockApi';

// ── Props ─────────────────────────────────────────────────────────────────────

interface StockAnalysisProps {
  data?: OHLCVData[];
  fundamentals?: StockFundamental | null;
  annualFinancials?: AnnualFinancial[];
  stock?: Stock | null;
}

// ── Score circle SVG ──────────────────────────────────────────────────────────

function ScoreCircle({ score, color }: { score: number; color: string }) {
  const R = 38, SW = 7;
  const circ = 2 * Math.PI * R;
  const filled = circ * (score / 100);
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={R} fill="none" stroke="#E5E7EB" strokeWidth={SW} />
      <circle
        cx="50" cy="50" r={R} fill="none"
        stroke={color} strokeWidth={SW}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="50" y="46" textAnchor="middle" fontSize="22" fontWeight="700" fill="#111827">{score}</text>
      <text x="50" y="60" textAnchor="middle" fontSize="10" fill="#9CA3AF">/100</text>
    </svg>
  );
}

// ── Pillar badge ──────────────────────────────────────────────────────────────

function PillarBadge({ label, pct }: { label: string; pct: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-ink-50 text-brand-navy">
      {label} <span className="opacity-70">{Math.round(pct * 100)}%</span>
    </span>
  );
}

// ── Indicator row with mini progress bar ──────────────────────────────────────

function IndicatorRow({ name, rawValue, normalizedScore }: { name: string; rawValue: string; normalizedScore: number }) {
  // Une seule teinte : la valeur chiffree suffit a dire si l'indicateur est bon.
  const color = '#12395E';
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-gray-200/70 last:border-0">
      <span className="text-[12px] text-gray-600 flex-1 min-w-0 truncate">{name}</span>
      <div className="w-20 h-1.5 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${normalizedScore}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-mono font-semibold w-12 text-right flex-shrink-0 text-gray-900">{rawValue}</span>
    </div>
  );
}

// ── Sub-score bar (composite section) ────────────────────────────────────────

function SubScoreBar({ label, score, color, maxWidth = '100%' }: { label: string; score: number | null; color: string; maxWidth?: string }) {
  return (
    <div className="flex items-center gap-3 mb-2.5">
      <span className="text-[12px] text-gray-400 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: score != null ? `${score}%` : '0%', background: color, maxWidth }}
        />
      </div>
      <span className="text-[12px] font-mono font-semibold w-8 text-right flex-shrink-0"
        style={{ color: score != null ? color : '#D1D5DB' }}>
        {score ?? '—'}
      </span>
    </div>
  );
}

// ── Zone chip ─────────────────────────────────────────────────────────────────

const ZONE_CONFIG = [
  { range: '0–25',   label: 'Vente Forte' },
  { range: '26–40',  label: 'Vente' },
  { range: '41–59',  label: 'Neutre' },
  { range: '60–74',  label: 'Achat' },
  { range: '75–100', label: 'Achat Fort' },
] as const;

// ── Build score context string for SIMBA ──────────────────────────────────────

function buildScoreContext(
  result: SignalScoreResult,
  mode: AnalysisMode,
  tech: TechnicalScoreInput,
  fund: FundamentalScoreInput,
  growth: GrowthScoreInput,
): string {
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const w = result.weights;

  const techLines = [
    tech.rsi != null              ? `  · RSI(14): ${tech.rsi.toFixed(1)}` : null,
    tech.macdHistogram != null    ? `  · MACD Histogramme: ${tech.macdHistogram > 0 ? '+' : ''}${tech.macdHistogram.toFixed(3)}` : null,
    tech.priceVsMA20Pct != null   ? `  · Prix vs MA20: ${tech.priceVsMA20Pct > 0 ? '+' : ''}${tech.priceVsMA20Pct.toFixed(1)}%` : null,
    tech.priceVsMA50Pct != null   ? `  · Prix vs MA50: ${tech.priceVsMA50Pct > 0 ? '+' : ''}${tech.priceVsMA50Pct.toFixed(1)}%` : null,
    tech.bbPosition != null       ? `  · Position Bandes Bollinger: ${tech.bbPosition.toFixed(0)}%` : null,
    tech.volumeRatio != null      ? `  · Volume relatif vs moy20: ${tech.volumeRatio}%` : null,
  ].filter(Boolean).join('\n');

  const fundLines = [
    fund.peRatio != null       ? `  · PER: ${fund.peRatio.toFixed(2)}` : null,
    fund.pbRatio != null       ? `  · PBR: ${fund.pbRatio.toFixed(2)}` : null,
    fund.roe != null           ? `  · ROE: ${fund.roe.toFixed(1)}%` : null,
    fund.profitMargin != null  ? `  · Marge nette: ${fund.profitMargin.toFixed(1)}%` : null,
    fund.dividendYield != null ? `  · Rendement dividende: ${fund.dividendYield.toFixed(2)}%` : null,
    fund.debtToEquity != null  ? `  · Dette/Fonds propres: ${fund.debtToEquity.toFixed(2)}` : null,
  ].filter(Boolean).join('\n');

  const growthLines = [
    growth.revenueGrowthPct != null   ? `  · Croissance CA: ${growth.revenueGrowthPct > 0 ? '+' : ''}${growth.revenueGrowthPct.toFixed(1)}%` : null,
    growth.netIncomeGrowthPct != null ? `  · Croissance RN: ${growth.netIncomeGrowthPct > 0 ? '+' : ''}${growth.netIncomeGrowthPct.toFixed(1)}%` : null,
    growth.epsHistory != null         ? `  · Tendance BPA: ${growth.epsHistory.filter(Boolean).join(' → ')} FCFA` : null,
  ].filter(Boolean).join('\n');

  return `=== SCORE DE CONFIANCE HYBRIDE AFRIBOURSE ===
Mode d'analyse : ${ANALYSIS_MODE_LABELS[mode]} (Technique ${pct(w.technical)} | Fondamental ${pct(w.fundamental)} | Croissance ${pct(w.growth)})
Score global : ${result.score}/100 — Zone : ${result.zone}
Signal : ${result.phrase}
Fiabilité du signal : ${Math.round(result.reliability.coefficient * 100)}%${result.reliability.warningMessage ? ` ⚠️ ${result.reliability.warningMessage}` : ''}${result.divergenceWarning ? `\nDivergence détectée : ${result.divergenceWarning}` : ''}

Pilier Technique (score: ${result.subScores.technical ?? '—'}/100)
${techLines || '  · Données insuffisantes'}

Pilier Fondamental (score: ${result.subScores.fundamental ?? '—'}/100)
${fundLines || '  · Données insuffisantes'}

Pilier Croissance (score: ${result.subScores.growth ?? '—'}/100)
${growthLines || '  · Données insuffisantes'}
==============================================`;
}

// ── Main component ────────────────────────────────────────────────────────────

const MODES: AnalysisMode[] = ['balanced', 'trader', 'investor', 'dividend'];

const StockAnalysis: React.FC<StockAnalysisProps> = ({ data, fundamentals, annualFinancials, stock }) => {
  const [showChat, setShowChat] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState<string | undefined>();
  const [mode, setMode] = useState<AnalysisMode>('balanced');

  // ── Build technical input from OHLCV data ──────────────────────────────────
  const technicalInput = useMemo<TechnicalScoreInput>(() => {
    if (!data || data.length < 30) return {};
    const closes = data.map(d => ({ time: d.time, close: d.close }));
    const last = data[data.length - 1];

    const rsiArr = calculateRSI(closes, 14);
    const rsi = rsiArr.length > 0 ? rsiArr[rsiArr.length - 1].value : null;

    const macdData = calculateMACD(closes);
    const macdHistogram = macdData.histogram.length > 0
      ? (macdData.histogram[macdData.histogram.length - 1]?.value ?? null)
      : null;

    const bb = calculateBollingerBands(closes);
    let bbPosition: number | null = null;
    if (bb.upper.length > 0) {
      const upper = bb.upper[bb.upper.length - 1].value;
      const lower = bb.lower[bb.lower.length - 1].value;
      bbPosition = computeBBPosition(last.close, upper, lower);
    }

    const ma20Arr = calculateSMA(closes, 20);
    const priceVsMA20Pct = ma20Arr.length > 0
      ? computeMADeviation(last.close, ma20Arr[ma20Arr.length - 1].value) : null;

    const ma50Arr = calculateSMA(closes, 50);
    const priceVsMA50Pct = ma50Arr.length > 0
      ? computeMADeviation(last.close, ma50Arr[ma50Arr.length - 1].value) : null;

    let volumeRatio: number | null = null;
    const vols = data.map(d => d.volume ?? 0).filter(v => v > 0);
    if (vols.length >= 21 && last.volume > 0) {
      const avg20 = vols.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
      volumeRatio = avg20 > 0 ? Math.round((last.volume / avg20) * 100) : null;
    }

    return { rsi, macdHistogram, bbPosition, priceVsMA20Pct, priceVsMA50Pct, volumeRatio };
  }, [data]);

  // ── Build fundamental input ────────────────────────────────────────────────
  const fundamentalInput = useMemo<FundamentalScoreInput>(() => ({
    peRatio:       fundamentals?.pe_ratio        ?? null,
    pbRatio:       fundamentals?.pb_ratio        ?? null,
    roe:           fundamentals?.roe             ?? null,
    profitMargin:  fundamentals?.profit_margin   ?? null,
    dividendYield: fundamentals?.dividend_yield  ?? null,
    debtToEquity:  fundamentals?.debt_to_equity  ?? null,
  }), [fundamentals]);

  // ── Build growth input ─────────────────────────────────────────────────────
  const growthInput = useMemo<GrowthScoreInput>(() => {
    if (!annualFinancials || annualFinancials.length === 0) return {};
    const sorted = [...annualFinancials].sort((a, b) => b.year - a.year);
    const latest = sorted[0];
    const epsHist = sorted.slice(0, 3).reverse().map(f => f.eps ?? null);
    return {
      revenueGrowthPct:   latest.revenue_growth    ?? null,
      netIncomeGrowthPct: latest.net_income_growth ?? null,
      epsHistory: epsHist.length >= 2 ? epsHist : null,
    };
  }, [annualFinancials]);

  // ── Compute score ──────────────────────────────────────────────────────────
  const result: SignalScoreResult | null = useMemo(
    () => calculateSignalScore(technicalInput, fundamentalInput, growthInput, mode),
    [technicalInput, fundamentalInput, growthInput, mode]
  );

  const hasData = !!(data && data.length >= 30);
  const weights = MODE_WEIGHTS[mode];

  const techRows    = result?.indicators.filter(i => i.pillar === 'technical')   ?? [];
  const fundRows    = result?.indicators.filter(i => i.pillar === 'fundamental') ?? [];
  const growthRows  = result?.indicators.filter(i => i.pillar === 'growth')      ?? [];
  const fiabPct     = result ? Math.round(result.reliability.coefficient * 100) : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-brand-navy" />
            Score de confiance hybride
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Technique · Fondamental · Croissance</p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="bg-gray-50 rounded-xl p-1.5 flex gap-1">
        {MODES.map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
              mode === m
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {ANALYSIS_MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Mode description */}
      <p className="text-[12px] text-gray-500 bg-ink-50 border border-ink-100 rounded-lg px-3 py-2">
        {ANALYSIS_MODE_DESCRIPTIONS[mode]}
      </p>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5">

          {/* Pillar weight badges row */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <PillarBadge label="Technique"    pct={weights.technical} />
            <PillarBadge label="Fondamental"  pct={weights.fundamental} />
            <PillarBadge label="Croissance"   pct={weights.growth} />
          </div>

          {/* 2-col indicator grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">

            {/* Left: Technique */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5" /> Pilier Technique
                </span>
                <span className="text-[11px] font-mono font-bold text-brand-navy">
                  {result?.subScores.technical ?? '—'}/100
                </span>
              </div>
              {hasData && techRows.length > 0
                ? techRows.map(r => <IndicatorRow key={r.name} {...r} />)
                : ['RSI (14)', 'MACD Histogramme', 'Prix vs MA20', 'Prix vs MA50', 'BB Position', 'Volume relatif'].map(n => (
                    <div key={n} className="flex items-center gap-2 py-1.5 border-b border-gray-200/70 last:border-0">
                      <span className="text-[12px] text-gray-400 flex-1">{n}</span>
                      <div className="w-20 h-1.5 rounded-full bg-gray-200" />
                      <span className="text-[11px] font-mono text-gray-300 w-12 text-right">—</span>
                    </div>
                  ))
              }
            </div>

            {/* Right: Fondamental + Croissance */}
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
 Pilier Fondamental
                  </span>
                  <span className="text-[11px] font-mono font-bold text-brand-navy">
                    {result?.subScores.fundamental ?? '—'}/100
                  </span>
                </div>
                {fundRows.length > 0
                  ? fundRows.map(r => <IndicatorRow key={r.name} {...r} />)
                  : ['PER', 'ROE', 'Marge nette', 'Div. Yield', 'PBR', 'Dette/FP'].map(n => (
                      <div key={n} className="flex items-center gap-2 py-1.5 border-b border-gray-200/70 last:border-0">
                        <span className="text-[12px] text-gray-400 flex-1">{n}</span>
                        <div className="w-20 h-1.5 rounded-full bg-gray-200" />
                        <span className="text-[11px] font-mono text-gray-300 w-12 text-right">—</span>
                      </div>
                    ))
                }
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
 Pilier Croissance
                  </span>
                  <span className="text-[11px] font-mono font-bold text-brand-navy">
                    {result?.subScores.growth ?? '—'}/100
                  </span>
                </div>
                {growthRows.length > 0
                  ? growthRows.map(r => <IndicatorRow key={r.name} {...r} />)
                  : ['Croissance CA', 'Croissance RN', 'Tendance EPS'].map(n => (
                      <div key={n} className="flex items-center gap-2 py-1.5 border-b border-gray-200/70 last:border-0">
                        <span className="text-[12px] text-gray-400 flex-1">{n}</span>
                        <div className="w-20 h-1.5 rounded-full bg-gray-200" />
                        <span className="text-[11px] font-mono text-gray-300 w-12 text-right">—</span>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>

          {/* Score composite display */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-5">
              {/* Circle */}
              <div className="flex-shrink-0">
                <ScoreCircle score={result?.score ?? 0} color="#12395E" />
              </div>

              {/* Pillar bars */}
              <div className="flex-1 min-w-0">
                <SubScoreBar label="Technique"   score={result?.subScores.technical}   color="#12395E" />
                <SubScoreBar label="Fondamental" score={result?.subScores.fundamental} color="#12395E" />
                <SubScoreBar label="Croissance"  score={result?.subScores.growth}      color="#12395E" />
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                  <span className="text-[12px] text-gray-500 w-28 flex-shrink-0">Fiabilité</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500 bg-gray-400"
                      style={{ width: `${fiabPct}%` }} />
                  </div>
                  <span className="text-[12px] font-mono text-gray-400 w-8 text-right">{fiabPct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interpretation box */}
          {result && (
            <div className="mt-4 rounded-xl px-4 py-3 bg-ink-50">
              <p className="text-[13px] leading-relaxed text-gray-900">
                <strong>Score {result.score}/100 — {result.zone}.</strong>{' '}
                <span className="text-gray-600">
                  {ANALYSIS_MODE_DESCRIPTIONS[mode].split('—')[0].trim()}
                </span>
              </p>
              <p className="text-[12px] text-gray-500 mt-1">{result.phrase}</p>
            </div>
          )}

          {/* Divergence warning */}
          {result?.divergenceWarning && (
            <div className="mt-3 flex items-start gap-2 bg-brand-orange/10 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} className="text-brand-orange flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-brand-orange-dark">{result.divergenceWarning}</p>
            </div>
          )}
        </div>
      </div>

      {/* Zones d'interprétation */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Zones d'interprétation</p>
        <div className="flex gap-1.5 flex-wrap">
          {ZONE_CONFIG.map(z => {
            const active = result && (
              (z.label === 'Vente Forte' && result.score <= 25) ||
              (z.label === 'Vente'       && result.score > 25 && result.score <= 40) ||
              (z.label === 'Neutre'      && result.score > 40 && result.score <= 59) ||
              (z.label === 'Achat'       && result.score > 59 && result.score <= 74) ||
              (z.label === 'Achat Fort'  && result.score > 74)
            );
            return (
              <div key={z.label}
                className={`flex-1 min-w-[60px] rounded-lg px-2 py-2 text-center transition-colors ${
                  active ? 'bg-brand-navy text-white' : 'bg-gray-50 text-gray-500'
                }`}>
                <p className="text-[11px] font-semibold">{z.range}</p>
                <p className="text-[10px] mt-0.5">{z.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SIMBA — Poser une question */}
      {stock && (
        <div className="bg-ink-50 border border-ink-100 rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-brand-navy" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Poser une question à SIMBA</p>
                <p className="text-[11px] text-gray-500">Notre analyste IA connaît ce score et les données de {stock.company_name}</p>
              </div>
            </div>
          </div>

          {/* Suggestion chips — accessibles à tous */}
          {!showChat && (
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[
                  result ? `Que signifie ce score de ${result.score}/100 pour ${stock.symbol} ?` : 'Explique-moi le score de confiance',
                  'Ce titre est-il bien valorisé en ce moment ?',
                  'Quels risques surveiller sur cette action ?',
                  result?.divergenceWarning ? 'Comment interpréter cette divergence technique/fondamental ?' : 'Comparer avec le secteur BRVM',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => { setInitialQuestion(q); setShowChat(true); }}
                    className="text-[11px] px-2.5 py-1 bg-white border border-ink-200 text-brand-navy-hover rounded-full hover:bg-ink-50 hover:border-ink-300 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setInitialQuestion(undefined); setShowChat(true); }}
                className="w-full flex items-center justify-center gap-2 py-2 bg-brand-navy hover:bg-brand-navy-hover text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <MessageCircle size={15} />
                Discuter avec SIMBA
              </button>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-brand-orange/10 rounded-lg p-3 text-brand-orange-dark text-xs flex gap-2">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <p>L'analyse technique est fournie à titre indicatif uniquement et ne doit pas constituer la seule base de vos décisions d'investissement.</p>
      </div>

      {/* SIMBA Chat modal */}
      {stock && (
        <StockAnalystChat
          stock={stock}
          isOpen={showChat}
          onClose={() => { setShowChat(false); setInitialQuestion(undefined); }}
          scoreContext={result ? buildScoreContext(result, mode, technicalInput, fundamentalInput, growthInput) : undefined}
          initialQuestion={initialQuestion}
        />
      )}

    </div>
  );
};

export default StockAnalysis;
