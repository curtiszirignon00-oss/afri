import { describe, expect, it } from 'vitest';
import {
  discountPeriods,
  discountedCashFlow,
  dividendDiscountModel,
  gordonTerminalValue,
  invertedDcf,
  netAssetValue,
  synthesize
} from '../methods';
import type { ProjectedYear } from '../projection';

/** Fabrique un exercice projete minimal, pour tester les methodes en isolation. */
function year(y: number, fcff: number, dividend = 0, extra: Partial<ProjectedYear> = {}): ProjectedYear {
  const pv = (v: number) => ({ value: v, autoValue: v, forced: false });
  return {
    year: y,
    offset: 0,
    revenue: pv(0),
    revenueGrowth: 0,
    operatingIncome: pv(0),
    operatingMargin: 0,
    tax: 0,
    depreciation: pv(0),
    capex: pv(0),
    workingCapitalRatio: 0,
    workingCapital: pv(0),
    deltaWorkingCapital: 0,
    fcff,
    netIncome: pv(0),
    earningsPerShare: dividend * 2,
    dividendPerShare: pv(dividend),
    ...extra
  };
}

describe('gordonTerminalValue', () => {
  it('calcule le flux normatif et la valeur terminale', () => {
    const r = gordonTerminalValue(100, 0.1, 0.025, 5);
    expect(r.normativeFlow).toBeCloseTo(102.5, 10);
    expect(r.terminalValue).toBeCloseTo(102.5 / 0.075, 8);
    expect(r.presentValue).toBeCloseTo(r.terminalValue / 1.1 ** 5, 8);
  });

  it('refuse g superieur ou egal au taux', () => {
    expect(() => gordonTerminalValue(100, 0.025, 0.025, 5)).toThrow(/superieur a g/);
    expect(() => gordonTerminalValue(100, 0.02, 0.03, 5)).toThrow(/superieur a g/);
  });
});

describe('discountPeriods — convention de date de valorisation', () => {
  it('exclut l exercice de valorisation et numerote les suivants a partir de 1', () => {
    const years = [2026, 2027, 2028].map((y) => year(y, 100));
    expect(discountPeriods(years, 2026)).toEqual([
      { year: 2027, t: 1 },
      { year: 2028, t: 2 }
    ]);
  });

  it('actualise tous les exercices quand la valorisation precede la projection', () => {
    const years = [2026, 2027].map((y) => year(y, 100));
    expect(discountPeriods(years, 2025)).toEqual([
      { year: 2026, t: 1 },
      { year: 2027, t: 2 }
    ]);
  });
});

describe('discountedCashFlow', () => {
  const years = [
    year(2026, 40000),
    year(2027, 1000),
    year(2028, 1100),
    year(2029, 1200),
    year(2030, 1300),
    year(2031, 1400)
  ];

  it('n actualise pas le flux de l exercice de valorisation', () => {
    const r = discountedCashFlow({
      years,
      valuationYear: 2026,
      wacc: 0.1,
      gTerminal: 0.025,
      netDebt: 0,
      sharesOutstanding: 10
    });
    // Le flux 2026 de 40 000 ne doit apparaitre nulle part.
    expect(r.schedule).toHaveLength(5);
    expect(r.schedule.map((s) => s.year)).toEqual([2027, 2028, 2029, 2030, 2031]);
    const manual = [1000, 1100, 1200, 1300, 1400].reduce((a, f, i) => a + f / 1.1 ** (i + 1), 0);
    expect(r.presentValueOfFlows).toBeCloseTo(manual, 8);
  });

  it('enchaine actif economique, dette nette et valeur par action', () => {
    const r = discountedCashFlow({
      years,
      valuationYear: 2026,
      wacc: 0.1,
      gTerminal: 0.025,
      netDebt: 5000,
      sharesOutstanding: 10
    });
    expect(r.enterpriseValue).toBeCloseTo(r.presentValueOfFlows + r.terminal.presentValue, 8);
    expect(r.equityValue).toBeCloseTo(r.enterpriseValue - 5000, 8);
    expect(r.valuePerShare).toBeCloseTo(r.equityValue / 10, 8);
  });

  it('alerte quand la dette nette depasse l actif economique', () => {
    const r = discountedCashFlow({
      years,
      valuationYear: 2026,
      wacc: 0.1,
      gTerminal: 0.025,
      netDebt: 500000,
      sharesOutstanding: 10
    });
    expect(r.equityValue).toBeLessThan(0);
    expect(r.warnings.map((w) => w.code)).toContain('NEGATIVE_EQUITY_VALUE');
  });

  it('alerte quand le flux terminal est porte par une reprise de BFR', () => {
    const withRelease = [...years.slice(0, 5), year(2031, 30000, 0, { deltaWorkingCapital: -27622 })];
    const r = discountedCashFlow({
      years: withRelease,
      valuationYear: 2026,
      wacc: 0.1,
      gTerminal: 0.025,
      netDebt: 0,
      sharesOutstanding: 10
    });
    expect(r.warnings.map((w) => w.code)).toContain('TERMINAL_FLOW_ON_WC_RELEASE');
  });

  it('refuse WACC inferieur ou egal a g', () => {
    expect(() =>
      discountedCashFlow({
        years,
        valuationYear: 2026,
        wacc: 0.02,
        gTerminal: 0.025,
        netDebt: 0,
        sharesOutstanding: 10
      })
    ).toThrow(/superieur a g/);
  });
});

