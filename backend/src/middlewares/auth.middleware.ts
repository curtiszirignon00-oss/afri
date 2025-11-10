import { Request, Response, NextFunction } from "express";
import { getUserFromToken } from "../utils";

interface AuthenticatedRequest extends Request {
    user?: any;
}

export async function auth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        console.log('🔒 [AUTH] Cookies received:', req.cookies);
        console.log('🔒 [AUTH] Headers:', req.headers.cookie);

        const {user, error} = await getUserFromToken(req);

        if (!user && error) {
            console.log('❌ [AUTH] No user found, error:', error);
            return res.status(401).json({ message: "Unauthorized" });
        }

        console.log('✅ [AUTH] User authenticated:', user?.email);
        req.user = user;
        next();
        return;
    } catch (error) {
        console.log('❌ [AUTH] Exception:', error);
        return res.status(401).json({ message: "Unauthorized" });
    }
}

export async function admin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const {user, error} = await getUserFromToken(req);
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = user;
        if (req.user && req.user.role === "admin") {
            next();
        }
        return;
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}