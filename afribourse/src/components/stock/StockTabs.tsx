import { ReactNode } from 'react';
import { BarChart3, Info, Newspaper, TrendingUp } from 'lucide-react';

export type TabId = 'overview' | 'analysis' | 'fundamentals' | 'news';

type Tab = {
  id: TabId;
  label: string;
  icon: ReactNode;
};

type StockTabsProps = {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
};

const TABS: Tab[] = [
  {
    id: 'overview',
    label: "Vue d'ensemble",
    icon: <Info className="w-4 h-4" />
  },
  {
    id: 'analysis',
    label: 'Analyse',
    icon: <TrendingUp className="w-4 h-4" />
  },
  {
    id: 'fundamentals',
    label: 'Fondamentaux',
    icon: <BarChart3 className="w-4 h-4" />
  },
  {
    id: 'news',
    label: 'Actualités',
    icon: <Newspaper className="w-4 h-4" />
  }
];

export default function StockTabs({ activeTab, onTabChange }: StockTabsProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex space-x-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
