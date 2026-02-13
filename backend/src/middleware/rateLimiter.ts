// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for creating posts
 * Limit: 10 posts per hour per user
 */
export const postCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per window
    message: {
        error: 'Trop de publications. Veuillez attendre avant de publier à nouveau.',
        retryAfter: 'Réessayez dans une heure'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use user ID as key instead of IP
    keyGenerator: (req: any) => {
        return req.user?.id || req.ip;
    },
    handler: (req, res) => {
        const resetTime = (req as any).rateLimit?.resetTime;
        const retryAfter = resetTime ? Math.ceil(resetTime.getTime() / 1000) : 3600;
        res.status(429).json({
            error: 'Trop de publications. Vous avez atteint la limite de 10 posts par heure.',
            retryAfter
        });
    },
    skip: (req: any) => {
        // Skip rate limiting for admins/moderators
        return req.user?.role === 'ADMIN' || req.user?.role === 'MODERATOR';
    }
});

/**
 * Rate limiter for creating comments
 * Limit: 50 comments per hour per user
 */
export const commentCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 requests per window
    message: {
        error: 'Trop de commentaires. Veuillez attendre avant de commenter à nouveau.',
        retryAfter: 'Réessayez dans une heure'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
        return req.user?.id || req.ip;
    },
    handler: (req, res) => {
        const resetTime = (req as any).rateLimit?.resetTime;
        const retryAfter = resetTime ? Math.ceil(resetTime.getTime() / 1000) : 3600;
        res.status(429).json({
            error: 'Trop de commentaires. Vous avez atteint la limite de 50 commentaires par heure.',
            retryAfter
        });
    },
    skip: (req: any) => {
        return req.user?.role === 'ADMIN' || req.user?.role === 'MODERATOR';
    }
});

/**
 * Rate limiter for creating community posts
 * Limit: 15 posts per hour per user (slightly higher for communities)
 */
export const communityPostCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 15,
    message: {
        error: 'Trop de publications dans les communautés. Veuillez attendre.',
        retryAfter: 'Réessayez dans une heure'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
        return req.user?.id || req.ip;
    },
    handler: (req, res) => {
        const resetTime = (req as any).rateLimit?.resetTime;
        const retryAfter = resetTime ? Math.ceil(resetTime.getTime() / 1000) : 3600;
        res.status(429).json({
            error: 'Trop de publications. Vous avez atteint la limite de 15 posts par heure dans les communautés.',
            retryAfter
        });
    },
    skip: (req: any) => {
        return req.user?.role === 'ADMIN' || req.user?.role === 'MODERATOR';
    }
});

/**
 * Rate limiter for API requests (general)
 * Limit: 100 requests per 15 minutes
 */
export const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        error: 'Trop de requêtes. Veuillez ralentir.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
        return req.user?.id || req.ip;
    },
    skip: (req: any) => {
        return req.user?.role === 'ADMIN' || req.user?.role === 'MODERATOR';
    }
});

/**
 * Strict rate limiter for authentication endpoints
 * Limit: 5 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        error: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Rate limiter for password reset requests
 * Limit: 3 attempts per hour (prevent email enumeration attacks)
 */
export const resetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        error: 'Trop de demandes de réinitialisation. Réessayez dans une heure.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for trading operations (buy/sell)
 * Limit: 30 transactions per minute (prevent automated trading abuse)
 */
export const tradingLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: {
        error: 'Trop de transactions. Veuillez ralentir.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => req.user?.id || req.ip,
    skip: (req: any) => {
        return req.user?.role === 'ADMIN';
    }
});

/**
 * Rate limiter for reporting content
 * Limit: 20 reports per hour (prevent report spam)
 */
export const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: {
        error: 'Trop de signalements. Veuillez attendre avant de signaler à nouveau.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
        return req.user?.id || req.ip;
    },
    handler: (req, res) => {
        const resetTime = (req as any).rateLimit?.resetTime;
        const retryAfter = resetTime ? Math.ceil(resetTime.getTime() / 1000) : 3600;
        res.status(429).json({
            error: 'Vous avez atteint la limite de signalements pour cette heure.',
            retryAfter
        });
    },
});
