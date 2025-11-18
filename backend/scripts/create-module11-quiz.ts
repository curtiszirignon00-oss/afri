// backend/scripts/create-module11-quiz.ts
// Script pour créer le quiz du Module 11 - Maîtrise du Risque et Gestion de Portefeuille

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule11Quiz() {
    try {
        console.log('🔍 Recherche du Module 11...');

        // Le slug est basé sur le titre du module : Maîtrise du Risque et Gestion de Portefeuille
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'Maîtrise-du-Risque' } 
        });

        if (!module) {
            console.error('❌ Module 11 non trouvé. Vérifiez le slug: maitrise-du-risque');
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
                        question: "Quel est l'objectif principal de la **gestion du risque** tel qu'abordé dans ce module ?",
                        options: [
                            "Augmenter le rendement annuel garanti de votre portefeuille.",
                            "Remplacer l'Analyse Fondamentale par l'Analyse Technique.",
                            "Déterminer la valeur intrinsèque (DCF) de vos actions.",
                            "Protéger votre capital contre les **pertes catastrophiques** qui cassent l'effet exponentiel des intérêts composés.",
                            "Éliminer le risque systémique."
                        ],
                        correct_answer: 3,
                        explanation: "Le but n'est pas d'éviter les petites pertes, mais de prévenir les pertes majeures qui nécessitent un rendement disproportionné pour récupérer le capital initial."
                    },
                    {
                        id: 'q2',
                        question: "Quelle est la définition du **Rééquilibrage (Rebalancing)** d'un portefeuille ?",
                        options: [
                            "Acheter des montants fixes à intervalles réguliers (DCA).",
                            "Vendre tous les actifs dès qu'une perte de 10 % est atteinte.",
                            "Modifier le profil de risque (Prudent à Dynamique).",
                            "Vendre les actifs qui ont trop monté pour racheter ceux qui sont en retard, afin de revenir à l'**Allocation d'Actifs cible**.",
                            "N'investir que dans des ETF."
                        ],
                        correct_answer: 3,
                        explanation: "Le rééquilibrage est l'action de ramener périodiquement les poids des classes d'actifs (ex: Actions/Obligations) à leur répartition initiale pour maintenir le niveau de risque ciblé."
                    },
                    {
                        id: 'q3',
                        question: "L'un des rôles majeurs de la **Diversification** est de réduire quel type de risque ?",
                        options: [
                            "Le Risque de Taux d'Intérêt.",
                            "Le Risque de liquidité du marché.",
                            "Le **Risque Spécifique** (ou Non Systématique) lié à la faillite d'une seule entreprise.",
                            "Le Risque de change (uniquement).",
                            "Le Risque de Market Timing."
                        ],
                        correct_answer: 2,
                        explanation: "La diversification protège de l'événement isolé qui ne touche qu'une seule entreprise ou secteur."
                    },
                    {
                        id: 'q4',
                        question: "Quelle est la différence principale entre l'Ordre **Stop-Loss** et l'Ordre **Stop-Limit** ?",
                        options: [
                            "Le Stop-Loss est utilisé uniquement par les spéculateurs.",
                            "Le Stop-Limit garantit le prix d'exécution, mais pas l'exécution de l'ordre, alors que le Stop-Loss garantit l'exécution, mais pas le prix.",
                            "Le Stop-Loss est utilisé uniquement pour les obligations.",
                            "Ils sont exactement identiques.",
                            "Le Stop-Limit garantit l'exécution à tout prix."
                        ],
                        correct_answer: 1,
                        explanation: "Le Stop-Limit permet de fixer une limite au prix de vente (garantie du prix), tandis que le Stop-Loss assure que l'ordre sera exécuté dès que le prix est atteint (garantie d'exécution)."
                    },
                    {
                        id: 'q5',
                        question: "La première règle de la gestion des pertes est :",
                        options: [
                            "Vendre tout son portefeuille dès la première baisse.",
                            "Toujours tenter de récupérer sa perte immédiatement par un nouveau pari risqué.",
                            "**Ne jamais laisser une perte temporaire se transformer en perte permanente**.",
                            "Attendre 20 ans sans rien faire.",
                            "Investir uniquement dans des produits illiquides."
                        ],
                        correct_answer: 2,
                        explanation: "Une perte est temporaire tant que l'on n'a pas vendu. La perte devient permanente si l'entreprise fait faillite (d'où la diversification) ou si l'on vend par panique."
                    },
                    {
                        id: 'q6',
                        question: "Pourquoi les **gains latents** (actifs qui ont surperformé) peuvent-ils déséquilibrer un portefeuille ?",
                        options: [
                            "Car ils sont illégaux.",
                            "Car leur croissance les fait peser **plus lourd** que prévu dans l'allocation cible, augmentant le profil de risque général.",
                            "Car ils provoquent un risque spécifique.",
                            "Car ils n'offrent plus de dividendes.",
                            "Car ils sont soumis au Market Timing."
                        ],
                        correct_answer: 1,
                        explanation: "Si le poids des actions double, le portefeuille devient plus risqué, nécessitant un rééquilibrage."
                    },
                    {
                        id: 'q7',
                        question: "Quel terme désigne le concept selon lequel un investissement vaut plus aujourd'hui que demain, à cause de l'inflation et du coût d'opportunité ?",
                        options: [
                            "Le Market Timing.",
                            "La **Valeur Temps de l'Argent**.",
                            "Le Risque Systémique.",
                            "Le Biais de Récence.",
                            "Le Rééquilibrage."
                        ],
                        correct_answer: 1,
                        explanation: "Ce concept est au cœur du DCA et des intérêts composés : plus on commence tôt, plus le temps travaille pour nous."
                    },
                    {
                        id: 'q8',
                        question: "L'Ordre **Stop-Loss** est un outil de gestion du risque pour l'investisseur long terme qui ne veut pas :",
                        options: [
                            "Perdre de l'argent.",
                            "Manquer l'achat d'une action à bas prix.",
                            "Laisser la **peur** (émotion) dicter une décision de vente au plus bas.",
                            "Utiliser le DCA.",
                            "Réinvestir ses dividendes."
                        ],
                        correct_answer: 2,
                        explanation: "Le Stop-Loss, s'il est utilisé, doit être placé de manière rationnelle et non sous l'emprise de la panique ou de l'émotion."
                    },
                    {
                        id: 'q9',
                        question: "La règle : 'Vendre la partie qui a trop monté' dans le rééquilibrage oblige l'investisseur à suivre quel principe de base ?",
                        options: [
                            "Être avide quand les autres sont avides.",
                            "Vendre ce qui est **cher** (surperforme) pour racheter ce qui est **bon marché** (sous-performe).",
                            "Concentrer l'investissement sur un seul actif.",
                            "Ignorer la volatilité.",
                            "Utiliser la Moyenne Mobile 50 jours."
                        ],
                        correct_answer: 1,
                        explanation: "C'est l'essence de la psychologie d'investissement : aller à contre-courant de l'émotion du marché."
                    },
                    {
                        id: 'q10',
                        question: "Quel est l'antidote psychologique pour éviter de vendre par panique lorsque le marché chute fortement ?",
                        options: [
                            "Se concentrer sur les gains à court terme.",
                            "Vérifier son portefeuille toutes les 5 minutes.",
                            "Se souvenir de son **horizon de placement long terme** et de la qualité des fondamentaux de l'entreprise (Analyse Fondamentale).",
                            "Investir uniquement dans les titres peu liquides.",
                            "Faire du Market Timing."
                        ],
                        correct_answer: 2,
                        explanation: "Le long terme (et la qualité des fondamentaux) est l'armure contre la peur et la volatilité quotidienne."
                    },
                    {
                        id: 'q11',
                        question: "Le **Dollar Cost Averaging (DCA)** est une technique de gestion du risque car elle :",
                        options: [
                            "Garantit un rendement de 10 % par an.",
                            "Élimine le besoin de l'Analyse Fondamentale.",
                            "**Lisse le prix d'achat moyen** et élimine la nécessité de faire du Market Timing.",
                            "N'est utilisée que par les spéculateurs.",
                            "Augmente le Risque Spécifique."
                        ],
                        correct_answer: 2,
                        explanation: "Le DCA est l'outil de discipline qui achète régulièrement, que le marché soit cher ou bon marché, neutralisant le Biais de Récence."
                    },
                    {
                        id: 'q12',
                        question: "Une **Allocation d'Actifs** pour un profil **Dynamique** typique pourrait être :",
                        options: [
                            "90% Obligations / 10% Actions.",
                            "100% Liquidités.",
                            "**70-80% Actions** (pour la croissance) / **20-30% Obligations** (pour la stabilité).",
                            "50% Or / 50% Liquidités.",
                            "100% Produits dérivés."
                        ],
                        correct_answer: 2,
                        explanation: "Le profil Dynamique recherche la croissance, d'où une allocation majoritairement orientée vers les actions, malgré une volatilité plus élevée."
                    },
                    {
                        id: 'q13',
                        question: "Qu'est-ce que la **Tolérance au Risque** ?",
                        options: [
                            "Le pourcentage de pertes que l'on est prêt à accepter sur l'année.",
                            "L'argent que l'on a dans son compte d'épargne.",
                            "La capacité **émotionnelle et financière** à supporter la volatilité et une baisse temporaire de son capital.",
                            "Le niveau de l'inflation.",
                            "Le prix du dernier achat d'action."
                        ],
                        correct_answer: 2,
                        explanation: "La tolérance au risque est à la fois psychologique (ne pas paniquer) et matérielle (ne pas avoir besoin de l'argent avant 10 ans)."
                    },
                    {
                        id: 'q14',
                        question: "Selon la logique du module, la **perte la plus dangereuse** est celle qui :",
                        options: [
                            "Se produit sur les obligations.",
                            "Est inférieure à 1 %.",
                            "Vous fait **sortir du marché** (vendre par panique) et empêche vos intérêts composés de travailler.",
                            "Se produit sur les liquidités.",
                            "Est supérieure à la moyenne mobile 200 jours."
                        ],
                        correct_answer: 2,
                        explanation: "Le temps hors du marché (après une vente de panique) est le plus grand coût pour l'investisseur long terme."
                    },
                    {
                        id: 'q15',
                        question: "Pourquoi l'investisseur long terme n'a-t-il pas besoin de s'inquiéter de la **Volatilité** (les fluctuations quotidiennes) ?",
                        options: [
                            "Car la volatilité est interdite par l'AMF-UMOA.",
                            "Car son objectif est le court terme.",
                            "Car elle est naturellement lissée et absorbée par le **Temps** (horizon de 10, 20 ans) et le DCA.",
                            "Car il utilise l'Analyse Technique pour la prédire.",
                            "Car il n'investit que dans des titres illiquides."
                        ],
                        correct_answer: 2,
                        explanation: "Le temps est le meilleur allié du risque : plus l'horizon est long, moins la volatilité quotidienne a d'impact sur le rendement final."
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
createModule11Quiz();