// Couche 1bis — retraitements des etats financiers bruts.
// Saisonnalite, capex reconstruit, BFR, dette nette, actif economique.
// Ces fonctions ne projettent rien : elles n'expliquent que le passe publie.

import type { StatementPeriod, ValuationWarning } from './types';

/** Un etat financier tel que saisi, tous postes optionnels. */
export type Statement = {
  year: number;
  period: StatementPeriod;
  revenue?: number | null;
  depreciation?: number | null;
  operatingIncome?: number | null;
  financialIncome?: number | null;
  ordinaryIncome?: number | null;
  /** Resultat HAO — porte la VNC des immobilisations cedees (negatif si perte). */
  haoIncome?: number | null;
  incomeTax?: number | null;
  netIncome?: number | null;

  fixedAssets?: number | null;
  intangibleAssets?: number | null;
  tangibleAssets?: number | null;
  inventory?: number | null;
  receivables?: number | null;
  otherReceivables?: number | null;
  cashAssets?: number | null;

  equity?: number | null;
  /** Capitaux propres part du groupe (hors minoritaires), pour l'ANC d'un groupe consolide. */
  equityGroupShare?: number | null;
  /** Interets minoritaires, deduits du pont DCF pour la valeur revenant a l'actionnaire. */
  minorityInterests?: number | null;
  /** Dettes financieres et ressources assimilees — total du poste SYSCOHADA. */
  financialDebtTotal?: number | null;
  /** Emprunts et dettes financieres seuls, sous-poste du precedent. */
  borrowings?: number | null;
  tradePayables?: number | null;
  taxSocialPayables?: number | null;
  customerAdvances?: number | null;
  /** Tresorerie passif : decouverts et mobilisations de creances. */
  cashLiabilities?: number | null;

  dividendPerShare?: number | null;
  payoutRatio?: number | null;
  fictitiousAssets?: number | null;
};

/** Agregats suivis en infra-annuel, donc porteurs d'un coefficient de saisonnalite. */
export const SEASONAL_AGGREGATES = [
  'revenue',
  'operatingIncome',
  'financialIncome',
  'ordinaryIncome',
  'incomeTax',
  'netIncome'
] as const;

export type SeasonalAggregate = (typeof SEASONAL_AGGREGATES)[number];

export type SeasonalityStat = 'MEAN' | 'MEDIAN';

const INTERIM_PERIODS = ['T1', 'S1', 'M9'] as const;
export type InterimPeriod = (typeof INTERIM_PERIODS)[number];

const n = (v: number | null | undefined): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

