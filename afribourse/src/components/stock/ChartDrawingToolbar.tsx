import { useState, useRef, useEffect, useCallback, type ComponentType, type RefObject, type PointerEvent as ReactPointerEvent } from 'react';
import {
  MousePointer2,
  TrendingUp,
  ArrowUpRight,
  ArrowLeftRight,
  ArrowRight,
  MoveRight,
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
  Ruler,
  Crosshair,
  MessageSquare,
  Triangle,
  Paintbrush,
  Spline,
  Undo2,
  Repeat,
  List,
  X,
  GripHorizontal,
} from 'lucide-react';
import {
  getToolLabel, loadToolbarPosition, saveToolbarPosition,
  DEFAULT_TOOLBAR_POSITION, type ToolbarPosition,
} from '../../utils/drawingTools';
import type { DrawingInfo } from '../../hooks/useStockChart';

interface DrawingTool {
  type: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}

interface ChartDrawingToolbarProps {
  onToolSelect: (toolType: string) => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onUndo: () => void;
  canUndo: boolean;
  drawings: DrawingInfo[];
  onRemoveDrawing: (id: string) => void;
  continuousMode: boolean;
  onToggleContinuous: () => void;
  activeTool?: string | null;
  theme?: 'light' | 'dark';
  /** Zone dans laquelle la barre peut être déplacée (conteneur du graphique) */
  boundsRef: RefObject<HTMLElement | null>;
}

const LINE_TOOLS: DrawingTool[] = [
  { type: 'TrendLine',       icon: TrendingUp,        label: 'Droite de tendance'  },
  { type: 'Ray',             icon: ArrowUpRight,      label: 'Rayon'               },
  { type: 'Arrow',           icon: ArrowRight,        label: 'Flèche'              },
  { type: 'ExtendedLine',    icon: ArrowLeftRight,    label: 'Ligne étendue'       },
  { type: 'HorizontalLine',  icon: Minus,             label: 'Ligne horizontale'   },
  { type: 'HorizontalRay',   icon: MoveRight,         label: 'Rayon horizontal'    },
  { type: 'VerticalLine',    icon: SeparatorVertical, label: 'Ligne verticale'     },
  { type: 'ParallelChannel', icon: Layers,            label: 'Canal parallèle'     },
  { type: 'CrossLine',       icon: Crosshair,         label: 'Réticule de prix'    },
  { type: 'Path',            icon: Spline,            label: 'Chemin multi-points' },
];

const SHAPE_TOOLS: DrawingTool[] = [
  { type: 'FibRetracement', icon: BarChart2,   label: 'Fibonacci (configurable)' },
  { type: 'Rectangle',      icon: Square,      label: 'Rectangle'                },
  { type: 'Circle',         icon: Circle,      label: 'Cercle'                   },
  { type: 'Triangle',       icon: Triangle,    label: 'Triangle'                 },
  { type: 'Highlighter',    icon: Highlighter, label: 'Surbrillance'             },
  { type: 'PriceRange',     icon: Ruler,       label: 'Mesure de prix (%)'       },
];

const ANNOTATION_TOOLS: DrawingTool[] = [
  { type: 'Text',    icon: Type,          label: 'Texte'           },
  { type: 'Callout', icon: MessageSquare, label: 'Bulle de texte'  },
  { type: 'Brush',   icon: Paintbrush,    label: 'Pinceau libre'   },
];

