/**
 * Métadonnées, styles et persistance des outils de dessin du graphique.
 * Partagé entre useStockChart (logique) et les composants (UI) pour éviter
 * de dupliquer les libellés et la connaissance des options de la librairie.
 */

/**
 * Famille d'options de la librairie : détermine où lire/écrire couleur & épaisseur.
 * - line    → options.line.{color,width,style}
 * - shape   → options.<shapeKey>.{background.color, border.{color,width,style}}
 * - channel → options.{channelLine,middleLine}.{…} + background (canal parallèle)
 * - text    → options.text.font.{color,size}
 */
export type DrawingFamily = 'line' | 'shape' | 'channel' | 'text';

export interface DrawingToolMeta {
  label: string;
  /** Nombre de points à cliquer pour terminer le tracé ; -1 = tracé libre */
  points: number;
  family: DrawingFamily;
  /** Clé d'options pour les figures fermées (rectangle, circle, …) */
  shapeKey?: 'rectangle' | 'circle' | 'priceRange' | 'triangle';
  /** Gestuelle particulière : glisser-déposer ou fermeture du chemin */
  gesture?: 'drag' | 'closePath';
}

/** Points et familles relevés dans lightweight-charts-line-tools (LineToolsOptionDefaults) */
export const DRAWING_TOOLS: Record<string, DrawingToolMeta> = {
  TrendLine:       { label: 'Droite de tendance',  points:  2, family: 'line' },
  Ray:             { label: 'Rayon',               points:  2, family: 'line' },
  Arrow:           { label: 'Flèche',              points:  2, family: 'line' },
  ExtendedLine:    { label: 'Ligne étendue',       points:  2, family: 'line' },
  HorizontalLine:  { label: 'Ligne horizontale',   points:  1, family: 'line' },
  HorizontalRay:   { label: 'Rayon horizontal',    points:  1, family: 'line' },
  VerticalLine:    { label: 'Ligne verticale',     points:  1, family: 'line' },
  ParallelChannel: { label: 'Canal parallèle',     points:  3, family: 'channel' },
  CrossLine:       { label: 'Réticule de prix',    points:  1, family: 'line' },
  Path:            { label: 'Chemin multi-points', points: -1, family: 'line', gesture: 'closePath' },
  FibRetracement:  { label: 'Fibonacci',           points:  2, family: 'line' },
  Rectangle:       { label: 'Rectangle',           points:  2, family: 'shape', shapeKey: 'rectangle'  },
  Circle:          { label: 'Cercle',              points:  2, family: 'shape', shapeKey: 'circle'     },
  Triangle:        { label: 'Triangle',            points:  3, family: 'shape', shapeKey: 'triangle'   },
  PriceRange:      { label: 'Mesure de prix',      points:  2, family: 'shape', shapeKey: 'priceRange' },
  Highlighter:     { label: 'Surbrillance',        points: -1, family: 'line', gesture: 'drag' },
  Brush:           { label: 'Pinceau libre',       points: -1, family: 'line', gesture: 'drag' },
  Text:            { label: 'Texte',               points:  1, family: 'text' },
  Callout:         { label: 'Bulle de texte',      points:  2, family: 'line' },
};

export const getToolLabel = (toolType: string): string =>
  DRAWING_TOOLS[toolType]?.label ?? toolType;

/** Consigne affichée pendant le placement d'un tracé */
export function getPlacementHint(toolType: string): string {
  const meta = DRAWING_TOOLS[toolType];
  if (!meta) return 'Cliquez sur le graphique pour placer le tracé.';
  if (meta.gesture === 'drag') return 'Maintenez le clic et faites glisser pour dessiner.';
  if (meta.gesture === 'closePath') return 'Cliquez pour ajouter des points, recliquez sur le dernier pour terminer.';
  switch (meta.points) {
    case 1:  return 'Cliquez sur le graphique pour placer le tracé.';
    case 2:  return 'Cliquez le point de départ, puis le point d\'arrivée.';
    case 3:  return 'Cliquez 3 points pour définir le tracé.';
    default: return 'Cliquez sur le graphique pour placer le tracé.';
  }
}

// ─── Style d'un tracé (panneau propriétés) ───────────────────────────────────

export interface DrawingStyle {
  color: string;
  width: number;
  lineStyle: number;
}

/** Valeurs de LineStyle dans lightweight-charts */
export const LINE_STYLE_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Continu'    },
  { value: 1, label: 'Pointillés' },
  { value: 2, label: 'Tirets'     },
  { value: 3, label: 'Tirets longs' },
];

