import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { checkPromo } from '../controllers/promo.controller';

const router = Router();

router.get('/check', authenticateToken, checkPromo);

export default router;
