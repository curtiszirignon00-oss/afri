import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { log } from '../config/logger';
import {
  initiateDeposit,
  initiateRefund,
  initiatePaymentPageSession,
  type PawaPayDepositCallback,
  type PawaPayRefundCallback,
} from '../services/pawapay.service';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://www.africbourse.com';
import { sendWebinarPaymentConfirmEmail, sendInstallmentProgressEmail } from '../services/email.service';
import { buildInstallmentPayUrl } from './installment.controller';
import { buildUserData, sendMetaEvent } from '../services/meta-capi.service';
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

// Pack Pack Parcours — prix officiels (R5: calcul serveur)
const PACK_ID = 'pack-parcours-investisseur';
const PACK_PRICE_FULL = 35000;
const PACK_PRICE_REFERRAL = 24500;

// Offre cohorte juillet — -10% pour les préinscrits jusqu'au 3 juillet
const PACK_PRICE_COHORT = 31500;
const COHORT_REG_ID = 'cohorte-juillet-2026';
const COHORT_DISCOUNT_DEADLINE = new Date('2026-07-03T23:59:59Z');

// Prix par pack (good-better-best) — comptant
const PACK_TIER_FULL: Record<string, number> = { starter: 35000, parcours: 50000, investisseur: 75000 };
const PACK_TIER_COHORT: Record<string, number> = { starter: 31500, parcours: 45000, investisseur: 67500 }; // -10%

// Réconcilie la pré-inscription cohorte (liste d'attente) en "paid" quand le pack est réglé
async function reconcileCohortPreregistration(email: string | undefined | null, depositId: string) {
  if (!email) return;
  try {
    const reg = await prisma.webinarRegistration.findFirst({ where: { webinarId: COHORT_REG_ID, email } });
    if (reg && reg.paymentStatus !== 'paid') {
      await prisma.webinarRegistration.update({
        where: { id: reg.id },
        data: { paymentStatus: 'paid', depositId, paidAt: new Date() },
      });
      log.info('[COHORT] Pré-inscription réconciliée → payée', { email });
    }
  } catch (err) {
    log.error('[COHORT] Échec réconciliation pré-inscription', { err, email });
  }
}

// ============================================================
// Meta API Conversions — évènement Purchase (serveur, source de vérité)
// event_id = depositId → dédupliqué avec un éventuel Purchase navigateur.
// Tolérant aux erreurs : ne bloque jamais le traitement du webhook.
// ============================================================
async function firePurchaseEvent(payment: any) {
  try {
    const meta = (payment.metadata as Record<string, any> | null) ?? {};
    let email: string | null = meta.registrationEmail ?? null;
    let firstName: string | null = null;
    let lastName: string | null = null;

    if (payment.userId) {
      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { email: true, name: true, lastname: true },
      });
      if (user) {
        email = email ?? user.email;
        firstName = user.name ?? null;
        lastName = user.lastname ?? null;
      }
    }

    // Pays déduit du correspondent (suffixe ISO, ex: ORANGE_CI → CI)
    const country = String(payment.correspondent || '').split('_').pop() || null;
    const value = Number(payment.amount);

    const userData = buildUserData({
      email,
      phone: payment.phone,            // numéro Mobile Money
      firstName,
      lastName,
      country: country && country.length === 2 ? country : null,
      externalId: payment.userId ?? null,
    });

    await sendMetaEvent({
      eventName: 'Purchase',
      eventId: payment.depositId,
      actionSource: 'website',
      eventSourceUrl: `${FRONTEND_URL}/paiement/retour`,
      userData,
      customData: {
        currency: payment.currency,
        value: isNaN(value) ? undefined : value,
        content_name: payment.planName,
        content_ids: [payment.planId],
        content_type: 'product',
      },
    });
  } catch (err) {
    log.error('[MetaCAPI] Échec Purchase serveur', { err, depositId: payment?.depositId });
  }
}

