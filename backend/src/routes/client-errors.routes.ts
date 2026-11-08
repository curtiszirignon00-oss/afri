import { Router } from 'express';
import { reportClientError } from '../controllers/client-errors.controller';
import { optionalAuth } from '../middlewares/auth.middleware';
import { generalApiLimiter } from '../middleware/rateLimiter';

const router = Router();

// Remontée des erreurs front — public, identifie l'utilisateur s'il est connecté
router.post('/', generalApiLimiter, optionalAuth, reportClientError);

export default router;
