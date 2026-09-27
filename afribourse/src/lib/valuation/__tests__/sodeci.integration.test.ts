// Test d'integration : la chaine complete sur SODECI, des etats financiers saisis
// jusqu'aux trois scenarios. Il ne cherche pas a reproduire un classeur Excel — les
// quatre versions du modele divergent entre elles — mais verifie que la mecanique
// est coherente de bout en bout et que le diagnostic economique du titre ressort.

import { describe, expect, it } from 'vitest';
import { computeCostOfCapital } from '../cost-of-capital';
import { applyDeltas, calibrateDrivers } from '../index';
import { project, workingCapitalRatioAt } from '../projection';
import { runValuation, sensitivityTornado, type ValuationEngineInput } from '../scenarios';
import type { CostOfCapitalInput } from '../types';
import { SODECI_STATEMENTS } from './fixtures/sodeci';

const TAX_RATE = 0.25;
const SHARES = 9; // millions de titres, coherent avec les montants en millions de FCFA
const NET_DEBT = 134473.46;
const LAST_EQUITY = 19715.795;
const PRICE = 12100;
const G_TERMINAL = 0.025;

const COST_OF_CAPITAL: CostOfCapitalInput = {
  riskFreeRate: 0.059,
  erp: 0.0821,
  crp: 0.0349,
  costOfDebt: 0.075,
  taxRate: TAX_RATE,
  betaSource: 'BOTTOM_UP',
  sectorSheets: [
    { dataset: 'global', sector: 'Utility (Water)', betaUnlevered: 0.4191, asOf: '2026-01-05' },
    { dataset: 'emerging', sector: 'Utility (Water)', betaUnlevered: 0.437, asOf: '2026-01-05' }
  ],
  regression: { beta: 0.4083, correlation: 0.1054, points: 1654 },
  netDebt: NET_DEBT,
  equity: LAST_EQUITY,
  gearingTarget: 0.3,
  gearingMaxPlausible: 0.6
};

const capital = computeCostOfCapital(COST_OF_CAPITAL);

const calibration = calibrateDrivers({
  statements: SODECI_STATEMENTS,
  taxRate: TAX_RATE,
  firstProjectedYear: 2026,
  gTerminal: G_TERMINAL,
  lookback: 5,
  cagrWindow: 5
});

function engineInput(overrides: Partial<ValuationEngineInput> = {}): ValuationEngineInput {
  const base = calibration.drivers;
  return {
    firstYear: 2026,
    horizon: 6, // 2026-2031
    valuationYear: 2026,
    lastRevenue: 189429.713,
    lastWorkingCapital: 104748.089,
    lastWorkingCapitalRatio: 0.553,
    lastEquity: LAST_EQUITY,
    taxRate: TAX_RATE,
    sharesOutstanding: SHARES,
    netDebt: NET_DEBT,
    wacc: capital.wacc,
    costOfEquity: capital.costOfEquity,
    scenarios: {
      pessimistic: applyDeltas(base, {
        revenueGrowthRest: -0.02,
        operatingMarginRest: -0.01,
        capexRatio: 0.01,
        workingCapitalRatioTarget: 0.1,
        netMarginRest: -0.005,
        gTerminal: -0.005
      }),
      base,
      optimistic: applyDeltas(base, {
        revenueGrowthRest: 0.02,
        operatingMarginRest: 0.01,
        capexRatio: -0.01,
        workingCapitalRatioTarget: -0.1,
        netMarginRest: 0.005,
        gTerminal: 0.005
      })
    },
    probabilities: { pessimistic: 0.25, base: 0.5, optimistic: 0.25 },
    weights: { dcf: 0.5, ddm: 0.25, anc: 0.25 },
    ddmBasis: 'TWO_STAGE',
    price: PRICE,
    ...overrides
  };
}

