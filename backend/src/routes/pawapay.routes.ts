import { Router } from 'express';
import {
  handleDepositCallback,
  handleRefundCallback,
  createDeposit,
  createRefund,
  getDepositStatus,
} from '../controllers/pawapay.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// --- Webhooks PawaPay (pas d'auth JWT ni CSRF — vérifiés par signature HMAC) ---
// Ces paths sont exemptés de CSRF dans index.ts via req.path.startsWith('/pawapay/webhook')
router.post('/webhook/deposit', handleDepositCallback);
router.post('/webhook/refund', handleRefundCallback);

// --- Routes authentifiées ---
router.post('/deposit', auth, createDeposit);
router.post('/refund', auth, createRefund);
router.get('/deposit/:depositId/status', auth, getDepositStatus);

export default router;
