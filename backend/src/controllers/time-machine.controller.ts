import { Request, Response } from 'express';
import * as tmService from '../services/time-machine.service';
import { log } from '../config/logger';
import { addXP } from '../services/xp.service';
import * as streakService from '../services/streak.service';

// ─── Scénarios ────────────────────────────────────────────────────────────────

export async function listScenarios(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const tier = user?.subscriptionTier ?? 'free';
    const scenarios = await tmService.getScenarios(tier);
    // Retourner aussi tous les scénarios avec un flag locked pour l'UI
    const all = await tmService.getAllScenarios();
    const allowedIds = new Set(scenarios.map((s: any) => s.id));
    const withLock = all.map((s: any) => ({ ...s, locked: !allowedIds.has(s.id) }));
    res.json({ scenarios: withLock });
  } catch (err: any) {
    log.error('[TimeMachine] listScenarios error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function getScenario(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { slug } = req.params;
    const scenario = await tmService.getScenario(slug);
    if (!scenario) return res.status(404).json({ error: 'Scénario introuvable' });

    // Scénario au-dessus du tier de l'utilisateur → métadonnées seules, aucun contenu
    if (!tmService.hasTierAccess(user?.subscriptionTier, (scenario as any).tier)) {
      const sanitized = tmService.sanitizeScenarioForClient(scenario, -1);
      return res.json({ scenario: { ...sanitized, locked: true } });
    }

    // Page détail : seule la première année part au client (le reste se débloque en jouant)
    res.json({ scenario: tmService.sanitizeScenarioForClient(scenario, 0) });
  } catch (err: any) {
    log.error('[TimeMachine] getScenario error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function getStepContext(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { slug, year } = req.params;

    const scenario = await tmService.getScenario(slug);
    if (!scenario) return res.status(404).json({ error: 'Scénario introuvable' });
    if (!tmService.hasTierAccess(user?.subscriptionTier, (scenario as any).tier)) {
      return res.status(403).json({ error: 'Accès réservé', requiredTier: (scenario as any).tier });
    }

    // Ne servir que les étapes déjà atteintes par l'utilisateur (anti-triche)
    const yearNum = parseInt(year);
    const stepIdx = ((scenario as any).years ?? []).indexOf(yearNum);
    if (stepIdx === -1) return res.status(404).json({ error: 'Étape introuvable' });
    const maxStep = await tmService.getMaxUnlockedStep(user.id, scenario);
    if (stepIdx > maxStep) return res.status(403).json({ error: 'Étape non débloquée' });

    const ctx = await tmService.getStepContext(slug, yearNum);
    if (!ctx) return res.status(404).json({ error: 'Étape introuvable' });
    res.json(ctx);
  } catch (err: any) {
    log.error('[TimeMachine] getStepContext error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { scenarioSlug } = req.body;

    if (!scenarioSlug) return res.status(400).json({ error: 'scenarioSlug requis' });

    // Vérifier le tier du scénario vs celui de l'utilisateur
    const scenario = await tmService.getScenario(scenarioSlug);
    if (!scenario) return res.status(404).json({ error: 'Scénario introuvable' });

    const userTier = user?.subscriptionTier ?? 'free';
    const scenarioTier = (scenario as any).tier;

    if (!tmService.hasTierAccess(userTier, scenarioTier)) {
      return res.status(403).json({
        error: 'Accès réservé',
        requiredTier: scenarioTier,
        userTier: userTier,
      });
    }

    const session = await tmService.createSession(user.id, scenarioSlug);
    res.status(201).json({ session: tmService.sanitizeSessionForClient(session) });
  } catch (err: any) {
    log.error('[TimeMachine] createSession error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function getSession(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const session = await tmService.getSession(id, user.id);
    if (!session) return res.status(404).json({ error: 'Session introuvable' });
    res.json({ session: tmService.sanitizeSessionForClient(session) });
  } catch (err: any) {
    log.error('[TimeMachine] getSession error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function getUserSessions(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const sessions = await tmService.getUserSessions(user.id);
    res.json({ sessions });
  } catch (err: any) {
    log.error('[TimeMachine] getUserSessions error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function submitStep(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { stepIndex, allocation, note } = req.body;

    if (typeof stepIndex !== 'number') return res.status(400).json({ error: 'stepIndex requis' });
    if (!allocation || typeof allocation !== 'object') return res.status(400).json({ error: 'allocation requis' });

    const session = await tmService.submitStep(id, user.id, stepIndex, allocation, note ?? '');

    // Gamification — XP uniquement à la première partie du scénario (anti-farming),
    // le streak reste enregistré à chaque étape
    let gamification: { xpGained: number; levelUp: boolean; bonusXP: number } | undefined;
    try {
      const firstPlay = await tmService.isFirstPlay(user.id, (session as any).scenarioId, id);

      let totalXP = 0;
      let levelUp = false;
      let bonusXP = 0;

      if (firstPlay) {
        totalXP = 30; // XP par étape soumise

        if ((session as any).status === 'COMPLETED') {
          bonusXP = 150; // bonus complétion scénario
          totalXP += bonusXP;
        }

        const xpResult = await addXP(
          user.id,
          totalXP,
          'time_machine_step',
          'Time Machine — étape validée',
          { scenarioId: (session as any).scenarioId, stepIndex },
        );
        levelUp = xpResult.leveled_up;
      }

      // Enregistrer l'activité pour le streak
      await streakService.recordActivity(user.id, 'TIME_MACHINE_STEP').catch(() => {});

      gamification = { xpGained: totalXP, levelUp, bonusXP };
    } catch (gamErr: any) {
      log.warn('[TimeMachine] Gamification error (non-blocking):', gamErr?.message);
    }

    res.json({ session: tmService.sanitizeSessionForClient(session), gamification });
  } catch (err: any) {
    if (
      err.message?.startsWith('Budget dépassé') ||
      err.message?.startsWith('Étape invalide') ||
      err.message?.startsWith('Allocation invalide')
    ) {
      return res.status(400).json({ error: err.message });
    }
    log.error('[TimeMachine] submitStep error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function completeSession(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const session = await tmService.completeSession(id, user.id);
    res.json({ session: tmService.sanitizeSessionForClient(session) });
  } catch (err: any) {
    log.error('[TimeMachine] completeSession error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function getKofiFeedback(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { stepIndex } = req.body;

    if (typeof stepIndex !== 'number') return res.status(400).json({ error: 'stepIndex requis' });

    const userName = user?.name ?? user?.firstname ?? undefined;
    const feedback = await tmService.generateKofiFeedback(id, user.id, stepIndex, userName);
    res.json({ feedback });
  } catch (err: any) {
    log.error('[TimeMachine] getKofiFeedback error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function getKofiRecap(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const userName = user?.name ?? user?.firstname ?? undefined;
    const recap = await tmService.generateKofiRecap(id, user.id, userName);
    res.json({ recap });
  } catch (err: any) {
    log.error('[TimeMachine] getKofiRecap error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function getScenarioStockData(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { slug, year } = req.params;
    const scenario = await tmService.getScenario(slug);
    if (!scenario) return res.status(404).json({ error: 'Scénario introuvable' });
    if (!tmService.hasTierAccess(user?.subscriptionTier, (scenario as any).tier)) {
      return res.status(403).json({ error: 'Accès réservé', requiredTier: (scenario as any).tier });
    }

    // Ne servir que les années déjà atteintes par l'utilisateur (anti-triche)
    const yearNum = parseInt(year);
    const stepIdx = ((scenario as any).years ?? []).indexOf(yearNum);
    if (stepIdx === -1) return res.status(404).json({ error: 'Année hors scénario' });
    const maxStep = await tmService.getMaxUnlockedStep(user.id, scenario);
    if (stepIdx > maxStep) return res.status(403).json({ error: 'Étape non débloquée' });

    const tickers = (scenario as any).availableStocks ?? [];
    const fundamentalsFallback = (scenario as any).fundamentalsByYear;
    const stocks = await tmService.getStockDataForYear(tickers, yearNum, fundamentalsFallback);
    res.json({ stocks });
  } catch (err: any) {
    log.error('[TimeMachine] getScenarioStockData error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function importToSandbox(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const result = await tmService.importToSandbox(id, user.id);
    res.json(result);
  } catch (err: any) {
    log.error('[TimeMachine] importToSandbox error:', err.message);
    res.status(400).json({ error: err.message ?? 'Erreur lors de l\'import' });
  }
}

export async function getFundamentals(req: Request, res: Response) {
  try {
    const { ticker, year } = req.params;
    const data = await tmService.getFundamentals(ticker.toUpperCase(), parseInt(year));
    if (!data) return res.status(404).json({ error: 'Données non trouvées' });
    res.json(data);
  } catch (err: any) {
    log.error('[TimeMachine] getFundamentals error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function submitUserFeedback(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { rating, useful, tags, comment } = req.body;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Note invalide (1–5 requis)' });
    }

    await tmService.saveUserFeedback(id, userId, { rating, useful: !!useful, tags: tags ?? [], comment });
    res.json({ ok: true });
  } catch (err: any) {
    log.error('[TimeMachine] submitUserFeedback error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
