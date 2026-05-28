import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const blocks = [
  {
    type: 'pull-quote',
    text: "La plus grande menace pour votre portefeuille n'est pas la crise économique, mais l'homme qui se regarde dans le miroir : vous-même.",
  },
  {
    type: 'objectives',
    title: 'Objectifs Pédagogiques',
    items: [
      "Comprendre les principes de la finance comportementale et la différence entre investir et spéculer.",
      "Identifier les biais cognitifs et émotionnels les plus fréquents (peur, avidité) et leur impact sur vos décisions.",
      "Mettre en place des stratégies (antidotes) pour une discipline d'investissement rigoureuse.",
      "Utiliser le pouvoir des intérêts composés comme preuve de la nécessité d'une vision à long terme.",
    ],
  },

  // 8.1
  {
    type: 'section-title',
    text: '8.1 Introduction à la finance comportementale',
  },
  {
    type: 'paragraph',
    text: "Sur les marchés financiers, la plus grande menace pour votre portefeuille n'est pas la crise économique, mais l'homme qui se regarde dans le miroir : vous-même. La finance comportementale enseigne que les émotions — la peur et l'avidité — mènent aux décisions irrationnelles, ce qui est la cause principale des erreurs chez les débutants.",
  },
  {
    type: 'section-title',
    text: "8.1.1 Investir vs. Spéculer : Une Distinction Essentielle",
  },
  {
    type: 'paragraph',
    text: "Définir clairement votre rôle est la première étape pour maîtriser votre mental :",
  },
  {
    type: 'table',
    headers: ['Caractéristique', "L'Investisseur (Le Propriétaire)", 'Le Spéculateur (Le Joueur)'],
    rows: [
      ['Objectif', "Acquérir une part d'entreprise solide pour son potentiel de croissance future (valeur interne de l'actif).", "Parier sur l'évolution à court terme du prix."],
      ['Horizon de Temps', 'Long terme (années, décennies).', 'Court terme (jours, semaines).'],
      ['Moteur', "La patience, l'analyse des fondamentaux.", "L'excitation (quand le marché monte) ou la panique (quand il descend)."],
    ],
  },
  {
    type: 'callout',
    variant: 'tip',
    title: "Rappel de l'Expert",
    text: "L'excitation et les dépenses sont vos ennemis. L'excitation conduit aux achats impulsifs à des prix trop élevés. Concentrez-vous à agir comme un propriétaire d'entreprise.",
  },

  // 8.2
  {
    type: 'section-title',
    text: "8.2 Nos pires ennemis : La Peur, l'Avidité et les Biais Cognitifs",
  },
  {
    type: 'paragraph',
    text: "Les bulles spéculatives et les krachs boursiers sont avant tout des phénomènes psychologiques, car ils sont alimentés par deux émotions primaires.",
  },
  {
    type: 'section-title',
    text: "8.2.1 La Peur et l'Avidité (Fear & Greed)",
  },
  {
    type: 'table',
    headers: ['Émotion', 'Description', 'Conséquence Destructrice'],
    rows: [
      [
        "L'Avidité (Greed)",
        "Elle vous pousse à acheter lorsque les prix sont élevés, par peur de manquer le gain (FOMO - Fear of Missing Out). Elle est amplifiée lorsque « la foule crie victoire ».",
        'Achat de titres surévalués.',
      ],
      [
        'La Peur (Fear)',
        'Elle vous pousse à vendre lorsque les prix baissent.',
        "Transformation d'une perte temporaire (sur papier) en une perte réelle.",
      ],
    ],
  },
  {
    type: 'section-title',
    text: '8.2.2 Les Biais Cognitifs les Plus Fréquents',
  },
  {
    type: 'paragraph',
    text: "Les biais sont des erreurs de jugement systématiques basées sur des raccourcis de pensée :",
  },
  {
    type: 'list',
    items: [
      "**Le Biais de Confirmation** : Chercher uniquement les nouvelles et analyses qui confortent votre choix d'investissement initial, ignorant les informations négatives ou contradictoires.",
      "**L'Ancrage** : Rester figé(e) sur le prix initial auquel vous avez acheté un titre (votre « point d'ancrage »). Cela vous empêche de vendre un titre perdant pour réinvestir dans une meilleure opportunité, car vous attendez qu'il remonte à votre prix d'achat.",
      "**L'Excès de Confiance** : Surestimer sa propre capacité à battre le marché ou à prédire les mouvements de prix futurs.",
    ],
  },

  // 8.3
  {
    type: 'section-title',
    text: '8.3 Les Antidotes : Discipline, Méthode et Routine',
  },
  {
    type: 'paragraph',
    text: "La seule façon de combattre vos émotions et vos biais cognitifs est la discipline.",
  },
  {
    type: 'section-title',
    text: "8.3.1 La 8ème Merveille du Monde : Les Intérêts Composés",
  },
  {
    type: 'paragraph',
    text: "C'est l'essence même de l'investissement à long terme. Les intérêts composés se produisent lorsque les gains générés par votre investissement sont réinvestis pour générer à leur tour de nouveaux gains. C'est l'argent qui travaille pour l'argent.",
  },
  {
    type: 'highlight',
    text: "Valeur Finale = Capital × (1 + Taux d'intérêt) ^ Nombre d'années",
  },
  {
    type: 'paragraph',
    text: "L'effet est exponentiel : plus vous commencez tôt et plus votre horizon est long, plus la courbe de votre richesse s'envole.",
  },
  {
    type: 'analogy',
    title: 'La Croissance du Jeune Baobab',
    text: "Un jeune baobab met du temps à grandir (les premières années sont lentes), mais une fois qu'il a établi ses racines, sa croissance accélère massivement chaque année. C'est le temps, pas l'effort initial, qui crée la majesté de l'arbre.",
  },
  {
    type: 'section-title',
    text: '8.3.2 Les 3 Erreurs Classiques du Débutant à Éviter',
  },
  {
    type: 'paragraph',
    text: "Définir une routine d'investissement vous permet d'éviter les erreurs basées sur l'émotion :",
  },
  {
    type: 'ordered-list',
    items: [
      "**Tenter de « Timer » le Marché** : Essayer de deviner le point le plus bas pour acheter ou le point le plus haut pour vendre. C'est de la spéculation, l'antithèse de l'investissement discipliné.",
      "**Manquer de Diversification** : Mettre tout son capital sur une seule action. La diversification réduit le risque et est essentielle (sujet du Module 14).",
      "**Vendre en Panique** : Réagir émotionnellement à une baisse de prix, détruisant ainsi la puissance du long terme et des intérêts composés.",
    ],
  },
  {
    type: 'section-title',
    text: "8.3.3 Les Grandes Stratégies d'Investissement",
  },
  {
    type: 'paragraph',
    text: "Adopter une stratégie claire vous aide à rester discipliné(e) et à prendre des décisions basées sur une méthode, et non sur l'émotion :",
  },
  {
    type: 'list',
    items: [
      "**Value Investing (Stratégie de Valeur)** : Acheter une entreprise qui se négocie en dessous de sa valeur intrinsèque réelle. C'est la philosophie de Ben Graham et Warren Buffett — acheter de « bonnes affaires ».",
      "**Growth Investing (Stratégie de Croissance)** : Acheter des entreprises qui croissent très rapidement, même si elles semblent chères. Le prix élevé est justifié par l'anticipation d'une croissance future forte.",
      "**Dividendes (Stratégie de Revenus)** : Choisir des entreprises matures (souvent des banques ou des télécoms à la BRVM) qui versent régulièrement une grande partie de leurs bénéfices.",
    ],
  },

  // 8.4
  {
    type: 'section-title',
    text: 'Bonus 8.4 La Psychologie des Investisseurs Face à la Volatilité',
  },
  {
    type: 'paragraph',
    text: "La volatilité est la norme, pas l'exception. La psychologie du gagnant consiste à transformer la volatilité en opportunité.",
  },
  {
    type: 'pull-quote',
    text: "Investors should remember that excitement and expenses are their enemies. And if they insist on trying to time their participation in equities, they should try to be fearful when others are greedy and greedy only when others are fearful.",
    author: 'Warren Buffett',
  },
  {
    type: 'paragraph',
    text: "En d'autres termes : lorsque le marché panique (la peur domine) et que les prix sont bas, c'est le moment d'acheter ; lorsque tout le monde s'emballe (l'avidité domine) et que les prix sont hauts, c'est le moment d'être prudent.",
  },

  // Glossaire
  {
    type: 'glossary',
    title: 'Les Termes à Maîtriser',
    items: [
      {
        term: 'Intérêts Composés',
        definition: 'Processus par lequel les gains générés sont réinvestis pour produire leurs propres gains.',
      },
      {
        term: 'Biais Cognitif',
        definition: "Erreur de jugement systématique basée sur des raccourcis de pensée ou des émotions.",
      },
      {
        term: 'Value Investing',
        definition: "Stratégie d'investissement consistant à acheter des titres que l'on considère comme sous-évalués par le marché.",
      },
      {
        term: 'Ancrage',
        definition: "Biais psychologique qui pousse un investisseur à rester focalisé sur le prix initial d'achat d'un titre.",
      },
    ],
  },

  // Conclusion
  {
    type: 'callout',
    variant: 'success',
    title: 'Prochaine Étape',
    text: "Vous avez maintenant la discipline et le mental. Il est temps de passer à l'outil le plus puissant de l'investisseur : l'analyse. 👉 Prochaine leçon : Module 9 — Analyse Fondamentale : Apprendre à choisir une entreprise solide.",
  },
];

async function run() {
  const module = await prisma.learningModule.findFirst({
    where: { order_index: 8 },
    select: { id: true, slug: true, title: true },
  });

  if (!module) {
    console.error('Module at order_index=8 not found');
    await prisma.$disconnect();
    return;
  }

  console.log(`Updating: [M8] ${module.slug} | ${module.title}`);

  await prisma.learningModule.update({
    where: { id: module.id },
    data: {
      title: 'Le Mental du Gagnant — Psychologie & Biais Comportementaux',
      content_json: JSON.stringify(blocks),
    },
  });

  console.log(`✅ Done — ${blocks.length} blocks written`);
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
