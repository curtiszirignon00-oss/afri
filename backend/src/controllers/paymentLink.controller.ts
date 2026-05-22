import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { log } from '../config/logger';
import { initiateDeposit } from '../services/pawapay.service';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

// POST /api/payment-links — admin seulement
export async function createPaymentLink(req: Request, res: Response) {
  const { planId, planName, amount, currency = 'XOF', email, firstName, note, expiresInDays = 7 } = req.body;

  if (!planId || !planName || !amount) {
    return res.status(400).json({ message: 'planId, planName et amount sont requis.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const link = await prisma.paymentLink.create({
    data: { token, planId, planName, amount: Number(amount), currency, email, firstName, note, expiresAt },
  });

  const url = `https://www.africbourse.com/pay/${token}`;
  log.info('[PaymentLink] Lien créé', { id: link.id, planId, amount, email, url });

  return res.status(201).json({ url, token, expiresAt });
}

// GET /api/payment-links/:token — public
export async function getPaymentLink(req: Request, res: Response) {
  const { token } = req.params;

  const link = await prisma.paymentLink.findUnique({ where: { token } });

  if (!link) return res.status(404).json({ message: 'Lien introuvable.' });
  if (link.used) return res.status(410).json({ message: 'Ce lien a déjà été utilisé.' });
  if (new Date() > link.expiresAt) return res.status(410).json({ message: 'Ce lien a expiré.' });

  return res.json({
    planId: link.planId,
    planName: link.planName,
    amount: link.amount,
    currency: link.currency,
    email: link.email,
    firstName: link.firstName,
    note: link.note,
    expiresAt: link.expiresAt,
  });
}

// POST /api/payment-links/:token/pay — public (pas d'auth requise)
export async function payViaLink(req: Request, res: Response) {
  const { token } = req.params;
  const { correspondent, phone } = req.body;

  if (!correspondent || !phone) {
    return res.status(400).json({ message: 'correspondent et phone sont requis.' });
  }

  const link = await prisma.paymentLink.findUnique({ where: { token } });

  if (!link) return res.status(404).json({ message: 'Lien introuvable.' });
  if (link.used) return res.status(410).json({ message: 'Ce lien a déjà été utilisé.' });
  if (new Date() > link.expiresAt) return res.status(410).json({ message: 'Ce lien a expiré.' });

  const depositId = crypto.randomUUID();
  const description = `AfriBourse ${link.planName}`.slice(0, 22);

  const result = await initiateDeposit({
    depositId,
    amount: String(link.amount),
    currency: link.currency,
    correspondent,
    phone,
    description,
  });

  if (result.status === 'ACCEPTED') {
    await prisma.paymentLink.update({
      where: { token },
      data: { used: true, usedAt: new Date(), depositId },
    });
    log.info('[PaymentLink] Paiement initié', { token, depositId, amount: link.amount });
    return res.json({ status: 'ACCEPTED', depositId });
  }

  const rejCode = (result as any).rejectionReason?.rejectionCode ?? '';
  log.warn('[PaymentLink] Paiement refusé', { token, rejCode });
  return res.status(422).json({
    status: 'REJECTED',
    error: `Dépôt refusé par PawaPay${rejCode ? ` [${rejCode}]` : ''}`,
  });
}
