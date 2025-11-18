// backend/scripts/create-module10-quiz.ts
// Script pour créer le quiz du Module 10 - L’Art du Timing – Analyse Technique

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule10Quiz() {
    try {
        console.log('🔍 Recherche du Module 10...');

        // Le slug est basé sur le titre du module : L’Art du Timing – Analyse Technique
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'passage-a-l-action' } 
        });

        if (!module) {
            console.error('❌ Module 10 non trouvé. Vérifiez le slug: lart-du-timing');
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
                        question: "Quel est le postulat fondamental de l'Analyse Technique (AT) ?",
                        options: [
                            "Le prix actuel ne reflète aucune information sur l'entreprise.",
                            "Les prix des actions évoluent de manière totalement aléatoire.",
                            "Le Market Timing est la seule stratégie efficace pour les débutants.",
                            "Le prix actuel de l'action reflète déjà toutes les informations fondamentales, économiques et psychologiques connues.",
                            "L'analyse technique est plus importante que l'analyse fondamentale."
                        ],
                        correct_answer: 3,
                        explanation: "L'AT repose sur l'idée que le marché est efficient et que toute information (connue ou anticipée) est déjà dans le prix."
                    },
                    {
                        id: 'q2',
                        question: "Quel est le rôle de l'Analyse Technique pour l'investisseur long terme (Mamadou) ?",
                        options: [
                            "Remplacer l'Analyse Fondamentale.",
                            "Seul outil pour spéculer à court terme.",
                            "Aider à déterminer le meilleur point d'entrée (timing) pour un titre déjà jugé bon par l'analyse fondamentale.",
                            "Évaluer la valeur intrinsèque (DCF) d'une entreprise.",
                            "Calculer le Gearing et le PER."
                        ],
                        correct_answer: 2,
                        explanation: "Pour le long terme, l'AT sert uniquement à optimiser le moment d'achat d'une entreprise de qualité."
                    },
                    {
                        id: 'q3',
                        question: "Qu'est-ce qu'une Moyenne Mobile (MM) sur un graphique de prix ?",
                        options: [
                            "Le niveau de prix le plus haut jamais atteint.",
                            "Une ligne traçant le prix moyen lissé sur une période donnée (ex: 50 ou 200 jours).",
                            "Un indicateur de momentum mesurant le surachat ou la survente.",
                            "Le bénéfice net par action actualisé.",
                            "Le niveau de prix qui agit comme un plafond psychologique."
                        ],
                        correct_answer: 1,
                        explanation: "La Moyenne Mobile est un indicateur de tendance qui lisse la volatilité pour rendre la direction des prix plus claire."
                    },
                    {
                        id: 'q4',
                        question: "Dans l'AT, que représente le **Support** ?",
                        options: [
                            "Le niveau de prix où les vendeurs dominent, agissant comme un plafond psychologique.",
                            "Le niveau de prix où les acheteurs dominent, agissant comme un plancher psychologique.",
                            "Un indicateur de volume de transactions.",
                            "Le ratio d'endettement (Gearing) de l'entreprise.",
                            "Le PER de l'entreprise."
                        ],
                        correct_answer: 1,
                        explanation: "Le Support est un prix où la demande est suffisamment forte pour stopper une baisse."
                    },
                    {
                        id: 'q5',
                        question: "Dans l'AT, que représente la **Résistance** ?",
                        options: [
                            "Le niveau de prix où les vendeurs dominent, agissant comme un plafond psychologique.",
                            "Le niveau de prix où les acheteurs dominent, agissant comme un plancher psychologique.",
                            "Le ratio ROE (Return on Equity).",
                            "La Marge Nette de l'entreprise.",
                            "Le Bilan de l'entreprise."
                        ],
                        correct_answer: 0,
                        explanation: "La Résistance est un prix où l'offre est suffisamment forte pour stopper une hausse."
                    },
                    {
                        id: 'q6',
                        question: "Comment se définit une **Tendance Haussière** sur un graphique de prix ?",
                        options: [
                            "Le cours reste stable dans un canal horizontal.",
                            "Les hauts et les bas des prix sont de plus en plus bas.",
                            "Les hauts et les bas des prix sont de plus en plus hauts (structure en escalier montant).",
                            "Le cours de l'action est sous sa Moyenne Mobile 200 jours.",
                            "Le RSI est toujours inférieur à 30."
                        ],
                        correct_answer: 2,
                        explanation: "Une tendance haussière est caractérisée par une succession de sommets et de creux ascendants."
                    },
                    {
                        id: 'q7',
                        question: "Le RSI (Relative Strength Index) est un oscillateur de momentum. Que mesure-t-il ?",
                        options: [
                            "Le Gearing (endettement).",
                            "La Force et la Vitesse (Momentum) des mouvements de prix pour identifier le surachat ou la survente.",
                            "Le niveau d'endettement de l'entreprise.",
                            "L'écart entre le prix et la Moyenne Mobile 200 jours.",
                            "La Marge de Sécurité."
                        ],
                        correct_answer: 1,
                        explanation: "Le RSI est un indicateur de vitesse et de changement de mouvement des prix, variant entre 0 et 100."
                    },
                    {
                        id: 'q8',
                        question: "Quel niveau du **RSI** signale que le titre est potentiellement **suracheté** et qu'une correction pourrait se produire ?",
                        options: [
                            "Inférieur à 30.",
                            "Égal à 50.",
                            "Égal à 0.",
                            "Supérieur à 70.",
                            "Égal au Gearing."
                        ],
                        correct_answer: 3,
                        explanation: "Un RSI au-dessus de 70 est souvent considéré comme une zone de surachat, signalant que le prix pourrait être temporairement trop élevé."
                    },
                    {
                        id: 'q9',
                        question: "Quel niveau du **RSI** signale que le titre est potentiellement **survendu** et peut rebondir ?",
                        options: [
                            "Supérieur à 70.",
                            "Inférieur à 30.",
                            "Égal à 100.",
                            "Égal au PER.",
                            "Égal à 50."
                        ],
                        correct_answer: 1,
                        explanation: "Un RSI en dessous de 30 est souvent considéré comme une zone de survente, signalant une possible opportunité de rebond (point d'entrée)."
                    },
                    {
                        id: 'q10',
                        question: "Si un titre est au-dessus de sa **Moyenne Mobile 200 jours** (MM200), cela indique généralement une tendance :",
                        options: [
                            "Neutre.",
                            "Baissière de long terme.",
                            "Haussière de long terme.",
                            "Latérale.",
                            "Stable."
                        ],
                        correct_answer: 2,
                        explanation: "La MM200 est l'indicateur principal de la tendance de long terme. Un prix au-dessus est considéré comme haussier."
                    },
                    {
                        id: 'q11',
                        question: "Un signal d'achat fort, selon l'AT, se produit souvent lorsque le cours d'une action franchit :",
                        options: [
                            "Son niveau de Support à la baisse.",
                            "Son prix d'achat initial.",
                            "Sa Résistance à la hausse.",
                            "Le niveau 50 du RSI.",
                            "Le niveau 70 du RSI."
                        ],
                        correct_answer: 2,
                        explanation: "Franchir une résistance avec force (volume) est souvent interprété comme une confirmation de la poursuite de la tendance haussière."
                    },
                    {
                        id: 'q12',
                        question: "Pourquoi la stratégie de **Market Timing pur** est déconseillée aux débutants ?",
                        options: [
                            "Car elle ne fonctionne qu'avec les obligations.",
                            "Car elle exige une précision impossible et mène souvent à des décisions émotionnelles (Biais de Récence).",
                            "Car elle est interdite par l'AMF-UMOA.",
                            "Car elle ne permet pas d'utiliser le DCA.",
                            "Car elle élimine le risque spécifique."
                        ],
                        correct_answer: 1,
                        explanation: "Tenter de deviner le marché est quasiment impossible et contraire au principe de discipline (Module 6)."
                    },
                    {
                        id: 'q13',
                        question: "Le but de l'Atelier Pratique de ce module était d'élaborer une règle de timing prudente combinant AT et :",
                        options: [
                            "Market Timing.",
                            "Biais de Récence.",
                            "Analyse Fondamentale.",
                            "Spéculation.",
                            "MM 50."
                        ],
                        correct_answer: 2,
                        explanation: "L'Analyse Fondamentale détermine quoi acheter et l'Analyse Technique détermine quand acheter pour l'investisseur long terme."
                    },
                    {
                        id: 'q14',
                        question: "Quel est l'indicateur de volume qui renforce la fiabilité d'une tendance ou d'une cassure ?",
                        options: [
                            "Le RSI.",
                            "Le Gearing.",
                            "Le Compte de Résultat.",
                            "Le Volume des transactions.",
                            "La Moyenne Mobile 50."
                        ],
                        correct_answer: 3,
                        explanation: "Un mouvement de prix (cassure de Résistance ou Support) est plus fiable s'il est confirmé par un volume de transactions élevé."
                    },
                    {
                        id: 'q15',
                        question: "Un investisseur long terme utilise l'Analyse Technique pour **éviter** :",
                        options: [
                            "D'acheter une bonne entreprise.",
                            "De réinvestir son dividende.",
                            "D'utiliser le PER.",
                            "D'acheter une bonne entreprise à un prix temporairement trop élevé (trop loin de son Support).",
                            "D'analyser le ROE."
                        ],
                        correct_answer: 3,
                        explanation: "L'AT vise à patienter pour obtenir un meilleur prix d'entrée, sans remettre en cause la qualité de l'entreprise."
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
createModule10Quiz();