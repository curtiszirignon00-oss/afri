// Couche 3 — systeme de scenarios. Trois jeux de drivers, trois projections
// completes, trois valorisations completes, puis une colonne ponderee par
// probabilites. Le WACC et le Ke sont volontairement communs aux trois : les
// scenarios isolent les drivers d'exploitation, le risque n'est porte qu'une
// fois, par le taux d'actualisation.

import {
  discountedCashFlow,
  dividendDiscountModel,
  invertedDcf,
  netAssetValue,
  synthesize,
  type DcfResult,
  type DdmResult,
  type DdmWeightBasis,
  type AncResult,
  type InvertedDcfResult,
  type SynthesisResult
} from './methods';
import { project, type ProjectionOverrides, type Projection, type ScenarioDrivers } from './projection';
import type { ScenarioId, ValuationWarning } from './types';

export const SCENARIO_IDS: ScenarioId[] = ['pessimistic', 'base', 'optimistic'];

export const SCENARIO_LABELS: Record<ScenarioId, string> = {
  pessimistic: 'Pessimiste',
  base: 'Base',
  optimistic: 'Optimiste'
};

export type ScenarioSet = Record<ScenarioId, ScenarioDrivers>;

export type ScenarioProbabilities = Record<ScenarioId, number>;

export type ScenarioOutcome = {
  scenario: ScenarioId;
  projection: Projection;
  dcf: DcfResult;
  ddm: DdmResult;
  anc: AncResult;
  synthesis: SynthesisResult;
  invertedDcf: InvertedDcfResult | null;
  warnings: ValuationWarning[];
};

/** Les valeurs par action que porte un scenario, pour la vue comparative. */
export type ScenarioValues = {
  dcf: number;
  ddmGordon: number;
  ddmTwoStage: number;
  anc: number;
  weighted: number;
};

export type ValuationEngineInput = {
  firstYear: number;
  horizon: number;
  /**
   * Date de valorisation : fin de cet exercice. Les flux posterieurs sont
   * actualises, celui de cet exercice est considere comme acquis.
   */
  valuationYear: number;

  lastRevenue: number;
  lastWorkingCapital: number;
  lastWorkingCapitalRatio: number;
  /** Capitaux propres totaux du dernier exercice publie (base de l'ANC a defaut de part du groupe). */
  lastEquity: number;
  /** Capitaux propres part du groupe : base preferee de l'ANC pour un groupe consolide. */
  lastEquityGroupShare?: number;
  /** Interets minoritaires, deduits du pont DCF. */
  minorityInterests?: number;
  fictitiousAssets?: number;

  taxRate: number;
  sharesOutstanding: number;
  netDebt: number;
  wacc: number;
  costOfEquity: number;

  scenarios: ScenarioSet;
  probabilities: ScenarioProbabilities;
  weights: { dcf: number; ddm: number; anc: number };
  ddmBasis?: DdmWeightBasis;
  /** Neutralise le DCF de la ponderation quand il est negatif. Defaut : true. */
  dropDcfWhenNegative?: boolean;
  price?: number | null;
  /** Overrides par scenario : une cellule forcee ne vaut que pour son scenario. */
  overrides?: Partial<Record<ScenarioId, ProjectionOverrides>>;
};

export type ValuationEngineResult = {
  outcomes: Record<ScenarioId, ScenarioOutcome>;
  /** Valeurs par action, par scenario. */
  values: Record<ScenarioId, ScenarioValues>;
  /** Esperance ponderee par les probabilites de scenario. */
  weightedValues: ScenarioValues;
  /** Fourchette min-max sur les trois scenarios, par methode (football field). */
  range: Record<keyof ScenarioValues, { min: number; max: number }>;
  price: number | null;
  /** Potentiel vs cours de la synthese, par scenario. */
  upside: Record<ScenarioId, number | null>;
  warnings: ValuationWarning[];
};

