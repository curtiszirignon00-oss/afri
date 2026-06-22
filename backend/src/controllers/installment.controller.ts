import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { log } from '../config/logger';
import { initiateDeposit, initiatePaymentPageSession } from '../services/pawapay.service';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

// ── Paramètres du paiement échelonné (Pack Parcours) ──────────────────────────
export const PACK_ID = 'pack-parcours-investisseur';
export const PACK_PLAN_NAME = 'Pack Parcours Investisseur BRVM';
export const PACK_INSTALLMENTS = [15000, 10000, 10000]; // total 35 000 (défaut/Starter)
export const INSTALLMENT_INTERVAL_DAYS = 30;
const PENDING_LOCK_MS = 3 * 60 * 1000; // anti double-paiement (3 min)
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://www.africbourse.com';

// Échéancier 3× par pack (échelonné = plein tarif, sans réduction)
const PACK_TIER_INSTALLMENTS: Record<string, number[]> = {
  starter:      [15000, 10000, 10000], // 35 000
  parcours:     [20000, 15000, 15000], // 50 000
  investisseur: [25000, 25000, 25000], // 75 000
};
const PACK_TIER_NAME: Record<string, string> = {
  starter:      'Pack Starter BRVM',
  parcours:     'Pack Parcours Investisseur BRVM',
  investisseur: 'Pack Investisseur BRVM',
};
function resolveTier(pack: unknown): string {
  return ['starter', 'parcours', 'investisseur'].includes(pack as string) ? (pack as string) : 'starter';
}

export interface InstallmentLine {
  index: number;        // 1-based
  amount: number;
  status: 'pending' | 'paid';
  dueAt: string;        // ISO
  depositId?: string;
  paidAt?: string;      // ISO
  pendingAt?: string;   // ISO — verrou anti double-paiement
}

