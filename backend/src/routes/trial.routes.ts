import { Router } from 'express';
import { auth, admin } from '../middlewares/auth.middleware';
import { getTrialStatus, claimTrial, sendTrialInvites } from '../controllers/trial.controller';

const router = Router();

// Statut du trial de l'utilisateur connecté
router.get('/status', auth, getTrialStatus);

// Réclamer le trial via le token du lien email (utilisateur connecté)
router.post('/claim/:token', auth, claimTrial);

// Admin : envoyer les emails d'invitation trial
router.post('/send-invites', auth, admin, sendTrialInvites);

export default router;
