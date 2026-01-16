// src/routes/investor-profile.routes.ts
import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import * as investorProfileController from '../controllers/investor-profile.controller';

const router = Router();

// Get investor profile
router.get('/', auth, investorProfileController.getInvestorProfile);

// Update investor DNA
router.put('/dna', auth, investorProfileController.updateInvestorDNA);

// Update privacy settings
router.put('/privacy', auth, investorProfileController.updatePrivacySettings);

// Onboarding
router.get('/onboarding/status', auth, investorProfileController.checkOnboardingStatus);
router.post('/onboarding/complete', auth, investorProfileController.completeOnboarding);

// Sync social stats
router.post('/sync-stats', auth, investorProfileController.syncSocialStats);

export default router;
