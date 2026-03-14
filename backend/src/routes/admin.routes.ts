import { Router } from 'express';
import { getPlatformStats, getPremiumIntents, forceVerifyUser } from '../controllers/admin.controller';
import { admin } from '../middlewares/auth.middleware';

const router = Router();

// Obtenir toutes les statistiques de la plateforme (admin uniquement)
router.get('/platform-stats', admin, getPlatformStats);

// Obtenir la liste des utilisateurs avec intentions premium
router.get('/premium-intents', admin, getPremiumIntents);

// Forcer la vérification d'email d'un utilisateur
router.post('/force-verify-email', admin, forceVerifyUser);

export default router;
