import { Request, Response, NextFunction } from "express";
import { getUserFromToken } from "../utils";

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