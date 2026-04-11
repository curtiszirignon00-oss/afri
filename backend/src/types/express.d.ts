// src/types/express.d.ts
import 'express';
import type { Options as RateLimitInfo } from 'express-rate-limit';

declare global {
    namespace Express {
        // Augmenter Express.User pour Passport (req.user dans les routes OAuth)
        interface User {
            id: string;
            email: string;
            name?: string;
            role?: string;
            subscriptionTier?: string;
        }

        interface Request {
            // Posé par auth.middleware après vérification JWT
            user?: {
                id: string;
                email: string;
                name?: string;
                role?: string;
                subscriptionTier?: string;
                hasTrial?: boolean;
                trialExpiresAt?: Date;
            };
            // Posé par level.middleware (attachLevelInfo)
            userLevel?: {
                level: number;
                totalXP: number;
                unlockedFeatures: string[];
                nextFeature: string | null;
            };
            // Posé par challenge.middleware (validateTradingHours / checkChallengeEnrollment)
            challengeStatus?: {
                enrolled: boolean;
                challengeId?: string;
                [key: string]: unknown;
            };
            // Posé par express-rate-limit
            rateLimit?: {
                limit: number;
                current: number;
                remaining: number;
                resetTime?: Date;
            };
            // Posé par un middleware request-id (ex: express-request-id)
            id?: string;
            // Posé par express-session
            sessionID?: string;
        }
    }
}

export {};
