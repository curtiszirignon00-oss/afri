// backend/src/services/learning.service.prisma.ts

import prisma from '../config/prisma';
import { LearningModule } from '@prisma/client';
// Import a sanitizer library (install it first: npm install sanitize-html @types/sanitize-html)
import sanitizeHtml from 'sanitize-html'; 

export async function getPublishedModules(difficulty?: string): Promise<LearningModule[]> {
  try {
    const whereClause: { is_published: boolean; difficulty_level?: string } = {
      is_published: true,
    };

    // Add difficulty filter if provided and not 'all'
    if (difficulty && difficulty !== 'all') {
      whereClause.difficulty_level = difficulty;
    }

    const modules = await prisma.learningModule.findMany({
      where: whereClause,
      orderBy: {
        order_index: 'asc', // Order by the specified index
      },
    });

    // --- SECURITY: Sanitize HTML content before sending to frontend ---
    const sanitizedModules = modules.map(module => ({
        ...module,
        // Allow basic formatting tags, but remove scripts, styles, etc.
        content: module.content ? sanitizeHtml(module.content, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'u', 's', 'a', 'br' ]),
            allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                'a': [ 'href', 'target' ],
                'img': [ 'src', 'alt' ]
            }
        }) : null, // Ensure content can be null
    }));
    // --- END SANITIZATION ---


    return sanitizedModules; // Return the cleaned modules
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des modules d'apprentissage:`, error);
    throw error;
  }
}