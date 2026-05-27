/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const CONTENT = [
  // ── Objectifs ─────────────────────────────────────────────────────────────
  {
    type: 'objectives',
    title: '🎯 Objectif Pédagogique du Module',
    subtitle: 'À la fin de ce module, vous serez capable de :',
    items: [
      'Définir précisément votre horizon de placement (court, moyen, long terme) en fonction de vos objectifs de vie.',
      'Comprendre comment le temps est le facteur clé pour gérer le risque (volatilité).',
      'Établir votre profil d\'investisseur (prudent, équilibré, dynamique) et déterminer l\'allocation d\'actifs cohérente avec ce profil.',
    ],
  },

  // ── 3.1 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    color: 'blue',
    text: '3.1 — Définir ses objectifs de vie et d\'investissement',
  },
  {
    type: 'paragraph',
    text: 'La bourse n\'est pas un jeu, c\'est un outil pour réaliser vos projets de vie. Avant de choisir un titre, vous devez vous connaître vous-même, et cela commence par définir la durée pendant laquelle vous pouvez vous passer de cet argent.',
  },
  {
    type: 'heading',
    level: 2,
    text: '3.1.1 — L\'Horizon de Placement : La Durée de l\'Engagement',
  },
  {
    type: 'paragraph',
    text: 'L\'horizon de placement est la période pendant laquelle vous prévoyez de garder votre investissement. Cette durée dicte le niveau de risque que vous pouvez vous permettre.',
  },
  {
    type: 'table',
    headers: ['Horizon', 'Durée', 'Objectif Typique', 'Allocation Recommandée'],
    rows: [
      ['Court Terme', 'Moins de 2 ans', 'Fonds d\'urgence, frais de scolarité dans 1 an', 'Minimal (Obligations, épargne sécurisée)'],
      ['Moyen Terme', '2 à 7 ans', 'Achat automobile, apport pour un projet', 'Modéré (Mélange Actions/Obligations)'],
      ['Long Terme', 'Plus de 7 ans', 'Retraite, héritage, indépendance financière', 'Idéal pour la croissance (Majorité Actions)'],
    ],
  },
  {
    type: 'callout',
    variant: 'info',
    title: '💡 Conseil d\'Expert',
    paragraphs: [
      'Chaque grand objectif de vie (retraite, études, achat maison) doit être traité comme un <strong>compte d\'investissement séparé</strong>, avec son propre horizon et sa propre stratégie.',
    ],
  },

  // ── 3.1.2 ─────────────────────────────────────────────────────────────────
  {
    type: 'heading',
    level: 2,
    text: '3.1.2 — Le Pouvoir du Temps : L\'Analogie du Car de Nuit',
  },
  {
    type: 'list',
    items: [
      '<strong>La Volatilité à Court Terme :</strong> À court terme, les marchés peuvent être erratiques (une crise, une mauvaise nouvelle fait chuter les prix). C\'est la volatilité.',
      '<strong>L\'Absorption du Risque :</strong> Historiquement, les marchés boursiers (régionaux et mondiaux) ont toujours eu une tendance haussière sur des décennies. Plus votre horizon de placement est long, moins cette volatilité ponctuelle compte.',
    ],
  },
  {
    type: 'analogy',
    title: '🚌 L\'Analogie à Retenir : Le Voyage en Car de Nuit',
    intro: 'Si vous regardez par la fenêtre d\'un car de nuit, le paysage semble flou et les lumières scintillent (la volatilité quotidienne). Vous ne voyez que les secousses.',
    items: [
      'Mais si vous vous concentrez sur l\'horloge et la destination finale (l\'objectif à long terme), vous savez que, malgré les cahots, vous arriverez à bon port.',
      'L\'investisseur à long terme se concentre sur <strong>la destination</strong>, pas sur les secousses.',
    ],
  },

  // ── 3.2 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    color: 'green',
    text: '3.2 — Lien entre horizon de temps et style d\'allocation',
  },
  {
    type: 'heading',
    level: 2,
    text: '3.2.1 — La Tolérance au Risque : Émotionnel et Financier',
  },
  {
    type: 'paragraph',
    text: 'Votre profil d\'investisseur est défini par votre tolérance au risque, qui est votre capacité :',
  },
  {
    type: 'list',
    items: [
      '<strong>Émotionnelle :</strong> À accepter psychologiquement une perte temporaire sur votre capital.',
      '<strong>Financière :</strong> À ne pas avoir besoin de cet argent en cas de baisse du marché.',
    ],
  },
  {
    type: 'pull-quote',
    text: '"If you aren\'t willing to own a stock for ten years, don\'t even think about owning it for ten minutes." — <strong>Warren Buffett</strong>',
  },

  // ── 3.2.2 ─────────────────────────────────────────────────────────────────
  {
    type: 'heading',
    level: 2,
    text: '3.2.2 — Les Trois Profils d\'Investisseur',
  },
  {
    type: 'paragraph',
    text: 'Votre profil vous aide à déterminer la répartition idéale entre les classes d\'actifs : les <strong>Actions</strong> (croissance, risque élevé) et les <strong>Obligations/Sécurité</strong> (sécurité, risque faible).',
  },
  {
    type: 'table',
    headers: ['Profil', 'Objectif Principal', 'Tolérance au Risque', 'Allocation d\'Actifs Typique'],
    rows: [
      [
        '<strong>Prudent</strong>',
        'Sécurité du capital, revenu stable',
        'Faible (Ne supporte pas une perte de 10 %)',
        'Majorité Obligations/OPCVM Prudent (ex : 80 % Obligations)',
      ],
      [
        '<strong>Équilibré</strong>',
        'Croissance modérée et revenu',
        'Moyenne (Accepte une perte temporaire de 15 %)',
        'Mixte Actions/Obligations (ex : 50 %/50 %)',
      ],
      [
        '<strong>Dynamique</strong>',
        'Maximisation de la croissance',
        'Élevée (Se concentre sur le potentiel, tolère 30 % de perte)',
        'Majorité Actions (ex : 80 % et plus d\'Actions)',
      ],
    ],
  },
  {
    type: 'callout',
    variant: 'ok',
    title: '📌 Exemple Concret',
    paragraphs: [
      'Un <strong>Mamadou de 25 ans</strong> qui économise pour sa retraite est un investisseur <strong>dynamique</strong>, car il peut se permettre de prendre des risques sur 40 ans.',
      'Un <strong>Mamadou de 55 ans</strong> économisant pour l\'achat d\'une maison dans 3 ans sera <strong>prudent</strong>.',
    ],
  },

  // ── 3.3 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    color: 'purple',
    text: '3.3 — Auto-évaluation du profil de risque (Exercice Pratique)',
  },
  {
    type: 'paragraph',
    text: 'Pour être un bon investisseur, vous devez être honnête avec vous-même. Cette section propose une méthode pour vous auto-évaluer.',
  },
  {
    type: 'heading',
    level: 2,
    text: '3.3.1 — Synthèse de la Stratégie',
  },
  {
    type: 'paragraph',
    text: 'Aligner votre horizon temporel avec votre allocation d\'actifs est la première étape vers une stratégie d\'investissement réussie.',
  },
  {
    type: 'table',
    headers: ['Objectif de Vie (Poche)', 'Horizon', 'Profil', 'Allocation d\'Actifs', 'Titres à Privilégier (BRVM)'],
    rows: [
      ['Fonds d\'Urgence', '< 1 an', 'Sécurité', '100 % Liquide / Épargne', 'Hors Bourse (Banque)'],
      ['Études des enfants', '10–15 ans', 'Dynamique/Équilibré', '60 % Actions BRVM / 40 % Obligations', 'Actions régionales solides (Sonatel, Ecobank…)'],
      ['Retraite', '20 ans et +', 'Dynamique', '80 % Actions BRVM / 20 % Obligations', 'Actions à fort potentiel de croissance'],
    ],
  },

  // ── Glossaire ─────────────────────────────────────────────────────────────
  {
    type: 'glossary',
    items: [
      {
        term: 'Horizon de Placement',
        definition: 'La durée pendant laquelle l\'investisseur prévoit de détenir l\'actif.',
      },
      {
        term: 'Volatilité',
        definition: 'L\'intensité et la fréquence des variations de prix d\'un titre.',
      },
      {
        term: 'Tolérance au Risque',
        definition: 'La capacité (émotionnelle et financière) à accepter des pertes sur son capital.',
      },
      {
        term: 'Allocation d\'Actifs',
        definition: 'La répartition de votre capital entre différentes classes d\'actifs (ex : actions, obligations, liquidités).',
      },
    ],
  },

  // ── Prochaine étape ───────────────────────────────────────────────────────
  {
    type: 'callout',
    variant: 'note',
    title: '🧭 Prochaine Étape',
    paragraphs: [
      'Félicitations ! Vous savez désormais que le temps est votre plus grand atout en bourse et vous avez une méthode claire pour définir votre profil et votre stratégie d\'allocation.',
      '👉 Prochaine leçon : Module 4 — Les Acteurs du Jeu – Qui fait quoi sur le marché ?',
    ],
  },
];

async function run() {
  try {
    const mod = await prisma.learningModule.findFirst({
      where: { slug: 'mental-du-gagnant' },
      select: { id: true, order_index: true, title: true },
    });

    if (!mod) { console.error('❌ Module mental-du-gagnant introuvable'); return; }
    console.log(`✅ Module trouvé : [${mod.order_index}] ${mod.title}`);

    await prisma.learningModule.update({
      where: { id: mod.id },
      data: {
        title: 'Le Temps, Votre Meilleur Allié — Définir ses Objectifs et son Horizon',
        content_json: JSON.stringify(CONTENT),
        duration_minutes: 20,
      },
    });

    console.log(`🎉 Module 3 mis à jour (${CONTENT.length} blocs).`);
    console.log('💡 Vide le cache Redis pour voir les changements.');
  } catch (err) {
    console.error('❌ Erreur :', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

run();
