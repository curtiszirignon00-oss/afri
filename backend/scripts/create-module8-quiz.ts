// backend/scripts/create-module8-quiz.ts
// Script pour créer le quiz du Module 8 - L'Art de la Diversification et la Gestion du Risque

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule8Quiz() {
    try {
        console.log('🔍 Recherche du Module 8...');

        // Le slug est basé sur le titre du module : L’Art de la Diversification et la Gestion du Risque
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'construire-portefeuille' } 
        });

        if (!module) {
            console.error('❌ Module 8 non trouvé. Vérifiez le slug: lart-de-la-diversification');
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
                        question: "Quelle est l'idée fondamentale derrière le concept de Diversification ?",
                        options: [
                            "Miser tout son capital sur l'action avec le meilleur rendement.",
                            "Investir uniquement dans des produits garantis par l'État.",
                            "Ne jamais investir plus de 10 % de son épargne.",
                            "Répartir son capital sur différents titres, secteurs ou zones pour minimiser le risque spécifique.",
                            "Acheter au plus bas et vendre au plus haut (Market Timing)."
                        ],
                        correct_answer: 3,
                        explanation: "La diversification est la stratégie de répartition des risques par l'éclatement du capital sur différents actifs, réduisant l'impact de la chute d'un seul titre."
                    },
                    {
                        id: 'q2',
                        question: "Quel type de risque la diversification permet-elle principalement d'éliminer ou de réduire significativement ?",
                        options: [
                            "Le Risque d'Inflation.",
                            "Le Risque Systémique (ou de Marché).",
                            "Le Risque Spécifique (ou Idiosyncratique).",
                            "Le Risque de Taux d'Intérêt.",
                            "Le Risque de Liquidité."
                        ],
                        correct_answer: 2,
                        explanation: "Le risque spécifique est propre à une seule entreprise (ex: scandale, faillite) et peut être éliminé par la diversification."
                    },
                    {
                        id: 'q3',
                        question: "Le Risque Systémique est celui qui affecte l'ensemble du marché et de l'économie. Quelle est sa principale caractéristique ?",
                        options: [
                            "Il ne concerne que les obligations d'État.",
                            "Il peut être éliminé par une bonne diversification.",
                            "Il ne peut pas être éliminé, il doit être accepté et géré par l'Allocation d'Actifs.",
                            "Il est synonyme de Risque de Liquidité.",
                            "Il ne se produit jamais sur la BRVM."
                        ],
                        correct_answer: 2,
                        explanation: "Le Risque Systémique (crise financière, pandémie, etc.) est inhérent au marché et ne peut être géré que par l'ajustement de l'Allocation d'Actifs."
                    },
                    {
                        id: 'q4',
                        question: "Le 'Corridor de Rééquilibrage' est un outil de gestion du risque qui consiste à :",
                        options: [
                            "Vendre tous ses actifs à chaque fois qu'ils font un gain de 10 %.",
                            "Acheter un seul titre chaque mois, indépendamment du prix.",
                            "Ramener périodiquement son portefeuille à son Allocation d'Actifs initiale (ex: vendre des actions montées pour racheter des obligations).",
                            "Ne réinvestir les dividendes qu'une fois par an.",
                            "Ne regarder son portefeuille qu'une fois par an."
                        ],
                        correct_answer: 2,
                        explanation: "Le rééquilibrage force l'investisseur à vendre 'cher' et acheter 'bon marché' pour maintenir son niveau de risque cible, luttant ainsi contre l'émotion."
                    },
                    {
                        id: 'q5',
                        question: "Quel est le Risque d'Inflation ?",
                        options: [
                            "Le risque qu'un titre chute de 50 %.",
                            "Le risque que les frais de gestion soient trop élevés.",
                            "Le risque que le pouvoir d'achat de votre argent investi diminue au fil du temps.",
                            "Le risque de ne pas trouver d'acheteur pour son titre.",
                            "Le risque d'une faillite d'entreprise."
                        ],
                        correct_answer: 2,
                        explanation: "L'inflation érode la valeur réelle de l'argent et des rendements, nécessitant d'investir pour que le rendement dépasse l'inflation."
                    },
                    {
                        id: 'q6',
                        question: "Un FCP/OPCVM est un outil de diversification car il permet à l'investisseur :",
                        options: [
                            "D'investir uniquement dans les produits structurés.",
                            "De gérer lui-même et activement son portefeuille.",
                            "D'obtenir une diversification instantanée sur des dizaines de titres pour un petit capital.",
                            "De ne subir aucun risque de marché.",
                            "D'acheter une seule action et d'être diversifié."
                        ],
                        correct_answer: 2,
                        explanation: "L'OPCVM (ou FCP) est un panier de titres géré par un professionnel, offrant une diversification clé en main même avec de faibles sommes."
                    },
                    {
                        id: 'q7',
                        question: "Le Risque de Liquidité se produit lorsque :",
                        options: [
                            "Le PER de l'entreprise est élevé.",
                            "Le Gearing est trop faible.",
                            "Un investisseur ne peut pas revendre rapidement son titre au juste prix (ou doit baisser drastiquement le prix pour trouver un acheteur).",
                            "Le Bénéfice Net par Action est négatif.",
                            "L'entreprise ne verse plus de dividendes."
                        ],
                        correct_answer: 2,
                        explanation: "La liquidité est la facilité et la rapidité avec laquelle un actif peut être converti en espèces. Une faible liquidité augmente le risque de perte en cas de besoin de vente urgente."
                    },
                    {
                        id: 'q8',
                        question: "Comment un investisseur avec un horizon Long Terme gère-t-il le Risque de Volatilité inhérent au marché des actions ?",
                        options: [
                            "En vendant toutes ses actions dès qu'il y a une baisse de 5 %.",
                            "En se concentrant sur le court terme (Market Timing).",
                            "En utilisant le temps (son meilleur allié) pour lisser les fluctuations et profiter de la croissance composée.",
                            "En n'achetant que des obligations d'État.",
                            "En réinvestissant tout son capital en une seule fois."
                        ],
                        correct_answer: 2,
                        explanation: "L'horizon long terme permet d'atténuer l'impact des cycles de marché et de faire jouer les intérêts composés sur la croissance."
                    },
                    {
                        id: 'q9',
                        question: "Quel est le danger principal de la 'Sur-diversification' ?",
                        options: [
                            "Elle augmente le risque spécifique.",
                            "Elle élimine tout le risque de marché.",
                            "Elle dilue les gains potentiels et rend le portefeuille plus difficile à gérer (trop d'actions à suivre).",
                            "Elle est obligatoire pour le profil Prudent.",
                            "Elle mène au Biais d'Ancrage."
                        ],
                        correct_answer: 2,
                        explanation: "Trop d'actifs (sur-diversification) rend le suivi et la gestion du portefeuille inefficaces, car les gains des uns compensent trop les pertes des autres, menant à des rendements moyens."
                    },
                    {
                        id: 'q10',
                        question: "L'Allocation d'Actifs est le premier outil de gestion du risque. Pour un profil 'Prudent', quelle allocation est recommandée (exemple) ?",
                        options: [
                            "80% Actions / 20% Obligations.",
                            "100% Liquidités.",
                            "70% Obligations / 30% Actions.",
                            "100% Actions.",
                            "Uniquement des cryptomonnaies."
                        ],
                        correct_answer: 2,
                        explanation: "Le profil Prudent privilégie la sécurité, d'où la majorité du capital en Obligations (ou assimilés) et une faible exposition aux Actions."
                    },
                    {
                        id: 'q11',
                        question: "Quel acteur du marché est votre meilleur allié pour réaliser une diversification professionnelle et de qualité (sans avoir à acheter des dizaines de titres vous-même) ?",
                        options: [
                            "Le DC/BR (Dépositaire Central/Banque de Règlement).",
                            "La BCEAO (Banque Centrale des États de l'Afrique de l'Ouest).",
                            "Un Spéculateur.",
                            "Un gérant d'OPCVM ou votre SGI (Société de Gestion et d'Intermédiation).",
                            "L'AMF-UMOA (Régulateur)."
                        ],
                        correct_answer: 3,
                        explanation: "Le gérant d'OPCVM (ou FCP) est le professionnel qui gère un portefeuille diversifié pour vous."
                    },
                    {
                        id: 'q12',
                        question: "Quel est l'un des risques spécifiques associés à l'investissement dans les Obligations ?",
                        options: [
                            "Le Risque Systémique (crise économique générale).",
                            "Le Risque d'Inflation.",
                            "Le Risque de Défaut (l'émetteur ne peut pas rembourser le capital ou payer les intérêts).",
                            "Le Risque de Volatilité des actions.",
                            "Le Biais d'Ancrage."
                        ],
                        correct_answer: 2,
                        explanation: "Le Risque de Défaut est la probabilité que l'émetteur (État ou entreprise) fasse défaut sur sa dette."
                    },
                    {
                        id: 'q13',
                        question: "Pourquoi les réinvestissements réguliers des dividendes (DCA) constituent-ils une bonne pratique de gestion du risque ?",
                        options: [
                            "Car ils réduisent le Risque Systémique.",
                            "Car ils augmentent la liquidité du titre.",
                            "Car ils permettent d'acheter plus d'actions sans effort (DCA) et de lisser le prix moyen, maximisant l'effet des intérêts composés.",
                            "Car ils garantissent un rendement minimum.",
                            "Car ils obligent à sur-diversifier."
                        ],
                        correct_answer: 2,
                        explanation: "Le réinvestissement des dividendes soutient le principe des intérêts composés et renforce la discipline du DCA (Dollar Cost Averaging)."
                    },
                    {
                        id: 'q14',
                        question: "Selon la règle de base, une diversification efficace doit inclure :",
                        options: [
                            "Uniquement des actions de deux secteurs différents.",
                            "Au moins 10 titres différents, répartis dans au moins 3 à 5 secteurs différents et 2 classes d'actifs (Actions et Obligations).",
                            "Seulement des titres à faible PER.",
                            "Uniquement des titres à fort dividende.",
                            "Seulement des titres d'une même banque."
                        ],
                        correct_answer: 1,
                        explanation: "La diversification doit être horizontale (classes d'actifs) et verticale (secteurs et titres) pour être efficace."
                    },
                    {
                        id: 'q15',
                        question: "Quel est le Risque de Contrepartie (Risque de Défaut) ?",
                        options: [
                            "Le risque que le cours de l'action s'effondre.",
                            "Le risque qu'un partenaire ou émetteur ne remplisse pas ses obligations financières (ex: ne pas payer l'intérêt d'une obligation).",
                            "Le risque d'une réglementation défavorable.",
                            "Le risque lié à la gestion du FCP.",
                            "Le risque d'une faible liquidité."
                        ],
                        correct_answer: 1,
                        explanation: "Le risque de contrepartie est le risque qu'une partie à une transaction financière ne tienne pas ses engagements."
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
createModule8Quiz();