describe('dividendDiscountModel', () => {
  const years = [
    year(2026, 0, 648.55),
    year(2027, 0, 628.3),
    year(2028, 0, 671.66),
    year(2029, 0, 718),
    year(2030, 0, 767.54),
    year(2031, 0, 820.5)
  ];

  it('actualise au cout des capitaux propres, pas au WACC', () => {
    const ke = 0.1577;
    const r = dividendDiscountModel({ years, valuationYear: 2026, costOfEquity: ke, gTerminal: 0.025 });
    const manual = [628.3, 671.66, 718, 767.54, 820.5].reduce((a, d, i) => a + d / (1 + ke) ** (i + 1), 0);
    expect(r.presentValueOfDividends).toBeCloseTo(manual, 6);
  });

  it('Gordon retient le dividende de l exercice suivant la valorisation', () => {
    const r = dividendDiscountModel({ years, valuationYear: 2026, costOfEquity: 0.1577, gTerminal: 0.025 });
    expect(r.expectedDividend).toBeCloseTo(628.3, 6); // DPA 2027, pas 2026
    expect(r.gordonValuePerShare).toBeCloseTo(628.3 / (0.1577 - 0.025), 6);
  });

  it('deux phases = dividendes actualises + valeur terminale actualisee', () => {
    const r = dividendDiscountModel({ years, valuationYear: 2026, costOfEquity: 0.1577, gTerminal: 0.025 });
    expect(r.twoStageValuePerShare).toBeCloseTo(r.presentValueOfDividends + r.terminal.presentValue, 8);
  });

  it('signale un payout supperieur au resultat', () => {
    const over = [year(2026, 0, 100), year(2027, 0, 100, { earningsPerShare: 50 })];
    const r = dividendDiscountModel({ years: over, valuationYear: 2026, costOfEquity: 0.15, gTerminal: 0.025 });
    expect(r.warnings.map((w) => w.code)).toContain('PAYOUT_ABOVE_EARNINGS');
  });

  it('refuse Ke inferieur ou egal a g', () => {
    expect(() =>
      dividendDiscountModel({ years, valuationYear: 2026, costOfEquity: 0.025, gTerminal: 0.025 })
    ).toThrow(/superieur a g/);
  });
});

describe('netAssetValue', () => {
  it('reproduit l ANC SODECI 2025', () => {
    const r = netAssetValue({ equity: 19715.795, sharesOutstanding: 9, price: 12100 });
    expect(r.valuePerShare).toBeCloseTo(2190.6439, 4);
    expect(r.priceToBook).toBeCloseTo(12100 / 2190.6439, 6);
  });

  it('deduit les actifs fictifs', () => {
    const r = netAssetValue({ equity: 1000, fictitiousAssets: 100, sharesOutstanding: 10 });
    expect(r.valuePerShare).toBe(90);
  });

  it('laisse le PBR nul sans cours', () => {
    expect(netAssetValue({ equity: 1000, sharesOutstanding: 10 }).priceToBook).toBeNull();
  });
});

