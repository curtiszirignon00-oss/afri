import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import logger from '../config/logger';
import {
  sendWebinarConfirmationEmail,
  sendWebinarZoomLinkEmail,
  sendCohortPreregistrationEmail,
} from '../services/email.service';

// Identifiant de la cohorte courante (pré-inscriptions liste d'attente)
const COHORT_ID = 'cohorte-juillet-2026';

const PACK_WEBINAR_ID = 'pack-parcours-investisseur';

// Cohorte "budget" (page /webinaires-eco) : 20 places par pack, compteurs initiaux
const BUDGET_SEAT_LIMIT = 20;
const BUDGET_SEAT_OFFSET: Record<string, number> = { starter: 16, parcours: 18, investisseur: 9 };

/** Nombre de places réservées (offset initial + inscriptions budget réelles), plafonné à la limite. */
async function getBudgetReserved(tier: string): Promise<number> {
  const count = await prisma.webinarRegistration.count({
    where: { webinarId: PACK_WEBINAR_ID, pack: tier, variant: 'budget' },
  });
  return Math.min(BUDGET_SEAT_LIMIT, (BUDGET_SEAT_OFFSET[tier] ?? 0) + count);
}

// GET /api/webinars/cohort-seats — places restantes par pack (cohorte budget)
export async function getCohortSeats(_req: Request, res: Response, next: NextFunction) {
  try {
    const tiers = ['starter', 'parcours', 'investisseur'];
    const data: Record<string, { reserved: number; limit: number; soldOut: boolean }> = {};
    for (const t of tiers) {
      const reserved = await getBudgetReserved(t);
      data[t] = { reserved, limit: BUDGET_SEAT_LIMIT, soldOut: reserved >= BUDGET_SEAT_LIMIT };
    }
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
}

export async function preregisterWebinar(req: Request, res: Response, next: NextFunction) {
  try {
    const { webinarId, name, firstName, lastName, email, phone, type, earlyBird, referralCode, pack, variant } = req.body;
    const userId = (req as any).user?.id ?? null;
    const resolvedPack = ['starter', 'parcours', 'investisseur'].includes(pack) ? pack : null;
    const isBudget = variant === 'budget';

    if (!webinarId || !email) {
      return res.status(400).json({ message: 'webinarId et email sont requis.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Format d'email invalide." });
    }

    // Support both "name" (single field from frontend) and "firstName"/"lastName"
    const resolvedFirstName = firstName ?? name ?? null;
    const resolvedLastName = lastName ?? null;

    const existing = await prisma.webinarRegistration.findFirst({
      where: { webinarId, email },
    });

    if (existing) {
      return res.status(200).json({
        message: 'Vous êtes déjà préinscrit(e) à ce webinaire.',
        data: existing,
      });
    }

    // Cohorte budget : refuser si le pack est complet (20 places)
    if (isBudget && resolvedPack) {
      const reserved = await getBudgetReserved(resolvedPack);
      if (reserved >= BUDGET_SEAT_LIMIT) {
        return res.status(409).json({ message: 'Cohorte complète pour ce pack — plus de place disponible.' });
      }
    }

    const registration = await prisma.webinarRegistration.create({
      data: {
        webinarId,
        type: type ?? 'webinar',
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        email,
        phone: phone ?? null,
        earlyBird: earlyBird ?? false,
        userId,
        referralCode: referralCode ?? null,
        pack: resolvedPack,
        variant: isBudget ? 'budget' : null,
      },
    });

    logger.info({ webinarId, type: type ?? 'webinar', email, userId }, '[WEBINAR] Préinscription créée');

    // Email de PRÉ-INSCRIPTION (avant paiement) — uniquement pour le Pack cohorte.
    // Pour les webinaires à l'unité, l'email de confirmation est envoyé après paiement (webhook).
    const isPackPreregistration = webinarId === 'pack-parcours-investisseur' || resolvedPack !== null;
    if (isPackPreregistration) {
      sendCohortPreregistrationEmail({
        email,
        firstName: resolvedFirstName || '',
        pack: resolvedPack,
        variant: variant === 'budget' ? 'budget' : null,
      }).catch((err) => logger.error({ err, email, webinarId }, '[WEBINAR] Échec envoi email pré-inscription'));
    }

    return res.status(201).json({
      message: 'Préinscription enregistrée avec succès !',
      data: registration,
    });
  } catch (error) {
    return next(error);
  }
}

// Pré-inscription gratuite (liste d'attente) à la cohorte juillet — sans paiement
export async function cohortPreregister(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, firstName, lastName, email, phone, pack } = req.body;
    const userId = (req as any).user?.id ?? null;

    if (!email) return res.status(400).json({ message: 'Email requis.' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: "Format d'email invalide." });
    if (!phone) return res.status(400).json({ message: 'Numéro WhatsApp requis.' });

    const resolvedFirstName = firstName ?? name ?? null;
    const resolvedPack = ['starter', 'parcours', 'investisseur'].includes(pack) ? pack : null;

    const existing = await prisma.webinarRegistration.findFirst({
      where: { webinarId: COHORT_ID, email },
    });
    if (existing) {
      // Mettre à jour le pack choisi si fourni (le lead peut préciser son choix en revenant)
      if (resolvedPack && existing.pack !== resolvedPack) {
        await prisma.webinarRegistration.update({ where: { id: existing.id }, data: { pack: resolvedPack } });
      }
      return res.status(200).json({ message: 'Vous êtes déjà pré-inscrit(e) à la cohorte.', data: existing });
    }

    const registration = await prisma.webinarRegistration.create({
      data: {
        webinarId: COHORT_ID,
        type: 'cohort',
        firstName: resolvedFirstName,
        lastName: lastName ?? null,
        email,
        phone: phone ?? null,
        earlyBird: false,
        userId,
        paymentStatus: 'pending',
        pack: resolvedPack,
      },
    });

    logger.info({ email, userId }, '[WEBINAR] Pré-inscription cohorte créée');

    sendCohortPreregistrationEmail({ email, firstName: resolvedFirstName || '', pack: resolvedPack })
      .catch((err) => logger.error({ err, email }, '[WEBINAR] Échec email pré-inscription cohorte'));

    return res.status(201).json({ message: 'Pré-inscription enregistrée avec succès !', data: registration });
  } catch (error) {
    return next(error);
  }
}

export async function getWebinarCounts(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.webinarRegistration.groupBy({
      by: ['webinarId'],
      _count: { id: true },
    });
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.webinarId] = r._count.id;
    return res.status(200).json({ data: counts });
  } catch (error) {
    return next(error);
  }
}

