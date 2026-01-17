// backend/src/routes/learning.routes.ts

import { Router } from 'express';
import { LearningController } from '../controllers/learning.controller'; 
// CORRECTION: Importation de la fonction 'auth' au lieu de 'authenticateToken'
import { auth } from '../middlewares/auth.middleware'; 

const router = Router();
const learningController = new LearningController();

// Route pour obtenir tous les modules
router.get('/', learningController.getModules.bind(learningController));

// --- ROUTE : OBTENIR LA PROGRESSION DE L'UTILISATEUR ---
router.get('/progress', auth, learningController.getUserProgress.bind(learningController));

// --- ROUTE : OBTENIR LE RÉSUMÉ DE PROGRESSION POUR LE PROFIL ---
router.get('/progress/summary', auth, learningController.getProgressSummary.bind(learningController));

// --- ROUTE : MARQUER UN MODULE COMME COMPLÉTÉ ---
router.post('/:slug/complete', auth, learningController.markAsCompleted.bind(learningController));

// --- ROUTES QUIZ ---
// Route pour récupérer le quiz d'un module
router.get('/:slug/quiz', learningController.getModuleQuiz.bind(learningController));

// Route pour soumettre le quiz
router.post('/:slug/submit-quiz', auth, learningController.submitQuiz.bind(learningController));

// Route pour vérifier les tentatives restantes
router.get('/:slug/quiz-attempts', auth, learningController.getQuizAttempts.bind(learningController));

// Route pour obtenir un module par slug (doit être en dernier pour éviter les conflits)
router.get('/:slug', learningController.getModuleBySlug.bind(learningController));

export default router;