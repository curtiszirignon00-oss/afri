import { describe, expect, it } from 'vitest';
import { analyzeCostOfDebt, syntheticRating } from '../cost-of-debt';

describe('syntheticRating', () => {
  it('note AAA une couverture tres elevee', () => {
    const r = syntheticRating(60);
    expect(r.rating).toBe('Aaa/AAA');
    expect(r.spread).toBeCloseTo(0.0069, 6);
  });

  it('degrade la note quand la couverture baisse', () => {
    expect(syntheticRating(3).rating).toBe('A3/A-');
    expect(syntheticRating(2).rating).toBe('Ba2/BB');
    expect(syntheticRating(1).rating).toBe('Caa/CCC');
  });

  it('note D une couverture negative (pertes)', () => {
    expect(syntheticRating(-1).rating).toBe('D');
    expect(syntheticRating(-1).spread).toBeCloseTo(0.1902, 6);
  });
});

describe('analyzeCostOfDebt', () => {
  it('derive Kd synthetique = Rf + spread, avec le taux effectif en controle (SONATEL)', () => {
    const r = analyzeCostOfDebt({
      riskFreeRate: 0.058, taxRate: 0.3, ebit: 669792, interestExpense: 11236, grossDebt: 303176, fallbackPreTax: 0.075
    });
    expect(r.interestCoverage).toBeCloseTo(59.6, 1);
    expect(r.rating).toBe('Aaa/AAA');
    expect(r.syntheticPreTax).toBeCloseTo(0.058 + 0.0069, 6);
    expect(r.effectivePreTax).toBeCloseTo(11236 / 303176, 6);
    expect(r.retainedPreTax).toBeCloseTo(0.0649, 4);
    expect(r.afterTax).toBeCloseTo(0.0649 * 0.7, 4);
    expect(r.source).toBe('SYNTHETIC');
  });

  it('retombe sur le repli quand les charges d interets manquent (SODECI)', () => {
    const r = analyzeCostOfDebt({ riskFreeRate: 0.059, taxRate: 0.25, ebit: 9105, interestExpense: null, grossDebt: 72763, fallbackPreTax: 0.075 });
    expect(r.interestCoverage).toBeNull();
    expect(r.syntheticPreTax).toBeNull();
    expect(r.retainedPreTax).toBe(0.075);
    expect(r.source).toBe('FALLBACK');
    expect(r.afterTax).toBeCloseTo(0.075 * 0.75, 6);
  });

  it('laisse le taux effectif nul sans dette brute', () => {
    const r = analyzeCostOfDebt({ riskFreeRate: 0.06, taxRate: 0.25, ebit: 1000, interestExpense: 50, grossDebt: null, fallbackPreTax: 0.08 });
    expect(r.effectivePreTax).toBeNull();
    expect(r.syntheticPreTax).not.toBeNull(); // couverture calculable via ebit/interets
  });
});