export async function getWebinarRegistrations(req: Request, res: Response, next: NextFunction) {
  try {
    const { webinarId } = req.query;
    const where = webinarId ? { webinarId: String(webinarId) } : {};

    const registrations = await prisma.webinarRegistration.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    // Enrichir avec l'état des plans de paiement échelonné (nb payé / restant)
    const emails = Array.from(new Set(registrations.map((r) => r.email).filter(Boolean)));
    const plans = emails.length
      ? await prisma.installmentPlan.findMany({ where: { email: { in: emails } } })
      : [];
    // Un plan par email (le plus récent en priorité)
    const planByEmail = new Map<string, (typeof plans)[number]>();
    for (const p of plans) {
      const prev = planByEmail.get(p.email);
      if (!prev || new Date(p.created_at) > new Date(prev.created_at)) planByEmail.set(p.email, p);
    }

    const data = registrations.map((r) => {
      const plan = planByEmail.get(r.email);
      const installment = plan
        ? {
            paid: plan.installmentsPaid,
            total: plan.installmentsTotal,
            remaining: Math.max(0, plan.installmentsTotal - plan.installmentsPaid),
            amountPaid: plan.amountPaid,
            totalAmount: plan.totalAmount,
            currency: plan.currency,
            nextDueAt: plan.nextDueAt,
            status: plan.status,
          }
        : null;
      return { ...r, installment };
    });

    return res.status(200).json({ data, total: data.length });
  } catch (error) {
    return next(error);
  }
}

// POST /api/webinars/send-zoom-link — admin : envoyer le lien Zoom aux inscrits payés
export async function sendZoomLinkToRegistrants(req: Request, res: Response, next: NextFunction) {
  try {
    const { webinarId, zoomUrl, sessionDate } = req.body;
    if (!webinarId || !zoomUrl || !sessionDate) {
      return res.status(400).json({ message: 'webinarId, zoomUrl et sessionDate sont requis.' });
    }

    const registrations = await prisma.webinarRegistration.findMany({
      where: { webinarId, paymentStatus: 'paid' },
    });

    if (registrations.length === 0) {
      return res.status(200).json({ message: 'Aucun inscrit payé pour ce webinaire.', sent: 0 });
    }

    let sent = 0;
    let failed = 0;
    for (const reg of registrations) {
      try {
        await sendWebinarZoomLinkEmail({
          email: reg.email,
          firstName: reg.firstName ?? '',
          webinarId,
          zoomUrl,
          sessionDate,
        });
        sent++;
      } catch {
        failed++;
        logger.error({ email: reg.email, webinarId }, '[WEBINAR] Échec envoi lien Zoom');
      }
    }

    logger.info({ webinarId, sent, failed }, '[WEBINAR] Campagne lien Zoom terminée');
    return res.status(200).json({ sent, failed, total: registrations.length });
  } catch (error) {
    return next(error);
  }
}

// GET /api/webinars/stats — admin : stats de conversion paiement
export async function getWebinarPaymentStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.webinarRegistration.groupBy({
      by: ['webinarId', 'paymentStatus'],
      _count: { id: true },
    });

    const stats: Record<string, { total: number; paid: number; pending: number }> = {};
    for (const r of rows) {
      if (!stats[r.webinarId]) stats[r.webinarId] = { total: 0, paid: 0, pending: 0 };
      stats[r.webinarId].total += r._count.id;
      if (r.paymentStatus === 'paid') stats[r.webinarId].paid += r._count.id;
      else stats[r.webinarId].pending += r._count.id;
    }

    return res.status(200).json({ data: stats });
  } catch (error) {
    return next(error);
  }
}
