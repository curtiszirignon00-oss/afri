// backend/scripts/create-module6-quiz.ts
// Script pour créer le quiz du Module 6 - Le Mental du Gagnant

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule6Quiz() {
    try {
        console.log('🔍 Recherche du Module 6...');

        // Le slug est basé sur le titre du module : Le Mental du Gagnant
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'analyse-fondamentale' } 
        });

        if (!module) {
            console.error('❌ Module 6 non trouvé. Vérifiez le slug: le-mental-du-gagnant');
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
                        question: "Selon la Finance Comportementale, quelle est la plus grande menace pour le portefeuille d'un investisseur débutant ?",
                        options: [
                            "La faillite d'une SGI.",
                            "Les hausses des taux d'intérêt de la BCEAO.",
                            "L'absence de nouveaux produits sur la BRVM.",
                            "L'instabilité politique dans la région UEMOA.",
                            "Les émotions de l'investisseur lui-même (peur et avidité)."
                        ],
                        correct_answer: 4,
                        explanation: "La finance comportementale enseigne que les émotions de l'investisseur (peur et avidité) sont la cause principale des erreurs et de l'irrationnel."
                    },
                    {
                        id: 'q2',
                        question: "L'Investisseur (Le Propriétaire) se distingue du Spéculateur (Le Joueur) principalement par :",
                        options: [
                            "Le type de titres qu'il achète (actions uniquement).",
                            "L'utilisation systématique de la vente à découvert.",
                            "Le montant qu'il investit chaque mois.",
                            "Un horizon de temps long, basé sur la patience et l'analyse des fondamentaux.",
                            "Le fait de devoir passer par le DC/BR."
                        ],
                        correct_answer: 3,
                        explanation: "L'investisseur se concentre sur le long terme (années, décennies) et l'analyse des fondamentaux, contrairement au spéculateur qui est sur du court terme."
                    },
                    {
                        id: 'q3',
                        question: "Quel est le moteur principal de la décision d'achat pour le Spéculateur ?",
                        options: [
                            "La valeur intrinsèque et le potentiel de croissance future de l'entreprise.",
                            "L'objectif de retraite dans 20 ans.",
                            "L'analyse détaillée des états financiers (bilan et compte de résultat).",
                            "L'excitation lorsque le marché monte ou la peur lorsqu'il baisse.",
                            "Le montant des dividendes annuels garantis."
                        ],
                        correct_answer: 3,
                        explanation: "Le spéculateur est mû par l'excitation (quand le marché monte) ou la panique (quand il descend), des émotions qui mènent à des décisions irrationnelles."
                    },
                    {
                        id: 'q4',
                        question: "Quel Biais Cognitif pousse un investisseur à rester focalisé sur le prix initial d'achat d'un titre, même si sa valeur a évolué ?",
                        options: [
                            "Le Biais de Confirmation.",
                            "Le Biais de Récence.",
                            "Le Biais de Disponibilité.",
                            "L'Ancrage.",
                            "L'Avidité."
                        ],
                        correct_answer: 3,
                        explanation: "L'Ancrage est le biais qui fait rester figé sur le prix d'achat initial et empêche de prendre une décision rationnelle."
                    },
                    {
                        id: 'q5',
                        question: "Comment appelle-t-on le processus par lequel les gains générés par un investissement sont eux-mêmes réinvestis pour produire leurs propres gains ?",
                        options: [
                            "L'Augmentation de capital.",
                            "La Dilution.",
                            "Les Intérêts Composés.",
                            "L'Ancrage.",
                            "Le Rendement linéaire."
                        ],
                        correct_answer: 2,
                        explanation: "Les intérêts composés se produisent lorsque les gains sont réinvestis pour générer à leur tour de nouveaux gains (l'argent qui travaille pour l'argent)."
                    },
                    {
                        id: 'q6',
                        question: "Un investisseur qui ne recherche que des informations confirmant son opinion initiale sur un titre est victime du :",
                        options: [
                            "Biais de Confirmation.",
                            "Biais d'Ancrage.",
                            "Biais de Récence.",
                            "Biais de Diversification.",
                            "Biais de Liquidité."
                        ],
                        correct_answer: 0,
                        explanation: "Le Biais de Confirmation est le fait de chercher uniquement les nouvelles et analyses qui confortent le choix initial, ignorant les informations négatives."
                    },
                    {
                        id: 'q7',
                        question: "Quelle est l'Antidote psychologique pour lutter contre le Biais de Récence (surévaluer le dernier événement) ?",
                        options: [
                            "Acheter massivement en une seule fois.",
                            "Se concentrer sur les données historiques à long terme de l'entreprise et des indices.",
                            "Vendre immédiatement en cas de mauvaise nouvelle.",
                            "Augmenter son levier d'endettement.",
                            "Ne suivre que l'indice BRVM 10."
                        ],
                        correct_answer: 1,
                        explanation: "La discipline et la concentration sur le long terme (destination finale) permettent d'ignorer la volatilité et les événements récents (les secousses quotidiennes)."
                    },
                    {
                        id: 'q8',
                        question: "Quelle stratégie d'investissement consiste à acheter des titres que l'on considère comme sous-évalués par le marché, en se basant sur leur valeur intrinsèque ?",
                        options: [
                            "Le Market Timing.",
                            "Le Value Investing.",
                            "Le Growth Investing.",
                            "Le Biais de Confirmation.",
                            "Le Day Trading."
                        ],
                        correct_answer: 1,
                        explanation: "Le Value Investing (Stratégie de Valeur) consiste à acheter une entreprise qui se négocie en dessous de sa valeur intrinsèque réelle."
                    },
                    {
                        id: 'q9',
                        question: "Quelle est la principale exigence pour que le phénomène des Intérêts Composés fonctionne à son plein potentiel ?",
                        options: [
                            "Un investissement unique et massif.",
                            "La spéculation à court terme.",
                            "Le Temps et la Discipline (réinvestissement régulier des gains).",
                            "Le retrait systématique des dividendes pour les dépenser.",
                            "Une forte volatilité de marché."
                        ],
                        correct_answer: 2,
                        explanation: "L'effet des intérêts composés est exponentiel, et plus l'horizon est long (Temps) et la routine de réinvestissement est maintenue (Discipline), plus la croissance est forte."
                    },
                    {
                        id: 'q10',
                        question: "La stratégie du DCA (Dollar Cost Averaging) est un antidote au Market Timing car elle impose de :",
                        options: [
                            "Acheter toujours plus cher que la moyenne.",
                            "Vendre ses titres à chaque baisse de prix.",
                            "Acheter des montants fixes à intervalles réguliers, indépendamment du cours du titre.",
                            "Concentrer ses achats uniquement sur l'action qui a le plus chuté.",
                            "Ne jamais réinvestir ses dividendes."
                        ],
                        correct_answer: 2,
                        explanation: "Le Market Timing est l'antithèse de l'investissement discipliné, tandis que le DCA impose une routine d'achat régulière, évitant ainsi l'émotion."
                    },
                    {
                        id: 'q11',
                        question: "Selon la citation de Warren Buffett, quand l'investisseur doit-il être avide (acheter) ?",
                        options: [
                            "Lorsque les prix sont au plus haut et que tout le monde s'emballe.",
                            "Lorsque le marché est parfaitement stable.",
                            "Seulement lorsque les autres sont craintifs (panique) et que les prix sont bas.",
                            "Uniquement après une augmentation de capital.",
                            "Jamais, car l'avidité est un ennemi."
                        ],
                        correct_answer: 2,
                        explanation: "La psychologie du gagnant, selon Buffett, est d'être avide (acheter) lorsque les autres sont craintifs (prix bas) et craintif (prudent) lorsque les autres sont avides (prix hauts)."
                    },
                    {
                        id: 'q12',
                        question: "L'un des rôles de la discipline pour un investisseur est :",
                        options: [
                            "De vendre les titres tous les 6 mois.",
                            "De toujours essayer de deviner le point le plus bas du marché.",
                            "D'utiliser l'effet de levier pour tous les achats.",
                            "D'appliquer sa stratégie d'investissement, peu importe l'émotion du marché du jour.",
                            "De s'ancrer sur le prix le plus bas de son achat."
                        ],
                        correct_answer: 3,
                        explanation: "La discipline est la seule façon de combattre les émotions et les biais cognitifs, en appliquant une stratégie rigoureuse."
                    },
                    {
                        id: 'q13',
                        question: "Un investisseur qui choisit ses titres principalement parce qu'ils sont mentionnés de manière répétée dans les médias économiques est influencé par le :",
                        options: [
                            "Biais de Confirmation.",
                            "Biais d'Ancrage.",
                            "Biais de Récence.",
                            "Biais de Disponibilité.",
                            "Market Timing."
                        ],
                        correct_answer: 3,
                        explanation: "Le Biais de Disponibilité est le fait de surestimer l'importance d'informations facilement accessibles, comme celles des médias."
                    },
                    {
                        id: 'q14',
                        question: "Quel terme désigne le fait de tenter de prédire les mouvements du marché pour acheter au plus bas et vendre au plus haut ?",
                        options: [
                            "Value Investing.",
                            "Intérêts Composés.",
                            "DCA.",
                            "Market Timing (Spéculation).",
                            "Allocation d'Actifs."
                        ],
                        correct_answer: 3,
                        explanation: "Le Market Timing est l'action de vouloir 'timer' le marché pour acheter au creux et vendre au pic, ce qui est l'antithèse de l'investissement discipliné."
                    },
                    {
                        id: 'q15',
                        question: "La volatilité (fluctuation des prix) est décrite dans le module comme :",
                        options: [
                            "Un risque qui doit être évité par les investisseurs.",
                            "La norme (l'état normal) du marché.",
                            "Une condition qui bloque l'application des intérêts composés.",
                            "La cause principale du Biais d'Ancrage.",
                            "Le moteur de la Value Investing."
                        ],
                        correct_answer: 1,
                        explanation: "La volatilité est la norme, et non l'exception. La psychologie du gagnant consiste à la transformer en opportunité."
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
createModule6Quiz();