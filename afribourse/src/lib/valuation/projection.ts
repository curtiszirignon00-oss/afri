// Couche 3 — moteur de projection. Drivers x exercices -> FCFF et dividendes.
// Chaque driver a une valeur calculee par defaut et reste editable ; chaque valeur
// projetee peut etre forcee a la main, avec conservation de la valeur automatique.

import type { ValuationWarning } from './types';

/**
 * Jeu de drivers d'un scenario. Les drivers separent l'exercice ancre (le premier
 * projete, pilote par la derniere publication) des exercices suivants, projetes
 * en regime : c'est la distinction de la feuille "Hyp Scenarios".
 */
export type ScenarioDrivers = {
  /** Croissance du CA de l'exercice ancre. Defaut derive de l'ancrage T-1. */
  revenueGrowthFirst: number;
  /** Croissance du CA des exercices suivants. */
  revenueGrowthRest: number;
  /** Marge d'exploitation de l'exercice ancre. */
  operatingMarginFirst: number;
  /** Marge d'exploitation des exercices suivants. */
  operatingMarginRest: number;
  /** Dotations aux amortissements en % du CA. */
  depreciationRatio: number;
  /** Investissements en % du CA. */
  capexRatio: number;
  /**
   * Ratio BFR/CA cible. Le ratio converge lineairement depuis le dernier ratio
   * constate jusqu'a cette cible, puis y reste. C'est le driver majeur : a jours
   * de rotation stables le BFR croit au rythme du CA, et toute croissance non
   * maitrisee detruit de la valeur.
   */
  workingCapitalRatioTarget: number;
  /** Nombre d'exercices de convergence vers la cible de BFR. */
  workingCapitalConvergenceYears: number;
  /** Marge nette de l'exercice ancre. */
  netMarginFirst: number;
  /** Marge nette des exercices suivants. */
  netMarginRest: number;
  /** Taux de distribution du resultat. */
  payoutRatio: number;
  /** Croissance a l'infini. */
  gTerminal: number;
};

/** Une valeur projetee, forcable a la main. */
export type ProjectedValue = {
  value: number;
  /** Valeur issue du calcul automatique, conservee meme quand la valeur est forcee. */
  autoValue: number;
  forced: boolean;
};

/** Postes de la projection qui peuvent etre forces cellule par cellule. */
export const OVERRIDABLE_LINES = [
  'revenue',
  'operatingIncome',
  'depreciation',
  'capex',
  'workingCapital',
  'netIncome',
  'dividendPerShare'
] as const;

export type OverridableLine = (typeof OVERRIDABLE_LINES)[number];

/** Overrides utilisateur : ligne -> exercice -> valeur forcee. */
export type ProjectionOverrides = Partial<Record<OverridableLine, Record<number, number>>>;

export type ProjectedYear = {
  year: number;
  /** Rang de l'exercice dans la projection, 0 pour l'exercice ancre. */
  offset: number;
  revenue: ProjectedValue;
  revenueGrowth: number;
  operatingIncome: ProjectedValue;
  operatingMargin: number;
  tax: number;
  depreciation: ProjectedValue;
  capex: ProjectedValue;
  workingCapitalRatio: number;
  workingCapital: ProjectedValue;
  deltaWorkingCapital: number;
  /** FCFF = REX x (1 - IS) + amortissements - investissements - delta BFR. */
  fcff: number;
  netIncome: ProjectedValue;
  earningsPerShare: number;
  dividendPerShare: ProjectedValue;
};

export type ProjectionInput = {
  /** Premier exercice projete — celui qui porte l'ancrage T-1. */
  firstYear: number;
  /** Nombre d'exercices projetes. */
  horizon: number;
  /** Dernier CA publie, base de la croissance du premier exercice projete. */
  lastRevenue: number;
  /** Dernier BFR constate, point de depart de la convergence du ratio. */
  lastWorkingCapital: number;
  /** Dernier ratio BFR/CA constate. */
  lastWorkingCapitalRatio: number;
  taxRate: number;
  sharesOutstanding: number;
  drivers: ScenarioDrivers;
  overrides?: ProjectionOverrides;
};

export type Projection = {
  years: ProjectedYear[];
  warnings: ValuationWarning[];
};

function resolve(
  line: OverridableLine,
  year: number,
  autoValue: number,
  overrides: ProjectionOverrides | undefined
): ProjectedValue {
  const forcedValue = overrides?.[line]?.[year];
  if (typeof forcedValue === 'number' && Number.isFinite(forcedValue)) {
    return { value: forcedValue, autoValue, forced: true };
  }
  return { value: autoValue, autoValue, forced: false };
}

/**
 * Ratio BFR/CA de l'exercice de rang `offset` : convergence lineaire du dernier
 * ratio constate vers la cible sur `convergenceYears` exercices, puis maintien.
 * Une convergence nulle applique la cible des le premier exercice.
 */
export function workingCapitalRatioAt(
  offset: number,
  lastRatio: number,
  target: number,
  convergenceYears: number
): number {
  if (convergenceYears <= 0) return target;
  const step = Math.min(offset + 1, convergenceYears);
  return lastRatio + ((target - lastRatio) * step) / convergenceYears;
}

/**
 * Projette les exercices explicites. Le premier exercice utilise les drivers
 * "First" (il est pilote par la derniere publication), les suivants les drivers
 * "Rest". Toute valeur forcee se substitue au calcul mais laisse les exercices
 * suivants se recalculer a partir d'elle : la chaine reste coherente.
 */
