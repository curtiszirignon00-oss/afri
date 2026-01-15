/// <reference types="node" />
// backend/scripts/create-module5-quiz.ts
// Script pour créer le quiz du Module 5 - Le Temps, Votre Meilleur Allié

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule5Quiz() {
    try {
        console.log('🔍 Recherche du Module 5...');

        // Le slug est basé sur le titre du module : Le Temps, Votre Meilleur Allié
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'mental-du-gagnant' } 
        });

        if (!module) {
            console.error('❌ Module 5 non trouvé. Vérifiez le slug: le-temps-votre-meilleur-allie');
            return;
        }

        console.log(`✅ Module trouvé: ${module.title}`);

        // Vérifier si un quiz existe déjà
        const existingQuiz = await prisma.quiz.findFirst({
            where: { moduleId: module.id }
        });

        if (existingQuiz) {
            console.log('⚠️  Un quiz existe déjà pour ce module. Suppression...');
            await prisma.quiz.delete({ where: { id: existingQuiz.id } });
            console.log('🗑️  Ancien quiz supprimé');
        }

        // Créer le quiz avec 15 questions
        console.log('📝 Création du quiz avec 15 questions...');

        const quiz = await prisma.quiz.create({
            data: {
                moduleId: module.id,
                passing_score: 80,
                questions: [
                    {
                        id: 'q1',
                        question: "Quel horizon de placement est considéré comme idéal pour un objectif de 'Retraite' ou 'Indépendance Financière' ?",
                        options: [
                            "Court Terme (Moins de 2 ans)",
                            "Moins de 5 ans",
                            "Long Terme (Plus de 7 ans)",
                            "Moyen Terme (2 à 7 ans)",
                            "Très Court Terme (Moins de 6 mois)"
                        ],
                        correct_answer: 2,
                        explanation: "Le Long Terme (plus de 7 ans) est idéal car il permet aux intérêts composés et à la croissance de lisser la volatilité."
                    },
                    {
                        id: 'q2',
                        question: "Selon les principes du module, quel est le rôle principal du facteur Temps dans la gestion du risque ?",
                        options: [
                            "Il augmente nécessairement le risque de perte.",
                            "Il garantit un rendement minimum à l'échéance.",
                            "Il permet de lisser l'impact de la volatilité sur le rendement final.",
                            "Il force l'investisseur à spéculer.",
                            "Il ne concerne que le marché obligataire."
                        ],
                        correct_answer: 2,
                        explanation: "Sur le long terme, le temps permet de lisser les baisses de marché et de bénéficier pleinement des intérêts composés."
                    },
                    {
                        id: 'q3',
                        question: "Quelle est la définition de la 'Volatilité' ?",
                        options: [
                            "Le rendement annuel moyen d'un titre.",
                            "La capacité (émotionnelle) à accepter des pertes.",
                            "La durée pendant laquelle l'investisseur détient l'actif.",
                            "L'intensité et la fréquence des variations de prix d'un titre.",
                            "Le niveau d'endettement d'une entreprise."
                        ],
                        correct_answer: 3,
                        explanation: "La volatilité est la mesure de l'amplitude des mouvements de prix."
                    },
                    {
                        id: 'q4',
                        question: "Quel profil d'investisseur est défini par une Allocation d'Actifs de **80% Actions BRVM / 20% Obligations** ?",
                        options: [
                            "Prudent (Sécurité)",
                            "Équilibré (Modéré)",
                            "Dynamique (Croissance)",
                            "Spéculateur",
                            "Passif"
                        ],
                        correct_answer: 2,
                        explanation: "Une majorité d'actions est synonyme de recherche de croissance, donc d'un profil Dynamique."
                    },
                    {
                        id: 'q5',
                        question: "Si votre objectif est de constituer un 'Fonds d'Urgence' accessible dans moins de 2 ans, quelle Allocation d'Actifs est recommandée ?",
                        options: [
                            "Majorité Actions (ex: 80/20)",
                            "100% Actions à fort potentiel",
                            "Minimal (100% Liquidités / Épargne Sécurisée)",
                            "50% Actions / 50% Obligations",
                            "Uniquement des titres à rendement élevé"
                        ],
                        correct_answer: 2,
                        explanation: "Pour le court terme, le capital doit être protégé de la volatilité, d'où la nécessité de liquidités ou d'épargne sécurisée."
                    },
                    {
                        id: 'q6',
                        question: "Quelle est la définition de la 'Tolérance au Risque' ?",
                        options: [
                            "Le montant maximal garanti par l'AMF-UMOA.",
                            "Le niveau de volatilité de l'indice BRVM Composite.",
                            "La capacité (émotionnelle et financière) à accepter des pertes sur son capital.",
                            "Le rendement minimal exigé pour un investissement.",
                            "Le temps nécessaire pour vendre un actif."
                        ],
                        correct_answer: 2,
                        explanation: "Elle est à la fois psychologique ('émotionnelle') et financière (capacité à vivre sans l'argent perdu)."
                    },
                    {
                        id: 'q7',
                        question: "Lors d'une chute de marché de 15% (krach), quelle est la réaction typique de l'investisseur avec un **Profil Dynamique** selon le module ?",
                        options: [
                            "Il vend tout, pris de panique (erreur typique du débutant).",
                            "Il appelle son SGI pour se plaindre.",
                            "Il attend que ça remonte, stressé.",
                            "Il en profite pour acheter plus de titres à bas prix.",
                            "Il change son Allocation d'Actifs pour passer à 100% Obligations."
                        ],
                        correct_answer: 3,
                        explanation: "Le profil Dynamique voit la chute comme une opportunité d'achat (M6 : 'être avide quand les autres ont peur')."
                    },
                    {
                        id: 'q8',
                        question: "Quelle est la caractéristique principale d'un investisseur ayant un **Profil Prudent** ?",
                        options: [
                            "Il recherche une croissance agressive du capital.",
                            "Sa tolérance au risque est faible et il privilégie la sécurité du capital.",
                            "Il réalise des transactions quotidiennes pour maximiser les profits.",
                            "Son allocation est de 70% Actions / 30% Liquidités.",
                            "Son horizon de placement est toujours inférieur à un an."
                        ],
                        correct_answer: 1,
                        explanation: "Le Profil Prudent cherche avant tout la sécurité du capital et n'accepte qu'un niveau de risque minimal."
                    },
                    {
                        id: 'q9',
                        question: "À quel horizon de placement est typiquement associé l'objectif 'Achat automobile ou apport pour un projet' ?",
                        options: [
                            "Court Terme (Moins de 2 ans)",
                            "Moyen Terme (2 à 7 ans)",
                            "Long Terme (Plus de 7 ans)",
                            "Très Long Terme (Plus de 20 ans)",
                            "Moins de 6 mois"
                        ],
                        correct_answer: 1,
                        explanation: "L'horizon de 2 à 7 ans permet une allocation modérée pour une croissance progressive du capital sans être exposé au risque long terme."
                    },
                    {
                        id: 'q10',
                        question: "Quel terme désigne la répartition de votre capital entre les grandes classes d'actifs (Actions, Obligations, Liquidités) ?",
                        options: [
                            "Volatilité",
                            "Tolérance au Risque",
                            "Taux de Rendement",
                            "Horizon de Placement",
                            "Allocation d'Actifs"
                        ],
                        correct_answer: 4,
                        explanation: "L'Allocation d'Actifs est le mix stratégique entre les classes d'actifs."
                    },
                    {
                        id: 'q11',
                        question: "Selon le module, l'Alignement de votre horizon temporel avec votre allocation d'actifs est :",
                        options: [
                            "Optionnel si le rendement est élevé.",
                            "Strictement réservé aux produits structurés.",
                            "La première étape vers une stratégie d'investissement réussie.",
                            "Un concept dépassé par la finance comportementale.",
                            "Uniquement valable pour les obligations d'État."
                        ],
                        correct_answer: 2,
                        explanation: "L'alignement est la fondation de toute stratégie réussie (M5.3.2)."
                    },
                    {
                        id: 'q12',
                        question: "Quel titre est généralement privilégié par le Profil Dynamique sur la BRVM pour un objectif de Retraite (long terme) ?",
                        options: [
                            "Uniquement des liquidités à la banque.",
                            "Des obligations d'État à court terme.",
                            "Des actions à fort potentiel de croissance (même volatiles).",
                            "Des actions à dividendes stables mais faible croissance.",
                            "Des actions avec une forte corrélation au prix du cacao."
                        ],
                        correct_answer: 2,
                        explanation: "Le profil Dynamique cherche la croissance du capital, offerte par les actions à fort potentiel."
                    },
                    {
                        id: 'q13',
                        question: "Lors d'une chute de marché, quelle est la réaction typique de l'investisseur avec un **Profil Prudent** selon la section 5.3.1 ?",
                        options: [
                            "Il en profite pour acheter plus d'actions.",
                            "Il vend une partie des actions pour rééquilibrer vers la sécurité (Obligations).",
                            "Il reste en panique mais vend tout.",
                            "Il augmente son exposition au risque pour compenser.",
                            "Il ne regarde plus son compte pendant six mois."
                        ],
                        correct_answer: 1,
                        explanation: "Le profil Prudent, pris d'incertitude, cherche à réduire son exposition aux actions pour revenir à une allocation plus sécuritaire."
                    },
                    {
                        id: 'q14',
                        question: "Qu'est-ce que l'Horizon de Placement, selon la définition du module ?",
                        options: [
                            "La volatilité maximale acceptable.",
                            "La capacité à accepter des pertes.",
                            "Le niveau d'exposition aux actions.",
                            "La durée pendant laquelle l'investisseur prévoit de détenir l'actif.",
                            "Le rendement annuel attendu."
                        ],
                        correct_answer: 3,
                        explanation: "C'est la durée de l'engagement de l'argent."
                    },
                    {
                        id: 'q15',
                        question: "Un Profil Équilibré est typiquement associé à un objectif de Moyen Terme (2 à 7 ans). Quelle est son Allocation d'Actifs (Ex.) ?",
                        options: [
                            "100% Actions BRVM",
                            "100% Liquidités",
                            "80% Obligations / 20% Actions",
                            "50% Actions / 50% Obligations (ou 60/40)",
                            "Uniquement des Obligations d'État"
                        ],
                        correct_answer: 3,
                        explanation: "L'équilibré vise un mix modéré entre croissance et sécurité."
                    }
                ]
            }
        });

        // Mettre à jour le module pour indiquer qu'il a un quiz
        await prisma.learningModule.update({
            where: { id: module.id },
            data: { has_quiz: true }
        });

        console.log('✅ Quiz créé avec succès !');
        console.log(`  - ID: ${quiz.id}`);
        console.log(`  - Nombre de questions: ${(quiz.questions as any[])?.length || 0}`);
        console.log(`  - Score de passage: ${quiz.passing_score}%`);
        console.log('');
        console.log('📝 Note: Le système sélectionnera automatiquement 10 questions aléatoires parmi les 15 lors de chaque test.');

    } catch (error) {
        console.error('❌ Erreur lors de la création du quiz:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
createModule5Quiz();