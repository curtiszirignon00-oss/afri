/// <reference types="node" />
// backend/scripts/create-module11-quiz-consolidation.ts
// Script pour créer le quiz de Consolidation du Module 11 - Maîtrise du Risque et Gestion de Portefeuille

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule11ConsolidationQuiz() {
    try {
        console.log('🔍 Recherche du Module 11...');

        // Le slug est basé sur le titre du module. À ADAPTER selon votre base de données.
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'Maîtrise-du-Risque' } 
        });

        if (!module) {
            console.error('❌ Module non trouvé. Vérifiez le slug.');
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

        // Créer le quiz avec 19 questions
        console.log('📝 Création du quiz avec 19 questions...');

        const quiz = await prisma.quiz.create({
            data: {
                moduleId: module.id,
                passing_score: 80,
                questions: [
                    {
                        id: 'q1',
                        question: "Quel est l'objectif principal de la gestion du risque tel qu'abordé dans ce module ?",
                        options: [
                            "Augmenter le rendement annuel garanti de votre portefeuille.",
                            "Remplacer l'Analyse Fondamentale par l'Analyse Technique.",
                            "Déterminer la valeur intrinsèque (DCF) de vos actions.",
                            "Protéger votre capital contre les pertes catastrophiques qui cassent l'effet exponentiel des intérêts composés.",
                            "Éliminer le risque systémique."
                        ],
                        correct_answer: 3,
                        explanation: "La gestion du risque vise avant tout à préserver le capital pour permettre aux intérêts composés de fonctionner sur le long terme sans interruption majeure."
                    },
                    {
                        id: 'q2',
                        question: "Quelle est la définition du Rééquilibrage (Rebalancing) d'un portefeuille ?",
                        options: [
                            "Acheter des montants fixes à intervalles réguliers (DCA).",
                            "Vendre tous les actifs dès qu'une perte de 10 % est atteinte.",
                            "Modifier le profil de risque (Prudent à Dynamique).",
                            "Vendre les actifs qui ont trop monté pour racheter ceux qui sont en retard, afin de revenir à l'Allocation d'Actifs cible.",
                            "N'investir que dans des ETF."
                        ],
                        correct_answer: 3,
                        explanation: "Le rééquilibrage consiste à ramener le portefeuille à son allocation cible initiale en vendant les actifs sur-performants pour acheter les sous-performants."
                    },
                    {
                        id: 'q3',
                        question: "L'un des rôles majeurs de la Diversification est de réduire quel type de risque ?",
                        options: [
                            "Le Risque de Taux d'Intérêt.",
                            "Le Risque de liquidité du marché.",
                            "Le Risque Spécifique (ou Non Systématique) lié à la faillite d'une seule entreprise.",
                            "Le Risque de change (uniquement).",
                            "Le Risque de Market Timing."
                        ],
                        correct_answer: 2,
                        explanation: "La diversification permet d'éviter qu'un événement négatif touchant une seule entreprise (risque spécifique) ne détruise l'ensemble du portefeuille."
                    },
                    {
                        id: 'q4',
                        question: "Qu'est-ce qu'un Ordre Stop-Loss ?",
                        options: [
                            "Un ordre d'achat d'un actif dès qu'il atteint un nouveau sommet.",
                            "Un ordre de vente automatique d'un titre si son prix atteint un seuil de perte prédéfini.",
                            "Un ordre de rééquilibrage du portefeuille.",
                            "L'allocation d'actifs de l'investisseur dynamique.",
                            "La méthode pour calculer le PER."
                        ],
                        correct_answer: 1,
                        explanation: "Le Stop-Loss est un filet de sécurité qui déclenche automatiquement une vente pour limiter les pertes avant qu'elles ne deviennent catastrophiques."
                    },
                    {
                        id: 'q5',
                        question: "L'utilisation de la technique du DCA (Dollar Cost Averaging) vise principalement à éliminer :",
                        options: [
                            "Le Risque Systémique.",
                            "Le Risque Spécifique.",
                            "L'erreur de Market Timing (tenter d'acheter au plus bas).",
                            "Le Biais d'Ancrage.",
                            "Le Gearing."
                        ],
                        correct_answer: 2,
                        explanation: "En investissant une somme fixe à intervalles réguliers, le DCA évite le stress et l'erreur de chercher le 'moment parfait' pour investir (Market Timing)."
                    },
                    {
                        id: 'q6',
                        question: "Si un portefeuille a une allocation cible de 50 % Actions / 50 % Obligations, mais que les actions montent et qu'il atteint 65 % Actions / 35 % Obligations, que doit faire l'investisseur lors du rééquilibrage ?",
                        options: [
                            "Acheter plus d'actions.",
                            "Ne rien faire et attendre que les obligations montent.",
                            "Vendre la totalité de son portefeuille.",
                            "Vendre une partie des Actions pour racheter des Obligations.",
                            "Augmenter son DCA."
                        ],
                        correct_answer: 3,
                        explanation: "Il faut 'écrémer' les gains des actions pour racheter des obligations, revenant ainsi au profil de risque initial (50/50)."
                    },
                    {
                        id: 'q7',
                        question: "Quel principe de gestion du risque permet de transformer une décision émotionnelle (vendre en panique) en une règle mécanique et disciplinée ?",
                        options: [
                            "Le Market Timing.",
                            "Le Biais de Récence.",
                            "L'Ordre Stop-Loss.",
                            "L'Analyse Fondamentale.",
                            "Le Réinvestissement des dividendes."
                        ],
                        correct_answer: 2,
                        explanation: "Définir un Stop-Loss à l'avance permet de couper ses pertes de manière rationnelle et automatisée, sans céder à la panique en cas de baisse du marché."
                    },
                    {
                        id: 'q8',
                        question: "L'une des conditions pour que les Intérêts Composés fonctionnent à plein potentiel est d'éviter les pertes catastrophiques et de réinvestir ses gains. Quels gains doivent être réinvestis ?",
                        options: [
                            "Uniquement le capital initial.",
                            "Les Dividendes et les Plus-values réalisées.",
                            "Le montant des frais de SGI.",
                            "La Valeur Terminale (VT).",
                            "Uniquement les coupons d'obligations."
                        ],
                        correct_answer: 1,
                        explanation: "Pour que l'effet boule de neige opère à son maximum, tous les fruits de l'investissement (dividendes versés et gains réalisés) doivent être réinjectés dans le portefeuille."
                    },
                    {
                        id: 'q9',
                        question: "Le Risque Systémique (de marché) est celui qui affecte :",
                        options: [
                            "Uniquement une entreprise (ex: SONATEL).",
                            "Uniquement un secteur (ex: les Banques).",
                            "L'ensemble du marché financier et de l'économie.",
                            "Uniquement l'investisseur débutant.",
                            "La gestion du DCA."
                        ],
                        correct_answer: 2,
                        explanation: "Contrairement au risque spécifique, le risque systémique (comme une crise mondiale ou une pandémie) touche tout le marché et ne peut être totalement éliminé par la seule diversification."
                    },
                    {
                        id: 'q10',
                        question: "Le rééquilibrage (vendre les actifs chers pour acheter ceux qui sont en retard) agit comme un antidote à quel biais psychologique (Module 6) ?",
                        options: [
                            "Le Biais d'Ancrage.",
                            "La Peur.",
                            "L'Avidité (en forçant la vente des actifs qui montent le plus).",
                            "Le Biais de Confirmation.",
                            "Le Market Timing."
                        ],
                        correct_answer: 2,
                        explanation: "L'avidité pousse souvent l'investisseur à garder ce qui monte indéfiniment. Le rééquilibrage force la prise de profit de façon mécanique, sécurisant ainsi les gains."
                    },
                    {
                        id: 'q11',
                        question: "Pour l'investisseur, la règle fondamentale de la gestion du risque est de ne jamais investir l'argent :",
                        options: [
                            "Qui a un Gearing élevé.",
                            "Qui génère des intérêts composés.",
                            "Dont il pourrait avoir besoin à court terme (moins de 2 ans).",
                            "Qui est alloué aux obligations.",
                            "Qui n'est pas sur la BRVM."
                        ],
                        correct_answer: 2,
                        explanation: "L'argent investi en bourse doit pouvoir y rester plusieurs années pour traverser les baisses éventuelles sans forcer l'investisseur à vendre à perte pour un besoin urgent."
                    },
                    {
                        id: 'q12',
                        question: "Quel est l'avantage de la stratégie du DCA pour l'investisseur de long terme, selon le module ?",
                        options: [
                            "Le fait d'acheter uniquement au plus bas du marché.",
                            "La garantie de capital à l'échéance.",
                            "La possibilité d'utiliser l'effet de levier.",
                            "Le lissage du prix de revient moyen d'achat.",
                            "L'élimination du risque systémique."
                        ],
                        correct_answer: 3,
                        explanation: "Le DCA permet d'acheter moins d'actions quand elles sont chères et plus d'actions quand elles sont bon marché, lissant ainsi le coût global de l'investissement sur la durée."
                    },
                    {
                        id: 'q13',
                        question: "Si un investisseur prudent a un horizon de placement de 2 ans pour un projet spécifique, quelle allocation d'actifs devrait-il privilégier ?",
                        options: [
                            "100% Actions de croissance.",
                            "80% Actions / 20% Obligations.",
                            "Majorité Obligations / Liquidités (risque minimal).",
                            "Uniquement des ETF.",
                            "Un portefeuille avec un Gearing élevé."
                        ],
                        correct_answer: 2,
                        explanation: "Sur un horizon court (2 ans), la priorité absolue est la préservation du capital. Les actions sont trop volatiles pour garantir que l'argent sera disponible à cette échéance."
                    },
                    {
                        id: 'q14',
                        question: "La diversification géographique et sectorielle permet d'éviter :",
                        options: [
                            "Le Biais de Disponibilité.",
                            "L'exposition totale à une seule crise économique ou sectorielle régionale.",
                            "Le rééquilibrage annuel.",
                            "Le besoin de réinvestir ses dividendes.",
                            "L'application du Stop-Loss."
                        ],
                        correct_answer: 1,
                        explanation: "En ne mettant pas tous ses œufs dans le même panier (même pays ou même secteur industriel), l'investisseur se protège des chocs économiques ou réglementaires locaux."
                    },
                    {
                        id: 'q15',
                        question: "Pourquoi les investissements les plus performants finissent-ils par déséquilibrer un portefeuille ?",
                        options: [
                            "Car leur croissance les fait peser plus lourd que prévu dans l'allocation cible.",
                            "Car ils provoquent un risque spécifique.",
                            "Car ils sont moins liquides.",
                            "Car ils n'offrent plus de dividendes.",
                            "Car ils sont soumis au Market Timing."
                        ],
                        correct_answer: 0,
                        explanation: "Si une classe d'actifs (ex: actions) monte beaucoup par rapport aux autres, sa valeur dans le portefeuille augmente proportionnellement, modifiant à la hausse le niveau de risque global choisi au départ."
                    },
                    {
                        id: 'q16',
                        question: "Quel terme désigne le concept selon lequel un investissement vaut plus aujourd'hui que demain, à cause de l'inflation et du coût d'opportunité ?",
                        options: [
                            "Le Market Timing.",
                            "La Valeur Temps de l'Argent.",
                            "Le Risque Systémique.",
                            "Le Biais de Récence.",
                            "Le Rééquilibrage."
                        ],
                        correct_answer: 1,
                        explanation: "La 'Valeur Temps de l'Argent' stipule qu'un capital disponible aujourd'hui permet d'investir et de générer des rendements, et se déprécie face à l'inflation s'il n'est pas placé."
                    },
                    {
                        id: 'q17',
                        question: "L'Ordre Stop-Loss est un outil de gestion du risque pour l'investisseur long terme qui ne veut pas :",
                        options: [
                            "Perdre de l'argent.",
                            "Manquer l'achat d'une action à bas prix.",
                            "Laisser la peur (émotion) dicter une décision de vente au plus bas.",
                            "Utiliser le DCA.",
                            "Réinvestir ses dividendes."
                        ],
                        correct_answer: 2,
                        explanation: "L'ordre étant placé à l'avance et exécuté mécaniquement par le système, il protège l'investisseur de ses propres biais émotionnels en cas de krach."
                    },
                    {
                        id: 'q18',
                        question: "La règle : \"Vendre la partie qui a trop monté\" dans le rééquilibrage oblige l'investisseur à suivre quel principe de base ?",
                        options: [
                            "Être avide quand les autres sont avides.",
                            "Vendre ce qui est cher (surperforme) pour racheter ce qui est bon marché (sous-performe).",
                            "Concentrer l'investissement sur un seul actif.",
                            "Ignorer la volatilité.",
                            "Utiliser un PER élevé."
                        ],
                        correct_answer: 1,
                        explanation: "C'est le principe fondamental de l'investissement intelligent : 'Acheter bas, vendre haut'. Le rééquilibrage permet d'appliquer cette règle de façon automatique."
                    },
                    {
                        id: 'q19',
                        question: "L'analogie de l'effet \"boule de neige\" est utilisée pour décrire quel phénomène financier essentiel ?",
                        options: [
                            "Le Market Timing.",
                            "La Diversification.",
                            "Le Biais de Confirmation.",
                            "Les Intérêts Composés.",
                            "L'Ordre Stop-Loss."
                        ],
                        correct_answer: 3,
                        explanation: "Comme une boule de neige qui grossit de plus en plus vite en roulant sur la pente, les intérêts composés augmentent le capital, qui génère à son tour une base encore plus large pour produire des intérêts."
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
        console.log('📝 Note: Le système sélectionnera automatiquement un nombre défini de questions aléatoires lors de chaque test.');

    } catch (error) {
        console.error('❌ Erreur lors de la création du quiz:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
createModule11ConsolidationQuiz();