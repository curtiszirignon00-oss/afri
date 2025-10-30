// backend/src/routes/learning.routes.ts

import { Router } from 'express';
import { LearningController } from '../controllers/learning.controller'; 
// CORRECTION: Importation de la fonction 'auth' au lieu de 'authenticateToken'
import { auth } from '../middlewares/auth.middleware'; 

const router = Router();
const learningController = new LearningController();

// Route pour obtenir tous les modules 
router.get('/', learningController.getModules);

// --- NOUVELLE ROUTE : OBTENIR LA PROGRESSION DE L'UTILISATEUR ---
// Utilise le middleware corrigé 'auth'
router.get('/progress', auth, learningController.getUserProgress);

// --- NOUVELLE ROUTE : MARQUER UN MODULE COMME COMPLÉTÉ ---
// Utilise le middleware corrigé 'auth'
router.post('/:slug/complete', auth, learningController.markAsCompleted); 

// Route pour obtenir un module par slug
router.get('/:slug', learningController.getModuleBySlug);

export default router;