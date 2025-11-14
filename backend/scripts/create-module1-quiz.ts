// backend/scripts/create-module1-quiz.ts
// Script pour créer le quiz du Module 1 - Les Fondations de la Bourse et de la BRVM

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule1Quiz() {
  try {
    console.log('🔍 Recherche du Module 1...');

    // Trouver le module par slug
    const module = await prisma.learningModule.findFirst({
      where: { slug: 'fondations-bourse-brvm' }
    });

    if (!module) {
      console.error('❌ Module 1 non trouvé');
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
        passing_score: 80, // Score minimum de 80%
        questions: [
          {
            id: 'q1',
            question: "Selon le module, quelle est la meilleure analogie pour décrire un marché financier?",
            options: [
              "Un distributeur automatique où l'on retire de l'argent.",
              "Le Grand Marché central de la ville.",
              "Un compte d'épargne bloqué à long terme.",
              "Une usine de production de biens physiques.",
              "Une institution bancaire classique."
            ],
            correct_answer: 1,
            explanation: "Le Grand Marché central de la ville est l'analogie utilisée dans le module pour expliquer le marché primaire (producteurs vendant pour la première fois) et le marché secondaire (commerçants revendant des produits déjà achetés)."
          },
          {
            id: 'q2',
            question: "Quel type de titre financier représente une 'part de propriété' dans une entreprise?",
            options: [
              "Les obligations.",
              "Les bons du Trésor.",
              "Les actions.",
              "Les devises."
            ],
            correct_answer: 2,
            explanation: "Les actions représentent une part de propriété dans une entreprise. En tant qu'actionnaire, vous avez le droit de vote à l'assemblée générale de l'entreprise."
          },
          {
            id: 'q3',
            question: "Quelle est l'une des trois grandes fonctions essentielles des marchés financiers, selon le module?",
            options: [
              "Garantir un taux d'intérêt fixe sur l'épargne.",
              "Financer uniquement les projets des États, à l'exclusion des entreprises.",
              "Canaliser l'épargne vers l'investissement productif.",
              "Assurer la stabilité des prix des titres en tout temps.",
              "Remplacer complètement le rôle des banques commerciales."
            ],
            correct_answer: 2,
            explanation: "Canaliser l'épargne vers l'investissement productif est l'une des trois grandes fonctions. L'argent des investisseurs aide l'économie réelle à se développer (usines, routes, innovations)."
          },
          {
            id: 'q4',
            question: "La BRVM est une bourse unique au monde pour quelle raison principale?",
            options: [
              "Elle n'échange que des titres d'entreprises du secteur agricole.",
              "Elle est commune à huit pays africains partageant la même monnaie (UEMOA).",
              "Elle est la plus ancienne bourse d'Afrique de l'Ouest.",
              "Elle est détenue à 100 % par les États de la zone UEMOA."
            ],
            correct_answer: 1,
            explanation: "La BRVM est unique car elle est commune à huit pays africains partageant la même monnaie (le franc CFA) dans la zone UEMOA."
          },
          {
            id: 'q5',
            question: "Dans le fonctionnement de la BRVM, quel acteur a pour mission de veiller au respect des règles de transparence et de protection des investisseurs?",
            options: [
              "La Bourse Régionale des Valeurs Mobilières (BRVM).",
              "Les Sociétés de Gestion et d'Intermédiation (SGI).",
              "Le Dépositaire Central (DC/BR).",
              "Le CREPMF."
            ],
            correct_answer: 3,
            explanation: "Le CREPMF est l'organisme de régulation (le gendarme du marché) qui veille au respect des règles de transparence et de protection des investisseurs."
          },
          {
            id: 'q6',
            question: "En tant qu'investisseur particulier, quel marché est votre 'terrain de jeu principal' pour acheter ou revendre des titres?",
            options: [
              "Le marché des devises (Forex).",
              "Le marché primaire.",
              "Le marché monétaire.",
              "Le marché secondaire."
            ],
            correct_answer: 3,
            explanation: "Le marché secondaire est votre terrain de jeu principal car c'est là que vous achetez ou revendez des titres déjà échangés entre investisseurs."
          },
          {
            id: 'q7',
            question: "Dans le cas du marché primaire, à qui va l'argent lors de la vente des titres?",
            options: [
              "Aux courtiers (SGI) pour leur commission.",
              "Directement à l'entreprise ou à l'État qui émet le titre.",
              "À un autre investisseur qui cherche à vendre son portefeuille.",
              "Au régulateur (CREPMF) pour garantir la sécurité du marché."
            ],
            correct_answer: 1,
            explanation: "Sur le marché primaire, l'argent va directement à l'entreprise ou à l'État qui émet le titre pour la première fois. C'est synonyme de 'nouvelle émission' des titres."
          },
          {
            id: 'q8',
            question: "Qu'est-ce que l'indice 'BRVM 10' représente?",
            options: [
              "Les 10 entreprises les moins performantes de l'année.",
              "Les 10 entreprises nouvellement cotées sur le marché primaire.",
              "L'ensemble des sociétés cotées sur la BRVM (BRVM Composite).",
              "Les 10 entreprises les plus liquides et les plus importantes de la BRVM."
            ],
            correct_answer: 3,
            explanation: "Le BRVM 10 représente les 10 entreprises les plus liquides et les plus importantes de la BRVM. Sa composition est sélective par rapport au 'BRVM Composite' qui inclut toutes les sociétés cotées."
          },
          {
            id: 'q9',
            question: "Quel pays ne fait PAS partie de la zone UEMOA et des huit pays de la BRVM, selon le module?",
            options: [
              "Le Sénégal.",
              "La Côte d'Ivoire.",
              "Le Cameroun.",
              "Le Niger.",
              "Le Togo."
            ],
            correct_answer: 2,
            explanation: "Le Cameroun ne fait pas partie de l'UEMOA. Les huit pays membres sont : Bénin, Burkina Faso, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, Togo."
          },
          {
            id: 'q10',
            question: "Le siège de la BRVM est situé à...",
            options: [
              "Dakar (Sénégal).",
              "Cotonou (Bénin) (Siège du DC/BR).",
              "Ouagadougou (Burkina Faso).",
              "Abidjan (Côte d'Ivoire)."
            ],
            correct_answer: 3,
            explanation: "Le siège de la BRVM est situé à Abidjan (Côte d'Ivoire). La ville est mentionnée dans le module comme siège de la Bourse créée en 1998."
          },
          {
            id: 'q11',
            question: "Le terme 'IPO' (Initial Public Offering) signifie:",
            options: [
              "Indice des Performances Obligations.",
              "Introduction en bourse.",
              "Investissement Permanent Obligatoire.",
              "Intérêt Prioritaire d'Ouverture."
            ],
            correct_answer: 1,
            explanation: "IPO signifie Introduction en bourse (Initial Public Offering). Il s'agit de la première vente d'actions au public lors de l'entrée en bourse d'une entreprise."
          },
          {
            id: 'q12',
            question: "L'une des raisons suivantes n'est PAS un motif pour une entreprise d'entrer en bourse (IPO):",
            options: [
              "Améliorer sa visibilité et sa crédibilité.",
              "Accéder à des capitaux illimités sans aucune exigence de transparence.",
              "Permettre à ses premiers actionnaires de revendre une partie de leurs actions.",
              "Lever des capitaux pour son expansion sans contracter de dettes bancaires."
            ],
            correct_answer: 1,
            explanation: "Une entreprise cotée en bourse doit respecter des exigences strictes de transparence. L'une des fonctions des marchés financiers est justement de rendre l'économie plus transparente."
          },
          {
            id: 'q13',
            question: "Quel acteur est l'intermédiaire agréé par lequel les investisseurs doivent passer pour acheter et vendre des titres sur la BRVM?",
            options: [
              "Le Dépositaire Central (DC/BR).",
              "Le CREPMF.",
              "La Bourse Régionale des Valeurs Mobilières (BRVM).",
              "La Société de Gestion et d'Intermédiation (SGI)."
            ],
            correct_answer: 3,
            explanation: "La SGI (Société de Gestion et d'Intermédiation) est le courtier agréé qui exécute vos ordres de bourse. C'est l'intermédiaire obligatoire pour acheter et vendre des titres."
          },
          {
            id: 'q14',
            question: "Sur quel marché se déroule l'échange de titres déjà détenus entre deux investisseurs différents?",
            options: [
              "Le marché des changes.",
              "Le marché monétaire.",
              "Le marché primaire.",
              "Le marché secondaire.",
              "Le marché obligataire."
            ],
            correct_answer: 3,
            explanation: "Le marché secondaire est le marché où les titres déjà émis s'échangent entre investisseurs. L'argent circule entre investisseurs, et non vers l'entreprise émettrice."
          },
          {
            id: 'q15',
            question: "Quelle fonction des marchés financiers est illustrée par le fait que 'Vous pouvez revendre vos titres à tout moment'?",
            options: [
              "Canaliser l'épargne vers l'investissement productif.",
              "Faciliter la liquidité.",
              "Rendre l'économie plus transparente.",
              "Diversifier les sources de financement."
            ],
            correct_answer: 1,
            explanation: "Faciliter la liquidité est la fonction qui désigne la rapidité et la facilité de transformer un titre en argent liquide. Vous pouvez revendre vos titres à tout moment grâce au marché secondaire."
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
    console.log(`   - Nombre de questions: ${(quiz.questions as any[]).length}`);
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
createModule1Quiz();
