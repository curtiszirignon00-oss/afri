import { Router } from 'express';
import {
  startInstallmentPlan,
  payNextInstallment,
  getMyInstallmentPlan,
  getPlanByToken,
  payByToken,
} from '../controllers/installment.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// --- Paiement échelonné (compte requis) ---
router.post('/start', auth, startInstallmentPlan);
router.post('/pay-next', auth, payNextInstallment);
router.get('/mine', auth, getMyInstallmentPlan);

// --- Lien tokenisé (email/WhatsApp, public) ---
router.get('/by-token/:token', getPlanByToken);
router.post('/by-token/:token/pay', payByToken);

export default router;
