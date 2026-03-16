/// <reference types="node" />
// backend/scripts/create-module12-quiz-consolidation.ts
// Script pour créer le quiz de Consolidation du Module 12 - Gestion Avancée du Risque

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule12ConsolidationQuiz() {
    try {
        console.log('🔍 Recherche du Module 12...');

        // Le slug est basé sur le titre du module. À ADAPTER selon votre base de données.
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'Architecte-du-Risque' } 
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
        console.log('📝 Création du quiz avec 20 questions...');

        const quiz = await prisma.quiz.create({
            data: {
                moduleId: module.id,
                passing_score: 80,
                questions: [
                    {
                        id: 'q1',
                        question: "Quelle est la caractéristique principale de l'Allocation d'Actifs Stratégique ?",
                        options: [
                            "Ajustement temporaire aux conditions de marché.",
                            "Répartition de base, passive, définie par le profil de risque de long terme.",
                            "Vente à découvert d'un actif.",
                            "Détermination de la taille maximale d'une position.",
                            "Utilisation du RSI pour les points d'entrée."
                        ],
                        correct_answer: 1,
                        explanation: "L'Allocation Stratégique est le 'socle' de votre portefeuille. Elle est définie une fois pour toutes selon votre profil (prudent, équilibré, dynamique) et maintenue sur le long terme."
                    },
                    {
                        id: 'q2',
                        question: "L'Allocation d'Actifs Tactique consiste à :",
                        options: [
                            "Réinvestir automatiquement les dividendes.",
                            "Revenir à l'allocation de base une fois par an (Rééquilibrage).",
                            "Faire un ajustement temporaire de l'allocation stratégique pour profiter des conditions de marché.",
                            "Ne jamais détenir plus de 5 % du portefeuille en liquidités.",
                            "Vendre un actif que l'on ne possède pas."
                        ],
                        correct_answer: 2,
                        explanation: "Contrairement à la stratégie de base, l'allocation tactique permet de dévier temporairement (ex: augmenter le cash avant une crise anticipée) pour saisir une opportunité."
                    },
                    {
                        id: 'q3',
                        question: "Pourquoi la Diversification Sectorielle est-elle particulièrement critique sur la BRVM ?",
                        options: [
                            "À cause du risque de change.",
                            "En raison de la concentration des sociétés cotées sur quelques secteurs (Banques et Télécoms).",
                            "Pour éliminer le risque systémique.",
                            "Pour appliquer la méthode DDM.",
                            "Pour baisser le PER moyen."
                        ],
                        correct_answer: 1,
                        explanation: "La BRVM étant très dominée par les services financiers et les télécoms, un investisseur non vigilant risque d'être sur-exposé aux chocs touchant ces seuls secteurs."
                    },
                    {
                        id: 'q4',
                        question: "Que signifie le terme \"Position Sizing\" ?",
                        options: [
                            "La durée de détention d'un actif (Horizon de Placement).",
                            "La stratégie pour acheter au plus bas (Market Timing).",
                            "Le réinvestissement des bénéfices de l'entreprise.",
                            "La détermination de la taille appropriée (en pourcentage du capital total) pour chaque ligne d'investissement.",
                            "L'ajustement du Gearing de l'entreprise."
                        ],
                        correct_answer: 3,
                        explanation: "Le Position Sizing (taille de position) consiste à décider mathématiquement quelle part de votre capital global sera allouée à une action spécifique."
                    },
                    {
                        id: 'q5',
                        question: "Quel est le but principal du Position Sizing dans la gestion du risque ?",
                        options: [
                            "Maximiser les gains d'une seule bonne action.",
                            "Accroître le rendement des obligations.",
                            "Protéger le portefeuille global contre une perte catastrophique sur un seul titre.",
                            "Simplifier le calcul du Bénéfice Net par Action.",
                            "Garantir le remboursement du capital investi."
                        ],
                        correct_answer: 2,
                        explanation: "En limitant la taille d'une position, on s'assure que même si l'entreprise fait faillite (perte de 100%), l'impact sur le portefeuille total reste minime et gérable."
                    },
                    {
                        id: 'q6',
                        question: "Quelle est la recommandation générale pour le Position Sizing afin d'éviter les pertes catastrophiques ?",
                        options: [
                            "100 % du portefeuille sur l'action avec le meilleur ROE.",
                            "Maximum 20 % du portefeuille par ligne.",
                            "Maximum 3 % à 5 % du portefeuille par ligne.",
                            "Minimum 50 % du portefeuille sur les obligations.",
                            "La taille ne doit jamais dépasser le prix d'achat initial."
                        ],
                        correct_answer: 2,
                        explanation: "La règle empirique des 5% maximum par position permet de construire un portefeuille suffisamment diversifié (au moins 20 lignes) pour lisser le risque spécifique."
                    },
                    {
                        id: 'q7',
                        question: "Quelle est la forme de Hedging (Couverture) considérée comme très risquée et souvent déconseillée aux débutants sur la BRVM ?",
                        options: [
                            "Détenir des obligations d'État.",
                            "Garder 20 % en liquidités.",
                            "Investir dans des OPCVM prudents.",
                            "La Vente à Découvert (Short Selling).",
                            "La diversification géographique."
                        ],
                        correct_answer: 3,
                        explanation: "La vente à découvert expose l'investisseur à un risque de perte théoriquement illimité si le prix de l'action monte au lieu de baisser."
                    },
                    {
                        id: 'q8',
                        question: "Quel actif est considéré comme Non Corréllé aux actions BRVM et sert de refuge simple en cas de forte crise régionale ?",
                        options: [
                            "Une action avec un PER très bas.",
                            "Une action du secteur agro-industriel.",
                            "Une obligation d'entreprise.",
                            "Une action dont le RSI est bas.",
                            "L'Or ou les Devises fortes."
                        ],
                        correct_answer: 4,
                        explanation: "En cas de crise majeure en zone UEMOA, les actions locales baisseront. L'Or ou le Dollar/Euro ont tendance à maintenir leur valeur, voire à monter (valeurs refuges)."
                    },
                    {
                        id: 'q9',
                        question: "Que signifie l'Allocation Tactique dans l'exemple : \"Anticiper une hausse des taux d'intérêt et réduire les obligations long terme\" ?",
                        options: [
                            "C'est la base de l'allocation stratégique.",
                            "C'est l'étape du rééquilibrage annuel.",
                            "C'est une stratégie de DCA.",
                            "C'est un ajustement temporaire basé sur une anticipation de marché.",
                            "C'est une technique de Stop-Loss."
                        ],
                        correct_answer: 3,
                        explanation: "L'investisseur modifie consciemment et temporairement son portefeuille par rapport à sa cible de long terme, car il pense pouvoir tirer profit d'un événement macroéconomique précis."
                    },
                    {
                        id: 'q10',
                        question: "Quel est le meilleur \"hedging\" (couverture) pour un investisseur BRVM débutant, selon le module ?",
                        options: [
                            "L'utilisation du Short Selling.",
                            "L'investissement massif dans une seule action.",
                            "Le passage à 100 % d'actions de croissance.",
                            "Le maintien de Liquidités (Cash) suffisantes pour saisir les opportunités d'achat en cas de krach.",
                            "L'élimination totale du risque de change."
                        ],
                        correct_answer: 3,
                        explanation: "Plutôt que d'utiliser des produits dérivés complexes, garder une réserve de liquidités (le 'Cash is King') permet d'acheter d'excellentes entreprises à prix bradé lors des paniques boursières."
                    },
                    {
                        id: 'q11',
                        question: "Quel est le principe de la Vente à Découvert (Short Selling) ?",
                        options: [
                            "Acheter un actif que l'on possède déjà.",
                            "Échanger une obligation contre une action.",
                            "Vendre un actif que l'on ne possède pas, dans l'espoir de le racheter moins cher plus tard.",
                            "Utiliser la Moyenne Mobile 50 jours.",
                            "Calculer la Valeur Intrinsèque."
                        ],
                        correct_answer: 2,
                        explanation: "C'est une technique spéculative permettant de parier sur la baisse d'un titre. On emprunte l'action, on la vend cher, on espère qu'elle chute pour la racheter moins cher et la rendre au prêteur."
                    },
                    {
                        id: 'q12',
                        question: "Comment un investisseur peut-il réduire son risque régional sur le marché UEMOA ?",
                        options: [
                            "En augmentant son Position Sizing.",
                            "En utilisant uniquement le Short Selling.",
                            "En se concentrant sur le secteur bancaire.",
                            "En diversifiant géographiquement son capital au-delà de la zone BRVM (Devises, fonds internationaux).",
                            "En utilisant la technique du rééquilibrage."
                        ],
                        correct_answer: 3,
                        explanation: "La diversification géographique protège contre les risques spécifiques à une zone économique ou politique (ex: dévaluation du Franc CFA, crise politique sous-régionale)."
                    },
                    {
                        id: 'q13',
                        question: "L'Allocation Stratégique est :",
                        options: [
                            "Définie par le RSI.",
                            "Définie par le Gearing.",
                            "Active et spéculative.",
                            "Passive et maintenue par le rééquilibrage périodique (M11).",
                            "Soumise au Biais de Confirmation."
                        ],
                        correct_answer: 3,
                        explanation: "L'allocation stratégique est la feuille de route de l'investisseur. Elle ne change pas avec les humeurs du marché, elle est simplement réajustée (rééquilibrée) lorsqu'elle dérive trop."
                    },
                    {
                        id: 'q14',
                        question: "Si une action représente 15 % de votre portefeuille, et qu'elle perd 50 % de sa valeur, quel est l'impact sur la valeur totale de votre portefeuille ?",
                        options: [
                            "50 %.",
                            "15 %.",
                            "7,5 % (15 % * 50 %).",
                            "30 %.",
                            "Moins de 1 %."
                        ],
                        correct_answer: 2,
                        explanation: "C'est la magie mathématique du Position Sizing : un effondrement dramatique (-50%) sur une seule action ne provoque qu'une baisse supportable (-7,5%) sur le portefeuille global."
                    },
                    {
                        id: 'q15',
                        question: "Quel est le rôle principal de l'Allocation Stratégique ?",
                        options: [
                            "Surpasser le marché en ajustant constamment les positions.",
                            "Maximiser les gains à court terme.",
                            "Atteindre les objectifs de long terme en minimisant la volatilité (en accord avec le profil M5).",
                            "Calculer le DCF.",
                            "Déterminer le meilleur prix d'entrée (Market Timing)."
                        ],
                        correct_answer: 2,
                        explanation: "Elle vise à trouver l'équilibre parfait entre le besoin de rendement (pour l'avenir) et la tolérance au risque (pour dormir la nuit) de l'investisseur."
                    },
                    {
                        id: 'q16',
                        question: "La diversification avancée sur la BRVM doit particulièrement chercher à inclure quels secteurs pour équilibrer les Banques et les Télécoms ?",
                        options: [
                            "Finance, Monnaie.",
                            "DC/BR, SGI.",
                            "OPCVM, ETF.",
                            "Industrie et Agro-industrie.",
                            "Court terme et Moyen terme."
                        ],
                        correct_answer: 3,
                        explanation: "Pour éviter d'avoir un portefeuille qui réagit uniquement aux taux d'intérêt (Banques) ou à la consommation data (Télécoms), il faut y intégrer des valeurs industrielles ou agricoles."
                    },
                    {
                        id: 'q17',
                        question: "Dans le cadre de l'Allocation Tactique, si un investisseur anticipe une baisse imminente des actions BRVM, quel ajustement ferait-il temporairement ?",
                        options: [
                            "Vendre ses obligations et acheter plus d'actions.",
                            "Maintenir l'allocation stratégique coûte que coûte.",
                            "Augmenter la part de liquidités ou d'OPCVM prudents, en réduisant temporairement les actions.",
                            "Augmenter le Gearing de son portefeuille.",
                            "Réaliser un rééquilibrage obligatoire."
                        ],
                        correct_answer: 2,
                        explanation: "L'investisseur réduit son exposition au risque (les actions) pour sécuriser son capital (cash/obligations), avec l'intention de racheter les actions moins cher après la baisse."
                    },
                    {
                        id: 'q18',
                        question: "Que sont les Actifs Non Corréllés dans la gestion du risque ?",
                        options: [
                            "Des actifs qui sont garantis par l'État.",
                            "Des actifs qui ont le même PER.",
                            "Des actifs qui ne réagissent pas de la même manière (voire de manière opposée) aux mouvements du marché principal.",
                            "Des actifs qui ne paient pas de dividendes.",
                            "Des actifs qui n'ont pas de Support ou de Résistance."
                        ],
                        correct_answer: 2,
                        explanation: "La vraie diversification consiste à posséder des actifs qui montent quand les autres baissent (ex: les obligations montent souvent quand les actions chutent)."
                    },
                    {
                        id: 'q19',
                        question: "Quel est l'outil de gestion du risque qui vous permet de déterminer combien vous êtes prêt à perdre sur une seule mauvaise idée d'investissement ?",
                        options: [
                            "La diversification géographique.",
                            "L'Analyse Technique (RSI).",
                            "Le Rééquilibrage.",
                            "Le Position Sizing (en limitant la taille de la position).",
                            "L'Allocation Stratégique."
                        ],
                        correct_answer: 3,
                        explanation: "En combinant le Position Sizing (ex: max 5% du capital) et le Stop-Loss (ex: perte max de 20%), on s'assure qu'une erreur d'analyse ne coûtera jamais plus de 1% du capital total."
                    },
                    {
                        id: 'q20',
                        question: "En comparaison avec l'Allocation Stratégique, l'Allocation Tactique est qualifiée de :",
                        options: [
                            "Passive.",
                            "Long terme.",
                            "Active.",
                            "Régulière.",
                            "Fondamentale."
                        ],
                        correct_answer: 2,
                        explanation: "L'allocation tactique requiert de suivre le marché, d'avoir des convictions sur son évolution à court/moyen terme et de prendre des décisions d'achat/vente (gestion active)."
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
createModule12ConsolidationQuiz();