// ============================================================
// Paiement échelonné — traitement d'une mensualité confirmée
// ============================================================
async function handleInstallmentCompleted(payment: any, depositId: string, payload: any) {
  await prisma.payment.update({
    where: { depositId },
    data: { status: 'COMPLETED', metadata: payload as any },
  });

  const meta = payment.metadata as Record<string, any> | null;
  const planId = meta?.installmentPlanId as string | undefined;
  const installmentIndex = Number(meta?.installmentIndex);
  if (!planId || !installmentIndex) return;

  const plan = await prisma.installmentPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    log.warn('[Installment] Plan introuvable pour ce paiement', { depositId, planId });
    return;
  }

  const schedule = (plan.schedule as any[]) ?? [];
  const line = schedule.find((l) => l.index === installmentIndex);
  if (line?.status === 'paid') {
    // Déjà traité (idempotence)
    return;
  }

  const now = new Date();
  const updatedSchedule = schedule.map((l) =>
    l.index === installmentIndex
      ? { ...l, status: 'paid', depositId, paidAt: now.toISOString(), pendingAt: undefined }
      : l,
  );
  const installmentsPaid = updatedSchedule.filter((l) => l.status === 'paid').length;
  const amountPaid = updatedSchedule.filter((l) => l.status === 'paid').reduce((s, l) => s + (l.amount ?? 0), 0);
  const nextLine = updatedSchedule.find((l) => l.status === 'pending');
  const isFinal = installmentsPaid >= plan.installmentsTotal;

  await prisma.installmentPlan.update({
    where: { id: plan.id },
    data: {
      schedule: updatedSchedule as any,
      installmentsPaid,
      amountPaid,
      nextDueAt: nextLine ? new Date(nextLine.dueAt) : null,
      status: isFinal ? 'completed' : 'active',
    },
  });

  // Accès complet dès le 1er paiement
  await prisma.user.update({ where: { id: plan.userId }, data: { isPackParticipant: true } }).catch(() => {});

  const reg = await prisma.webinarRegistration.findFirst({ where: { webinarId: plan.planId, email: plan.email } });
  const firstName = reg?.firstName ?? '';

  if (isFinal) {
    if (reg) {
      await prisma.webinarRegistration.update({
        where: { id: reg.id },
        data: { paymentStatus: 'paid', depositId, paidAt: now },
      });
    }
    sendWebinarPaymentConfirmEmail({
      email: plan.email,
      firstName,
      webinarId: plan.planId,
      amount: String(plan.totalAmount),
      currency: plan.currency,
      title: plan.planName,
    }).catch((err) => log.error('[Installment] Échec email confirmation finale', { err, planId }));
    await reconcileCohortPreregistration(plan.email, depositId);
    log.info('[Installment] Plan complété', { planId, totalAmount: plan.totalAmount });
  } else {
    if (reg && reg.paymentStatus !== 'paid') {
      await prisma.webinarRegistration.update({
        where: { id: reg.id },
        data: { paymentStatus: 'partial' },
      });
    }
    if (nextLine) {
      sendInstallmentProgressEmail({
        email: plan.email,
        firstName,
        paidIndex: installmentsPaid,
        total: plan.installmentsTotal,
        amountPaid,
        nextAmount: nextLine.amount,
        nextDueAt: new Date(nextLine.dueAt),
        payUrl: buildInstallmentPayUrl(plan.payToken),
        totalAmount: plan.totalAmount,
        planName: plan.planName,
      }).catch((err) => log.error('[Installment] Échec email progression', { err, planId }));
    }
    log.info('[Installment] Mensualité confirmée', { planId, installmentsPaid, total: plan.installmentsTotal });
  }
}

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
      // Meta API Conversions — Purchase (serveur). Couvre abonnements, échelonné et webinaires/pack.
      void firePurchaseEvent(payment);

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
      } else if ((payment.metadata as any)?.installmentPlanId) {
        // ── Paiement échelonné : progression d'une mensualité ──────────────
        await handleInstallmentCompleted(payment, depositId, payload);
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

            // Email de confirmation de paiement (titre = nom du pack si pack)
            sendWebinarPaymentConfirmEmail({
              email: reg.email,
              firstName: reg.firstName ?? '',
              webinarId: reg.webinarId,
              amount: payment.amount,
              currency: payment.currency,
              title: payment.planId === PACK_ID ? payment.planName : undefined,
            }).catch((err) =>
              log.error('[PawaPay] Échec email confirmation paiement', { err, depositId })
            );

            // Réconcilier la pré-inscription cohorte (si la personne s'était pré-inscrite)
            if (payment.planId === PACK_ID) {
              await reconcileCohortPreregistration(reg.email, depositId);
            }

            // ── Logique parrainage Pack Parcours ──────────────────────────
            if (payment.planId === PACK_ID) {
              // 1. Marquer l'acheteur comme participant au pack
              if (payment.userId) {
                await prisma.user.update({
                  where: { id: payment.userId },
                  data: { isPackParticipant: true },
                }).catch(() => {});
              }

              // 2. Traitement du code ambassadeur utilisé
              const usedCode = reg.referralCode ?? (payment.metadata as Record<string, string> | null)?.referralCode;
              if (usedCode) {
                try {
                  const refCode = await prisma.packReferralCode.findUnique({ where: { code: usedCode } });
                  if (refCode && refCode.status === 'active') {
                    // R1 — Anti auto-parrainage
                    if (payment.userId && refCode.referrerId === payment.userId) {
                      log.warn('[REFERRAL] Auto-parrainage bloqué', { userId: payment.userId, code: usedCode });
                    } else {
                      // R2 — Un seul parrainage par email
                      const alreadyUsed = await prisma.packReferral.findFirst({
                        where: { refereeEmail: reg.email, discountApplied: true },
                      });
                      if (!alreadyUsed) {
                        await prisma.packReferral.create({
                          data: {
                            referralCodeId: refCode.id,
                            referrerId: refCode.referrerId,
                            refereeEmail: reg.email,
                            status: 'purchased',
                            discountApplied: true,
                            bonusGrantedAt: new Date(),
                            purchasedAt: new Date(),
                          },
                        });
                        // Incrémenter compteurs du code
                        await prisma.packReferralCode.update({
                          where: { id: refCode.id },
                          data: { totalPurchases: { increment: 1 }, bonusMonthsEarned: { increment: 1 } },
                        });
                        // Créditer le parrain
                        await prisma.user.update({
                          where: { id: refCode.referrerId },
                          data: { bonusAccompagnementMonths: { increment: 1 } },
                        });
                        log.info('[REFERRAL] Parrainage confirmé — +1 mois accompagnement crédité', {
                          referrerId: refCode.referrerId, code: usedCode, refereeEmail: reg.email,
                        });
                      }
                    }
                  }
                } catch (err) {
                  log.error('[REFERRAL] Erreur traitement parrainage', { err, code: usedCode, depositId });
                }
              }
            }
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
  const userId = req.user?.id ?? null;

  const { planId, planName, currency, correspondent, phone, registrationEmail, referralCode } = req.body;

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
    const promo = userId ? await prisma.userPromo.findFirst({
      where: { userId, planId, expiresAt: { gt: new Date() } },
    }) : null;

    if (promo && promo.usedCount < promo.maxUses) {
      finalAmount = Math.round(officialPrice * (1 - promo.discountPercent / 100));
      activePromoId = promo.id;
      log.info('[Promo] Réduction appliquée', { userId, planId, discountPercent: promo.discountPercent, finalAmount });
    } else {
      finalAmount = officialPrice;
    }
  } else if (planId === PACK_ID) {
    // R5 — Pack Parcours : montant toujours calculé côté serveur
    const cohortActive = req.body.cohortDiscount === true && new Date() <= COHORT_DISCOUNT_DEADLINE;
    const tier = ['starter', 'parcours', 'investisseur'].includes(req.body.pack) ? (req.body.pack as string) : null;
    if (referralCode) {
      const refCode = await prisma.packReferralCode.findUnique({ where: { code: String(referralCode).toUpperCase() } });
      const isValidCode = refCode && refCode.status === 'active' && refCode.expiresAt > new Date() && refCode.referrerId !== userId;
      finalAmount = isValidCode ? PACK_PRICE_REFERRAL : PACK_PRICE_FULL;
      if (isValidCode) {
        log.info('[REFERRAL] Code ambassadeur appliqué au paiement', { userId, code: referralCode, finalAmount });
      }
    } else if (cohortActive) {
      // -10% préinscrits cohorte juillet (jusqu'au 3 juillet, sinon plein tarif), selon le pack
      finalAmount = tier ? PACK_TIER_COHORT[tier] : PACK_PRICE_COHORT;
      log.info('[COHORT] Réduction -10% appliquée', { userId, tier, finalAmount });
    } else {
      finalAmount = tier ? PACK_TIER_FULL[tier] : PACK_PRICE_FULL;
    }
  } else {
    // Plan non référencé (webinaire individuel, etc.) : on accepte le montant du frontend
    const raw = req.body.amount;
    if (!raw) return res.status(400).json({ error: 'amount requis' });
    finalAmount = Number(raw);
    if (isNaN(finalAmount) || finalAmount <= 0) return res.status(400).json({ error: 'amount invalide' });
  }

  // Description max 22 caractères (limite PawaPay)
  const description = `AfriBourse ${planName}`.slice(0, 22);

  const depositId = crypto.randomUUID();

  // Wave n'est pas disponible en dépôt direct → on passe par la Payment Page (redirection)
  const isWave = String(correspondent).toUpperCase().startsWith('WAVE');

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
        metadata: (registrationEmail || referralCode) ? {
          ...(registrationEmail ? { registrationEmail } : {}),
          ...(referralCode ? { referralCode: String(referralCode).toUpperCase() } : {}),
        } : undefined,
      },
    });

    if (isWave) {
      const country = String(correspondent).split('_').pop() || undefined;
      const returnUrl = (req.body.returnUrl as string) || `${FRONTEND_URL}/paiement/retour`;
      try {
        const session = await initiatePaymentPageSession({
          depositId,
          returnUrl,
          amount: String(finalAmount),
          country,
          reason: planName.slice(0, 50),
          statementDescription: description,
          language: 'FR',
        });
        return res.status(201).json({ success: true, depositId, paymentPage: true, redirectUrl: session.redirectUrl });
      } catch (err) {
        await prisma.payment.update({ where: { depositId }, data: { status: 'FAILED', failureReason: 'WAVE_SESSION_ERROR' } }).catch(() => {});
        log.error('[PawaPay] Échec session Wave', { err, depositId });
        return res.status(502).json({ success: false, error: "Impossible d'initier le paiement Wave. Réessayez." });
      }
    }

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
  // Un utilisateur connecté ne peut consulter que ses propres paiements.
  // Les paiements anonymes (payment.userId=null) sont accessibles via depositId (UUID secret).
  if (payment.userId !== null && req.user?.role !== 'admin' && payment.userId !== userId) {
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
