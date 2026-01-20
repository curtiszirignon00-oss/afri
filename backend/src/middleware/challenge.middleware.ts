// src/middleware/challenge.middleware.ts
import { Request, Response, NextFunction } from 'express';
import * as challengeService from '../services/challenge.service';

// Extend Request interface to include user
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
    };
    body: any;
}

/**
 * Middleware: Valide les horaires de trading pour le wallet Concours
 * Bloque les transactions le weekend et avant la date de lancement
 */
export function validateTradingHours(req: AuthRequest, res: Response, next: NextFunction) {
    // Chercher wallet_type dans body ET query pour supporter tous les cas
    const type = req.body.walletType || req.body.wallet_type ||
                 req.query.walletType || req.query.wallet_type;

    // Si ce n'est pas un wallet Concours, pas de restriction
    if (type !== 'CONCOURS') {
        return next();
    }

    // Vérifier les contraintes temporelles
    const tradeCheck = challengeService.canTrade('CONCOURS');

    if (!tradeCheck.allowed) {
        return res.status(403).json({
            error: tradeCheck.reason,
            code: 'TRADING_NOT_ALLOWED',
            walletType: 'CONCOURS',
        });
    }

    next();
}

/**
 * Middleware: Vérifie que le Challenge est ouvert (après le 2 février 2026)
 */
export function checkChallengeOpening(req: AuthRequest, res: Response, next: NextFunction) {
    const LAUNCH_DATE = new Date('2026-02-02T00:00:00Z');
    const now = new Date();

    if (now < LAUNCH_DATE) {
        const daysRemaining = Math.ceil((LAUNCH_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return res.status(403).json({
            error: `Le Challenge AfriBourse ouvre le 2 février 2026`,
            code: 'CHALLENGE_NOT_OPEN',
            launchDate: LAUNCH_DATE.toISOString(),
            daysRemaining,
        });
    }

    next();
}

/**
 * Middleware: Vérifie que l'utilisateur est inscrit au Challenge
 */
export async function requireChallengeEnrollment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        const status = await challengeService.getChallengeStatus(userId);

        if (!status.enrolled) {
            return res.status(403).json({
                error: 'Vous devez être inscrit au Challenge AfriBourse pour accéder à cette ressource',
                code: 'NOT_ENROLLED',
            });
        }

        // Ajouter le status au request pour utilisation dans les controllers
        (req as any).challengeStatus = status;

        next();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * Middleware: Vérifie que l'utilisateur a accepté le règlement
 */
export async function requireRulesAccepted(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        const status = await challengeService.getChallengeStatus(userId);

        if (!status.enrolled) {
            return res.status(403).json({
                error: 'Vous devez être inscrit au Challenge',
                code: 'NOT_ENROLLED',
            });
        }

        if (!status.acceptedRules) {
            return res.status(403).json({
                error: 'Vous devez accepter le règlement du Challenge avant de continuer',
                code: 'RULES_NOT_ACCEPTED',
            });
        }

        next();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * Middleware: Vérifie que l'utilisateur est admin
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    const userRole = req.user?.role;

    if (userRole !== 'admin' && userRole !== 'superadmin') {
        return res.status(403).json({
            error: 'Accès refusé. Privilèges administrateur requis.',
            code: 'ADMIN_REQUIRED',
        });
    }

    next();
}
