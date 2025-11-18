// backend/scripts/create-module14-quiz.ts
// Script pour créer le quiz du Module 14 - Contexte Économique – Sentir le Pouls du Marché UEMOA

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule14Quiz() {
    try {
        console.log('🔍 Recherche du Module 14...');

        // Le slug est basé sur le titre du module : Contexte Économique
        const module = await prisma.learningModule.findFirst({
            where: { slug: 'contexte-eeconomique' } 
        });

        if (!module) {
            console.error('❌ Module 14 non trouvé. Vérifiez le slug: contexte-economique');
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
                        question: "Quelle est l'institution qui influence directement les taux d'intérêt et le coût du capital pour les entreprises de l'UEMOA ?",
                        options: [
                            "L'AMF-UMOA (Régulateur des marchés financiers).",
                            "La **BCEAO (Banque Centrale des États de l’Afrique de l’Ouest)**.",
                            "Le DC/BR (Dépositaire Central).",
                            "La BRVM (Bourse Régionale des Valeurs Mobilières).",
                            "La SGI (Société de Gestion et d’Intermédiation)."
                        ],
                        correct_answer: 1,
                        explanation: "La BCEAO, par ses taux directeurs (Refi, Marge), contrôle la politique monétaire et l'accès au crédit dans la zone UEMOA."
                    },
                    {
                        id: 'q2',
                        question: "Comment une **Hausse des Taux Directeurs** de la BCEAO affecte-t-elle généralement le prix des **Actions** à la BRVM ?",
                        options: [
                            "Elle augmente les bénéfices des entreprises, faisant monter le prix des actions.",
                            "Elle rend l'emprunt plus cher, ce qui **freine la croissance et les bénéfices** des entreprises, pouvant faire baisser le prix des actions.",
                            "Elle diminue le risque systémique.",
                            "Elle n'a aucun impact sur les actions, seulement sur les obligations.",
                            "Elle augmente l'indice RSI."
                        ],
                        correct_answer: 1,
                        explanation: "Un coût du capital plus élevé (taux d'intérêt en hausse) nuit à la rentabilité et à l'investissement des entreprises, pénalisant les actions."
                    },
                    {
                        id: 'q3',
                        question: "Comment une **Baisse des Taux Directeurs** de la BCEAO affecte-t-elle le prix des **Obligations** déjà émises sur le marché secondaire ?",
                        options: [
                            "La baisse des taux ne change rien au prix des obligations déjà émises.",
                            "Elle rend les anciennes obligations (à taux plus faibles) moins attractives, ce qui fait baisser leur prix.",
                            "Elle rend les anciennes obligations (à taux plus élevés) **plus attractives**, ce qui fait monter leur prix.",
                            "Elle augmente le Gearing des États.",
                            "Elle provoque un Stop-Loss."
                        ],
                        correct_answer: 2,
                        explanation: "Si le taux d'intérêt de référence baisse, les obligations existantes qui offrent un coupon (taux) supérieur deviennent plus valorisées sur le marché secondaire (relation inverse)."
                    },
                    {
                        id: 'q4',
                        question: "L'**Analyse Top-Down** se définit comme une stratégie qui commence par :",
                        options: [
                            "L'Analyse Technique (RSI, MM).",
                            "L'étude détaillée d'une seule entreprise (Analyse Fondamentale).",
                            "L'étude du **contexte macroéconomique** (global) et des secteurs porteurs, avant de choisir des titres individuels.",
                            "L'investissement uniquement dans les OPCVM.",
                            "La Vente à Découvert."
                        ],
                        correct_answer: 2,
                        explanation: "Top-Down (du haut vers le bas) : de l'économie globale (Top) au choix du titre (Down)."
                    },
                    {
                        id: 'q5',
                        question: "L'**Inflation** affecte l'investisseur car :",
                        options: [
                            "Elle diminue le Gearing des entreprises.",
                            "Elle garantit un rendement minimum de 10 %.",
                            "Elle **érode le pouvoir d'achat** des rendements (le risque que les gains ne compensent pas la hausse des prix).",
                            "Elle fait chuter le RSI.",
                            "Elle ne concerne que les liquidités."
                        ],
                        correct_answer: 2,
                        explanation: "L'inflation est la perte du pouvoir d'achat de l'argent. Le rendement réel = Rendement brut - Inflation."
                    },
                    {
                        id: 'q6',
                        question: "Pourquoi les **sociétés bancaires et financières** (SGI, assurances) sont-elles particulièrement sensibles aux décisions de la BCEAO ?",
                        options: [
                            "Car elles ne paient pas d'impôts.",
                            "Car leurs marges dépendent directement des **taux d'intérêt** (coût de l'argent) et des conditions de liquidité du marché.",
                            "Car elles ne peuvent pas émettre d'obligations.",
                            "Car elles sont exonérées de fiscalité sur les plus-values.",
                            "Car elles sont soumises à la Vente à Découvert."
                        ],
                        correct_answer: 1,
                        explanation: "Leur métier est basé sur l'argent et le crédit. Leurs bénéfices sont intrinsèquement liés aux conditions monétaires."
                    },
                    {
                        id: 'q7',
                        question: "Quel est l'un des **indicateurs macroéconomiques** clés que l'investisseur doit surveiller pour évaluer la santé économique de l'UEMOA ?",
                        options: [
                            "Le prix du dernier achat d'action (Biais d'Ancrage).",
                            "Le niveau de la Moyenne Mobile 200 jours.",
                            "Le **Taux de Croissance du PIB** et le Taux d'Inflation.",
                            "Le PER moyen de la BRVM.",
                            "Le Bilan des entreprises (uniquement)."
                        ],
                        correct_answer: 2,
                        explanation: "Le PIB et l'Inflation donnent une image de l'activité économique et de la stabilité des prix de la zone."
                    },
                    {
                        id: 'q8',
                        question: "Si l'Analyse Top-Down suggère que le secteur des **Télécoms/Numérique** sera le plus porteur au cours des 10 prochaines années en UEMOA, quelle est la prochaine étape pour l'investisseur ?",
                        options: [
                            "Vendre tous ses autres actifs immédiatement.",
                            "Acheter le premier titre venu du secteur.",
                            "Passer à l'**Analyse Fondamentale** et **Extra-Financière** (ESG) pour choisir la meilleure entreprise (Sonatel, Orange CI) dans ce secteur.",
                            "Faire du Market Timing avec le RSI.",
                            "Augmenter son allocation d'actifs en obligations."
                        ],
                        correct_answer: 2,
                        explanation: "Après l'identification du secteur (Top), il faut choisir l'entreprise (Down) en utilisant les outils des Modules 7, 9 et 10."
                    },
                    {
                        id: 'q9',
                        question: "L'augmentation de la **Dette Publique / PIB** d'un État peut signaler quel type de risque pour l'investisseur en obligations de cet État ?",
                        options: [
                            "Le risque spécifique (faillite d'une entreprise).",
                            "Le **Risque de Solvabilité** (difficulté potentielle à rembourser la dette ou à payer les intérêts).",
                            "Le risque de surachat (RSI > 70).",
                            "Le risque de liquidité de l'action.",
                            "Le risque de sur-diversification."
                        ],
                        correct_answer: 1,
                        explanation: "Le ratio Dette/PIB est un indicateur de la capacité de l'État à honorer ses engagements financiers."
                    },
                    {
                        id: 'q10',
                        question: "Le principal atout de l'approche **Bottom-Up** (du bas vers le haut) est qu'elle se concentre sur :",
                        options: [
                            "La prévision des taux d'intérêt de la BCEAO.",
                            "L'anticipation des crises économiques (Market Timing).",
                            "La recherche de la **qualité intrinsèque de l'entreprise**, peu importe les cycles économiques passagers.",
                            "Le calcul du Gearing moyen de la BRVM.",
                            "La vente à découvert des titres en difficulté."
                        ],
                        correct_answer: 2,
                        explanation: "Bottom-Up (du bas vers le haut) : elle se concentre d'abord sur l'entreprise (Bottom) puis sur le secteur et l'économie (Up). C'est l'approche de l'investisseur Value."
                    },
                    {
                        id: 'q11',
                        question: "Quelle est la caractéristique économique principale des marchés de l'UEMOA qui les rend intéressants pour l'investisseur long terme ?",
                        options: [
                            "Une volatilité nulle.",
                            "Des taux d'intérêt négatifs.",
                            "Un **fort potentiel de croissance démographique et économique** (en émergence).",
                            "Une absence totale de risque systémique.",
                            "Un marché dominé par la Vente à Découvert."
                        ],
                        correct_answer: 2,
                        explanation: "Le potentiel de croissance future (facteur Top-Down) est la raison principale d'investir sur un marché émergent à long terme."
                    },
                    {
                        id: 'q12',
                        question: "L'investissement dans des **Green Bonds (Obligations Vertes)** est un exemple d'alignement avec quelle tendance macroéconomique régionale ?",
                        options: [
                            "Le désendettement des États.",
                            "La baisse des taux directeurs.",
                            "La **Finance Durable** (ou Investissement Socialement Responsable - ISR).",
                            "L'augmentation du PIB.",
                            "La Vente à Découvert."
                        ],
                        correct_answer: 2,
                        explanation: "La Finance Durable est une tendance macroéconomique qui oriente les capitaux vers des projets ayant un impact positif (ESG)."
                    },
                    {
                        id: 'q13',
                        question: "Pour un investisseur long terme, les **actualités quotidiennes** du marché (hausses, baisses) sont principalement :",
                        options: [
                            "Des signaux de Market Timing immédiats.",
                            "Des informations pour justifier une vente panique.",
                            "Du **'bruit'** à filtrer, car elles n'affectent pas les fondamentaux des entreprises de qualité à long terme.",
                            "Des signaux d'achat immédiat.",
                            "Des éléments qui justifient l'augmentation du Gearing."
                        ],
                        correct_answer: 2,
                        explanation: "Le 'bruit' (volatilité quotidienne) est le contraire du signal. L'investisseur long terme se concentre sur le signal (fondamentaux) et non le bruit."
                    },
                    {
                        id: 'q14',
                        question: "Un investisseur qui utilise l'Analyse **Top-Down** et décide d'investir dans un secteur, quelle sera la question clé à laquelle l'Analyse Fondamentale (M7) devra répondre ensuite ?",
                        options: [
                            "Quel est le prix de l'action aujourd'hui ?",
                            "Le secteur est-il sûr ?",
                            "**Quelle entreprise** dans ce secteur a le meilleur **PER, ROE et Moat** (qualité) ?",
                            "Quelle sera la décision de taux de la BCEAO ?",
                            "Le titre est-il suracheté (RSI) ?"
                        ],
                        correct_answer: 2,
                        explanation: "Le Top-Down sélectionne le secteur. Le Fondamental et l'Extra-Financier sélectionnent la meilleure entreprise au sein du secteur."
                    },
                    {
                        id: 'q15',
                        question: "Quel est le risque lié à la politique monétaire de la BCEAO que l'investisseur doit intégrer dans son analyse ?",
                        options: [
                            "Le risque spécifique.",
                            "Le risque de contrepartie (défaut).",
                            "Le **Risque de Taux d'Intérêt** (l'impact de la variation des taux sur le prix des obligations et le coût du crédit).",
                            "Le risque de liquidité.",
                            "Le risque de sur-diversification."
                        ],
                        correct_answer: 2,
                        explanation: "Le risque de taux est le risque que la valeur d'un actif (surtout une obligation) change en raison d'une modification des taux d'intérêt de la banque centrale."
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
createModule14Quiz();