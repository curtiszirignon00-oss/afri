import { Router } from 'express';
import { createPaymentLink, getPaymentLink, payViaLink } from '../controllers/paymentLink.controller';
import { admin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', admin, createPaymentLink);
router.get('/:token', getPaymentLink);
router.post('/:token/pay', payViaLink);

export default router;
