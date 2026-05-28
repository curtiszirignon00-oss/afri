import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const blocks = [
  // ── Intro ──────────────────────────────────────────────────────────────────
  {
    type: 'pull-quote',
    text: '« Comprendre le marché sans savoir passer un ordre, c\'est savoir lire une recette sans connaître les ustensiles de cuisine. »',
  },
  {
    type: 'objectives',
    title: '🎯 Objectifs Pédagogiques',
    subtitle: 'À la fin de ce module, vous serez capable de :',
    items: [
      'Comprendre le fonctionnement du fixing BRVM — comment se déroule une séance de cotation de A à Z',
      'Distinguer et utiliser les différents types d\'ordres disponibles selon votre objectif',
      'Passer concrètement un ordre d\'achat ou de vente via votre SGI ou le simulateur AfriBourse',
      'Maîtriser les délais de règlement-livraison J+3 et ce qu\'ils impliquent pour votre compte',
      'Éviter les 6 erreurs classiques du premier ordre qui coûtent de l\'argent aux débutants',
    ],
  },
  {
    type: 'callout',
    variant: 'info',
    title: '💡 Prérequis',
    paragraphs: [
      'Ce module suit M6 (Lire les informations de marché). Vous savez analyser une fiche valeur — vous allez maintenant apprendre à agir.',
    ],
  },

  // ── 7.1 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '7.1 — La BRVM ne Fonctionne pas comme les Marchés que vous Connaissez',
    color: 'blue',
  },
  {
    type: 'paragraph',
    text: 'Sur des marchés comme Euronext Paris ou le NYSE, les cours évoluent en temps réel, seconde par seconde. Vous passez un ordre à 10h15 et il peut s\'exécuter à 10h15 et 23 secondes. Sur la BRVM, c\'est différent. <strong>Le marché fonctionne par fixing</strong> — des moments précis dans la journée où les ordres accumulés sont confrontés et exécutés simultanément.',
  },
  {
    type: 'analogy',
    title: '🪶 L\'analogie à retenir : le marché hebdomadaire du village',
    intro: 'Dans beaucoup de nos villes et villages, il existe un marché hebdomadaire.',
    items: [
      'Les vendeurs et acheteurs <strong>n\'opèrent pas toute la semaine</strong> — ils attendent le jour du marché',
      'Tout le monde se retrouve <strong>au même endroit</strong>, et les transactions de la semaine se font en quelques heures',
      'Qui propose quoi, à quel prix, qui accepte — un <strong>prix d\'équilibre</strong> se forme naturellement',
    ],
    conclusion: 'Le fixing BRVM, c\'est exactement ce marché hebdomadaire — mais il a lieu chaque jour ouvré, à heure fixe.',
  },

  // ── 7.2 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '7.2 — Le Déroulement d\'une Séance de Cotation BRVM',
    color: 'green',
  },
  {
    type: 'table',
    caption: '7.2.1 — Calendrier de la séance (heure d\'Abidjan, GMT+0)',
    headers: ['Phase', 'Horaire', 'Ce qui se passe'],
    rows: [
      ['Pré-ouverture', '08h00 – 09h00', 'Les ordres sont saisis et enregistrés. Aucune exécution. Vous pouvez encore modifier ou annuler vos ordres.'],
      ['Fixing d\'ouverture', '09h00', 'Le système confronte tous les ordres et calcule le cours d\'équilibre. Les ordres compatibles sont exécutés.'],
      ['Séance continue', '09h00 – 13h00', 'Des fixings successifs peuvent avoir lieu sur les valeurs liquides. Sur les valeurs peu liquides, le fixing d\'ouverture est souvent le seul.'],
      ['Clôture', '13h00', 'La séance se termine. Plus aucun ordre n\'est exécuté pour cette journée.'],
      ['Post-clôture / Saisie', '13h00 – 08h00', 'Vous pouvez saisir vos ordres pour la séance du lendemain. Ils seront pris en compte au prochain fixing à 09h00.'],
    ],
  },
  {
    type: 'callout',
    variant: 'warn',
    title: '⚠️ Si vous passez un ordre après 13h00',
    paragraphs: [
      'Il ne sera pas exécuté aujourd\'hui. Il entrera dans la file d\'attente pour la séance du <strong>lendemain matin à 09h00</strong>.',
    ],
  },
  {
    type: 'callout',
    variant: 'info',
    title: '💡 Ce que ça change pour vous',
    paragraphs: [
      'Contrairement à ce que vous pourriez croire, <strong>il n\'y a pas urgence à passer votre ordre "maintenant"</strong>. Le cours que vous voyez sur AfriBourse à 15h00 ne changera pas avant le prochain fixing à 09h00 le lendemain. Prenez le temps d\'analyser avant d\'agir.',
    ],
  },
  {
    type: 'section-title',
    text: '7.2.2 — Le mécanisme du fixing : comment le prix se forme',
    color: 'purple',
  },
  {
    type: 'paragraph',
    text: 'Voici comment le système BRVM détermine le cours d\'exécution lors d\'un fixing. Prenons l\'exemple de l\'action <strong>SONATEL</strong> :',
  },
  {
    type: 'table',
    caption: 'Ordres d\'achat enregistrés',
    headers: ['Investisseur', 'Prix maximum accepté', 'Quantité souhaitée'],
    rows: [
      ['Investisseur A', '19 500 FCFA', '10 actions'],
      ['Investisseur B', '19 200 FCFA', '5 actions'],
      ['Investisseur C', '19 000 FCFA', '8 actions'],
      ['Investisseur D', '18 800 FCFA', '15 actions'],
    ],
  },
  {
    type: 'table',
    caption: 'Ordres de vente enregistrés',
    headers: ['Vendeur', 'Prix minimum accepté', 'Quantité proposée'],
    rows: [
      ['Vendeur 1', '18 500 FCFA', '7 actions'],
      ['Vendeur 2', '19 000 FCFA', '10 actions'],
      ['Vendeur 3', '19 200 FCFA', '6 actions'],
      ['Vendeur 4', '19 500 FCFA', '12 actions'],
    ],
  },
  {
    type: 'highlight',
    text: 'Le système cherche le prix qui <strong>maximise le volume échangé</strong>. À 19 000 FCFA, les acheteurs A, B et C acceptent, et les vendeurs 1 et 2 acceptent. → <strong>Cours de fixing : 19 000 FCFA.</strong> Les ordres compatibles sont exécutés. Les autres restent en attente ou expirent.',
  },
  {
    type: 'callout',
    variant: 'ok',
    title: '🎓 À retenir',
    paragraphs: [
      'Vous ne choisissez pas exactement à quel prix votre ordre sera exécuté — vous choisissez vos <strong>conditions</strong> (prix maximum à l\'achat, prix minimum à la vente). Le système trouve ensuite le meilleur prix d\'équilibre possible dans ces contraintes.',
    ],
  },

  // ── 7.3 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '7.3 — Les Types d\'Ordres sur la BRVM',
    color: 'orange',
  },
  {
    type: 'section-title',
    text: '✅ 7.3.1 — L\'Ordre à Cours Limité (Recommandé pour les débutants)',
    color: 'green',
  },
  {
    type: 'callout',
    variant: 'ok',
    title: 'Définition',
    paragraphs: [
      'Vous fixez un prix précis — le <strong>maximum que vous acceptez de payer</strong> à l\'achat (ou le minimum à la vente). Votre ordre ne sera exécuté que si le marché atteint votre prix ou fait mieux.',
      '<strong>À l\'achat :</strong> "J\'accepte d\'acheter SONATEL, mais je ne paie pas plus de 19 000 FCFA." → Si le fixing est ≤ 19 000 FCFA : exécuté. Si le fixing est à 19 200 FCFA : pas exécuté, reste en attente.',
      '<strong>À la vente :</strong> "Je ne vends pas en dessous de 7 500 FCFA." → Si le fixing est ≥ 7 500 FCFA : exécuté. Sinon : en attente.',
    ],
  },
  {
    type: 'callout',
    variant: 'warn',
    title: 'Avantage et inconvénient',
    paragraphs: [
      '✅ <strong>Avantage :</strong> Vous maîtrisez totalement votre prix d\'entrée ou de sortie. Pas de mauvaise surprise.',
      '⚠️ <strong>Inconvénient :</strong> Votre ordre peut ne jamais être exécuté si le marché n\'atteint pas votre prix.',
    ],
  },
  {
    type: 'section-title',
    text: '⚠️ 7.3.2 — L\'Ordre au Marché (À utiliser avec précaution)',
    color: 'orange',
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Définition',
    paragraphs: [
      'Vous passez un ordre <strong>sans fixer de prix précis</strong>. Le système l\'exécute au meilleur prix disponible lors du fixing.',
      '✅ <strong>Avantage :</strong> Exécution quasi-garantie — vous êtes prioritaire dans la file d\'attente.',
    ],
  },
  {
    type: 'callout',
    variant: 'warn',
    title: '🚨 Danger majeur sur la BRVM',
    paragraphs: [
      'Sur un marché peu liquide, votre ordre au marché peut s\'exécuter très loin du cours affiché. Si le seul vendeur disponible propose <strong>22 000 FCFA</strong> pour un titre affiché à 19 000 FCFA, vous achèterez à 22 000 FCFA — soit <strong>16 % de plus que prévu</strong>.',
      '<strong>Règle absolue :</strong> N\'utilisez l\'ordre au marché que sur les valeurs les plus liquides (SONATEL, ECOBANK CI, ORANGE CI) et pour de petites quantités. Pour tout le reste, utilisez toujours l\'ordre à cours limité.',
    ],
  },
  {
    type: 'section-title',
    text: '7.3.3 — L\'Ordre à Seuil de Déclenchement (Stop Order)',
    color: 'purple',
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Définition',
    paragraphs: [
      'Un ordre qui ne se "réveille" que lorsque le cours atteint un seuil prédéfini, puis s\'exécute comme un ordre au marché.',
      '<strong>Exemple :</strong> "Déclenche un ordre de vente de mes PALM-CI si le cours tombe à 6 500 FCFA." → Inactif au-dessus de 6 500 FCFA. Dès que le cours passe sous ce seuil au fixing, l\'ordre se déclenche.',
      '⚠️ <strong>Réalité BRVM :</strong> Ce type d\'ordre est peu répandu — toutes les SGI ne le proposent pas. Ne comptez pas dessus comme filet de sécurité automatique. Utilisez les <strong>alertes AfriBourse</strong> comme alternative pratique.',
    ],
  },
  {
    type: 'table',
    caption: '7.3.4 — Tableau récapitulatif des types d\'ordres',
    headers: ['Type d\'ordre', 'Prix maîtrisé ?', 'Exécution garantie ?', 'Recommandé BRVM ?', 'Usage idéal'],
    rows: [
      ['À cours limité', '✅ Oui', '❌ Dépend du marché', '✅ Toujours', 'Tous les ordres débutant'],
      ['Au marché', '❌ Prix du fixing', '✅ Quasi-oui', '⚠️ Précaution', 'Uniquement Blue Chips très liquides'],
      ['À seuil de déclenchement', '❌ Prix après déclenchement', '❌ Non', '⚠️ Rarement disponible', 'Investisseurs avancés'],
    ],
  },

  // ── 7.4 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '7.4 — Les Durées de Validité d\'un Ordre',
    color: 'blue',
  },
  {
    type: 'table',
    caption: 'Durées de validité et quand les utiliser',
    headers: ['Durée', 'Signification', 'Quand l\'utiliser'],
    rows: [
      ['Jour (Day Order)', 'L\'ordre expire en fin de séance s\'il n\'est pas exécuté', 'Quand vous pensez que le cours sera atteint aujourd\'hui. Faible conviction ? Évitez.'],
      ['À révocation (GTC)', 'L\'ordre reste actif jusqu\'à exécution ou annulation manuelle', '✅ Le plus pratique. Votre ordre attend aussi longtemps que nécessaire.'],
      ['GTD (Good Till Date)', 'L\'ordre expire à une date précise que vous choisissez', 'Utile avant une date de détachement de dividende par exemple'],
    ],
  },
  {
    type: 'highlight',
    text: '💡 <strong>Recommandation débutant :</strong> Utilisez presque toujours <strong>"À révocation"</strong>. Cela vous évite de surveiller et resaisir votre ordre chaque jour si le cours met quelques séances à rejoindre votre niveau cible.',
  },

  // ── 7.5 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '7.5 — Les Délais de Règlement-Livraison : Ce qui se Passe Après l\'Exécution',
    color: 'green',
  },
  {
    type: 'paragraph',
    text: 'Votre ordre est exécuté au fixing. Mais les actions n\'arrivent pas instantanément dans votre portefeuille, et le cash ne quitte pas instantanément votre compte. Il existe des délais réglementaires gérés par le <strong>DC/BR</strong>.',
  },
  {
    type: 'table',
    caption: '7.5.1 — Le cycle J+3 (jours ouvrés)',
    headers: ['Jour', 'Ce qui se passe'],
    rows: [
      ['J — Exécution', 'Votre ordre est exécuté au fixing. La transaction est enregistrée.'],
      ['J+1', 'Les SGI transmettent les confirmations au DC/BR.'],
      ['J+2', 'Vérification et appariement des transactions entre les SGI.'],
      ['J+3', 'Règlement-livraison effectif. Les espèces et actions sont échangées entre les comptes.'],
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: '7.5.2 — Ce que ça change concrètement pour vous',
    paragraphs: [
      '<strong>Si vous achetez :</strong> En J+3, les actions sont officiellement créditées dans votre portefeuille. Pendant ces 3 jours, les fonds sont "réservés" — vous ne pouvez pas les utiliser pour un autre achat.',
      '<strong>Si vous vendez :</strong> Les espèces (après frais) sont créditées en J+3. <strong>Vous ne pouvez pas réinvestir le produit d\'une vente avant J+3.</strong>',
    ],
  },
  {
    type: 'table',
    caption: 'Situations pratiques et implications J+3',
    headers: ['Situation', 'Implication pratique'],
    rows: [
      ['Vous achetez SONATEL aujourd\'hui (lundi)', 'Vos actions seront dans votre portefeuille jeudi (J+3, si pas de jours fériés)'],
      ['Vous vendez PALM-CI aujourd\'hui', 'Le cash sera disponible jeudi — pas avant'],
      ['Vous voulez acheter et vendre le même jour', 'Impossible de réinvestir le produit d\'une vente le même jour. Prévoyez J+3.'],
      ['Vous achetez avant une date de dividende', 'Vérifiez que votre J+3 tombe AVANT la date d\'enregistrement pour avoir droit au dividende'],
    ],
  },
  {
    type: 'callout',
    variant: 'warn',
    title: '⚠️ Cas critique — Dividendes et délai J+3',
    paragraphs: [
      'Si la date de détachement du dividende est dans 2 jours ouvrés et que vous achetez aujourd\'hui, vous <strong>n\'aurez PAS droit au dividende</strong>. Votre achat sera enregistré au DC/BR en J+3, soit après la date d\'enregistrement.',
      '<strong>Règle :</strong> Prévoyez toujours <strong>minimum 4 à 5 jours ouvrés d\'avance</strong> pour être certain de percevoir un dividende.',
    ],
  },

  // ── 7.6 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '7.6 — Les Frais : Ce que Coûte Réellement une Transaction',
    color: 'purple',
  },
  {
    type: 'table',
    caption: '7.6.1 — Structure des frais sur la BRVM',
    headers: ['Type de frais', 'Qui le prélève', 'Taux indicatif', 'Application'],
    rows: [
      ['Commission SGI', 'Votre SGI (intermédiaire)', '0,5 % à 1,5 %', 'À l\'achat ET à la vente'],
      ['Droit de garde', 'SGI / DC/BR', 'Variable (souvent annuel)', 'Sur la valeur totale des titres détenus'],
      ['Taxes BRVM / AMF-UMOA', 'BRVM / AMF-UMOA', '~0,2 à 0,5 %', 'Inclus dans les frais globaux'],
      ['TVA sur commissions', 'État', '18 % de la commission SGI', 'Sur la commission de la SGI'],
    ],
  },
  {
    type: 'section-title',
    text: '7.6.2 — Calculer le coût réel d\'un aller-retour',
    color: 'blue',
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Exemple : 8 actions SONATEL — commission SGI 1 %',
    paragraphs: [
      '<strong>À l\'achat</strong> (19 000 FCFA × 8) : Montant investi = 152 000 FCFA | Commission = 1 520 FCFA | Coût total = <strong>153 520 FCFA</strong>',
      '<strong>À la vente</strong> (22 000 FCFA × 8) : Montant brut = 176 000 FCFA | Commission = 1 760 FCFA | Net reçu = <strong>174 240 FCFA</strong>',
      '<strong>Plus-value brute :</strong> +24 000 FCFA (+15,8 %) | <strong>Frais aller-retour :</strong> 3 280 FCFA | <strong>Plus-value nette :</strong> 20 720 FCFA (<strong>+13,6 %</strong>)',
    ],
  },
  {
    type: 'highlight',
    text: '🎓 Les frais ont réduit la performance de 15,8 % à 13,6 % — <strong>2,2 points mangés par les frais</strong>. Sur une petite position ou un aller-retour rapide, les frais peuvent annuler totalement le gain. C\'est pourquoi la stratégie long terme avec peu de transactions est souvent plus rentable nette de frais que le trading fréquent.',
  },
  {
    type: 'callout',
    variant: 'info',
    title: '7.6.3 — Le seuil de rentabilité',
    paragraphs: [
      'Avant d\'acheter, calculez toujours le <strong>seuil minimum de hausse</strong> nécessaire pour couvrir les frais aller-retour.',
      'Avec une commission de 1 % aller + 1 % retour → votre action doit monter d\'au moins <strong>+2 %</strong> pour ne pas perdre d\'argent sur les frais, même si votre analyse était parfaitement juste.',
      'Avec une commission de 0,6 % aller + 0,6 % retour → le seuil descend à <strong>+1,2 %</strong>. Argument supplémentaire pour choisir une SGI avec des frais compétitifs.',
    ],
  },

  // ── 7.7 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '7.7 — Passer un Ordre Pas à Pas sur le Simulateur AfriBourse',
    color: 'orange',
  },
  {
    type: 'ordered-list',
    items: [
      '<strong>Choisir le titre</strong> — Recherchez le titre sur AfriBourse. Lisez sa fiche complète (Module 6). Vérifiez qu\'il passe vos filtres de sélection.',
      '<strong>Ouvrir le panel "Passer un ordre"</strong> — Sur la fiche du titre, sélectionnez l\'onglet <em>Simulation</em> (et non "Challenge") pour vous entraîner sans risque.',
      '<strong>Vérifier vos liquidités disponibles</strong> — Le panel affiche vos liquidités virtuelles disponibles. Assurez-vous d\'avoir assez pour l\'ordre + frais.',
      '<strong>Saisir la quantité</strong> — Entrez le nombre d\'actions. Le système calcule automatiquement le montant total (ex : 5 actions SDSC à 1 700 FCFA = 8 500 FCFA + frais).',
      '<strong>Choisir le type d\'ordre et le prix</strong> — Sélectionnez "Ordre limité" et entrez votre prix maximum. Recommandation : le cours actuel ou légèrement en dessous.',
      '<strong>Choisir la durée de validité</strong> — Sélectionnez <strong>"À révocation"</strong> pour commencer.',
      '<strong>Valider et observer</strong> — Confirmez l\'ordre. Observez-le dans votre historique. Attendez le prochain fixing simulé pour voir s\'il est exécuté.',
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: '7.7.2 — En réel, via votre SGI',
    paragraphs: [
      '<strong>Option 1 — Via la plateforme en ligne de votre SGI :</strong> Identique au simulateur — même logique, mêmes champs. Vérifiez que votre compte espèces est approvisionné avant.',
      '<strong>Option 2 — Par téléphone ou email :</strong> Communiquez clairement : le titre (code + nom), le sens (achat/vente), la quantité, le type d\'ordre (limité à X FCFA) et la durée de validité.',
      '⚠️ Demandez toujours une <strong>confirmation écrite (email ou SMS)</strong> de la bonne réception de votre ordre. C\'est votre preuve en cas de litige.',
    ],
  },

  // ── 7.8 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '7.8 — Lire la Confirmation d\'Exécution',
    color: 'blue',
  },
  {
    type: 'table',
    caption: 'Les informations de l\'avis d\'exécution',
    headers: ['Information', 'Ce que ça signifie'],
    rows: [
      ['Date d\'exécution', 'Le jour du fixing où votre ordre a été exécuté'],
      ['Titre', 'Le code et nom de l\'action achetée/vendue'],
      ['Quantité exécutée', 'Peut être inférieure à votre ordre initial (exécution partielle) si la liquidité était insuffisante'],
      ['Prix d\'exécution', 'Le cours auquel votre ordre a été exécuté au fixing'],
      ['Montant brut', 'Quantité × Prix d\'exécution'],
      ['Commission SGI', 'Le montant des frais prélevés'],
      ['Montant net', 'Ce que vous avez réellement payé (achat) ou reçu (vente)'],
      ['Date de règlement (J+3)', 'La date à laquelle les actions/espèces seront effectivement créditées'],
    ],
  },
  {
    type: 'callout',
    variant: 'warn',
    title: '⚠️ L\'exécution partielle',
    paragraphs: [
      'Sur la BRVM, il arrive fréquemment qu\'un ordre ne soit que <strong>partiellement exécuté</strong>. Si vous voulez acheter 10 actions SDSC à 1 700 FCFA et qu\'il n\'y a que 7 vendeurs à ce prix, votre ordre sera exécuté à hauteur de 7 actions. Les 3 restantes resteront en attente au prochain fixing (si votre ordre est "à révocation").',
    ],
  },

  // ── 7.9 ───────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '7.9 — Les 6 Erreurs Classiques du Premier Ordre',
    color: 'orange',
  },
  {
    type: 'list',
    items: [
      '<strong>Erreur 1 — Ordre au marché sur une valeur peu liquide :</strong> Sur SDSC (2 957 actions/jour), un ordre au marché peut s\'exécuter très loin du cours affiché. Utilisez toujours un ordre limité sur les small caps.',
      '<strong>Erreur 2 — Oublier les frais dans le budget :</strong> Vous avez 50 000 FCFA et voulez acheter pour 50 000 FCFA d\'actions. Erreur : il vous faut 50 000 FCFA + frais. Prévoyez <strong>1 à 2 % de marge</strong> supplémentaire.',
      '<strong>Erreur 3 — Ordre après 13h00 en pensant qu\'il s\'exécutera aujourd\'hui :</strong> La séance est clôturée à 13h00. Votre ordre sera traité demain matin.',
      '<strong>Erreur 4 — Ne pas vérifier les liquidités disponibles :</strong> Un ordre sans provision suffisante peut être rejeté par votre SGI ou entraîner des pénalités.',
      '<strong>Erreur 5 — Acheter sans définir de seuil d\'alerte :</strong> Dès l\'exécution, paramétrez immédiatement vos alertes sur AfriBourse (−10 % et +20 % du prix d\'exécution). Ne jamais acheter sans avoir défini à l\'avance à quelle condition vous vendrez.',
      '<strong>Erreur 6 — Annuler un ordre limité en attente trop tôt :</strong> Un ordre limité en attente travaille pour vous — laissez-lui le temps. La patience est une stratégie.',
    ],
  },

  // ── 7.10 ──────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '7.10 — Votre Check-List du Premier Ordre',
    color: 'green',
  },
  {
    type: 'table',
    caption: 'À vérifier avant, pendant et après chaque ordre',
    headers: ['✓', 'Vérification', 'Pourquoi'],
    rows: [
      ['☐', 'J\'ai lu la fiche valeur complète du titre (M6)', 'Ne jamais acheter sans avoir analysé'],
      ['☐', 'J\'ai vérifié le volume quotidien — valeur suffisamment liquide', 'Éviter les pièges de liquidité'],
      ['☐', 'J\'ai calculé ma taille de position — max 30 % du capital sur une ligne', 'Gestion du risque'],
      ['☐', 'J\'utilise un ordre à cours limité avec mon prix maximum défini', 'Maîtrise du prix d\'exécution'],
      ['☐', 'J\'ai sélectionné la durée "À révocation"', 'Patience sans surveillance quotidienne'],
      ['☐', 'Mes liquidités disponibles couvrent le montant + frais de courtage', 'Pas de mauvaise surprise'],
      ['☐', 'Je m\'entraîne d\'abord sur le simulateur AfriBourse', 'Acquérir les réflexes sans risque'],
      ['☐', 'Après exécution : alertes AfriBourse configurées (−10 % et +20 %)', 'Discipline de suivi'],
      ['☐', 'Je note dans mon journal : titre, prix, quantité, raison, objectif', 'Traçabilité et progression'],
    ],
  },

  // ── 7.11 ──────────────────────────────────────────────────────────────────
  {
    type: 'section-title',
    text: '7.11 — Conclusion : L\'Ordre, Acte de Conviction — Pas d\'Impulsion',
    color: 'purple',
  },
  {
    type: 'paragraph',
    text: 'Passer un ordre sur la BRVM est un acte simple techniquement. Ce qui le rend difficile, c\'est la dimension émotionnelle : la peur de rater une hausse, l\'impatience face à un ordre en attente, l\'hésitation au moment de confirmer. La technique, vous venez de la maîtriser. La discipline mentale, vous l\'avez commencée en M8 (Psychologie). Le reste viendra avec la pratique — sur le simulateur d\'abord, en réel ensuite.',
  },
  {
    type: 'pull-quote',
    text: '« Un bon ordre passé avec méthode vaut mieux que dix ordres passés dans l\'urgence. La BRVM récompense la rigueur, pas la précipitation. »',
  },
  {
    type: 'callout',
    variant: 'ok',
    title: '🧭 Prochaines Étapes',
    paragraphs: [
      '<strong>Dès maintenant :</strong> Ouvrez le simulateur AfriBourse, choisissez un titre qui passe vos filtres et passez votre premier ordre simulé en suivant la check-list.',
      '<strong>Ce mois-ci :</strong> Passez au moins 3 ordres simulés sur 3 titres différents — un achat, un ordre en attente (pour vivre la patience), et une vente.',
      '👉 <strong>Module 8 : Psychologie & Biais — Le Mental du Gagnant.</strong> Maintenant que vous savez lire le marché et passer des ordres, vous allez comprendre pourquoi la psychologie est le vrai levier de performance.',
    ],
  },
  {
    type: 'callout',
    variant: 'ok',
    title: '🏆 Félicitations !',
    paragraphs: [
      'Vous savez maintenant naviguer dans une fiche valeur AfriBourse (M6) ET passer un ordre sur la BRVM avec méthode (M7). La théorie et la pratique sont alignées. Il ne reste plus qu\'à appuyer sur le bouton — sur le simulateur d\'abord.',
    ],
  },
];

async function run() {
  const module = await prisma.learningModule.findFirst({
    where: { slug: 'passer-un-ordre-delais' },
    select: { id: true, title: true, order_index: true },
  });

  if (!module) {
    console.error('Module passer-un-ordre-delais not found');
    await prisma.$disconnect();
    return;
  }

  console.log(`Updating: [M${module.order_index}] ${module.title}`);

  await prisma.learningModule.update({
    where: { id: module.id },
    data: {
      title: 'Passer un Ordre sur la BRVM — Entrer sur le Marché',
      content_json: JSON.stringify(blocks),
      has_quiz: false,
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
