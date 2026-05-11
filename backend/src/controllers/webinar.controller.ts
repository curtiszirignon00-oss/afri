import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.prisma';
import logger from '../config/logger';

const WEBINAR_IDS = ['w1', 'w2', 'w3', 'w4'];

export async function preregisterWebinar(req: Request, res: Response, next: NextFunction) {
  try {
    const { webinarId, firstName, lastName, email, phone } = req.body;
    const userId = (req as any).user?.id ?? null;

    if (!webinarId || !email) {
      return res.status(400).json({ message: 'webinarId et email sont requis.' });
    }

    if (!WEBINAR_IDS.includes(webinarId)) {
      return res.status(400).json({ message: 'webinarId invalide.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Format d'email invalide." });
    }

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
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        email,
        phone: phone ?? null,
        userId,
      },
    });

    logger.info({ webinarId, email, userId }, '[WEBINAR] Préinscription créée');

    return res.status(201).json({
      message: 'Préinscription enregistrée avec succès !',
      data: registration,
    });
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
