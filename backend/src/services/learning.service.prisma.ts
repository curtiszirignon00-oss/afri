// backend/src/services/learning.service.prisma.ts

import prisma from '../config/prisma';
import { LearningModule } from '@prisma/client';
import sanitizeHtml from 'sanitize-html'; 

const allowedTags = sanitizeHtml.defaults.allowedTags.concat([ 
    'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'u', 's', 'a', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td' 
]);

const allowedAttributes = {
    ...sanitizeHtml.defaults.allowedAttributes,
    'a': [ 'href', 'target' ],
    'img': [ 'src', 'alt' ],
    'table': ['class'],
    'th': ['class'],
    'td': ['class'],
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
            // Permet les classes pour le style Tailwind/CSS personnalisé
            allowedClasses: {
                '*': ['text-center', 'font-mono', 'my-4', 'text-xl', 'table-auto', 'w-full', 'text-left', 'border-collapse', 'border', 'border-gray-300', 'bg-gray-100', 'mt-8', 'text-lg', 'font-bold', 'text-blue-600']
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
            const questions = quiz.questions as any[];

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

            // Calculer le score
            let correctCount = 0;
            const detailedResults: any[] = [];

            // Gérer les réponses comme array ou objet
            const answersArray = Array.isArray(answers) ? answers : Object.values(answers);

            questions.forEach((question: any, index: number) => {
                const userAnswer = answersArray[index];
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

            const score = Math.round((correctCount / questions.length) * 100);
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

            return {
                score,
                passed,
                passingScore: quiz.passing_score,
                correctAnswers: correctCount,
                totalQuestions: questions.length,
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
}