import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  applyDeltas,
  calibrateDrivers,
  computeCostOfCapital,
  runValuation,
  sensitivityTornado,
  type BetaDataset,
  type BetaSource,
  type CostOfCapitalInput,
  type DdmWeightBasis,
  type ProjectionOverrides,
  type ScenarioDrivers,
  type ScenarioId,
  type SeasonalityStat,
  type SectorBetaSheet
} from '../lib/valuation';
import { fetchValuationInputs, toStatements, type ValuationInputs } from '../services/valuationApi';

/** Hypotheses pilotables depuis l'UI — les "cellules jaunes" du modele Excel. */
export type EditableAssumptions = {
  riskFreeRate: number;
  erp: number;
  crp: number;
  costOfDebt: number;
  taxRate: number;
  gTerminal: number;
  betaSource: BetaSource;
  betaDatasets: BetaDataset[];
  betaUnleveredOverride: number | null;
  gearingTarget: number;
  gearingMaxPlausible: number;
  sharesOutstanding: number;
  netDebtOverride: number | null;
  weights: { dcf: number; ddm: number; anc: number };
  ddmBasis: DdmWeightBasis;
  /** Neutralise le DCF de la synthese quand il ressort negatif. */
  dropDcfWhenNegative: boolean;
  /** Nombre d'exercices de convergence du ratio BFR/CA vers sa cible. */
  bfrConvergenceYears: number;
  seasonalityStat: SeasonalityStat;
  anchorWeight: number;
  probabilities: Record<ScenarioId, number>;
  /** Fenetre de mediane des ratios historiques. */
  lookback: number;
  /** Fenetre de TCAM de la croissance de regime. */
  cagrWindow: number;
  horizon: number;
  /**
   * Unite des montants des etats financiers, en FCFA. Les publications SYSCOHADA
   * sont saisies en millions, d'ou 1e6 par defaut. Le moteur divise des montants
   * par un nombre d'actions : il faut donc lui passer le nombre d'actions ramene
   * a cette meme unite, sinon la valeur par action sort mille fois trop petite.
   */
  amountUnit: number;
};

/** Valeurs de repli quand aucune hypothese n'a encore ete enregistree en base. */
const FALLBACK: Omit<EditableAssumptions, 'sharesOutstanding'> = {
  riskFreeRate: 0.065, // proxy souverain UEMOA
  erp: 0.0821,
  crp: 0.0349,
  costOfDebt: 0.075,
  taxRate: 0.25,
  gTerminal: 0.025,
  betaSource: 'BOTTOM_UP',
  betaDatasets: ['global', 'emerging'],
  betaUnleveredOverride: null,
  gearingTarget: 0.3,
  gearingMaxPlausible: 0.6,
  netDebtOverride: null,
  weights: { dcf: 0.5, ddm: 0.25, anc: 0.25 },
  ddmBasis: 'TWO_STAGE',
  dropDcfWhenNegative: true,
  bfrConvergenceYears: 4,
  seasonalityStat: 'MEAN',
  anchorWeight: 1,
  probabilities: { pessimistic: 0.25, base: 0.5, optimistic: 0.25 },
  lookback: 5,
  cagrWindow: 5,
  horizon: 6,
  amountUnit: 1_000_000
};

/**
 * Deltas de scenario par defaut, appliques aux drivers du cas de base. Le cas de
 * base a tous ses deltas a zero — mecanique de la feuille "Leviers".
 */
export const DEFAULT_DELTAS: Record<ScenarioId, Partial<ScenarioDrivers>> = {
  pessimistic: {
    revenueGrowthRest: -0.02,
    operatingMarginRest: -0.01,
    capexRatio: 0.01,
    workingCapitalRatioTarget: 0.1,
    netMarginRest: -0.005,
    gTerminal: -0.005
  },
  base: {},
  optimistic: {
    revenueGrowthRest: 0.02,
    operatingMarginRest: 0.01,
    capexRatio: -0.01,
    workingCapitalRatioTarget: -0.1,
    netMarginRest: 0.005,
    gTerminal: 0.005
  }
};

