import { describe, expect, it } from 'vitest';
import {
  averageUnleveredBeta,
  computeCostOfCapital,
  leverBeta,
  resolveGearing
} from '../cost-of-capital';
import type { CostOfCapitalInput, SectorBetaSheet } from '../types';

// Fiches Damodaran reellement fournies (Utility (Water), maj. 2026).
const SHEET_GLOBAL: SectorBetaSheet = {
  dataset: 'global',
  sector: 'Utility (Water)',
  betaUnlevered: 0.4191,
  betaUnleveredCashAdjusted: 0.4453,
  asOf: '2026-01-05'
};
const SHEET_EMERGING: SectorBetaSheet = {
  dataset: 'emerging',
  sector: 'Utility (Water)',
  betaUnlevered: 0.437,
  betaUnleveredCashAdjusted: 0.4729,
  asOf: '2026-01-05'
};
const SHEET_US: SectorBetaSheet = {
  dataset: 'us',
  sector: 'Utility (Water)',
  betaUnlevered: 0.2812,
  betaUnleveredCashAdjusted: 0.2825,
  asOf: '2026-01-05'
};

// SODECI : dette nette et capitaux propres au 31/12/2025 (millions FCFA).
const SODECI_NET_DEBT = 134473.46;
const SODECI_EQUITY = 19715.795;

function sodeciInput(overrides: Partial<CostOfCapitalInput> = {}): CostOfCapitalInput {
  return {
    riskFreeRate: 0.059,
    erp: 0.0821,
    crp: 0.0349,
    costOfDebt: 0.075,
    taxRate: 0.25,
    betaSource: 'BOTTOM_UP',
    sectorSheets: [SHEET_GLOBAL, SHEET_EMERGING],
    netDebt: SODECI_NET_DEBT,
    equity: SODECI_EQUITY,
    gearingTarget: 0.3,
    gearingMaxPlausible: 0.6,
    ...overrides
  };
}

describe('leverBeta — Hamada', () => {
  it('reendette au gearing cible de 30 %', () => {
    // 0,6384 x [1 + 0,75 x (0,3/0,7)] = 0,8436 — chaine du modele SODECI d'origine
    expect(leverBeta(0.6384, 0.25, 0.3)).toBeCloseTo(0.8436, 4);
  });

  it('laisse le beta inchange a gearing nul', () => {
    expect(leverBeta(0.5, 0.25, 0)).toBe(0.5);
  });

  it('refuse un gearing de 100 %', () => {
    expect(() => leverBeta(0.5, 0.25, 1)).toThrow(/inferieur a 1/);
  });
});

describe('averageUnleveredBeta', () => {
  it('moyenne les fiches global et emergente', () => {
    const { betaUnlevered, datasets } = averageUnleveredBeta([SHEET_GLOBAL, SHEET_EMERGING]);
    expect(betaUnlevered).toBeCloseTo(0.42805, 5);
    expect(datasets).toEqual(['global', 'emerging']);
  });

  it('moyenne les trois fiches', () => {
    expect(averageUnleveredBeta([SHEET_GLOBAL, SHEET_EMERGING, SHEET_US]).betaUnlevered).toBeCloseTo(
      0.37910,
      4
    );
  });

  it('refuse une liste vide', () => {
    expect(() => averageUnleveredBeta([])).toThrow(/Aucune fiche/);
  });
});

