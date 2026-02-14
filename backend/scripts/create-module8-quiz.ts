/// <reference types="node" />
// backend/scripts/create-module8-quiz.ts
// Script pour mettre à jour le quiz du Module 8 - L’Évaluation d’Entreprise

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule8Quiz() {
    try {
        console.log('🔍 Recherche du Module 8 (Mise à jour)...');

        // Conservation du slug existant comme demandé
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'construire-portefeuille' } 
        });

        if (!module) {
            console.error('❌ Module 8 non trouvé. Vérifiez le slug: construire-portefeuille');
            return;
        }

        console.log(`✅ Module trouvé: ${module.title}`);

        // Vérifier si un quiz existe déjà
        const existingQuiz = await prisma.quiz.findFirst({
            where: { moduleId: module.id }
        });

        if (existingQuiz) {
            console.log('⚠️  Un quiz existe déjà pour ce module. Suppression pour mise à jour...');
            await prisma.quiz.delete({ where: { id: existingQuiz.id } });
            console.log('🗑️  Ancien quiz supprimé');
        }

        // Créer le quiz avec les 15 nouvelles questions
        console.log('📝 Création du nouveau quiz "Évaluation d\'Entreprise"...');

        const quiz = await prisma.quiz.create({
            data: {
                moduleId: module.id,
                passing_score: 80,
                questions: [
                    {
                        id: 'q1',
                        question: "Qu'est-ce que l'actualisation dans le contexte de l'analyse financière ?",
                        options: [
                            "Le fait de mettre à jour le prix d'une action chaque matin en bourse.",
                            "L'opération qui ramène des flux financiers futurs à leur valeur d'aujourd'hui.",
                            "Le calcul de la croissance du chiffre d'affaires sur les 5 dernières années.",
                            "L'augmentation systématique des dividendes d'une année sur l'autre."
                        ],
                        correct_answer: 1, // B
                        explanation: "L'actualisation est le mécanisme inverse de la capitalisation : elle permet d'estimer la valeur présente d'une somme qui sera reçue dans le futur."
                    },
                    {
                        id: 'q2',
                        question: "Pourquoi un Franc CFA reçu aujourd'hui vaut-il plus qu'un Franc CFA reçu dans un an ?",
                        options: [
                            "À cause de l'inflation et du coût d'opportunité.",
                            "Parce que les banques ferment le week-end.",
                            "Uniquement parce que le cours du Dollar change.",
                            "C'est une illusion d'optique, la valeur est strictement identique."
                        ],
                        correct_answer: 0, // A
                        explanation: "L'argent disponible aujourd'hui peut être investi pour générer des intérêts (coût d'opportunité) et ne subit pas encore l'érosion monétaire future (inflation)."
                    },
                    {
                        id: 'q3',
                        question: "Sur quel principe repose la méthode DCF (Discounted Cash Flow) ?",
                        options: [
                            "L'entreprise vaut la somme de tous ses actifs physiques (usines, stocks).",
                            "Le prix est uniquement déterminé par l'offre et la demande en bourse.",
                            "La valeur d'une entreprise est la somme de ses flux de trésorerie futurs actualisés.",
                            "Une entreprise vaut exactement 10 fois son bénéfice net."
                        ],
                        correct_answer: 2, // C
                        explanation: "Le DCF considère que la valeur intrinsèque d'un actif est égale à la somme de tout le cash qu'il générera dans le futur, ramené à sa valeur d'aujourd'hui."
                    },
                    {
                        id: 'q4',
                        question: "Quelle est la durée habituelle de la période de prévision explicite dans un modèle DCF ?",
                        options: [
                            "1 à 2 mois.",
                            "5 à 10 ans.",
                            "Exactement 50 ans.",
                            "Jusqu'à la fin de vie du fondateur."
                        ],
                        correct_answer: 1, // B
                        explanation: "C'est l'horizon de temps sur lequel un analyste peut projeter les comptes de manière raisonnablement détaillée avant de passer à la Valeur Terminale."
                    },
                    {
                        id: 'q5',
                        question: "Qu'est-ce que la Valeur Terminale (VT) dans une évaluation ?",
                        options: [
                            "Le prix de vente final de l'action par l'investisseur.",
                            "Le montant total de la dette à rembourser à la fin.",
                            "La valeur estimée de l'entreprise après la période de prévision explicite.",
                            "La valeur de l'entreprise si elle faisait faillite aujourd'hui."
                        ],
                        correct_answer: 2, // C
                        explanation: "La Valeur Terminale capture la valeur de tous les flux de trésorerie au-delà de l'horizon de prévision (ex: après la 10ème année) jusqu'à l'infini."
                    },
                    {
                        id: 'q6',
                        question: "Quelle part de la valeur totale d'une entreprise la Valeur Terminale représente-t-elle souvent ?",
                        options: [
                            "Moins de 5 %.",
                            "Exactement 100 %.",
                            "70 % à 80 %.",
                            "Seulement le montant du capital social."
                        ],
                        correct_answer: 2, // C
                        explanation: "Comme une entreprise est censée durer indéfiniment, la majorité de sa valeur réside dans son futur lointain (la perpétuité), d'où son poids important dans le DCF."
                    },
                    {
                        id: 'q7',
                        question: "Que signifie l'acronyme WACC (ou CMPC en français) ?",
                        options: [
                            "World Active Cash Commission.",
                            "Coefficient Moyen de Plus-value Capitalisée.",
                            "Coût Moyen Pondéré du Capital.",
                            "Calcul de la Marge de Croissance."
                        ],
                        correct_answer: 2, // C
                        explanation: "C'est le taux de rendement moyen exigé par ceux qui financent l'entreprise (actionnaires et banques). Il sert de taux d'actualisation."
                    },
                    {
                        id: 'q8',
                        question: "Quel est l'impact d'une hausse du taux d'actualisation (WACC) sur la valeur d'une action ?",
                        options: [
                            "La valeur intrinsèque diminue.",
                            "La valeur intrinsèque augmente.",
                            "Le prix en bourse augmente immédiatement.",
                            "Cela n'a aucun impact sur l'évaluation."
                        ],
                        correct_answer: 0, // A
                        explanation: "Mathématiquement, plus on actualise fort (taux élevé au dénominateur), plus la valeur présente des flux futurs est faible. Le risque fait baisser la valeur."
                    },
                    {
                        id: 'q9',
                        question: "Sur quoi se base la méthode DDM (Dividend Discount Model) ?",
                        options: [
                            "Sur la revente de l'usine pièce par pièce.",
                            "Sur l'actualisation des dividendes futurs.",
                            "Sur le chiffre d'affaires multiplié par deux.",
                            "Sur le nombre de followers de l'entreprise."
                        ],
                        correct_answer: 1, // B
                        explanation: "Le DDM considère que la valeur d'une action pour un actionnaire minoritaire est simplement la somme des dividendes qu'il recevra."
                    },
                    {
                        id: 'q10',
                        question: "Dans le modèle de Gordon-Shapiro, que représente la variable « g » ?",
                        options: [
                            "Le montant du gearing de la société.",
                            "Le gain total réalisé par l'actionnaire.",
                            "Le taux de croissance annuel constant des dividendes.",
                            "Le nombre de jours avant le prochain coupon."
                        ],
                        correct_answer: 2, // C
                        explanation: "La variable 'g' (growth) correspond au taux de croissance perpétuel attendu des dividendes."
                    },
                    {
                        id: 'q11',
                        question: "Pour quel type d'entreprise la méthode DDM est-elle la plus adaptée à la BRVM ?",
                        options: [
                            "Les start-ups technologiques qui ne font pas de bénéfices.",
                            "Les entreprises matures versant des dividendes stables (ex: banques).",
                            "Les entreprises en faillite imminente.",
                            "Les entreprises qui réinvestissent 100 % de leurs profits."
                        ],
                        correct_answer: 1, // B
                        explanation: "Le modèle fonctionne mieux avec des sociétés stables qui ont une politique de distribution de dividendes régulière et prévisible."
                    },
                    {
                        id: 'q12',
                        question: "Quelle est la formule simplifiée du modèle de Gordon-Shapiro ?",
                        options: [
                            "Prix = D₁ × (k + g)",
                            "Prix = Bénéfice / Actions",
                            "Prix = D₁ / (k − g)",
                            "Prix = Cours × PER"
                        ],
                        correct_answer: 2, // C
                        explanation: "La valeur est le dividende de l'année prochaine (D1) divisé par la différence entre le coût du capital (k) et le taux de croissance (g)."
                    },
                    {
                        id: 'q13',
                        question: "Qu'est-ce que la « Marge de Sécurité » ?",
                        options: [
                            "Le montant minimal d'argent à garder sur son compte bancaire.",
                            "L'écart entre la valeur intrinsèque calculée et le prix actuel du marché.",
                            "Le taux d'intérêt minimal garanti par la BCEAO.",
                            "Le montant maximum que l'on peut perdre sur une action."
                        ],
                        correct_answer: 1, // B
                        explanation: "C'est la différence entre la valeur réelle d'une entreprise (estimée par l'analyste) et son prix en Bourse. Elle protège contre les erreurs d'estimation."
                    },
                    {
                        id: 'q14',
                        question: "Quel biais émotionnel consiste à rester bloqué sur un prix passé au lieu de croire en son calcul ?",
                        options: [
                            "Le biais d'Ancrage.",
                            "L'Excès de Confiance.",
                            "Le déni de réalité.",
                            "La loi des petits nombres."
                        ],
                        correct_answer: 0, // A
                        explanation: "L'ancrage est la tendance psychologique à se fier trop lourdement à la première information reçue (l'ancre), souvent le prix d'achat historique."
                    },
                    {
                        id: 'q15',
                        question: "Que doit faire l'analyste après avoir trouvé une valeur intrinsèque de 15 000 FCFA pour une action cotée à 10 000 FCFA ?",
                        options: [
                            "Vendre immédiatement car le prix est trop bas.",
                            "Attendre que la valeur intrinsèque baisse à 10 000 FCFA.",
                            "Considérer l'achat car il y a une marge de sécurité de 5 000 FCFA.",
                            "Appeler la BRVM pour dénoncer une erreur."
                        ],
                        correct_answer: 2, // C
                        explanation: "Si Valeur > Prix, l'action est sous-évaluée. Avec une décote importante (marge de sécurité), c'est une opportunité d'achat rationnelle."
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
        console.log(` - ID: ${quiz.id}`);
        console.log(` - Nombre de questions: ${(quiz.questions as any[])?.length || 0}`);
        console.log(` - Score de passage: ${quiz.passing_score}%`);
        console.log('');
        console.log('📝 Note: Le système sélectionnera automatiquement 10 questions aléatoires parmi les 15 lors de chaque test.');

    } catch (error) {
        console.error('❌ Erreur lors de la création du quiz:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
createModule8Quiz();