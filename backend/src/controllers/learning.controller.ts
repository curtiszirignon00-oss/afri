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

    // 5. OBTENIR LE QUIZ D'UN MODULE (GET /api/learning-modules/:slug/quiz)
    async getModuleQuiz(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params;

            const quiz = await learningService.getModuleQuiz(slug);

            if (!quiz) {
                return res.status(404).json({ message: 'Quiz non trouvé pour ce module.' });
            }

            // Vérifier que quiz.questions existe et est un tableau
            if (!quiz.questions || !Array.isArray(quiz.questions)) {
                return res.status(500).json({ message: 'Format de quiz invalide.' });
            }

            // Ne pas renvoyer les bonnes réponses au client
            const quizWithoutAnswers = {
                ...quiz,
                questions: (quiz.questions as any[]).map((q: any) => ({
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    // Ne pas inclure correct_answer
                }))
            };

            return res.status(200).json(quizWithoutAnswers);
        } catch (error) {
            return next(error);
        }
    }

    // 6. SOUMETTRE LE QUIZ (POST /api/learning-modules/:slug/submit-quiz)
    async submitQuiz(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id as string;
            const { slug } = req.params;
            const { answers, timeSpent } = req.body; // answers = array d'index ou objet { questionId: answerIndex }

            if (!userId) {
                return res.status(401).json({ message: "Utilisateur non authentifié." });
            }

            if (!answers) {
                return res.status(400).json({ message: "Réponses invalides." });
            }

            const result = await learningService.submitQuiz(userId, slug, answers, timeSpent);

            return res.status(200).json(result);
        } catch (error: any) {
            // Gérer les erreurs personnalisées avec statusCode (ex: limite de tentatives)
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    message: error.message,
                    canRetryAt: error.canRetryAt
                });
            }
            return next(error);
        }
    }

    // 7. OBTENIR LES TENTATIVES AU QUIZ (GET /api/learning-modules/:slug/quiz-attempts)
    async getQuizAttempts(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id as string;
            const { slug } = req.params;

            if (!userId) {
                return res.status(401).json({ message: "Utilisateur non authentifié." });
            }

            const attempts = await learningService.getQuizAttempts(userId, slug);

            return res.status(200).json(attempts);
        } catch (error) {
            return next(error);
        }
    }

    // 8. OBTENIR LE RÉSUMÉ DE PROGRESSION POUR LE PROFIL (GET /api/learning/progress/summary)
    async getProgressSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id as string;

            if (!userId) {
                return res.status(401).json({ message: "Utilisateur non authentifié." });
            }

            const summary = await learningService.getProgressSummary(userId);

            return res.status(200).json({ success: true, data: summary });
        } catch (error) {
            return next(error);
        }
    }
}