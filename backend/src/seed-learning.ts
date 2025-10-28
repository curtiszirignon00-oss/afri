// backend/src/seed-learning.ts

import { PrismaClient } from '@prisma/client';
import { connectPrismaDatabase, disconnectPrismaDatabase } from './config/database.prisma';

const prisma = new PrismaClient();

// --- FONCTION CORRIGÉE ---
// On vérifie d'abord si le module existe par son 'slug', puis on crée ou on met à jour.
async function createOrUpdateModule(data: any) {
    const { slug, ...updateData } = data; // Extrait le slug

    if (!slug) {
        console.error(`❌ Erreur: Slug manquant pour le module: ${data.title}`);
        return;
    }

    try {
        // 1. Essayer de trouver le module existant par son slug unique
        const existingModule = await prisma.learningModule.findUnique({
            where: { slug: slug },
        });

        if (existingModule) {
            // 2a. Si trouvé, mettre à jour
            await prisma.learningModule.update({
                where: { slug: slug }, // ou where: { id: existingModule.id }
                data: updateData, // Données SANS le slug
            });
            console.log(`✅ Module ${data.order_index}: ${data.title} (slug: ${slug}) mis à jour.`);
        } else {
            // 2b. Si non trouvé, créer
            await prisma.learningModule.create({
                data: data, // Données complètes AVEC le slug
            });
            console.log(`✅ Module ${data.order_index}: ${data.title} (slug: ${slug}) créé.`);
        }
    } catch (error) {
        console.error(`❌ Erreur lors du traitement du module ${data.title} (slug: ${slug}):`, error);
        // Optionnel: Ne pas arrêter le script entier si un seul module échoue ?
        // throw error; // Décommentez pour arrêter à la première erreur
    }
}
// --- FIN CORRECTION ---


async function main() {
    await connectPrismaDatabase();
    console.log("Démarrage de l'insertion/mise à jour des modules d'apprentissage...");

    // APPELS À createOrUpdateModule (SANS le champ 'id')
    await createOrUpdateModule({
        // id: 'M0', // Ligne toujours supprimée
        title: "Prêt pour le décollage? (Mindset)",
        slug: 'pret-decollage',
        description: "Adoptez le bon état d'esprit et comprenez pourquoi la BRVM est une opportunité unique.",
        difficulty_level: 'debutant',
        content_type: 'article',
        duration_minutes: 10,
        order_index: 0,
        is_published: true,
        content: `
            <h2>1. Bienvenue dans l'Académie : Notre Mission pour Vous</h2>
            <p>Vous êtes ici parce que vous savez que l'épargne seule ne suffit pas. L'inflation érode la valeur de l'argent dormant. Notre mission chez AfriBourse est de vous prendre par la main pour transformer votre épargne en capital actif, spécifiquement sur le marché régional, la BRVM.</p>
            <p>Nous croyons que la connaissance est la clé de la confiance.</p>
            {/* ... (Reste du contenu HTML pour M0) ... */}
        `,
    });

    await createOrUpdateModule({
        // id: 'M1', // Ligne toujours supprimée
        title: "Les Fondations - Qu'est-ce que la Bourse et la BRVM?",
        slug: 'fondations-bourse-brvm',
        description: "Comprenez le rôle d'un marché financier et la distinction entre le marché primaire et secondaire.",
        difficulty_level: 'debutant',
        content_type: 'article',
        duration_minutes: 15,
        order_index: 1,
        is_published: true,
        content: `
            <h2>1. Qu'est-ce qu'un marché financier ?</h2>
            <p>C'est un lieu où l'argent rencontre des opportunités en échangeant des titres financiers (actions, obligations).</p>
            {/* ... (Reste du contenu HTML pour M1) ... */}
        `,
    });

    // ... FAIRE DE MÊME POUR TOUS LES AUTRES MODULES (M2 à M10) : utiliser createOrUpdateModule et SANS le champ 'id' ...
    // Exemple pour M2:
     await createOrUpdateModule({ 
         title: "Les Acteurs du Jeu - Qui fait quoi sur le marché?", 
         slug: 'acteurs-du-jeu', 
         // ... autres données pour M2 ... 
     });
    // ... jusqu'à M10 ...


    console.log("Traitement des modules terminé.");
    await disconnectPrismaDatabase();
}

main().catch(async (e) => {
    console.error("Erreur fatale dans le script seed:", e);
    await disconnectPrismaDatabase();
    process.exit(1);
});