function buildSchedule(amounts: number[] = PACK_INSTALLMENTS): InstallmentLine[] {
  const now = Date.now();
  return amounts.map((amount, i) => ({
    index: i + 1,
    amount,
    status: 'pending',
    dueAt: new Date(now + i * INSTALLMENT_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

function publicPlan(plan: any) {
  const schedule = (plan.schedule as InstallmentLine[]) ?? [];
  const next = schedule.find((l) => l.status === 'pending') ?? null;
  return {
    id: plan.id,
    planId: plan.planId,
    planName: plan.planName,
    currency: plan.currency,
    totalAmount: plan.totalAmount,
    installmentsTotal: plan.installmentsTotal,
    installmentsPaid: plan.installmentsPaid,
    amountPaid: plan.amountPaid,
    status: plan.status,
    nextDueAt: plan.nextDueAt,
    schedule: schedule.map(({ pendingAt, ...rest }) => rest), // ne pas exposer le verrou
    nextInstallment: next ? { index: next.index, amount: next.amount, dueAt: next.dueAt } : null,
    payToken: plan.payToken,
  };
}

interface InitResult {
  ok: boolean;
  depositId?: string;
  redirectUrl?: string;
  status?: number;
  error?: string;
}

/**
 * Initie le dépôt PawaPay pour la prochaine mensualité due d'un plan.
 * Crée un vrai Payment (metadata installmentPlanId/installmentIndex) afin que
 * le webhook handleDepositCallback traite la progression.
 */
async function initiateInstallment(
  plan: any,
  correspondent: string,
  phone: string,
  currency: string,
  returnUrl?: string,
): Promise<InitResult> {
  if (plan.status !== 'active') {
    return { ok: false, status: 409, error: 'Ce plan de paiement est déjà clôturé.' };
  }
  if (!/^\d{8,15}$/.test(phone)) {
    return { ok: false, status: 400, error: 'Numéro de téléphone invalide' };
  }

  const schedule = (plan.schedule as InstallmentLine[]) ?? [];
  const next = schedule.find((l) => l.status === 'pending');
  if (!next) {
    return { ok: false, status: 409, error: 'Toutes les mensualités sont déjà réglées.' };
  }
  // Verrou anti double-paiement
  if (next.pendingAt && Date.now() - new Date(next.pendingAt).getTime() < PENDING_LOCK_MS) {
    return { ok: false, status: 409, error: 'Un paiement est déjà en cours pour cette mensualité.' };
  }

  const depositId = crypto.randomUUID();
  const description = `AfriBourse ${plan.planName}`.slice(0, 22);

  // Trace en base avant l'appel PawaPay
  await prisma.payment.create({
    data: {
      depositId,
      userId: plan.userId,
      planId: plan.planId,
      planName: plan.planName,
      amount: String(next.amount),
      currency,
      correspondent,
      phone,
      status: 'PENDING',
      metadata: {
        registrationEmail: plan.email,
        installmentPlanId: plan.id,
        installmentIndex: next.index,
      },
    },
  });

  // Marquer la ligne comme « en cours »
  const updatedSchedule = schedule.map((l) =>
    l.index === next.index ? { ...l, depositId, pendingAt: new Date().toISOString() } : l,
  );
  await prisma.installmentPlan.update({
    where: { id: plan.id },
    data: { schedule: updatedSchedule as any },
  });

  // Wave : pas de dépôt direct → Payment Page (redirection)
  if (String(correspondent).toUpperCase().startsWith('WAVE')) {
    try {
      const country = String(correspondent).split('_').pop() || undefined;
      const session = await initiatePaymentPageSession({
        depositId,
        returnUrl: returnUrl || `${FRONTEND_URL}/paiement/retour`,
        amount: String(next.amount),
        country,
        reason: plan.planName.slice(0, 50),
        statementDescription: description,
        language: 'FR',
      });
      log.info('[Installment] Session Wave initiée', { depositId, planId: plan.id, index: next.index });
      return { ok: true, redirectUrl: session.redirectUrl };
    } catch (err) {
      await prisma.payment.update({ where: { depositId }, data: { status: 'FAILED', failureReason: 'WAVE_SESSION_ERROR' } }).catch(() => {});
      await prisma.installmentPlan.update({
        where: { id: plan.id },
        data: { schedule: schedule.map((l) => (l.index === next.index ? { ...l, pendingAt: undefined } : l)) as any },
      }).catch(() => {});
      log.error('[Installment] Échec session Wave', { err, planId: plan.id });
      return { ok: false, status: 502, error: "Impossible d'initier le paiement Wave. Réessayez." };
    }
  }

  try {
    const result = await initiateDeposit({ depositId, amount: String(next.amount), currency, correspondent, phone, description });
    if (result.status === 'REJECTED') {
      await prisma.payment.update({
        where: { depositId },
        data: { status: 'FAILED', failureReason: result.rejectionReason?.rejectionCode },
      });
      // Libérer le verrou
      await prisma.installmentPlan.update({
        where: { id: plan.id },
        data: { schedule: schedule.map((l) => (l.index === next.index ? { ...l, pendingAt: undefined } : l)) as any },
      });
      log.warn('[Installment] Dépôt rejeté', { depositId, planId: plan.id });
      return { ok: false, status: 422, error: 'Dépôt refusé par PawaPay. Vérifiez votre numéro et votre solde.' };
    }
    log.info('[Installment] Dépôt initié', { depositId, planId: plan.id, index: next.index, amount: next.amount });
    return { ok: true, depositId };
  } catch (err) {
    await prisma.payment.update({ where: { depositId }, data: { status: 'FAILED', failureReason: 'INIT_ERROR' } }).catch(() => {});
    log.error('[Installment] Erreur initiation dépôt', { err, planId: plan.id });
    return { ok: false, status: 500, error: 'Erreur serveur lors de l\'initiation du paiement.' };
  }
}

// ── POST /api/installments/start (auth) ───────────────────────────────────────
export async function startInstallmentPlan(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Connexion requise pour payer en plusieurs fois.' });

  const { name, firstName, lastName, email, phone, correspondent, payPhone, currency = 'XOF' } = req.body;
  const resolvedEmail = (email ?? req.user?.email ?? '').trim().toLowerCase();
  if (!resolvedEmail) return res.status(400).json({ error: 'Email requis.' });
  if (!correspondent || !payPhone) return res.status(400).json({ error: 'Opérateur et numéro Mobile Money requis.' });

  const tier = resolveTier(req.body.pack);
  const tierAmounts = PACK_TIER_INSTALLMENTS[tier];
  const tierName = PACK_TIER_NAME[tier];

  try {
    // Refus si la registration pack est déjà payée
    const existingReg = await prisma.webinarRegistration.findFirst({ where: { webinarId: PACK_ID, email: resolvedEmail } });
    if (existingReg?.paymentStatus === 'paid') {
      return res.status(409).json({ error: 'Vous avez déjà réglé ce parcours.' });
    }

    // Refus si un plan échelonné actif existe déjà
    const existingPlan = await prisma.installmentPlan.findFirst({
      where: { userId, planId: PACK_ID, status: 'active' },
    });
    if (existingPlan) {
      return res.status(409).json({ error: 'Un plan de paiement échelonné est déjà en cours.', plan: publicPlan(existingPlan) });
    }

    // Pré-inscription (créer si absente)
    const resolvedFirstName = firstName ?? name ?? null;
    if (!existingReg) {
      await prisma.webinarRegistration.create({
        data: {
          webinarId: PACK_ID,
          type: 'pack',
          firstName: resolvedFirstName,
          lastName: lastName ?? null,
          email: resolvedEmail,
          phone: phone ?? null,
          earlyBird: false,
          userId,
          paymentStatus: 'pending',
          pack: tier,
        },
      });
    }

    const schedule = buildSchedule(tierAmounts);
    const plan = await prisma.installmentPlan.create({
      data: {
        userId,
        email: resolvedEmail,
        planId: PACK_ID,
        planName: tierName,
        currency,
        totalAmount: tierAmounts.reduce((a, b) => a + b, 0),
        installmentsTotal: tierAmounts.length,
        schedule: schedule as any,
        nextDueAt: new Date(schedule[0].dueAt),
        payToken: crypto.randomBytes(24).toString('hex'),
      },
    });

    const result = await initiateInstallment(plan, correspondent, payPhone, currency, req.body.returnUrl);
    if (!result.ok) return res.status(result.status ?? 500).json({ error: result.error });

    return res.status(201).json({ depositId: result.depositId, redirectUrl: result.redirectUrl, installmentPlanId: plan.id });
  } catch (error) {
    log.error('[Installment] Erreur start', { error, userId });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ── POST /api/installments/pay-next (auth) ────────────────────────────────────
export async function payNextInstallment(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Connexion requise.' });

  const { installmentPlanId, correspondent, phone } = req.body;
  if (!installmentPlanId || !correspondent || !phone) {
    return res.status(400).json({ error: 'installmentPlanId, correspondent et phone requis.' });
  }

  try {
    const plan = await prisma.installmentPlan.findFirst({ where: { id: installmentPlanId, userId } });
    if (!plan) return res.status(404).json({ error: 'Plan introuvable.' });

    const result = await initiateInstallment(plan, correspondent, phone, plan.currency, req.body.returnUrl);
    if (!result.ok) return res.status(result.status ?? 500).json({ error: result.error });

    return res.status(201).json({ depositId: result.depositId, redirectUrl: result.redirectUrl, installmentPlanId: plan.id });
  } catch (error) {
    log.error('[Installment] Erreur pay-next', { error, userId });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ── GET /api/installments/mine (auth) ─────────────────────────────────────────
export async function getMyInstallmentPlan(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Connexion requise.' });

  try {
    const plan = await prisma.installmentPlan.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    if (!plan) return res.json({ hasPlan: false });
    return res.json({ hasPlan: true, plan: publicPlan(plan) });
  } catch (error) {
    log.error('[Installment] Erreur mine', { error, userId });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ── GET /api/installments/by-token/:token (public) ────────────────────────────
export async function getPlanByToken(req: Request, res: Response) {
  const { token } = req.params;
  try {
    const plan = await prisma.installmentPlan.findUnique({ where: { payToken: token } });
    if (!plan) return res.status(404).json({ error: 'Plan introuvable.' });
    return res.json({ plan: publicPlan(plan) });
  } catch (error) {
    log.error('[Installment] Erreur by-token', { error });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ── POST /api/installments/by-token/:token/pay (public) ───────────────────────
export async function payByToken(req: Request, res: Response) {
  const { token } = req.params;
  const { correspondent, phone, currency } = req.body;
  if (!correspondent || !phone) return res.status(400).json({ error: 'correspondent et phone requis.' });

  try {
    const plan = await prisma.installmentPlan.findUnique({ where: { payToken: token } });
    if (!plan) return res.status(404).json({ error: 'Plan introuvable.' });

    const result = await initiateInstallment(plan, correspondent, phone, currency ?? plan.currency, req.body.returnUrl);
    if (!result.ok) return res.status(result.status ?? 500).json({ error: result.error });

    return res.status(201).json({ depositId: result.depositId, redirectUrl: result.redirectUrl, installmentPlanId: plan.id });
  } catch (error) {
    log.error('[Installment] Erreur pay-by-token', { error });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// Helper exporté pour le webhook : URL de paiement de la mensualité suivante
export function buildInstallmentPayUrl(payToken: string): string {
  return `${FRONTEND_URL}/echelonner/${payToken}`;
}
