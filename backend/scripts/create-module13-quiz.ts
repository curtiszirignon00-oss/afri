// backend/scripts/create-module13-quiz.ts
// Script pour créer le quiz du Module 13 - Outils, Actualités et Fiscalité

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule13Quiz() {
    try {
        console.log('🔍 Recherche du Module 13...');

        // Le slug est basé sur le titre du module : Outils, Actualités et Fiscalité
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'outils-actualites-fiscalite' } 
        });

        if (!module) {
            console.error('❌ Module 13 non trouvé. Vérifiez le slug: outils-actualites-fiscalite');
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
                        question: "Quel est le rôle principal et indispensable de la **SGI (Société de Gestion et d’Intermédiation)** pour un investisseur souhaitant opérer sur la BRVM ?",
                        options: [
                            "Elle garantit le capital investi.",
                            "Elle supervise le marché boursier (régulateur).",
                            "Elle conserve les titres physiques (Dépositaire Central).",
                            "Elle est l'**unique intermédiaire agréé** pour transmettre les ordres d'achat et de vente.",
                            "Elle calcule le RSI de toutes les actions."
                        ],
                        correct_answer: 3,
                        explanation: "Seules les SGI sont habilitées à exécuter des ordres en bourse pour le compte de leurs clients."
                    },
                    {
                        id: 'q2',
                        question: "Quelle est la principale différence entre un **Ordre au Prix Limite** (Limit Order) et un **Ordre au Marché** ?",
                        options: [
                            "L'Ordre au Marché permet le DCA, pas l'Ordre au Prix Limite.",
                            "L'Ordre au Prix Limite permet de **définir un prix maximal ou minimal** d'exécution, alors que l'Ordre au Marché garantit l'exécution immédiate au meilleur prix disponible.",
                            "L'Ordre au Marché est utilisé pour le Stop-Loss.",
                            "L'Ordre au Prix Limite est réservé aux institutions.",
                            "L'Ordre au Marché n'entraîne pas de frais de transaction."
                        ],
                        correct_answer: 1,
                        explanation: "L'Ordre au Prix Limite assure un meilleur contrôle du prix, tandis que l'Ordre au Marché assure une meilleure garantie d'exécution."
                    },
                    {
                        id: 'q3',
                        question: "Quel est l'un des rôles majeurs du **Journal de Performance** (ou carnet de trading) ?",
                        options: [
                            "Calculer le Gearing de l'entreprise.",
                            "Remplacer l'Analyse Fondamentale.",
                            "Déterminer le meilleur prix de vente.",
                            "Assurer la **discipline** et l'apprentissage en analysant les succès et les erreurs post-investissement.",
                            "Définir la Tolérance au Risque."
                        ],
                        correct_answer: 3,
                        explanation: "Le journal de performance est un outil de discipline et de mesure de la psychologie et de l'exécution, non de l'analyse fondamentale."
                    },
                    {
                        id: 'q4',
                        question: "Pour l'investisseur long terme qui pratique le DCA, quel type d'ordre est généralement préféré pour garantir l'exécution régulière, sans chercher un prix spécifique ?",
                        options: [
                            "L'Ordre Stop-Loss.",
                            "L'**Ordre au Marché**.",
                            "L'Ordre au Prix Limite (pour acheter seulement à un prix jugé bas).",
                            "La Vente à Découvert.",
                            "Le Hedging."
                        ],
                        correct_answer: 1,
                        explanation: "L'Ordre au Marché assure que l'achat se fait immédiatement, ce qui est nécessaire pour maintenir la discipline du DCA, peu importe le prix actuel."
                    },
                    {
                        id: 'q5',
                        question: "Quel est le danger principal à ne pas tenir compte des **frais de transaction** et des impôts dans le calcul du rendement ?",
                        options: [
                            "L'augmentation du risque systémique.",
                            "La **surestimation** de la performance nette réelle du portefeuille.",
                            "L'impossibilité d'utiliser l'Analyse Technique.",
                            "La complexité du rééquilibrage.",
                            "L'application du Biais d'Ancrage."
                        ],
                        correct_answer: 1,
                        explanation: "Les frais et impôts réduisent le rendement net. Les ignorer peut donner l'illusion d'une meilleure performance."
                    },
                    {
                        id: 'q6',
                        question: "Quel est l'outil numérique qui vous permet de consulter l'**historique des cours** et les **rapports de marchés** hebdomadaires de la BRVM ?",
                        options: [
                            "Le journal de performance.",
                            "L'application mobile de la BCEAO.",
                            "L'outil de calcul du PER.",
                            "Le **site officiel de la BRVM** (ou ses agrégateurs d'information).",
                            "La plateforme de trading de votre SGI (uniquement)."
                        ],
                        correct_answer: 3,
                        explanation: "Le site de la BRVM est la source officielle pour toutes les données de cours, rapports et actualités du marché."
                    },
                    {
                        id: 'q7',
                        question: "La **'Stratégie de Sortie'** (Stop-Loss et Objectif de vente) dans le Journal de Performance doit être définie :",
                        options: [
                            "Après la vente.",
                            "Une fois par an.",
                            "**Avant l'achat** (définir le Stop-Loss et l'objectif de vente).",
                            "Après la crise.",
                            "Dès que le ROE change."
                        ],
                        correct_answer: 2,
                        explanation: "La discipline d'investissement exige de définir les règles de sortie (gain ou perte) avant d'entrer en position, pour éviter les décisions émotionnelles."
                    },
                    {
                        id: 'q8',
                        question: "Si la fiscalité locale applique une **Retenue à la Source (RAS)** de 5 % sur les dividendes, et qu'une action verse 100 FCFA de dividende, combien l'investisseur reçoit-il réellement ?",
                        options: [
                            "100 FCFA.",
                            "105 FCFA.",
                            "**95 FCFA**.",
                            "90 FCFA.",
                            "0 FCFA (le dividende est réinvesti automatiquement)."
                        ],
                        correct_answer: 2,
                        explanation: "100 FCFA - 5% (RAS) = 95 FCFA. La fiscalité sur les revenus est un facteur à considérer dans le rendement net."
                    },
                    {
                        id: 'q9',
                        question: "Sur la BRVM, les **Plus-Values** réalisées sur les cessions d'actions (revente avec bénéfice) sont-elles généralement soumises à l'impôt pour les investisseurs de l'UEMOA ?",
                        options: [
                            "Toujours, quel que soit le pays.",
                            "Non, elles sont **généralement exonérées** (à vérifier selon le pays et le statut).",
                            "Seulement si elles dépassent 10 millions de FCFA.",
                            "Uniquement pour les non-résidents.",
                            "Seulement si le Gearing est élevé."
                        ],
                        correct_answer: 1,
                        explanation: "De nombreux pays de l'UEMOA exonèrent les plus-values boursières pour encourager l'investissement local, mais une vérification est toujours nécessaire."
                    },
                    {
                        id: 'q10',
                        question: "L'erreur de discipline la plus coûteuse pour l'investisseur long terme est de :",
                        options: [
                            "Utiliser un Ordre au Prix Limite.",
                            "Utiliser le DCA.",
                            "**Déroger aux règles fixées** (Allocation, Rééquilibrage, Stop-Loss) à cause de l'émotion du marché (peur ou avidité).",
                            "Ne pas utiliser la Vente à Découvert.",
                            "Ignorer la Moyenne Mobile 200 jours."
                        ],
                        correct_answer: 2,
                        explanation: "La discipline est la clé du succès. Céder à l'émotion annule les bénéfices des stratégies rationnelles."
                    },
                    {
                        id: 'q11',
                        question: "Pour un débutant, la meilleure pratique pour s'informer sans succomber au **Market Timing** est de :",
                        options: [
                            "Suivre les conseils 'chauds' sur les forums.",
                            "Consulter les cours toutes les 5 minutes.",
                            "Se concentrer sur les **rapports fondamentaux annuels/trimestriels** et les actualités macroéconomiques majeures.",
                            "Uniquement se fier aux signaux du RSI.",
                            "Calculer le PER toutes les semaines."
                        ],
                        correct_answer: 2,
                        explanation: "L'investisseur long terme se concentre sur les fondamentaux de l'entreprise, pas sur le bruit quotidien du marché."
                    },
                    {
                        id: 'q12',
                        question: "Si votre SGI vous facture 1 % de frais de courtage (achat et vente), et que l'action monte de 2 %, quelle est votre plus-value **nette** ?",
                        options: [
                            "2 %.",
                            "1 %.",
                            "**0 %** (1% d'achat + 1% de vente = 2% de frais. 2% de gain - 2% de frais = 0%).",
                            "4 %.",
                            "Moins de 0 %."
                        ],
                        correct_answer: 2,
                        explanation: "Les frais sont appliqués à l'aller (achat) et au retour (vente). Un gain de 2 % est annulé par des frais de 2 %."
                    },
                    {
                        id: 'q13',
                        question: "La principale raison pour laquelle il faut **ouvrir son compte auprès d'une SGI** dans son pays de résidence UEMOA est liée à :",
                        options: [
                            "Le Gearing.",
                            "La liquidité.",
                            "La **fiscalité locale** (gestion simplifiée des impôts et retenues à la source).",
                            "Le Risque Systémique.",
                            "L'Analyse Technique."
                        ],
                        correct_answer: 2,
                        explanation: "Les SGI gèrent pour vous les aspects fiscaux locaux (RAS sur dividendes) et assurent le respect des réglementations locales."
                    },
                    {
                        id: 'q14',
                        question: "Que devez-vous absolument vérifier avant de clôturer un achat d'action ?",
                        options: [
                            "Le nom du dirigeant de la SGI.",
                            "Le niveau du RSI.",
                            "**Le prix de l'action** et les **frais totaux** appliqués par la SGI.",
                            "Le montant du Gearing.",
                            "L'existence d'un Biais Cognitif."
                        ],
                        correct_answer: 2,
                        explanation: "Le prix et les frais sont les deux éléments qui impactent immédiatement le rendement et la Marge de Sécurité."
                    },
                    {
                        id: 'q15',
                        question: "Le **Dépôt Central / Banque de Règlement (DC/BR)** est l'organisme qui :",
                        options: [
                            "Fixe le cours des actions.",
                            "Exécute les ordres d'achat et de vente.",
                            "**Assure la garde (sécurité) des titres boursiers** et organise le règlement des transactions.",
                            "Calcule les ratios fondamentaux.",
                            "Garantit la performance des FCP."
                        ],
                        correct_answer: 2,
                        explanation: "Le DC/BR joue le rôle de banque centrale du marché financier, assurant la sécurité des titres et des règlements après que la SGI ait exécuté l'ordre."
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
createModule13Quiz();