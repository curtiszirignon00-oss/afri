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
      {/* KOFI intro text */}
      {context.kofiIntro && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="text-sm text-blue-800 leading-relaxed">{context.kofiIntro}</p>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
              tab === id
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
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
              <p className="text-sm text-gray-400 text-center py-4">Aucune actualité disponible.</p>
            )}
          </div>
        )}

        {tab === 'macro' && (
          context.macro?.length ? (
            <MacroGrid items={context.macro} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Aucune donnée macro disponible.</p>
          )
        )}

        {tab === 'fundamentals' && (
          <FundamentalsPanel tickers={tickers} fundamentals={fundamentals} />
        )}
      </div>
    </div>
  );
}
