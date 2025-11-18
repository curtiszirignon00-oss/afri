// backend/scripts/create-module9-quiz.ts
// Script pour créer le quiz du Module 9 - L'Analyse Extra-Financière

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule9Quiz() {
    try {
        console.log('🔍 Recherche du Module 9...');

        // Le slug est basé sur le titre du module : L’Analyse Extra-Financière
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'contexte-economique' } 
        });

        if (!module) {
            console.error('❌ Module 9 non trouvé. Vérifiez le slug: lanalyse-extra-financiere');
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
                        question: "L'Analyse Qualitative, par opposition à l'Analyse Quantitative, a pour but principal de répondre à quelle question fondamentale ?",
                        options: [
                            "Quel est le PER de l'entreprise ?",
                            "Quel est le niveau d'endettement ?",
                            "L'entreprise est-elle bien gérée, bien positionnée et son modèle est-il durable ?",
                            "Quel est le prix de l'action aujourd'hui ?",
                            "Comment calculer le Bénéfice Net ?"
                        ],
                        correct_answer: 2,
                        explanation: "L'Analyse Qualitative se concentre sur l'intangible (qualité du management, avantage concurrentiel, durabilité du modèle), non mesurable directement par les chiffres."
                    },
                    {
                        id: 'q2',
                        question: "Dans l'analyse qualitative, qu'est-ce que l'on appelle le 'Moat' (Fossé) d'une entreprise ?",
                        options: [
                            "Le bénéfice net annuel de l'entreprise.",
                            "La dette totale à long terme.",
                            "L'avantage concurrentiel durable qui protège l'entreprise de ses rivaux (barrière à l'entrée, marque, réseau).",
                            "Le bilan financier.",
                            "La somme des actifs immobilisés."
                        ],
                        correct_answer: 2,
                        explanation: "Le 'Moat' (fossé) est une métaphore popularisée par Warren Buffett désignant une barrière qui empêche la concurrence de nuire à la rentabilité de l'entreprise."
                    },
                    {
                        id: 'q3',
                        question: "Pourquoi la qualité du Leadership et de la Direction est-elle particulièrement vitale sur un marché comme la BRVM ?",
                        options: [
                            "Parce que les entreprises cotées ne paient pas d'impôts.",
                            "Parce que la diversification n'y est pas possible.",
                            "Car le marché est moins couvert par les analystes internationaux, rendant l'information interne plus critique pour évaluer les dirigeants.",
                            "Car seul le Gearing est pertinent.",
                            "Car l'AMF-UMOA ne supervise pas les dirigeants."
                        ],
                        correct_answer: 2,
                        explanation: "Moins d'analyses externes signifie que l'investisseur doit accorder plus de poids à l'intégrité et à la vision stratégique du management."
                    },
                    {
                        id: 'q4',
                        question: "Quels sont les trois critères du reporting ESG (Environnement, Social, Gouvernance) ?",
                        options: [
                            "Endettement, Solvabilité, Croissance.",
                            "Actifs, Passifs, Capitaux Propres.",
                            "Environnement, Social, Gouvernance.",
                            "Bénéfice Net, Chiffre d'Affaires, Marge Nette.",
                            "Liquidité, Rendement, Volatilité."
                        ],
                        correct_answer: 2,
                        explanation: "ESG est l'acronyme pour Environnemental, Social et de Gouvernance, utilisés pour évaluer les performances extra-financières."
                    },
                    {
                        id: 'q5',
                        question: "Le pilier 'Gouvernance' de l'ESG se concentre sur :",
                        options: [
                            "La consommation d'énergie de l'entreprise.",
                            "La santé et la sécurité des employés.",
                            "Le partage des bénéfices avec la communauté.",
                            "L'indépendance du Conseil d'Administration et la transparence de la rémunération des dirigeants.",
                            "Le taux d'endettement (Gearing)."
                        ],
                        correct_answer: 3,
                        explanation: "La Gouvernance évalue la façon dont l'entreprise est dirigée et contrôlée, notamment l'équilibre des pouvoirs et l'intégrité."
                    },
                    {
                        id: 'q6',
                        question: "Quelle est la principale raison d'intégrer l'Analyse ESG dans une décision d'investissement ?",
                        options: [
                            "Elle garantit un rendement supérieur à 20 %.",
                            "Elle élimine le risque systémique.",
                            "Elle identifie des risques non financiers (ex: scandale, réglementation) qui peuvent impacter la performance et le cours de l'action à long terme.",
                            "Elle ne s'applique qu'aux banques.",
                            "Elle simplifie le calcul du PER."
                        ],
                        correct_answer: 2,
                        explanation: "Les risques ESG (ex: pollution, corruption) sont des facteurs à long terme qui peuvent détruire la valeur pour l'actionnaire."
                    },
                    {
                        id: 'q7',
                        question: "Le 'Management' (Leadership) d'une entreprise doit idéalement avoir deux qualités essentielles pour l'investisseur long terme :",
                        options: [
                            "Être jeune et sur-diversifié.",
                            "Être endetté et avoir un faible ROE.",
                            "Être transparent et avoir une bonne exécution (capacité à réaliser les plans stratégiques).",
                            "Ne verser aucun dividende.",
                            "Être l'unique propriétaire de l'entreprise."
                        ],
                        correct_answer: 2,
                        explanation: "La transparence inspire confiance, et la capacité d'exécution garantit que les promesses seront tenues (ou au moins que les erreurs seront gérées)."
                    },
                    {
                        id: 'q8',
                        question: "L'Analyse Qualitative est particulièrement utile pour déterminer l'investissement d'une entreprise dans :",
                        options: [
                            "Son Gearing.",
                            "Son bénéfice passé.",
                            "La recherche et développement (R&D) et l'innovation future.",
                            "Son PER actuel.",
                            "La dette nette."
                        ],
                        correct_answer: 2,
                        explanation: "L'analyse qualitative permet d'évaluer l'engagement dans l'innovation, ce qui est un facteur clé de croissance future mais n'apparaît pas toujours directement dans les ratios financiers."
                    },
                    {
                        id: 'q9',
                        question: "Un Moat basé sur les 'Coûts de Transfert Élevés' signifie que :",
                        options: [
                            "L'entreprise a des frais de personnel très faibles.",
                            "Il est très facile et peu coûteux pour un client de passer à un concurrent.",
                            "Il est difficile, coûteux ou dérangeant pour un client de quitter l'entreprise pour un concurrent.",
                            "L'entreprise a un faible Gearing.",
                            "L'entreprise est en situation de monopole."
                        ],
                        correct_answer: 2,
                        explanation: "Plus les coûts de transfert sont élevés (ex: système informatique complexe, intégration), plus l'entreprise est protégée de ses rivaux."
                    },
                    {
                        id: 'q10',
                        question: "Si la Valeur Intrinsèque d'une action est estimée à 5 000 FCFA, et que son prix en bourse est de 3 500 FCFA, qu'est-ce que cela signifie ?",
                        options: [
                            "Qu'il faut vendre immédiatement.",
                            "L'action est potentiellement sous-évaluée et offre une Marge de Sécurité.",
                            "L'action est surévaluée et trop chère.",
                            "Que le risque systémique est très faible.",
                            "Que l'on doit augmenter le Gearing."
                        ],
                        correct_answer: 1,
                        explanation: "Le prix inférieur à la valeur intrinsèque (Marge de Sécurité) est le principe de base du Value Investing (Module 6)."
                    },
                    {
                        id: 'q11',
                        question: "La Marge de Sécurité pour un investisseur est :",
                        options: [
                            "Le niveau maximum de dette qu'il peut tolérer.",
                            "Le pourcentage de croissance du Chiffre d'Affaires.",
                            "Le rendement du ROE.",
                            "La différence positive entre la valeur intrinsèque de l'entreprise et son prix en bourse.",
                            "L'absence totale de volatilité."
                        ],
                        correct_answer: 3,
                        explanation: "La Marge de Sécurité sert de tampon contre les erreurs d'analyse ou les événements imprévus du marché, selon Benjamin Graham."
                    },
                    {
                        id: 'q12',
                        question: "Quel élément fait partie du pilier 'Social' de l'ESG ?",
                        options: [
                            "La consommation d'énergie.",
                            "La santé, la sécurité et l'équité des employés.",
                            "L'indépendance du conseil d'administration.",
                            "Le niveau d'endettement.",
                            "Le prix de l'action."
                        ],
                        correct_answer: 1,
                        explanation: "Le pilier Social concerne l'impact de l'entreprise sur ses parties prenantes internes et externes (employés, fournisseurs, communautés)."
                    },
                    {
                        id: 'q13',
                        question: "Le but de l'analyse qualitative est de s'assurer que l'entreprise analysée survivra et prospérera sur un horizon de :",
                        options: [
                            "Quelques jours (Market Timing).",
                            "Moins de 1 an.",
                            "Moyen terme (3-5 ans).",
                            "Long terme (au-delà de 10 ans).",
                            "Un seul cycle économique."
                        ],
                        correct_answer: 3,
                        explanation: "L'Analyse Qualitative est toujours orientée vers le très long terme, car elle évalue la durabilité du modèle économique."
                    },
                    {
                        id: 'q14',
                        question: "Quel est le danger de fonder sa décision d'investissement uniquement sur les ratios (PER, ROE, etc.) sans analyse qualitative ?",
                        options: [
                            "Les ratios ne s'appliquent qu'aux obligations.",
                            "Risque d'acheter une entreprise 'pas chère' (faible PER) dont le modèle économique est en déclin ou non durable (piège de la valeur).",
                            "Cela bloque l'effet des intérêts composés.",
                            "Cela augmente le risque systémique.",
                            "Cela rend le portefeuille trop diversifié."
                        ],
                        correct_answer: 1,
                        explanation: "Une entreprise avec un faible PER n'est pas chère si elle est sur le point de faire faillite. L'analyse qualitative est essentielle pour éviter les 'pièges de la valeur'."
                    },
                    {
                        id: 'q15',
                        question: "Le critère 'Environnement' de l'ESG se concentre sur :",
                        options: [
                            "La composition du Conseil d'Administration.",
                            "Le niveau d'endettement et de trésorerie.",
                            "L'impact de l'entreprise sur la planète (émissions de carbone, gestion des déchets, consommation d'eau).",
                            "La sécurité des employés.",
                            "La croissance du Bénéfice Net."
                        ],
                        correct_answer: 2,
                        explanation: "Il mesure la performance de l'entreprise dans la gestion des ressources naturelles et des enjeux climatiques."
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
createModule9Quiz();