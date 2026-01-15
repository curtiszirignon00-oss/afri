/// <reference types="node" />
// backend/scripts/create-module12-quiz.ts
// Script pour créer le quiz du Module 12 - Gestion Avancée du Risque et Stratégie d’Allocation

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule12Quiz() {
    try {
        console.log('🔍 Recherche du Module 12...');

        // Le slug est basé sur le titre du module : Gestion Avancée du Risque
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'Architecte-du-Risque' } 
        });

        if (!module) {
            console.error('❌ Module 12 non trouvé. Vérifiez le slug: gestion-avancee-du-risque');
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
                        question: "Quelle est la caractéristique principale de l'**Allocation d'Actifs Stratégique** ?",
                        options: [
                            "Ajustement temporaire aux conditions de marché.",
                            "Répartition de base, **passive**, définie par le profil de risque de long terme.",
                            "Vente à découvert d'un actif.",
                            "Détermination de la taille maximale d'une position.",
                            "Utilisation du RSI pour les points d'entrée."
                        ],
                        correct_answer: 1,
                        explanation: "L'Allocation Stratégique est la répartition de base (ex: 70% Actions / 30% Obligations) qui ne change qu'avec l'âge ou la tolérance au risque de l'investisseur."
                    },
                    {
                        id: 'q2',
                        question: "L'**Allocation d'Actifs Tactique** consiste à :",
                        options: [
                            "Réinvestir automatiquement les dividendes.",
                            "Revenir à l'allocation de base une fois par an (Rééquilibrage).",
                            "Faire un **ajustement temporaire** de l'allocation stratégique pour profiter des conditions de marché.",
                            "Ne jamais détenir plus de 5 % du portefeuille en liquidités.",
                            "Vendre un actif que l'on ne possède pas."
                        ],
                        correct_answer: 2,
                        explanation: "L'Allocation Tactique déroge temporairement à la règle stratégique (ex: passer à 60% Actions au lieu de 70%) pour capitaliser sur une opportunité ou éviter un risque imminent."
                    },
                    {
                        id: 'q3',
                        question: "Pourquoi la **Diversification Sectorielle** est-elle particulièrement critique sur la BRVM ?",
                        options: [
                            "À cause du risque de change.",
                            "En raison de la **concentration** des sociétés cotées sur quelques secteurs (Banques et Télécoms).",
                            "Pour éliminer le risque systémique.",
                            "Pour appliquer la méthode DDM.",
                            "Pour baisser le PER moyen."
                        ],
                        correct_answer: 1,
                        explanation: "La forte concentration sectorielle de la BRVM augmente le risque spécifique de l'indice, rendant la diversification sectorielle et géographique indispensable."
                    },
                    {
                        id: 'q4',
                        question: "Que signifie le terme **'Position Sizing'** (ou Taille de Position) ?",
                        options: [
                            "La durée de détention d'un actif (Horizon de Placement).",
                            "La stratégie pour acheter au plus bas (Market Timing).",
                            "Le réinvestissement des bénéfices de l'entreprise.",
                            "La détermination du **montant maximum de capital** que l'on alloue à une seule ligne d'investissement.",
                            "La vente à découvert."
                        ],
                        correct_answer: 3,
                        explanation: "Le Position Sizing est l'outil ultime de gestion du risque qui contrôle la perte maximale que l'on peut subir sur une seule position."
                    },
                    {
                        id: 'q5',
                        question: "Si votre règle de Position Sizing est de 2% (perte maximale sur le capital total) et que le Stop-Loss d'une action est à -10% du prix d'achat, quel est le poids maximum que cette action peut avoir dans votre portefeuille ?",
                        options: [
                            "2 % du capital total.",
                            "5 % du capital total.",
                            "10 % du capital total.",
                            "20 % du capital total.",
                            "50 % du capital total."
                        ],
                        correct_answer: 3,
                        explanation: "Calcul : Perte Maximale (2%) / Perte potentielle sur le titre (10%) = 0,2 soit 20%. Si 20% du capital est perdu de 10%, cela représente bien 2% de perte sur le capital total."
                    },
                    {
                        id: 'q6',
                        question: "Quel est l'objectif principal d'ajouter des **Actifs Non Corrélés** (comme l'Or ou l'immobilier physique) à son portefeuille Actions/Obligations ?",
                        options: [
                            "Obtenir un rendement garanti de 15 %.",
                            "Éliminer le risque de liquidité.",
                            "Lisser le rendement et **amortir les chocs de marché** (quand l'un baisse, l'autre monte ou reste stable).",
                            "Faciliter le Market Timing.",
                            "Augmenter le Gearing."
                        ],
                        correct_answer: 2,
                        explanation: "La non-corrélation est l'opposé de la diversification: elle ajoute des actifs qui n'évoluent pas de concert avec la bourse, offrant une meilleure protection."
                    },
                    {
                        id: 'q7',
                        question: "Dans le cadre de l'Allocation Tactique, si un investisseur anticipe une **baisse imminente** des actions BRVM, quel ajustement ferait-il temporairement ?",
                        options: [
                            "Vendre ses obligations et acheter plus d'actions.",
                            "Maintenir l'allocation stratégique coûte que coûte.",
                            "**Augmenter la part de liquidités** ou d'OPCVM prudents, en réduisant temporairement les actions.",
                            "Augmenter le Gearing de son portefeuille.",
                            "Réaliser un rééquilibrage obligatoire."
                        ],
                        correct_answer: 2,
                        explanation: "En cas de risque anticipé, la tactique est de se réfugier temporairement dans des actifs 'refuges' (liquidités, obligations) et de réduire l'exposition aux actions."
                    },
                    {
                        id: 'q8',
                        question: "Quel est le risque de la **Vente à Découvert (VAD)** pour l'investisseur ?",
                        options: [
                            "Le risque est limité au prix d'achat initial.",
                            "Le risque est uniquement le Risque Spécifique.",
                            "Le risque de perte est **illimité** (puisque le prix peut monter indéfiniment).",
                            "Il élimine le risque systémique.",
                            "Il est synonyme de Market Timing."
                        ],
                        correct_answer: 2,
                        explanation: "La VAD est une technique hautement spéculative et risquée, car si le titre monte, la perte potentielle n'a pas de limite supérieure."
                    },
                    {
                        id: 'q9',
                        question: "L'approche d'investissement d'un **'Actif Corréllé'** est celle qui :",
                        options: [
                            "N'a pas de dividende.",
                            "Ne dépend pas du PER.",
                            "**A un prix qui suit la tendance du marché général** (ex: la plupart des actions suivent le marché).",
                            "Ne paie pas de frais de gestion.",
                            "Est illiquide."
                        ],
                        correct_answer: 2,
                        explanation: "Les actifs corréllés bougent ensemble. Ils n'offrent pas de protection en cas de crise systémique."
                    },
                    {
                        id: 'q10',
                        question: "Quel est l'un des inconvénients majeurs de l'**Allocation Tactique** ?",
                        options: [
                            "Elle est trop passive.",
                            "Elle est impossible à rééquilibrer.",
                            "Elle nécessite beaucoup de discipline et d'analyse, et elle est soumise au **Risque de Market Timing** (se tromper dans l'anticipation).",
                            "Elle élimine tout le risque.",
                            "Elle n'est pas adaptée à la BRVM."
                        ],
                        correct_answer: 2,
                        explanation: "L'Allocation Tactique introduit la difficulté (et le risque) de se tromper dans l'anticipation des mouvements de marché."
                    },
                    {
                        id: 'q11',
                        question: "Selon la règle du **Position Sizing**, si l'on est moins confiant dans une idée d'investissement, comment doit être la taille de la position ?",
                        options: [
                            "Aussi grande que possible.",
                            "**Plus petite** que la moyenne pour limiter la perte potentielle.",
                            "Égale au montant du Stop-Loss.",
                            "Uniquement composée d'obligations.",
                            "Basée sur le RSI."
                        ],
                        correct_answer: 1,
                        explanation: "La taille de la position doit être inversement proportionnelle à la confiance dans l'idée : moins de confiance = moins d'argent risqué."
                    },
                    {
                        id: 'q12',
                        question: "La principale différence entre l'**Allocation Stratégique** et le **Rééquilibrage** est :",
                        options: [
                            "L'une est mensuelle, l'autre est annuelle.",
                            "L'une utilise le PER, l'autre le ROE.",
                            "L'Allocation Stratégique **fixe la cible** (la destination), le Rééquilibrage **corrige la trajectoire** (pour rester sur le cap).",
                            "Ils sont deux outils de Market Timing.",
                            "Ils sont des synonymes de Diversification."
                        ],
                        correct_answer: 2,
                        explanation: "L'Allocation Stratégique est la répartition idéale et stable (cible). Le Rééquilibrage est l'action de maintenance périodique pour revenir à cette cible."
                    },
                    {
                        id: 'q13',
                        question: "Quel est l'outil de gestion du risque qui vous permet de déterminer **combien vous êtes prêt à perdre** sur une seule mauvaise idée d'investissement ?",
                        options: [
                            "La diversification géographique.",
                            "L'Analyse Technique (RSI).",
                            "Le Rééquilibrage.",
                            "Le **Position Sizing** (en limitant la taille de la position).",
                            "Le Stop-Limit."
                        ],
                        correct_answer: 3,
                        explanation: "Le Position Sizing est l'outil qui met en relation la probabilité de perte (stop-loss) avec l'impact maximal toléré sur le capital total."
                    },
                    {
                        id: 'q14',
                        question: "Un investisseur 'Value' (qui cherche des entreprises sous-évaluées) ferait un ajustement tactique en **augmentant** la part d'actions si :",
                        options: [
                            "Le marché est au plus haut et tout le monde est avide.",
                            "Le RSI est à 80.",
                            "Le marché a **chuté fortement** et les prix offrent une Marge de Sécurité plus grande.",
                            "Le Gearing est très élevé.",
                            "Il vient de réaliser une forte plus-value."
                        ],
                        correct_answer: 2,
                        explanation: "Un Value Investor est 'avide quand les autres sont craintifs'. Une forte chute est une opportunité tactique d'acheter à bas prix."
                    },
                    {
                        id: 'q15',
                        question: "Quel est l'impact du réinvestissement des dividendes (DCA) sur l'Allocation d'Actifs Strategique ?",
                        options: [
                            "Il n'a aucun impact.",
                            "Il le rend obsolète.",
                            "Il le dégrade légèrement avec le temps en **favorisant l'actif le plus performant** (l'action), nécessitant un rééquilibrage occasionnel.",
                            "Il force l'utilisation de la Vente à Découvert.",
                            "Il augmente le Risque Systémique."
                        ],
                        correct_answer: 2,
                        explanation: "Le réinvestissement automatique des dividendes augmente le poids de l'actif le plus rentable (souvent l'action) dans l'allocation, nécessitant le rééquilibrage pour revenir à l'équilibre initial."
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
createModule12Quiz();