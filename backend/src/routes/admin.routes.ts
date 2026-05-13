import { Router } from 'express';
import { getPlatformStats, getPremiumIntents, forceVerifyUser, getTrialStats, getAIFeedbackStats, sendWebinarLaunchCampaign } from '../controllers/admin.controller';
import { admin } from '../middlewares/auth.middleware';

const router = Router();

// Obtenir toutes les statistiques de la plateforme (admin uniquement)
router.get('/platform-stats', admin, getPlatformStats);

// Obtenir la liste des utilisateurs avec intentions premium
router.get('/premium-intents', admin, getPremiumIntents);

// Forcer la vérification d'email d'un utilisateur
router.post('/force-verify-email', admin, forceVerifyUser);

// Statistiques free trial IA
router.get('/trial-stats', admin, getTrialStats);

// Statistiques feedback IA (pouces levé/baissé)
router.get('/ai-feedback-stats', admin, getAIFeedbackStats);

// Campagne email — lancement webinaires (admin uniquement, irréversible)
router.post('/send-webinar-launch-email', admin, sendWebinarLaunchCampaign);

export default router;