export function project(input: ProjectionInput): Projection {
  const { firstYear, horizon, lastRevenue, lastWorkingCapital, taxRate, sharesOutstanding, drivers, overrides } =
    input;
  const warnings: ValuationWarning[] = [];

  if (horizon < 1) throw new Error('Horizon de projection nul');
  if (sharesOutstanding <= 0) throw new Error('Nombre d actions invalide');

  const years: ProjectedYear[] = [];
  let previousRevenue = lastRevenue;
  let previousWorkingCapital = lastWorkingCapital;

  for (let offset = 0; offset < horizon; offset += 1) {
    const year = firstYear + offset;
    const isFirst = offset === 0;

    const growth = isFirst ? drivers.revenueGrowthFirst : drivers.revenueGrowthRest;
    const margin = isFirst ? drivers.operatingMarginFirst : drivers.operatingMarginRest;
    const netMargin = isFirst ? drivers.netMarginFirst : drivers.netMarginRest;

    const revenue = resolve('revenue', year, previousRevenue * (1 + growth), overrides);
    const operatingIncome = resolve('operatingIncome', year, revenue.value * margin, overrides);
    const depreciation = resolve('depreciation', year, revenue.value * drivers.depreciationRatio, overrides);
    const capex = resolve('capex', year, revenue.value * drivers.capexRatio, overrides);

    const workingCapitalRatio = workingCapitalRatioAt(
      offset,
      input.lastWorkingCapitalRatio,
      drivers.workingCapitalRatioTarget,
      drivers.workingCapitalConvergenceYears
    );
    const workingCapital = resolve('workingCapital', year, revenue.value * workingCapitalRatio, overrides);
    const deltaWorkingCapital = workingCapital.value - previousWorkingCapital;

    // Impot plancher a zero : un resultat d'exploitation negatif ne genere pas de
    // remboursement d'impot immediat. Sans ce plancher, une perte d'exploitation
    // ajouterait du cash au FCFF (impot negatif). Neutre pour SODECI (REX positif),
    // indispensable pour un titre deficitaire ou un scenario pessimiste pousse.
    const tax = Math.max(0, operatingIncome.value) * taxRate;
    const fcff = operatingIncome.value - tax + depreciation.value - capex.value - deltaWorkingCapital;

    const netIncome = resolve('netIncome', year, revenue.value * netMargin, overrides);
    const earningsPerShare = netIncome.value / sharesOutstanding;
    const dividendPerShare = resolve(
      'dividendPerShare',
      year,
      earningsPerShare * drivers.payoutRatio,
      overrides
    );

    years.push({
      year,
      offset,
      revenue,
      revenueGrowth: previousRevenue === 0 ? 0 : revenue.value / previousRevenue - 1,
      operatingIncome,
      operatingMargin: revenue.value === 0 ? 0 : operatingIncome.value / revenue.value,
      tax,
      depreciation,
      capex,
      workingCapitalRatio: revenue.value === 0 ? workingCapitalRatio : workingCapital.value / revenue.value,
      workingCapital,
      deltaWorkingCapital,
      fcff,
      netIncome,
      earningsPerShare,
      dividendPerShare
    });

    previousRevenue = revenue.value;
    previousWorkingCapital = workingCapital.value;
  }

  // Alerte de lecture : c'est le diagnostic central du cas SODECI.
  const last = years[years.length - 1];
  if (last.deltaWorkingCapital > 0) {
    const cashBeforeWc = last.operatingIncome.value - last.tax + last.depreciation.value - last.capex.value;
    if (cashBeforeWc > 0 && last.deltaWorkingCapital / cashBeforeWc > 0.7) {
      warnings.push({
        code: 'WC_ABSORBS_CASH_FLOW',
        severity: 'warning',
        message:
          `A l'exercice terminal, la variation de BFR absorbe ` +
          `${((last.deltaWorkingCapital / cashBeforeWc) * 100).toFixed(0)} % de la capacite ` +
          `d'autofinancement : la croissance detruit de la valeur tant que le BFR n'est pas maitrise.`
      });
    }
  }

  if (years.some((y) => y.fcff < 0)) {
    warnings.push({
      code: 'NEGATIVE_FCFF',
      severity: 'info',
      message: 'Un ou plusieurs flux de tresorerie disponibles projetes sont negatifs.'
    });
  }

  return { years, warnings };
}

/**
 * Valeurs par defaut des drivers, calibrees sur l'historique publie. Chacune reste
 * editable : c'est le point de depart, pas une contrainte.
 */
export function defaultDrivers(calibration: {
  /** Croissance du premier exercice derivee de l'ancrage T-1. */
  anchorDerivedGrowth: number | null;
  /** TCAM du CA sur la fenetre retenue. */
  revenueCagr: number | null;
  medianOperatingMargin: number | null;
  medianDepreciationRatio: number | null;
  medianCapexRatio: number | null;
  medianWorkingCapitalRatio: number | null;
  medianNetMargin: number | null;
  medianPayoutRatio: number | null;
  gTerminal: number;
}): ScenarioDrivers {
  const growthRest = calibration.revenueCagr ?? 0;
  return {
    revenueGrowthFirst: calibration.anchorDerivedGrowth ?? growthRest,
    revenueGrowthRest: growthRest,
    operatingMarginFirst: calibration.medianOperatingMargin ?? 0,
    operatingMarginRest: calibration.medianOperatingMargin ?? 0,
    depreciationRatio: calibration.medianDepreciationRatio ?? 0,
    capexRatio: calibration.medianCapexRatio ?? 0,
    workingCapitalRatioTarget: calibration.medianWorkingCapitalRatio ?? 0,
    workingCapitalConvergenceYears: 4,
    netMarginFirst: calibration.medianNetMargin ?? 0,
    netMarginRest: calibration.medianNetMargin ?? 0,
    payoutRatio: calibration.medianPayoutRatio ?? 0,
    gTerminal: calibration.gTerminal
  };
}
