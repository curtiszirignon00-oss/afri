// Controleur de valorisation fondamentale.
//
// Cadre CREPMF : une valorisation n'est jamais servie comme un prix cible unique.
// Chaque reponse qui expose des resultats porte le champ `disclaimer` et les
// fourchettes par scenario que le client a calculees — l'API ne fabrique aucun
// chiffre unique presente comme une promesse.

import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { log } from '../config/logger';
import {
  computeRegressionBeta,
  getPublishedRun,
  getSectorComparison,
  getValuationInputs,
  listRuns,
  saveRun,
  upsertAssumptions
} from '../services/valuation.service';

export const VALUATION_DISCLAIMER =
  'Analyse pedagogique et methodologique. Les valeurs presentees sont des fourchettes ' +
  'issues de trois scenarios explicites, non un prix cible ni une recommandation ' +
  "d'investissement. Toutes les hypotheses sont visibles et modifiables.";

/** GET /api/valuation/:symbol/inputs — couches 1 et 2, plus le beta de regression. */
export async function getInputs(req: AuthenticatedRequest, res: Response) {
  try {
    const { symbol } = req.params;
    const inputs = await getValuationInputs(symbol);

    if (!inputs) {
      return res.status(404).json({ success: false, message: `Action ${symbol} introuvable.` });
    }

    // Le beta de regression est un controle : on le sert toujours, meme quand il
    // est inexploitable, pour que l'utilisateur voie pourquoi.
    const regression = await computeRegressionBeta(symbol);

    return res.json({
      success: true,
      data: { ...inputs, regression },
      disclaimer: VALUATION_DISCLAIMER
    });
  } catch (error) {
    log.error('valuation.getInputs', error);
    return res.status(500).json({ success: false, message: 'Erreur lors du chargement des inputs.' });
  }
}

/** PUT /api/valuation/:symbol/assumptions — admin seulement. */
export async function putAssumptions(req: AuthenticatedRequest, res: Response) {
  try {
    const { symbol } = req.params;
    const body = req.body ?? {};

    const required = [
      'risk_free_rate',
      'erp',
      'crp',
      'cost_of_debt',
      'tax_rate',
      'g_terminal',
      'shares_outstanding'
    ];
    const missing = required.filter((k) => typeof body[k] !== 'number' || !Number.isFinite(body[k]));
    if (missing.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: `Champs numeriques manquants ou invalides : ${missing.join(', ')}.` });
    }

    if (body.shares_outstanding <= 0) {
      return res.status(400).json({ success: false, message: "Le nombre d'actions doit etre positif." });
    }

    // Garde-fou du modele : sans WACC > g la valeur terminale change de signe.
    // On ne peut pas verifier le WACC ici (il est calcule cote client), mais on
    // peut refuser un g qui depasse deja le seul Rf majore des primes.
    const ceiling = body.risk_free_rate + body.erp + body.crp;
    if (body.g_terminal >= ceiling) {
      return res.status(400).json({
        success: false,
        message: `g (${body.g_terminal}) doit rester inferieur au cout des capitaux propres, borne ici a ${ceiling}.`
      });
    }

    const weights = [body.weight_dcf, body.weight_ddm, body.weight_anc];
    if (weights.every((w) => typeof w === 'number')) {
      const sum = weights.reduce((a: number, b: number) => a + b, 0);
      if (sum <= 0) {
        return res.status(400).json({ success: false, message: 'La somme des poids de synthese doit etre positive.' });
      }
    }

    const saved = await upsertAssumptions(symbol, body, req.user?.id ?? req.user?._id);
    return res.json({ success: true, data: saved });
  } catch (error) {
    log.error('valuation.putAssumptions', error);
    return res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde des hypotheses.' });
  }
}

/** POST /api/valuation/:symbol/runs — admin seulement. Persiste un instantane. */
export async function postRun(req: AuthenticatedRequest, res: Response) {
  try {
    const { symbol } = req.params;
    const { assumptionsSnapshot, projectionSnapshot, results, diagnostics, priceAtRun, isPublished } =
      req.body ?? {};

    for (const [name, value] of [
      ['assumptionsSnapshot', assumptionsSnapshot],
      ['projectionSnapshot', projectionSnapshot],
      ['results', results]
    ] as const) {
      if (!value || typeof value !== 'object') {
        return res.status(400).json({ success: false, message: `${name} est requis et doit etre un objet.` });
      }
    }

    const run = await saveRun(
      symbol,
      { assumptionsSnapshot, projectionSnapshot, results, diagnostics, priceAtRun, isPublished },
      req.user?.id ?? req.user?._id
    );

    return res.status(201).json({ success: true, data: run, disclaimer: VALUATION_DISCLAIMER });
  } catch (error) {
    log.error('valuation.postRun', error);
    const message = error instanceof Error && /inconnue/.test(error.message) ? error.message : 'Erreur lors de l enregistrement du run.';
    return res.status(message.includes('inconnue') ? 404 : 500).json({ success: false, message });
  }
}

/** GET /api/valuation/:symbol/runs — historique, admin seulement. */
export async function getRuns(req: AuthenticatedRequest, res: Response) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const runs = await listRuns(req.params.symbol, limit);
    return res.json({ success: true, data: runs, disclaimer: VALUATION_DISCLAIMER });
  } catch (error) {
    log.error('valuation.getRuns', error);
    return res.status(500).json({ success: false, message: 'Erreur lors du chargement des runs.' });
  }
}

/** GET /api/valuation/:symbol/published — le run publie, pour un lecteur premium. */
export async function getPublished(req: AuthenticatedRequest, res: Response) {
  try {
    const run = await getPublishedRun(req.params.symbol);
    if (!run) {
      return res.status(404).json({
        success: false,
        message: `Aucune valorisation publiee pour ${req.params.symbol}.`
      });
    }
    return res.json({ success: true, data: run, disclaimer: VALUATION_DISCLAIMER });
  } catch (error) {
    log.error('valuation.getPublished', error);
    return res.status(500).json({ success: false, message: 'Erreur lors du chargement de la valorisation.' });
  }
}

/** GET /api/valuation/sector/:sector — valorisation sectorielle relative. */
export async function getSector(req: AuthenticatedRequest, res: Response) {
  try {
    const comparison = await getSectorComparison(decodeURIComponent(req.params.sector));
    return res.json({ success: true, data: comparison, disclaimer: VALUATION_DISCLAIMER });
  } catch (error) {
    log.error('valuation.getSector', error);
    return res.status(500).json({ success: false, message: 'Erreur lors de la comparaison sectorielle.' });
  }
}
