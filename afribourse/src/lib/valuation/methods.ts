// Couche 3 — les methodes de valorisation. Toutes consomment la couche hypotheses :
// meme Rf, meme WACC, meme Ke, meme g, meme dette nette. Aucune ne recalcule un taux.

import type { ProjectedYear } from './projection';
import type { ValuationWarning } from './types';

/**
 * Convention d'actualisation du modele : la date de valorisation est la fin du
 * premier exercice projete. Le flux de cet exercice est donc deja acquis et n'est
 * pas actualise ; les exercices suivants le sont sur 1, 2, ... n annees, et la
 * valeur terminale sur n annees.
 */
export function discountPeriods(years: ProjectedYear[], valuationYear: number): { year: number; t: number }[] {
  return years.filter((y) => y.year > valuationYear).map((y) => ({ year: y.year, t: y.year - valuationYear }));
}

export type TerminalValueResult = {
  /** Flux normatif de l'annee suivant le dernier exercice explicite. */
  normativeFlow: number;
  /** Valeur terminale a la date du dernier exercice explicite. */
  terminalValue: number;
  /** Valeur actuelle de la valeur terminale. */
  presentValue: number;
};

/**
 * Valeur terminale de Gordon-Shapiro. Le garde-fou taux > g est indispensable :
 * a g >= taux la formule change de signe et produit une valeur aberrante.
 */
export function gordonTerminalValue(
  lastFlow: number,
  rate: number,
  g: number,
  periods: number
): TerminalValueResult {
  if (rate <= g) {
    throw new Error(`Taux d'actualisation (${rate}) doit etre strictement superieur a g (${g})`);
  }
  const normativeFlow = lastFlow * (1 + g);
  const terminalValue = normativeFlow / (rate - g);
  return { normativeFlow, terminalValue, presentValue: terminalValue / Math.pow(1 + rate, periods) };
}

export type DcfResult = {
  /** Valeur actuelle des flux explicites actualises. */
  presentValueOfFlows: number;
  terminal: TerminalValueResult;
  /** Actif economique = VA(flux) + VA(valeur terminale). */
  enterpriseValue: number;
  netDebt: number;
  equityValue: number;
  valuePerShare: number;
  /** Detail par exercice, pour la transparence. */
  schedule: { year: number; t: number; fcff: number; discounted: number }[];
  warnings: ValuationWarning[];
};

/** DCF sur les flux de tresorerie disponibles pour la firme, actualises au WACC. */
export function discountedCashFlow(params: {
  years: ProjectedYear[];
  valuationYear: number;
  wacc: number;
  gTerminal: number;
  netDebt: number;
  sharesOutstanding: number;
}): DcfResult {
  const { years, valuationYear, wacc, gTerminal, netDebt, sharesOutstanding } = params;
  const warnings: ValuationWarning[] = [];

  if (years.length === 0) throw new Error('Aucun exercice projete');
  if (sharesOutstanding <= 0) throw new Error('Nombre d actions invalide');

  const byYear = new Map(years.map((y) => [y.year, y]));
  const periods = discountPeriods(years, valuationYear);

  if (periods.length === 0) {
    warnings.push({
      code: 'DCF_NO_DISCOUNTED_FLOW',
      severity: 'warning',
      message: `Aucun exercice posterieur a la date de valorisation (${valuationYear}) : seule la valeur terminale porte la valeur.`
    });
  }

  const schedule = periods.map(({ year, t }) => {
    const fcff = byYear.get(year)!.fcff;
    return { year, t, fcff, discounted: fcff / Math.pow(1 + wacc, t) };
  });
  const presentValueOfFlows = schedule.reduce((a, s) => a + s.discounted, 0);

  const lastYear = years[years.length - 1];
  const terminalPeriods = Math.max(1, lastYear.year - valuationYear);
  const terminal = gordonTerminalValue(lastYear.fcff, wacc, gTerminal, terminalPeriods);

  // Une reprise de BFR est ponctuelle : elle ne peut pas etre perpetuee.
  if (lastYear.deltaWorkingCapital < 0) {
    warnings.push({
      code: 'TERMINAL_FLOW_ON_WC_RELEASE',
      severity: 'warning',
      message:
        `Le flux terminal ${lastYear.year} est porte par une reprise de BFR de ` +
        `${Math.abs(lastYear.deltaWorkingCapital).toFixed(0)} : une reprise de BFR ne se perpetue pas, ` +
        `la valeur terminale est surevaluee.`
    });
  }

  const enterpriseValue = presentValueOfFlows + terminal.presentValue;
  const equityValue = enterpriseValue - netDebt;

  if (equityValue < 0) {
    warnings.push({
      code: 'NEGATIVE_EQUITY_VALUE',
      severity: 'warning',
      message:
        `L'actif economique (${enterpriseValue.toFixed(0)}) ne couvre pas la dette nette ` +
        `(${netDebt.toFixed(0)}) : la valeur des capitaux propres ressort negative.`
    });
  }

  return {
    presentValueOfFlows,
    terminal,
    enterpriseValue,
    netDebt,
    equityValue,
    valuePerShare: equityValue / sharesOutstanding,
    schedule,
    warnings
  };
}

