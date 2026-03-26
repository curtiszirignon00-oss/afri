// src/components/watchlist/WatchlistScoreBadge.tsx
import { type TickerScore, type SignalZone } from '../../hooks/useApi';

// ── Zone config ────────────────────────────────────────────────────────────────

interface ZoneStyle {
  bg: string;
  text: string;
  ring: string;
  label: string;
  dot: string;
}

const ZONE_STYLES: Record<SignalZone, ZoneStyle> = {
  'Achat Fort':    { bg: 'bg-emerald-100', text: 'text-emerald-800', ring: 'ring-emerald-400', label: 'Achat Fort',    dot: 'bg-emerald-500' },
  'Signal Achat':  { bg: 'bg-green-50',    text: 'text-green-700',   ring: 'ring-green-300',   label: 'Achat',         dot: 'bg-green-400'   },
  'Neutre':        { bg: 'bg-gray-100',     text: 'text-gray-600',    ring: 'ring-gray-300',    label: 'Neutre',        dot: 'bg-gray-400'    },
  'Signal Vente':  { bg: 'bg-orange-100',  text: 'text-orange-700',  ring: 'ring-orange-300',  label: 'Vente',         dot: 'bg-orange-400'  },
  'Vente Forte':   { bg: 'bg-red-100',     text: 'text-red-700',     ring: 'ring-red-400',     label: 'Vente Forte',   dot: 'bg-red-500'     },
};

// ── Score circle ───────────────────────────────────────────────────────────────

function ScoreCircle({ score, zone }: { score: number; zone: SignalZone }) {
  const size = 36;
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  const strokeColor =
    zone === 'Achat Fort'   ? '#10b981' :
    zone === 'Signal Achat' ? '#22c55e' :
    zone === 'Neutre'       ? '#9ca3af' :
    zone === 'Signal Vente' ? '#f97316' :
    '#ef4444';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2} y={size / 2 + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="9" fontWeight="700" fill={strokeColor}
      >
        {score}
      </text>
    </svg>
  );
}

// ── Main badge ─────────────────────────────────────────────────────────────────

interface Props {
  score: TickerScore;
  /** compact = only circle + zone chip; full = circle + sub-bars */
  variant?: 'compact' | 'full';
}

export default function WatchlistScoreBadge({ score, variant = 'compact' }: Props) {
  const style = ZONE_STYLES[score.zone];

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <ScoreCircle score={score.score} zone={score.zone} />
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
          {style.label}
        </span>
      </div>
    );
  }

  // Full variant: circle + tech/fund sub-bars
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <ScoreCircle score={score.score} zone={score.zone} />
      <div className="min-w-0">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
          {style.label}
        </span>
        <div className="flex gap-2 mt-1">
          {score.technical != null && (
            <SubBar label="T" value={score.technical} color="bg-blue-400" />
          )}
          {score.fundamental != null && (
            <SubBar label="F" value={score.fundamental} color="bg-purple-400" />
          )}
        </div>
        {score.dataQuality === 'low' && (
          <p className="text-[9px] text-gray-400 mt-0.5">données limitées</p>
        )}
      </div>
    </div>
  );
}

function SubBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1" title={`${label === 'T' ? 'Technique' : 'Fondamental'}: ${value}/100`}>
      <span className="text-[9px] text-gray-400 font-medium w-2">{label}</span>
      <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