describe('coherence des unites', () => {
  // Les montants SYSCOHADA sont saisis en millions de FCFA. Le nombre d'actions
  // passe au moteur doit etre exprime dans la meme unite (millions de titres),
  // sinon la valeur par action ressort un million de fois trop petite.
  const EQUITY_IN_MILLIONS = 19715.795;
  const TRUE_SHARE_COUNT = 9_000_000;
  const AMOUNT_UNIT = 1_000_000;

  it('rend une valeur par action en FCFA quand le nombre d actions est ramene a l unite des montants', () => {
    const r = netAssetValue({
      equity: EQUITY_IN_MILLIONS,
      sharesOutstanding: TRUE_SHARE_COUNT / AMOUNT_UNIT,
      price: 11900
    });
    expect(r.valuePerShare).toBeCloseTo(2190.6439, 4);
    expect(r.priceToBook).toBeCloseTo(11900 / 2190.6439, 6);
  });

  it('rend une valeur absurde si le nombre d actions brut est passe tel quel', () => {
    // Garde-fou explicite : c'est l'erreur que ce test existe pour attraper.
    const wrong = netAssetValue({ equity: EQUITY_IN_MILLIONS, sharesOutstanding: TRUE_SHARE_COUNT });
    expect(wrong.valuePerShare).toBeLessThan(0.01);
  });

  it('propage l unite au DCF', () => {
    const years = [year(2026, 0), year(2027, 10000), year(2028, 10000)];
    const scaled = discountedCashFlow({
      years,
      valuationYear: 2026,
      wacc: 0.1045,
      gTerminal: 0.025,
      netDebt: 134473.46,
      sharesOutstanding: TRUE_SHARE_COUNT / AMOUNT_UNIT
    });
    const raw = discountedCashFlow({
      years,
      valuationYear: 2026,
      wacc: 0.1045,
      gTerminal: 0.025,
      netDebt: 134473.46,
      sharesOutstanding: TRUE_SHARE_COUNT
    });
    // Meme valeur des capitaux propres, echelles de prix differentes d'un facteur 1e6.
    expect(scaled.equityValue).toBeCloseTo(raw.equityValue, 6);
    expect(scaled.valuePerShare / raw.valuePerShare).toBeCloseTo(AMOUNT_UNIT, 0);
  });
});

