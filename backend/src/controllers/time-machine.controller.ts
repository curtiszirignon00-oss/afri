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
    const { slug } = req.params;
    const scenario = await tmService.getScenario(slug);
    if (!scenario) return res.status(404).json({ error: 'Scénario introuvable' });
    res.json({ scenario });
  } catch (err: any) {
    log.error('[TimeMachine] getScenario error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function getStepContext(req: Request, res: Response) {
  try {
    const { slug, year } = req.params;
    const ctx = await tmService.getStepContext(slug, parseInt(year));
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
    const tierOrder: Record<string, number> = { FREE: 0, PLUS: 1, MAX: 2 };
    const userTierMapped = userTier === 'max' ? 2 : userTier === 'premium' ? 1 : 0;

    if ((tierOrder[scenarioTier] ?? 0) > userTierMapped) {
      return res.status(403).json({
        error: 'Accès réservé',
        requiredTier: scenarioTier,
        userTier: userTier,
      });
    }

    const session = await tmService.createSession(user.id, scenarioSlug);
    res.status(201).json({ session });
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
    res.json({ session });
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

    // Gamification — déclenché à chaque étape + bonus à la complétion
    let gamification: { xpGained: number; levelUp: boolean; bonusXP: number } | undefined;
    try {
      let totalXP = 30; // XP par étape soumise
      let levelUp = false;
      let bonusXP = 0;

      if ((session as any).status === 'COMPLETED') {
        bonusXP = 150; // bonus complétion scénario
        totalXP += bonusXP;
      }

      const xpResult = await addXP(user.id, totalXP, 'time_machine_step', 'Time Machine — étape validée');
      levelUp = xpResult.leveled_up;

      // Enregistrer l'activité pour le streak
      await streakService.recordActivity(user.id, 'TIME_MACHINE_STEP').catch(() => {});

      gamification = { xpGained: totalXP, levelUp, bonusXP };
    } catch (gamErr: any) {
      log.warn('[TimeMachine] Gamification error (non-blocking):', gamErr?.message);
    }

    res.json({ session, gamification });
  } catch (err: any) {
    if (err.message?.startsWith('Budget dépassé')) {
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
    res.json({ session });
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

    const feedback = await tmService.generateKofiFeedback(id, user.id, stepIndex);
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
    const recap = await tmService.generateKofiRecap(id, user.id);
    res.json({ recap });
  } catch (err: any) {
    log.error('[TimeMachine] getKofiRecap error:', err.message);
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
