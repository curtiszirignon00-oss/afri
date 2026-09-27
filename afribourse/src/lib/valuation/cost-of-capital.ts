// Couche 2 — cout du capital. Rf, primes, beta, gearing, Ke, WACC.
// DCF, DDM et comparables consomment ce resultat : ils ne recalculent jamais un WACC.

import type {
  BetaDataset,
  CostOfCapitalInput,
  CostOfCapitalResult,
  GearingOrigin,
  SectorBetaSheet,
  ValuationWarning
} from './types';

/** Correlation en dessous de laquelle un beta de regression est juge inexploitable. */
export const REGRESSION_CORRELATION_FLOOR = 0.3;
/** Nombre minimal de points de cotation pour qu'une regression ait un sens. */
export const REGRESSION_MIN_POINTS = 250;

/**
 * Reendettement de Hamada : beta_L = beta_u x [1 + (1 - IS) x D/CP].
 * Le gearing passe ici doit etre le meme que celui qui pondere le WACC,
 * sinon le cout du capital est incoherent avec la structure financiere supposee.
 */
export function leverBeta(betaUnlevered: number, taxRate: number, gearing: number): number {
  if (gearing >= 1) {
    throw new Error('Gearing D/(D+CP) doit etre strictement inferieur a 1');
  }
  const debtToEquity = gearing / (1 - gearing);
  return betaUnlevered * (1 + (1 - taxRate) * debtToEquity);
}

/** Moyenne simple des betas desendettes des fiches Damodaran retenues. */
export function averageUnleveredBeta(sheets: SectorBetaSheet[]): {
  betaUnlevered: number;
  datasets: BetaDataset[];
} {
  if (sheets.length === 0) {
    throw new Error('Aucune fiche sectorielle Damodaran fournie pour le beta bottom-up');
  }
  const sum = sheets.reduce((acc, s) => acc + s.betaUnlevered, 0);
  return {
    betaUnlevered: sum / sheets.length,
    datasets: sheets.map((s) => s.dataset)
  };
}

/**
 * Gearing retenu : le D/(D+CP) observe quand il est disponible ET plausible,
 * sinon le gearing cible. Un titre tres endette (SODECI : 87 %) produirait
 * sinon un beta reendette et un WACC economiquement absurdes.
 */
export function resolveGearing(input: CostOfCapitalInput): {
  gearing: number;
  gearingObserved: number | null;
  gearingOrigin: GearingOrigin;
  warnings: ValuationWarning[];
} {
  const { netDebt, equity, gearingTarget, gearingMaxPlausible } = input;
  const warnings: ValuationWarning[] = [];

  const hasData =
    typeof netDebt === 'number' &&
    typeof equity === 'number' &&
    Number.isFinite(netDebt) &&
    Number.isFinite(equity) &&
    netDebt + equity > 0;

  if (!hasData) {
    warnings.push({
      code: 'GEARING_MISSING_DATA',
      severity: 'info',
      message: `Dette nette ou capitaux propres indisponibles : gearing cible de ${(gearingTarget * 100).toFixed(1)} % retenu.`
    });
    return {
      gearing: gearingTarget,
      gearingObserved: null,
      gearingOrigin: 'TARGET_FALLBACK_MISSING_DATA',
      warnings
    };
  }

  const gearingObserved = netDebt! / (netDebt! + equity!);

  // Tresorerie nette positive (dette nette negative) : l'entreprise n'a pas de
  // dette nette a financer. On retient un gearing de 0 (WACC = Ke) plutot que de
  // retomber sur la cible, qui injecterait a tort de la dette bon marche et
  // sous-estimerait le cout du capital. Cas d'un telecom comme SONATEL.
  if (gearingObserved < 0) {
    warnings.push({
      code: 'NET_CASH_GEARING_ZERO',
      severity: 'info',
      message:
        `Tresorerie nette positive (dette nette negative) : gearing ramene a 0 %, ` +
        `le WACC egale le cout des capitaux propres. La cible n'est pas appliquee ` +
        `(elle surestimerait l'endettement d'une entreprise sans dette nette).`
    });
    return { gearing: 0, gearingObserved, gearingOrigin: 'NET_CASH_ZERO', warnings };
  }

  if (gearingObserved > gearingMaxPlausible) {
    warnings.push({
      code: 'GEARING_IMPLAUSIBLE',
      severity: 'warning',
      message:
        `Gearing observe de ${(gearingObserved * 100).toFixed(1)} % au-dela de la plage plausible ` +
        `(0 - ${(gearingMaxPlausible * 100).toFixed(0)} %) : gearing cible de ` +
        `${(gearingTarget * 100).toFixed(1)} % retenu pour le reendettement du beta et la ponderation du WACC.`
    });
    return {
      gearing: gearingTarget,
      gearingObserved,
      gearingOrigin: 'TARGET_FALLBACK_IMPLAUSIBLE',
      warnings
    };
  }

  return {
    gearing: gearingObserved,
    gearingObserved,
    gearingOrigin: 'OBSERVED',
    warnings
  };
}

