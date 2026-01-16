// src/controllers/investor-profile.controller.ts
import { Request, Response } from 'express';
import * as investorProfileService from '../services/investor-profile.service';

// Extend Request interface to include user
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
    };
}

/**
 * Get investor profile
 */
export async function getInvestorProfile(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await investorProfileService.getInvestorProfile(userId);
        res.status(200).json({ success: true, data: profile });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Update investor DNA
 */
export async function updateInvestorDNA(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await investorProfileService.updateInvestorDNA(userId, req.body);
        res.status(200).json({ success: true, data: profile });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await investorProfileService.updatePrivacySettings(userId, req.body);
        res.status(200).json({ success: true, data: profile });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Check onboarding status
 */
export async function checkOnboardingStatus(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const status = await investorProfileService.checkOnboardingStatus(userId);
        res.status(200).json({ success: true, data: status });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await investorProfileService.completeOnboarding(userId, req.body);
        res.status(200).json({ success: true, data: profile });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Sync social stats (recalculate followers, following, posts counts)
 */
export async function syncSocialStats(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userProfile = await investorProfileService.syncSocialStats(userId);
        res.status(200).json({
            success: true,
            data: {
                followers_count: userProfile.followers_count,
                following_count: userProfile.following_count,
                posts_count: userProfile.posts_count,
            }
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}
