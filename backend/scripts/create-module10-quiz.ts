/// <reference types="node" />
// backend/scripts/create-module10-quiz-consolidation.ts
// Script pour créer le quiz de Consolidation du Module 10 - L’Art du Timing – Analyse Technique

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule10ConsolidationQuiz() {
    try {
        console.log('🔍 Recherche du Module 10...');

        // Le slug est basé sur le titre du module. À ADAPTER selon votre base de données.
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'passage-a-l-action' } 
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

        // Créer le quiz avec 20 questions
        console.log('📝 Création du quiz avec 19 questions...');

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
                        explanation: "L'Analyse Technique repose sur l'efficience du marché : tout ce qu'on sait ou anticipe sur l'entreprise est déjà intégré dans la courbe des prix."
                    },
                    {
                        id: 'q2',
                        question: "Quel est le rôle de l'Analyse Technique pour l'investisseur long terme ?",
                        options: [
                            "Remplacer l'Analyse Fondamentale.",
                            "Seul outil pour spéculer à court terme.",
                            "Aider à déterminer le meilleur point d'entrée (timing) pour un titre déjà jugé bon par l'analyse fondamentale.",
                            "Évaluer la valeur intrinsèque (DCF) d'une entreprise.",
                            "Calculer le Gearing et le PER."
                        ],
                        correct_answer: 2,
                        explanation: "Pour l'investisseur de long terme, l'AT vient en second plan pour optimiser l'achat (le timing) d'une entreprise dont la qualité a déjà été validée."
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
                        explanation: "La Moyenne Mobile filtre le 'bruit' quotidien du marché pour dégager une tendance claire sur une période spécifique."
                    },
                    {
                        id: 'q4',
                        question: "Que représente la Mèche (ou ombre) supérieure d'un Chandelier Japonais ?",
                        options: [
                            "Le prix de clôture de la période.",
                            "Le prix d'ouverture de la période.",
                            "Le prix de l'action à la fin de la séance.",
                            "Le prix le plus bas atteint.",
                            "Le prix le plus haut atteint pendant la période du chandelier."
                        ],
                        correct_answer: 4,
                        explanation: "La pointe de la mèche supérieure indique le plus haut niveau de prix échangé par les acheteurs et vendeurs durant cette période précise."
                    },
                    {
                        id: 'q5',
                        question: "Dans un graphique, un niveau de Support agit comme :",
                        options: [
                            "Un plafond psychologique qui arrête la hausse. (Résistance)",
                            "Une garantie de capital.",
                            "L'inverse du RSI.",
                            "La Moyenne Mobile 50 jours.",
                            "Un plancher psychologique où le prix a tendance à rebondir."
                        ],
                        correct_answer: 4,
                        explanation: "Le Support est un niveau où les acheteurs estiment que l'action n'est pas chère, créant une force d'achat qui freine la baisse."
                    },
                    {
                        id: 'q6',
                        question: "Un prix qui se négocie au-dessus d'une Moyenne Mobile 200 jours signale généralement :",
                        options: [
                            "Une tendance baissière forte.",
                            "Une tendance haussière de long terme.",
                            "Une zone de survente.",
                            "Un Biais d'Ancrage.",
                            "L'atteinte d'un niveau de Résistance."
                        ],
                        correct_answer: 1,
                        explanation: "La Moyenne Mobile à 200 jours est l'indicateur roi de la tendance de long terme. Au-dessus, le marché est globalement haussier."
                    },
                    {
                        id: 'q7',
                        question: "Que mesure le RSI (Relative Strength Index) ?",
                        options: [
                            "La volatilité absolue du titre.",
                            "Le niveau d'endettement de l'entreprise.",
                            "Le prix moyen de l'action.",
                            "Le momentum qui indique si un titre est suracheté ou survendu.",
                            "La différence entre le cours de clôture et le cours d'ouverture."
                        ],
                        correct_answer: 3,
                        explanation: "Le RSI est un oscillateur de momentum qui permet de voir la vitesse des mouvements de prix pour détecter des excès du marché."
                    },
                    {
                        id: 'q8',
                        question: "Si l'indicateur RSI affiche une valeur inférieure à 30, qu'est-ce que cela signale généralement ?",
                        options: [
                            "Le titre est trop cher (suracheté).",
                            "Le titre est en forte tendance haussière.",
                            "Le titre vient de dépasser un niveau de Résistance.",
                            "Le titre est survendu et pourrait être un bon point d'entrée pour un investisseur de long terme.",
                            "Le titre est peu liquide."
                        ],
                        correct_answer: 3,
                        explanation: "Un RSI sous 30 indique que le marché a probablement trop vendu le titre dans l'urgence, offrant une potentielle opportunité d'achat."
                    },
                    {
                        id: 'q9',
                        question: "Quel est l'un des risques principaux de l'Analyse Technique sur le marché de la BRVM ?",
                        options: [
                            "Le marché actualise trop les informations.",
                            "L'absence de moyenne mobile.",
                            "La faible liquidité de nombreux titres qui rend les graphiques erratiques (difficiles à interpréter).",
                            "La présence trop forte de spéculateurs.",
                            "L'impossibilité d'acheter des actions."
                        ],
                        correct_answer: 2,
                        explanation: "L'Analyse Technique repose sur la psychologie des masses. Sur un marché peu liquide comme la BRVM, un seul gros ordre peut déformer le graphique."
                    },
                    {
                        id: 'q10',
                        question: "Le concept selon lequel \"L'histoire se répète\" en Analyse Technique fait référence à :",
                        options: [
                            "La récurrence des résultats financiers des entreprises.",
                            "Le retour systématique de l'inflation.",
                            "La récurrence des schémas de comportement humain (peur, avidité) qui crée des configurations graphiques répétitives.",
                            "L'utilisation du même Gearing.",
                            "La nécessité d'utiliser le DCF."
                        ],
                        correct_answer: 2,
                        explanation: "Les émotions humaines (peur et avidité) ne changent pas. Elles produisent donc les mêmes figures graphiques au fil des années."
                    },
                    {
                        id: 'q11',
                        question: "Qu'est-ce qu'une Résistance sur un graphique de prix ?",
                        options: [
                            "Un plancher psychologique. (Support)",
                            "Un plafond psychologique qui bloque temporairement la hausse du prix.",
                            "Le prix le plus bas de la période.",
                            "Le point d'intersection de deux Moyennes Mobiles.",
                            "Un indicateur de survente."
                        ],
                        correct_answer: 1,
                        explanation: "La Résistance est le niveau où les vendeurs prennent le dessus sur les acheteurs, empêchant le prix de monter plus haut à court terme."
                    },
                    {
                        id: 'q12',
                        question: "Si le prix d'une action chute après avoir touché un niveau de Résistance, cela indique :",
                        options: [
                            "Un signal d'achat immédiat.",
                            "Une forte croissance du BPA.",
                            "La Résistance agit comme un plafond psychologique que les acheteurs n'ont pas réussi à dépasser.",
                            "Que l'analyse fondamentale est fausse.",
                            "Que le RSI est inférieur à 30."
                        ],
                        correct_answer: 2,
                        explanation: "Cela confirme que la zone de résistance est valide : la pression vendeuse a été plus forte que la conviction des acheteurs."
                    },
                    {
                        id: 'q13',
                        question: "Pour l'investisseur long terme, l'Analyse Technique devrait être utilisée principalement pour :",
                        options: [
                            "Faire du trading intra-journalier.",
                            "Déterminer la valeur fondamentale d'une entreprise.",
                            "Confirmer l'existence d'une tendance de fond (haussière ou baissière).",
                            "Calculer les intérêts composés.",
                            "Modifier son allocation d'actifs."
                        ],
                        correct_answer: 2,
                        explanation: "Il s'agit de s'assurer que l'on achète dans le sens du marché (ou à un point de retournement pertinent), et non contre lui."
                    },
                    {
                        id: 'q14',
                        question: "Quel indicateur est utilisé pour mesurer si une action est en train de prendre de la vitesse (momentum) ?",
                        options: [
                            "Le Gearing.",
                            "Le PER.",
                            "La Moyenne Mobile 200 jours.",
                            "Le RSI ou le MACD.",
                            "Le niveau de Support."
                        ],
                        correct_answer: 3,
                        explanation: "Le RSI (Relative Strength Index) et le MACD sont les oscillateurs de référence pour capter l'accélération d'une tendance."
                    },
                    {
                        id: 'q15',
                        question: "Une Tendance Baissière est caractérisée par :",
                        options: [
                            "Des hauts et des bas de plus en plus élevés. (Tendance Haussière)",
                            "Des sommets et des creux de plus en plus bas.",
                            "Une ligne qui reste parfaitement plate. (Tendance Neutre)",
                            "Le prix qui évolue au-dessus de la MM 200 jours.",
                            "Un RSI constamment supérieur à 70."
                        ],
                        correct_answer: 1,
                        explanation: "C'est la définition classique de la théorie de Dow : chaque nouveau rebond est plus bas que le précédent, confirmant le contrôle des vendeurs."
                    },
                    {
                        id: 'q16',
                        question: "Pourquoi la stratégie du Market Timing (tenter de deviner les prix futurs) est-elle déconseillée aux investisseurs débutants ?",
                        options: [
                            "Car elle ne fonctionne qu'avec les obligations.",
                            "Car elle exige une précision impossible et mène souvent à des décisions émotionnelles (Biais de Récence).",
                            "Car elle est interdite par l'AMF-UMOA.",
                            "Car elle ne permet pas d'utiliser le DCA.",
                            "Car elle élimine le risque spécifique."
                        ],
                        correct_answer: 1,
                        explanation: "Essayer d'acheter au plus bas exact et de vendre au plus haut relève de la chance. Cela pousse souvent à des erreurs sous le coup de l'émotion."
                    },
                    {
                        id: 'q17',
                        question: "Quel niveau du RSI signale que le titre est potentiellement suracheté et qu'une correction pourrait se produire ?",
                        options: [
                            "Inférieur à 30.",
                            "Égal à 50.",
                            "Égal à 0.",
                            "Supérieur à 70.",
                            "Égal au Gearing."
                        ],
                        correct_answer: 3,
                        explanation: "Un RSI au-dessus de 70 signale une frénésie d'achat. Le prix a monté trop vite et risque de corriger."
                    },
                    {
                        id: 'q18',
                        question: "Un investisseur long terme utilise l'Analyse Technique pour éviter :",
                        options: [
                            "D'acheter une bonne entreprise.",
                            "De réinvestir son dividende.",
                            "D'utiliser le PER.",
                            "D'acheter une bonne entreprise à un prix temporairement trop élevé (trop loin de son Support).",
                            "D'analyser le ROE."
                        ],
                        correct_answer: 3,
                        explanation: "Même la meilleure entreprise du monde devient un mauvais investissement si on la paie trop cher lors d'un pic d'euphorie du marché."
                    },
                    {
                        id: 'q19',
                        question: "Quelle est la définition d'une Tendance en Analyse Technique ?",
                        options: [
                            "La volatilité quotidienne du prix.",
                            "La direction générale des mouvements de prix sur une période donnée (haussière, baissière, neutre).",
                            "Le prix moyen pondéré en fonction du volume.",
                            "Le niveau d'endettement.",
                            "Le niveau de surachat."
                        ],
                        correct_answer: 1,
                        explanation: "La tendance, c'est le 'courant' du marché. Il est toujours plus rentable de nager dans le sens du courant plutôt qu'à contre-courant."
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
createModule10ConsolidationQuiz();