describe('calibrateDrivers sur SODECI', () => {
  it('calibre les drivers sur les medianes 5 ans', () => {
    const d = calibration.drivers;
    // Medianes des exercices 2021-2025, et non les valeurs du seul exercice 2025.
    expect(d.operatingMarginRest).toBeCloseTo(0.04959, 5);
    expect(d.capexRatio).toBeCloseTo(0.08476, 5);
    expect(d.workingCapitalRatioTarget).toBeCloseTo(0.55297, 5);
    expect(d.netMarginRest).toBeCloseTo(0.02795, 5);
    expect(d.payoutRatio).toBeCloseTo(0.9926, 4);
    expect(d.gTerminal).toBe(G_TERMINAL);
  });

  it('derive la croissance du premier exercice de l ancrage T-1', () => {
    // CA 2026 ancre 186 904,88 contre 189 429,713 publie : -1,33 %.
    expect(calibration.anchorDerivedGrowth).toBeCloseTo(-0.01333, 4);
    expect(calibration.drivers.revenueGrowthFirst).toBe(calibration.anchorDerivedGrowth);
  });

  it('calibre la croissance de regime sur le TCAM 5 ans', () => {
    expect(calibration.revenueCagr).toBeCloseTo(0.0824, 4);
    expect(calibration.drivers.revenueGrowthRest).toBe(calibration.revenueCagr);
  });

  it('expose les 12 exercices historiques', () => {
    expect(calibration.history).toHaveLength(12);
  });
});

describe('projection SODECI', () => {
  const input = engineInput();
  const { years, warnings } = project({
    firstYear: input.firstYear,
    horizon: input.horizon,
    lastRevenue: input.lastRevenue,
    lastWorkingCapital: input.lastWorkingCapital,
    lastWorkingCapitalRatio: input.lastWorkingCapitalRatio,
    taxRate: TAX_RATE,
    sharesOutstanding: SHARES,
    drivers: input.scenarios.base
  });

  it('projette six exercices 2026-2031', () => {
    expect(years.map((y) => y.year)).toEqual([2026, 2027, 2028, 2029, 2030, 2031]);
  });

  it('ancre le CA 2026 sur la publication T1', () => {
    expect(years[0].revenue.value).toBeCloseTo(186904.88, 1);
  });

  it('enchaine le CA au taux de regime apres le premier exercice', () => {
    expect(years[1].revenue.value).toBeCloseTo(years[0].revenue.value * (1 + calibration.revenueCagr!), 6);
  });

  it('respecte l identite du FCFF', () => {
    for (const y of years) {
      const expected =
        y.operatingIncome.value * (1 - TAX_RATE) +
        y.depreciation.value -
        y.capex.value -
        y.deltaWorkingCapital;
      expect(y.fcff).toBeCloseTo(expected, 8);
    }
  });

  it('maintient le ratio de BFR a la cible apres convergence', () => {
    // Cible egale au dernier ratio constate : le ratio doit rester plat.
    expect(years[5].workingCapitalRatio).toBeCloseTo(input.scenarios.base.workingCapitalRatioTarget, 6);
  });

  it('alerte que le BFR absorbe la capacite d autofinancement', () => {
    expect(warnings.map((w) => w.code)).toContain('WC_ABSORBS_CASH_FLOW');
  });

  it('derive le dividende du resultat et du payout', () => {
    const y = years[2];
    expect(y.earningsPerShare).toBeCloseTo(y.netIncome.value / SHARES, 8);
    expect(y.dividendPerShare.value).toBeCloseTo(
      y.earningsPerShare * input.scenarios.base.payoutRatio,
      8
    );
  });
});

describe('plancher d impot sur les pertes d exploitation', () => {
  // Drivers minimaux forçant un REX negatif : marge d'exploitation negative.
  const lossDrivers = {
    revenueGrowthFirst: 0,
    revenueGrowthRest: 0,
    operatingMarginFirst: -0.1,
    operatingMarginRest: -0.1,
    depreciationRatio: 0,
    capexRatio: 0,
    workingCapitalRatioTarget: 0,
    workingCapitalConvergenceYears: 0,
    netMarginFirst: -0.1,
    netMarginRest: -0.1,
    payoutRatio: 0,
    gTerminal: 0.02
  };

  it('n applique aucun impot quand le resultat d exploitation est negatif', () => {
    const { years } = project({
      firstYear: 2026,
      horizon: 1,
      lastRevenue: 1000,
      lastWorkingCapital: 0,
      lastWorkingCapitalRatio: 0,
      taxRate: 0.25,
      sharesOutstanding: 1,
      drivers: lossDrivers
    });
    const y = years[0];
    expect(y.operatingIncome.value).toBeLessThan(0);
    expect(y.tax).toBe(0); // pas de remboursement d'impot
    // FCFF = REX - 0 + 0 - 0 - 0 = REX, sans gonflement par un impot negatif.
    expect(y.fcff).toBeCloseTo(y.operatingIncome.value, 8);
  });

  it('applique l impot normalement quand le resultat est positif', () => {
    const { years } = project({
      firstYear: 2026,
      horizon: 1,
      lastRevenue: 1000,
      lastWorkingCapital: 0,
      lastWorkingCapitalRatio: 0,
      taxRate: 0.25,
      sharesOutstanding: 1,
      drivers: { ...lossDrivers, operatingMarginFirst: 0.1 }
    });
    expect(years[0].tax).toBeCloseTo(years[0].operatingIncome.value * 0.25, 8);
  });
});

