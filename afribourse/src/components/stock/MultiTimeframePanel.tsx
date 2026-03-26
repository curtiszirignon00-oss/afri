import { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { OHLCVData } from '../../types/chart.types';
import { applyResolution } from '../../utils/chartDataAdapter';
import type { CandleResolution } from '../../utils/chartDataAdapter';

// ── Configuration des timeframes ─────────────────────────────────────────────

interface TFConfig {
  id: string;
  label: string;
  fullLabel: string;
  resolution: CandleResolution;
  bars: number;
  window: string;
}

const TF_CONFIGS: TFConfig[] = [
  { id: 'daily',   label: '1J',  fullLabel: 'Court terme',  resolution: 'daily',   bars: 90,  window: '90 jours'  },
  { id: 'weekly',  label: '1S',  fullLabel: 'Moyen terme',  resolution: 'weekly',  bars: 52,  window: '1 an'      },
  { id: 'monthly', label: '1M',  fullLabel: 'Long terme',   resolution: 'monthly', bars: 36,  window: '3 ans'     },
];

// ── Sparkline SVG ─────────────────────────────────────────────────────────────

function Sparkline({ closes, isUp, id }: { closes: number[]; isUp: boolean; id: string }) {
  if (closes.length < 2) return <div style={{ height: 64 }} />;

  const min   = Math.min(...closes);
  const max   = Math.max(...closes);
  const range = max - min || closes[0] * 0.01 || 1;
  const W = 300, H = 64, px = 3, py = 4;

  const pts = closes.map((v, i) => {
    const x = px + (i / (closes.length - 1)) * (W - 2 * px);
    const y = py + (1 - (v - min) / range) * (H - 2 * py);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePts = pts.join(' ');
  // Polygone de remplissage : descend jusqu'au bas sur les extrémités
  const lastX   = pts[pts.length - 1].split(',')[0];
  const fillPts = `${px},${H - py} ${linePts} ${lastX},${H - py}`;

  const color  = isUp ? '#10b981' : '#ef4444';
  const gradId = `spk-${id}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: 64 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#${gradId})`} />
      <polyline
        points={linePts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Point de la dernière valeur */}
      <circle
        cx={parseFloat(lastX)}
        cy={parseFloat(pts[pts.length - 1].split(',')[1])}
        r="3"
        fill={color}
      />
    </svg>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface MultiTimeframePanelProps {
  data: OHLCVData[];
  theme: 'light' | 'dark';
}

interface FrameResult extends TFConfig {
  closes: number[];
  last: number;
  pct: number;
  isUp: boolean;
  periodHigh: number;
  periodLow: number;
  distFromHigh: number;
  distFromLow: number;
  barCount: number;
}

export default function MultiTimeframePanel({ data, theme }: MultiTimeframePanelProps) {
  const isDark = theme === 'dark';

  const frames = useMemo((): FrameResult[] => {
    if (!data || data.length < 5) return [];

    return TF_CONFIGS.flatMap(tf => {
      const resolved = applyResolution(data, tf.resolution);
      const sliced   = resolved.slice(-tf.bars);
      if (sliced.length < 2) return [];

      const first = sliced[0].close;
      const last  = sliced[sliced.length - 1].close;
      const pct   = first === 0 ? 0 : ((last / first) - 1) * 100;
      const isUp  = pct >= 0;

      const periodHigh   = Math.max(...sliced.map(d => d.high));
      const periodLow    = Math.min(...sliced.map(d => d.low));
      const distFromHigh = ((last / periodHigh) - 1) * 100;
      const distFromLow  = ((last / periodLow)  - 1) * 100;

      return [{
        ...tf,
        closes: sliced.map(d => d.close),
        last,
        pct,
        isUp,
        periodHigh,
        periodLow,
        distFromHigh,
        distFromLow,
        barCount: sliced.length,
      }];
    });
  }, [data]);

  if (frames.length === 0) return null;

  // Divergence : directions mixtes parmi les 3 timeframes
  const signals      = frames.map(f => f.isUp);
  const hasDivergence = signals.some(Boolean) && signals.some(s => !s);
  const allBullish    = signals.every(Boolean);
  const allBearish    = signals.every(s => !s);

  // Styles
  const cardBg     = isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200';
  const textMain   = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMuted  = isDark ? 'text-gray-400' : 'text-gray-500';
  const statBg     = isDark ? 'bg-gray-700/60' : 'bg-gray-50';

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-2">
      {/* Bannière de consensus ou de divergence */}
      {hasDivergence ? (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
          isDark
            ? 'bg-amber-900/30 text-amber-300 border border-amber-700/40'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            <strong>Divergence multi-timeframe</strong> — court et long terme en opposition.
            Prudence avant de prendre position.
          </span>
        </div>
      ) : allBullish ? (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
          isDark
            ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/40'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            <strong>Consensus haussier</strong> — tendance alignée sur les 3 timeframes.
          </span>
        </div>
      ) : allBearish ? (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
          isDark
            ? 'bg-red-900/30 text-red-300 border border-red-700/40'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            <strong>Consensus baissier</strong> — pression vendeuse sur les 3 horizons.
          </span>
        </div>
      ) : null}

      {/* 3 mini-cartes côte à côte */}
      <div className="grid grid-cols-3 gap-2">
        {frames.map((frame) => {
          const pctStr    = `${frame.pct >= 0 ? '+' : ''}${frame.pct.toFixed(2)}%`;
          const pctColor  = frame.isUp ? 'text-emerald-600' : 'text-red-500';
          const badgeBg   = frame.isUp
            ? (isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
            : (isDark ? 'bg-red-900/40 text-red-300'         : 'bg-red-100 text-red-600');

          return (
            <div key={frame.id} className={`rounded-xl border overflow-hidden ${cardBg}`}>
              {/* En-tête */}
              <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-sm font-bold ${textMain}`}>{frame.label}</span>
                  <span className={`text-xs ${textMuted}`}>{frame.fullLabel}</span>
                </div>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${badgeBg}`}>
                  {pctStr}
                </span>
              </div>

              {/* Sparkline */}
              <div className="px-0">
                <Sparkline closes={frame.closes} isUp={frame.isUp} id={frame.id} />
              </div>

              {/* Prix actuel */}
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className={`text-xs font-semibold ${textMain}`}>{fmt(frame.last)} FCFA</span>
                <div className="flex items-center gap-1">
                  {frame.isUp
                    ? <TrendingUp  className="w-3.5 h-3.5 text-emerald-500" />
                    : <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  }
                  <span className={`text-xs font-semibold ${pctColor}`}>{pctStr}</span>
                </div>
              </div>

              {/* Stats : plus haut / plus bas de la fenêtre */}
              <div className={`grid grid-cols-2 gap-px mx-3 mb-2.5 rounded-lg overflow-hidden text-xs ${statBg}`}>
                <div className="px-2 py-1.5">
                  <p className={`${textMuted} text-[10px] uppercase tracking-wide`}>+ haut</p>
                  <p className={`font-semibold ${textMain}`}>{fmt(frame.periodHigh)}</p>
                  <p className={`text-[10px] ${frame.distFromHigh < -10 ? 'text-red-500' : textMuted}`}>
                    {frame.distFromHigh.toFixed(1)}%
                  </p>
                </div>
                <div className="px-2 py-1.5">
                  <p className={`${textMuted} text-[10px] uppercase tracking-wide`}>+ bas</p>
                  <p className={`font-semibold ${textMain}`}>{fmt(frame.periodLow)}</p>
                  <p className={`text-[10px] ${frame.distFromLow < 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                    +{frame.distFromLow.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Fenêtre temporelle */}
              <div className={`border-t px-3 py-1.5 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <p className={`text-[10px] ${textMuted}`}>
                  {frame.barCount} bougies · {frame.window}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