export const DEFAULT_DRAWING_STYLE: DrawingStyle = { color: '#2962ff', width: 2, lineStyle: 0 };

/** Convertit #rrggbb en rgba(r,g,b,alpha) — les inputs color renvoient toujours du hex */
export function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Normalise une couleur de la librairie (rgba/hex) vers #rrggbb pour <input type="color"> */
export function toHexColor(color: unknown): string {
  if (typeof color !== 'string') return DEFAULT_DRAWING_STYLE.color;
  const trimmed = color.trim();
  if (/^#[\da-f]{6}$/i.test(trimmed)) return trimmed.toLowerCase();
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(trimmed);
  if (rgb) {
    const hex = [rgb[1], rgb[2], rgb[3]]
      .map((v) => Math.min(255, parseInt(v, 10)).toString(16).padStart(2, '0'))
      .join('');
    return `#${hex}`;
  }
  return DEFAULT_DRAWING_STYLE.color;
}

/** Lit le style courant d'un tracé exporté par la librairie */
export function readDrawingStyle(toolType: string, options: any): DrawingStyle {
  const meta = DRAWING_TOOLS[toolType];
  if (meta?.family === 'shape' && meta.shapeKey) {
    const border = options?.[meta.shapeKey]?.border ?? {};
    return {
      color: toHexColor(border.color),
      width: typeof border.width === 'number' ? border.width : DEFAULT_DRAWING_STYLE.width,
      lineStyle: typeof border.style === 'number' ? border.style : 0,
    };
  }
  if (meta?.family === 'channel') {
    const channelLine = options?.channelLine ?? {};
    return {
      color: toHexColor(channelLine.color),
      width: typeof channelLine.width === 'number' ? channelLine.width : DEFAULT_DRAWING_STYLE.width,
      lineStyle: typeof channelLine.style === 'number' ? channelLine.style : 0,
    };
  }
  if (meta?.family === 'text') {
    const font = options?.text?.font ?? {};
    return {
      color: toHexColor(font.color),
      width: typeof font.size === 'number' ? font.size : 14,
      lineStyle: 0,
    };
  }
  const line = options?.line ?? {};
  return {
    color: toHexColor(line.color),
    width: typeof line.width === 'number' ? line.width : DEFAULT_DRAWING_STYLE.width,
    lineStyle: typeof line.style === 'number' ? line.style : 0,
  };
}

/**
 * Construit le sous-ensemble d'options à passer à applyLineToolOptions().
 * Les figures fermées reçoivent aussi un fond translucide dérivé de la couleur.
 */
export function buildStyleOptions(toolType: string, style: DrawingStyle): Record<string, unknown> {
  const meta = DRAWING_TOOLS[toolType];
  if (meta?.family === 'shape' && meta.shapeKey) {
    return {
      [meta.shapeKey]: {
        background: { color: hexToRgba(style.color, 0.2) },
        border: { color: style.color, width: style.width, style: style.lineStyle },
      },
    };
  }
  if (meta?.family === 'channel') {
    return {
      background: { color: hexToRgba(style.color, 0.2) },
      channelLine: { color: style.color, width: style.width, style: style.lineStyle },
      middleLine: { color: style.color, width: style.width },
    };
  }
  if (meta?.family === 'text') {
    return { text: { font: { color: style.color, size: style.width } } };
  }
  return { line: { color: style.color, width: style.width, style: style.lineStyle } };
}

/** Vrai si le tracé expose une épaisseur de trait (le Texte expose une taille de police) */
export const isTextTool = (toolType: string): boolean => DRAWING_TOOLS[toolType]?.family === 'text';

// ─── Persistance locale (par symbole) ────────────────────────────────────────

const STORAGE_PREFIX = 'afribourse:drawings:';

const storageKey = (symbol: string) => `${STORAGE_PREFIX}${symbol}`;

/** Tracés sauvegardés pour ce symbole, au format exportLineTools() (JSON string) */
export function loadSavedDrawings(symbol: string): string | null {
  if (!symbol) return null;
  try {
    return window.localStorage.getItem(storageKey(symbol));
  } catch {
    return null; // navigation privée / stockage désactivé
  }
}

export function saveDrawings(symbol: string, json: string): void {
  if (!symbol) return;
  try {
    if (!json || json === '[]') window.localStorage.removeItem(storageKey(symbol));
    else window.localStorage.setItem(storageKey(symbol), json);
  } catch {
    /* quota dépassé ou stockage indisponible : les tracés restent en mémoire */
  }
}