function assumptionsFrom(inputs: ValuationInputs): EditableAssumptions {
  const a = inputs.assumptions;
  const shares = a?.shares_outstanding ?? inputs.stock.sharesOutstanding ?? 0;
  if (!a) return { ...FALLBACK, sharesOutstanding: shares };

  return {
    riskFreeRate: a.risk_free_rate,
    erp: a.erp,
    crp: a.crp,
    costOfDebt: a.cost_of_debt,
    taxRate: a.tax_rate,
    gTerminal: a.g_terminal,
    betaSource: a.beta_source,
    betaDatasets: (a.beta_datasets?.length ? a.beta_datasets : FALLBACK.betaDatasets) as BetaDataset[],
    betaUnleveredOverride: a.beta_unlevered_override,
    gearingTarget: a.gearing_target,
    gearingMaxPlausible: a.gearing_max_plausible,
    sharesOutstanding: shares,
    netDebtOverride: a.net_debt_override,
    weights: { dcf: a.weight_dcf, ddm: a.weight_ddm, anc: a.weight_anc },
    ddmBasis: FALLBACK.ddmBasis,
    dropDcfWhenNegative: FALLBACK.dropDcfWhenNegative,
    bfrConvergenceYears: FALLBACK.bfrConvergenceYears,
    seasonalityStat: a.seasonality_stat,
    anchorWeight: a.t1_anchor_weight,
    probabilities: {
      pessimistic: a.prob_pessimistic,
      base: a.prob_base,
      optimistic: a.prob_optimistic
    },
    lookback: FALLBACK.lookback,
    cagrWindow: FALLBACK.cagrWindow,
    horizon: FALLBACK.horizon,
    amountUnit: FALLBACK.amountUnit
  };
}

/**
 * Orchestre la valorisation. Tout le calcul est local : deplacer un curseur
 * d'hypothese ne declenche aucune requete, seul le memo se reevalue.
 */
