import { Router } from 'express';
import { createCheckoutSession, handleWebhook } from '../controllers/stripe.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// Webhook Stripe — pas d'auth JWT, signature Stripe vérifiée dans le controller
router.post('/webhook', handleWebhook);

// Créer une session de paiement Stripe Checkout (authentifié)
router.post('/create-checkout-session', auth, createCheckoutSession);

export default router;