/** Evalue un seul scenario de bout en bout. */
export function runScenario(
  input: ValuationEngineInput,
  scenario: ScenarioId
): ScenarioOutcome {
  const drivers = input.scenarios[scenario];

  const projection = project({
    firstYear: input.firstYear,
    horizon: input.horizon,
    lastRevenue: input.lastRevenue,
    lastWorkingCapital: input.lastWorkingCapital,
    lastWorkingCapitalRatio: input.lastWorkingCapitalRatio,
    taxRate: input.taxRate,
    sharesOutstanding: input.sharesOutstanding,
    drivers,
    overrides: input.overrides?.[scenario]
  });

  const dcf = discountedCashFlow({
    years: projection.years,
    valuationYear: input.valuationYear,
    wacc: input.wacc,
    gTerminal: drivers.gTerminal,
    netDebt: input.netDebt,
    sharesOutstanding: input.sharesOutstanding,
    minorityInterests: input.minorityInterests
  });

  const ddm = dividendDiscountModel({
    years: projection.years,
    valuationYear: input.valuationYear,
    costOfEquity: input.costOfEquity,
    gTerminal: drivers.gTerminal
  });

  const anc = netAssetValue({
    // Part du groupe si disponible (exclut les minoritaires) : c'est l'actif net
    // revenant aux actionnaires de la maison mere. Sinon capitaux propres totaux.
    equity: input.lastEquityGroupShare ?? input.lastEquity,
    fictitiousAssets: input.fictitiousAssets,
    sharesOutstanding: input.sharesOutstanding,
    price: input.price
  });

  const synthesis = synthesize({
    dcfValuePerShare: dcf.valuePerShare,
    ddm,
    ancValuePerShare: anc.valuePerShare,
    weights: input.weights,
    ddmBasis: input.ddmBasis,
    dropDcfWhenNegative: input.dropDcfWhenNegative,
    price: input.price
  });

  const lastYear = projection.years[projection.years.length - 1];
  const inverted =
    typeof input.price === 'number' && input.price > 0
      ? invertedDcf({
          price: input.price,
          sharesOutstanding: input.sharesOutstanding,
          netDebt: input.netDebt,
          presentValueOfFlows: dcf.presentValueOfFlows,
          wacc: input.wacc,
          gTerminal: drivers.gTerminal,
          terminalPeriods: Math.max(1, lastYear.year - input.valuationYear),
          modelNormativeFlow: dcf.terminal.normativeFlow
        })
      : null;

  return {
    scenario,
    projection,
    dcf,
    ddm,
    anc,
    synthesis,
    invertedDcf: inverted,
    warnings: [...projection.warnings, ...dcf.warnings, ...ddm.warnings, ...synthesis.warnings]
  };
}

function valuesOf(o: ScenarioOutcome): ScenarioValues {
  return {
    dcf: o.dcf.valuePerShare,
    ddmGordon: o.ddm.gordonValuePerShare,
    ddmTwoStage: o.ddm.twoStageValuePerShare,
    anc: o.anc.valuePerShare,
    weighted: o.synthesis.valuePerShare
  };
}

const VALUE_KEYS: (keyof ScenarioValues)[] = ['dcf', 'ddmGordon', 'ddmTwoStage', 'anc', 'weighted'];

/**
 * Evalue les trois scenarios et agrege. Le garde-fou d'ordonnancement
 * (pessimiste < base < optimiste) est verifie sur la synthese : une inversion
 * signale des drivers mal calibres, pas necessairement une erreur de calcul.
 */
export function runValuation(input: ValuationEngineInput): ValuationEngineResult {
  const warnings: ValuationWarning[] = [];

  const probSum = SCENARIO_IDS.reduce((a, id) => a + input.probabilities[id], 0);
  if (probSum <= 0) throw new Error('Somme des probabilites de scenario nulle ou negative');
  if (Math.abs(probSum - 1) > 1e-6) {
    warnings.push({
      code: 'PROBABILITIES_NOT_NORMALISED',
      severity: 'warning',
      message: `Somme des probabilites = ${(probSum * 100).toFixed(1)} % : les probabilites ont ete normalisees a 100 %.`
    });
  }

  if (input.wacc <= 0) {
    warnings.push({ code: 'NON_POSITIVE_WACC', severity: 'error', message: 'WACC nul ou negatif.' });
  }

  const outcomes = {} as Record<ScenarioId, ScenarioOutcome>;
  const values = {} as Record<ScenarioId, ScenarioValues>;
  const upside = {} as Record<ScenarioId, number | null>;

  for (const id of SCENARIO_IDS) {
    const outcome = runScenario(input, id);
    outcomes[id] = outcome;
    values[id] = valuesOf(outcome);
    upside[id] = outcome.synthesis.upside;
    warnings.push(...outcome.warnings);
  }

  const weightedValues = {} as ScenarioValues;
  const range = {} as Record<keyof ScenarioValues, { min: number; max: number }>;
  for (const key of VALUE_KEYS) {
    const xs = SCENARIO_IDS.map((id) => values[id][key]);
    weightedValues[key] =
      SCENARIO_IDS.reduce((a, id) => a + values[id][key] * input.probabilities[id], 0) / probSum;
    range[key] = { min: Math.min(...xs), max: Math.max(...xs) };
  }

  if (!(values.pessimistic.weighted <= values.base.weighted && values.base.weighted <= values.optimistic.weighted)) {
    warnings.push({
      code: 'SCENARIOS_NOT_ORDERED',
      severity: 'warning',
      message:
        'Ordonnancement pessimiste < base < optimiste non respecte sur la synthese : ' +
        'au moins un driver joue en sens inverse de l intuition (souvent le BFR ou le capex).'
    });
  }

  // Dedoublonnage par code : les trois scenarios produisent la meme lecture avec des
  // chiffres differents, et la repeter trois fois dans un bandeau global n'apporte
  // rien. Le detail par scenario reste disponible dans outcomes[id].warnings.
  const seen = new Set<string>();
  const dedupedWarnings = warnings.filter((w) => {
    if (seen.has(w.code)) return false;
    seen.add(w.code);
    return true;
  });

  return {
    outcomes,
    values,
    weightedValues,
    range,
    price: input.price ?? null,
    upside,
    warnings: dedupedWarnings
  };
}