export type DdmResult = {
  /** Dividende anticipe, celui de l'exercice suivant la date de valorisation. */
  expectedDividend: number;
  /** Gordon une phase : DPA anticipe / (Ke - g). */
  gordonValuePerShare: number;
  /** Deux phases : dividendes explicites actualises + valeur terminale. */
  presentValueOfDividends: number;
  terminal: TerminalValueResult;
  twoStageValuePerShare: number;
  schedule: { year: number; t: number; dividend: number; discounted: number }[];
  warnings: ValuationWarning[];
};

/**
 * DDM, une et deux phases. Le dividende est un flux qui revient a l'actionnaire :
 * il s'actualise au cout des capitaux propres, jamais au WACC.
 */
export function dividendDiscountModel(params: {
  years: ProjectedYear[];
  valuationYear: number;
  costOfEquity: number;
  gTerminal: number;
}): DdmResult {
  const { years, valuationYear, costOfEquity, gTerminal } = params;
  const warnings: ValuationWarning[] = [];

  if (years.length === 0) throw new Error('Aucun exercice projete');
  if (costOfEquity <= gTerminal) {
    throw new Error(`Cout des capitaux propres (${costOfEquity}) doit etre strictement superieur a g (${gTerminal})`);
  }

  const byYear = new Map(years.map((y) => [y.year, y]));
  const periods = discountPeriods(years, valuationYear);

  const schedule = periods.map(({ year, t }) => {
    const dividend = byYear.get(year)!.dividendPerShare.value;
    return { year, t, dividend, discounted: dividend / Math.pow(1 + costOfEquity, t) };
  });
  const presentValueOfDividends = schedule.reduce((a, s) => a + s.discounted, 0);

  // Le dividende anticipe est celui de l'exercice t+1 par rapport a la valorisation.
  const nextYear = byYear.get(valuationYear + 1);
  const expectedDividend = nextYear
    ? nextYear.dividendPerShare.value
    : years[years.length - 1].dividendPerShare.value;
  const gordonValuePerShare = expectedDividend / (costOfEquity - gTerminal);

  const lastYear = years[years.length - 1];
  const terminalPeriods = Math.max(1, lastYear.year - valuationYear);
  const terminal = gordonTerminalValue(
    lastYear.dividendPerShare.value,
    costOfEquity,
    gTerminal,
    terminalPeriods
  );

  if (years.some((y) => y.dividendPerShare.value > y.earningsPerShare && y.earningsPerShare > 0)) {
    warnings.push({
      code: 'PAYOUT_ABOVE_EARNINGS',
      severity: 'info',
      message: 'Le dividende projete depasse le resultat par action sur au moins un exercice (payout > 100 %).'
    });
  }

  return {
    expectedDividend,
    gordonValuePerShare,
    presentValueOfDividends,
    terminal,
    twoStageValuePerShare: presentValueOfDividends + terminal.presentValue,
    schedule,
    warnings
  };
}

export type AncResult = {
  equity: number;
  fictitiousAssets: number;
  netAssetValue: number;
  valuePerShare: number;
  /** Price-to-book vs cours, nul si le cours est inconnu. */
  priceToBook: number | null;
};