export default function ChartDrawingToolbar({
  onToolSelect,
  onDeleteSelected,
  onClearAll,
  onUndo,
  canUndo,
  drawings,
  onRemoveDrawing,
  continuousMode,
  onToggleContinuous,
  activeTool,
  theme = 'light',
  boundsRef,
}: ChartDrawingToolbarProps) {
  const isDark = theme === 'dark';
  const [showList, setShowList] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // ── Barre déplaçable ──────────────────────────────────────────────────────
  const rootRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<ToolbarPosition>(
    () => loadToolbarPosition() ?? DEFAULT_TOOLBAR_POSITION
  );
  const [isDragging, setIsDragging] = useState(false);
  /** Écart entre le pointeur et le coin de la barre au début du glissement */
  const grabOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  /** Hauteur de la zone graphique : la barre (≈850px) doit y tenir pour rester déplaçable */
  const [boundsHeight, setBoundsHeight] = useState(0);

  /** Garde la barre entièrement visible dans la zone du graphique */
  const clampToBounds = useCallback((x: number, y: number): ToolbarPosition => {
    const bounds = boundsRef.current?.getBoundingClientRect();
    const el = rootRef.current?.getBoundingClientRect();
    if (!bounds || !el) return { x, y };
    const maxX = Math.max(0, bounds.width - el.width);
    const maxY = Math.max(0, bounds.height - el.height);
    return {
      x: Math.min(Math.max(0, x), maxX),
      y: Math.min(Math.max(0, y), maxY),
    };
  }, [boundsRef]);

  const handleDragStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = rootRef.current;
    const bounds = boundsRef.current;
    if (!el || !bounds) return;
    const rect = el.getBoundingClientRect();
    grabOffsetRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    e.preventDefault(); // pas de sélection de texte pendant le glissement
  };

  const handleDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const grab = grabOffsetRef.current;
    const bounds = boundsRef.current?.getBoundingClientRect();
    if (!grab || !bounds) return;
    setPosition(clampToBounds(
      e.clientX - bounds.left - grab.dx,
      e.clientY - bounds.top - grab.dy,
    ));
  };

  const handleDragEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!grabOffsetRef.current) return;
    grabOffsetRef.current = null;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setPosition(prev => {
      saveToolbarPosition(prev);
      return prev;
    });
  };

  /** Double-clic sur la poignée : remet la barre à sa place d'origine */
  const resetPosition = () => {
    setPosition(DEFAULT_TOOLBAR_POSITION);
    saveToolbarPosition(DEFAULT_TOOLBAR_POSITION);
  };

  /** Déplacement au clavier quand la poignée a le focus */
  const handleHandleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 20 : 5;
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    };
    const delta = deltas[e.key];
    if (!delta) return;
    e.preventDefault();
    setPosition(prev => {
      const next = clampToBounds(prev.x + delta[0], prev.y + delta[1]);
      saveToolbarPosition(next);
      return next;
    });
  };

  // Replacer la barre si la zone rétrécit (redimensionnement, plein écran)
  // ou si le panneau de gestion change la largeur totale.
  // Suivre la hauteur de la zone graphique (redimensionnement, plein écran)
  useEffect(() => {
    const bounds = boundsRef.current;
    if (!bounds) return;
    const measure = () => setBoundsHeight(bounds.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bounds);
    return () => observer.disconnect();
  }, [boundsRef]);

  /**
   * La colonne d'outils défile si elle dépasse la place disponible.
   * On réserve ~120px pour que la barre garde une vraie latitude de déplacement
   * vertical : sans cela elle occupe toute la hauteur et ne peut plus bouger.
   */
  const toolsMaxHeight = boundsHeight > 0 ? Math.max(160, boundsHeight - 160) : undefined;

  // Recaler la barre APRÈS que la nouvelle hauteur max soit appliquée au DOM
  // (sinon on mesure encore la barre à pleine hauteur et elle est collée en haut).
  useEffect(() => {
    // Tant que la zone n'est pas mesurée, la barre est à pleine hauteur :
    // caler maintenant écraserait la position enregistrée en la collant en haut.
    if (boundsHeight === 0) return;
    setPosition(prev => {
      const next = clampToBounds(prev.x, prev.y);
      return next.x === prev.x && next.y === prev.y ? prev : next;
    });
  }, [boundsHeight, showList, clampToBounds]);

  const bgClass    = isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200';
  const btnClass   = isDark
    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-100'
    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900';
  const activeClass = isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600';
  const divClass   = isDark ? 'bg-gray-600' : 'bg-gray-200';
  const textClass  = isDark ? 'text-gray-100' : 'text-gray-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-gray-500';

  const ToolBtn = ({ tool }: { tool: DrawingTool }) => {
    const Icon = tool.icon;
    const isActive = activeTool === tool.type;
    return (
      <button
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

  const handleClearAll = () => {
    onClearAll();
    setConfirmClear(false);
    setShowList(false);
  };

  return (
    <div
      ref={rootRef}
      className={`absolute z-10 flex items-start gap-1.5 ${isDragging ? 'select-none' : ''}`}
      style={{ left: position.x, top: position.y }}
    >
      <div
        className={`rounded-lg border shadow-md ${bgClass} ${
          isDragging ? 'shadow-xl ring-2 ring-blue-400' : ''
        }`}
        style={{ width: '38px' }}
      >
        {/* Poignée de déplacement — toujours visible, hors de la zone défilante */}
        <div
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          onDoubleClick={resetPosition}
          onKeyDown={handleHandleKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Déplacer la barre d'outils"
          title="Glissez pour déplacer · double-clic pour replacer · flèches du clavier"
          className={`h-6 mx-1 mt-1 flex items-center justify-center rounded ${btnClass} ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ touchAction: 'none' }}
        >
          <GripHorizontal className="w-[15px] h-[15px]" />
        </div>

        <div className={`w-5 h-px ${divClass} mx-auto my-1`} />

        {/* Outils — défilent si la zone du graphique est trop courte */}
        <div
          className="flex flex-col items-center gap-0.5 px-1 pb-1"
          style={{ maxHeight: toolsMaxHeight, overflowY: 'auto', scrollbarWidth: 'none' }}
        >
        {/* Curseur / sélection */}
        <button
          onClick={() => onToolSelect('cursor')}
          title="Sélectionner (curseur) — Échap"
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            isCursorActive ? activeClass : btnClass
          }`}
        >
          <MousePointer2 className="w-[15px] h-[15px]" />
        </button>

        <div className={`w-5 h-px ${divClass} my-0.5`} />

        {/* Lignes & rayons */}
        {LINE_TOOLS.map((t) => <ToolBtn key={t.type} tool={t} />)}

        <div className={`w-5 h-px ${divClass} my-0.5`} />

        {/* Figures */}
        {SHAPE_TOOLS.map((t) => <ToolBtn key={t.type} tool={t} />)}

        <div className={`w-5 h-px ${divClass} my-0.5`} />

        {/* Annotations & dessin libre */}
        {ANNOTATION_TOOLS.map((t) => <ToolBtn key={t.type} tool={t} />)}

        <div className={`w-5 h-px ${divClass} my-0.5`} />

        {/* Mode continu : garde l'outil actif après chaque tracé */}
        <button
          onClick={onToggleContinuous}
          title={continuousMode
            ? 'Mode continu actif : l\'outil reste armé après chaque tracé'
            : 'Mode continu : garder l\'outil armé après chaque tracé'}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            continuousMode ? activeClass : btnClass
          }`}
        >
          <Repeat className="w-[15px] h-[15px]" />
        </button>

        {/* Annuler */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Annuler (Ctrl+Z)"
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${btnClass} disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <Undo2 className="w-[15px] h-[15px]" />
        </button>

        {/* Liste des tracés */}
        <button
          onClick={() => { setShowList(v => !v); setConfirmClear(false); }}
          title="Gérer les tracés"
          className={`relative w-8 h-8 flex items-center justify-center rounded transition-colors ${
            showList ? activeClass : btnClass
          }`}
        >
          <List className="w-[15px] h-[15px]" />
          {drawings.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-[3px] flex items-center justify-center rounded-full bg-blue-600 text-white text-[9px] font-semibold leading-none">
              {drawings.length}
            </span>
          )}
        </button>

        <div className={`w-5 h-px ${divClass} my-0.5`} />

        {/* Actions */}
        <button
          onClick={onDeleteSelected}
          title="Supprimer la sélection (Suppr)"
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${btnClass}`}
        >
          <Trash2 className="w-[15px] h-[15px]" />
        </button>
        <button
          onClick={() => { setConfirmClear(true); setShowList(true); }}
          disabled={drawings.length === 0}
          title="Effacer tous les tracés"
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${btnClass} hover:!text-red-500 disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <Eraser className="w-[15px] h-[15px]" />
        </button>
        </div>
      </div>

      {/* Panneau de gestion des tracés */}
      {showList && (
        <div className={`w-56 rounded-lg border shadow-lg ${bgClass} overflow-hidden`}>
          <div className={`flex items-center justify-between px-3 py-2 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
            <span className={`text-xs font-semibold ${textClass}`}>
              Tracés ({drawings.length})
            </span>
            <button
              onClick={() => { setShowList(false); setConfirmClear(false); }}
              className={`p-0.5 rounded ${btnClass}`}
              title="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {drawings.length === 0 ? (
            <p className={`px-3 py-4 text-xs ${mutedClass}`}>
              Aucun tracé. Choisissez un outil, puis cliquez sur le graphique.
            </p>
          ) : (
            <>
              <ul className="max-h-56 overflow-y-auto py-1">
                {drawings.map((d, i) => (
                  <li
                    key={d.id}
                    className={`flex items-center justify-between gap-2 px-3 py-1.5 ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-xs truncate ${textClass}`}>
                      <span className={mutedClass}>{i + 1}.</span> {getToolLabel(d.toolType)}
                    </span>
                    <button
                      onClick={() => onRemoveDrawing(d.id)}
                      title="Supprimer ce tracé"
                      className={`p-1 rounded flex-shrink-0 ${mutedClass} hover:text-red-500 ${
                        isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className={`px-3 py-2 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                {confirmClear ? (
                  <div className="space-y-1.5">
                    <p className={`text-xs ${textClass}`}>Effacer les {drawings.length} tracés ?</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleClearAll}
                        className="flex-1 px-2 py-1 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        Effacer
                      </button>
                      <button
                        onClick={() => setConfirmClear(false)}
                        className={`flex-1 px-2 py-1 text-xs rounded ${btnClass} ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className={`w-full px-2 py-1 text-xs rounded ${mutedClass} hover:text-red-500 ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    } transition-colors`}
                  >
                    Tout effacer
                  </button>
                )}
              </div>
            </>
          )}

          <p className={`px-3 py-2 text-[10px] leading-relaxed border-t ${mutedClass} ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
            Double-cliquez un tracé pour changer sa couleur.
          </p>
        </div>
      )}
    </div>
  );
}
