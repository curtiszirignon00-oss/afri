import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MacroItem {
  indicator: string;
  value: string;
  trend?: 'up' | 'down' | 'flat';
  note?: string;
}

interface Props {
  items: MacroItem[];
}

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === 'up')   return <TrendingUp   className="w-4 h-4 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown  className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

export default function MacroGrid({ items }: Props) {
  if (!items?.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate">
              {item.indicator}
            </p>
            <TrendIcon trend={item.trend} />
          </div>
          <p className="text-base font-bold text-gray-900">{item.value}</p>
          {item.note && (
            <p className="text-[10px] text-gray-400 leading-relaxed">{item.note}</p>
          )}
        </div>
      ))}
    </div>
  );
}
