/// <reference types="node" />
// backend/scripts/create-module16-quiz.ts
// Script pour créer le quiz du Module 16B — Construire son Premier Portefeuille BRVM

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule16Quiz() {
    try {
        console.log('🔍 Recherche du Module 16B...');

        const module = await prisma.learningModule.findFirst({
            where: { slug: 'module16b-strategie-selection' }
        });

        if (!module) {
            console.error('❌ Module 16B non trouvé. Lancez d\'abord create-module16b.ts');
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

        console.log('📝 Création du quiz avec 15 questions...');

        const quiz = await prisma.quiz.create({
            data: {
                moduleId: module.id,
                passing_score: 80,
                questions: [
                    {
                        id: 'q1',
                        question: "Selon la Règle des 3 Enveloppes, dans quelle enveloppe se trouve l'argent que vous pouvez investir à la BRVM ?",
                        options: [
                            "L'Enveloppe 1 — le Bouclier (fonds d'urgence).",
                            "L'Enveloppe 2 — les Projets (épargne court terme).",
                            "L'Enveloppe 3 — le Capital Actif.",
                            "N'importe laquelle, selon le niveau de risque accepté.",
                            "Les Enveloppes 1 et 2 combinées."
                        ],
                        correct_answer: 2,
                        explanation: "L'argent investi en bourse est celui dont vous pouvez vous passer sur le long terme, sans mettre en danger votre stabilité financière. Seule l'Enveloppe 3 — le Capital Actif — est destinée à la BRVM."
                    },
                    {
                        id: 'q2',
                        question: "Quel est le principal risque d'investir son fonds d'urgence (Enveloppe 1) en bourse ?",
                        options: [
                            "Le fonds d'urgence n'est pas accepté par les SGI.",
                            "Être forcé de vendre ses actions au mauvais moment en cas de besoin urgent d'argent.",
                            "Payer plus d'impôts sur les dividendes.",
                            "Ne pas pouvoir diversifier son portefeuille.",
                            "Perdre son accès à la plateforme de trading."
                        ],
                        correct_answer: 1,
                        explanation: "Un investisseur contraint de retirer son argent en urgence vend presque toujours au pire moment — transformant une perte latente en perte réelle."
                    },
                    {
                        id: 'q3',
                        question: "Parmi les critères suivants, lequel est le PLUS important à comparer lors du choix de sa SGI ?",
                        options: [
                            "La couleur et le design de la plateforme en ligne.",
                            "Le nombre d'années d'existence de la SGI.",
                            "Les frais de courtage (commission sur chaque ordre).",
                            "Le nombre de clients particuliers de la SGI.",
                            "La proximité géographique de l'agence."
                        ],
                        correct_answer: 2,
                        explanation: "Ce critère impacte directement votre rendement net à chaque transaction. Sur 10 ans et de nombreux ordres, la différence entre 0,6 % et 1,2 % de commission est considérable."
                    },
                    {
                        id: 'q4',
                        question: "Pourquoi est-il particulièrement important de tester la réactivité du service client de sa SGI avant d'ouvrir un compte, dans le contexte de la BRVM ?",
                        options: [
                            "Pour vérifier que la SGI est bien agréée par l'AMF-UMOA.",
                            "Parce que la BRVM n'a pas de système de cotation en ligne.",
                            "Parce qu'il n'existe pas d'ordres conditionnels automatiques sur la BRVM : vous devez contacter votre SGI manuellement pour exécuter certaines décisions.",
                            "Pour s'assurer que la SGI propose des rapports annuels gratuits.",
                            "Parce que les frais de courtage varient selon la rapidité du service."
                        ],
                        correct_answer: 2,
                        explanation: "Sur la BRVM, la gestion des seuils d'alerte est manuelle. Un service client lent peut vous coûter cher si vous devez réagir rapidement à une baisse de cours."
                    },
                    {
                        id: 'q5',
                        question: "Quel est le rôle du simulateur de trading AfriBourse pour un investisseur débutant ?",
                        options: [
                            "Accéder en temps réel aux cours officiels de la BRVM pour passer de vrais ordres.",
                            "Pratiquer et apprendre à construire un portefeuille avec un capital fictif, sans risquer d'argent réel.",
                            "Calculer automatiquement le DCF et le PER des sociétés cotées.",
                            "Remplacer le compte SGI pour les investisseurs avec moins de 100 000 FCFA.",
                            "Comparer les frais de courtage de toutes les SGI agréées."
                        ],
                        correct_answer: 1,
                        explanation: "L'analogie du terrain d'entraînement avant le match : le simulateur permet de commettre des erreurs sans conséquence financière réelle."
                    },
                    {
                        id: 'q6',
                        question: "Quel est le PREMIER filtre à appliquer lors de la construction de sa shortlist de valeurs BRVM ?",
                        options: [
                            "Le Dividend Yield — vérifier que le rendement du dividende est supérieur à 4 %.",
                            "La Valorisation — vérifier que le PER est inférieur à 15.",
                            "La Solidité Fondamentale — vérifier le ROE et le niveau d'endettement.",
                            "La Liquidité — vérifier que la valeur s'échange en volumes suffisants.",
                            "La Gouvernance — vérifier la qualité du management."
                        ],
                        correct_answer: 3,
                        explanation: "Ce filtre est prioritaire car il répond à la question : \"Pourrai-je acheter ET vendre facilement cette action ?\" Sans liquidité, tous les autres critères sont secondaires."
                    },
                    {
                        id: 'q7',
                        question: "Un investisseur débutant avec un capital inférieur à 5 000 000 FCFA devrait en priorité se concentrer sur :",
                        options: [
                            "Les small caps (petites valeurs) à fort potentiel de croissance.",
                            "Les valeurs étrangères cotées sur des marchés internationaux.",
                            "Les obligations d'État uniquement, pour limiter le risque.",
                            "Les Blue Chips du BRVM 10 (valeurs les plus capitalisées et liquides).",
                            "Les introductions en bourse (IPO) récentes."
                        ],
                        correct_answer: 3,
                        explanation: "La liquidité est le critère numéro 1 pour le débutant. Les Blue Chips offrent la garantie de pouvoir acheter et vendre sans difficultés d'exécution."
                    },
                    {
                        id: 'q8',
                        question: "Un Dividend Yield très élevé (supérieur à 15 %) sur une action BRVM doit être interprété comme :",
                        options: [
                            "Un signal d'achat immédiat — l'action est exceptionnellement rentable.",
                            "Une garantie que l'entreprise est bien gérée.",
                            "Un signal d'alerte — le cours a peut-être fortement chuté pour de mauvaises raisons.",
                            "Une preuve que l'entreprise est sous-évaluée selon le filtre de valorisation.",
                            "Un indicateur que l'entreprise appartient au secteur bancaire."
                        ],
                        correct_answer: 2,
                        explanation: "Le Dividend Yield est calculé en divisant le dividende par le cours actuel. Si le cours s'est effondré, le yield monte mécaniquement — sans que l'entreprise soit devenue plus généreuse."
                    },
                    {
                        id: 'q9',
                        question: "Quelle est la principale différence entre un ordre à cours limité (Limit Order) et un ordre au marché (Market Order) sur la BRVM ?",
                        options: [
                            "L'ordre au marché est réservé aux investisseurs institutionnels.",
                            "L'ordre à cours limité garantit une exécution immédiate, l'ordre au marché non.",
                            "L'ordre à cours limité fixe un prix maximum d'achat, ce qui protège contre les exécutions à des prix défavorables.",
                            "L'ordre au marché est moins cher en frais de courtage.",
                            "Il n'y a aucune différence sur la BRVM car la cotation se fait par fixing."
                        ],
                        correct_answer: 2,
                        explanation: "Sur un marché peu liquide comme la BRVM, l'ordre au marché peut s'exécuter à un prix très différent de celui observé. L'ordre à cours limité vous protège en fixant votre prix maximum."
                    },
                    {
                        id: 'q10',
                        question: "Sur la BRVM, comment un investisseur gère-t-il concrètement son seuil de perte (l'équivalent d'un Stop-Loss) ?",
                        options: [
                            "En programmant un ordre Stop-Loss automatique sur la plateforme de sa SGI.",
                            "En demandant à l'AMF-UMOA de surveiller son portefeuille.",
                            "En définissant mentalement et par écrit un seuil de perte, puis en contactant sa SGI manuellement pour vendre si ce seuil est atteint.",
                            "En utilisant les options et produits dérivés disponibles sur la BRVM.",
                            "En confiant la gestion à un OPCVM qui gère le risque automatiquement."
                        ],
                        correct_answer: 2,
                        explanation: "Contrairement aux marchés internationaux, la BRVM ne propose pas d'ordres conditionnels automatiques. La discipline de l'investisseur remplace l'automatisme."
                    },
                    {
                        id: 'q11',
                        question: "Selon la méthode de déploiement du capital initial recommandée, quel pourcentage maximum du capital est conseillé pour la première ligne achetée ?",
                        options: [
                            "100 % — il faut aller fort dès le début sur sa meilleure conviction.",
                            "50 % — moitié du capital sur une valeur, moitié en réserve.",
                            "30 % maximum — pour ne pas surexposer le portefeuille à un seul titre dès le départ.",
                            "10 % — comme pour chaque ligne d'un portefeuille de 10 titres.",
                            "60 % — la première ligne est toujours la plus importante."
                        ],
                        correct_answer: 2,
                        explanation: "Investir 30 % sur la première ligne laisse 70 % disponible pour diversifier progressivement et conserver une réserve stratégique (trésor de guerre)."
                    },
                    {
                        id: 'q12',
                        question: "Que signifie une \"plus-value latente\" visible sur le tableau de bord AfriBourse ?",
                        options: [
                            "Un gain effectivement encaissé après la vente d'une action.",
                            "Un gain sur papier sur une ligne encore en portefeuille — le profit ne sera réel qu'à la vente.",
                            "Un dividende perçu mais non encore viré sur le compte espèces.",
                            "La différence entre le prix d'achat et la valeur intrinsèque calculée par DCF.",
                            "Une performance supérieure au BRVM Composite."
                        ],
                        correct_answer: 1,
                        explanation: "La distinction entre plus-value latente et réalisée est fondamentale, y compris pour la fiscalité : vous n'êtes imposé que sur la plus-value réalisée (après vente effective)."
                    },
                    {
                        id: 'q13',
                        question: "Quelle est la fréquence de consultation du tableau de bord recommandée pour un investisseur à long terme sur la BRVM ?",
                        options: [
                            "Plusieurs fois par jour — pour ne manquer aucun mouvement de cours.",
                            "Une fois par jour après le fixing quotidien.",
                            "Une fois par semaine pour la valorisation, une revue mensuelle ou trimestrielle pour l'analyse complète.",
                            "Une seule fois par an lors de la publication des résultats annuels.",
                            "Uniquement en cas de crise ou de forte baisse du BRVM Composite."
                        ],
                        correct_answer: 2,
                        explanation: "L'obsession du cours quotidien est l'un des principaux déclencheurs de décisions émotionnelles. Votre horizon est de 7 ans, pas de 7 heures."
                    },
                    {
                        id: 'q14',
                        question: "Parmi les erreurs suivantes, laquelle est qualifiée de \"la plus fréquente\" chez le débutant selon le module ?",
                        options: [
                            "Choisir des Blue Chips plutôt que des small caps.",
                            "Consulter son portefeuille une fois par semaine.",
                            "Investir l'intégralité de son capital en une seule fois, souvent dans un seul titre.",
                            "Utiliser des ordres à cours limité plutôt que des ordres au marché.",
                            "Conserver une réserve de cash de 10 % en permanence."
                        ],
                        correct_answer: 2,
                        explanation: "Cette erreur combine deux risques en un : le risque de timing (achat au plus haut) et le risque de concentration (absence de diversification)."
                    },
                    {
                        id: 'q15',
                        question: "Où sont conservés vos titres (actions, obligations) en cas de faillite de votre SGI ?",
                        options: [
                            "Ils sont perdus — la SGI est responsable de leur conservation.",
                            "Ils sont rapatriés automatiquement vers l'AMF-UMOA.",
                            "Ils restent en sécurité au DC/BR (Dépositaire Central / Banque de Règlement), enregistrés à votre nom.",
                            "Ils sont transférés vers une autre SGI désignée par la BCEAO.",
                            "Ils sont convertis en liquidités et versés sur votre compte bancaire."
                        ],
                        correct_answer: 2,
                        explanation: "Le DC/BR conserve vos titres indépendamment de votre SGI. C'est une garantie fondamentale de l'architecture du marché BRVM — vos titres vous appartiennent, pas à votre intermédiaire."
                    }
                ]
            }
        });

        // S'assurer que has_quiz est true sur le module
        await prisma.learningModule.update({
            where: { id: module.id },
            data: { has_quiz: true }
        });

        console.log('✅ Quiz créé avec succès !');
        console.log(`   ID: ${quiz.id}`);
        console.log(`   Nombre de questions: ${(quiz.questions as any[])?.length || 0}`);
        console.log(`   Score de passage: ${quiz.passing_score}%`);
        console.log('');
        console.log('📝 Note: Le système sélectionnera automatiquement 10 questions aléatoires parmi les 15 lors de chaque test.');

    } catch (error) {
        console.error('❌ Erreur lors de la création du quiz:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createModule16Quiz();
