import dotenv from 'dotenv';
dotenv.config();
import path from "path";
import { Request, Response, NextFunction } from 'express';

export function verifyApiKey(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey === process.env.API_KEY) {
        next();
    } else {
        if (req.headers.accept && req.headers.accept.includes('text/html')) {
            return res.status(404).sendFile(path.join(__dirname, '../html/403.html'));
        }
        res.status(403).json({
            message: "Forbidden",
            error: "Invalid or missing API key",
            receivedApiKey: apiKey,
            expectedApiKey: process.env.API_KEY ? "Configured" : "Not configured"
        });
    }
}

export function verifyOrigin(req: Request, res: Response, next: NextFunction) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const origin: string | undefined = req.headers.origin;
    if (allowedOrigins.includes(origin as string)) {
        next();
    } else {
        res.status(403).json({
            message: "Forbidden",
            error: "Origin not allowed",
            receivedOrigin: origin,
        });
    }
}
