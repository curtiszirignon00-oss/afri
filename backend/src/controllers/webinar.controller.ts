import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import logger from '../config/logger';
import { sendWebinarConfirmationEmail } from '../services/email.service';

export async function preregisterWebinar(req: Request, res: Response, next: NextFunction) {
  try {
    const { webinarId, name, firstName, lastName, email, phone, type, earlyBird } = req.body;
    const userId = (req as any).user?.id ?? null;

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
      },
    });

    logger.info({ webinarId, type: type ?? 'webinar', email, userId }, '[WEBINAR] Préinscription créée');

    // Confirmation email — fire-and-forget (ne bloque pas la réponse)
    sendWebinarConfirmationEmail({
      email,
      firstName: resolvedFirstName || '',
      webinarId,
      earlyBird: earlyBird ?? false,
      registrationId: registration.id,
    }).catch((err) => logger.error({ err, email, webinarId }, '[WEBINAR] Échec envoi email confirmation'));

    return res.status(201).json({
      message: 'Préinscription enregistrée avec succès !',
      data: registration,
    });
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

    return res.status(200).json({ data: registrations, total: registrations.length });
  } catch (error) {
    return next(error);
  }
}
