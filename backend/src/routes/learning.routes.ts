// backend/src/routes/learning.routes.ts

import { Router } from 'express';
import { LearningController } from '../controllers/learning.controller'; 
// CORRECTION: Importation de la fonction 'auth' au lieu de 'authenticateToken'
import { auth } from '../middlewares/auth.middleware'; 

const router = Router();
const learningController = new LearningController();

// Route pour obtenir tous les modules
router.get('/', learningController.getModules);

// --- ROUTE : OBTENIR LA PROGRESSION DE L'UTILISATEUR ---
router.get('/progress', auth, learningController.getUserProgress);

// --- ROUTE : MARQUER UN MODULE COMME COMPLÉTÉ ---
router.post('/:slug/complete', auth, learningController.markAsCompleted);

// --- ROUTES QUIZ ---
// Route pour récupérer le quiz d'un module
router.get('/:slug/quiz', learningController.getModuleQuiz);

// Route pour soumettre le quiz
router.post('/:slug/submit-quiz', auth, learningController.submitQuiz);

// Route pour vérifier les tentatives restantes
router.get('/:slug/quiz-attempts', auth, learningController.getQuizAttempts);

// Route pour obtenir un module par slug (doit être en dernier pour éviter les conflits)
router.get('/:slug', learningController.getModuleBySlug);

export default router;