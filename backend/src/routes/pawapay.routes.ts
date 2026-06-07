import { Router } from 'express';
import {
  handleDepositCallback,
  handleRefundCallback,
  createDeposit,
  createRefund,
  getDepositStatus,
} from '../controllers/pawapay.controller';
import { auth, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

// --- Webhooks PawaPay (pas d'auth JWT ni CSRF — vérifiés par signature HMAC) ---
// Ces paths sont exemptés de CSRF dans index.ts via req.path.startsWith('/pawapay/webhook')
router.post('/webhook/deposit', handleDepositCallback);
router.post('/webhook/refund', handleRefundCallback);

// --- Routes dépôt : optionalAuth pour permettre les paiements anonymes (webinaires) ---
router.post('/deposit', optionalAuth, createDeposit);
router.get('/deposit/:depositId/status', optionalAuth, getDepositStatus);
// --- Remboursement : authentification requise ---
router.post('/refund', auth, createRefund);

export default router;
