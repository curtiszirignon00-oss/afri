import { describe, expect, it } from 'vitest';
import {
  anchorCurrentYear,
  buildHistoricalSeries,
  cagr,
  computeSeasonality,
  economicAsset,
  median,
  netDebt,
  reconstructCapex,
  workingCapital
} from '../historicals';
import { SODECI_STATEMENTS } from './fixtures/sodeci';

const fy = (year: number) => {
  const s = SODECI_STATEMENTS.find((x) => x.year === year && x.period === 'FY');
  if (!s) throw new Error(`Exercice ${year} absent de la fixture`);
  return s;
};

describe('workingCapital — BFR d exploitation', () => {
  it('reproduit le BFR 2014 de la feuille BFR', () => {
    // 113 468,156 + 9 407,672 - 27 564,2071 - 80 626,0112
    expect(workingCapital(fy(2014))).toBeCloseTo(14685.6096, 3);
  });

  it('reproduit le BFR 2025', () => {
    // 388 852,035 + 22 913,212 - 307 017,158
    expect(workingCapital(fy(2025))).toBeCloseTo(104748.089, 3);
  });

  it('exclut la tresorerie passif du BFR', () => {
    // La tresorerie passif 2025 (73 174,779) appartient a la dette nette, pas au BFR.
    const withDiscounts = { ...fy(2025), cashLiabilities: 999999 };
    expect(workingCapital(withDiscounts)).toBeCloseTo(104748.089, 3);
  });
});

describe('netDebt — convention retenue', () => {
  it('reproduit la dette nette 2025 de la feuille AE', () => {
    // 72 763,788 + 73 174,779 - 11 465,107
    expect(netDebt(fy(2025))).toBeCloseTo(134473.46, 2);
  });

  it('compte les decouverts comme de la dette, pas comme une tresorerie negative', () => {
    const s = { ...fy(2025), cashLiabilities: 0 };
    expect(netDebt(s)).toBeCloseTo(72763.788 - 11465.107, 2);
  });
});

describe('economicAsset', () => {
  it('reproduit l actif economique 2025 de la feuille AE', () => {
    // 49 441,165 + 104 748,089
    expect(economicAsset(fy(2025))).toBeCloseTo(154189.254, 3);
  });
});

describe('reconstructCapex', () => {
  it('reproduit l investissement 2015 de la feuille Investissement', () => {
    // delta(immo nettes) 4 096,542 + amortissements 4 983,769 + HAO -239,977
    expect(reconstructCapex(fy(2014), fy(2015))).toBeCloseTo(8840.334, 3);
  });

  it('reproduit l investissement 2025', () => {
    expect(reconstructCapex(fy(2024), fy(2025))).toBeCloseTo(16358.564, 3);
  });

  it('reproduit l investissement 2021 (annee de baisse des immobilisations)', () => {
    expect(reconstructCapex(fy(2020), fy(2021))).toBeCloseTo(8092.209, 3);
  });
});

describe('computeSeasonality', () => {
  it('reproduit les coefficients T1/FY du chiffre d affaires', () => {
    const s = computeSeasonality(SODECI_STATEMENTS, 'revenue', 'MEAN');
    expect(s.coefficient.T1).toBeCloseTo(0.2189, 4);
    expect(s.coefficient.S1).toBeCloseTo(0.4536, 4);
    expect(s.coefficient.M9).toBeCloseTo(0.7229, 4);
    expect(s.warnings).toHaveLength(0);
  });

  it('reproduit les medianes du chiffre d affaires', () => {
    const s = computeSeasonality(SODECI_STATEMENTS, 'revenue', 'MEDIAN');
    expect(s.coefficient.T1).toBeCloseTo(0.2182, 4);
    expect(s.coefficient.S1).toBeCloseTo(0.4575, 4);
    expect(s.coefficient.M9).toBeCloseTo(0.7317, 4);
  });

  it('reproduit les coefficients du resultat d exploitation', () => {
    const s = computeSeasonality(SODECI_STATEMENTS, 'operatingIncome', 'MEAN');
    expect(s.coefficient.T1).toBeCloseTo(0.1966, 4);
  });

  it('signale le resultat financier comme non saisonnalisable', () => {
    // Les ratios periode/FY changent de signe : 2020 a -0,10 et 2021 a +0,10.
    const s = computeSeasonality(SODECI_STATEMENTS, 'financialIncome', 'MEAN');
    expect(s.warnings.map((w) => w.code)).toContain('SEASONALITY_SIGN_FLIP');
  });

  it('ignore les exercices dont le FY n est pas publie', () => {
    const s = computeSeasonality(SODECI_STATEMENTS, 'revenue', 'MEAN');
    // 2026 n'a qu'un T1 publie, il ne doit pas produire de ratio.
    expect(s.byYear.find((r) => r.year === 2026)?.T1).toBeNull();
  });
});

