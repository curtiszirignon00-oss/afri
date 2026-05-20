import { Request, Response } from 'express';
import crypto from 'crypto'; // pour randomUUID
import { prisma } from '../config/database';
import { log } from '../config/logger';
import {
  initiateDeposit,
  initiateRefund,
  type PawaPayDepositCallback,
  type PawaPayRefundCallback,
} from '../services/pawapay.service';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

// Plans supportés et leur abonnement correspondant
const PLAN_TIER_MAP: Record<string, string> = {
  'investisseur-plus': 'premium',
  'pro': 'max',
};

// ============================================================
// WEBHOOK — Deposit callback
// POST /api/pawapay/webhook/deposit
// Appelé par PawaPay quand un dépôt change de statut.
// Pas d'auth JWT, pas de CSRF — vérifié par signature HMAC.
// ============================================================
export async function handleDepositCallback(req: Request, res: Response) {
  const payload = req.body as PawaPayDepositCallback;
  const { depositId, status } = payload;

  if (!depositId || !status) {
    return res.status(400).json({ error: 'Payload invalide' });
  }

  log.info({ depositId, status }, '[PawaPay] Callback dépôt reçu');

  try {
    const payment = await prisma.payment.findUnique({ where: { depositId } });

    if (!payment) {
      // PawaPay renverra peut-être si on répond 404 — on log mais on répond 200
      log.warn({ depositId }, '[PawaPay] Paiement introuvable pour ce depositId');
      return res.status(200).json({ received: true });
    }

    // Idempotence : ne pas retraiter un paiement déjà finalisé
    if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
      return res.status(200).json({ received: true });
    }

    if (status === 'COMPLETED') {
      const tier = PLAN_TIER_MAP[payment.planId] ?? 'premium';

      await prisma.$transaction([
        prisma.payment.update({
          where: { depositId },
          data: {
            status: 'COMPLETED',
            metadata: payload as any,
          },
        }),
        prisma.user.update({
          where: { id: payment.userId },
          data: { subscriptionTier: tier },
        }),
      ]);

      log.info({ depositId, userId: payment.userId, tier }, '[PawaPay] Abonnement activé');
    } else if (status === 'FAILED') {
      await prisma.payment.update({
        where: { depositId },
        data: {
          status: 'FAILED',
          failureReason: payload.failureReason?.failureCode ?? 'UNKNOWN',
          metadata: payload as any,
        },
      });

      log.info({ depositId }, '[PawaPay] Dépôt échoué');
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    log.error({ error, depositId }, '[PawaPay] Erreur traitement callback dépôt');
    // Répondre 500 pour que PawaPay réessaie
    return res.status(500).json({ error: 'Erreur interne' });
  }
}

// ============================================================
// WEBHOOK — Refund callback
// POST /api/pawapay/webhook/refund
// ============================================================
export async function handleRefundCallback(req: Request, res: Response) {
  const payload = req.body as PawaPayRefundCallback;
  const { refundId, status } = payload;

  if (!refundId || !status) {
    return res.status(400).json({ error: 'Payload invalide' });
  }

  log.info({ refundId, status }, '[PawaPay] Callback remboursement reçu');

  try {
    const refund = await prisma.refund.findUnique({ where: { refundId } });

    if (!refund) {
      log.warn({ refundId }, '[PawaPay] Remboursement introuvable');
      return res.status(200).json({ received: true });
    }

    if (refund.status === 'COMPLETED' || refund.status === 'FAILED') {
      return res.status(200).json({ received: true });
    }

    const newStatus = status === 'COMPLETED' ? 'COMPLETED' : 'FAILED';

    await prisma.refund.update({
      where: { refundId },
      data: {
        status: newStatus,
        metadata: payload as any,
      },
    });

    log.info({ refundId, status: newStatus }, '[PawaPay] Remboursement mis à jour');
    return res.status(200).json({ received: true });
  } catch (error) {
    log.error({ error, refundId }, '[PawaPay] Erreur traitement callback remboursement');
    return res.status(500).json({ error: 'Erreur interne' });
  }
}

