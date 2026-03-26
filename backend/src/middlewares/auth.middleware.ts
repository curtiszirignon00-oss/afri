import { Request, Response, NextFunction } from "express";
import { getUserFromToken } from "../utils";
import { prisma } from "../config/database";

export interface AuthenticatedRequest extends Request {
    user?: any;
}

// Export alias for backwards compatibility
export type AuthRequest = AuthenticatedRequest;

export async function auth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const {user, error} = await getUserFromToken(req);

        if (!user && error) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = user;
        if (req.user && req.user.role === 'admin') {
            req.user.subscriptionTier = 'max';
        }

        // Essai gratuit : si l'utilisateur a un trial actif, lui donner accès premium
        if (req.user && req.user.subscriptionTier === 'free') {
            const trial = await prisma.freeTrial.findFirst({
                where: { userId: req.user.id, claimed: true },
                orderBy: { expiresAt: 'desc' },
            });
            if (trial?.expiresAt && new Date() < trial.expiresAt) {
                req.user.subscriptionTier = 'premium'; // accès premium pendant le trial
                req.user.hasTrial = true;
                req.user.trialExpiresAt = trial.expiresAt;
            }
        }

        next();
        return;
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}

export async function admin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const {user} = await getUserFromToken(req);
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }
        req.user = user;
        next();
        return;
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}

/**
 * Optional auth middleware - extracts user if authenticated but doesn't block unauthenticated requests
 */
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const {user} = await getUserFromToken(req);
        if (user) {
            req.user = user;
            if (user.role === 'admin') {
                req.user.subscriptionTier = 'max';
            }
        }
        next();
        return;
    } catch (error) {
        // Continue without authentication
        next();
        return;
    }
}