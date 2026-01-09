import { Router } from 'express';
import { getPlatformStats } from '../controllers/admin.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// Obtenir toutes les statistiques de la plateforme (admin uniquement)
router.get('/platform-stats', auth, getPlatformStats);

export default router;
