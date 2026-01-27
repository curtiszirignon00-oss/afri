// backend/src/services/learning.service.prisma.ts

import prisma from '../config/prisma';
import { LearningModule } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';

const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
    'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'u', 's', 'a', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'
]);

const allowedAttributes = {
    ...sanitizeHtml.defaults.allowedAttributes,
    'a': ['href', 'target'],
    'img': ['src', 'alt'],
    'table': ['class'],
    'th': ['class'],
    'td': ['class'],
    'div': ['class', 'data-slide'],
    '*': ['class'],
};

export class LearningServicePrisma {

    // Utilitaire de sécurisation du contenu HTML
    private sanitizeContent(content: string | null): string | null {
        if (!content) return null;

        // Correction pour les formules mathématiques (LaTeX)
        let cleanedContent = content.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
        cleanedContent = cleanedContent.replace(/\\\(/g, '$').replace(/\\\)/g, '$');

        return sanitizeHtml(cleanedContent, {
            allowedTags: allowedTags,
            allowedAttributes: allowedAttributes,
            // Permet TOUTES les classes CSS via regex
            allowedClasses: {
                '*': [/^.*$/]
            }
        });
    }

    // --- 1. RÉCUPÉRER LES MODULES PUBLIÉS ---
    async getPublishedModules(difficulty?: string): Promise<LearningModule[]> {
        try {
            const whereClause: { is_published: boolean; difficulty_level?: string } = {
                is_published: true,
            };

            if (difficulty && difficulty !== 'all') {
                whereClause.difficulty_level = difficulty;
            }

            const modules = await prisma.learningModule.findMany({
                where: whereClause,
                orderBy: {
                    order_index: 'asc',
                },
            });

            // Sécurisation
            return modules.map(module => ({
                ...module,
                content: this.sanitizeContent(module.content),
            }));

        } catch (error) {
            console.error(`❌ Erreur lors de la récupération des modules d'apprentissage:`, error);
            throw error;
        }
    }

    // --- 2. RÉCUPÉRER UN MODULE PAR SLUG ---
    async getModuleBySlug(slug: string): Promise<LearningModule | null> {
        try {
            // CORRECTION: findUnique remplacé par findFirst pour résoudre l'erreur de typage TypeScript.
            const module = await prisma.learningModule.findFirst({
                where: { slug: slug },
            });

            if (!module) return null;

            // Sécurisation
            return {
                ...module,
                content: this.sanitizeContent(module.content),
            };
        } catch (error) {
            console.error(`❌ Erreur lors de la récupération du module par slug:`, error);
            throw error;
        }
    }

    // --- 3. MARQUER UN MODULE COMME TERMINÉ ---
    async markModuleAsCompleted(userId: string, moduleSlug: string) {
        // CORRECTION: findUnique remplacé par findFirst pour résoudre l'erreur de typage TypeScript.
        const module = await prisma.learningModule.findFirst({
            where: { slug: moduleSlug },
            select: { id: true },
        });

        if (!module) {
            throw new Error('Module non trouvé.');
        }

        const moduleId = module.id;
        const now = new Date();

        // Utiliser upsert pour simplifier le logic: créer ou mettre à jour
        return prisma.learningProgress.upsert({
            where: {
                // Cette clé doit exister comme @@unique([userId, moduleId]) dans schema.prisma
                userId_moduleId: {
                    userId: userId,
                    moduleId: moduleId,
                }
            },
            update: {
                is_completed: true,
                completed_at: now,
                last_accessed_at: now,
            },
            create: {
                userId: userId,
                moduleId: moduleId,
                is_completed: true,
                completed_at: now,
                last_accessed_at: now,
            },
        });
    }

    // --- 4. RÉCUPÉRER LA PROGRESSION D'UN UTILISATEUR ---
    async getUserProgress(userId: string) {
        return prisma.learningProgress.findMany({
            where: { userId: userId },
            include: { module: { select: { slug: true, title: true, order_index: true, difficulty_level: true, duration_minutes: true } } },
            orderBy: { module: { order_index: 'asc' } }
        });
    }

