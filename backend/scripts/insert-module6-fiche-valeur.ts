import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const blocks = [
  // ── Intro ──────────────────────────────────────────────────────────────────
  {
    type: 'pull-quote',
    text: '« Un investisseur qui ne comprend pas ce qu\'il lit est comme un conducteur qui ignore les panneaux de signalisation. Il avance — mais pas en sécurité. »',
  },
  {
    type: 'objectives',
    title: '🎯 Objectifs Pédagogiques',
    subtitle: 'À la fin de ce module, vous serez capable de :',
    items: [
      'Lire et décrypter chaque donnée d\'une fiche valeur sur la plateforme AfriBourse sans rester bloqué sur un chiffre inconnu',
      'Comprendre les 4 blocs d\'information d\'une fiche valeur : informations clés, ratios de valorisation, données financières, historique',
      'Interpréter un graphique de cours avec ses filtres de temps et ses différents types d\'affichage',
      'Utiliser les indices BRVM Composite et BRVM 10 comme référence de contexte pour vos décisions',
      'Identifier en 5 minutes si un titre mérite une analyse approfondie ou si vous passez au suivant',
    ],
  },

  // ── 6.1 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '6.1 — Pourquoi Savoir Lire le Marché Avant d\'Investir',
    color: 'blue',
  },
  {
    type: 'paragraph',
    text: 'Imaginez entrer dans un grand marché pour acheter de la marchandise dont vous ne lisez pas les étiquettes, dont vous ne comprenez pas les prix affichés et dont vous ignorez la qualité. C\'est exactement la situation d\'un investisseur qui ouvre une fiche valeur sans en comprendre les données. La plateforme AfriBourse concentre sur une seule page toutes les informations dont vous avez besoin pour juger un titre.',
  },
  {
    type: 'analogy',
    title: '🪶 L\'analogie à retenir : le bulletin de santé',
    intro: 'Une fiche valeur, c\'est le bulletin de santé complet d\'une entreprise cotée.',
    items: [
      '<strong>Informations vitales :</strong> le cours, le volume — les signes vitaux du jour',
      '<strong>Antécédents :</strong> l\'historique financier sur 5 ans',
      '<strong>Indicateurs de forme :</strong> les ratios de rentabilité',
      '<strong>Signes vitaux du jour :</strong> la variation, le volume échangé',
    ],
    conclusion: 'Le médecin lit tout ça en quelques minutes — vous allez apprendre à faire pareil.',
  },

  // ── 6.2 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '6.2 — L\'En-Tête de la Fiche : Le Premier Coup d\'Œil',
    color: 'green',
  },
  {
    type: 'callout',
    variant: 'info',
    title: '📱 Sur AfriBourse — En-tête SDSC',
    paragraphs: [
      'Code : <strong>SDSC</strong> | Secteur : Industriels | Nom : AFRICA GLOBAL LOGISTICS | Prix actuel : 1 700 FCFA | Variation : +0,00 % | Onglets : Vue d\'ensemble / Analyse / Fondamentaux / Actualités',
    ],
  },
  {
    type: 'table',
    caption: 'Les éléments de l\'en-tête et leur signification',
    headers: ['Élément', 'Ce que c\'est', 'Ce que ça vous dit'],
    rows: [
      ['Le code (ticker)', 'L\'identifiant unique du titre. Ex : SDSC, SNTS, SIVC', 'Code utilisé pour passer un ordre à votre SGI ou rechercher le titre'],
      ['Le secteur', 'La catégorie d\'activité. Ex : Industriels, Télécoms, Finance', 'Premier indicateur de diversification — évitez trop de titres du même secteur'],
      ['Le nom complet', 'La raison sociale complète de l\'entreprise', 'Vérifiez que le titre correspond bien à l\'entreprise analysée'],
      ['Le prix actuel', 'Le cours au dernier fixing BRVM', 'Prix auquel vous pourriez acheter ou vendre aujourd\'hui'],
      ['La variation (%)', 'L\'évolution depuis l\'ouverture de la séance', '+0,00 % = aucune transaction n\'a modifié le cours depuis l\'ouverture'],
    ],
  },
  {
    type: 'section-title',
    text: '📑 Les 4 Onglets de la Fiche Valeur',
    color: 'purple',
  },
  {
    type: 'ordered-list',
    items: [
      '<strong>Vue d\'ensemble</strong> — Le point d\'entrée. Informations clés, graphique, performance. Votre premier regard sur le titre.',
      '<strong>Analyse</strong> — Le graphique avancé avec indicateurs techniques (Module 10). Pour les investisseurs qui utilisent l\'analyse technique.',
      '<strong>Fondamentaux</strong> — Les données financières profondes : ratios, historique, actionnariat. C\'est ici que vous vérifiez la santé de l\'entreprise (Module 7).',
      '<strong>Actualités</strong> — Les dernières nouvelles publiées sur l\'entreprise. Communiqués, résultats, dividendes annoncés.',
    ],
  },
  {
    type: 'highlight',
    text: '💡 <strong>Ordre de lecture recommandé pour un débutant :</strong> Vue d\'ensemble → Fondamentaux → Actualités. L\'onglet Analyse vient en dernier, une fois que vous maîtrisez les bases.',
  },

  // ── 6.3 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '6.3 — Le Bloc « Informations Clés » : Les Données Vitales du Jour',
    color: 'orange',
  },
  {
    type: 'key-stats',
    items: [
      { label: 'Prix d\'ouverture', value: '1 700 FCFA' },
      { label: 'Volume (SDSC)', value: '2 957' },
      { label: 'Plus Haut 52s', value: '2 325 FCFA' },
      { label: 'Plus Bas 52s', value: '1 345 FCFA' },
    ],
  },
  {
    type: 'section-title',
    text: '6.3.1 — Décrypter chaque donnée',
    color: 'blue',
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Le Prix d\'Ouverture',
    paragraphs: [
      'C\'est le cours auquel le titre a été coté lors du premier fixing de la séance. Sur la BRVM, il n\'y a pas de "cloche d\'ouverture" à la seconde près — le prix d\'ouverture est celui du premier fixing de la journée.',
      '<strong>Sur SDSC :</strong> 1 700 FCFA = même cours qu\'au fixing précédent. Le marché n\'a pas bougé.',
    ],
  },
  {
    type: 'callout',
    variant: 'warn',
    title: '⚠️ Le Prix Actuel — Attention au fixing BRVM',
    paragraphs: [
      'Le cours au dernier fixing exécuté. C\'est le prix de référence pour tous vos calculs : Dividend Yield, PER, plus-value latente.',
      '<strong>Important :</strong> Sur la BRVM, "prix actuel" signifie "prix au dernier fixing" — pas le prix en temps réel comme sur les marchés en continu. Entre deux fixings, le prix affiché ne change pas.',
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Le Volume — Votre indicateur de liquidité',
    paragraphs: [
      'Le nombre d\'actions échangées lors de la dernière séance. C\'est votre indicateur de liquidité le plus immédiat.',
      '<strong>Sur SDSC :</strong> 2 957 actions échangées. C\'est relativement faible — SDSC est une valeur peu liquide. Avec 500 000 FCFA, vous représenteriez une part significative du volume quotidien total.',
    ],
  },
  {
    type: 'table',
    caption: 'Interprétation du volume quotidien',
    headers: ['Volume quotidien', 'Interprétation', 'Pour un débutant'],
    rows: [
      ['< 1 000 actions/jour', 'Très faible liquidité', '⚠️ Éviter — risque de ne pas trouver de contrepartie'],
      ['1 000 à 10 000 actions/jour', 'Liquidité modérée', 'Possible si votre ordre est petit'],
      ['10 000 à 100 000 actions/jour', 'Bonne liquidité', 'Confortable pour la plupart des investisseurs'],
      ['> 100 000 actions/jour', 'Très haute liquidité (Blue Chips)', '✅ Idéal — SONATEL, ECOBANK CI, ORANGE CI'],
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'La Capitalisation Boursière',
    paragraphs: [
      '<strong>Capitalisation = Prix de l\'action × Nombre total d\'actions en circulation</strong>',
      '<strong>Sur SDSC :</strong> 14,97 Mds FCFA ≈ 15 milliards de FCFA. Taille moyenne sur la BRVM.',
    ],
  },
  {
    type: 'table',
    caption: 'Catégories de capitalisation',
    headers: ['Capitalisation', 'Catégorie', 'Caractéristique'],
    rows: [
      ['> 500 Mds FCFA', 'Large Cap (Blue Chip)', 'Très liquide, stable, dividendes réguliers. Ex : SONATEL'],
      ['50 à 500 Mds FCFA', 'Mid Cap', 'Bon équilibre liquidité/croissance'],
      ['< 50 Mds FCFA', 'Small Cap', 'Potentiel élevé mais liquidité faible. Réservée aux investisseurs expérimentés'],
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Le Plus Haut / Plus Bas 52 semaines',
    paragraphs: [
      'Les cours extrêmes atteints sur les 12 derniers mois. L\'une des données les plus utiles pour contextualiser le prix actuel.',
      '<strong>Sur SDSC :</strong> Plus Haut 52s = 2 325 FCFA | Plus Bas 52s = 1 345 FCFA | Prix actuel = 1 700 FCFA',
    ],
  },
  {
    type: 'highlight',
    text: '<strong>Position dans la fourchette</strong> = (Prix actuel − Plus Bas 52s) ÷ (Plus Haut 52s − Plus Bas 52s) × 100<br>Sur SDSC : (1 700 − 1 345) ÷ (2 325 − 1 345) × 100 = <strong>36 %</strong> — plus proche de son plus bas. Ni une conclusion d\'achat ni de vente — c\'est un <em>contexte</em> à approfondir.',
  },

  // ── 6.4 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '6.4 — Le Bloc « Ratios de Valorisation » : Le Prix par Rapport à la Valeur',
    color: 'blue',
  },
  {
    type: 'key-stats',
    items: [
      { label: 'P/E Ratio (SDSC)', value: '3,81' },
      { label: 'BPA (EPS)', value: '387 F' },
      { label: 'Rendement Div.', value: '5,00 %' },
      { label: 'Actions en circ.', value: '54 435 300' },
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Le P/E Ratio (Price-to-Earnings — aussi appelé PER)',
    paragraphs: [
      '<strong>P/E Ratio = Prix de l\'action ÷ Bénéfice Net Par Action (BPA)</strong>',
      'Sur SDSC : 1 700 ÷ 387 = <strong>3,81</strong>. Vous payez 3,81 fois le bénéfice annuel. Si les bénéfices restent constants, l\'entreprise "rembourse" votre investissement en 3,81 ans.',
    ],
  },
  {
    type: 'table',
    caption: 'Interprétation du P/E Ratio sur la BRVM',
    headers: ['P/E Ratio', 'Interprétation sur la BRVM'],
    rows: [
      ['< 5', 'Très faible — action potentiellement sous-évaluée OU secteur en difficulté. Cherchez pourquoi.'],
      ['5 à 15', 'Zone raisonnable — valorisation normale pour la BRVM'],
      ['15 à 25', 'Élevé — le marché anticipe une forte croissance future'],
      ['> 25', 'Très élevé — attention à la surévaluation'],
    ],
  },
  {
    type: 'highlight',
    text: '🔍 <strong>Sur SDSC :</strong> P/E = 3,81 — très bas. Semble bon marché. Mais pourquoi ? Le cours a chuté de 2 325 à 1 700 FCFA. Le marché anticipe peut-être des difficultés futures. <strong>Un P/E bas n\'est pas automatiquement une bonne nouvelle.</strong>',
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Le P/B Ratio (Price-to-Book)',
    paragraphs: [
      'Compare le prix de marché à la valeur comptable de l\'entreprise (ce qu\'elle vaut "sur le papier" selon son bilan).',
      '<strong>P/B Ratio = Prix de l\'action ÷ Valeur comptable par action</strong>',
      '<strong>Sur SDSC :</strong> N/A — fréquent sur la BRVM où certaines entreprises ne publient pas toutes leurs données. Ne bloquez pas sur un N/A — passez aux autres indicateurs disponibles.',
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Le BPA — Bénéfice Net Par Action (EPS)',
    paragraphs: [
      '<strong>BPA = Bénéfice Net Total ÷ Nombre d\'actions en circulation</strong>',
      '<strong>Sur SDSC :</strong> BPA = 387 FCFA. Chaque action génère 387 FCFA de bénéfice par an. Achetée à 1 700 FCFA, vous payez 4,39 fois le bénéfice annuel.',
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Le Rendement du Dividende',
    paragraphs: [
      '<strong>Sur SDSC :</strong> 5,00 %. Pour chaque action achetée à 1 700 FCFA, vous recevez <strong>85 FCFA de dividende annuel</strong> (1 700 × 5 % = 85 FCFA). Rendement attractif.',
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Les Actions en Circulation',
    paragraphs: [
      '<strong>Sur SDSC :</strong> 54 435 300 actions × 1 700 FCFA = ~92 Mds FCFA de capitalisation boursière. Vérification de cohérence utile.',
    ],
  },

  // ── 6.5 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '6.5 — Le Bloc « Ratios de Rentabilité » : La Santé Opérationnelle',
    color: 'green',
  },
  {
    type: 'key-stats',
    items: [
      { label: 'ROE (SDSC)', value: '193,52 %' },
      { label: 'ROA', value: '41,78 %' },
      { label: 'Marge bénéf.', value: '24,60 %' },
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Le ROE — Return on Equity (Rentabilité des Capitaux Propres)',
    paragraphs: [
      '<strong>ROE = Bénéfice Net ÷ Capitaux Propres × 100</strong>',
      '<strong>Sur SDSC :</strong> 193,52 %. Exceptionnellement élevé — l\'entreprise génère presque 2 FCFA de bénéfice pour chaque 1 FCFA de capital propre. Un ROE aussi élevé peut signifier une rentabilité extraordinaire <em>ou</em> un niveau d\'endettement très important qui "gonfle" artificiellement le ROE. À investiguer.',
    ],
  },
  {
    type: 'table',
    caption: 'Interprétation du ROE',
    headers: ['ROE', 'Interprétation'],
    rows: [
      ['< 10 %', 'Faible — l\'entreprise peine à valoriser ses capitaux'],
      ['10 % à 20 %', 'Correct — performance standard'],
      ['20 % à 40 %', 'Bon — entreprise bien gérée'],
      ['> 40 %', 'Excellent OU structure financière particulière à analyser'],
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Le ROA — Return on Assets (Rentabilité des Actifs)',
    paragraphs: [
      'Mesure l\'efficacité de l\'entreprise à utiliser l\'ensemble de ses actifs (pas seulement les capitaux propres).',
      '<strong>Sur SDSC :</strong> ROA = 41,78 % — très élevé. L\'entreprise est très efficace dans l\'utilisation de ses actifs.',
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'La Marge Bénéficiaire',
    paragraphs: [
      '<strong>Marge bénéficiaire = Bénéfice Net ÷ Chiffre d\'Affaires × 100</strong>',
      '<strong>Sur SDSC :</strong> 24,60 %. Pour chaque 100 FCFA de ventes, l\'entreprise garde 24,60 FCFA en bénéfice net. Marge solide pour le secteur logistique.',
    ],
  },

  // ── 6.6 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '6.6 — Le Bloc « Données Financières et Historique » : Voir dans le Temps',
    color: 'purple',
  },
  {
    type: 'table',
    caption: 'Historique Financier SDSC — 3 ans',
    headers: ['Année', 'CA (FCFA)', 'Croissance CA', 'RN (FCFA)', 'Croissance RN', 'BNPA', 'PER', 'Dividende'],
    rows: [
      ['2024', '85 643 M', '+3,66 %', '21 069 M', '+22,94 %', '387', '3,81', '92'],
      ['2023', '82 623 M', '−5,03 %', '17 138 M', '+70,63 %', '315', '4,68', '92'],
      ['2022', '86 997 M', '−1,94 %', '10 044 M', '−27,96 %', '184,51', '7,99', '82,80'],
    ],
  },
  {
    type: 'section-title',
    text: '6.6.1 — Comment lire l\'historique financier',
    color: 'blue',
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Le Chiffre d\'Affaires (CA)',
    paragraphs: [
      'Le total des ventes sur l\'année — mesure de l\'activité commerciale brute.',
      '<strong>Sur SDSC :</strong> CA oscillant entre 83 et 87 Mds FCFA sur 3 ans — stable. Pas de forte croissance, mais pas d\'effondrement. Une entreprise mature dans un secteur stable.',
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Le Résultat Net (RN)',
    paragraphs: [
      'Le bénéfice effectif après toutes les charges, impôts et intérêts. C\'est <strong>"ce qui reste vraiment"</strong> à l\'actionnaire.',
      '<strong>Sur SDSC :</strong> Le RN a plus que doublé en 3 ans (10 044 M → 21 069 M en 2024). Croissance très forte du bénéfice malgré un CA quasi-stable — signe d\'une amélioration majeure de l\'efficacité opérationnelle.',
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Le BNPA dans le temps',
    paragraphs: [
      '<strong>Sur SDSC :</strong> 184 FCFA (2022) → 387 FCFA (2024). Le bénéfice par action a plus que doublé en 2 ans. C\'est ce qui explique pourquoi le PER est si bas aujourd\'hui : les bénéfices ont explosé pendant que le cours baissait.',
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Le PER historique — lire la tendance de valorisation',
    paragraphs: [
      '<strong>Sur SDSC :</strong> PER 2022 = 7,99 | PER 2023 = 4,68 | PER 2024 = 3,81. Le PER ne cesse de baisser — le cours recule alors que les bénéfices montent. Signal potentiellement très intéressant pour un investisseur <em>value</em>.',
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Le Dividende historique',
    paragraphs: [
      '<strong>Sur SDSC :</strong> 82,80 FCFA (2022) → 92 FCFA (2023 et 2024). Dividende stable et légèrement croissant. Avec un cours à 1 700 FCFA : <strong>yield = 92 ÷ 1 700 × 100 = 5,41 %</strong>.',
    ],
  },
  {
    type: 'callout',
    variant: 'ok',
    title: '🎓 À retenir — Lire l\'historique en 3 questions',
    paragraphs: [
      '<strong>1. Le CA croît-il ?</strong> Un CA en croissance régulière est signe de bonne santé commerciale.',
      '<strong>2. Le RN croît-il PLUS vite que le CA ?</strong> Si oui, l\'entreprise améliore sa rentabilité — les marges s\'améliorent.',
      '<strong>3. Le dividende est-il stable ou croissant ?</strong> Un dividende régulier prouve que l\'entreprise génère du cash réel, pas seulement des bénéfices comptables.',
    ],
  },

  // ── 6.7 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '6.7 — La Structure de l\'Actionnariat : Qui Possède l\'Entreprise ?',
    color: 'orange',
  },
  {
    type: 'paragraph',
    text: 'L\'actionnariat vous dit qui <strong>contrôle réellement</strong> l\'entreprise. C\'est une information de gouvernance essentielle.',
  },
  {
    type: 'table',
    caption: 'Configurations d\'actionnariat et leur interprétation',
    headers: ['Configuration', 'Interprétation'],
    rows: [
      ['Un actionnaire > 50 %', 'Actionnaire majoritaire de contrôle — décisions concentrées. Peut être un État, un groupe industriel.'],
      ['Actionnaires dispersés (< 30 % chacun)', 'Capital dilué — management plus indépendant, mais risque de prise de contrôle hostile'],
      ['Float élevé (> 40 % en bourse)', 'Bonne liquidité potentielle — beaucoup d\'actions accessibles au marché'],
    ],
  },
  {
    type: 'highlight',
    text: '<strong>Sur SDSC :</strong> Structure à 3 blocs (44,3 % / 35,6 % / 20,1 %). Le premier bloc est dominant mais pas majoritaire à lui seul. Structure équilibrée.',
  },

  // ── 6.8 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '6.8 — Le Graphique de Cours : Lire la Mémoire du Marché',
    color: 'blue',
  },
  {
    type: 'callout',
    variant: 'info',
    title: '📱 Sur AfriBourse — Graphique SDSC',
    paragraphs: [
      'Filtres : 1H | 1J | 5J | 1M | 3M | 6M | 1A | Types : Chandeliers / Aires / Ligne / Barres | Outils : Indicateurs / Multi-TF / Dessiner / Partager',
    ],
  },
  {
    type: 'section-title',
    text: '6.8.1 — Les filtres de temps',
    color: 'green',
  },
  {
    type: 'table',
    caption: 'Filtres de temps et quand les utiliser',
    headers: ['Filtre', 'Ce qu\'il montre', 'Quand l\'utiliser'],
    rows: [
      ['1J', 'Chaque bougie = 1 jour de cotation', 'Vue de travail standard — tendances récentes'],
      ['5J', 'La semaine en cours', 'Contexte très court terme'],
      ['1M', 'Le mois en cours', 'Tendances de moyen terme'],
      ['3M / 6M', 'Tendance de moyen terme', 'Identifier si le titre est en tendance haussière ou baissière'],
      ['1A', 'L\'année complète', 'Vue d\'ensemble — voir le Plus Haut et Plus Bas 52 semaines en contexte'],
    ],
  },
  {
    type: 'highlight',
    text: '📊 <strong>Sur SDSC (graphique 1A) :</strong> Forte montée de juillet 2025 à mars 2026 (~1 400 → 2 325 FCFA), puis chute brutale jusqu\'à 1 700 FCFA en mai 2026. Cette configuration "montée forte puis rechute" mérite une investigation dans les Actualités.',
  },
  {
    type: 'section-title',
    text: '6.8.2 — Les types de graphiques',
    color: 'purple',
  },
  {
    type: 'list',
    items: [
      '<strong>Chandeliers japonais (recommandé)</strong> — Chaque bougie représente une séance. Corps = ouverture/clôture. Mèches = extremes. Bougie verte = hausse, rouge = baisse.',
      '<strong>Ligne</strong> — Relie les cours de clôture. Simple à lire — recommandé pour voir la tendance générale.',
      '<strong>Aires</strong> — Similaire à la ligne avec une surface colorée. Visuellement lisible pour comparer des périodes.',
      '<strong>Barres</strong> — Similaire aux chandeliers en présentation verticale. Moins intuitif pour les débutants.',
    ],
  },
  {
    type: 'highlight',
    text: '💡 <strong>Recommandation débutant :</strong> Commencez par le graphique <strong>Ligne sur 1A</strong>. C\'est la vision la plus claire de la trajectoire annuelle du titre. Passez aux chandeliers quand vous abordez l\'analyse technique (Module 10).',
  },

  // ── 6.9 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '6.9 — La Section « À Propos » : Comprendre le Métier',
    color: 'green',
  },
  {
    type: 'paragraph',
    text: 'Cette section répond à la question la plus fondamentale : <strong>dans quel business l\'entreprise est-elle ?</strong> Avant d\'analyser le moindre ratio, vous devez comprendre comment l\'entreprise gagne de l\'argent. Un investisseur qui achète une action sans comprendre le modèle économique n\'investit pas — il spécule.',
  },
  {
    type: 'ordered-list',
    items: [
      '<strong>L\'industrie et le secteur</strong> — pour la diversification et la comparaison sectorielle',
      '<strong>Le siège social</strong> — utile pour comprendre l\'exposition géographique réelle',
      '<strong>Le PDG/DG</strong> — un changement de direction est souvent un signal important (positif ou négatif)',
      '<strong>La description du métier</strong> — lisez-la vraiment. Si vous ne comprenez pas comment l\'entreprise gagne de l\'argent, n\'investissez pas.',
    ],
  },

  // ── 6.10 ──────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '6.10 — Méthode de Lecture Rapide : Analyser une Fiche en 10 Minutes',
    color: 'purple',
  },
  {
    type: 'ordered-list',
    items: [
      '<strong>L\'identité (30 sec)</strong> — Code, nom, secteur. Je sais ce que fait cette entreprise ? → Si non : lire "À propos" immédiatement.',
      '<strong>Le prix en contexte (1 min)</strong> — Prix actuel vs Plus Haut 52s vs Plus Bas 52s. Où se situe le titre dans sa fourchette annuelle ?',
      '<strong>La liquidité (30 sec)</strong> — Volume quotidien. Puis-je entrer et sortir facilement ? → Si < 1 000 actions/jour : passer au titre suivant.',
      '<strong>Le prix par rapport à la valeur (2 min)</strong> — P/E Ratio, BPA, Rendement Dividende. P/E raisonnable (< 15) ? Dividende attractif (> 4 %) ?',
      '<strong>La santé de l\'entreprise (3 min)</strong> — ROE, Marge bénéficiaire, Historique sur 3 ans. CA et RN en croissance ? Dividende stable ou croissant ?',
      '<strong>Le graphique (2 min)</strong> — Graphique Ligne sur 1A. Tendance haussière ou baissière ? Événement récent qui explique un mouvement fort ?',
      '<strong>La décision (1 min)</strong> — Ce titre passe-t-il mes filtres ? Liquidité ✓ / Fondamentaux ✓ / Dividende ✓ / Valorisation ✓ → Shortlist. Sinon → suivant.',
    ],
  },

  // ── 6.11 ──────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '6.11 — Application Pratique : Lire la Fiche SDSC en 10 Minutes',
    color: 'orange',
  },
  {
    type: 'table',
    caption: 'Analyse SDSC — méthode étape par étape',
    headers: ['Étape', 'Données SDSC', 'Verdict'],
    rows: [
      ['Identité', 'Africa Global Logistics — Transport & Logistique, Côte d\'Ivoire', '✅ Métier compréhensible'],
      ['Prix en contexte', '1 700 FCFA — à 36 % de la fourchette, plus proche du bas (1 345) que du haut (2 325)', '🟡 Intéressant — chercher pourquoi le cours a chuté'],
      ['Liquidité', 'Volume : 2 957 actions/jour', '⚠️ Faible — Small Cap à traiter avec prudence'],
      ['Valorisation', 'P/E = 3,81 (très bas) — Dividende yield = 5 %', '✅ Prix attractif si les bénéfices se maintiennent'],
      ['Santé financière', 'CA stable, RN doublé en 2 ans, BNPA 387 FCFA, dividende stable à 92 FCFA', '✅ Fondamentaux solides et en amélioration'],
      ['Graphique', 'Forte hausse juil. 2025 → mars 2026, puis rechute −27 %', '🟡 Correction importante — lire les Actualités'],
      ['Décision', 'Liquidité faible = contrainte majeure pour un petit portefeuille', '⚠️ Intéressant pour analyse avancée — pas idéal pour un débutant. À surveiller en Watchlist.'],
    ],
  },
  {
    type: 'highlight',
    text: '🎓 <strong>À retenir :</strong> SDSC présente des fondamentaux en amélioration et une valorisation attractive (P/E bas, dividende solide). Mais sa <strong>faible liquidité</strong> la rend difficile à manier pour un portefeuille débutant. Elle mérite une place dans la <strong>Watchlist</strong>, pas dans le portefeuille initial.',
  },

  // ── 6.12 ──────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '6.12 — Les Indices BRVM : Votre Thermomètre du Marché',
    color: 'blue',
  },
  {
    type: 'callout',
    variant: 'info',
    title: 'Le BRVM Composite',
    paragraphs: [
      'Regroupe <strong>toutes les sociétés cotées</strong> sur la BRVM. C\'est le baromètre général du marché. Quand il monte, le marché est globalement haussier. Quand il baisse, la tendance générale est négative.',
    ],
  },
  {
    type: 'callout',
    variant: 'info',
    title: 'Le BRVM 10',
    paragraphs: [
      'Regroupe les <strong>10 valeurs les plus liquides et les plus capitalisées</strong>. C\'est le référentiel des Blue Chips. Si vous construisez un portefeuille de grandes valeurs, c\'est le BRVM 10 qui est votre benchmark pertinent.',
    ],
  },
  {
    type: 'list',
    items: [
      'Marché global baisse −15 % et votre titre baisse −10 % → la baisse est probablement liée au contexte général — <strong>pas forcément un signal négatif spécifique</strong>.',
      'Marché monte +8 % mais votre titre baisse −5 % → <strong>signal de sous-performance spécifique</strong> à analyser dans les Fondamentaux et Actualités.',
    ],
  },

  // ── 6.13 ──────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '6.13 — Conclusion : Vous Savez Maintenant Lire le Marché',
    color: 'green',
  },
  {
    type: 'pull-quote',
    text: '« L\'information, c\'est la matière première de l\'investisseur. Celui qui sait la lire mieux que les autres a un avantage structurel sur le marché. » — Principe fondamental de l\'analyse financière',
  },
  {
    type: 'callout',
    variant: 'ok',
    title: '🏆 Les 3 réflexes à ancrer définitivement',
    paragraphs: [
      '<strong>1. Contextualisez toujours le prix</strong> avec le Plus Haut/Plus Bas 52 semaines avant toute autre analyse.',
      '<strong>2. Vérifiez la liquidité (volume quotidien)</strong> avant de vous intéresser à quoi que ce soit d\'autre — un titre illiquide n\'est pas investissable pour un débutant, même si les fondamentaux sont excellents.',
      '<strong>3. Lisez l\'historique sur 3 à 5 ans</strong> — une photo du jour ne dit rien. Le film annuel dit tout.',
    ],
  },
  {
    type: 'callout',
    variant: 'ok',
    title: '🧭 Prochaines Étapes',
    paragraphs: [
      '<strong>Exercice immédiat :</strong> Ouvrez AfriBourse, recherchez <strong>SONATEL (SNTS)</strong> et appliquez la méthode de lecture en 10 minutes. Notez vos conclusions dans votre journal d\'investisseur.',
      '<strong>Exercice suivant :</strong> Faites la même chose sur 3 autres titres de secteurs différents. Comparez leurs P/E, volumes et Dividend Yield.',
      '👉 <strong>Module 7 : Passer son Premier Ordre sur la BRVM</strong> — maintenant que vous savez lire une fiche et choisir un titre, vous allez apprendre à passer concrètement votre premier ordre.',
    ],
  },
];

async function run() {
  // 1. Shift all modules with order_index >= 5 upward by +1 (descending to avoid conflicts)
  const toShift = await prisma.learningModule.findMany({
    where: { order_index: { gte: 5 } },
    orderBy: { order_index: 'desc' },
    select: { id: true, order_index: true, slug: true },
  });

  console.log(`Shifting ${toShift.length} modules upward...`);
  for (const m of toShift) {
    await prisma.learningModule.update({
      where: { id: m.id },
      data: { order_index: m.order_index + 1 },
    });
    console.log(`  ${m.order_index} → ${m.order_index + 1}  (${m.slug})`);
  }

  // 2. Create new Module 6 at order_index=5
  const created = await prisma.learningModule.create({
    data: {
      slug: 'lire-informations-marche',
      title: 'Lire les Informations de Marché — Décrypter une Fiche Valeur AfriBourse',
      description: 'Apprenez à lire et interpréter chaque donnée d\'une fiche valeur : prix, ratios, graphique, historique financier et actionnariat — avec la méthode des 10 minutes.',
      difficulty_level: 'BEGINNER',
      content_type: 'TEXT',
      duration_minutes: 30,
      order_index: 5,
      is_published: true,
      has_quiz: false,
      content_json: JSON.stringify(blocks),
      content: null,
      thumbnail_url: null,
      video_url: null,
      audio_url: null,
      attachment_url: null,
      dashboard_url: null,
    },
  });

  console.log(`\n✅ Created: [${created.order_index}] ${created.title}`);
  console.log(`   Slug: ${created.slug}`);
  console.log(`   Blocks: ${blocks.length}`);
}

run()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
