import type { ComponentType } from 'react';
import {
  MousePointer2,
  TrendingUp,
  ArrowUpRight,
  ArrowLeftRight,
  Minus,
  SeparatorVertical,
  Layers,
  BarChart2,
  Square,
  Circle,
  Highlighter,
  Type,
  Trash2,
  Eraser,
} from 'lucide-react';

interface DrawingTool {
  type: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}

interface ChartDrawingToolbarProps {
  onToolSelect: (toolType: string) => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  activeTool?: string | null;
  theme?: 'light' | 'dark';
}

const LINE_TOOLS: DrawingTool[] = [
  { type: 'TrendLine',       icon: TrendingUp,       label: 'Droite de tendance'  },
  { type: 'Ray',             icon: ArrowUpRight,     label: 'Rayon'               },
  { type: 'ExtendedLine',    icon: ArrowLeftRight,   label: 'Ligne étendue'       },
  { type: 'HorizontalLine',  icon: Minus,            label: 'Ligne horizontale'   },
  { type: 'VerticalLine',    icon: SeparatorVertical,label: 'Ligne verticale'     },
  { type: 'ParallelChannel', icon: Layers,           label: 'Canal parallèle'     },
];

const SHAPE_TOOLS: DrawingTool[] = [
  { type: 'FibRetracement', icon: BarChart2,   label: 'Fibonacci'   },
  { type: 'Rectangle',      icon: Square,      label: 'Rectangle'   },
  { type: 'Circle',         icon: Circle,      label: 'Cercle'      },
  { type: 'Highlighter',    icon: Highlighter, label: 'Surbrillance'},
];

const TEXT_TOOLS: DrawingTool[] = [
  { type: 'Text', icon: Type, label: 'Texte' },
];

export default function ChartDrawingToolbar({
  onToolSelect,
  onDeleteSelected,
  onClearAll,
  activeTool,
  theme = 'light',
}: ChartDrawingToolbarProps) {
  const isDark = theme === 'dark';

  const bgClass   = isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200';
  const btnClass  = isDark
    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-100'
    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900';
  const activeClass = isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600';
  const divClass  = isDark ? 'bg-gray-600' : 'bg-gray-200';

  const ToolBtn = ({ tool }: { tool: DrawingTool }) => {
    const Icon = tool.icon;
    const isActive = activeTool === tool.type;
    return (
      <button
        key={tool.type}
        onClick={() => onToolSelect(tool.type)}
        title={tool.label}
        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
          isActive ? activeClass : btnClass
        }`}
      >
        <Icon className="w-[15px] h-[15px]" />
      </button>
    );
  };

  const isCursorActive = !activeTool || activeTool === 'cursor';

  return (
    <div
      className={`flex flex-col items-center gap-0.5 p-1 rounded-lg border shadow-md ${bgClass}`}
      style={{ width: '38px' }}
    >
      {/* Curseur / sélection */}
      <button
        onClick={() => onToolSelect('cursor')}
        title="Sélectionner (curseur)"
        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
          isCursorActive ? activeClass : btnClass
        }`}
      >
        <MousePointer2 className="w-[15px] h-[15px]" />
      </button>

      <div className={`w-5 h-px ${divClass} my-0.5`} />

      {/* Lignes */}
      {LINE_TOOLS.map((t) => <ToolBtn key={t.type} tool={t} />)}

      <div className={`w-5 h-px ${divClass} my-0.5`} />

      {/* Figures */}
      {SHAPE_TOOLS.map((t) => <ToolBtn key={t.type} tool={t} />)}

      <div className={`w-5 h-px ${divClass} my-0.5`} />

      {/* Texte */}
      {TEXT_TOOLS.map((t) => <ToolBtn key={t.type} tool={t} />)}

      <div className={`w-5 h-px ${divClass} my-0.5`} />

      {/* Actions */}
      <button
        onClick={onDeleteSelected}
        title="Supprimer la sélection"
        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${btnClass}`}
      >
        <Trash2 className="w-[15px] h-[15px]" />
      </button>
      <button
        onClick={onClearAll}
        title="Effacer tous les tracés"
        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${btnClass} hover:!text-red-500`}
      >
        <Eraser className="w-[15px] h-[15px]" />
      </button>
    </div>
  );
}