    // --- 5. RÉCUPÉRER LE QUIZ D'UN MODULE ---
    async getModuleQuiz(moduleSlug: string) {
        try {
            // Trouver le module par slug
            const module = await prisma.learningModule.findFirst({
                where: { slug: moduleSlug },
                include: { quizzes: true }
            });

            if (!module) {
                throw new Error('Module non trouvé.');
            }

            if (!module.has_quiz || module.quizzes.length === 0) {
                return null;
            }

            const quiz = module.quizzes[0];
            const allQuestions = quiz.questions as any[];

            // Sélectionner aléatoirement 10 questions parmi toutes les questions disponibles
            const QUESTIONS_PER_TEST = 10;
            let selectedQuestions = allQuestions;

            if (allQuestions.length > QUESTIONS_PER_TEST) {
                // Mélanger et sélectionner 10 questions aléatoires
                const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
                selectedQuestions = shuffled.slice(0, QUESTIONS_PER_TEST);
            }

            // Debug: afficher les IDs des questions sélectionnées
            console.log('📤 Questions envoyées au frontend:', selectedQuestions.map((q: any) => ({ id: q.id, question: q.question?.substring(0, 30) })));

            // Retourner le quiz avec seulement les questions sélectionnées
            return {
                ...quiz,
                questions: selectedQuestions
            };
        } catch (error) {
            console.error(`❌ Erreur lors de la récupération du quiz:`, error);
            throw error;
        }
    }

    // --- 6. SOUMETTRE LE QUIZ ---
    async submitQuiz(userId: string, moduleSlug: string, answers: any, timeSpent?: number) {
        try {
            // Récupérer le module et son quiz
            const module = await prisma.learningModule.findFirst({
                where: { slug: moduleSlug },
                include: { quizzes: true }
            });

            if (!module || !module.has_quiz || module.quizzes.length === 0) {
                throw new Error('Quiz non trouvé pour ce module.');
            }

            const quiz = module.quizzes[0];
            const allQuestions = quiz.questions as any[];

            // Vérifier les tentatives précédentes
            const existingProgress = await prisma.learningProgress.findUnique({
                where: {
                    userId_moduleId: {
                        userId,
                        moduleId: module.id
                    }
                }
            });

            // Limiter à 2 tentatives avec délai de 8h après la 2ème tentative
            const MAX_ATTEMPTS = 2;
            const RETRY_DELAY_HOURS = 8;

            if (existingProgress && existingProgress.quiz_attempts >= MAX_ATTEMPTS) {
                const hoursSinceLastAttempt = existingProgress.last_quiz_attempt_at
                    ? (Date.now() - new Date(existingProgress.last_quiz_attempt_at).getTime()) / (1000 * 60 * 60)
                    : 999;

                if (hoursSinceLastAttempt < RETRY_DELAY_HOURS) {
                    const canRetryAt = new Date(
                        new Date(existingProgress.last_quiz_attempt_at!).getTime() + RETRY_DELAY_HOURS * 60 * 60 * 1000
                    );

                    throw {
                        statusCode: 429,
                        message: `Vous avez atteint le nombre maximum de tentatives (${MAX_ATTEMPTS}). Veuillez réessayer après ${RETRY_DELAY_HOURS}h.`,
                        canRetryAt
                    };
                }
            }

            // Gérer les réponses : soit un array [0, 1, 2, ...], soit un objet { questionId: answer }
            let answersMap: { [key: string]: number } = {};

            if (Array.isArray(answers)) {
                // Format ancien : array d'index - on suppose que c'est dans l'ordre des 10 premières questions
                // PROBLÈME : On ne sait pas quelles questions ont été envoyées !
                // SOLUTION TEMPORAIRE : Utiliser les IDs de question si disponibles
                throw new Error('Format de réponses non supporté. Veuillez utiliser le format { questionId: answer }');
            } else {
                // Format nouveau : objet { questionId: answerIndex }
                answersMap = answers;
            }

            // Calculer le score uniquement sur les questions répondues
            let correctCount = 0;
            const detailedResults: any[] = [];
            const questionIds = Object.keys(answersMap);

            // Debug: afficher les IDs des questions
            console.log('🔍 IDs des questions reçues:', questionIds);
            console.log('🔍 IDs des questions dans la base:', allQuestions.map((q: any) => q.id));

            questionIds.forEach((questionId: string) => {
                // Trouver la question dans toutes les questions
                const question = allQuestions.find((q: any) => q.id === questionId);

                if (!question) {
                    console.warn(`⚠️ Question ${questionId} non trouvée dans le quiz. Questions disponibles:`, allQuestions.map((q: any) => q.id));
                    return;
                }

                const userAnswer = answersMap[questionId];
                const isCorrect = userAnswer === question.correct_answer;

                if (isCorrect) {
                    correctCount++;
                }

                detailedResults.push({
                    questionId: question.id,
                    question: question.question,
                    userAnswer,
                    correctAnswer: question.correct_answer,
                    isCorrect,
                    explanation: question.explanation || null
                });
            });

            const totalQuestions = questionIds.length;
            const score = Math.round((correctCount / totalQuestions) * 100);
            const passed = score >= quiz.passing_score;

            // Calculer les nouvelles tentatives
            const newAttempts = existingProgress ? existingProgress.quiz_attempts + 1 : 1;

            // Mettre à jour la progression
            const progress = await prisma.learningProgress.upsert({
                where: {
                    userId_moduleId: {
                        userId,
                        moduleId: module.id
                    }
                },
                update: {
                    quiz_score: score,
                    quiz_attempts: newAttempts,
                    last_quiz_attempt_at: new Date(),
                    is_completed: passed,
                    completed_at: passed ? new Date() : null,
                    last_accessed_at: new Date(),
                    time_spent_minutes: timeSpent ? (existingProgress?.time_spent_minutes || 0) + timeSpent : existingProgress?.time_spent_minutes
                },
                create: {
                    userId,
                    moduleId: module.id,
                    quiz_score: score,
                    quiz_attempts: 1,
                    last_quiz_attempt_at: new Date(),
                    is_completed: passed,
                    completed_at: passed ? new Date() : null,
                    last_accessed_at: new Date(),
                    time_spent_minutes: timeSpent || 0
                }
            });

            console.log('📊 Résultats du quiz à renvoyer:', {
                score,
                passed,
                totalQuestions,
                detailedResultsCount: detailedResults.length,
                detailedResults: detailedResults.slice(0, 2) // Log des 2 premiers pour debug
            });

            return {
                score,
                passed,
                passingScore: quiz.passing_score,
                correctAnswers: correctCount,
                totalQuestions: totalQuestions,
                attempts: progress.quiz_attempts,
                attemptsRemaining: Math.max(0, MAX_ATTEMPTS - progress.quiz_attempts),
                detailedResults
            };
        } catch (error: any) {
            // Propager les erreurs personnalisées (comme la limite de tentatives)
            if (error.statusCode) {
                throw error;
            }
            console.error(`❌ Erreur lors de la soumission du quiz:`, error);
            throw error;
        }
    }

