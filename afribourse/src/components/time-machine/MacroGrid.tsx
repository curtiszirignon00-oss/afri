import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface MacroItem {
  label: string;
  value: string;
  signal?: string;
  signification?: string;
  note?: string;
  trend?: 'up' | 'down' | 'flat';
}

interface Props {
  items: MacroItem[];
}

function TrendBadge({ trend }: { trend?: string }) {
  if (trend === 'up') return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full">
      <TrendingUp className="w-2.5 h-2.5" /> Hausse
    </span>
  );
  if (trend === 'down') return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded-full">
      <TrendingDown className="w-2.5 h-2.5" /> Baisse
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded-full">
      <Minus className="w-2.5 h-2.5" /> Stable
    </span>
  );
}

export default function MacroGrid({ items }: Props) {
  if (!items?.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 rounded-xl p-3 flex flex-col gap-2 cursor-default transition-all duration-200"
        >
          {/* Header row: label + info icon */}
          <div className="flex items-start justify-between gap-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-tight flex-1">
              {item.label}
            </p>
            {item.signification && (
              <Info className="w-3 h-3 text-slate-500 group-hover:text-amber-400 shrink-0 mt-0.5 transition-colors" />
            )}
          </div>

          {/* Value */}
          <p className={`text-lg font-extrabold leading-none ${
            item.trend === 'up' ? 'text-emerald-400' :
            item.trend === 'down' ? 'text-red-400' :
            'text-white'
          }`}>
            {item.value}
          </p>

          {/* Trend badge */}
          <TrendBadge trend={item.trend} />

          {/* Signal — always visible */}
          {item.signal && (
            <p className="text-[9px] text-slate-500 leading-relaxed line-clamp-2">
              {item.signal}
            </p>
          )}

          {/* Signification tooltip — appears on hover */}
          {item.signification && (
            <div className="absolute inset-x-0 bottom-full mb-2 z-50 px-1 pointer-events-none
                            opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-3 shadow-2xl shadow-black/60">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Info className="w-3 h-3 text-amber-400 shrink-0" />
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    C'est quoi ?
                  </p>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed">{item.signification}</p>
                {/* Arrow */}
                <div className="absolute top-full left-6 border-4 border-transparent border-t-slate-900" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
