import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import { checkPromo } from '../controllers/promo.controller';

const router = Router();

router.get('/check', auth, checkPromo);

export default router;
