// src/middleware/rateLimiter.ts
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

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
        return req.user?.id || ipKeyGenerator(req);
    },
    handler: (req, res) => {
        const resetTime = req.rateLimit?.resetTime;
        const retryAfter = resetTime ? Math.ceil(resetTime.getTime() / 1000) : 3600;
        res.status(429).json({
            error: 'Trop de publications. Vous avez atteint la limite de 10 posts par heure.',
            retryAfter
        });
    },
    skip: (req: any) => {
        // Skip rate limiting for admins/moderators
        return req.user?.role === 'admin' || req.user?.role === 'moderator';
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
        return req.user?.id || ipKeyGenerator(req);
    },
    handler: (req, res) => {
        const resetTime = req.rateLimit?.resetTime;
        const retryAfter = resetTime ? Math.ceil(resetTime.getTime() / 1000) : 3600;
        res.status(429).json({
            error: 'Trop de commentaires. Vous avez atteint la limite de 50 commentaires par heure.',
            retryAfter
        });
    },
    skip: (req: any) => {
        return req.user?.role === 'admin' || req.user?.role === 'moderator';
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
        return req.user?.id || ipKeyGenerator(req);
    },
    handler: (req, res) => {
        const resetTime = req.rateLimit?.resetTime;
        const retryAfter = resetTime ? Math.ceil(resetTime.getTime() / 1000) : 3600;
        res.status(429).json({
            error: 'Trop de publications. Vous avez atteint la limite de 15 posts par heure dans les communautés.',
            retryAfter
        });
    },
    skip: (req: any) => {
        return req.user?.role === 'admin' || req.user?.role === 'moderator';
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
        return req.user?.id || ipKeyGenerator(req);
    },
    skip: (req: any) => {
        return req.user?.role === 'admin' || req.user?.role === 'moderator';
    }
});

/**
 * Strict rate limiter for authentication endpoints
 * Limit: 5 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    // req.ip est déjà résolu correctement par Express grâce à "trust proxy 1" dans index.ts
    // Ne pas parser x-forwarded-for manuellement (spoofable et redondant)
    keyGenerator: (req) => req.ip ?? req.socket.remoteAddress ?? 'no-ip',
});

/**
 * Rate limiter for login by email (account lockout)
 * Limit: 10 failed attempts per 15 minutes per email — complète le limiter par IP
 * Empêche le brute-force d'un compte depuis plusieurs IPs simultanément
 */
export const loginEmailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        error: 'Trop de tentatives de connexion sur ce compte. Réessayez dans 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const email = req.body?.email;
        return typeof email === 'string' ? `login:${email.toLowerCase().trim()}` : `login:ip:${req.ip}`;
    },
    skip: (req) => !req.body?.email,
});

/**
 * Rate limiter for password reset requests
 * Limit: 3 attempts per hour (prevent email enumeration attacks)
 */
// Rate limiter par IP (3/h) — première barrière
export const resetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        error: 'Trop de demandes de réinitialisation. Réessayez dans une heure.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip ?? req.socket.remoteAddress ?? 'no-ip',
});

// Rate limiter par email (2/h) — max 2 tentatives par email par heure
export const resetPasswordEmailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2,
    message: {
        error: 'Trop de demandes de réinitialisation pour cette adresse. Réessayez dans une heure.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Clé = email normalisé (lowercase) — stable même depuis des IPs différentes
    keyGenerator: (req) => {
        const email = req.body?.email;
        return typeof email === 'string' ? `reset:${email.toLowerCase().trim()}` : `reset:ip:${req.ip}`;
    },
    skip: (req) => !req.body?.email, // Si pas d'email dans le body, le limiter par IP suffit
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
    keyGenerator: (req: any) => req.user?.id || ipKeyGenerator(req),
    skip: (req: any) => {
        return req.user?.role === 'admin';
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
        return req.user?.id || ipKeyGenerator(req);
    },
    handler: (req, res) => {
        const resetTime = req.rateLimit?.resetTime;
        const retryAfter = resetTime ? Math.ceil(resetTime.getTime() / 1000) : 3600;
        res.status(429).json({
            error: 'Vous avez atteint la limite de signalements pour cette heure.',
            retryAfter
        });
    },
});

