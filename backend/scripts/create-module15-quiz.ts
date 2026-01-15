/// <reference types="node" />
// backend/scripts/create-module15-quiz.ts
// Script pour créer le quiz du Module 15 - La Stratégie d'Investissement Intégrée

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule15Quiz() {
    try {
        console.log('🔍 Recherche du Module 15...');

        // Le slug est basé sur le titre du module : La Stratégie d'Investissement Intégrée
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'strat-strat' } 
        });

        if (!module) {
            console.error('❌ Module 15 non trouvé. Vérifiez le slug: strategie-investissement-integree');
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
                        question: "Dans le cadre de la Stratégie Intégrée, l'**Analyse Fondamentale** (FA) répond à la question :",
                        options: [
                            "QUAND vendre ?",
                            "QUEL est le Gearing ?",
                            "**QUOI** acheter ? (Déterminer la valeur intrinsèque).",
                            "QUELLE est la position de Stop-Loss ?",
                            "QUEL est le Biais Cognitif ?"
                        ],
                        correct_answer: 2,
                        explanation: "Le Fondamental (Modules 7, 9) est le pilier de la Valeur (la qualité de l'entreprise) : QUOI acheter."
                    },
                    {
                        id: 'q2',
                        question: "Dans le cadre de la Stratégie Intégrée, l'**Analyse Technique** (TA) répond à la question :",
                        options: [
                            "QUOI acheter ?",
                            "QUEL est le ROE ?",
                            "**QUAND** acheter ? (Déterminer le meilleur point d'entrée).",
                            "QUEL est l'impact de la BCEAO ?",
                            "QUEL est le risque systémique ?"
                        ],
                        correct_answer: 2,
                        explanation: "Le Technique (Module 10) est le pilier du Timing (le meilleur moment pour l'achat) : QUAND acheter."
                    },
                    {
                        id: 'q3',
                        question: "Quel est le risque de fonder une décision d'achat uniquement sur l'Analyse Technique (TA) ?",
                        options: [
                            "Le risque d'acheter une entreprise de qualité.",
                            "Le risque de ne pas utiliser le DCA.",
                            "Le risque de faire du **Market Timing** et d'acheter une mauvaise entreprise au bon moment.",
                            "Le risque de sur-diversification.",
                            "Le risque d'un PER trop élevé."
                        ],
                        correct_answer: 2,
                        explanation: "Le TA seul est la voie de la spéculation, acheter sans connaître la valeur intrinsèque."
                    },
                    {
                        id: 'q4',
                        question: "Selon la Check-List du Succès, la première étape est toujours :",
                        options: [
                            "Vérifier le RSI.",
                            "Calculer le Gearing.",
                            "**Définir les Objectifs de Vie (Poche d'argent) et l'Horizon de Placement** (Module 5).",
                            "Ouvrir un compte SGI.",
                            "Faire une Vente à Découvert."
                        ],
                        correct_answer: 2,
                        explanation: "On n'investit pas sans savoir pourquoi et pour combien de temps. L'étape 1 détermine l'allocation d'actifs de base."
                    },
                    {
                        id: 'q5',
                        question: "L'approche **holistique et intégrée** de l'investissement vise principalement à s'affranchir de quoi ?",
                        options: [
                            "L'impôt sur les dividendes.",
                            "Les frais de SGI.",
                            "Les **Rumeurs de marché** et les décisions basées sur l'émotion (Peur/Avidité).",
                            "Le rééquilibrage.",
                            "Le Market Timing."
                        ],
                        correct_answer: 2,
                        explanation: "La discipline rationnelle est l'antidote au bruit du marché et aux biais psychologiques (Module 6)."
                    },
                    {
                        id: 'q6',
                        question: "Quel est le meilleur point d'entrée pour l'investisseur de long terme, selon la stratégie intégrée ?",
                        options: [
                            "Le jour du versement du dividende.",
                            "Quand le prix est au-dessus de la Moyenne Mobile 200 jours.",
                            "Quand l'action est **Fondamentalement Solide (Valeur) ET** que le prix est proche d'un **Support (Timing)**.",
                            "Lorsque le RSI est supérieur à 70.",
                            "Quand l'entreprise a le Gearing le plus élevé."
                        ],
                        correct_answer: 2,
                        explanation: "C'est la combinaison des deux piliers : acheter de la qualité à un bon prix d'exécution."
                    },
                    {
                        id: 'q7',
                        question: "Le concept de **Marge de Sécurité** (Module 9) est directement lié à quel pilier de l'analyse intégrée ?",
                        options: [
                            "Analyse Technique (TA).",
                            "Psychologie (Mental du Gagnant).",
                            "**Analyse Fondamentale (FA)** (Acheter sous la valeur intrinsèque).",
                            "Gestion du Risque (Stop-Loss).",
                            "Macroéconomie (BCEAO)."
                        ],
                        correct_answer: 2,
                        explanation: "La Marge de Sécurité est la différence entre la valeur intrinsèque (FA) et le prix du marché."
                    },
                    {
                        id: 'q8',
                        question: "Si l'Analyse Top-Down (Module 14) identifie le secteur agro-industriel comme porteur, quel est le prochain filtre de la Check-List à appliquer ?",
                        options: [
                            "Vendre les obligations.",
                            "Vérifier la Résistance la plus proche.",
                            "Passer à l'**Analyse Fondamentale et Extra-Financière (ESG)** des entreprises du secteur (Module 7/9).",
                            "Définir le Position Sizing.",
                            "Appliquer l'Ordre au Marché."
                        ],
                        correct_answer: 2,
                        explanation: "Après l'identification du secteur (Top-Down), il faut sélectionner l'entreprise (Bottom-Up) par la FA/ESG."
                    },
                    {
                        id: 'q9',
                        question: "Quel est le rôle du **Dollar Cost Averaging (DCA)** dans la Check-List de discipline ?",
                        options: [
                            "Maximiser le profit à court terme.",
                            "Déterminer la taille d'une position.",
                            "**Neutraliser le Market Timing** et assurer une accumulation régulière de titres (Discipline).",
                            "Calculer le rendement réel de l'investissement.",
                            "Éliminer le risque systémique."
                        ],
                        correct_answer: 2,
                        explanation: "Le DCA (Module 6) est l'outil le plus puissant contre les erreurs de Market Timing (émotionnelles)."
                    },
                    {
                        id: 'q10',
                        question: "Une fois que le QUOI et le QUAND sont définis (FA + TA), quel est l'outil du **Position Sizing** (Module 12) à appliquer pour limiter la perte maximale sur le capital total ?",
                        options: [
                            "La Marge Nette.",
                            "Le Gearing.",
                            "L'ordre **Stop-Loss**.",
                            "Le Taux de Croissance du PIB.",
                            "Le Taux de Tendance."
                        ],
                        correct_answer: 2,
                        explanation: "Le Position Sizing utilise le Stop-Loss pour fixer le risque que l'on accepte sur le titre. Il est l'outil ultime du contrôle du risque spécifique."
                    },
                    {
                        id: 'q11',
                        question: "L'erreur finale à éviter (et à corriger via le Journal de Performance, M13) est de :",
                        options: [
                            "Réinvestir les dividendes.",
                            "Acheter une entreprise de qualité.",
                            "**Déroger à la stratégie et aux règles fixées** (Stop-Loss, Allocation) sous l'emprise de la peur ou de l'avidité.",
                            "Utiliser un Ordre au Prix Limite.",
                            "Ignorer la BCEAO."
                        ],
                        correct_answer: 2,
                        explanation: "La discipline (Module 6) est le facteur humain qui mène à la réussite ou à l'échec. La stratégie n'est rien sans l'exécution rigoureuse."
                    },
                    {
                        id: 'q12',
                        question: "Dans le modèle du **DCF (Discounted Cash Flow)** utilisé en FA, quelle variable est la plus sensible et la plus délicate à estimer ?",
                        options: [
                            "Le Bénéfice Net par Action (BPA).",
                            "La dette nette.",
                            "Le **Taux de Croissance Futur (g)** des flux de trésorerie.",
                            "Le RSI.",
                            "Le Gearing."
                        ],
                        correct_answer: 2,
                        explanation: "Le taux de croissance futur (g) est une estimation qui repose sur des hypothèses et qui influence massivement la valeur finale (Module 7)."
                    },
                    {
                        id: 'q13',
                        question: "Quel est le risque que la **Diversification** (Module 8) ne permet **pas** d'éliminer ?",
                        options: [
                            "Le Risque Spécifique (Faillite d'une seule entreprise).",
                            "Le Risque de Liquidité.",
                            "Le **Risque Systémique** (Le marché entier baisse, crise économique).",
                            "Le Risque de Gearing.",
                            "Le Risque de RAS (Retenue à la Source)."
                        ],
                        correct_answer: 2,
                        explanation: "Seul le temps et l'Allocation Tactique (liquides, obligations non corrélées) peuvent atténuer le risque systémique."
                    },
                    {
                        id: 'q14',
                        question: "Le **Rééquilibrage** périodique (Module 11) est une action nécessaire pour maintenir la cohérence entre :",
                        options: [
                            "Le RSI et la Moyenne Mobile.",
                            "La Dette et les Capitaux Propres.",
                            "La **réalité du marché (poids actuels)** et l'**Allocation d'Actifs Strategique** (poids cibles).",
                            "Le Stop-Loss et la Vente à Découvert.",
                            "L'inflation et la déflation."
                        ],
                        correct_answer: 2,
                        explanation: "Le rééquilibrage force à revenir à la répartition de risque (Allocation Stratégique) initialement choisie, en vendant ce qui a trop monté et en rachetant ce qui est en retard."
                    },
                    {
                        id: 'q15',
                        question: "L'outil du Module 13 que l'investisseur doit utiliser pour s'assurer que sa décision (prise selon la Check-List M15) était bonne ou mauvaise est :",
                        options: [
                            "L'Ordre Stop-Loss.",
                            "L'Allocation Tactique.",
                            "Le Gearing.",
                            "Le **Journal de Performance** et l'Audit de Décision.",
                            "L'Ordre au Prix Limite."
                        ],
                        correct_answer: 3,
                        explanation: "Le Journal de Performance permet de s'auto-analyser, de mesurer l'écart entre la décision prise (selon la stratégie) et l'exécution réelle."
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
createModule15Quiz();