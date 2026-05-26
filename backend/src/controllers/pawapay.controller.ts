import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { log } from '../config/logger';
import {
  initiateDeposit,
  initiateRefund,
  type PawaPayDepositCallback,
  type PawaPayRefundCallback,
} from '../services/pawapay.service';
import { sendWebinarPaymentConfirmEmail } from '../services/email.service';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

// Plans supportés et leur abonnement correspondant
const PLAN_TIER_MAP: Record<string, string> = {
  'investisseur-plus': 'premium',
  'pro': 'max',
  'premium-modules': 'formation',
};

// Prix officiels par plan (source de vérité côté serveur)
const PLAN_PRICES: Record<string, number> = {
  'investisseur-plus': 9900,
  'pro': 300000,
  'premium-modules': 15000,
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

  log.info('[PawaPay] Callback dépôt reçu', { depositId, status });

  try {
    const payment = await prisma.payment.findUnique({ where: { depositId } });

    if (!payment) {
      // PawaPay renverra peut-être si on répond 404 — on log mais on répond 200
      log.warn('[PawaPay] Paiement introuvable pour ce depositId', { depositId });
      return res.status(200).json({ received: true });
    }

    // Idempotence : ne pas retraiter un paiement déjà finalisé
    if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
      return res.status(200).json({ received: true });
    }

    if (status === 'COMPLETED') {
      const tier = PLAN_TIER_MAP[payment.planId];

      if (tier) {
        // Plan d'abonnement → mettre à jour le tier en transaction atomique
        const ops: any[] = [
          prisma.payment.update({
            where: { depositId },
            data: { status: 'COMPLETED', metadata: payload as any },
          }),
          prisma.user.update({
            where: { id: payment.userId },
            data: { subscriptionTier: tier },
          }),
        ];

        // Incrémenter l'usage de la promo si ce paiement en bénéficiait
        if (payment.userPromoId) {
          ops.push(
            prisma.userPromo.update({
              where: { id: payment.userPromoId },
              data: { usedCount: { increment: 1 } },
            })
          );
        }

        await prisma.$transaction(ops);
        log.info('[PawaPay] Abonnement activé', { depositId, userId: payment.userId, tier, promoUsed: !!payment.userPromoId });
      } else {
        // Webinaire ou pack → marquer le paiement COMPLETED + lier l'inscription
        await prisma.payment.update({
          where: { depositId },
          data: { status: 'COMPLETED', metadata: payload as any },
        });

        // Trouver l'inscription et la marquer comme payée
        const meta = payment.metadata as Record<string, string> | null;
        const registrationEmail = meta?.registrationEmail;
        const where = registrationEmail
          ? { webinarId: payment.planId, email: registrationEmail }
          : payment.userId
            ? { webinarId: payment.planId, userId: payment.userId }
            : null;

        if (where) {
          const reg = await prisma.webinarRegistration.findFirst({ where });
          if (reg) {
            await prisma.webinarRegistration.update({
              where: { id: reg.id },
              data: { paymentStatus: 'paid', depositId, paidAt: new Date() },
            });

            // Email de confirmation de paiement
            sendWebinarPaymentConfirmEmail({
              email: reg.email,
              firstName: reg.firstName ?? '',
              webinarId: reg.webinarId,
              amount: payment.amount,
              currency: payment.currency,
            }).catch((err) =>
              log.error('[PawaPay] Échec email confirmation paiement', { err, depositId })
            );
          }
        }

        log.info('[PawaPay] Paiement webinaire confirmé', { depositId, planId: payment.planId });
      }
    } else if (status === 'FAILED') {
      await prisma.payment.update({
        where: { depositId },
        data: {
          status: 'FAILED',
          failureReason: payload.failureReason?.failureCode ?? 'UNKNOWN',
          metadata: payload as any,
        },
      });

      log.info('[PawaPay] Dépôt échoué', { depositId });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    log.error('[PawaPay] Erreur traitement callback dépôt', { error, depositId });
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

  log.info('[PawaPay] Callback remboursement reçu', { refundId, status });

  try {
    const refund = await prisma.refund.findUnique({ where: { refundId } });

    if (!refund) {
      log.warn('[PawaPay] Remboursement introuvable', { refundId });
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

    log.info('[PawaPay] Remboursement mis à jour', { refundId, status: newStatus });
    return res.status(200).json({ received: true });
  } catch (error) {
    log.error('[PawaPay] Erreur traitement callback remboursement', { error, refundId });
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

  const { planId, planName, currency, correspondent, phone, registrationEmail } = req.body;

  if (!planId || !planName || !currency || !correspondent || !phone) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  // Vérifier que le numéro est numérique et > 8 chiffres
  if (!/^\d{8,15}$/.test(phone)) {
    return res.status(400).json({ error: 'Numéro de téléphone invalide' });
  }

  // Déterminer le montant : appliquer la promo si l'utilisateur en a une valide
  let finalAmount: number | null = null;
  let activePromoId: string | null = null;

  const officialPrice = PLAN_PRICES[planId];
  if (officialPrice) {
    // Plan d'abonnement connu : on ignore le montant frontend et on applique le prix officiel (+ promo éventuelle)
    const promo = await prisma.userPromo.findFirst({
      where: { userId, planId, expiresAt: { gt: new Date() } },
    });

    if (promo && promo.usedCount < promo.maxUses) {
      finalAmount = Math.round(officialPrice * (1 - promo.discountPercent / 100));
      activePromoId = promo.id;
      log.info('[Promo] Réduction appliquée', { userId, planId, discountPercent: promo.discountPercent, finalAmount });
    } else {
      finalAmount = officialPrice;
    }
  } else {
    // Plan non référencé (webinaire, etc.) : on accepte le montant du frontend
    const raw = req.body.amount;
    if (!raw) return res.status(400).json({ error: 'amount requis' });
    finalAmount = Number(raw);
    if (isNaN(finalAmount) || finalAmount <= 0) return res.status(400).json({ error: 'amount invalide' });
  }

  // Description max 22 caractères (limite PawaPay)
  const description = `AfriBourse ${planName}`.slice(0, 22);

  const depositId = crypto.randomUUID();

  try {
    // Créer le paiement en base avant d'appeler PawaPay (traçabilité)
    await prisma.payment.create({
      data: {
        depositId,
        userId,
        planId,
        planName,
        amount: String(finalAmount),
        currency,
        correspondent,
        phone,
        status: 'PENDING',
        userPromoId: activePromoId ?? undefined,
        metadata: registrationEmail ? { registrationEmail } : undefined,
      },
    });

    const result = await initiateDeposit({
      depositId,
      amount: String(finalAmount),
      currency,
      correspondent,
      phone,
      description,
    });

    if (result.status === 'REJECTED') {
      await prisma.payment.update({
        where: { depositId },
        data: { status: 'FAILED', failureReason: result.rejectionReason?.rejectionCode },
      });
      log.warn('[PawaPay] Dépôt rejeté', { depositId, rejectionReason: result.rejectionReason });
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
    log.error('[PawaPay] Erreur création dépôt', { error, userId, planId });
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
    log.error('[PawaPay] Erreur création remboursement', { error, depositId });
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