/**
 * Chaine complete : beta desendette -> Hamada -> Ke -> WACC.
 *
 *   Ke   = Rf + beta_L x (ERP + CRP)
 *   WACC = Ke x (1 - gearing) + Kd x (1 - IS) x gearing
 */
export function computeCostOfCapital(input: CostOfCapitalInput): CostOfCapitalResult {
  const warnings: ValuationWarning[] = [];

  const { gearing, gearingObserved, gearingOrigin, warnings: gearingWarnings } = resolveGearing(input);
  warnings.push(...gearingWarnings);

  let betaUnlevered: number | null = null;
  let betaUnleveredFromSheets: BetaDataset[] = [];
  let betaLevered: number;

  if (input.betaSource === 'REGRESSION') {
    if (!input.regression) {
      throw new Error('betaSource = REGRESSION mais aucun beta de regression fourni');
    }
    betaLevered = input.regression.beta;
  } else if (input.betaSource === 'MANUAL') {
    if (typeof input.betaUnleveredOverride !== 'number') {
      throw new Error('betaSource = MANUAL mais betaUnleveredOverride absent');
    }
    betaUnlevered = input.betaUnleveredOverride;
    betaLevered = leverBeta(betaUnlevered, input.taxRate, gearing);
  } else {
    if (typeof input.betaUnleveredOverride === 'number') {
      betaUnlevered = input.betaUnleveredOverride;
    } else {
      const avg = averageUnleveredBeta(input.sectorSheets);
      betaUnlevered = avg.betaUnlevered;
      betaUnleveredFromSheets = avg.datasets;
    }
    betaLevered = leverBeta(betaUnlevered, input.taxRate, gearing);
  }

  // La regression reste un controle : on signale quand elle est inexploitable,
  // qu'elle soit retenue ou non.
  if (input.regression) {
    const { correlation, points } = input.regression;
    if (Math.abs(correlation) < REGRESSION_CORRELATION_FLOOR || points < REGRESSION_MIN_POINTS) {
      warnings.push({
        code: 'REGRESSION_BETA_UNRELIABLE',
        severity: input.betaSource === 'REGRESSION' ? 'error' : 'info',
        message:
          `Beta de regression peu fiable (correlation ${correlation.toFixed(3)}, ${points} points) : ` +
          `titre insuffisamment liquide face au composite BRVM.`
      });
    }
  }

  const totalPremium = input.erp + input.crp;
  const costOfEquity = input.riskFreeRate + betaLevered * totalPremium;
  const costOfDebtAfterTax = input.costOfDebt * (1 - input.taxRate);
  const wacc = costOfEquity * (1 - gearing) + costOfDebtAfterTax * gearing;

  return {
    betaUnlevered,
    betaUnleveredFromSheets,
    betaLevered,
    gearing,
    gearingObserved,
    gearingOrigin,
    totalPremium,
    costOfEquity,
    costOfDebtAfterTax,
    wacc,
    warnings
  };
}
