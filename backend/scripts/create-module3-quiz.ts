/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createModule3Quiz() {
  try {
    console.log("🔎 Recherche du module 3...");

    const module = await prisma.learningModule.findFirst({
      where: { slug: 'outils-investisseur' }
    });

    if (!module) {
      console.error("❌ Module introuvable. Vérifiez le slug !");
      const modules = await prisma.learningModule.findMany();
      console.log("\n📌 Slugs disponibles :", modules.map(m => m.slug));
      return;
    }

    console.log(`✅ Module trouvé : ${module.title} (id: ${module.id})`);

    console.log("\n🗑️ Suppression de l'ancien quiz s'il existe...");
    const existingQuiz = await prisma.quiz.findFirst({
      where: { moduleId: module.id }
    });

    if (existingQuiz) {
      await prisma.quiz.delete({ where: { id: existingQuiz.id } });
      console.log("✔️ Ancien quiz supprimé.");
    } else {
      console.log("ℹ️ Aucun quiz précédent trouvé.");
    }

    console.log("\n📝 Création du nouveau quiz du Module 3...");

    const quiz = await prisma.quiz.create({
      data: {
        moduleId: module.id,
        passing_score: 80,
        questions: [
          {
            id: 'q1',
            question: "Quelle est la définition principale d'une action pour un investisseur ?",
            options: [
              "Un prêt fait à une entreprise ou à l'État, remboursable à maturité.",
              "Un contrat d'assurance pour garantir un revenu fixe.",
              "Une fraction du capital d’une société, faisant de l'acheteur un co-propriétaire.",
              "Un titre de créance qui verse des coupons annuels garantis.",
              "Un placement dont la valeur est toujours stable et garantie par le régulateur."
            ],
            correct_answer: 2,
            explanation: "L’action représente une part du capital : l’investisseur devient copropriétaire."
          },
          {
            id: 'q2',
            question: "Quelle est la principale source de rendement d'une obligation pour l'investisseur ?",
            options: [
              "La forte plus-value potentielle grâce à la volatilité de son prix.",
              "Le droit de souscrire de nouvelles actions à prix réduit.",
              "Les coupons annuels (intérêts) versés par l'émetteur.",
              "Le droit d'utiliser les biens de l'entreprise emprunteuse.",
              "La part du bénéfice de l'entreprise (dividendes)."
            ],
            correct_answer: 2,
            explanation: "Une obligation génère des intérêts sous forme de coupons."
          },
          {
            id: 'q3',
            question: "En cas de faillite d'une entreprise cotée, quel groupe d'investisseurs est rémunéré en dernier ?",
            options: [
              "Les actionnaires.",
              "Les détenteurs d'obligations d'État.",
              "Les détenteurs d'obligations d'entreprise.",
              "Le DC/BR.",
              "Les Sociétés de Gestion d’OPCVM (SGO)."
            ],
            correct_answer: 0,
            explanation: "Les actionnaires sont les derniers servis car ils prennent le plus gros risque."
          },
          {
            id: 'q4',
            question: "Que sont les OPCVM ?",
            options: [
              "Des titres de créance à long terme émis par la BCEAO.",
              "Des actions qui offrent un dividende garanti.",
              "Des fonds d’investissement collectifs qui regroupent l'argent pour diversifier les titres.",
              "Des obligations à haut risque et à haut rendement.",
              "Des produits financiers non réglementés par l'AMF-UMOA."
            ],
            correct_answer: 2,
            explanation: "Les OPCVM permettent une gestion collective et une diversification immédiate."
          },
          {
            id: 'q5',
            question: "Quel est l'horizon d'investissement conseillé pour les actions ?",
            options: [
              "Court terme (moins de 1 an).",
              "Très court terme (Liquidités).",
              "Moyen terme (2–5 ans).",
              "Long terme (5–10 ans).",
              "Illimité, car le risque est nul."
            ],
            correct_answer: 3,
            explanation: "Les actions sont volatiles : il faut du temps pour lisser les fluctuations."
          },
          {
            id: 'q6',
            question: "Quelle est la principale différence entre une Action et une Obligation ?",
            options: [
              "L'action est cotée sur le marché primaire, l'obligation sur le secondaire.",
              "L'action est un titre de propriété, l'obligation est un titre de créance.",
              "L'action verse des coupons, l'obligation verse des dividendes.",
              "L'action est réservée aux États, l'obligation aux entreprises.",
              "L'action a un rendement fixe, l'obligation a un rendement variable."
            ],
            correct_answer: 1,
            explanation: "Action = Propriété. Obligation = Créance."
          },
          {
            id: 'q7',
            question: "Quelle est la définition d'un Dividende ?",
            options: [
              "Le remboursement du capital d'une obligation à sa maturité.",
              "L'intérêt fixe versé par l'émetteur d'une obligation.",
              "Une part du bénéfice distribuée aux actionnaires.",
              "La commission versée à la SGI.",
              "L'augmentation de capital."
            ],
            correct_answer: 2,
            explanation: "Le dividende correspond à une part des bénéfices distribuée aux actionnaires."
          },
          {
            id: 'q8',
            question: "Le principal risque associé aux obligations est :",
            options: [
              "Une volatilité forte du marché.",
              "Le défaut de paiement ou le risque de taux.",
              "L'absence de diversification.",
              "La difficulté à les revendre rapidement.",
              "L'impossibilité de percevoir un dividende."
            ],
            correct_answer: 1,
            explanation: "Une obligation comporte le risque que l'émetteur ne rembourse pas."
          },
          {
            id: 'q9',
            question: "Un Split d'actions sert à :",
            options: [
              "Augmenter la valeur totale du capital.",
              "Diminuer la volatilité.",
              "Rendre le prix plus accessible et augmenter la liquidité.",
              "Créer de nouvelles dettes.",
              "Verser un dividende exceptionnel."
            ],
            correct_answer: 2,
            explanation: "Un split divise le prix de l’action pour améliorer l’accessibilité."
          },
          {
            id: 'q10',
            question: "Quel instrument réplique un indice boursier et est coté en Bourse ?",
            options: [
              "Les FCP.",
              "Les obligations d'État.",
              "Les ETF.",
              "Les actions DPS.",
              "Les SICAV."
            ],
            correct_answer: 2,
            explanation: "Les ETF reproduisent la performance d’un indice."
          },
          {
            id: 'q11',
            question: "La diversification d'un OPCVM permet de modérer :",
            options: [
              "Le risque d'inflation.",
              "Le risque de défaut d'État.",
              "Le risque de hausse des taux.",
              "Le risque spécifique à une seule entreprise.",
              "Le risque lié au split."
            ],
            correct_answer: 3,
            explanation: "Un OPCVM dilue le risque lié à une entreprise spécifique."
          },
          {
            id: 'q12',
            question: "Quel terme désigne le droit préférentiel des actionnaires pour acheter les nouvelles actions ?",
            options: [
              "Coupon annuel.",
              "Split.",
              "Augmentation de capital.",
              "Plus-value.",
              "IPO."
            ],
            correct_answer: 2,
            explanation: "Les anciens actionnaires ont priorité lors des augmentations de capital."
          },
          {
            id: 'q13',
            question: "Quel est le risque principal des liquidités ?",
            options: [
              "La volatilité.",
              "Le risque de marché.",
              "L'inflation.",
              "Le défaut de paiement.",
              "Le risque de gestion."
            ],
            correct_answer: 2,
            explanation: "Les liquidités perdent de la valeur en cas d’inflation."
          },
          {
            id: 'q14',
            question: "Une obligation d'État est caractérisée par :",
            options: [
              "Un rendement élevé, risque fort.",
              "Un rendement stable et un risque faible.",
              "Pas de remboursement du capital.",
              "Un dividende non garanti.",
              "Une participation aux bénéfices."
            ],
            correct_answer: 1,
            explanation: "Les obligations d’État sont très sécurisées."
          },
          {
            id: 'q15',
            question: "Quel est le risque principal des actions ?",
            options: [
              "Le capital non remboursé à maturité.",
              "Coupons incertains.",
              "Volatilité élevée du prix.",
              "Absence de croissance.",
              "Inflation plus forte."
            ],
            correct_answer: 2,
            explanation: "Les actions peuvent fluctuer fortement."
          },
          {
            id: 'q16',
            question: "Dans quelle catégorie d’OPCVM l’investisseur devient actionnaire ?",
            options: [
              "FCP.",
              "ETF.",
              "SICAV.",
              "Obligations d'entreprise.",
              "Fonds de pension."
            ],
            correct_answer: 2,
            explanation: "La SICAV a une personnalité juridique : vous en devenez actionnaire."
          },
          {
            id: 'q17',
            question: "Le gain obtenu lorsque le prix de l'action dépasse son prix d'achat s'appelle :",
            options: [
              "Coupon.",
              "Dividende.",
              "Intérêt.",
              "Plus-value.",
              "Split."
            ],
            correct_answer: 3,
            explanation: "La plus-value correspond à la différence positive entre achat et vente."
          },
          {
            id: 'q18',
            question: "L’horizon conseillé pour les obligations et OPCVM est :",
            options: [
              "Élevé.",
              "Modéré.",
              "Faible.",
              "Court terme.",
              "Illimité."
            ],
            correct_answer: 1,
            explanation: "Leur risque est classé modéré."
          },
          {
            id: 'q19',
            question: "L’action SONATEL est citée pour :",
            options: [
              "Un rendement stable et peu volatil.",
              "Un rendement fixe.",
              "Un risque très sécurisé.",
              "Des dividendes élevés.",
              "Des obligations sécurisées."
            ],
            correct_answer: 3,
            explanation: "SONATEL distribue historiquement des dividendes importants."
          },
          {
            id: 'q20',
            question: "Quel élément n'est jamais garanti par une société cotée ?",
            options: [
              "Le remboursement du capital d'une obligation d'État.",
              "Le coupon d'une obligation d'entreprise.",
              "Le dividende d'une action.",
              "La liquidité d’un ETF.",
              "Le droit préférentiel de souscription."
            ],
            correct_answer: 2,
            explanation: "Les dividendes dépendent des résultats de l’entreprise : jamais garantis."
          }
        ]
      }
    });

    console.log("\n🎉 Quiz du Module 3 créé avec succès !");
    console.log(`🆔 ID : ${quiz.id}`);
    console.log(`📌 Nombre de questions : ${(quiz.questions as any[])?.length || 0}`);
    console.log(`🎯 Score minimum : ${quiz.passing_score}%`);

    console.log("\n🔧 Mise à jour du module (has_quiz = true)...");
    await prisma.learningModule.update({
      where: { id: module.id },
      data: { has_quiz: true }
    });

    console.log("✔️ Module mis à jour !");
    console.log("\n✨ Tout est prêt pour l'intégration du quiz sur la plateforme.");

  } catch (error) {
    console.error("❌ ERREUR :", error);
  } finally {
    await prisma.$disconnect();
  }
}

createModule3Quiz();
