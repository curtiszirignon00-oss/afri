/// <reference types="node" />
// backend/scripts/create-module4-quiz.ts
// Script pour créer le quiz du Module 4 - Produits Avancés

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule4Quiz() {
  try {
    console.log('🔍 Recherche du Module 4...');

    // Trouver le module par slug
    const module = await prisma.learningModule.findFirst({
      where: { slug: 'le-temps-meilleur-allie' }
    });

    if (!module) {
      console.error('❌ Module 4 non trouvé');
      console.log('💡 Modules disponibles:');
      const modules = await prisma.learningModule.findMany({
        select: { slug: true, title: true }
      });
      modules.forEach(m => console.log(`   - ${m.slug}: ${m.title}`));
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
            question: "Quelle est la définition principale d'une SCPI (Société Civile de Placement Immobilier) ?",
            options: [
              "Une société qui émet des obligations garanties par l'État.",
              "Un fonds d'investissement qui achète uniquement des actions d'entreprises immobilières.",
              "Une structure qui permet d'acheter et de gérer un portefeuille d'immeubles.",
              "Un titre de créance qui permet d'emprunter pour acheter un bien physique.",
              "L'équivalent régional du Dépositaire Central pour les actifs immobiliers."
            ],
            correct_answer: 2,
            explanation: "L'objectif de la SCPI est de permettre d'investir dans l'immobilier sans en devenir le propriétaire physique direct."
          },
          {
            id: 'q2',
            question: "Selon le module, quel est un avantage principal de l'investissement dans l'immobilier coté (comme les SCPI) ?",
            options: [
              "Un accès à un capital illimité garanti par l'État.",
              "Un remboursement du capital fixe et garanti à l'échéance.",
              "Le contrôle direct de la gestion du bien immobilier acheté.",
              "La perception de revenus réguliers sous forme de dividendes sans avoir à gérer soi-même les biens.",
              "L'exonération totale d'impôts sur les revenus locatifs."
            ],
            correct_answer: 3,
            explanation: "L'un des principaux attraits est la délégation de la gestion."
          },
          {
            id: 'q3',
            question: "Quel est le risque principal associé à l'investissement dans l'Immobilier Coté (SCPI) ?",
            options: [
              "Un défaut de paiement des coupons de la part de l'État.",
              "Une perte de capital garantie en cas de mauvaise gestion.",
              "La forte volatilité du cours des actions individuelles.",
              "La dépendance à la santé du marché immobilier et la sensibilité aux taux d'intérêt.",
              "L'interdiction de revendre les parts avant dix ans."
            ],
            correct_answer: 3,
            explanation: "Même si la gestion est déléguée, les revenus restent liés au secteur de l'immobilier."
          },
          {
            id: 'q4',
            question: "Quel est l'équivalent international des SCPI (Immobilier Coté) mentionné dans le module ?",
            options: [
              "Les IPO (Initial Public Offering).",
              "Les FCP (Fonds Commun de Placement).",
              "Les REITs (Real Estate Investment Trusts).",
              "Les OPCVM (Organismes de Placement Collectif en Valeurs Mobilières).",
              "Les SGI (Sociétés de Gestion et d'Intermédiation)."
            ],
            correct_answer: 2,
            explanation: "Les REITs sont des véhicules d'investissement immobilier très populaires dans de nombreux pays."
          },
          {
            id: 'q5',
            question: "Selon les principes fondamentaux de la Finance Islamique, quel élément est strictement interdit (riba) ?",
            options: [
              "L'intérêt.",
              "Le partage des profits et pertes.",
              "L'investissement dans des secteurs non licites (halal).",
              "La spéculation monétaire.",
              "L'émission d'obligations adossées à des actifs réels."
            ],
            correct_answer: 0,
            explanation: "Le riba (intérêt) est strictement interdit dans la Finance Islamique."
          },
          {
            id: 'q6',
            question: "Comment appelle-t-on les obligations islamiques adossées à des actifs réels, mentionnées comme produit phare ?",
            options: [
              "Les Sukri.",
              "Les Sukuk.",
              "Les Fatwa.",
              "Les FCP-Charia.",
              "Les Murabaha."
            ],
            correct_answer: 1,
            explanation: "Les Sukuk sont des obligations islamiques adossées à des actifs réels."
          },
          {
            id: 'q7',
            question: "Quel est l'un des trois grands piliers de la Finance Islamique, qui distingue ce modèle des autres formes de financement ?",
            options: [
              "La garantie d'un rendement minimum.",
              "L'investissement uniquement dans des actions.",
              "Le partage des profits et des pertes entre les parties.",
              "La priorité aux activités de spéculation monétaire.",
              "L'interdiction totale d'investir dans l'immobilier."
            ],
            correct_answer: 2,
            explanation: "Le partage des profits et pertes est un pilier fondamental de la Finance Islamique."
          },
          {
            id: 'q8',
            question: "Quelle est la principale caractéristique d'un Produit Structuré ?",
            options: [
              "C'est un simple placement en liquidités à très court terme.",
              "C'est un instrument financier créé par une institution, qui combine plusieurs éléments (souvent une obligation + une option).",
              "C'est un ETF qui réplique l'indice d'un seul secteur d'activité.",
              "C'est un produit de finance islamique garanti par la Charia.",
              "C'est un titre de créance émis par la BCEAO."
            ],
            correct_answer: 1,
            explanation: "Un Produit Structuré combine plusieurs éléments financiers (obligation + option par exemple)."
          },
          {
            id: 'q9',
            question: "Quel est l'un des objectifs d'un Produit Structuré, selon l'exemple donné dans le module ?",
            options: [
              "Assurer un rendement fixe de 10 % par an.",
              "Garantir le paiement d'un dividende élevé.",
              "Permettre un accès simple et à faible coût à l'ensemble du marché.",
              "Protéger partiellement ou totalement le capital à l'échéance.",
              "Investir dans des activités non licites (halal)."
            ],
            correct_answer: 3,
            explanation: "L'un des objectifs principaux est la protection du capital."
          },
          {
            id: 'q10',
            question: "Pourquoi les Produits Structurés sont-ils souvent réservés à des investisseurs avertis ?",
            options: [
              "Ils ne sont pas réglementés par l'AMF-UMOA.",
              "Ils n'offrent jamais de protection du capital.",
              "Ils exigent un investissement minimum très faible.",
              "Ils n'investissent que dans la finance islamique.",
              "Ils sont complexes et nécessitent une lecture attentive des conditions."
            ],
            correct_answer: 4,
            explanation: "Leur complexité nécessite une bonne compréhension avant d'investir."
          },
          {
            id: 'q11',
            question: "Quelle est la définition d'un ETF (Exchange Traded Fund) ?",
            options: [
              "Un fonds de placement qui gère activement le capital pour battre le marché.",
              "Une action qui verse un dividende garanti.",
              "Un fonds coté en bourse qui réplique fidèlement la performance d'un indice.",
              "Un produit structuré qui garantit le capital à l'échéance.",
              "Une obligation d'État émise à très long terme."
            ],
            correct_answer: 2,
            explanation: "Un ETF réplique passivement la performance d'un indice boursier."
          },
          {
            id: 'q12',
            question: "Quel est l'un des avantages majeurs d'un ETF par rapport aux fonds gérés activement ?",
            options: [
              "Des frais de gestion très faibles.",
              "La promesse de battre l'indice de référence.",
              "Une gestion plus complexe et moins transparente.",
              "Un risque de marché nul.",
              "Une garantie de capital à tout moment."
            ],
            correct_answer: 0,
            explanation: "Les ETF ont des frais de gestion très bas comparés aux fonds actifs."
          },
          {
            id: 'q13',
            question: "Quel est le statut actuel des ETF locaux sur la BRVM, selon le module ?",
            options: [
              "Ils dominent déjà les marchés, représentant plus de 50 % des flux.",
              "La BRVM n'a pas encore d'ETF local, mais le sujet est à l'étude.",
              "Ils sont réservés uniquement aux investisseurs institutionnels.",
              "Ils sont interdits par l'AMF-UMOA pour risque excessif.",
              "Ils sont le seul produit financier disponible à l'achat pour les particuliers."
            ],
            correct_answer: 1,
            explanation: "Les ETF locaux sont encore en phase d'étude sur la BRVM."
          },
          {
            id: 'q14',
            question: "Quelle est l'une des raisons pour lesquelles l'ETF est considéré comme révolutionnaire ?",
            options: [
              "Il permet la gestion immobilière directe.",
              "Il élimine complètement le risque de marché.",
              "Il offre une diversification automatique (une seule part donne accès à des dizaines d'actions).",
              "Il garantit le dividende de toutes les actions qu'il détient.",
              "Il s'agit d'un investissement actif qui bat le marché."
            ],
            correct_answer: 2,
            explanation: "L'ETF permet une diversification instantanée avec un seul achat."
          },
          {
            id: 'q15',
            question: "Selon le tableau récapitulatif, quel produit est caractérisé par un niveau de risque modéré et une accessibilité déjà existante dans l'UEMOA ?",
            options: [
              "Les Produits Structurés.",
              "Les ETF / Trackers.",
              "Les SCPI / Immobilier coté.",
              "Les Actions et Obligations.",
              "La Finance islamique (Sukuk, fonds halal)."
            ],
            correct_answer: 4,
            explanation: "La Finance islamique est déjà accessible dans l'UEMOA avec un risque modéré."
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
    console.log(`   - ID: ${quiz.id}`);
    console.log(`   - Nombre de questions: ${(quiz.questions as any[])?.length || 0}`);
    console.log(`   - Score de passage: ${quiz.passing_score}%`);
    console.log(`   - Tentatives autorisées: 2`);
    console.log(`   - Délai entre tentatives après échec: 8 heures`);
    console.log('');
    console.log('📝 Note: Le système sélectionnera automatiquement 10 questions aléatoires parmi les 15 lors de chaque test.');

  } catch (error) {
    console.error('❌ Erreur lors de la création du quiz:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
createModule4Quiz();
