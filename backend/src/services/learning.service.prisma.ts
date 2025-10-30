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
}