    // --- 7. RÉCUPÉRER LES TENTATIVES AU QUIZ ---
    async getQuizAttempts(userId: string, moduleSlug: string) {
        try {
            const module = await prisma.learningModule.findFirst({
                where: { slug: moduleSlug },
                select: { id: true }
            });

            if (!module) {
                throw new Error('Module non trouvé.');
            }

            const progress = await prisma.learningProgress.findUnique({
                where: {
                    userId_moduleId: {
                        userId,
                        moduleId: module.id
                    }
                },
                select: {
                    quiz_attempts: true,
                    quiz_score: true,
                    last_quiz_attempt_at: true,
                    is_completed: true
                }
            });

            return progress || {
                quiz_attempts: 0,
                quiz_score: null,
                last_quiz_attempt_at: null,
                is_completed: false
            };
        } catch (error) {
            console.error(`❌ Erreur lors de la récupération des tentatives:`, error);
            throw error;
        }
    }

    // --- 8. RÉCUPÉRER LE RÉSUMÉ DE PROGRESSION POUR LE PROFIL ---
    async getProgressSummary(userId: string) {
        try {
            // Récupérer tous les modules publiés
            const totalModules = await prisma.learningModule.count({
                where: { is_published: true }
            });

            // Récupérer la progression de l'utilisateur
            const userProgress = await prisma.learningProgress.findMany({
                where: { userId },
                include: {
                    module: {
                        select: { is_published: true }
                    }
                }
            });

            // Filtrer uniquement les modules publiés
            const progressOnPublished = userProgress.filter(p => p.module?.is_published);

            // Calculer les statistiques
            const completedModules = progressOnPublished.filter(p => p.is_completed).length;
            const completedQuizzes = progressOnPublished.filter(p => p.quiz_score !== null).length;

            // Calculer le score moyen des quiz
            const quizScores = progressOnPublished
                .filter(p => p.quiz_score !== null)
                .map(p => p.quiz_score as number);

            const averageScore = quizScores.length > 0
                ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
                : 0;

            // Temps total passé
            const totalTimeSpent = progressOnPublished
                .reduce((total, p) => total + (p.time_spent_minutes || 0), 0);

            return {
                completedModules,
                totalModules,
                completedQuizzes,
                averageScore,
                totalTimeSpent,
                progressPercent: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0
            };
        } catch (error) {
            console.error(`❌ Erreur lors de la récupération du résumé de progression:`, error);
            throw error;
        }
    }
}