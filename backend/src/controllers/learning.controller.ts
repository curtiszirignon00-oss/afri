// backend/src/controllers/learning.controller.ts

import { Request, Response, NextFunction } from 'express';
// Assurez-vous d'importer la classe LearningServicePrisma
import { LearningServicePrisma } from '../services/learning.service.prisma';

// Instancie le service une seule fois
const learningService = new LearningServicePrisma();

export class LearningController {
    
    // 1. OBTENIR TOUS LES MODULES (GET /api/learning-modules)
    async getModules(req: Request, res: Response, next: NextFunction) {
        try {
            const difficulty = req.query.difficulty as string | undefined;

            const modules = await learningService.getPublishedModules(difficulty); 
            return res.status(200).json(modules);

        } catch (error) {
            // CORRECTION TS7030: Retour explicite
            return next(error); 
        }
    }

    // 2. OBTENIR UN MODULE PAR SLUG (GET /api/learning-modules/:slug)
    // NOTE: C'est la fonction que l'API utilise pour le contenu détaillé.
    async getModuleBySlug(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params;
            
            const module = await learningService.getModuleBySlug(slug);

            if (!module) {
                // CORRECTION TS7030: Retour explicite
                return res.status(404).json({ message: 'Module non trouvé.' });
            }
            return res.status(200).json(module);
        } catch (error) {
            // CORRECTION TS7030: Retour explicite
            return next(error);
        }
    }

    // 3. MARQUER COMME TERMINÉ (POST /api/learning-modules/:slug/complete)
    async markAsCompleted(req: Request, res: Response, next: NextFunction) {
        try {
            // Récupération de l'ID utilisateur via le middleware d'authentification
            const userId = (req as any).user?.id as string; 
            const { slug } = req.params;

            if (!userId) {
                // CORRECTION TS7030: Retour explicite
                return res.status(401).json({ message: "Utilisateur non authentifié. L'ID utilisateur est manquant." });
            }
            
            const progress = await learningService.markModuleAsCompleted(userId, slug);
            
            return res.status(200).json({ 
                message: `Module ${slug} marqué comme terminé.`,
                progress: progress
            });
        } catch (error) {
            // CORRECTION TS7030: Retour explicite
            return next(error);
        }
    }

    // 4. RÉCUPÉRER LA PROGRESSION (GET /api/learning-modules/progress)
    async getUserProgress(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id as string;

            if (!userId) {
                // CORRECTION TS7030: Retour explicite
                return res.status(401).json({ message: "Utilisateur non authentifié. L'ID utilisateur est manquant." });
            }

            const progress = await learningService.getUserProgress(userId);

            return res.status(200).json(progress);
        } catch (error) {
            // CORRECTION TS7030: Retour explicite
            return next(error);
        }
    }
}