export function mean(xs: number[]): number | null {
  return xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Taux de croissance annuel moyen geometrique sur une serie de valeurs positives. */
export function cagr(series: number[]): number | null {
  if (series.length < 2) return null;
  const first = series[0];
  const last = series[series.length - 1];
  if (first <= 0 || last <= 0) return null;
  return Math.pow(last / first, 1 / (series.length - 1)) - 1;
}

export function indexStatements(statements: Statement[]): Map<string, Statement> {
  const m = new Map<string, Statement>();
  for (const s of statements) m.set(`${s.year}-${s.period}`, s);
  return m;
}

export type SeasonalityRatios = {
  aggregate: SeasonalAggregate;
  /** Ratios periode/FY par annee a FY connu. */
  byYear: { year: number; T1: number | null; S1: number | null; M9: number | null }[];
  /** Coefficient retenu par periode, selon la statistique choisie. */
  coefficient: Record<InterimPeriod, number | null>;
};

/**
 * Coefficients de saisonnalite periode/FY, calcules uniquement sur les annees
 * dont l'exercice complet est publie. Un agregat dont le signe s'inverse d'une
 * annee sur l'autre (cas du resultat financier SODECI) produit des ratios
 * instables : on le signale plutot que de l'utiliser en silence.
 */
export function computeSeasonality(
  statements: Statement[],
  aggregate: SeasonalAggregate,
  stat: SeasonalityStat = 'MEAN'
): SeasonalityRatios & { warnings: ValuationWarning[] } {
  const byKey = indexStatements(statements);
  const years = [...new Set(statements.map((s) => s.year))].sort((a, b) => a - b);
  const warnings: ValuationWarning[] = [];

  const byYear = years.map((year) => {
    const fy = n(byKey.get(`${year}-FY`)?.[aggregate]);
    const ratio = (p: InterimPeriod): number | null => {
      const v = n(byKey.get(`${year}-${p}`)?.[aggregate]);
      if (v === null || fy === null || fy === 0) return null;
      return v / fy;
    };
    return { year, T1: ratio('T1'), S1: ratio('S1'), M9: ratio('M9') };
  });

  const pick = stat === 'MEDIAN' ? median : mean;
  const coefficient = {} as Record<InterimPeriod, number | null>;
  for (const p of INTERIM_PERIODS) {
    const xs = byYear.map((r) => r[p]).filter((x): x is number => x !== null);
    coefficient[p] = pick(xs);
    // Des ratios de signes opposes signent un agregat non saisonnalisable.
    if (xs.length > 1 && Math.min(...xs) < 0 && Math.max(...xs) > 0) {
      warnings.push({
        code: 'SEASONALITY_SIGN_FLIP',
        severity: 'warning',
        message:
          `Coefficients ${p}/FY de signes opposes sur "${aggregate}" : l'agregat change de signe ` +
          `selon les annees, l'ancrage saisonnier n'y est pas exploitable.`
      });
    }
  }

  return { aggregate, byYear, coefficient, warnings };
}

export type AnchorResult = {
  aggregate: SeasonalAggregate;
  /** Derniere periode infra-annuelle publiee de l'exercice ancre. */
  lastPeriod: InterimPeriod | null;
  lastValue: number | null;
  coefficient: number | null;
  /** Estimation FY = derniere periode publiee / coefficient de saisonnalite. */
  anchored: number | null;
  /** Estimation FY par tendance (TCAM sur la fenetre demandee). */
  trend: number | null;
  /** Mix retenu : anchorWeight = 1 -> ancrage pur, 0 -> tendance pure. */
  value: number | null;
  warnings: ValuationWarning[];
};

/**
 * Ancrage T-1 : l'exercice en cours n'est pas projete par tendance mais estime
 * depuis la derniere publication infra-annuelle, puis pondere avec la tendance.
 *
 *   estim. FY = derniere periode publiee / coefficient (periode / FY)
 *   retenu    = w x ancrage + (1 - w) x tendance
 */
export function anchorCurrentYear(
  statements: Statement[],
  aggregate: SeasonalAggregate,
  options: {
    year: number;
    stat?: SeasonalityStat;
    anchorWeight: number;
    /** Nombre d'exercices de la fenetre de TCAM pour la tendance. */
    trendWindow?: number;
  }
): AnchorResult {
  const { year, stat = 'MEAN', anchorWeight, trendWindow = 5 } = options;
  const byKey = indexStatements(statements);
  const season = computeSeasonality(statements, aggregate, stat);
  const warnings = [...season.warnings];

  // Derniere periode publiee de l'exercice ancre, de la plus complete a la plus courte.
  let lastPeriod: InterimPeriod | null = null;
  let lastValue: number | null = null;
  for (const p of ['M9', 'S1', 'T1'] as InterimPeriod[]) {
    const v = n(byKey.get(`${year}-${p}`)?.[aggregate]);
    if (v !== null) {
      lastPeriod = p;
      lastValue = v;
      break;
    }
  }

  const coefficient = lastPeriod ? season.coefficient[lastPeriod] : null;
  const anchored =
    lastValue !== null && coefficient !== null && coefficient !== 0 ? lastValue / coefficient : null;

  // Tendance : TCAM sur les derniers exercices publies, applique au dernier connu.
  const fyValues = [...new Set(statements.map((s) => s.year))]
    .filter((y) => y < year)
    .sort((a, b) => a - b)
    .map((y) => n(byKey.get(`${y}-FY`)?.[aggregate]))
    .filter((v): v is number => v !== null);
  const window = fyValues.slice(-(trendWindow + 1));
  const growth = cagr(window);
  const trend =
    growth !== null && fyValues.length > 0 ? fyValues[fyValues.length - 1] * (1 + growth) : null;

  let value: number | null = null;
  const w = Math.min(1, Math.max(0, anchorWeight));
  if (anchored !== null && trend !== null) value = w * anchored + (1 - w) * trend;
  else if (anchored !== null) value = anchored;
  else if (trend !== null) value = trend;

  if (anchored === null && lastValue !== null) {
    warnings.push({
      code: 'ANCHOR_NO_COEFFICIENT',
      severity: 'warning',
      message:
        `Publication ${lastPeriod} ${year} disponible sur "${aggregate}" mais aucun coefficient ` +
        `de saisonnalite calculable : tendance retenue.`
    });
  }

  return { aggregate, lastPeriod, lastValue, coefficient, anchored, trend, value, warnings };
}

/**
 * Capex reconstruit : ce n'est pas un poste publie.
 *   capex = delta(immo corporelles + incorporelles nettes) + amortissements + resultat HAO
 * Le resultat HAO porte la VNC des immobilisations cedees, negatif en cas de perte.
 */
export function reconstructCapex(previous: Statement, current: Statement): number | null {
  const netNow = (n(current.tangibleAssets) ?? 0) + (n(current.intangibleAssets) ?? 0);
  const netBefore = (n(previous.tangibleAssets) ?? 0) + (n(previous.intangibleAssets) ?? 0);
  const dep = n(current.depreciation);
  if (dep === null) return null;
  return netNow - netBefore + dep + (n(current.haoIncome) ?? 0);
}

/**
 * BFR d'exploitation. La tresorerie passif (decouverts, mobilisations de creances)
 * en est volontairement exclue : elle appartient a la dette nette. L'inclure ici
 * la compterait deux fois.
 */
export function workingCapital(s: Statement): number | null {
  const receivables = n(s.receivables);
  if (receivables === null) return null;
  return (
    receivables +
    (n(s.otherReceivables) ?? 0) +
    (n(s.inventory) ?? 0) -
    (n(s.tradePayables) ?? 0) -
    (n(s.taxSocialPayables) ?? 0) -
    (n(s.customerAdvances) ?? 0)
  );
}

/**
 * Dette nette : toute la dette financiere porteuse d'interets, y compris les
 * concours bancaires courants, moins la tresorerie a l'actif. On ne presente
 * jamais une tresorerie "nette" negative en deduisant les decouverts de l'actif.
 *
 * On retient le total "Dettes financieres et ressources assimilees" et non le
 * sous-poste "Emprunts" : jusqu'en 2018 SODECI ventile sa dette entre emprunts,
 * dettes financieres diverses et provisions financieres, et ne retenir que les
 * emprunts sous-estimerait la dette de plus de 25 Md. Ce total inclut les
 * provisions financieres pour risques et charges — choix de modelisation
 * conserve pour rester coherent avec la lecture historique de l'actif economique.
 */
export function netDebt(s: Statement): number | null {
  const debt = n(s.financialDebtTotal) ?? n(s.borrowings);
  if (debt === null) return null;
  return debt + (n(s.cashLiabilities) ?? 0) - (n(s.cashAssets) ?? 0);
}

/** Actif economique = actif immobilise + BFR d'exploitation. */
export function economicAsset(s: Statement): number | null {
  const fixed = n(s.fixedAssets);
  const wc = workingCapital(s);
  if (fixed === null || wc === null) return null;
  return fixed + wc;
}

export type HistoricalYear = {
  year: number;
  revenue: number | null;
  revenueGrowth: number | null;
  operatingIncome: number | null;
  operatingMargin: number | null;
  depreciation: number | null;
  depreciationRatio: number | null;
  capex: number | null;
  capexRatio: number | null;
  workingCapital: number | null;
  workingCapitalRatio: number | null;
  deltaWorkingCapital: number | null;
  fcff: number | null;
  netDebt: number | null;
  economicAsset: number | null;
  equity: number | null;
  equityGroupShare: number | null;
  minorityInterests: number | null;
  netIncome: number | null;
  netMargin: number | null;
  dividendPerShare: number | null;
  payoutRatio: number | null;
};

/**
 * Serie historique complete des drivers, telle qu'elle alimente la calibration
 * des projections. FCFF = REX x (1 - IS) + amortissements - capex - delta BFR.
 */
export function buildHistoricalSeries(statements: Statement[], taxRate: number): HistoricalYear[] {
  const fy = statements.filter((s) => s.period === 'FY').sort((a, b) => a.year - b.year);

  return fy.map((s, i) => {
    const prev = i > 0 ? fy[i - 1] : null;
    const revenue = n(s.revenue);
    const operatingIncome = n(s.operatingIncome);
    const depreciation = n(s.depreciation);
    const capex = prev ? reconstructCapex(prev, s) : null;
    const wc = workingCapital(s);
    const prevWc = prev ? workingCapital(prev) : null;
    const deltaWc = wc !== null && prevWc !== null ? wc - prevWc : null;
    const prevRevenue = prev ? n(prev.revenue) : null;
    const netIncome = n(s.netIncome);

    const fcff =
      operatingIncome !== null && depreciation !== null && capex !== null && deltaWc !== null
        ? operatingIncome * (1 - taxRate) + depreciation - capex - deltaWc
        : null;

    const ratio = (x: number | null) =>
      x !== null && revenue !== null && revenue !== 0 ? x / revenue : null;

    return {
      year: s.year,
      revenue,
      revenueGrowth:
        revenue !== null && prevRevenue !== null && prevRevenue !== 0 ? revenue / prevRevenue - 1 : null,
      operatingIncome,
      operatingMargin: ratio(operatingIncome),
      depreciation,
      depreciationRatio: ratio(depreciation),
      capex,
      capexRatio: ratio(capex),
      workingCapital: wc,
      workingCapitalRatio: ratio(wc),
      deltaWorkingCapital: deltaWc,
      fcff,
      netDebt: netDebt(s),
      economicAsset: economicAsset(s),
      equity: n(s.equity),
      equityGroupShare: n(s.equityGroupShare),
      minorityInterests: n(s.minorityInterests),
      netIncome,
      netMargin: ratio(netIncome),
      dividendPerShare: n(s.dividendPerShare),
      payoutRatio: n(s.payoutRatio)
    };
  });
}
