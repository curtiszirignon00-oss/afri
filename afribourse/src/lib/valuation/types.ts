// Moteur de valorisation fondamentale — types partages des 3 couches.
// Couche 1 : faits historiques. Couche 2 : hypotheses. Couche 3 : moteurs de valo.
// Aucune dependance externe : ce module doit rester testable en isolation.

export type StatementPeriod = 'FY' | 'T1' | 'S1' | 'M9';

export type ScenarioId = 'pessimistic' | 'base' | 'optimistic';

/** Un poste force a la main, avec la valeur auto qu'il remplace (tracabilite). */
export type Override<T> = {
  value: T;
  forced: true;
  autoValue: T;
};

/** Fiche sectorielle Damodaran retenue pour le bottom-up. */
export type BetaDataset = 'global' | 'emerging' | 'us' | 'europe' | 'japan';

export type SectorBetaSheet = {
  dataset: BetaDataset;
  sector: string;
  betaUnlevered: number;
  betaUnleveredCashAdjusted?: number;
  asOf: string;
};

/** Origine du bêta retenu dans le WACC. Le choix revient a l'utilisateur. */
export type BetaSource = 'BOTTOM_UP' | 'REGRESSION' | 'MANUAL';

export type RegressionBeta = {
  beta: number;
  /** Coefficient de correlation (pas R^2) — sert a signaler la non-fiabilite. */
  correlation: number;
  points: number;
};

/**
 * Entrees du calcul de cout du capital. Une seule source de verite :
 * les moteurs de valo lisent ces valeurs, ils ne les recopient jamais.
 */
export type CostOfCapitalInput = {
  /** Taux sans risque. */
  riskFreeRate: number;
  /** Prime de risque action (mature market premium). */
  erp: number;
  /** Prime de risque pays. */
  crp: number;
  /** Cout de la dette avant impot. */
  costOfDebt: number;
  /** Taux d'impot sur les societes. */
  taxRate: number;

  betaSource: BetaSource;
  /** Fiches Damodaran a moyenner pour le bottom-up. */
  sectorSheets: SectorBetaSheet[];
  /** Force le beta desendette, court-circuite la moyenne des fiches. */
  betaUnleveredOverride?: number;
  /** Beta de regression vs composite BRVM — controle, et option de l'utilisateur. */
  regression?: RegressionBeta;

  /** Dette nette et capitaux propres reels, pour le gearing observe. */
  netDebt?: number;
  equity?: number;
  /** Gearing D/(D+CP) de repli. */
  gearingTarget: number;
  /** Au-dela de ce gearing observe, on retombe sur la cible. */
  gearingMaxPlausible: number;
};

export type GearingOrigin = 'OBSERVED' | 'TARGET_FALLBACK_IMPLAUSIBLE' | 'TARGET_FALLBACK_MISSING_DATA';

export type CostOfCapitalResult = {
  /** Beta desendette retenu (moyenne des fiches, override, ou n/a en mode regression). */
  betaUnlevered: number | null;
  /** Fiches effectivement moyennees. */
  betaUnleveredFromSheets: BetaDataset[];
  /** Beta des capitaux propres utilise dans le Ke. */
  betaLevered: number;
  /** Gearing D/(D+CP) retenu, et pourquoi. */
  gearing: number;
  gearingObserved: number | null;
  gearingOrigin: GearingOrigin;
  /** Prime totale ERP + CRP. */
  totalPremium: number;
  /** Cout des capitaux propres. */
  costOfEquity: number;
  /** Cout de la dette apres impot. */
  costOfDebtAfterTax: number;
  /** Cout moyen pondere du capital. */
  wacc: number;
  warnings: ValuationWarning[];
};

export type ValuationWarning = {
  code: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
};