describe('synthesize', () => {
  const ddm = { gordonValuePerShare: 5365.028, twoStageValuePerShare: 6435.6085 };

  it('pondere DCF, DDM et ANC — l ANC a bien un poids', () => {
    const r = synthesize({
      dcfValuePerShare: 8581.7983,
      ddm,
      ancValuePerShare: 2190.6439,
      weights: { dcf: 0.6, ddm: 0.2, anc: 0.2 }
    });
    // 0,6 x 8 581,80 + 0,2 x 6 435,61 + 0,2 x 2 190,64
    expect(r.valuePerShare).toBeCloseTo(6874.33, 2);
    expect(r.components.find((c) => c.method === 'ANC')?.weight).toBeCloseTo(0.2, 10);
  });

  it('choisit la base du DDM', () => {
    const args = {
      dcfValuePerShare: 0,
      ddm,
      ancValuePerShare: 0,
      weights: { dcf: 0, ddm: 1, anc: 0 }
    };
    expect(synthesize({ ...args, ddmBasis: 'GORDON' }).valuePerShare).toBeCloseTo(5365.028, 4);
    expect(synthesize({ ...args, ddmBasis: 'TWO_STAGE' }).valuePerShare).toBeCloseTo(6435.6085, 4);
    expect(synthesize({ ...args, ddmBasis: 'AVERAGE' }).valuePerShare).toBeCloseTo(5900.3183, 4);
  });

  it('normalise les poids et le signale', () => {
    const r = synthesize({
      dcfValuePerShare: 100,
      ddm: { gordonValuePerShare: 200, twoStageValuePerShare: 200 },
      ancValuePerShare: 300,
      weights: { dcf: 1, ddm: 1, anc: 1 }
    });
    expect(r.rawWeightSum).toBe(3);
    expect(r.valuePerShare).toBeCloseTo(200, 8);
    expect(r.warnings.map((w) => w.code)).toContain('WEIGHTS_NOT_NORMALISED');
  });

  it('calcule le potentiel vs cours', () => {
    const r = synthesize({
      dcfValuePerShare: 6000,
      ddm: { gordonValuePerShare: 6000, twoStageValuePerShare: 6000 },
      ancValuePerShare: 6000,
      weights: { dcf: 0.5, ddm: 0.25, anc: 0.25 },
      price: 12000
    });
    expect(r.upside).toBeCloseTo(-0.5, 10);
  });

  it('refuse une somme de poids nulle', () => {
    expect(() =>
      synthesize({
        dcfValuePerShare: 1,
        ddm,
        ancValuePerShare: 1,
        weights: { dcf: 0, ddm: 0, anc: 0 }
      })
    ).toThrow(/Somme des poids/);
  });

  it('exclut le DCF de la ponderation quand il est negatif et repartit son poids', () => {
    const r = synthesize({
      dcfValuePerShare: -21181,
      ddm: { gordonValuePerShare: 6224, twoStageValuePerShare: 7425 },
      ancValuePerShare: 2191,
      weights: { dcf: 0.5, ddm: 0.25, anc: 0.25 }
    });
    expect(r.dcfExcluded).toBe(true);
    // Poids DDM et ANC renormalises a 0,5 / 0,5, DCF a 0.
    expect(r.components.find((c) => c.method === 'DCF')?.weight).toBe(0);
    expect(r.components.find((c) => c.method === 'DDM')?.weight).toBeCloseTo(0.5, 10);
    expect(r.valuePerShare).toBeCloseTo(0.5 * 7425 + 0.5 * 2191, 6);
    expect(r.valuePerShare).toBeGreaterThan(0);
    expect(r.warnings.map((w) => w.code)).toContain('DCF_EXCLUDED_NEGATIVE');
  });

  it('conserve le DCF negatif quand le drapeau est desactive', () => {
    const r = synthesize({
      dcfValuePerShare: -21181,
      ddm,
      ancValuePerShare: 2191,
      weights: { dcf: 0.5, ddm: 0.25, anc: 0.25 },
      dropDcfWhenNegative: false
    });
    expect(r.dcfExcluded).toBe(false);
    expect(r.valuePerShare).toBeLessThan(0);
    expect(r.warnings.map((w) => w.code)).not.toContain('DCF_EXCLUDED_NEGATIVE');
  });

  it('ne neutralise pas le DCF s il porte tout le poids (rien vers quoi reporter)', () => {
    const r = synthesize({
      dcfValuePerShare: -21181,
      ddm,
      ancValuePerShare: 2191,
      weights: { dcf: 1, ddm: 0, anc: 0 }
    });
    expect(r.dcfExcluded).toBe(false);
    expect(r.valuePerShare).toBeCloseTo(-21181, 6);
  });

  it('laisse le DCF positif dans la ponderation', () => {
    const r = synthesize({
      dcfValuePerShare: 8582,
      ddm,
      ancValuePerShare: 2191,
      weights: { dcf: 0.5, ddm: 0.25, anc: 0.25 }
    });
    expect(r.dcfExcluded).toBe(false);
    expect(r.components.find((c) => c.method === 'DCF')?.weight).toBeCloseTo(0.5, 10);
  });
});

describe('invertedDcf', () => {
  it('remonte du cours au flux normatif implicite', () => {
    const r = invertedDcf({
      price: 13500,
      sharesOutstanding: 9,
      netDebt: 134473.46,
      presentValueOfFlows: 15835.1184,
      wacc: 0.1273,
      gTerminal: 0.025,
      terminalPeriods: 5,
      modelNormativeFlow: 2159.1141
    });
    expect(r.impliedMarketCap).toBeCloseTo(121500, 6);
    expect(r.impliedEnterpriseValue).toBeCloseTo(255973.46, 4);
    expect(r.requiredTerminalPresentValue).toBeCloseTo(240138.3416, 3);
    // Le cours suppose un flux normatif tres superieur a celui du modele.
    expect(r.requiredNormativeFlow).toBeGreaterThan(r.modelNormativeFlow * 10);
    expect(r.flowMultiple).toBeCloseTo(r.requiredNormativeFlow / 2159.1141, 6);
  });

  it('refuse WACC inferieur ou egal a g', () => {
    expect(() =>
      invertedDcf({
        price: 100,
        sharesOutstanding: 1,
        netDebt: 0,
        presentValueOfFlows: 0,
        wacc: 0.02,
        gTerminal: 0.025,
        terminalPeriods: 5,
        modelNormativeFlow: 1
      })
    ).toThrow(/superieur a g/);
  });
});