/** Actif net comptable : capitaux propres moins actifs fictifs, par action. */
export function netAssetValue(params: {
  equity: number;
  fictitiousAssets?: number;
  sharesOutstanding: number;
  price?: number | null;
}): AncResult {
  const { equity, sharesOutstanding } = params;
  if (sharesOutstanding <= 0) throw new Error('Nombre d actions invalide');
  const fictitiousAssets = params.fictitiousAssets ?? 0;
  const netAsset = equity - fictitiousAssets;
  const valuePerShare = netAsset / sharesOutstanding;
  return {
    equity,
    fictitiousAssets,
    netAssetValue: netAsset,
    valuePerShare,
    priceToBook:
      typeof params.price === 'number' && valuePerShare !== 0 ? params.price / valuePerShare : null
  };
}

/** Quelle valeur du DDM alimente la synthese. */
export type DdmWeightBasis = 'GORDON' | 'TWO_STAGE' | 'AVERAGE';

export type SynthesisResult = {
  components: { method: 'DCF' | 'DDM' | 'ANC'; valuePerShare: number; weight: number }[];
  /** Somme ponderee des methodes retenues. */
  valuePerShare: number;
  /** Somme brute des poids, avant normalisation. */
  rawWeightSum: number;
  /** true si le DCF a ete neutralise parce qu'il ressortait negatif. */
  dcfExcluded: boolean;
  price: number | null;
  /** Potentiel vs cours, nul si le cours est inconnu. */
  upside: number | null;
  warnings: ValuationWarning[];
};

/**
 * Synthese ponderee (football field). Les poids portent sur trois methodes :
 * DCF, DDM et ANC. Le classeur d'origine faisait tomber ses trois coefficients
 * sur DCF / DDM-Gordon / DDM-2-phases et oubliait l'ANC : ici l'ANC est une
 * composante a part entiere et `ddmBasis` choisit explicitement quelle valeur
 * du DDM est retenue.
 *
 * Quand le DCF ressort negatif (SODECI : la dette nette n'est pas couverte), une
 * moyenne ponderee qui l'inclut produit une "valeur par action" negative, sans
 * portee pour un lecteur. Par defaut on le neutralise alors et on repartit son
 * poids sur le DDM et l'ANC — c'est le repli "Valeur moyenne DDM seule si le DCF
 * ressort non significatif" du modele d'origine. La valeur DCF reste calculee et
 * affichee en diagnostic ; l'exclusion est signalee, jamais silencieuse. On ne
 * neutralise pas si le DDM et l'ANC n'ont aucun poids (rien vers quoi reporter).
 */
