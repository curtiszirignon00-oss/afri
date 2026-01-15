/// <reference types="node" />
// backend/scripts/create-module7-quiz.ts
// Script pour créer le quiz du Module 7 - Analyse Fondamentale

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule7Quiz() {
    try {
        console.log('🔍 Recherche du Module 7...');

        // Le slug est basé sur le titre du module : Analyse Fondamentale
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'analyse-technique' } 
        });

        if (!module) {
            console.error('❌ Module 7 non trouvé. Vérifiez le slug: analyse-fondamentale');
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
                        question: "Quel est le rôle principal du Compte de Résultat (P&L - Profit and Loss) ?",
                        options: [
                            "Mesurer les actifs et passifs à un moment donné.",
                            "Évaluer les flux de trésorerie réels.",
                            "Mesurer la performance de l'entreprise et son Bénéfice Net sur une période donnée.",
                            "Déterminer si l'action est chère ou bon marché.",
                            "Calculer le niveau d'endettement."
                        ],
                        correct_answer: 2,
                        explanation: "Le Compte de Résultat mesure la performance (gains et pertes) sur une période donnée (année ou trimestre)."
                    },
                    {
                        id: 'q2',
                        question: "Le Bilan, deuxième pilier de l'analyse fondamentale, est décrit comme :",
                        options: [
                            "Le mouvement des ventes sur l'année.",
                            "Une photographie à un instant T de ce que l'entreprise possède (Actifs) et de ce qu'elle doit (Passifs).",
                            "Un historique des dividendes versés.",
                            "Un outil pour prédire la croissance future.",
                            "Le total du Chiffre d'Affaires."
                        ],
                        correct_answer: 1,
                        explanation: "Le Bilan est une photographie instantanée qui répond à la question : Qu'est-ce qu'on possède et qu'est-ce qu'on doit ? (Actifs = Passifs)."
                    },
                    {
                        id: 'q3',
                        question: "Quel est l'état financier considéré comme le plus honnête ou crucial pour savoir si l'entreprise génère réellement du liquide (cash) ?",
                        options: [
                            "Le Compte de Résultat (Bénéfice Net).",
                            "Le Bilan (Actifs).",
                            "Le Ratio d'Endettement (Gearing).",
                            "Le Tableau des Flux de Trésorerie (TFT/Cash Flow).",
                            "Le Rapport de l'AMF-UMOA."
                        ],
                        correct_answer: 3,
                        explanation: "Le Tableau des Flux de Trésorerie est le plus difficile à manipuler, car il montre les mouvements réels de cash entrant et sortant."
                    },
                    {
                        id: 'q4',
                        question: "Le PER (Price-to-Earnings Ratio) est le ratio le plus célèbre car il mesure :",
                        options: [
                            "La rentabilité des capitaux propres.",
                            "Le niveau d'endettement de l'entreprise.",
                            "Combien les investisseurs sont prêts à payer pour chaque franc CFA de bénéfice net annuel.",
                            "Le pourcentage du Chiffre d'Affaires conservé en Bénéfice Net.",
                            "La croissance future des ventes."
                        ],
                        correct_answer: 2,
                        explanation: "Le PER calcule le nombre d'années de bénéfices qu'il faudrait pour 'récupérer' l'investissement initial, c'est le prix du bénéfice."
                    },
                    {
                        id: 'q5',
                        question: "Quelle est la formule correcte de la Marge Nette ?",
                        options: [
                            "Bénéfice Net / Capitaux Propres.",
                            "Dette Nette / Capitaux Propres.",
                            "Chiffre d'Affaires / Bénéfice Net.",
                            "Bénéfice Net / Chiffre d'Affaires.",
                            "Cours de l'action / Bénéfice Net par Action."
                        ],
                        correct_answer: 3,
                        explanation: "La Marge Nette mesure quel pourcentage du Chiffre d'Affaires (ventes totales) est conservé comme Bénéfice Net."
                    },
                    {
                        id: 'q6',
                        question: "Un ROE (Return on Equity) de 15 % et plus est considéré comme excellent. Que mesure le ROE ?",
                        options: [
                            "La capacité de l'entreprise à rembourser ses dettes.",
                            "L'efficacité avec laquelle l'entreprise utilise l'argent investi par ses actionnaires pour générer du profit.",
                            "Le prix de l'action par rapport à sa valeur comptable.",
                            "Le taux de croissance du dividende.",
                            "Le pourcentage des ventes conservé en profit."
                        ],
                        correct_answer: 1,
                        explanation: "Le ROE mesure l'efficacité de la gestion, c'est-à-dire le bénéfice généré à partir de l'argent (Capitaux Propres) des actionnaires."
                    },
                    {
                        id: 'q7',
                        question: "Le Ratio d'Endettement (Gearing) est égal à la Dette Nette divisée par les Capitaux Propres. Un Gearing élevé indique :",
                        options: [
                            "Une très faible rentabilité (ROE).",
                            "Que l'entreprise est sous-évaluée.",
                            "Que l'entreprise est très dépendante de la dette bancaire et vulnérable aux hausses de taux de la BCEAO.",
                            "Que le Bénéfice Net par Action est en forte croissance.",
                            "Que l'entreprise ne paie pas de dividendes."
                        ],
                        correct_answer: 2,
                        explanation: "Un Gearing élevé (Dette > Capitaux Propres) signifie que l'entreprise repose trop sur l'emprunt et est vulnérable au risque de taux d'intérêt ou de crise."
                    },
                    {
                        id: 'q8',
                        question: "Comment interprète-t-on généralement un PER Élevé (ex: 20+) sur la BRVM ?",
                        options: [
                            "L'action est une bonne affaire (Value Investing).",
                            "Le marché anticipe une très forte croissance future de ses bénéfices.",
                            "L'entreprise est sur le point de verser un dividende exceptionnel.",
                            "L'entreprise est en difficulté financière.",
                            "Le Gearing est obligatoirement faible."
                        ],
                        correct_answer: 1,
                        explanation: "Un PER élevé est souvent le signe que le marché anticipe une forte croissance future (Growth Investing)."
                    },
                    {
                        id: 'q9',
                        question: "Pour un Flux de Trésorerie d'Exploitation (FTE) considéré comme 'de haute qualité', il doit être :",
                        options: [
                            "Négatif.",
                            "Égal au Chiffre d'Affaires.",
                            "Positif et supérieur au Bénéfice Net.",
                            "Inférieur au montant des dividendes versés.",
                            "Indépendant de l'activité normale de l'entreprise."
                        ],
                        correct_answer: 2,
                        explanation: "Si le FTE (cash généré par l'activité) est supérieur au Bénéfice Net (résultat comptable), c'est un excellent signe que les profits sont de haute qualité."
                    },
                    {
                        id: 'q10',
                        question: "Quelle méthode de valorisation est la plus utile pour les entreprises matures de la BRVM qui versent des dividendes stables (comme les banques et télécoms) ?",
                        options: [
                            "La Méthode des Comparables (Multiples).",
                            "Le Discounted Cash Flow (DCF).",
                            "La Méthode des Dividendes Actualisés (DDM).",
                            "La spéculation.",
                            "Le Biais d'Ancrage."
                        ],
                        correct_answer: 2,
                        explanation: "La DDM (Dividendes Actualisés) est très pertinente pour les entreprises dont la valeur est principalement basée sur le revenu régulier qu'elles distribuent."
                    },
                    {
                        id: 'q11',
                        question: "L'Analyse Fondamentale est l'art de déterminer la Valeur Intrinsèque d'une entreprise. Qu'est-ce que la Valeur Intrinsèque ?",
                        options: [
                            "Le prix du titre affiché en bourse aujourd'hui.",
                            "Le prix maximum que l'entreprise peut atteindre.",
                            "La vraie valeur estimée d'une entreprise, indépendante de son prix en bourse.",
                            "Le montant total du dividende versé l'an dernier.",
                            "Le Chiffre d'Affaires après impôts."
                        ],
                        correct_answer: 2,
                        explanation: "La valeur intrinsèque est l'estimation de la valeur réelle de l'entreprise, souvent différente du prix que le marché lui attribue."
                    },
                    {
                        id: 'q12',
                        question: "Quel ratio est le plus important pour une entreprise de Télécommunication (ex: Sonatel) qui investit massivement pour son avenir (5G, infrastructures) ?",
                        options: [
                            "La Marge Nette.",
                            "Le ROE.",
                            "Le Gearing (endettement, pour financer les lourdes infrastructures).",
                            "Le Flux de Trésorerie d'Investissement.",
                            "Le Bénéfice Net par Action."
                        ],
                        correct_answer: 2,
                        explanation: "Le Gearing est crucial pour les entreprises en forte croissance nécessitant des infrastructures, car il indique si elles sont trop endettées pour financer leur expansion."
                    },
                    {
                        id: 'q13',
                        question: "Selon la 'Règle du débutant' du module, en analysant le Bilan, vous devez vous assurer que :",
                        options: [
                            "Le Bénéfice Net est en croissance de 20 %.",
                            "La Marge Nette est supérieure à 5 %.",
                            "Les Capitaux Propres couvrent largement les dettes de l'entreprise.",
                            "Le PER est inférieur à 10.",
                            "Le ROE est inférieur à 5 %."
                        ],
                        correct_answer: 2,
                        explanation: "Les Capitaux Propres représentent les fonds propres de l'actionnaire ; ils doivent être supérieurs aux dettes pour garantir une bonne solvabilité."
                    },
                    {
                        id: 'q14',
                        question: "La croissance du Chiffre d'Affaires d'une entreprise sur une période de 5 ans est un indicateur de base qui révèle :",
                        options: [
                            "Uniquement sa valorisation.",
                            "Sa capacité à contrôler ses coûts.",
                            "La stabilité et la bonne santé de son activité (l'entreprise vend de plus en plus).",
                            "Son niveau d'endettement.",
                            "Le montant du dividende."
                        ],
                        correct_answer: 2,
                        explanation: "Une croissance régulière du Chiffre d'Affaires sur 5 ans est le premier indicateur d'une bonne santé opérationnelle de l'entreprise."
                    },
                    {
                        id: 'q15',
                        question: "La Méthode des Comparables (Multiples) consiste, pour le débutant, à :",
                        options: [
                            "Calculer la somme des dividendes futurs actualisés.",
                            "Déterminer la valeur intrinsèque grâce aux Flux de Trésorerie Actualisés (DCF).",
                            "Calculer les ratios clés (PER, ROE) de l'entreprise cible et les comparer à la moyenne de son secteur à la BRVM.",
                            "Acheter au plus bas et vendre au plus haut.",
                            "Se fier uniquement au prix de l'action."
                        ],
                        correct_answer: 2,
                        explanation: "La méthode des comparables est la plus simple : elle compare les ratios d'une entreprise à ceux de ses concurrents du même secteur pour évaluer si elle est sous ou surévaluée."
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
createModule7Quiz();