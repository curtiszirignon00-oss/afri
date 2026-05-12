import { useState } from 'react';
import { Newspaper, BarChart3, TrendingUp } from 'lucide-react';
import NewsCard from './NewsCard';
import MacroGrid from './MacroGrid';
import FundamentalsPanel from './FundamentalsPanel';

interface ContextData {
  kofiIntro?: string;
  news?: any[];
  macro?: any[];
}

interface Props {
  context: ContextData;
  fundamentals: Record<string, any>;
  tickers: string[];
}

const TABS = [
  { id: 'news',          label: 'Actualités',    Icon: Newspaper },
  { id: 'macro',         label: 'Macro',         Icon: BarChart3 },
  { id: 'fundamentals',  label: 'Fondamentaux',  Icon: TrendingUp },
] as const;

type TabId = typeof TABS[number]['id'];

export default function ContextPanel({ context, fundamentals, tickers }: Props) {
  const [tab, setTab] = useState<TabId>('news');

  return (
    <div className="space-y-4">
      {/* Simba intro */}
      {context.kofiIntro && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-200 leading-relaxed">{context.kofiIntro}</p>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
              tab === id
                ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'news' && (
          <div className="space-y-3">
            {context.news?.length ? (
              context.news.map((item, i) => <NewsCard key={i} news={item} />)
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">Aucune actualité disponible.</p>
            )}
          </div>
        )}

        {tab === 'macro' && (
          context.macro?.length ? (
            <MacroGrid items={context.macro} />
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">Aucune donnée macro disponible.</p>
          )
        )}

        {tab === 'fundamentals' && (
          <FundamentalsPanel tickers={tickers} fundamentals={fundamentals} />
        )}
      </div>
    </div>
  );
}
