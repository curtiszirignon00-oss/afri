// Couche 2 — cout de la dette. Symetrique du cout des fonds propres : au lieu d'un
// taux en dur, on le derive d'un rating synthetique fonde sur la couverture des
// interets (REX / charges d'interets), via une table de spreads Damodaran.
//
//   Kd avant impot (synthetique) = Rf + spread de defaut de l'emetteur
//   Kd effectif (controle)       = charges d'interets / dette brute
//
// Le synthetique (prospectif) est retenu ; l'effectif sert de garde-fou.

/** Une tranche de la table rating -> spread, bornee par une couverture minimale. */
export type RatingBand = { minCoverage: number; rating: string; spread: number };

/**
 * Table Damodaran (grandes capitalisations) couverture des interets -> notation ->
 * spread de defaut. Triee par couverture decroissante. Overridable.
 */
export const DAMODARAN_SPREAD_TABLE: RatingBand[] = [
  { minCoverage: 8.5, rating: 'Aaa/AAA', spread: 0.0069 },
  { minCoverage: 6.5, rating: 'Aa2/AA', spread: 0.0085 },
  { minCoverage: 5.5, rating: 'A1/A+', spread: 0.0107 },
  { minCoverage: 4.25, rating: 'A2/A', spread: 0.0118 },
  { minCoverage: 3.0, rating: 'A3/A-', spread: 0.0133 },
  { minCoverage: 2.5, rating: 'Baa2/BBB', spread: 0.0171 },
  { minCoverage: 2.25, rating: 'Ba1/BB+', spread: 0.0231 },
  { minCoverage: 2.0, rating: 'Ba2/BB', spread: 0.0277 },
  { minCoverage: 1.75, rating: 'B1/B+', spread: 0.0397 },
  { minCoverage: 1.5, rating: 'B2/B', spread: 0.0451 },
  { minCoverage: 1.25, rating: 'B3/B-', spread: 0.0517 },
  { minCoverage: 0.8, rating: 'Caa/CCC', spread: 0.0864 },
  { minCoverage: 0.65, rating: 'Ca/CC', spread: 0.1033 },
  { minCoverage: 0.2, rating: 'C/C', spread: 0.1249 },
  { minCoverage: -Infinity, rating: 'D', spread: 0.1902 }
];

/** Notation et spread synthetiques pour une couverture d'interets donnee. */
export function syntheticRating(
  interestCoverage: number,
  table: RatingBand[] = DAMODARAN_SPREAD_TABLE
): { rating: string; spread: number } {
  for (const band of table) {
    if (interestCoverage >= band.minCoverage) return { rating: band.rating, spread: band.spread };
  }
  const last = table[table.length - 1];
  return { rating: last.rating, spread: last.spread };
}

export type CostOfDebtInput = {
  riskFreeRate: number;
  taxRate: number;
  /** Resultat d'exploitation (EBIT) du dernier exercice. */
  ebit?: number | null;
  /** Charges d'interets brutes du dernier exercice. */
  interestExpense?: number | null;
  /** Dette brute porteuse d'interets. */
  grossDebt?: number | null;
  /** Kd avant impot de repli quand la couverture n'est pas calculable. */
  fallbackPreTax: number;
  spreadTable?: RatingBand[];
};

export type CostOfDebtResult = {
  interestCoverage: number | null;
  rating: string | null;
  spread: number | null;
  /** Kd avant impot synthetique = Rf + spread. */
  syntheticPreTax: number | null;
  /** Kd avant impot effectif = charges d'interets / dette brute (controle). */
  effectivePreTax: number | null;
  /** Kd avant impot retenu : synthetique si calculable, sinon repli. */
  retainedPreTax: number;
  /** Kd apres impot, injecte dans le WACC. */
  afterTax: number;
  /** Origine du Kd retenu. */
  source: 'SYNTHETIC' | 'FALLBACK';
};

/**
 * Derive le cout de la dette. Le rating synthetique demande le REX et les charges
 * d'interets (couverture = REX / interets) ; a defaut on retombe sur le Kd de repli.
 */
export function analyzeCostOfDebt(input: CostOfDebtInput): CostOfDebtResult {
  const { riskFreeRate, taxRate, ebit, interestExpense, grossDebt, fallbackPreTax, spreadTable } = input;

  const hasCoverage =
    typeof ebit === 'number' &&
    typeof interestExpense === 'number' &&
    Number.isFinite(ebit) &&
    Number.isFinite(interestExpense) &&
    interestExpense > 0;

  const interestCoverage = hasCoverage ? ebit! / interestExpense! : null;
  const rated = interestCoverage !== null ? syntheticRating(interestCoverage, spreadTable) : null;
  const syntheticPreTax = rated ? riskFreeRate + rated.spread : null;

  const effectivePreTax =
    typeof interestExpense === 'number' &&
    typeof grossDebt === 'number' &&
    Number.isFinite(interestExpense) &&
    Number.isFinite(grossDebt) &&
    grossDebt > 0
      ? interestExpense / grossDebt
      : null;

  const retainedPreTax = syntheticPreTax ?? fallbackPreTax;

  return {
    interestCoverage,
    rating: rated?.rating ?? null,
    spread: rated?.spread ?? null,
    syntheticPreTax,
    effectivePreTax,
    retainedPreTax,
    afterTax: retainedPreTax * (1 - taxRate),
    source: syntheticPreTax !== null ? 'SYNTHETIC' : 'FALLBACK'
  };
}
