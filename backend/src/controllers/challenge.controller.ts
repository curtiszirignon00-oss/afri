// src/controllers/challenge.controller.ts
import { Request, Response } from 'express';
import * as challengeService from '../services/challenge.service';
import * as leaderboardService from '../services/leaderboard.service';

// Extend Request interface to include user
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
    };
}

// ============= ENROLLMENT =============

/**
 * POST /api/challenge/enroll
 * Inscription au Challenge AfriBourse 2026
 */
export async function enrollInChallenge(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        const {
            experienceLevel,
            hasRealAccount,
            discoverySource,
            primaryGoal,
            preferredSector,
            referralCode,
        } = req.body;

        // Validation des données
        if (!experienceLevel || hasRealAccount === undefined || !discoverySource || !primaryGoal || !preferredSector) {
            return res.status(400).json({
                error: 'Données d\'inscription incomplètes. Veuillez répondre à toutes les questions.',
                required: ['experienceLevel', 'hasRealAccount', 'discoverySource', 'primaryGoal', 'preferredSector'],
            });
        }

        const result = await challengeService.enrollInChallenge(userId, {
            experienceLevel,
            hasRealAccount,
            discoverySource,
            primaryGoal,
            preferredSector,
            referralCode,
        });

        res.status(201).json({
            success: true,
            message: 'Inscription réussie au Challenge AfriBourse 2026',
            data: {
                participant: result.participant,
                wallet: {
                    id: result.wallet.id,
                    balance: result.wallet.cash_balance,
                    type: result.wallet.wallet_type,
                },
            },
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * POST /api/challenge/accept-rules
 * Acceptation du règlement
 */
export async function acceptRules(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        const participant = await challengeService.acceptChallengeRules(userId);

        res.status(200).json({
            success: true,
            message: 'Règlement accepté',
            data: participant,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

// ============= STATUS & INFO =============

/**
 * GET /api/challenge/status
 * Récupère le statut de participation de l'utilisateur
 */
export async function getChallengeStatus(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        const status = await challengeService.getChallengeStatus(userId);

        res.status(200).json({
            success: true,
            data: status,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// ============= LEADERBOARD =============

/**
 * GET /api/challenge/leaderboard
 * Récupère le classement Top 20
 */
export async function getLeaderboard(req: AuthRequest, res: Response) {
    try {
        const limit = parseInt(req.query.limit as string) || 20;

        const rankings = await leaderboardService.getLeaderboard(limit);

        res.status(200).json({
            success: true,
            data: rankings,
            count: rankings.length,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * GET /api/challenge/my-rank
 * Récupère le rang de l'utilisateur connecté
 */
export async function getMyRank(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        const rankInfo = await leaderboardService.getUserRank(userId);

        res.status(200).json({
            success: true,
            data: rankInfo,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * GET /api/challenge/statistics
 * Récupère les statistiques globales du challenge
 */
export async function getStatistics(req: AuthRequest, res: Response) {
    try {
        const stats = await leaderboardService.getChallengeStatistics();

        res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * GET /api/challenge/weekly-stocks
 * Récupère les Top/Flop 3 actions de la semaine
 */
export async function getWeeklyStocks(req: AuthRequest, res: Response) {
    try {
        const stocks = await leaderboardService.getWeeklyStockPerformance();

        res.status(200).json({
            success: true,
            data: stocks,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

// ============= ADMIN =============

/**
 * POST /api/admin/challenge/ban/:userId
 * Bannir un participant (ADMIN ONLY)
 */
export async function banParticipant(req: AuthRequest, res: Response) {
    try {
        const adminId = req.user?.id;
        const { userId } = req.params;
        const { reason } = req.body;

        if (!adminId) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        if (!reason) {
            return res.status(400).json({ error: 'Raison du bannissement requise' });
        }

        const result = await challengeService.banParticipant(userId, reason, adminId);

        res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * POST /api/admin/challenge/unban/:userId
 * Débannir un participant (ADMIN ONLY)
 */
export async function unbanParticipant(req: AuthRequest, res: Response) {
    try {
        const adminId = req.user?.id;
        const { userId } = req.params;

        if (!adminId) {
            return res.status(401).json({ error: 'Non authentifié' });
        }

        const result = await challengeService.unbanParticipant(userId, adminId);

        res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * GET /api/admin/challenge/participants
 * Liste des participants (ADMIN ONLY)
 */
export async function getParticipants(req: AuthRequest, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        const result = await challengeService.getParticipants(page, limit);

        res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
