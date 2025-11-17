// backend/scripts/create-module2-quiz.ts
// Script pour créer le quiz du Module 2 - Les Acteurs du Jeu

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule2Quiz() {
  try {
    console.log('🔍 Recherche du Module 2...');

    // Trouver le module par son slug
    const module = await prisma.learningModule.findFirst({
      where: { slug: 'acteurs-du-jeu' }
    });

    if (!module) {
      console.error('❌ Module 2 non trouvé');
      const modules = await prisma.learningModule.findMany({
        select: { slug: true, title: true }
      });
      console.log('💡 Modules disponibles :');
      modules.forEach(m => console.log(`   - ${m.slug}: ${m.title}`));
      return;
    }

    console.log(`✅ Module trouvé : ${module.title}`);

    // Vérifier si un quiz existe déjà
    const existingQuiz = await prisma.quiz.findFirst({
      where: { moduleId: module.id }
    });

    if (existingQuiz) {
      console.log('⚠️ Un quiz existe déjà pour ce module. Suppression...');
      await prisma.quiz.delete({ where: { id: existingQuiz.id } });
      console.log('🗑️ Ancien quiz supprimé');
    }

    // Créer le quiz avec 20 questions
    console.log('📝 Création du quiz du Module 2 avec 20 questions...');

    const quiz = await prisma.quiz.create({
      data: {
        moduleId: module.id,
        passing_score: 80,
        questions: [
          {
            id: 'q1',
            question: "Quel est l'ancien nom de l'AMF-UMOA ?",
            options: ["BCEAO", "DC/BR", "CREPMF", "SGI", "BRVM"],
            correct_answer: 2,
            explanation: "L’AMF-UMOA portait auparavant le nom de CREPMF."
          },
          {
            id: 'q2',
            question: "Quel est le rôle principal de la BCEAO par rapport au marché financier ?",
            options: [
              "Réglementer les introductions en bourse",
              "Conserver les titres des investisseurs",
              "Assurer la stabilité monétaire",
              "Transmettre les ordres à la BRVM",
              "Gérer les OPCVM"
            ],
            correct_answer: 2,
            explanation: "La BCEAO assure la stabilité monétaire et macroéconomique dans la zone UEMOA."
          },
          {
            id: 'q3',
            question: "Où sont physiquement enregistrés les titres d’un investisseur ?",
            options: [
              "Chez la SGI",
              "Au siège de la BRVM",
              "Au DC/BR",
              "À l’AMF-UMOA",
              "À la BCEAO"
            ],
            correct_answer: 2,
            explanation: "Les titres sont enregistrés au DC/BR, le coffre-fort digital du marché."
          },
          {
            id: 'q4',
            question: "Quel acteur est décrit comme le 'gendarme financier' du marché ?",
            options: ["BCEAO", "AMF-UMOA", "BRVM", "DC/BR", "Sociétés cotées"],
            correct_answer: 1,
            explanation: "L’AMF-UMOA surveille, contrôle et sanctionne les acteurs du marché."
          },
          {
            id: 'q5',
            question: "En cas de faillite d’une SGI, que deviennent les titres d’un investisseur ?",
            options: [
              "Ils sont perdus",
              "Transférés à la BCEAO",
              "Liquidés par l’AMF-UMOA",
              "Revendus automatiquement",
              "Ils restent au DC/BR"
            ],
            correct_answer: 4,
            explanation: "Les titres restent intacts car ils sont conservés au DC/BR."
          },
          {
            id: 'q6',
            question: "Quel est le rôle principal d’une SGI ?",
            options: [
              "Définir la politique monétaire",
              "Délivrer les agréments",
              "Transmettre les ordres des investisseurs",
              "Conserver les titres",
              "Auditer les états financiers"
            ],
            correct_answer: 2,
            explanation: "La SGI joue le rôle d’intermédiaire : elle transmet vos ordres à la BRVM."
          },
          {
            id: 'q7',
            question: "Le DC/BR est aussi appelé Banque de Règlement. Quel processus couvre-t-il ?",
            options: [
              "Financer les IPO",
              "Gérer les flux financiers des transactions",
              "Imprimer la monnaie",
              "Superviser les banques",
              "Distribuer les dividendes"
            ],
            correct_answer: 1,
            explanation: "Le DC/BR gère le règlement-livraison : flux financiers + titres."
          },
          {
            id: 'q8',
            question: "Comment la BCEAO influence-t-elle le marché financier régional ?",
            options: [
              "En achetant des actions",
              "Avec ses taux directeurs",
              "En agréant les SGI",
              "En définissant les règles de cotation",
              "En gérant la BRVM"
            ],
            correct_answer: 1,
            explanation: "Les taux directeurs influencent le crédit, l'investissement et les valorisations."
          },
          {
            id: 'q9',
            question: "Quel autre acteur, en plus des SGI, est agréé par l’AMF-UMOA ?",
            options: [
              "Commissaires aux comptes",
              "Médias",
              "SGO / OPCVM",
              "Entreprises émettrices",
              "Investisseurs particuliers"
            ],
            correct_answer: 2,
            explanation: "Les Sociétés de Gestion d’OPCVM sont agréées par l’AMF-UMOA."
          },
          {
            id: 'q10',
            question: "Un investisseur particulier est défini par :",
            options: [
              "Un individu investissant sa propre épargne",
              "Un gestionnaire de milliards",
              "Une compagnie d'assurance",
              "Un détenteur de 10% d'une société",
              "Un investisseur uniquement obligataire"
            ],
            correct_answer: 0,
            explanation: "L’investisseur particulier investit son propre argent."
          },
          {
            id: 'q11',
            question: "Acheter une action fait de l’investisseur un :",
            options: [
              "Copropriétaire",
              "Créancier",
              "Bénéficiaire unique",
              "Courtier agréé",
              "Dépositaire"
            ],
            correct_answer: 0,
            explanation: "Une action est une part de propriété."
          },
          {
            id: 'q12',
            question: "Quel pays n'est PAS siège d’une institution clé de la BRVM ?",
            options: ["Côte d'Ivoire", "Bénin", "Sénégal", "Mali", "Niger"],
            correct_answer: 2,
            explanation: "Les sièges sont à Abidjan (BRVM) et Cotonou (DC/BR)."
          },
          {
            id: 'q13',
            question: "Pourquoi les entreprises choisissent-elles d’entrer en bourse ?",
            options: [
              "Payer moins d'impôts",
              "Lever des fonds sans banques",
              "Devenir institutionnelles",
              "Échapper à la BCEAO",
              "Augmenter les salaires"
            ],
            correct_answer: 1,
            explanation: "La bourse permet de lever des fonds sans recourir à l’endettement bancaire."
          },
          {
            id: 'q14',
            question: "Quel acteur est le 'notaire digital du marché' ?",
            options: ["AMF-UMOA", "BCEAO", "SGI", "BRVM", "DC/BR"],
            correct_answer: 4,
            explanation: "Le DC/BR garde et authentifie les titres des investisseurs."
          },
          {
            id: 'q15',
            question: "Qui gère les FCP et SICAV ?",
            options: ["SGO", "Sociétés cotées", "SGI", "DC/BR", "AMF-UMOA"],
            correct_answer: 0,
            explanation: "Les SGO (Sociétés de Gestion) gèrent les OPCVM."
          },
          {
            id: 'q16',
            question: "Quelle mission de l’AMF-UMOA concerne les délits d’initiés ?",
            options: ["Réglementer", "Autoriser", "Surveiller et sanctionner", "Agréer", "Politique monétaire"],
            correct_answer: 2,
            explanation: "L’AMF-UMOA lutte contre la fraude et les abus de marché."
          },
          {
            id: 'q17',
            question: "Qu’est-ce qu’un Investisseur Institutionnel ?",
            options: [
              "Structure investissant pour des clients",
              "Investisseur d’obligations uniquement",
              "Acteur non agréé",
              "Individu investissant +100M",
              "PME cotée"
            ],
            correct_answer: 0,
            explanation: "Un investisseur institutionnel gère les fonds de tiers."
          },
          {
            id: 'q18',
            question: "Impact d'une hausse des taux BCEAO ?",
            options: [
              "Les valorisations montent",
              "Elles restent stables",
              "Elles peuvent baisser",
              "Elles doublent",
              "Elles explosent"
            ],
            correct_answer: 2,
            explanation: "Un crédit plus cher réduit l’investissement et les bénéfices futurs."
          },
          {
            id: 'q19',
            question: "L’analogie 'taxi-moto boursier' décrit :",
            options: [
              "Petite taille",
              "Coût faible",
              "Intermédiaire exécutant les ordres",
              "Transport de capitaux",
              "Gardien des titres"
            ],
            correct_answer: 2,
            explanation: "La SGI connaît la route et exécute vos ordres."
          },
          {
            id: 'q20',
            question: "Quel acteur assure le respect des règles LBC/FT ?",
            options: ["BCEAO", "DC/BR", "AMF-UMOA", "Sociétés cotées", "SGI"],
            correct_answer: 2,
            explanation: "L’AMF-UMOA protège l’intégrité du système financier."
          }
        ]
      }
    });

    // Mise à jour du module
    await prisma.learningModule.update({
      where: { id: module.id },
      data: { has_quiz: true }
    });

    console.log('✅ Quiz du Module 2 créé avec succès !');
    console.log(`   - ID: ${quiz.id}`);
    console.log(`   - Nombre de questions: ${(quiz.questions as any[]).length}`);
    console.log(`   - Score de passage: ${quiz.passing_score}%`);
    console.log('📝 Le système tirera automatiquement 10 questions aléatoires.');
  } catch (error) {
    console.error('❌ Erreur lors de la création du quiz:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createModule2Quiz();
