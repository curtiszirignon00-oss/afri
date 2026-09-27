// Point d'entree du moteur de valorisation fondamentale.
//
// Les trois couches restent separees et ne se dupliquent jamais :
//   1. historicals.ts  — faits publies et retraitements
//   2. cost-of-capital.ts — hypotheses derivees (Rf, primes, beta, gearing, WACC, Ke)
//   3. projection.ts / methods.ts / scenarios.ts — projections et valorisations
//
// Passer de la Phase 1 (saisie manuelle) a la Phase 2 (collecte automatique des
// series macro) ne touche que les couches 1 et 2.

export * from './types';
export * from './historicals';
export * from './cost-of-capital';
export * from './projection';
export * from './methods';
export * from './scenarios';

import { computeCostOfCapital } from './cost-of-capital';
import {
  anchorCurrentYear,
  buildHistoricalSeries,
  cagr,
  median,
  type HistoricalYear,
  type SeasonalityStat,
  type Statement
} from './historicals';
import { defaultDrivers, type ScenarioDrivers } from './projection';
import type { CostOfCapitalInput } from './types';

/**
 * Calibration des drivers sur l'historique publie. La mediane est preferee a la
 * moyenne sur les ratios : les exercices SODECI comportent des a-coups (reprise
 * de BFR de 2024, pic de creances de 2025) qu'une moyenne laisserait passer dans
 * le regime de croisiere.
 */
export function calibrateDrivers(params: {
  statements: Statement[];
  taxRate: number;
  firstProjectedYear: number;
  gTerminal: number;
  /** Nombre d'exercices recents servant a la mediane des ratios. */
  lookback?: number;
  /** Fenetre de TCAM pour la croissance de regime. */
  cagrWindow?: number;
  seasonalityStat?: SeasonalityStat;
  anchorWeight?: number;
}): {
  drivers: ScenarioDrivers;
  history: HistoricalYear[];
  anchorDerivedGrowth: number | null;
  revenueCagr: number | null;
} {
  const {
    statements,
    taxRate,
    firstProjectedYear,
    gTerminal,
    lookback = 5,
    cagrWindow = 5,
    seasonalityStat = 'MEAN',
    anchorWeight = 1
  } = params;

  const history = buildHistoricalSeries(statements, taxRate);
  const recent = history.slice(-lookback);
  const med = (pick: (y: HistoricalYear) => number | null) =>
    median(recent.map(pick).filter((x): x is number => x !== null));

  const lastPublished = history[history.length - 1];

  // Croissance du premier exercice projete : deduite de l'ancrage T-1 quand une
  // publication infra-annuelle existe, sinon du TCAM.
  const anchor = anchorCurrentYear(statements, 'revenue', {
    year: firstProjectedYear,
    stat: seasonalityStat,
    anchorWeight,
    trendWindow: cagrWindow
  });
  const anchorDerivedGrowth =
    anchor.value !== null && lastPublished?.revenue ? anchor.value / lastPublished.revenue - 1 : null;

  const revenueSeries = history
    .slice(-(cagrWindow + 1))
    .map((y) => y.revenue)
    .filter((v): v is number => v !== null);
  const revenueCagr = cagr(revenueSeries);

  const drivers = defaultDrivers({
    anchorDerivedGrowth,
    revenueCagr,
    medianOperatingMargin: med((y) => y.operatingMargin),
    medianDepreciationRatio: med((y) => y.depreciationRatio),
    medianCapexRatio: med((y) => y.capexRatio),
    medianWorkingCapitalRatio: med((y) => y.workingCapitalRatio),
    medianNetMargin: med((y) => y.netMargin),
    medianPayoutRatio: med((y) => y.payoutRatio),
    gTerminal
  });

  return { drivers, history, anchorDerivedGrowth, revenueCagr };
}

/**
 * Construit les trois jeux de drivers a partir du cas de base et d'un jeu de
 * deltas. Le cas de base a tous ses deltas a zero — c'est la mecanique de la
 * feuille "Leviers". Les deltas sont exprimes en points de ratio, sauf la
 * croissance ou ils s'ajoutent au taux.
 */
export type DriverDeltas = Partial<
  Pick<
    ScenarioDrivers,
    | 'revenueGrowthFirst'
    | 'revenueGrowthRest'
    | 'operatingMarginFirst'
    | 'operatingMarginRest'
    | 'depreciationRatio'
    | 'capexRatio'
    | 'workingCapitalRatioTarget'
    | 'netMarginFirst'
    | 'netMarginRest'
    | 'payoutRatio'
    | 'gTerminal'
  >
>;

export function applyDeltas(base: ScenarioDrivers, deltas: DriverDeltas): ScenarioDrivers {
  const out = { ...base };
  for (const [key, delta] of Object.entries(deltas) as [keyof DriverDeltas, number][]) {
    if (typeof delta === 'number' && Number.isFinite(delta)) {
      out[key] = base[key] + delta;
    }
  }
  return out;
}

/** Cout du capital, re-exporte au niveau du point d'entree pour l'UI. */
export function assumptionsToCostOfCapital(input: CostOfCapitalInput) {
  return computeCostOfCapital(input);
}