describe('workingCapitalRatioAt — convergence', () => {
  it('converge lineairement puis se maintient', () => {
    // 0,553 -> 0,467 sur 4 exercices, puis plat.
    expect(workingCapitalRatioAt(0, 0.553, 0.467, 4)).toBeCloseTo(0.5315, 4);
    expect(workingCapitalRatioAt(1, 0.553, 0.467, 4)).toBeCloseTo(0.51, 4);
    expect(workingCapitalRatioAt(2, 0.553, 0.467, 4)).toBeCloseTo(0.4885, 4);
    expect(workingCapitalRatioAt(3, 0.553, 0.467, 4)).toBeCloseTo(0.467, 4);
    expect(workingCapitalRatioAt(5, 0.553, 0.467, 4)).toBeCloseTo(0.467, 4);
  });

  it('applique la cible immediatement a convergence nulle', () => {
    expect(workingCapitalRatioAt(0, 0.553, 0.467, 0)).toBe(0.467);
  });
});

describe('overrides de projection', () => {
  it('force une cellule et propage sur les exercices suivants', () => {
    const input = engineInput();
    const common = {
      firstYear: input.firstYear,
      horizon: input.horizon,
      lastRevenue: input.lastRevenue,
      lastWorkingCapital: input.lastWorkingCapital,
      lastWorkingCapitalRatio: input.lastWorkingCapitalRatio,
      taxRate: TAX_RATE,
      sharesOutstanding: SHARES,
      drivers: input.scenarios.base
    };
    const plain = project(common);
    const forced = project({ ...common, overrides: { revenue: { 2026: 200000 } } });

    expect(forced.years[0].revenue.value).toBe(200000);
    expect(forced.years[0].revenue.forced).toBe(true);
    // La valeur automatique reste visible pour la tracabilite.
    expect(forced.years[0].revenue.autoValue).toBeCloseTo(plain.years[0].revenue.value, 8);
    // L'exercice suivant se recalcule depuis la valeur forcee.
    expect(forced.years[1].revenue.value).toBeGreaterThan(plain.years[1].revenue.value);
    expect(forced.years[1].revenue.forced).toBe(false);
  });
});

