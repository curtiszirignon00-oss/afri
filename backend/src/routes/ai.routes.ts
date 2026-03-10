import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import { askTutor, analyzeStock } from '../controllers/ai.controller';
import rateLimit from 'express-rate-limit';

// 20 appels IA par heure par utilisateur
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => (req as any).user?.id || req.ip,
  message: { success: false, message: 'Limite d\'appels IA atteinte. Réessayez dans une heure.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// Toutes les routes IA nécessitent une authentification
router.post('/tutor', auth, aiLimiter, askTutor);
router.post('/stock-analysis', auth, aiLimiter, analyzeStock);

export default router;
