/**
 * Variantes Fibonacci construites au-dessus des outils primitifs de la librairie.
 *
 * La librairie ne fournit que `FibRetracement`. Les autres variantes sont donc
 * « composites » : l'utilisateur pose une ligne d'ancrage (2 points) et l'on
 * génère les tracés enfants (rayons, lignes verticales, chemins) à partir d'elle.
 * Déplacer l'ancrage suffit à tout recalculer.
 *
 * Ce module ne contient que de la géométrie pure : aucune dépendance au chart,
 * les conversions pixels sont injectées. Il est donc testable hors navigateur.
 */

/** Point d'un tracé, tel que l'attend la librairie */
export interface FibPoint {
  price: number;
  timestamp: number;
}

/** Un tracé enfant à créer via addLineTool(toolType, points, options) */
export interface CompositeChild {
  toolType: 'Ray' | 'VerticalLine' | 'Path' | 'TrendLine';
  points: FibPoint[];
  color: string;
  /** Niveau Fibonacci représenté (pour l'étiquette / le libellé) */
  ratio: number;
}

/** Conversions fournies par le graphique (API publique lightweight-charts) */
export interface FibConverters {
  priceToY: (price: number) => number | null;
  yToPrice: (y: number) => number | null;
  timeToX: (timestamp: number) => number | null;
  xToTime: (x: number) => number | null;
}

// ─── Niveaux ─────────────────────────────────────────────────────────────────

/** Ratios de retracement classiques */
export const FIB_RETRACEMENT_RATIOS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

/** Ratios de projection (au-delà du mouvement) */
export const FIB_EXTENSION_RATIOS = [0, 0.618, 1, 1.272, 1.618, 2, 2.618];

/** Ratios utilisés par l'éventail */
export const FIB_FAN_RATIOS = [0.236, 0.382, 0.5, 0.618, 0.786];

/** Ratios utilisés par les arcs */
export const FIB_ARC_RATIOS = [0.382, 0.5, 0.618];

/** Suite de Fibonacci pour les zones temporelles */
export const FIB_TIME_SEQUENCE = [1, 2, 3, 5, 8, 13, 21, 34, 55];

/** Couleur associée à chaque ratio (cohérente entre toutes les variantes) */
export const FIB_LEVEL_COLORS: Record<string, string> = {
  '0':     '#787b86',
  '0.236': '#f7931e',
  '0.382': '#e91e63',
  '0.5':   '#2196f3',
  '0.618': '#4caf50',
  '0.786': '#9c27b0',
  '1':     '#787b86',
  '1.272': '#ff5722',
  '1.414': '#795548',
  '1.618': '#009688',
  '2':     '#3f51b5',
  '2.618': '#8bc34a',
};

export const colorForRatio = (ratio: number): string =>
  FIB_LEVEL_COLORS[String(ratio)] ?? '#2962ff';

// ─── Éventail de Fibonacci ───────────────────────────────────────────────────

/**
 * Rayons partant du pivot A et passant par les divisions Fibonacci de
 * l'amplitude verticale mesurée à la date de B.
 */
export function buildFibFan(a: FibPoint, b: FibPoint, ratios = FIB_FAN_RATIOS): CompositeChild[] {
  const priceGap = b.price - a.price;
  const children: CompositeChild[] = [];

  // La droite A→B elle-même sert de repère (niveau 1)
  children.push({ toolType: 'Ray', points: [a, b], color: colorForRatio(1), ratio: 1 });

  for (const ratio of ratios) {
    children.push({
      toolType: 'Ray',
      points: [a, { timestamp: b.timestamp, price: a.price + priceGap * ratio }],
      color: colorForRatio(ratio),
      ratio,
    });
  }
  return children;
}

// ─── Zones temporelles ───────────────────────────────────────────────────────

/**
 * Lignes verticales placées aux multiples Fibonacci de l'intervalle A→B.
 * `sequence` compte en unités de (B.timestamp - A.timestamp).
 */
export function buildFibTimeZones(
  a: FibPoint,
  b: FibPoint,
  sequence = FIB_TIME_SEQUENCE,
): CompositeChild[] {
  const unit = b.timestamp - a.timestamp;
  if (unit === 0) return [];

  const children: CompositeChild[] = [
    { toolType: 'VerticalLine', points: [a], color: colorForRatio(0), ratio: 0 },
  ];

  for (const step of sequence) {
    children.push({
      toolType: 'VerticalLine',
      points: [{ timestamp: a.timestamp + unit * step, price: a.price }],
      color: colorForRatio(step === 1 ? 1 : 0.618),
      ratio: step,
    });
  }
  return children;
}

// ─── Arcs de Fibonacci ───────────────────────────────────────────────────────

/**
 * Demi-cercles centrés sur B, de rayons proportionnels à la distance A→B.
 * Le cercle est calculé en pixels (sinon il serait déformé par les unités
 * hétérogènes temps/prix) puis reconverti en points temps/prix ; il se déforme
 * donc au zoom, exactement comme sur les plateformes de trading.
 */
export function buildFibArcs(
  a: FibPoint,
  b: FibPoint,
  conv: FibConverters,
  ratios = FIB_ARC_RATIOS,
  samples = 28,
): CompositeChild[] {
  const xA = conv.timeToX(a.timestamp);
  const yA = conv.priceToY(a.price);
  const xB = conv.timeToX(b.timestamp);
  const yB = conv.priceToY(b.price);
  if (xA === null || yA === null || xB === null || yB === null) return [];

  const radius = Math.hypot(xB - xA, yB - yA);
  if (radius <= 0) return [];

  const children: CompositeChild[] = [];
  for (const ratio of ratios) {
    const r = radius * ratio;
    const points: FibPoint[] = [];

    // Demi-cercle ouvert vers la droite : de -90° à +90°
    for (let i = 0; i <= samples; i++) {
      const angle = -Math.PI / 2 + (Math.PI * i) / samples;
      const time = conv.xToTime(xB + r * Math.cos(angle));
      const price = conv.yToPrice(yB + r * Math.sin(angle));
      if (time === null || price === null) continue;
      points.push({ timestamp: time, price });
    }

    if (points.length >= 2) {
      children.push({ toolType: 'Path', points, color: colorForRatio(ratio), ratio });
    }
  }
  return children;
}

// ─── Aiguillage ──────────────────────────────────────────────────────────────

/** Types d'outils Fibonacci composites (construits à partir d'une ancre) */
export type FibCompositeType = 'FibFan' | 'FibTimeZones' | 'FibArcs';

export const FIB_COMPOSITE_TYPES: FibCompositeType[] = ['FibFan', 'FibTimeZones', 'FibArcs'];

export const isFibComposite = (type: string): type is FibCompositeType =>
  (FIB_COMPOSITE_TYPES as string[]).includes(type);

/** Construit les tracés enfants d'un composite à partir de ses 2 points d'ancrage */
export function buildComposite(
  type: FibCompositeType,
  points: FibPoint[],
  conv: FibConverters,
): CompositeChild[] {
  if (points.length < 2) return [];
  const [a, b] = points;
  switch (type) {
    case 'FibFan':       return buildFibFan(a, b);
    case 'FibTimeZones': return buildFibTimeZones(a, b);
    case 'FibArcs':      return buildFibArcs(a, b, conv);
    default:             return [];
  }
}

/** Options de tracé d'un enfant (les composites ne sont pas éditables un à un) */
export function childOptions(child: CompositeChild) {
  return {
    editable: false,
    line: {
      color: child.color,
      width: 1,
      style: child.ratio === 0 || child.ratio === 1 ? 0 : 2,
    },
  };
}
