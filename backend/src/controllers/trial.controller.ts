import { Response } from 'express';
import { randomBytes } from 'crypto';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sendTrialInviteEmail } from '../services/email.service';
import { prisma } from '../config/database';

const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 jours

/**
 * GET /api/trial/status
 * Retourne le statut de l'essai gratuit de l'utilisateur connecté.
 */
export async function getTrialStatus(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' });

  const trial = await prisma.freeTrial.findFirst({
    where: { userId, claimed: true },
    orderBy: { activatedAt: 'desc' },
  });

  if (!trial || !trial.expiresAt) {
    return res.json({ success: true, data: { hasActiveTrial: false } });
  }

  const hasActiveTrial = new Date() < trial.expiresAt;
  return res.json({
    success: true,
    data: {
      hasActiveTrial,
      expiresAt: trial.expiresAt,
      activatedAt: trial.activatedAt,
    },
  });
}

/**
 * POST /api/trial/claim/:token
 * L'utilisateur connecté réclame son essai gratuit via le token de son lien email.
 */
export async function claimTrial(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' });

  const { token } = req.params as { token: string };
  if (!token) return res.status(400).json({ success: false, message: 'Token manquant' });

  const trial = await prisma.freeTrial.findUnique({ where: { token } });

  if (!trial) {
    return res.status(404).json({ success: false, message: 'Lien invalide ou expiré' });
  }

  if (trial.claimed) {
    // Déjà activé : renvoyer le statut actuel
    const hasActiveTrial = trial.expiresAt ? new Date() < trial.expiresAt : false;
    return res.json({
      success: true,
      alreadyClaimed: true,
      data: { hasActiveTrial, expiresAt: trial.expiresAt },
    });
  }

  // Vérifier que ce token appartient bien à cet utilisateur
  if (trial.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Ce lien ne vous appartient pas' });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TRIAL_DURATION_MS);

  await prisma.freeTrial.update({
    where: { id: trial.id },
    data: { claimed: true, activatedAt: now, expiresAt },
  });

  return res.json({
    success: true,
    data: { hasActiveTrial: true, activatedAt: now, expiresAt },
  });
}

/**
 * POST /api/trial/send-invites
 * Admin uniquement : génère un token par utilisateur et envoie l'email d'invitation.
 * Body optionnel : { userIds?: string[] } — si absent, envoie à TOUS les utilisateurs.
 */
export async function sendTrialInvites(req: AuthenticatedRequest, res: Response) {
  const { userIds } = req.body as { userIds?: string[] };

  const where = userIds && userIds.length > 0 ? { id: { in: userIds } } : {};

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true },
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      // Vérifie si l'utilisateur a déjà un trial actif non expiré
      const existing = await prisma.freeTrial.findFirst({
        where: { userId: user.id, claimed: true },
      });
      if (existing?.expiresAt && new Date() < existing.expiresAt) {
        skipped++;
        continue;
      }

      // Génère un token unique
      const token = randomBytes(32).toString('hex');

      // Crée (ou recrée) l'enregistrement FreeTrial
      await prisma.freeTrial.upsert({
        where: { token },
        create: { userId: user.id, token },
        update: { claimed: false, activatedAt: null, expiresAt: null },
      });

      await sendTrialInviteEmail({ email: user.email, name: user.name ?? 'Membre', token });
      sent++;
    } catch (err: any) {
      errors.push(`${user.email}: ${err.message}`);
    }
  }

  return res.json({
    success: true,
    data: { total: users.length, sent, skipped, errors },
  });
}
