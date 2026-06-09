import { useRef } from 'react';

export interface PillTab<T extends string = string> {
  key: T;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface Props<T extends string> {
  tabs: PillTab<T>[];
  active: T;
  onChange: (key: T) => void;
  className?: string;
}

export default function PillTabs<T extends string>({ tabs, active, onChange, className = '' }: Props<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className={`flex gap-2 overflow-x-auto scrollbar-hide ${className}`}
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      {tabs.map(tab => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 cursor-pointer shrink-0 border ${
              isActive
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