describe('anchorCurrentYear — ancrage T-1', () => {
  it('ancre le CA 2026 sur le T1 publie', () => {
    const r = anchorCurrentYear(SODECI_STATEMENTS, 'revenue', { year: 2026, anchorWeight: 1 });
    expect(r.lastPeriod).toBe('T1');
    expect(r.lastValue).toBe(40916);
    expect(r.coefficient).toBeCloseTo(0.2189, 4);
    // 40 916 / coefficient. La feuille Pilotage T-1 affiche 186 905,06 : elle part
    // du coefficient arrondi a 4 decimales, d'ou un ecart de 0,18 M (0,0001 %).
    expect(r.anchored).toBeCloseTo(186904.88, 1);
    expect(Math.abs(r.anchored! / 186905.06 - 1)).toBeLessThan(1e-5);
    expect(r.value).toBe(r.anchored);
  });

  it('bascule sur la tendance a poids d ancrage nul', () => {
    const r = anchorCurrentYear(SODECI_STATEMENTS, 'revenue', { year: 2026, anchorWeight: 0 });
    expect(r.value).toBe(r.trend);
    // TCAM 5 ans du CA (2020 -> 2025) applique a 2025.
    const expected = 189429.713 * (1 + Math.pow(189429.713 / 127480, 1 / 5) - 1);
    expect(r.value).toBeCloseTo(expected, 3);
  });

  it('interpole lineairement entre ancrage et tendance', () => {
    const pure = anchorCurrentYear(SODECI_STATEMENTS, 'revenue', { year: 2026, anchorWeight: 1 });
    const trend = anchorCurrentYear(SODECI_STATEMENTS, 'revenue', { year: 2026, anchorWeight: 0 });
    const half = anchorCurrentYear(SODECI_STATEMENTS, 'revenue', { year: 2026, anchorWeight: 0.5 });
    expect(half.value).toBeCloseTo((pure.anchored! + trend.trend!) / 2, 6);
  });

  it('borne le poids d ancrage hors de [0, 1]', () => {
    const over = anchorCurrentYear(SODECI_STATEMENTS, 'revenue', { year: 2026, anchorWeight: 5 });
    const pure = anchorCurrentYear(SODECI_STATEMENTS, 'revenue', { year: 2026, anchorWeight: 1 });
    expect(over.value).toBeCloseTo(pure.value!, 6);
  });

  it('amplifie fortement le resultat, ce qui justifie de ne pas le retenir tel quel', () => {
    // Le T1 ne pese que ~19,7 % du REX annuel : x5 sur un trimestre exceptionnel.
    const r = anchorCurrentYear(SODECI_STATEMENTS, 'operatingIncome', { year: 2026, anchorWeight: 1 });
    expect(r.anchored).toBeCloseTo(13886.08, 1); // feuille : 13 886,01 au coefficient arrondi
    expect(r.anchored! / 9105.153).toBeGreaterThan(1.5);
  });
});

describe('buildHistoricalSeries', () => {
  const series = buildHistoricalSeries(SODECI_STATEMENTS, 0.25);

  it('couvre les 12 exercices publies', () => {
    expect(series).toHaveLength(12);
    expect(series[0].year).toBe(2014);
    expect(series[11].year).toBe(2025);
  });

  it('calcule les ratios de drivers 2025', () => {
    const y = series[11];
    expect(y.revenueGrowth).toBeCloseTo(0.0998, 4);
    expect(y.operatingMargin).toBeCloseTo(0.0481, 4);
    expect(y.depreciationRatio).toBeCloseTo(0.0844, 4);
    expect(y.capexRatio).toBeCloseTo(0.0864, 4);
    expect(y.workingCapitalRatio).toBeCloseTo(0.553, 4);
    expect(y.netMargin).toBeCloseTo(0.0246, 4);
  });

  it('calcule la variation de BFR 2025', () => {
    expect(series[11].deltaWorkingCapital).toBeCloseTo(54270.689, 3);
  });

  it('reproduit un FCFF historique negatif en 2025', () => {
    // REX x 0,75 + amortissements - capex - delta BFR
    const expected = 9105.153 * 0.75 + 15995.782 - 16358.564 - 54270.689;
    expect(series[11].fcff).toBeCloseTo(expected, 3);
    expect(series[11].fcff).toBeLessThan(0);
  });

  it('confirme un FCFF cumule negatif sur 2015-2025', () => {
    // C'est ce qui explique la derive de la dette nette de 24 Md a 134 Md.
    const total = series.slice(1).reduce((a, y) => a + (y.fcff ?? 0), 0);
    expect(total).toBeLessThan(0);
  });

  it('laisse capex et FCFF indetermines sur le premier exercice', () => {
    expect(series[0].capex).toBeNull();
    expect(series[0].fcff).toBeNull();
  });

  it('suit la derive de la dette nette', () => {
    // 2014 : le total des dettes financieres (26 882,59) et non les seuls emprunts
    // (1 413,41), sinon la dette nette ressortirait negative.
    expect(series[0].netDebt).toBeCloseTo(24294.996, 2);
    expect(series[11].netDebt).toBeCloseTo(134473.46, 2);
  });
});

describe('utilitaires statistiques', () => {
  it('median sur un nombre pair de points', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('median sur un nombre impair de points', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it('median d une liste vide', () => {
    expect(median([])).toBeNull();
  });

  it('cagr refuse une serie a valeur negative', () => {
    expect(cagr([-1, 5])).toBeNull();
  });

  it('cagr sur une croissance connue', () => {
    expect(cagr([100, 121])).toBeCloseTo(0.21, 10);
    expect(cagr([100, 110, 121])).toBeCloseTo(0.1, 10);
  });
});
