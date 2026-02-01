// src/routes/challenge.routes.ts
import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import * as challengeController from '../controllers/challenge.controller';
import * as challengeMiddleware from '../middleware/challenge.middleware';

const router = Router();

// ============= PUBLIC ROUTES =============
// Ces routes sont accessibles sans authentification (ex: pour afficher le call-to-action)

// GET /api/challenge/info - Informations publiques sur le challenge
router.get('/info', (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'Challenge AfriBourse 2026',
            startDate: '2026-03-02T00:00:00Z',
            initialBalance: 1000000,
            currency: 'FCFA',
            eligibilityCriteria: '5 transactions sur tickers différents',
            status: Date.now() >= new Date('2026-03-02').getTime() ? 'OPEN' : 'COMING_SOON',
        },
    });
});

// GET /api/challenge/statistics - Stats publiques
router.get('/statistics', challengeController.getStatistics);

// GET /api/challenge/leaderboard - Classement public
router.get('/leaderboard', challengeController.getLeaderboard);

// GET /api/challenge/weekly-stocks - Top/Flop actions
router.get('/weekly-stocks', challengeController.getWeeklyStocks);

// ============= AUTHENTICATED ROUTES =============

// POST /api/challenge/enroll - Inscription (nécessite auth, pas de check date)
// L'inscription est possible AVANT le 2 février, seul le trading sera bloqué
router.post(
    '/enroll',
    auth,
    challengeController.enrollInChallenge
);

// POST /api/challenge/accept-rules - Acceptation règlement
router.post(
    '/accept-rules',
    auth,
    challengeMiddleware.requireChallengeEnrollment,
    challengeController.acceptRules
);

// GET /api/challenge/status - Statut utilisateur
router.get('/status', auth, challengeController.getChallengeStatus);

// GET /api/challenge/my-rank - Rang de l'utilisateur
router.get('/my-rank', auth, challengeMiddleware.requireChallengeEnrollment, challengeController.getMyRank);

// ============= ADMIN ROUTES =============

// POST /api/admin/challenge/ban/:userId - Bannir participant
router.post(
    '/admin/ban/:userId',
    auth,
    challengeMiddleware.requireAdmin,
    challengeController.banParticipant
);

// POST /api/admin/challenge/unban/:userId - Débannir participant
router.post(
    '/admin/unban/:userId',
    auth,
    challengeMiddleware.requireAdmin,
    challengeController.unbanParticipant
);

// GET /api/admin/challenge/participants - Liste participants
router.get(
    '/admin/participants',
    auth,
    challengeMiddleware.requireAdmin,
    challengeController.getParticipants
);

export default router;
