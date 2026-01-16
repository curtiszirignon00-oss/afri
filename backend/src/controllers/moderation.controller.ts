// src/controllers/moderation.controller.ts
import { Request, Response } from 'express';
import * as moderationService from '../services/moderation.service';

// Extend Request interface to include user
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
    };
}

// Helper to check if user is admin/moderator
function isAdminOrModerator(role?: string): boolean {
    return role === 'admin' || role === 'moderator';
}

// ============= REPORTS =============

/**
 * Create a report
 */
export async function createReport(req: AuthRequest, res: Response) {
    try {
        const reporterId = req.user?.id;
        if (!reporterId) {
            return res.status(401).json({ error: 'Non autorisé' });
        }

        const { contentType, contentId, reason, description } = req.body;

        if (!contentType || !contentId || !reason) {
            return res.status(400).json({ error: 'Données manquantes' });
        }

        const report = await moderationService.reportContent({
            reporterId,
            contentType,
            contentId,
            reason,
            description
        });

        res.status(201).json({ success: true, data: report });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Get reports (admin only)
 */
export async function getReports(req: AuthRequest, res: Response) {
    try {
        if (!isAdminOrModerator(req.user?.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as any;
        const contentType = req.query.contentType as any;
        const reason = req.query.reason as any;

        const result = await moderationService.getReports(page, limit, {
            status,
            contentType,
            reason
        });

        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Process a report (admin only)
 */
export async function processReport(req: AuthRequest, res: Response) {
    try {
        const moderatorId = req.user?.id;
        if (!moderatorId || !isAdminOrModerator(req.user?.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const { reportId } = req.params;
        const { status, resolution } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Statut requis' });
        }

        const report = await moderationService.processReport(reportId, moderatorId, {
            status,
            resolution
        });

        res.status(200).json({ success: true, data: report });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

// ============= BANNED KEYWORDS =============

/**
 * Get banned keywords (admin only)
 */
export async function getBannedKeywords(req: AuthRequest, res: Response) {
    try {
        if (!isAdminOrModerator(req.user?.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        const result = await moderationService.getBannedKeywords(page, limit);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Add a banned keyword (admin only)
 */
export async function addBannedKeyword(req: AuthRequest, res: Response) {
    try {
        const addedById = req.user?.id;
        if (!addedById || !isAdminOrModerator(req.user?.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const { keyword, severity, category, isRegex } = req.body;

        if (!keyword) {
            return res.status(400).json({ error: 'Mot-clé requis' });
        }

        const kw = await moderationService.addBannedKeyword({
            keyword,
            severity,
            category,
            isRegex,
            addedById
        });

        res.status(201).json({ success: true, data: kw });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Remove a banned keyword (admin only)
 */
export async function removeBannedKeyword(req: AuthRequest, res: Response) {
    try {
        const removedById = req.user?.id;
        if (!removedById || !isAdminOrModerator(req.user?.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const { keywordId } = req.params;

        await moderationService.removeBannedKeyword(keywordId, removedById);
        res.status(200).json({ success: true, message: 'Mot-clé supprimé' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Toggle banned keyword active status (admin only)
 */
export async function toggleBannedKeyword(req: AuthRequest, res: Response) {
    try {
        if (!isAdminOrModerator(req.user?.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const { keywordId } = req.params;

        const kw = await moderationService.toggleBannedKeyword(keywordId);
        res.status(200).json({ success: true, data: kw });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Check text for banned keywords (internal use or admin)
 */
export async function checkBannedKeywords(req: AuthRequest, res: Response) {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Texte requis' });
        }

        const result = await moderationService.checkBannedKeywords(text);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

// ============= USER BANS =============

/**
 * Ban a user (admin only)
 */
export async function banUser(req: AuthRequest, res: Response) {
    try {
        const bannedById = req.user?.id;
        if (!bannedById || !isAdminOrModerator(req.user?.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const { userId, banType, reason, durationDays } = req.body;

        if (!userId || !banType || !reason) {
            return res.status(400).json({ error: 'Données manquantes' });
        }

        const ban = await moderationService.banUser({
            userId,
            bannedById,
            banType,
            reason,
            durationDays
        });

        res.status(201).json({ success: true, data: ban });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Unban a user (admin only)
 */
export async function unbanUser(req: AuthRequest, res: Response) {
    try {
        const liftedById = req.user?.id;
        if (!liftedById || !isAdminOrModerator(req.user?.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const { banId } = req.params;
        const { liftReason } = req.body;

        if (!liftReason) {
            return res.status(400).json({ error: 'Raison requise' });
        }

        const ban = await moderationService.unbanUser(banId, liftedById, liftReason);
        res.status(200).json({ success: true, data: ban });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Get active bans (admin only)
 */
export async function getActiveBans(req: AuthRequest, res: Response) {
    try {
        if (!isAdminOrModerator(req.user?.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await moderationService.getActiveBans(page, limit);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Check user ban status
 */
export async function getUserBanStatus(req: AuthRequest, res: Response) {
    try {
        const { userId } = req.params;

        const result = await moderationService.getUserBanStatus(userId);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Get user ban history (admin only)
 */
export async function getUserBans(req: AuthRequest, res: Response) {
    try {
        if (!isAdminOrModerator(req.user?.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const { userId } = req.params;

        const bans = await moderationService.getUserBans(userId);
        res.status(200).json({ success: true, data: bans });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

// ============= MODERATION LOGS =============

/**
 * Get moderation logs (admin only)
 */
export async function getModerationLogs(req: AuthRequest, res: Response) {
    try {
        if (!isAdminOrModerator(req.user?.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const moderatorId = req.query.moderatorId as string;
        const action = req.query.action as any;
        const targetType = req.query.targetType as any;

        const result = await moderationService.getModerationLogs(page, limit, {
            moderatorId,
            action,
            targetType
        });

        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

// ============= STATISTICS =============

/**
 * Get moderation statistics (admin only)
 */
export async function getModerationStats(req: AuthRequest, res: Response) {
    try {
        if (!isAdminOrModerator(req.user?.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const stats = await moderationService.getModerationStats();
        res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}