describe('runValuation — trois scenarios', () => {
  const result = runValuation(engineInput());

  it('produit les trois scenarios et la colonne ponderee', () => {
    expect(Object.keys(result.outcomes).sort()).toEqual(['base', 'optimistic', 'pessimistic']);
    const manual =
      result.values.pessimistic.weighted * 0.25 +
      result.values.base.weighted * 0.5 +
      result.values.optimistic.weighted * 0.25;
    expect(result.weightedValues.weighted).toBeCloseTo(manual, 8);
  });

  it('ordonne pessimiste < base < optimiste', () => {
    expect(result.values.pessimistic.weighted).toBeLessThan(result.values.base.weighted);
    expect(result.values.base.weighted).toBeLessThan(result.values.optimistic.weighted);
    expect(result.warnings.map((w) => w.code)).not.toContain('SCENARIOS_NOT_ORDERED');
  });

  it('expose la fourchette min-max par methode', () => {
    for (const key of ['dcf', 'ddmGordon', 'ddmTwoStage', 'weighted'] as const) {
      expect(result.range[key].min).toBeLessThanOrEqual(result.range[key].max);
    }
    // L'ANC ne depend d'aucun driver : sa fourchette est plate.
    expect(result.range.anc.min).toBeCloseTo(result.range.anc.max, 8);
  });

  it('fait ressortir un DCF negatif — la dette nette n est pas couverte', () => {
    expect(result.values.base.dcf).toBeLessThan(0);
    expect(result.outcomes.base.dcf.enterpriseValue).toBeLessThan(NET_DEBT);
    expect(result.warnings.map((w) => w.code)).toContain('NEGATIVE_EQUITY_VALUE');
  });

  it('garde le DDM positif — le dividende est verse quel que soit le BFR', () => {
    expect(result.values.base.ddmGordon).toBeGreaterThan(0);
    expect(result.values.base.ddmTwoStage).toBeGreaterThan(0);
  });

  it('utilise le meme WACC et le meme Ke dans les trois scenarios', () => {
    // Le risque est porte une seule fois, par le taux : seuls les drivers changent.
    const ancs = (['pessimistic', 'base', 'optimistic'] as const).map((id) => result.values[id].anc);
    expect(new Set(ancs).size).toBe(1);
  });

  it('calcule le potentiel vs cours par scenario', () => {
    expect(result.price).toBe(PRICE);
    expect(result.upside.base).toBeCloseTo(result.values.base.weighted / PRICE - 1, 8);
  });

  it('produit le DCF inverse du cas de base', () => {
    const inv = result.outcomes.base.invertedDcf!;
    expect(inv.impliedMarketCap).toBeCloseTo(PRICE * SHARES, 6);
    // Le cours suppose un flux normatif tres superieur a celui du modele.
    expect(inv.requiredNormativeFlow).toBeGreaterThan(inv.modelNormativeFlow);
  });

  it('normalise des probabilites qui ne somment pas a 1', () => {
    const r = runValuation(engineInput({ probabilities: { pessimistic: 1, base: 1, optimistic: 1 } }));
    expect(r.warnings.map((w) => w.code)).toContain('PROBABILITIES_NOT_NORMALISED');
    const simpleMean =
      (r.values.pessimistic.weighted + r.values.base.weighted + r.values.optimistic.weighted) / 3;
    expect(r.weightedValues.weighted).toBeCloseTo(simpleMean, 8);
  });

  it('isole les overrides par scenario', () => {
    const r = runValuation(engineInput({ overrides: { base: { revenue: { 2026: 250000 } } } }));
    expect(r.outcomes.base.projection.years[0].revenue.value).toBe(250000);
    expect(r.outcomes.pessimistic.projection.years[0].revenue.forced).toBe(false);
  });
});

describe('sensitivityTornado', () => {
  const bars = sensitivityTornado(engineInput());

  it('classe les six drivers par amplitude decroissante', () => {
    expect(bars).toHaveLength(6);
    for (let i = 1; i < bars.length; i += 1) {
      expect(bars[i - 1].swing).toBeGreaterThanOrEqual(bars[i].swing);
    }
  });

  it('dimensionne les chocs sur l ecart entre scenarios', () => {
    const byDriver = new Map(bars.map((b) => [b.driver, b]));
    // BFR : +/- 10 points de ratio, contre +/- 0,5 point sur g.
    expect(byDriver.get('workingCapitalRatioTarget')!.shock).toBeCloseTo(0.1, 6);
    expect(byDriver.get('workingCapitalRatioTarget')!.shockSource).toBe('SCENARIO_SPREAD');
    expect(byDriver.get('gTerminal')!.shock).toBeCloseTo(0.005, 6);
    // Le WACC ne varie pas entre scenarios : il retombe sur le choc par defaut.
    expect(byDriver.get('wacc')!.shockSource).toBe('DEFAULT');
    expect(byDriver.get('wacc')!.shock).toBeCloseTo(0.01, 6);
  });

  it('classe BFR > croissance > capex > marge >> WACC >> g', () => {
    expect(bars.map((b) => b.driver)).toEqual([
      'workingCapitalRatioTarget',
      'revenueGrowthRest',
      'capexRatio',
      'operatingMarginRest',
      'wacc',
      'gTerminal'
    ]);
    // Le BFR et la croissance pesent un ordre de grandeur de plus que g.
    expect(bars[0].swing / bars[5].swing).toBeGreaterThan(10);
  });

  it('honore un choc explicite', () => {
    const custom = sensitivityTornado(engineInput(), { gTerminal: 0.002 });
    expect(custom.find((b) => b.driver === 'gTerminal')!.shock).toBeCloseTo(0.002, 6);
  });

  it('mesure un impact non nul sur chaque driver', () => {
    for (const b of bars) expect(b.swing).toBeGreaterThan(0);
  });
});