/** Les six drivers dont on mesure l'impact dans le tornado de sensibilite. */
export const SENSITIVITY_DRIVERS = [
  'revenueGrowthRest',
  'operatingMarginRest',
  'capexRatio',
  'workingCapitalRatioTarget',
  'wacc',
  'gTerminal'
] as const;

export type SensitivityDriver = (typeof SENSITIVITY_DRIVERS)[number];

export type SensitivityBar = {
  driver: SensitivityDriver;
  /** Amplitude du choc appliquee de part et d'autre du cas de base. */
  shock: number;
  /** Provenance du choc : ecart entre scenarios, ou defaut a defaut d'ecart. */
  shockSource: 'SCENARIO_SPREAD' | 'DEFAULT';
  /** Valeur DCF/action au driver abaisse et releve. */
  low: number;
  high: number;
  base: number;
  /** Amplitude absolue, qui classe le tornado. */
  swing: number;
};

/**
 * Amplitude de choc par driver. Un choc uniforme (1 point partout) ne compare rien :
 * 1 point sur g (2,5 % -> 3,5 %) est un mouvement de 40 % en relatif, 1 point sur un
 * ratio de BFR de 55 % en est un de 1,8 %. On dimensionne donc chaque choc sur la
 * demi-amplitude entre le scenario optimiste et le pessimiste — c'est-a-dire sur la
 * dispersion que l'utilisateur a lui-meme jugee plausible pour ce driver.
 */
export function shockFromScenarios(
  scenarios: ScenarioSet,
  driver: SensitivityDriver,
  fallback: number
): { shock: number; shockSource: 'SCENARIO_SPREAD' | 'DEFAULT' } {
  if (driver === 'wacc') return { shock: fallback, shockSource: 'DEFAULT' };
  const spread = Math.abs(scenarios.optimistic[driver] - scenarios.pessimistic[driver]) / 2;
  return spread > 0 ? { shock: spread, shockSource: 'SCENARIO_SPREAD' } : { shock: fallback, shockSource: 'DEFAULT' };
}

/**
 * Tornado de sensibilite : impact de chaque driver sur le prix DCF du cas de base,
 * a choc symetrique dimensionne par `shockFromScenarios`. Un choc peut violer le
 * garde-fou WACC > g : la barre est alors marquee non calculable plutot qu'ecartee
 * en silence.
 */
export function sensitivityTornado(
  input: ValuationEngineInput,
  shocks: Partial<Record<SensitivityDriver, number>> = {},
  defaultShock = 0.01
): SensitivityBar[] {
  const base = runScenario(input, 'base').dcf.valuePerShare;

  const evaluate = (driver: SensitivityDriver, delta: number): number => {
    if (driver === 'wacc') {
      return runScenario({ ...input, wacc: input.wacc + delta }, 'base').dcf.valuePerShare;
    }
    const drivers = input.scenarios.base;
    const shifted = { ...drivers, [driver]: drivers[driver] + delta } as ScenarioDrivers;
    return runScenario({ ...input, scenarios: { ...input.scenarios, base: shifted } }, 'base').dcf
      .valuePerShare;
  };

  return SENSITIVITY_DRIVERS.map((driver) => {
    const explicit = shocks[driver];
    const { shock, shockSource } =
      typeof explicit === 'number'
        ? { shock: explicit, shockSource: 'DEFAULT' as const }
        : shockFromScenarios(input.scenarios, driver, defaultShock);

    let low: number;
    let high: number;
    try {
      low = evaluate(driver, -shock);
    } catch {
      low = Number.NaN; // un choc peut violer WACC > g
    }
    try {
      high = evaluate(driver, shock);
    } catch {
      high = Number.NaN;
    }
    const swing = Number.isFinite(low) && Number.isFinite(high) ? Math.abs(high - low) : 0;
    return { driver, shock, shockSource, low, high, base, swing };
  }).sort((a, b) => b.swing - a.swing);
}
