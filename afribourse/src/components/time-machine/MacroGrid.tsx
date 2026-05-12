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
    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-full">
      <TrendingUp className="w-2.5 h-2.5" /> Hausse
    </span>
  );
  if (trend === 'down') return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-full">
      <TrendingDown className="w-2.5 h-2.5" /> Baisse
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full">
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
          className="group relative bg-white hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-xl p-3 flex flex-col gap-2 cursor-default transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-1">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider leading-tight flex-1">
              {item.label}
            </p>
            {item.signification && (
              <Info className="w-3 h-3 text-gray-300 group-hover:text-amber-500 shrink-0 mt-0.5 transition-colors" />
            )}
          </div>

          {/* Value */}
          <p className={`text-lg font-extrabold leading-none ${
            item.trend === 'up' ? 'text-emerald-600' :
            item.trend === 'down' ? 'text-red-600' :
            'text-gray-900'
          }`}>
            {item.value}
          </p>

          {/* Trend badge */}
          <TrendBadge trend={item.trend} />

          {/* Signal — always visible */}
          {item.signal && (
            <p className="text-[9px] text-gray-400 leading-relaxed line-clamp-2">
              {item.signal}
            </p>
          )}

          {/* Signification tooltip — above on hover */}
          {item.signification && (
            <div className="absolute inset-x-0 bottom-full mb-2 z-50 px-1 pointer-events-none
                            opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-2xl shadow-black/30">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Info className="w-3 h-3 text-amber-400 shrink-0" />
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">C'est quoi ?</p>
                </div>
                <p className="text-[11px] text-gray-200 leading-relaxed">{item.signification}</p>
                <div className="absolute top-full left-6 border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
