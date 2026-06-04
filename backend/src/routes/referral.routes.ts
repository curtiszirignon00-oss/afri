import { Router } from 'express';
import { checkReferralCode, getAmbassadorStats } from '../controllers/referral.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// Public — valider un code de parrainage
router.get('/check', checkReferralCode);

// Auth requis — stats de l'ambassadeur connecté
router.get('/my-stats', auth, getAmbassadorStats);

export default router;