describe('resolveGearing', () => {
  it('retombe sur la cible quand le gearing observe est implausible (SODECI, 87 %)', () => {
    const r = resolveGearing(sodeciInput());
    expect(r.gearingObserved).toBeCloseTo(0.8721, 4);
    expect(r.gearing).toBe(0.3);
    expect(r.gearingOrigin).toBe('TARGET_FALLBACK_IMPLAUSIBLE');
    expect(r.warnings.map((w) => w.code)).toContain('GEARING_IMPLAUSIBLE');
  });

  it('retient le gearing observe quand il est plausible', () => {
    const r = resolveGearing(sodeciInput({ netDebt: 30000, equity: 70000 }));
    expect(r.gearing).toBeCloseTo(0.3, 10);
    expect(r.gearingOrigin).toBe('OBSERVED');
    expect(r.warnings).toHaveLength(0);
  });

  it('ramene le gearing a 0 pour une tresorerie nette positive (net cash)', () => {
    // SONATEL : dette nette negative -> pas de dette nette a financer.
    const r = resolveGearing(sodeciInput({ netDebt: -232929, equity: 1399263 }));
    expect(r.gearingObserved).toBeLessThan(0);
    expect(r.gearing).toBe(0);
    expect(r.gearingOrigin).toBe('NET_CASH_ZERO');
    expect(r.warnings.map((w) => w.code)).toContain('NET_CASH_GEARING_ZERO');
  });

  it('donne WACC = Ke pour une entreprise en net cash', () => {
    const r = computeCostOfCapital(
      sodeciInput({ netDebt: -232929, equity: 1399263, betaSource: 'MANUAL', betaUnleveredOverride: 0.6 })
    );
    expect(r.gearing).toBe(0);
    // beta_L = beta_u a gearing nul, et WACC = Ke.
    expect(r.betaLevered).toBeCloseTo(0.6, 10);
    expect(r.wacc).toBeCloseTo(r.costOfEquity, 10);
  });

  it('retombe sur la cible faute de donnees', () => {
    const r = resolveGearing(sodeciInput({ netDebt: undefined, equity: undefined }));
    expect(r.gearingOrigin).toBe('TARGET_FALLBACK_MISSING_DATA');
    expect(r.gearingObserved).toBeNull();
  });
});

describe('computeCostOfCapital — chaine complete', () => {
  it('reproduit la chaine du modele SODECI avec le beta desendette legacy 0,6384', () => {
    const r = computeCostOfCapital(sodeciInput({ betaSource: 'MANUAL', betaUnleveredOverride: 0.6384 }));
    expect(r.gearing).toBe(0.3); // 87 % observe -> repli sur la cible
    expect(r.totalPremium).toBeCloseTo(0.117, 6);
    expect(r.betaLevered).toBeCloseTo(0.8436, 4);
    expect(r.costOfEquity).toBeCloseTo(0.1577, 4);
    expect(r.costOfDebtAfterTax).toBeCloseTo(0.05625, 6);
    expect(r.wacc).toBeCloseTo(0.1273, 4);
  });

  it('produit le WACC de la moyenne Damodaran global + emergente', () => {
    const r = computeCostOfCapital(sodeciInput());
    expect(r.betaUnlevered).toBeCloseTo(0.42805, 5);
    expect(r.betaUnleveredFromSheets).toEqual(['global', 'emerging']);
    expect(r.betaLevered).toBeCloseTo(0.5656, 4);
    expect(r.costOfEquity).toBeCloseTo(0.1252, 4);
    expect(r.wacc).toBeCloseTo(0.1045, 4);
  });

  it('signale une regression inexploitable sans la retenir', () => {
    const r = computeCostOfCapital(
      sodeciInput({ regression: { beta: 0.4083, correlation: 0.1054, points: 1654 } })
    );
    const w = r.warnings.find((x) => x.code === 'REGRESSION_BETA_UNRELIABLE');
    expect(w?.severity).toBe('info');
    expect(r.betaLevered).toBeCloseTo(0.5656, 4); // le bottom-up reste retenu
  });

  it('escalade en erreur quand la regression inexploitable est justement celle retenue', () => {
    const r = computeCostOfCapital(
      sodeciInput({
        betaSource: 'REGRESSION',
        regression: { beta: 0.4083, correlation: 0.1054, points: 1654 }
      })
    );
    expect(r.betaUnlevered).toBeNull();
    expect(r.betaLevered).toBeCloseTo(0.4083, 4);
    expect(r.warnings.find((x) => x.code === 'REGRESSION_BETA_UNRELIABLE')?.severity).toBe('error');
  });

  it('WACC = Ke a gearing nul', () => {
    const r = computeCostOfCapital(
      sodeciInput({ netDebt: 0, equity: 100, gearingTarget: 0, gearingMaxPlausible: 0.6 })
    );
    expect(r.wacc).toBeCloseTo(r.costOfEquity, 10);
  });
});