export function useValuation(symbol: string) {
  const query = useQuery({
    queryKey: ['valuation-inputs', symbol],
    queryFn: () => fetchValuationInputs(symbol),
    // Le cours (et donc les potentiels) doit refleter la derniere cotation : le
    // scraper met a jour Stock.current_price chaque jour, on refetch a l'ouverture
    // de la page et au retour sur l'onglet pour ne jamais afficher un cours perime.
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    enabled: Boolean(symbol)
  });

  const [assumptionsPatch, setAssumptionsPatch] = useState<Partial<EditableAssumptions>>({});
  const [deltas, setDeltas] = useState(DEFAULT_DELTAS);
  const [overrides, setOverrides] = useState<Partial<Record<ScenarioId, ProjectionOverrides>>>({});
  const [scenario, setScenario] = useState<ScenarioId>('base');

  const computed = useMemo(() => {
    const inputs = query.data;
    if (!inputs) return null;

    const assumptions = { ...assumptionsFrom(inputs), ...assumptionsPatch };
    const statements = toStatements(inputs.statements);
    const fyYears = statements.filter((s) => s.period === 'FY').map((s) => s.year);
    if (fyYears.length === 0 || assumptions.sharesOutstanding <= 0) {
      return {
        ok: false as const,
        error:
          fyYears.length === 0
            ? "Aucun exercice annuel saisi : la valorisation demande au moins un exercice publie."
            : "Nombre d'actions inconnu : renseignez-le dans les hypotheses.",
        assumptions,
        inputs,
        capital: null
      };
    }

    const lastFy = Math.max(...fyYears);
    const firstProjectedYear = lastFy + 1;

    // --- Couche 2 : cout du capital
    const sheets: SectorBetaSheet[] = inputs.sectorBetas
      .filter((b) => assumptions.betaDatasets.includes(b.dataset))
      .map((b) => ({
        dataset: b.dataset,
        sector: b.sector,
        betaUnlevered: b.beta_unlevered,
        betaUnleveredCashAdjusted: b.beta_unlevered_cash_adj ?? undefined,
        asOf: b.as_of
      }));

    // --- Couche 1bis : calibration sur l'historique
    const calibration = calibrateDrivers({
      statements,
      taxRate: assumptions.taxRate,
      firstProjectedYear,
      gTerminal: assumptions.gTerminal,
      lookback: assumptions.lookback,
      cagrWindow: assumptions.cagrWindow,
      seasonalityStat: assumptions.seasonalityStat,
      anchorWeight: assumptions.anchorWeight
    });

    const lastHistory = calibration.history[calibration.history.length - 1];
    const netDebt = assumptions.netDebtOverride ?? lastHistory?.netDebt ?? 0;

    const costOfCapitalInput: CostOfCapitalInput = {
      riskFreeRate: assumptions.riskFreeRate,
      erp: assumptions.erp,
      crp: assumptions.crp,
      costOfDebt: assumptions.costOfDebt,
      taxRate: assumptions.taxRate,
      betaSource: assumptions.betaSource,
      sectorSheets: sheets,
      betaUnleveredOverride: assumptions.betaUnleveredOverride ?? undefined,
      regression:
        inputs.regression.beta !== null && inputs.regression.correlation !== null
          ? {
              beta: inputs.regression.beta,
              correlation: inputs.regression.correlation,
              points: inputs.regression.points
            }
          : undefined,
      netDebt,
      equity: lastHistory?.equity ?? undefined,
      gearingTarget: assumptions.gearingTarget,
      gearingMaxPlausible: assumptions.gearingMaxPlausible
    };

    let capital;
    try {
      capital = computeCostOfCapital(costOfCapitalInput);
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : 'Cout du capital incalculable.',
        assumptions,
        inputs,
        capital: null
      };
    }

    // --- Couche 3 : projection, scenarios, valorisations
    const base: ScenarioDrivers = {
      ...calibration.drivers,
      gTerminal: assumptions.gTerminal,
      workingCapitalConvergenceYears: assumptions.bfrConvergenceYears
    };
    const engineInput = {
      firstYear: firstProjectedYear,
      horizon: assumptions.horizon,
      valuationYear: firstProjectedYear,
      lastRevenue: lastHistory?.revenue ?? 0,
      lastWorkingCapital: lastHistory?.workingCapital ?? 0,
      lastWorkingCapitalRatio: lastHistory?.workingCapitalRatio ?? 0,
      lastEquity: lastHistory?.equity ?? 0,
      taxRate: assumptions.taxRate,
      // Montants en millions de FCFA -> nombre d'actions exprime en millions de titres,
      // pour que la valeur par action ressorte directement en FCFA.
      sharesOutstanding: assumptions.sharesOutstanding / assumptions.amountUnit,
      netDebt,
      wacc: capital.wacc,
      costOfEquity: capital.costOfEquity,
      scenarios: {
        pessimistic: applyDeltas(base, deltas.pessimistic),
        base: applyDeltas(base, deltas.base),
        optimistic: applyDeltas(base, deltas.optimistic)
      },
      probabilities: assumptions.probabilities,
      weights: assumptions.weights,
      ddmBasis: assumptions.ddmBasis,
      dropDcfWhenNegative: assumptions.dropDcfWhenNegative,
      price: inputs.stock.currentPrice,
      overrides
    };

    try {
      return {
        ok: true as const,
        error: null,
        assumptions,
        inputs,
        calibration,
        capital,
        netDebt,
        engineInput,
        result: runValuation(engineInput),
        tornado: sensitivityTornado(engineInput)
      };
    } catch (e) {
      // Une hypothese peut violer un garde-fou (g >= WACC, poids nuls) : on
      // remonte le message plutot que de casser la page.
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : 'Valorisation incalculable.',
        assumptions,
        inputs,
        capital
      };
    }
  }, [query.data, assumptionsPatch, deltas, overrides]);

  return {
    isLoading: query.isLoading,
    loadError: query.error instanceof Error ? query.error.message : null,
    computed,
    scenario,
    setScenario,
    setAssumption: <K extends keyof EditableAssumptions>(key: K, value: EditableAssumptions[K]) =>
      setAssumptionsPatch((p) => ({ ...p, [key]: value })),
    resetAssumptions: () => setAssumptionsPatch({}),
    deltas,
    setDeltas,
    overrides,
    setOverride: (scenarioId: ScenarioId, line: keyof ProjectionOverrides, year: number, value: number | null) =>
      setOverrides((prev) => {
        const forScenario = { ...(prev[scenarioId] ?? {}) };
        const forLine = { ...(forScenario[line] ?? {}) };
        if (value === null) delete forLine[year];
        else forLine[year] = value;
        forScenario[line] = forLine;
        return { ...prev, [scenarioId]: forScenario };
      }),
    clearOverrides: () => setOverrides({})
  };
}
