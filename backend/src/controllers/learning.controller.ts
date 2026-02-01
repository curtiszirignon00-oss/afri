// backend/src/controllers/learning.controller.ts

import { Request, Response, NextFunction } from 'express';
// Assurez-vous d'importer la classe LearningServicePrisma
import { LearningServicePrisma } from '../services/learning.service.prisma';
// Import gamification services
import * as xpService from '../services/xp.service';
import * as streakService from '../services/streak.service';
import * as achievementService from '../services/achievement.service';
import * as weeklyChallengeService from '../services/weekly-challenge.service';
import { prisma } from '../config/database';

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

            // ========== GAMIFICATION TRIGGERS ==========
            let xpGained = 0;
            let bonusXP = 0;
            let newAchievements: string[] = [];

            try {
                // 1. Ajouter XP pour complétion de module (+200 XP)
                const xpResult = await xpService.addXPForAction(userId, 'MODULE_COMPLETED');
                xpGained = xpResult.xp_added;

                // 2. Enregistrer activité streak
                await streakService.recordActivity(userId, 'MODULE_COMPLETE');

                // 3. Récompenser freeze pour module complété
                await streakService.rewardFreezeForAction(userId, 'MODULE_COMPLETE');

                // 4. Vérifier bonus 3 modules/jour (+200 XP)
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const modulesToday = await prisma.learningProgress.count({
                    where: {
                        userId,
                        is_completed: true,
                        completed_at: { gte: today }
                    }
                });

                if (modulesToday === 3) {
                    const bonusResult = await xpService.addXPForAction(userId, 'DAILY_3_MODULES');
                    bonusXP = bonusResult.xp_added;
                }

                // 5. Mettre à jour progression défis hebdomadaires
                await weeklyChallengeService.updateChallengeProgress(userId, 'module', 1);

                // 6. Vérifier déblocage de badges
                const unlockedAchievements = await achievementService.checkFormationAchievements(userId);
                newAchievements = unlockedAchievements.map(a => a.name);

            } catch (gamificationError) {
                // Log l'erreur mais ne bloque pas la réponse
                console.error('Erreur gamification (module complete):', gamificationError);
            }
            // ========== FIN GAMIFICATION ==========

            return res.status(200).json({
                message: `Module ${slug} marqué comme terminé.`,
                progress: progress,
                gamification: {
                    xpGained: xpGained + bonusXP,
                    bonusXP: bonusXP > 0 ? { reason: '3 modules complétés aujourd\'hui!', amount: bonusXP } : null,
                    newAchievements
                }
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

            // ========== GAMIFICATION TRIGGERS ==========
            let xpGained = 0;
            let bonusXP = 0;
            let newAchievements: string[] = [];

            try {
                // Score >= 80% = quiz passé
                const passed = result.score >= 80;
                const perfect = result.score === 100;

                if (passed) {
                    // 1. Ajouter XP pour quiz réussi (+50 XP)
                    const xpResult = await xpService.addXPForAction(userId, 'QUIZ_PASS');
                    xpGained = xpResult.xp_added;

                    // 2. Bonus XP pour quiz parfait (+50 XP supplémentaires)
                    if (perfect) {
                        const bonusResult = await xpService.addXPForAction(userId, 'QUIZ_PERFECT');
                        bonusXP = bonusResult.xp_added;
                        // Note: Le quiz parfait est comptabilisé avec le quiz normal
                    }

                    // 3. Enregistrer activité streak
                    await streakService.recordActivity(userId, 'quiz_pass');

                    // 4. Mettre à jour progression défis hebdomadaires (quiz)
                    await weeklyChallengeService.updateChallengeProgress(userId, 'quiz', 1);

                    // 5. Vérifier déblocage de badges
                    const unlockedAchievements = await achievementService.checkFormationAchievements(userId);
                    newAchievements = unlockedAchievements.map(a => a.name);
                }

            } catch (gamificationError) {
                // Log l'erreur mais ne bloque pas la réponse
                console.error('Erreur gamification (quiz submit):', gamificationError);
            }
            // ========== FIN GAMIFICATION ==========

            return res.status(200).json({
                ...result,
                gamification: {
                    xpGained: xpGained + bonusXP,
                    bonusXP: bonusXP > 0 ? { reason: 'Quiz parfait! 100%', amount: bonusXP } : null,
                    newAchievements
                }
            });
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