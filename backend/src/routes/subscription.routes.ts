import { Router } from 'express';
import {
  logSubscriptionIntent,
  getSubscriptionStats,
  getUserIntents,
} from '../controllers/subscription.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// Logger une intention d'abonnement (authentifié)
router.post('/intent', auth, logSubscriptionIntent);

// Obtenir les statistiques (admin uniquement)
router.get('/stats', auth, getSubscriptionStats);

// Obtenir les intentions d'un utilisateur
router.get('/my-intents', auth, getUserIntents);

export default router;