export function synthesize(params: {
  dcfValuePerShare: number;
  ddm: Pick<DdmResult, 'gordonValuePerShare' | 'twoStageValuePerShare'>;
  ancValuePerShare: number;
  weights: { dcf: number; ddm: number; anc: number };
  ddmBasis?: DdmWeightBasis;
  /** Neutralise le DCF de la ponderation quand il est negatif. Defaut : true. */
  dropDcfWhenNegative?: boolean;
  price?: number | null;
}): SynthesisResult {
  const { dcfValuePerShare, ddm, ancValuePerShare, weights } = params;
  const basis = params.ddmBasis ?? 'TWO_STAGE';
  const dropDcfWhenNegative = params.dropDcfWhenNegative ?? true;
  const warnings: ValuationWarning[] = [];

  const ddmValue =
    basis === 'GORDON'
      ? ddm.gordonValuePerShare
      : basis === 'TWO_STAGE'
        ? ddm.twoStageValuePerShare
        : (ddm.gordonValuePerShare + ddm.twoStageValuePerShare) / 2;

  // Le controle de normalisation porte sur les poids saisis par l'utilisateur,
  // avant toute neutralisation du DCF.
  const originalSum = weights.dcf + weights.ddm + weights.anc;
  if (originalSum <= 0) throw new Error('Somme des poids de synthese nulle ou negative');
  if (Math.abs(originalSum - 1) > 1e-6) {
    warnings.push({
      code: 'WEIGHTS_NOT_NORMALISED',
      severity: 'warning',
      message: `Somme des poids = ${(originalSum * 100).toFixed(1)} % : les poids ont ete normalises a 100 %.`
    });
  }

  // Poids effectifs : le DCF est neutralise s'il est negatif et qu'il reste du
  // poids sur les autres methodes pour l'absorber.
  const effectiveWeights = { dcf: weights.dcf, ddm: weights.ddm, anc: weights.anc };
  const canRedistribute = weights.ddm + weights.anc > 0;
  const dcfExcluded = dropDcfWhenNegative && dcfValuePerShare < 0 && canRedistribute;
  if (dcfExcluded) {
    effectiveWeights.dcf = 0;
    warnings.push({
      code: 'DCF_EXCLUDED_NEGATIVE',
      severity: 'warning',
      message:
        `DCF a ${dcfValuePerShare.toFixed(0)} F/action (negatif) : exclu de la ponderation, ` +
        `son poids est reparti sur le DDM et l'ANC. La valeur DCF reste affichee a titre de diagnostic.`
    });
  }

  const rawWeightSum = effectiveWeights.dcf + effectiveWeights.ddm + effectiveWeights.anc;

  const components = [
    { method: 'DCF' as const, valuePerShare: dcfValuePerShare, weight: effectiveWeights.dcf / rawWeightSum },
    { method: 'DDM' as const, valuePerShare: ddmValue, weight: effectiveWeights.ddm / rawWeightSum },
    { method: 'ANC' as const, valuePerShare: ancValuePerShare, weight: effectiveWeights.anc / rawWeightSum }
  ];

  const valuePerShare = components.reduce((a, c) => a + c.valuePerShare * c.weight, 0);
  const price = params.price ?? null;

  return {
    components,
    valuePerShare,
    rawWeightSum,
    dcfExcluded,
    price,
    upside: price !== null && price !== 0 ? valuePerShare / price - 1 : null,
    warnings
  };
}

export type InvertedDcfResult = {
  impliedMarketCap: number;
  impliedEnterpriseValue: number;
  /** Valeur actuelle de la valeur terminale que le cours suppose. */
  requiredTerminalPresentValue: number;
  requiredTerminalValue: number;
  /** Flux normatif que le cours suppose a l'exercice terminal. */
  requiredNormativeFlow: number;
  /** Flux normatif que le scenario produit reellement. */
  modelNormativeFlow: number;
  /** Multiple du flux du modele qu'il faudrait justifier. */
  flowMultiple: number | null;
};

/**
 * DCF inverse : ce que le cours suppose. C'est la lecture la plus honnete du
 * modele — au lieu d'opposer un prix cible au marche, elle mesure la
 * normalisation de BFR ou la revision tarifaire qu'il faudrait anticiper pour
 * justifier le cours observe.
 */
export function invertedDcf(params: {
  price: number;
  sharesOutstanding: number;
  netDebt: number;
  presentValueOfFlows: number;
  wacc: number;
  gTerminal: number;
  terminalPeriods: number;
  modelNormativeFlow: number;
}): InvertedDcfResult {
  const { price, sharesOutstanding, netDebt, presentValueOfFlows, wacc, gTerminal, terminalPeriods } = params;
  if (wacc <= gTerminal) {
    throw new Error(`WACC (${wacc}) doit etre strictement superieur a g (${gTerminal})`);
  }

  const impliedMarketCap = price * sharesOutstanding;
  const impliedEnterpriseValue = impliedMarketCap + netDebt;
  const requiredTerminalPresentValue = impliedEnterpriseValue - presentValueOfFlows;
  const requiredTerminalValue = requiredTerminalPresentValue * Math.pow(1 + wacc, terminalPeriods);
  const requiredNormativeFlow = requiredTerminalValue * (wacc - gTerminal);

  return {
    impliedMarketCap,
    impliedEnterpriseValue,
    requiredTerminalPresentValue,
    requiredTerminalValue,
    requiredNormativeFlow,
    modelNormativeFlow: params.modelNormativeFlow,
    flowMultiple:
      params.modelNormativeFlow !== 0 ? requiredNormativeFlow / params.modelNormativeFlow : null
  };
}
