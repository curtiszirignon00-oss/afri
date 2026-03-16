/// <reference types="node" />
// backend/scripts/create-module9-quiz-consolidation.ts
// Script pour créer le quiz de Consolidation du Module 9 - L'Analyse Extra-Financière

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule9ConsolidationQuiz() {
    try {
        console.log('🔍 Recherche du Module 9...');

        // Le slug est basé sur le titre du module : L’Analyse Extra-Financière - Comprendre le Contexte
        // À ADAPTER selon le slug exact dans votre base de données
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'contexte-economique' } 
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

        // Créer le quiz avec 17 questions
        console.log('📝 Création du quiz avec 17 questions...');

        const quiz = await prisma.quiz.create({
            data: {
                moduleId: module.id,
                passing_score: 80,
                questions: [
                    {
                        id: 'q1',
                        question: "L'Analyse Qualitative a pour but principal de répondre à quelle question fondamentale ?",
                        options: [
                            "Quel est le PER de l'entreprise ? (Analyse Quantitative)",
                            "Quel est le niveau d'endettement ? (Analyse Quantitative)",
                            "L'entreprise est-elle bien gérée, bien positionnée et son modèle est-il durable ?",
                            "Quel est le prix de l'action aujourd'hui ?",
                            "Comment calculer le WACC ?"
                        ],
                        correct_answer: 2,
                        explanation: "Contrairement à l'analyse quantitative qui se base sur les chiffres, l'analyse qualitative évalue la viabilité à long terme, le positionnement et la qualité du management."
                    },
                    {
                        id: 'q2',
                        question: "Dans l'analyse qualitative, qu'est-ce que l'on appelle le \"Moat\" (Fossé) d'une entreprise ?",
                        options: [
                            "Le bénéfice net annuel de l'entreprise.",
                            "La dette totale à long terme.",
                            "L'avantage concurrentiel durable qui protège l'entreprise de ses rivaux (barrière à l'entrée, réseau, marque).",
                            "Le bilan financier.",
                            "La somme des actifs immobilisés."
                        ],
                        correct_answer: 2,
                        explanation: "Le 'Moat' est le rempart immatériel (image de marque, brevets, effet de réseau) qui protège les parts de marché et les marges de l'entreprise face à la concurrence."
                    },
                    {
                        id: 'q3',
                        question: "Pourquoi la qualité du Leadership et de la Direction est-elle particulièrement vitale sur un marché comme la BRVM ?",
                        options: [
                            "Parce que les entreprises cotées ne paient pas d'impôts.",
                            "Parce que la diversification n'y est pas possible.",
                            "Car le marché est moins couvert par les analystes internationaux, rendant l'information interne plus critique.",
                            "Car seul le Gearing est pertinent.",
                            "Car l'AMF-UMOA ne supervise pas les dirigeants."
                        ],
                        correct_answer: 2,
                        explanation: "Sur des marchés régionaux moins suivis par la presse financière mondiale, l'intégrité et la vision du management sont les meilleures garanties pour l'investisseur."
                    },
                    {
                        id: 'q4',
                        question: "Quels sont les trois critères du reporting ESG ?",
                        options: [
                            "Émissions, Salaires, Dividendes.",
                            "Actifs, Passifs, Capitaux Propres.",
                            "Bénéfices, Croissance, Dette.",
                            "Environnement, Social, Gouvernance.",
                            "Éthique, Sécurité, Garantie."
                        ],
                        correct_answer: 3,
                        explanation: "ESG signifie Environnement, Social et Gouvernance. Ce sont les 3 piliers de l'analyse extra-financière d'une entreprise."
                    },
                    {
                        id: 'q5',
                        question: "Dans l'analyse ESG, que couvre principalement le pilier \"Gouvernance\" ?",
                        options: [
                            "Les émissions de carbone et la gestion des déchets. (Environnement)",
                            "Les relations avec les employés et les communautés locales. (Social)",
                            "La transparence de la direction, l'indépendance du conseil d'administration et la lutte contre la corruption.",
                            "La performance boursière de l'action.",
                            "Le montant des flux de trésorerie."
                        ],
                        correct_answer: 2,
                        explanation: "La Gouvernance s'intéresse à la façon dont l'entreprise est dirigée, à l'équilibre des pouvoirs et à l'éthique de ses dirigeants."
                    },
                    {
                        id: 'q6',
                        question: "Quelle est la tendance majeure observée à l'international concernant l'intégration de l'ESG dans l'investissement ?",
                        options: [
                            "Les investisseurs n'y prêtent plus attention.",
                            "Il est devenu interdit par les régulateurs.",
                            "Il est devenu un critère essentiel de sélection pour les investisseurs institutionnels mondiaux.",
                            "Il ne s'applique qu'aux entreprises non cotées.",
                            "Il est systématiquement ignoré par les banques centrales."
                        ],
                        correct_answer: 2,
                        explanation: "L'ESG n'est plus une niche mais une norme globale. Les grands fonds d'investissement excluent de plus en plus les entreprises mal notées sur ces critères."
                    },
                    {
                        id: 'q7',
                        question: "L'objectif des Investissements Socialement Responsables (ISR) est de :",
                        options: [
                            "Prioriser le Market Timing.",
                            "N'investir que dans des obligations d'État.",
                            "Réaliser une performance financière tout en ayant un impact positif sur la société.",
                            "Ignorer l'Analyse Fondamentale.",
                            "Se concentrer uniquement sur le PER et le Gearing."
                        ],
                        correct_answer: 2,
                        explanation: "L'ISR cherche à concilier rentabilité économique et impact positif (ou neutre) sur le plan éthique, social et environnemental."
                    },
                    {
                        id: 'q8',
                        question: "Quel type de Moat est créé par l'effet de réseau des télécommunications ou des banques (ex. : plus il y a d'utilisateurs, plus le service est utile) ?",
                        options: [
                            "L'avantage de coût.",
                            "Les Coûts de Changement ou l'Effet de Réseau.",
                            "L'actif matériel.",
                            "La gestion de la dette.",
                            "Le Biais d'Ancrage."
                        ],
                        correct_answer: 1,
                        explanation: "L'effet de réseau rend un service indispensable car sa valeur croît avec le nombre d'utilisateurs, créant une barrière massive pour les nouveaux entrants."
                    },
                    {
                        id: 'q9',
                        question: "Pourquoi un investisseur doit-il analyser la stratégie de rémunération de la direction ?",
                        options: [
                            "Pour calculer la Valeur Intrinsèque.",
                            "Pour s'assurer qu'elle est décorrélée de la performance.",
                            "Pour vérifier si elle est alignée sur la performance à long terme de l'entreprise (et non les bénéfices à court terme).",
                            "Pour déterminer la Marge Nette.",
                            "Pour s'assurer que l'AMF-UMOA est satisfaite."
                        ],
                        correct_answer: 2,
                        explanation: "Si les dirigeants sont primés sur le court terme, ils pourraient prendre des risques démesurés. Leur rémunération doit encourager la croissance saine et durable."
                    },
                    {
                        id: 'q10',
                        question: "Le module recommande de combiner l'analyse quantitative (M7 & M8) et qualitative (M9) avant la prise de décision. Cette approche est appelée :",
                        options: [
                            "Market Timing.",
                            "Biais de Récence.",
                            "L'approche Holistique ou Complète (synthèse).",
                            "L'approche DCF.",
                            "L'analyse du Gearing."
                        ],
                        correct_answer: 2,
                        explanation: "Une approche holistique prend en compte l'entreprise dans sa globalité (chiffres financiers ET facteurs humains/stratégiques) pour limiter les erreurs."
                    },
                    {
                        id: 'q11',
                        question: "L'un des risques principaux de la non-prise en compte des critères ESG est :",
                        options: [
                            "Le Biais d'Ancrage.",
                            "Le Risque de Réputation (scandale) ou le Risque Réglementaire (amendes).",
                            "Le Risque de Taux d'Intérêt.",
                            "Le Risque de liquidité du titre.",
                            "La nécessité d'utiliser le DCA."
                        ],
                        correct_answer: 1,
                        explanation: "Une mauvaise gestion ESG peut entraîner des amendes sévères (pollution) ou des boycotts (scandales sociaux), détruisant rapidement la valeur de l'action."
                    },
                    {
                        id: 'q12',
                        question: "Dans la Synthèse Finale, l'étape cruciale est de comparer la Valeur Intrinsèque (V) à :",
                        options: [
                            "Le Bénéfice Net par Action (BPA).",
                            "La Dette Nette de l'entreprise.",
                            "Le rendement du PER.",
                            "Le Cours actuel de l'action (P) en Bourse.",
                            "Le taux de croissance du PIB."
                        ],
                        correct_answer: 3,
                        explanation: "Tout le but de l'analyse est de déterminer la Valeur Intrinsèque (ce que vaut l'entreprise) pour la comparer au Prix (ce que demande le marché)."
                    },
                    {
                        id: 'q13',
                        question: "Si la Valeur Intrinsèque (V) est significativement supérieure au Cours Actuel (P) de l'action, qu'est-ce que cela signifie ?",
                        options: [
                            "Qu'il faut vendre immédiatement.",
                            "L'action est potentiellement sous-évaluée et offre une Marge de Sécurité.",
                            "L'action est surévaluée et trop chère.",
                            "Que le risque systémique est très faible.",
                            "Que l'on doit augmenter le Gearing."
                        ],
                        correct_answer: 1,
                        explanation: "C'est le signal d'achat idéal en investissement Value : acheter 1 000 FCFA quelque chose qui en vaut réellement 1 500 FCFA."
                    },
                    {
                        id: 'q14',
                        question: "La Marge de Sécurité pour un investisseur est :",
                        options: [
                            "Le niveau maximum de dette qu'il peut tolérer.",
                            "Le pourcentage de croissance du Chiffre d'Affaires.",
                            "Le rendement du ROE.",
                            "La différence positive entre la valeur intrinsèque de l'entreprise et son prix en bourse.",
                            "L'absence totale de volatilité."
                        ],
                        correct_answer: 3,
                        explanation: "Plus la marge de sécurité est grande (la différence entre la valeur réelle et le prix d'achat), plus l'investisseur est protégé contre ses propres erreurs d'évaluation."
                    },
                    {
                        id: 'q15',
                        question: "Quel élément fait partie du pilier Social de l'ESG ?",
                        options: [
                            "La consommation d'énergie.",
                            "La santé et la sécurité des employés.",
                            "L'indépendance du conseil d'administration.",
                            "Le niveau d'endettement.",
                            "Le prix de l'action."
                        ],
                        correct_answer: 1,
                        explanation: "Le pilier Social concerne l'impact de l'entreprise sur l'humain : ses employés (santé, parité, conditions de travail) et la communauté."
                    },
                    {
                        id: 'q16',
                        question: "Le but de l'analyse qualitative est de s'assurer que l'entreprise analysée survivra et prospérera sur un horizon de :",
                        options: [
                            "Quelques jours (Market Timing).",
                            "Moins de 1 an.",
                            "Moyen terme (3-5 ans).",
                            "Long terme (au-delà de 10 ans).",
                            "Un seul cycle économique."
                        ],
                        correct_answer: 3,
                        explanation: "L'analyse qualitative s'inscrit toujours dans une démarche de très long terme pour capter l'effet cumulé des avantages concurrentiels."
                    },
                    {
                        id: 'q17',
                        question: "Quel est le danger de fonder sa décision d'investissement uniquement sur les ratios (PER, ROE, etc.) sans analyse qualitative ?",
                        options: [
                            "Le Biais de Récence.",
                            "L'Ancrage.",
                            "Ignorer les signaux d'alerte comme une mauvaise gestion ou un avantage concurrentiel érodé, qui sont non chiffrés.",
                            "L'augmentation des frais de SGI.",
                            "La sur-diversification du portefeuille."
                        ],
                        correct_answer: 2,
                        explanation: "Un ratio exceptionnel peut cacher une entreprise dont le produit devient obsolète (ex: Kodak). Seule l'analyse qualitative permet d'anticiper la chute."
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
createModule9ConsolidationQuiz();