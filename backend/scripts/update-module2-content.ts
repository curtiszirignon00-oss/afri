/// <reference types="node" />
// backend/scripts/update-module2-content.ts
// Injecte le contenu complet du Module 2 : La BRVM en Chiffres

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONTENT = [
  {
    type: 'pull-quote',
    text: '« Ce n\'est pas parce qu\'une chose est difficile que nous n\'osons pas. C\'est parce que nous n\'osons pas qu\'elle nous semble difficile. » — <strong>Sénèque</strong>',
  },
  {
    type: 'objectives',
    title: '🎯 Objectif Pédagogique',
    subtitle: 'À la fin de ce module, vous serez capable de :',
    items: [
      'Comprendre en chiffres réels pourquoi la BRVM est l\'une des places boursières les plus dynamiques d\'Afrique.',
      'Mesurer le potentiel de croissance d\'un marché encore sous-exploité par 99,5 % de la population de l\'UEMOA.',
      'Comparer la BRVM aux alternatives d\'épargne disponibles localement pour prendre une décision éclairée.',
      'Identifier les risques réels du marché — sans angélisme ni catastrophisme.',
      'Comprendre pourquoi <strong>maintenant</strong> est un moment stratégique pour commencer à investir dans la zone UEMOA.',
    ],
  },

  // ── 2.1 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    color: 'blue',
    text: '2.1 — La trajectoire historique de la capitalisation boursière (marché actions)',
  },
  {
    type: 'table',
    caption: 'Capitalisation boursière de la BRVM — 1998 à 2026',
    headers: ['Année', 'Capitalisation boursière', 'Événement clé'],
    rows: [
      ['1998', '836 Mds FCFA', 'Lancement de la BRVM'],
      ['2008', '3 337 Mds FCFA', '×4 en 10 ans'],
      ['2012', '4 031 Mds FCFA', 'Premier cap symbolique dépassé'],
      ['2013', '5 001 Mds FCFA', '+24 % en 1 an'],
      ['2014', '6 024 Mds FCFA', '—'],
      ['2015', '7 035 Mds FCFA', '—'],
      ['2021', '6 085 Mds FCFA', 'Rebond post-Covid (+39,33 %)'],
      ['2023', '7 967 Mds FCFA', 'Cap des 8 000 Mds approché'],
      ['Août 2024', '9 000+ Mds FCFA', 'Premier franchissement des 9 000 Mds'],
      ['Déc. 2024', '10 059 Mds FCFA', 'Nouveau record historique'],
      ['2025', '13 331 Mds FCFA', '+32,27 % en un an'],
      ['Jan. 2026', '~14 069 Mds FCFA', 'Progression continue'],
    ],
  },
  {
    type: 'paragraph',
    text: '<em>Sources : BRVM officiel, Agence Ecofin, SenePlus — données vérifiées</em>',
  },
  {
    type: 'paragraph',
    text: 'En 26 ans, la BRVM a enregistré une progression de plus de <strong>1 103 %</strong> de sa capitalisation boursière, passée de 836 milliards FCFA en 1998 à plus de 10 000 milliards FCFA en décembre 2024.',
  },
  {
    type: 'paragraph',
    text: 'En incluant le marché obligataire, la capitalisation globale (actions + obligations) s\'établit à <strong>22 516 milliards FCFA</strong>, représentant environ 17 % du PIB de l\'UEMOA.',
  },
  {
    type: 'callout',
    variant: 'ok',
    title: '🎓 Ce que ça signifie pour vous',
    paragraphs: [
      'Si vous aviez investi 100 000 FCFA dans un portefeuille reflétant le marché en 1998, vous auriez aujourd\'hui plus de <strong>1 000 000 FCFA</strong> — sans avoir rien fait d\'autre qu\'attendre. La BRVM récompense la patience.',
    ],
  },

  // ── 2.2 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    color: 'green',
    text: '2.2 — Les Performances Récentes : Une Décennie de Croissance Constante',
  },
  {
    type: 'paragraph',
    text: 'La croissance de long terme est rassurante. Mais ce sont les chiffres récents qui montrent que le marché est en pleine accélération.',
  },
  {
    type: 'paragraph',
    text: 'En cinq ans, l\'indice BRVM Composite est passé de 145,37 points début 2021 à 345,75 points fin 2025, soit une hausse cumulée de <strong>99,15 %</strong> — quasiment un doublement de l\'indice.',
  },
  {
    type: 'table',
    caption: 'Performance annuelle de l\'indice BRVM Composite',
    headers: ['Année', 'Performance BRVM', 'Ce que ça signifie'],
    rows: [
      ['2021', '+39,33 %', 'Rebond post-Covid explosif'],
      ['2022', '+0,46 %', 'Consolidation dans un contexte mondial difficile'],
      ['2023', '+5,38 %', '3ème année positive consécutive'],
      ['2024', '+28,89 %', 'Une des meilleures performances africaines de l\'année'],
      ['2025', '+25,26 %', 'Nouveau sommet historique à 345,75 points'],
      ['<strong>Cumulé 2021–2025</strong>', '<strong>+99,15 %</strong>', '<strong>Quasi-doublement en 5 ans</strong>'],
    ],
  },
  {
    type: 'paragraph',
    text: '<em>Sources : BRVM officiel, APAnews, SenePlus — données vérifiées</em>',
  },
  {
    type: 'paragraph',
    text: 'Sur 20 ans, l\'indice BRVM Composite enregistre une progression moyenne annuelle de <strong>10 %</strong>. Sur 12 ans, la progression cumulée est de <strong>65,70 %</strong>. Sur 20 ans, elle atteint <strong>215,06 %</strong>.',
  },
  {
    type: 'callout',
    variant: 'warn',
    title: '⚠️ Mise en perspective honnête',
    paragraphs: [
      'Ces performances passées ne garantissent pas les performances futures. L\'année 2022 (+0,46 %) rappelle que le marché peut stagner. Mais sur 5 ans consécutifs, la BRVM a montré une résilience remarquable même face à la pandémie, aux crises géopolitiques et à l\'inflation mondiale.',
    ],
  },

  // ── 2.3 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    color: 'purple',
    text: '2.3 — L\'Opportunité la Plus Sous-Estimée : Seulement 0,5 % de la Population Investit',
  },
  {
    type: 'paragraph',
    text: 'C\'est le chiffre le plus révélateur de tout ce module. Pas le plus impressionnant en absolu — mais le plus important pour comprendre pourquoi investir sur la BRVM aujourd\'hui est une décision stratégique.',
  },
  {
    type: 'paragraph',
    text: 'Le nombre de comptes-titres ouverts sur la BRVM reste estimé à environ <strong>300 000 investisseurs actifs</strong>, soit environ <strong>0,5 %</strong> de la population totale de l\'Union, qui avoisine 130 millions d\'habitants.',
  },
  {
    type: 'table',
    caption: 'Comparaison du taux d\'investissement en bourse',
    headers: ['Indicateur', 'UEMOA (BRVM)', 'France', 'États-Unis'],
    rows: [
      ['Population', '~130 millions', '68 millions', '335 millions'],
      ['Investisseurs en bourse', '~300 000 (0,5 %)', '~7 millions (~10 %)', '~190 millions (~55 %)'],
      ['Comptes Mobile Money actifs', '60–70 millions (>50 %)', 'N/A', 'N/A'],
      ['Comptes bancaires actifs', '~54 millions (2024)', 'N/A', 'N/A'],
    ],
  },
  {
    type: 'analogy',
    title: '🪶 L\'analogie à retenir : la pirogue sur un lac vide',
    intro: 'Imaginez un lac poissonneux où 99 pêcheurs sur 100 ne pêchent pas encore.',
    items: [
      'Ceux qui ont déjà leur pirogue à l\'eau ont accès à des ressources abondantes sans concurrence.',
      'C\'est la situation exacte de la BRVM aujourd\'hui : le marché est grand, les entreprises sont solides, les dividendes sont généreux.',
      'Mais la grande majorité des habitants de l\'UEMOA n\'a pas encore sa pirogue à l\'eau.',
    ],
    conclusion: 'À mesure que la classe moyenne africaine s\'élargit et que l\'éducation financière progresse, le nombre d\'investisseurs va croître — tirant les cours et les valorisations vers le haut. Ceux qui sont déjà présents sur le marché quand cette masse arrive bénéficient de cette dynamique.',
  },

  // ── 2.4 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    color: 'orange',
    text: '2.4 — Les Entreprises qui Font la BRVM : Des Champions Régionaux Solides',
  },
  {
    type: 'paragraph',
    text: 'À fin 2024, la BRVM compte <strong>47 sociétés cotées</strong>. Ces entreprises ne sont pas des start-ups spéculatives — ce sont des acteurs établis de l\'économie régionale.',
  },
  {
    type: 'table',
    caption: 'Secteurs représentés et leurs rendements dividendes (exercice 2024)',
    headers: ['Secteur', 'Exemples de valeurs', 'Rendement Div. 2024', 'Caractéristique'],
    rows: [
      ['Télécommunications', 'SONATEL, ORANGE CI', '~6–8 %', 'Flux récurrents, forte visibilité'],
      ['Banques & Finance', 'ECOBANK CI, SGB-CI, BOA', '~5–7 %', 'Croissance de l\'inclusion financière'],
      ['Agro-industrie', 'PALM-CI, SAPH, SUCRIVOIRE', '~5–10 %', 'Matières premières, dividendes cycliques'],
      ['Distribution', 'CFAO CI, BERNABE', '~4–6 %', 'Classe moyenne en expansion'],
      ['Industrie', 'FILTISAC, SITAB', '~8–10 %', 'Champions locaux diversifiés'],
    ],
  },
  {
    type: 'callout',
    variant: 'info',
    title: '📊 Focus SONATEL : 20 ans de dividendes ininterrompus',
    paragraphs: [
      'SONATEL verse un dividende depuis plus de <strong>20 ans consécutifs</strong> — un record absolu à la BRVM. Le dividende 2025 s\'établit à <strong>1 655 FCFA</strong> par action, représentant un rendement net de <strong>5,71 %</strong> au cours actuel.',
      'Pour un investisseur qui achète à 29 000 FCFA : <strong>100 000 FCFA</strong> investis → <strong>5 750 FCFA/an</strong> | <strong>500 000 FCFA</strong> investis → <strong>28 135 FCFA/an</strong> | <strong>1 000 000 FCFA</strong> investis → <strong>56 270 FCFA/an</strong>.',
    ],
  },
  {
    type: 'callout',
    variant: 'ok',
    title: '📊 Exemple de rendement combiné (dividende + plus-value)',
    paragraphs: [
      'Un investisseur ayant acheté SONATEL à <strong>15 000 FCFA</strong> en 2015 et la revendant à <strong>29 000 FCFA</strong> en 2026 aurait :',
      '• Plus-value en capital : <strong>+93 %</strong> | Dividendes cumulés sur 11 ans : ≈ <strong>16 500 FCFA/action</strong> | Rendement total combiné : <strong>+200 %+</strong>.',
      'Avec <strong>150 000 FCFA</strong> investis en 2015, tu aurais récupéré <strong>455 000 FCFA</strong> en 2026 — un bénéfice de <strong>305 000 FCFA</strong> (plus du triple du capital initial).',
    ],
  },

  // ── 2.5 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    color: 'blue',
    text: '2.5 — Comparer la BRVM aux Autres Options d\'Épargne Disponibles',
  },
  {
    type: 'paragraph',
    text: 'Il ne s\'agit pas de vous convaincre à tout prix d\'investir en bourse. Il s\'agit de vous donner les éléments pour décider en connaissance de cause, en comparant les vraies alternatives disponibles dans l\'UEMOA.',
  },
  {
    type: 'table',
    caption: 'Comparaison des placements disponibles dans l\'UEMOA',
    headers: ['Placement', 'Rendement annuel estimé', 'Liquidité', 'Capital minimum', 'Risque'],
    rows: [
      ['Compte épargne bancaire', '1 à 3 %', 'Très haute', 'Faible', 'Très faible'],
      ['Bon du Trésor UEMOA', '5 à 7 %', 'Moyenne', '10 000 FCFA', 'Faible'],
      ['Immobilier locatif', '4 à 7 % brut', 'Très faible', '5–50 M FCFA', 'Moyen'],
      ['Tontine / épargne informelle', 'Variable, souvent 0 % réel', 'Faible', 'Variable', 'Moyen'],
      ['BRVM — dividendes seuls', '4 à 10 %', 'Moyenne', 'Faible', 'Moyen'],
      ['BRVM — dividendes + plus-values', 'Historiquement 10–15 % LT', 'Moyenne', 'Faible', 'Moyen-élevé'],
    ],
  },
  {
    type: 'callout',
    variant: 'info',
    title: '💡 La vraie comparaison',
    paragraphs: [
      'Un compte épargne à <strong>2 %</strong> sur 10 ans transforme <strong>500 000 FCFA</strong> en <strong>609 000 FCFA</strong>.',
      'Un portefeuille BRVM avec un rendement moyen de <strong>10 %</strong> sur 10 ans transforme ces mêmes <strong>500 000 FCFA</strong> en <strong>1 297 000 FCFA</strong>.',
      'La différence est de <strong>688 000 FCFA</strong> — plus que votre capital initial. C\'est le pouvoir des intérêts composés sur une durée longue.',
    ],
  },

  // ── 2.6 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    color: 'orange',
    text: '2.6 — Les Risques Réels : Ce qu\'on ne Vous Dit Pas Toujours',
  },
  {
    type: 'paragraph',
    text: 'Un module honnête doit vous parler des risques. La BRVM offre des opportunités réelles — mais ce n\'est pas un placement sans risque. Voici les <strong>4 risques principaux</strong> à connaître avant d\'investir.',
  },
  {
    type: 'callout',
    variant: 'warn',
    title: 'Risque 1 — La liquidité insuffisante sur certains titres',
    paragraphs: [
      'La liquidité du marché reste relativement faible comparée aux grandes bourses mondiales. Pour les petites valeurs (small caps), trouver un acheteur ou un vendeur rapidement peut être difficile. C\'est pourquoi le filtre liquidité est le premier filtre à appliquer (M5 et M16).',
    ],
  },
  {
    type: 'callout',
    variant: 'warn',
    title: 'Risque 2 — La concentration géographique',
    paragraphs: [
      'La Côte d\'Ivoire représente la majorité de la capitalisation boursière de la BRVM. Si l\'économie ivoirienne connaît un choc (politique, naturel, commercial), l\'ensemble du marché peut en pâtir. La diversification sectorielle (M12) est votre protection principale.',
    ],
  },
  {
    type: 'callout',
    variant: 'warn',
    title: 'Risque 3 — La volatilité de court terme',
    paragraphs: [
      'L\'année 2022 (+0,46 %) et certaines corrections passées montrent que le marché peut stagner ou reculer temporairement. Un investisseur qui a besoin de son argent dans 6 mois ne doit pas investir en bourse. La bourse est un placement de moyen-long terme (<strong>minimum 3 à 5 ans</strong>).',
    ],
  },
  {
    type: 'callout',
    variant: 'warn',
    title: 'Risque 4 — Le risque de gouvernance sur certaines valeurs',
    paragraphs: [
      'Toutes les entreprises cotées ne communiquent pas avec la même transparence. Certaines publient leurs résultats avec retard ou de façon incomplète. L\'analyse extra-financière (M9) vous apprend à identifier ces signaux d\'alerte avant d\'investir.',
    ],
  },

  // ── 2.7 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    color: 'purple',
    text: '2.7 — La Vision 2030 : Où Va la BRVM',
  },
  {
    type: 'paragraph',
    text: 'La BRVM a présenté sa vision Horizon 2030, axée sur :',
  },
  {
    type: 'list',
    items: [
      'La transformation technologique (intelligence artificielle, big data, blockchain)',
      'Le développement de nouveaux produits financiers (ETF et produits dérivés)',
      'Le renforcement de la finance durable et inclusive',
      'L\'approfondissement du marché pour le rendre plus liquide',
      'La promotion de l\'éducation boursière au sein de l\'UEMOA',
    ],
  },
  {
    type: 'paragraph',
    text: 'En 2025, <strong>4 204,7 milliards FCFA</strong> de ressources ont été mobilisés sur le marché financier régional — un niveau historique depuis la création du marché, dominé par les émissions obligataires souveraines.',
  },
  {
    type: 'highlight',
    text: 'Les États et les entreprises de l\'UEMOA financent de plus en plus leur développement via la BRVM. Chaque infrastructure construite, chaque banque recapitalisée, chaque entreprise qui s\'introduit en bourse renforce l\'écosystème dans lequel vous investissez. <strong>Vous n\'êtes pas spectateur de cette croissance — vous en êtes actionnaire.</strong>',
  },

  // ── 2.8 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    color: 'green',
    text: '2.8 — Résumé : Les 7 Chiffres à Retenir',
  },
  {
    type: 'key-stats',
    items: [
      { value: '+1 103 %', label: 'Croissance capitalisation 1998–2024' },
      { value: '+99,15 %', label: 'BRVM Composite cumulé 2021–2025' },
      { value: '47', label: 'Sociétés cotées à fin 2024' },
      { value: '0,5 %', label: 'Population UEMOA qui investit' },
      { value: '130 M', label: 'Habitants de l\'UEMOA' },
      { value: '5ème', label: 'Rang BRVM en Afrique' },
      { value: '+20 ans', label: 'Dividendes SONATEL ininterrompus' },
    ],
  },

  // ── 2.9 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    color: 'blue',
    text: '2.9 — Conclusion : Vous Êtes au Bon Endroit, au Bon Moment',
  },
  {
    type: 'paragraph',
    text: 'La BRVM n\'est pas parfaite. Elle est encore jeune, encore peu liquide sur certains segments, encore peu connue de la grande majorité des habitants de l\'UEMOA. Mais c\'est précisément pour ces raisons qu\'elle représente une opportunité. Les marchés matures comme Paris ou New York sont efficacement pricés — difficile d\'y trouver des valeurs sous-évaluées. La BRVM, avec sa pénétration de 0,5 %, offre encore des opportunités que les marchés développés n\'offrent plus.',
  },
  {
    type: 'pull-quote',
    text: '« Les grandes fortunes africaines de demain seront construites par ceux qui ont commencé à investir aujourd\'hui sur les marchés africains. »',
  },
  {
    type: 'paragraph',
    text: 'Ce que vous avez appris dans ce module vous donne une conviction fondée sur des faits. Les modules suivants vous donnent la méthode pour agir sur cette conviction avec rigueur et discipline.',
  },

  // ── Prochaines étapes ────────────────────────────────────────────────────
  {
    type: 'heading',
    level: 2,
    text: '🧭 Prochaines Étapes',
  },
  {
    type: 'list',
    items: [
      '<strong>Module 3 :</strong> Les Acteurs du Jeu — qui sont les SGI, l\'AMF-UMOA, le DC/BR, et quel rôle jouent-ils pour protéger vos investissements.',
      '<strong>Module 4 :</strong> Les Instruments Financiers — actions, obligations, OPCVM. Quels véhicules sont disponibles sur la BRVM et comment choisir.',
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: '📖 Pour aller plus loin dès maintenant',
    paragraphs: [
      'Visitez <strong>brvm.org</strong> et consultez la section « Statistiques du marché ».',
      'Regardez la capitalisation boursière d\'aujourd\'hui et comparez-la à ces chiffres historiques.',
      'Vous voyez maintenant ces données avec un regard d\'investisseur.',
    ],
  },
];

async function run() {
  try {
    const mod = await prisma.learningModule.findFirst({
      where: { slug: 'brvm-en-chiffres' },
      select: { id: true, title: true, order_index: true },
    });

    if (!mod) {
      console.error('❌ Module brvm-en-chiffres introuvable.');
      return;
    }

    console.log(`✅ Module trouvé : [${mod.order_index}] ${mod.title} (${mod.id})`);

    await prisma.learningModule.update({
      where: { id: mod.id },
      data: {
        content_json: JSON.stringify(CONTENT),
        duration_minutes: 25,
      },
    });

    console.log(`\n🎉 content_json mis à jour (${CONTENT.length} blocs).`);
    console.log('💡 Pense à vider le cache Redis pour que les changements soient visibles.');
  } catch (err) {
    console.error('❌ Erreur :', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

run();
