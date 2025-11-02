// backend/scripts/create-quiz.ts
// Script pour créer un quiz pour un module d'apprentissage

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createQuiz() {
  try {
    console.log('🔍 Recherche du module...');

    // Trouver le module par slug
    const module = await prisma.learningModule.findFirst({
      where: { slug: 'introduction-brvm' } // Modifier selon votre module
    });

    if (!module) {
      console.error('❌ Module non trouvé');
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
      console.warn('⚠️  Un quiz existe déjà pour ce module');
      const response = await confirm('Voulez-vous le supprimer et en créer un nouveau ? (y/n): ');
      if (response) {
        await prisma.quiz.delete({ where: { id: existingQuiz.id } });
        console.log('🗑️  Ancien quiz supprimé');
      } else {
        console.log('❌ Opération annulée');
        return;
      }
    }

    // Créer le quiz
    console.log('📝 Création du quiz...');

    const quiz = await prisma.quiz.create({
      data: {
        moduleId: module.id,
        passing_score: 70, // Score minimum pour réussir (70%)
        questions: [
          {
            id: 'q1',
            question: "Qu'est-ce que la BRVM ?",
            options: [
              "La Banque Régionale des Valeurs Monétaires",
              "La Bourse Régionale des Valeurs Mobilières",
              "Le Bureau Régional des Valeurs Marchandes",
              "La Banque de Régulation des Valeurs Mobilières"
            ],
            correct_answer: 1,
            explanation: "La BRVM (Bourse Régionale des Valeurs Mobilières) est la bourse de l'Union Économique et Monétaire Ouest Africaine (UEMOA). Elle permet aux entreprises de lever des capitaux et aux investisseurs d'acheter et vendre des titres financiers."
          },
          {
            id: 'q2',
            question: "Combien de pays composent l'UEMOA ?",
            options: [
              "6 pays",
              "8 pays",
              "10 pays",
              "12 pays"
            ],
            correct_answer: 1,
            explanation: "L'UEMOA compte 8 pays membres: Bénin, Burkina Faso, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal et Togo."
          },
          {
            id: 'q3',
            question: "Quelle est la devise utilisée sur la BRVM ?",
            options: [
              "Le Franc CFA (XOF)",
              "Le Dollar américain ($)",
              "L'Euro (€)",
              "Le Naira (₦)"
            ],
            correct_answer: 0,
            explanation: "La BRVM utilise le Franc CFA ouest-africain (XOF), la monnaie commune des pays de l'UEMOA. 1 EUR = environ 655 FCFA."
          },
          {
            id: 'q4',
            question: "Quel est le rôle principal d'une bourse ?",
            options: [
              "Imprimer de l'argent",
              "Faciliter l'échange de titres financiers entre acheteurs et vendeurs",
              "Collecter les impôts des entreprises",
              "Gérer les comptes bancaires"
            ],
            correct_answer: 1,
            explanation: "Une bourse est un marché organisé où s'échangent des titres financiers (actions, obligations). Elle permet aux entreprises de lever des fonds en vendant des parts de leur capital, et aux investisseurs d'acheter et vendre ces titres."
          },
          {
            id: 'q5',
            question: "Qu'est-ce qu'une action ?",
            options: [
              "Un prêt accordé à une entreprise",
              "Une part de propriété d'une entreprise",
              "Un produit d'épargne bancaire",
              "Un titre de dette émis par l'État"
            ],
            correct_answer: 1,
            explanation: "Une action représente une part du capital d'une entreprise. En possédant des actions, vous devenez actionnaire et propriétaire d'une partie de l'entreprise, avec le droit de participer aux décisions (vote en assemblée générale) et de recevoir des dividendes."
          },
          {
            id: 'q6',
            question: "Où se trouve le siège de la BRVM ?",
            options: [
              "Dakar, Sénégal",
              "Abidjan, Côte d'Ivoire",
              "Ouagadougou, Burkina Faso",
              "Lomé, Togo"
            ],
            correct_answer: 1,
            explanation: "Le siège de la BRVM est situé à Abidjan, en Côte d'Ivoire, la capitale économique de la sous-région."
          },
          {
            id: 'q7',
            question: "Quand a été créée la BRVM ?",
            options: [
              "1988",
              "1996",
              "2000",
              "2005"
            ],
            correct_answer: 1,
            explanation: "La BRVM a été créée en 1996 pour unifier les marchés financiers de l'UEMOA et favoriser le développement économique de la région."
          },
          {
            id: 'q8',
            question: "Qu'est-ce qu'un dividende ?",
            options: [
              "Le prix d'achat d'une action",
              "Une part des bénéfices distribuée aux actionnaires",
              "Les frais de transaction en bourse",
              "La valeur totale d'une entreprise"
            ],
            correct_answer: 1,
            explanation: "Un dividende est une partie des bénéfices d'une entreprise qui est distribuée à ses actionnaires. C'est un revenu régulier pour les investisseurs, en plus de la potentielle plus-value sur le cours de l'action."
          },
          {
            id: 'q9',
            question: "Quel est l'indice principal de la BRVM ?",
            options: [
              "BRVM Composite",
              "CAC 40",
              "Dow Jones",
              "FTSE 100"
            ],
            correct_answer: 0,
            explanation: "Le BRVM Composite est l'indice principal de la bourse régionale. Il suit la performance globale du marché en calculant une moyenne pondérée des prix de toutes les actions cotées."
          },
          {
            id: 'q10',
            question: "Qui peut investir en bourse à la BRVM ?",
            options: [
              "Uniquement les banques et grandes entreprises",
              "Uniquement les citoyens de l'UEMOA",
              "Toute personne physique ou morale, locale ou étrangère",
              "Uniquement les investisseurs institutionnels"
            ],
            correct_answer: 2,
            explanation: "La BRVM est ouverte à tous les investisseurs, qu'ils soient particuliers ou institutionnels, résidents de l'UEMOA ou étrangers. Il suffit d'ouvrir un compte auprès d'une SGI (Société de Gestion et d'Intermédiation)."
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

  } catch (error) {
    console.error('❌ Erreur lors de la création du quiz:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction utilitaire pour demander confirmation
function confirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once('data', (data) => {
      const answer = data.toString().trim().toLowerCase();
      resolve(answer === 'y' || answer === 'yes');
    });
  });
}

// Exécuter le script
createQuiz();
