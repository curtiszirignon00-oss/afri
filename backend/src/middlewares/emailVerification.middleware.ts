import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

/**
 * Middleware de dégradation progressive — Phase 3 (J+14).
 * Bloque les actions d'écriture (buy/sell/create portfolio) si l'email
 * n'est pas vérifié après 14 jours d'inscription.
 * Les lectures restent accessibles.
 */
export async function requireEmailVerifiedForWrite(req: Request, res: Response, next: NextFunction) {
    const userId = (req as any).user?.id;
    if (!userId) return next();

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email_verified_at: true, created_at: true },
    });

    if (!user || user.email_verified_at) return next();

    const daysSinceSignup = user.created_at
        ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    if (daysSinceSignup >= 14) {
        return res.status(403).json({
            error: 'Confirmez votre adresse email pour effectuer cette action.',
            code: 'EMAIL_VERIFICATION_REQUIRED',
            daysUntilSuspension: Math.max(0, 30 - daysSinceSignup),
        });
    }

    next();
}
