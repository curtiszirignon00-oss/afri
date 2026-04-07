// src/controllers/investor-profile.controller.ts
import { Request, Response } from 'express';
import * as investorProfileService from '../services/investor-profile.service';
import { computeInvestorScore } from '../services/investor-score.service';
import { generateBRVMAllocation } from '../services/simba-allocation.service';

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

        const { profession, phone_number } = req.body;

        // Validation des données
        if (profession && typeof profession !== 'string') {
            return res.status(400).json({ error: 'La profession doit être une chaîne de caractères' });
        }

        if (phone_number) {
            // Valider le format du numéro de téléphone
            const cleanPhone = phone_number.replace(/[\s\-]/g, '');
            if (!/^\+\d{8,15}$/.test(cleanPhone)) {
                return res.status(400).json({
                    error: 'Format de numéro de téléphone invalide (doit commencer par + suivi de 8 à 15 chiffres)'
                });
            }
        }

        const profile = await investorProfileService.completeOnboarding(userId, req.body);
        res.status(200).json({ success: true, data: profile });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Compute AI investor score (deterministic — Step 6 onboarding)
 */
export async function computeAIScore(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Non autorisé' });

        const result = computeInvestorScore(req.body);
        return res.status(200).json({ message: 'Score calculé', data: result });
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
}

/**
 * Generate BRVM sector allocation via Simba/Groq (Step 7 onboarding)
 */
export async function generateAllocation(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Non autorisé' });

        const allocation = await generateBRVMAllocation(req.body);
        return res.status(200).json({ message: 'Allocation générée', data: { allocation } });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
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