// ============================================================
// Initier un dépôt (appelé par le frontend authentifié)
// POST /api/pawapay/deposit
// ============================================================
export async function createDeposit(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Non authentifié' });

  const { planId, planName, amount, currency, correspondent, phone } = req.body;

  if (!planId || !planName || !amount || !currency || !correspondent || !phone) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  if (!PLAN_TIER_MAP[planId]) {
    return res.status(400).json({ error: 'Plan invalide' });
  }

  // Vérifier que le numéro est numérique et > 8 chiffres
  if (!/^\d{8,15}$/.test(phone)) {
    return res.status(400).json({ error: 'Numéro de téléphone invalide' });
  }

  const depositId = crypto.randomUUID();

  try {
    // Créer le paiement en base avant d'appeler PawaPay (traçabilité)
    await prisma.payment.create({
      data: {
        depositId,
        userId,
        planId,
        planName,
        amount: String(amount),
        currency,
        correspondent,
        phone,
        status: 'PENDING',
      },
    });

    const result = await initiateDeposit({
      depositId,
      amount: String(amount),
      currency,
      correspondent,
      phone,
      description: `AfriBourse ${planName}`,
    });

    if (result.status === 'REJECTED') {
      await prisma.payment.update({
        where: { depositId },
        data: { status: 'FAILED', failureReason: result.rejectionReason?.rejectionCode },
      });
      return res.status(422).json({
        success: false,
        error: 'Dépôt refusé par PawaPay',
        reason: result.rejectionReason,
      });
    }

    return res.status(201).json({
      success: true,
      depositId,
      status: result.status,
      message: 'Veuillez confirmer le paiement sur votre téléphone.',
    });
  } catch (error) {
    log.error({ error, userId, planId }, '[PawaPay] Erreur création dépôt');
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ============================================================
// Initier un remboursement (admin uniquement)
// POST /api/pawapay/refund
// ============================================================
export async function createRefund(req: AuthenticatedRequest, res: Response) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  const { depositId, amount, reason } = req.body;

  if (!depositId || !amount) {
    return res.status(400).json({ error: 'depositId et amount requis' });
  }

  const payment = await prisma.payment.findUnique({ where: { depositId } });
  if (!payment) return res.status(404).json({ error: 'Paiement introuvable' });
  if (payment.status !== 'COMPLETED') {
    return res.status(422).json({ error: 'Seul un paiement COMPLETED peut être remboursé' });
  }

  const refundId = crypto.randomUUID();

  try {
    await prisma.refund.create({
      data: {
        refundId,
        paymentId: payment.id,
        amount: String(amount),
        currency: payment.currency,
        status: 'PENDING',
        reason: reason ?? null,
      },
    });

    const result = await initiateRefund({ refundId, depositId, amount: String(amount) });

    if (result.status === 'REJECTED') {
      await prisma.refund.update({
        where: { refundId },
        data: { status: 'FAILED' },
      });
      return res.status(422).json({ error: 'Remboursement refusé', reason: result.rejectionReason });
    }

    return res.status(201).json({ success: true, refundId, status: result.status });
  } catch (error) {
    log.error({ error, depositId }, '[PawaPay] Erreur création remboursement');
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ============================================================
// Statut d'un paiement (frontend)
// GET /api/pawapay/deposit/:depositId/status
// ============================================================
export async function getDepositStatus(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id;
  const { depositId } = req.params;

  const payment = await prisma.payment.findUnique({ where: { depositId } });

  if (!payment) return res.status(404).json({ error: 'Paiement introuvable' });
  // Un utilisateur normal ne peut consulter que ses propres paiements
  if (req.user?.role !== 'admin' && payment.userId !== userId) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  return res.json({
    depositId: payment.depositId,
    status: payment.status,
    planId: payment.planId,
    amount: payment.amount,
    currency: payment.currency,
    created_at: payment.created_at,
  });
}
