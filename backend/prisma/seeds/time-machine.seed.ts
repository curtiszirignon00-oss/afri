import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ─── SCÉNARIO A : L'Investisseur de 2010 ────────────────────────────────────

const scenarioA = {
  slug: 'investisseur-2010',
  title: "L'Investisseur de 2010",
  description:
    "Tu as 500 000 FCFA en janvier 2010. La BRVM vient de réaliser sa meilleure année. Compose ton portefeuille et suis-le sur 15 ans — 5 sauts de 3 ans. Chaque décision a des conséquences réelles.",
  category: 'BULL_RUN',
  tier: 'FREE',
  years: [2010, 2013, 2016, 2019, 2022],
  availableStocks: ['SNTS', 'SGBC', 'PALC', 'SLBC', 'SIBC', 'CIEC'],
  startBudget: 500000,
  isActive: true,

  contextByYear: {
    '2010': {
      kofiPresentation:
        "Nous sommes en janvier 2010. La Côte d'Ivoire sort de 8 ans de crise politique. La BRVM vient de réaliser sa meilleure année en une décennie. Tu as 500 000 FCFA à investir. Ce que tu vas décider dans les prochaines minutes va déterminer ce que ces 500 000 FCFA deviennent sur 15 ans. Voici ce que le marché te dit ce matin-là.",
      kofiIntro:
        "Tu as 500 000 FCFA. 6 titres disponibles. Tu peux acheter autant de lignes que tu veux dans la limite de ton budget. Commission SGI : 1,2% sur chaque achat. Prends le temps de lire les fondamentaux dans l'onglet dédié avant de décider.",
      news: [
        {
          src: 'BRVM — Rapport de marché',
          date: '15 janv. 2010',
          tag: 'Performance historique',
          sentiment: 'positive',
          text: "La BRVM Composite affiche +68% sur 2009, l'une des meilleures performances boursières mondiales de l'année. La capitalisation totale dépasse 3 200 milliards FCFA. Les volumes quotidiens ont progressé de +34% par rapport à 2008. Le marché abidjanais redevient la référence de la finance ouest-africaine francophone.",
        },
        {
          src: 'BCEAO — Note de politique monétaire',
          date: '15 janv. 2010',
          tag: 'Stabilité financière',
          sentiment: 'positive',
          text: "Le Comité de politique monétaire maintient son taux directeur à 4,25%. La zone UEMOA projette une croissance de +4,1% pour 2010. Les banques de la zone affichent un ratio Tier 1 moyen de 12,4% — bien au-dessus du minimum réglementaire de 8%. Aucune institution bancaire UEMOA n'a fait faillite durant la crise mondiale 2008-2009, contrairement à plus de 500 banques américaines.",
        },
        {
          src: 'Jeune Afrique Économie',
          date: '18 janv. 2010',
          tag: 'Retour des investisseurs',
          sentiment: 'positive',
          text: "L'accord politique en Côte d'Ivoire avance. Les investisseurs institutionnels étrangers reviennent progressivement sur Abidjan. SONATEL, SGBCI et SOLIBRA ont publié des résultats 2009 en hausse malgré la conjoncture difficile. Le secteur bancaire ivoirien bénéficie de la reprise du crédit à l'économie (+11% sur 2009).",
        },
        {
          src: 'Agence Ecofin',
          date: '10 janv. 2010',
          tag: 'Risque politique résiduel',
          sentiment: 'warning',
          text: "Les élections présidentielles ivoiriennes, initialement prévues en 2009, sont repoussées à fin 2010. Une incertitude politique résiduelle pèse sur le marché. Les investisseurs étrangers restent prudents sur les small caps. Les valeurs de grande capitalisation (SONATEL, SGBCI, SOLIBRA) sont perçues comme des valeurs refuges.",
        },
      ],
      macro: [
        { label: 'PIB UEMOA 2009', value: '+2,7%', trend: 'up', signal: 'Reprise post-crise mondiale — zone résistante', signification: 'Produit Intérieur Brut : mesure la richesse totale produite dans la zone UEMOA (8 pays) sur l\'année. Une hausse indique une économie en croissance.' },
        { label: 'Taux directeur BCEAO', value: '4,25%', trend: 'flat', signal: 'Stabilité monétaire — conditions de crédit favorables aux entreprises', signification: 'Taux d\'intérêt auquel la banque centrale prête aux banques commerciales. Plus il est bas, plus les crédits aux entreprises et particuliers sont accessibles.' },
        { label: 'BRVM Composite 2009', value: '+68,3%', trend: 'up', signal: 'Meilleure performance boursière africaine de l\'année — capitalisation 3 200 Mds FCFA', signification: 'Indice général de la bourse régionale BRVM. Reflète la hausse ou la baisse du marché dans son ensemble, pondéré par la capitalisation de chaque titre.' },
        { label: 'Inflation UEMOA', value: '+1,4%', trend: 'flat', signal: 'Très faible — pouvoir d\'achat préservé, pas de resserrement monétaire à prévoir', signification: 'Hausse générale des prix. Une inflation faible est favorable aux investissements : les entreprises peuvent planifier, et la BCEAO n\'a pas besoin de relever les taux.' },
        { label: 'Cours du cacao', value: '3 200 $/t', trend: 'up', signal: 'Rebond depuis les creux 2008 — favorable aux valeurs agro CI', signification: 'Prix mondial de la fève de cacao, principale matière première de Côte d\'Ivoire (1er producteur mondial). Impact direct sur les revenus des sociétés agro-industrielles BRVM.' },
        { label: 'Solidité bancaire (Tier 1)', value: '12,4%', trend: 'up', signal: 'Bien au-dessus des 8% réglementaires — aucune banque UEMOA en faillite en 2008-09', signification: 'Ratio de fonds propres des banques par rapport à leurs actifs pondérés du risque. Plus il est élevé, plus la banque est solide face à des pertes éventuelles.' },
      ],
    },
    '2013': {
      kofiPresentation:
        "3 ans ont passé. La BRVM vient de réaliser l'une des meilleures performances mondiales sur la période. Tes premières décisions ont des conséquences réelles. Tu récupères tes dividendes cumulés et 500 000 FCFA frais. La question maintenant : tu renforces les gagnants, tu rééquilibres vers les retardataires, ou tu changes complètement de stratégie ?",
      kofiIntro:
        "Ton portefeuille a progressé. Tu récupères tes dividendes cumulés (3 ans) et tu reçois 500 000 FCFA supplémentaires. Capital disponible = valeur actuelle du portefeuille + dividendes perçus + 500K. La question : est-ce que tu renforces les gagnants, tu rééquilibres, ou tu introduis de nouvelles positions ?",
      news: [
        {
          src: 'BRVM — Rapport annuel 2012',
          date: '31 déc. 2012',
          tag: 'Bull run confirmé',
          sentiment: 'positive',
          text: 'La BRVM Composite a progressé de +87% entre début 2010 et fin 2012. La capitalisation boursière dépasse 4 000 milliards FCFA. La Côte d\'Ivoire a retrouvé sa stabilité politique après les élections de 2011. Les bancaires et les télécoms ont porté l\'essentiel de la hausse. SONATEL s\'est apprécié de +32% sur la période.',
        },
        {
          src: 'Jeune Afrique Économie',
          date: '15 janv. 2013',
          tag: 'Record de croissance',
          sentiment: 'positive',
          text: "La Côte d'Ivoire affiche +10,7% de croissance en 2012 — meilleur taux d'Afrique subsaharienne. Les grandes sociétés BRVM publient des résultats records. SONATEL annonce un bénéfice net de 180 milliards FCFA, en hausse de +18%. SGBCI double son portefeuille de crédits retail depuis 2010. La réconciliation nationale est effective et les investissements directs étrangers reprennent.",
        },
        {
          src: 'BCEAO — Revue économique',
          date: '10 janv. 2013',
          tag: 'Crédit en hausse',
          sentiment: 'positive',
          text: "Le crédit à l'économie dans la zone UEMOA progresse de +15% sur 2012. Les dépôts bancaires augmentent de +12%. L'encours des obligations d'État UEMOA sur le marché régional dépasse 2 000 milliards FCFA, confirmant la profondeur croissante du marché financier régional.",
        },
        {
          src: 'Agence Ecofin — Analyse',
          date: '20 janv. 2013',
          tag: 'Vigilance sur les valorisations',
          sentiment: 'warning',
          text: "Le bull run BRVM a attiré des capitaux spéculatifs. Certains titres se négocient désormais à des valorisations tendues. SONATEL approche les 20× les bénéfices. La correction est historiquement probable après une hausse de +87%. Les investisseurs de long terme doivent rester disciplinés et ne pas céder à l'euphorie.",
        },
      ],
      macro: [
        { label: 'PIB UEMOA 2012', value: '+6,5%', trend: 'up', signal: 'Accélération — CI affiche +10,7% — meilleur taux Afrique subsaharienne', signification: 'Produit Intérieur Brut : mesure la richesse produite dans la zone UEMOA. La Côte d\'Ivoire retrouve sa croissance d\'avant-crise grâce à la réconciliation nationale.' },
        { label: 'BRVM Composite 2010-12', value: '+87%', trend: 'up', signal: 'Bull run historique — capitalisation : 4 000 Mds FCFA', signification: 'Performance cumulée de l\'indice BRVM depuis 2010. Ce chiffre exceptionnel reflète le retour des investisseurs sur la Côte d\'Ivoire après la crise post-électorale.' },
        { label: 'Taux directeur BCEAO', value: '4,25%', trend: 'flat', signal: 'Toujours stable — politique monétaire accommodante maintenue', signification: 'Taux d\'intérêt directeur inchangé depuis 2010. Une stabilité qui favorise l\'investissement mais qui sera difficile à maintenir si la croissance surchauffe.' },
        { label: 'Crédit à l\'économie UEMOA', value: '+15%', trend: 'up', signal: 'Fort dynamisme bancaire — bon signe pour les bancaires BRVM', signification: 'Croissance des prêts accordés par les banques aux entreprises et particuliers. Un indicateur clé de la santé du secteur bancaire et de la confiance dans l\'économie.' },
        { label: 'Inflation UEMOA', value: '+1,5%', trend: 'flat', signal: 'Maîtrisée — aucune pression sur les taux', signification: 'Hausse générale des prix. Maintenue basse malgré la forte croissance, ce qui permet à la BCEAO de garder ses taux bas et de soutenir l\'investissement.' },
        { label: 'Cours du cacao', value: '2 800 $/t', trend: 'down', signal: 'Légèrement inférieur à 2010 — effet neutre sur l\'agro CI', signification: 'Prix mondial du cacao, ressource clé de CI. Le repli depuis les sommets 2010 réduit les bénéfices des agro-industriels mais reste à un niveau élevé historiquement.' },
      ],
    },
    '2016': {
      kofiPresentation:
        "6 ans dans le marché. Après l'euphorie du bull run 2013-2014, le marché a corrigé. Les matières premières ont chuté. Certaines de tes positions sont en recul. Mais tes dividendes ont continué de tomber. Comment tu repositionnes avec ton capital cumulé ?",
      kofiIntro:
        "6 ans. La correction post-bull run et la chute des matières premières ont touché certains de tes titres. PALM CI recule. Mais les télécoms et les bancaires résistent. Tes dividendes ont continué de tomber. Capital disponible = valeur actuelle + dividendes cumulés 6 ans + 500K. Comment tu te repositionnes ?",
      news: [
        {
          src: 'BRVM Flash',
          date: '31 déc. 2015',
          tag: 'Fin de cycle bull run',
          sentiment: 'warning',
          text: "La BRVM a corrigé sur 2014-2015 après les sommets de 2013. Les valeurs agricoles souffrent : chute des cours mondiaux du cacao (-20% depuis le pic 2014), de l'huile de palme (-20%), et du caoutchouc (-35%). SOGB et SAPH reculent fortement. En revanche, BRVM Composite affiche +17,8% sur 2015, portée par les télécoms et les bancaires.",
        },
        {
          src: 'Jeune Afrique Économie',
          date: '18 janv. 2016',
          tag: 'SONATEL — explosion data mobile',
          sentiment: 'positive',
          text: "Orange CI (cotée séparément) et SONATEL surperforment le marché. La croissance du nombre d'abonnés data mobile en zone UEMOA atteint +45% en 2015. Les revenus data dépassent désormais les revenus voix pour SONATEL. La 4G est déployée au Sénégal et au Mali. Dividende SONATEL 2015 : 850 FCFA par action.",
        },
        {
          src: 'BCEAO — Rapport sectoriel',
          date: '15 janv. 2016',
          tag: 'Bancaires : résilience confirmée',
          sentiment: 'positive',
          text: "Le secteur bancaire UEMOA affiche une croissance du crédit de +12% en 2015. Les bancaires cotées à la BRVM publient des résultats solides. SGBCI annonce un bénéfice net en hausse de +8%. SIB enregistre +14% de croissance de son portefeuille crédit. Le ratio de créances douteuses reste stable, bien en dessous des moyennes africaines.",
        },
        {
          src: 'Agence Ecofin',
          date: '20 janv. 2016',
          tag: 'Risque matières premières persistant',
          sentiment: 'warning',
          text: "Les cours mondiaux du cacao et de l'huile de palme restent sous pression. La demande chinoise ralentit. L'impact sur les résultats 2016 de PALM CI, SAPH et SOGB sera significatif. Les analystes recommandent d'alléger les positions sur les valeurs agricoles BRVM ou d'attendre un signal de reprise des matières premières avant de renforcer.",
        },
      ],
      macro: [
        { label: 'PIB UEMOA 2015', value: '+6,6%', trend: 'up', signal: 'Cycle de croissance intact malgré la correction boursière', signification: 'Produit Intérieur Brut en hausse malgré la baisse des matières premières — signe que l\'économie UEMOA est diversifiée et ne dépend pas uniquement du cacao ou du pétrole.' },
        { label: 'BRVM Composite 2015', value: '+17,8%', trend: 'up', signal: 'Meilleure performance parmi les bourses africaines 2015', signification: 'Performance annuelle de l\'indice BRVM. Malgré la baisse des matières premières, la bourse résiste grâce aux télécoms et aux bancaires qui compensent les pertes des agro-industriels.' },
        { label: 'Cours du cacao', value: '2 800 $/t', trend: 'down', signal: '-20% depuis le pic de 2014 — pression sur valeurs agro BRVM', signification: 'Prix mondial du cacao. La baisse impacte directement les revenus et les marges des sociétés cotées BRVM qui produisent ou transforment du cacao et ses dérivés.' },
        { label: 'Cours huile de palme', value: '640 $/t', trend: 'down', signal: '-20% — impact direct sur PALM CI, SOGB, SAPH', signification: 'Prix mondial de l\'huile de palme. PALM CI et SOGB sont directement exposés — une baisse des cours réduit leur chiffre d\'affaires et leurs marges bénéficiaires.' },
        { label: 'Abonnés data mobile UEMOA', value: '+45% YoY', trend: 'up', signal: 'Explosion de la data mobile — très favorable aux télécoms BRVM', signification: 'Croissance annuelle des utilisateurs d\'internet mobile dans la zone UEMOA. Ce chiffre est un moteur de croissance direct pour SONATEL et Orange CI, dont les revenus data augmentent.' },
        { label: 'Taux directeur BCEAO', value: '4,25%', trend: 'flat', signal: 'Stable — 7 ans sans changement — conditions de crédit inchangées', signification: 'Le taux directeur est inchangé depuis 2009. Cette stabilité prolongée permet aux banques et entreprises de planifier leurs investissements sur le long terme.' },
      ],
    },
    '2019': {
      kofiPresentation:
        "9 ans. La BRVM dépasse 5 000 milliards de capitalisation. Le mobile money explose dans toute l'UEMOA. Tes dividendes cumulés sur 9 ans représentent probablement une somme significative. Et tu as 500 000 FCFA supplémentaires. C'est le moment de te poser une question de stratégie : tu vises encore la croissance, ou tu commences à construire un flux de revenus ?",
      kofiIntro:
        "9 ans. Ton portefeuille a traversé un bull run et une correction. Tu as accumulé des dividendes. Le mobile money explose. C'est une étape charnière : tu peux continuer à chercher la croissance maximale, ou commencer à construire un flux de revenus. Les deux sont valides — mais ils impliquent des choix différents.",
      news: [
        {
          src: 'BRVM — Rapport 2018',
          date: '31 déc. 2018',
          tag: 'Record de capitalisation',
          sentiment: 'positive',
          text: "La BRVM franchit les 5 000 milliards FCFA de capitalisation boursière. SONATEL dépasse les 20 000 FCFA pour la première fois. Les bancaires publient des résultats records portés par le boom du crédit à la consommation. La BRVM accueille 2 nouvelles sociétés en 2018, portant le total à 46 titres cotés.",
        },
        {
          src: 'Jeune Afrique',
          date: '15 janv. 2019',
          tag: 'Mobile money : la révolution silencieuse',
          sentiment: 'positive',
          text: "Orange Money dépasse 15 millions d'utilisateurs en zone UEMOA. Wave CI, lancé en 2018, gagne 2 millions d'utilisateurs en quelques mois avec des frais proches de zéro. Les transferts d'argent mobile ont progressé de +60% en 2018. Ce changement structurel bénéficie directement à SONATEL et Orange CI à travers leurs services de données et d'interconnexion.",
        },
        {
          src: 'BCEAO',
          date: '20 janv. 2019',
          tag: 'Avertissement SICABLE',
          sentiment: 'warning',
          text: "SICABLE CI (câblerie ivoirienne) suspend son dividende après des difficultés opérationnelles liées à la concurrence et à la baisse des investissements en infrastructure. SETAO CI est également sous surveillance. Rappel : même sur la BRVM, certains titres déçoivent. La diversification protège contre les mauvaises surprises individuelles.",
        },
        {
          src: 'Agence Ecofin',
          date: '10 janv. 2019',
          tag: 'Risque concentration SONATEL',
          sentiment: 'warning',
          text: "SONATEL représente désormais plus de 30% de la capitalisation totale de la BRVM. Sa surperformance tire l'indice à la hausse — mais crée aussi une dépendance : si SONATEL corrige, le BRVM Composite suit mécaniquement. Les analystes recommandent une diversification géographique hors CI/Sénégal pour les portefeuilles importants.",
        },
      ],
      macro: [
        { label: 'PIB UEMOA 2018', value: '+6,5%', trend: 'up', signal: 'L\'un des cycles de croissance les plus solides d\'Afrique', signification: 'Produit Intérieur Brut : la zone UEMOA maintient un rythme de croissance supérieur à 6% depuis 8 ans — une performance remarquable à l\'échelle mondiale.' },
        { label: 'Capitalisation BRVM', value: '5 000+ Mds', trend: 'up', signal: 'Record historique — BRVM devient référence continentale', signification: 'Valeur totale de toutes les entreprises cotées à la BRVM. Ce record traduit la confiance des investisseurs (locaux et étrangers) dans les fondamentaux de la zone UEMOA.' },
        { label: 'Inflation UEMOA', value: '+0,9%', trend: 'down', signal: 'Très faible — pouvoir d\'achat préservé, pas de pression sur les taux', signification: 'Hausse générale des prix quasi nulle. Cela permet à la BCEAO de maintenir ses taux bas, ce qui est favorable aux entreprises endettées et à l\'investissement boursier.' },
        { label: 'Volumes mobile money', value: '+60% YoY', trend: 'up', signal: 'Wave et Orange Money transforment l\'économie informelle en CI', signification: 'Croissance des transactions réalisées via téléphone mobile (Orange Money, Wave). Cette révolution financière profite directement aux télécoms cotés à la BRVM.' },
        { label: 'Transferts diaspora UEMOA', value: '+8%', trend: 'up', signal: 'Flux entrants en hausse — soutien à la consommation intérieure', signification: 'Argent envoyé par les Africains de la diaspora vers leurs familles en zone UEMOA. Ces flux soutiennent la consommation et la croissance économique réelle.' },
        { label: 'Taux directeur BCEAO', value: '4,25%', trend: 'flat', signal: 'Stable — 9 ans sans changement depuis 2009', signification: 'Le taux directeur n\'a pas bougé depuis 9 ans. Cette stabilité exceptionnelle est un signal de confiance dans la solidité de l\'économie UEMOA.' },
      ],
    },
    '2022': {
      kofiPresentation:
        "12 ans. La COVID est passée. La BRVM a rebondi. Orange CI entre en bourse — la plus grande introduction de l'histoire de la BRVM. Mais l'inflation mondiale arrive avec la guerre en Ukraine. Dernier réinvestissement avant le bilan final de 2025. Ce choix va déterminer ta performance sur les 3 dernières années.",
      kofiIntro:
        "12 ans. COVID passé, BRVM au record. Mais inflation mondiale et premier relèvement de taux BCEAO depuis 10 ans. Orange CI entre en bourse — la plus grande IPO de l'histoire BRVM. Ce dernier investissement va clore ton parcours. Penses-y : tu es à 3 ans du bilan final.",
      news: [
        {
          src: 'BRVM — Bilan 2022',
          date: '31 déc. 2022',
          tag: 'Résilience remarquable',
          sentiment: 'positive',
          text: "La BRVM affiche +0,46% sur 2022 — quasi stabilité. Pendant ce temps, les grandes bourses mondiales s'effondrent : S&P 500 -20%, EuroStoxx -15%, Nasdaq -33%. La BRVM confirme sa faible corrélation avec les marchés développés. Les dividendes versés sur l'année atteignent un record historique pour les actionnaires BRVM.",
        },
        {
          src: 'BRVM — Introduction Orange CI',
          date: '14 janv. 2022',
          tag: 'IPO historique',
          sentiment: 'positive',
          text: "Orange CI fait son introduction en bourse à la BRVM. Prix d'introduction : 1 050 FCFA par action. Capitalisation initiale : 1 100 milliards FCFA. C'est la plus grande introduction de l'histoire de la BRVM. Orange CI devient immédiatement le 2e titre le plus capitalisé, derrière SONATEL. Les investisseurs institutionnels ont massivement souscrit à l'offre.",
        },
        {
          src: 'FMI / BCEAO',
          date: '20 janv. 2022',
          tag: 'Inflation et hausse de taux',
          sentiment: 'warning',
          text: "L'inflation en zone UEMOA atteint 7,4% en 2022 suite à la guerre en Ukraine et la hausse des prix alimentaires et énergétiques mondiaux. La BCEAO relève son taux directeur de 4,25% à 4,75% — premier mouvement depuis 2010. Impact limité sur les valorisations BRVM à court terme, mais les sociétés fortement endettées seront à surveiller.",
        },
        {
          src: 'Jeune Afrique',
          date: '25 janv. 2022',
          tag: 'Coups d\'État Sahel : impact BRVM limité',
          sentiment: 'warning',
          text: "Les coups d'état au Mali (2021) et au Burkina Faso (2022) créent de l'instabilité régionale. Impact boursier limité sur les sociétés BRVM car la plupart d'entre elles ont une exposition au Sahel faible (< 10% du CA). SONATEL est plus exposé (Mali représente ~15% de ses revenus) — à surveiller. Les bancaires opérant au Mali pourraient avoir des créances douteuses supplémentaires.",
        },
      ],
      macro: [
        { label: 'BRVM Composite 2021', value: '+22%', trend: 'up', signal: 'Rebond post-COVID confirmé — effacement complet des pertes 2020', signification: 'Performance annuelle de l\'indice BRVM. Le rebond de +22% en 2021 efface la correction de 2020 liée au COVID et confirme la résilience du marché ouest-africain.' },
        { label: 'Capitalisation BRVM', value: '7 560 Mds FCFA', trend: 'up', signal: 'Record historique porté par l\'IPO Orange CI (1 100 Mds FCFA)', signification: 'Valeur totale des sociétés cotées. Ce record est principalement dû à l\'entrée d\'Orange CI en bourse — la plus grande introduction de l\'histoire de la BRVM.' },
        { label: 'Inflation UEMOA 2022', value: '+7,4%', trend: 'down', signal: 'Choc importé — guerre Ukraine + hausse des prix alimentaires mondiaux', signification: 'Hausse des prix en zone UEMOA atteignant un niveau inhabituel. Causée par la guerre en Ukraine qui a fait exploser les prix du blé, de l\'énergie et des engrais importés.' },
        { label: 'S&P 500 (référence US)', value: '-20% en 2022', trend: 'down', signal: 'La BRVM (+0,5%) fait bien mieux que Wall Street en 2022', signification: 'L\'indice américain S&P 500 représente les 500 plus grandes entreprises US. Sa comparaison avec la BRVM illustre la faible corrélation entre les marchés africains et occidentaux.' },
        { label: 'Taux directeur BCEAO', value: '4,75%', trend: 'up', signal: 'Premier relèvement depuis 2010 — réponse à l\'inflation importée', signification: 'La BCEAO relève son taux directeur pour la première fois en 12 ans. C\'est une réponse à l\'inflation mondiale. Cela renchérit le crédit et peut peser sur les valorisations.' },
        { label: 'PIB UEMOA 2021', value: '+5,7%', trend: 'up', signal: 'Rebond fort post-COVID — économie réelle solide malgré les chocs externes', signification: 'La zone UEMOA rebondit après le ralentissement COVID de 2020. La croissance de 5,7% montre la résilience de l\'économie réelle malgré les tensions géopolitiques mondiales.' },
      ],
    },
  },

  fundamentalsByYear: {
    '2010': {
      SNTS: { per: '9,8×', pbr: '2,1×', bna: '+12%', div: 700, cours: 14000, note: 'Leader télécom UEMOA (Sénégal, Mali, Guinée). Filiale Orange depuis 1997. 20 ans de dividendes ininterrompus. Revenus récurrents issus de la data mobile en forte croissance. 70% des revenus viennent du Sénégal — peu exposé au risque politique ivoirien.', kofiAnalysis: 'PER 9,8× sous la moyenne BRVM (11×). Valorisation attractive avec dividende solide de 5%. Exposition géographique diversifiée = risque politique CI limité. Candidat principal pour une pondération significative.' },
      SGBC: { per: '7,2×', pbr: '1,3×', bna: '+15%', div: 500, cours: 9000, note: '1ère banque ivoirienne cotée. Filiale Société Générale France. Tier 1 à 14,2%. Réseau de 50+ agences. Activité 100% locale — aucune exposition aux produits dérivés internationaux (CDO, MBS). Bénéfices en hausse de +15% malgré la crise mondiale.', kofiAnalysis: 'PER 7,2× = décote significative vs qualité bilancielle. Tier 1 14,2% très au-dessus du minimum. Croissance BNA +15%. Rapport risque/rendement excellent en 2010.' },
      PALC: { per: '6,5×', pbr: '0,9×', bna: '+8%', div: 250, cours: 5200, note: "Producteur d'huile de palme, filiale SIFCA. P/B < 1 : se traite sous sa valeur comptable — signal rare sur la BRVM. Exposition aux cours mondiaux du palm oil (en hausse depuis 2009). Dividende régulier depuis 2004. Titre cyclique : surperforme quand les matières premières montent.", kofiAnalysis: 'P/B < 1 = acheté sous la valeur comptable des actifs. Signal de sous-valorisation. Mais attention : titre cyclique — dépend des cours mondiaux de l\'huile de palme. Intéressant si conviction sur les matières premières.' },
      SLBC: { per: '11,2×', pbr: '2,8×', bna: '+9%', div: 800, cours: 11000, note: 'Quasi-monopole sur la bière ivoirienne. Revenus défensifs — la consommation de bière est peu sensible aux cycles économiques. Dividende de 7,3% : l\'un des plus élevés de la BRVM. Valeur refuge par excellence. Croissance portée par l\'expansion de la classe moyenne ivoirienne.', kofiAnalysis: 'Rendement dividende 7,3% = flux de revenus passifs très solide. Modèle défensif : peu corrélé au cycle économique. Joue le rôle de stabilisateur dans un portefeuille par ailleurs plus offensif.' },
      SIBC: { per: '5,8×', pbr: '0,8×', bna: '+18%', div: 200, cours: 3800, note: 'Société Ivoirienne de Banque, filiale Attijariwafa. Forte croissance BNA (+18%) — la plus élevée du lot. P/B < 1 : décote significative. Moins liquide que les grandes capitalisations. Profil : fort potentiel de croissance, risque de liquidité à accepter.', kofiAnalysis: 'BNA +18% = croissance la plus forte du lot. P/B 0,8× = décote réelle. Contrepartie : moins de liquidité. Pour un investisseur avec un horizon 3+ ans, ce profil croissance/décote est historiquement très rémunérateur.' },
      CIEC: { per: '4,2×', pbr: '0,7×', bna: '+6%', div: 90, cours: 1800, note: 'Concessionnaire de la distribution électricité CI. Revenus contractuels réguliers — indépendants du cycle économique. PER 4,2× : très bas, dû au manque de liquidité du titre (pas à une faiblesse fondamentale). Stabilisateur de portefeuille : faible volatilité dans les deux sens.', kofiAnalysis: 'PER 4,2× = apparence de décote, mais dû à la faible liquidité. Revenus contractuels stables. Rôle : stabilisateur de portefeuille. Utile pour réduire la volatilité globale si le reste du portefeuille est offensif.' },
    },
    '2013': {
      SNTS: { per: '13×', pbr: '3,1×', bna: '+18%', div: 900, cours: 18500, note: "Croissance data mobile accélérée. BNA +18%. Dividende porté à 900 FCFA. Mobile money en émergence.", kofiAnalysis: 'PER monte à 13× — moins de marge de sécurité qu\'en 2010. Mais croissance BNA toujours solide à +18%. Dividende en hausse. La thèse data mobile se confirme.' },
      SGBC: { per: '9×', pbr: '1,8×', bna: '+18%', div: 700, cours: 14000, note: "Bénéfices en hausse de +18%. Portefeuille crédit doublé. Dividende en hausse.", kofiAnalysis: 'Toujours bien valorisé (PER ~9×). Bénéfices en hausse de +18%. Encore de la marge de progression. Bull run peut être proche de son sommet.' },
      PALC: { per: '8×', pbr: '1,2×', bna: '+10%', div: 320, cours: 6800, note: 'Cours palm oil soutenu. Progression de +31% depuis 2010.', kofiAnalysis: 'Bonne progression, mais cours cyclique. Surveiller les matières premières.' },
      SLBC: { per: '14×', pbr: '3,5×', bna: '+12%', div: 1000, cours: 16000, note: 'Valorisation tendue après +45%. Dividende en hausse.', kofiAnalysis: 'PER 14× = valorisation tendue vs 2010. Dividende reste attractif. Candidat à l\'allègement partiel pour rotation.' },
      SIBC: { per: '7×', pbr: '1,1×', bna: '+22%', div: 280, cours: 5500, note: 'Croissance exceptionnelle. +45% depuis 2010.', kofiAnalysis: 'BNA +22% — accélération. Valorisation encore raisonnable. Candidat au renforcement si sous-représenté.' },
      CIEC: { per: '5×', pbr: '0,9×', bna: '+8%', div: 120, cours: 2400, note: '+33% depuis 2010. Rôle stabilisateur maintenu.', kofiAnalysis: 'Progression modérée mais stable. Continue de jouer son rôle défensif.' },
    },
    '2016': {
      SNTS: { per: '10×', pbr: '2,8×', bna: '+15%', div: 850, cours: 16500, note: 'Data mobile explose. -11% depuis son sommet. Point d\'entrée attractif.', kofiAnalysis: 'Correction de -11% depuis le sommet = opportunité d\'entrée. Thèse data mobile intacte. Dividende 850 FCFA maintenu.' },
      SGBC: { per: '8×', pbr: '1,5×', bna: '+8%', div: 600, cours: 13500, note: '-18% depuis 2013. Résultats solides malgré la correction.', kofiAnalysis: 'Correction sectorielle, pas fondamentale. BNA +8%. Bilan solide. Point d\'achat intéressant.' },
      PALC: { per: '5×', pbr: '0,7×', bna: '-12%', div: 200, cours: 4200, note: '-19% depuis 2013. Matières premières sous pression. P/B < 1.', kofiAnalysis: 'Baisse conjoncturelle (matières premières), pas fondamentale. P/B 0,7× = décote sur actifs. Patient required — rebond probable quand palm oil remonte.' },
      SLBC: { per: '11×', pbr: '2,9×', bna: '+10%', div: 1100, cours: 17000, note: 'Résiste bien. Défensif confirme son rôle. Dividende en hausse.', kofiAnalysis: 'Meilleure résistance à la correction. Dividende 1 100 FCFA = flux de revenus excellent. Valeur refuge prouvée.' },
      SIBC: { per: '6×', pbr: '1,0×', bna: '+14%', div: 300, cours: 5800, note: 'Croissance crédit +14%. Résistance bancaire confirmée.', kofiAnalysis: 'Performance relative solide. Croissance BNA maintenue à +14%. Ratio crédit sain.' },
      CIEC: { per: '4,5×', pbr: '0,8×', bna: '+5%', div: 100, cours: 2200, note: 'Stabilisateur. Performance modérée mais régulière.', kofiAnalysis: 'Continue son rôle défensif. Faible volatilité confirmée en période de correction.' },
    },
    '2019': {
      SNTS: { per: '11×', pbr: '3,2×', bna: '+12%', div: 1000, cours: 20000, note: 'Record historique. Mobile money transforme les revenus. Wave concurrent à surveiller.', kofiAnalysis: 'Sommet record 20 000 FCFA. PER 11× = valorisation juste. Risque de concentration si >30% du portefeuille. Candidat à l\'allègement partiel.' },
      SGBC: { per: '9×', pbr: '2,0×', bna: '+10%', div: 800, cours: 16500, note: 'Résultats records. Digitalisation bancaire accélère.', kofiAnalysis: 'Valorisation raisonnable. Croissance stable. Dividende solide. Maintenir la pondération.' },
      PALC: { per: '7×', pbr: '1,0×', bna: '+15%', div: 350, cours: 7200, note: 'Rebond des matières premières. +31% depuis le point bas 2016.', kofiAnalysis: 'Rebond confirmé après la correction 2016. P/B revenu à 1,0×. Patient rewarded. La thèse cyclique s\'est réalisée.' },
      SLBC: { per: '13×', pbr: '3,8×', bna: '+8%', div: 1600, cours: 22000, note: 'Dividende record 1 600 FCFA. Flux de revenus passifs maximisé.', kofiAnalysis: 'Dividende exceptionnel de 1 600 FCFA. Valorisation tendue mais justifiée par la régularité. Idéal pour stratégie revenus.' },
      SIBC: { per: '8×', pbr: '1,3×', bna: '+18%', div: 400, cours: 6500, note: 'Forte croissance maintenue. Sous-représenté vs qualité.', kofiAnalysis: 'BNA +18% = accélération continue. Sous-représenté dans beaucoup de portefeuilles = candidat au renforcement.' },
      CIEC: { per: '5×', pbr: '0,9×', bna: '+6%', div: 110, cours: 2600, note: 'Stable. Continue de jouer son rôle défensif.', kofiAnalysis: 'Rôle défensif maintenu. À conserver si besoin de stabilité dans le portefeuille.' },
    },
    '2022': {
      SNTS: { per: '12×', pbr: '3,0×', bna: '+8%', div: 950, cours: 19000, note: 'Légère correction post-2019. Exposition Sahel à surveiller. Mali ~15% des revenus.', kofiAnalysis: 'Correction depuis le sommet 2019. Risque géopolitique Sahel. Dividende maintenu. À pondérer selon exposition globale du portefeuille.' },
      SGBC: { per: '11×', pbr: '2,5×', bna: '+15%', div: 900, cours: 19000, note: 'Résultats 2021 records. Digitalisation bancaire accélère la rentabilité. Dividende 900 FCFA.', kofiAnalysis: 'Résultats records. Digitalisation = ROE en hausse. Dividende 900 FCFA solide. Candidat au renforcement selon budget disponible.' },
      PALC: { per: '6×', pbr: '0,8×', bna: '+10%', div: 300, cours: 5500, note: 'Légère pression matières premières. P/B attractif.', kofiAnalysis: 'Valorisation attractive de nouveau. Titre cyclique dans une phase neutre des matières premières.' },
      SLBC: { per: '14×', pbr: '4,0×', bna: '+7%', div: 1700, cours: 23000, note: 'Dividende 1 700 FCFA — record. Valorisation tendue.', kofiAnalysis: 'Dividende record mais valorisation élevée. Pour portefeuille revenus, à maintenir. Pour portefeuille croissance, alléger.' },
      SIBC: { per: '7×', pbr: '1,2×', bna: '+20%', div: 450, cours: 7000, note: 'Accélération BNA remarquable. Sous-valorisé vs croissance.', kofiAnalysis: 'BNA +20% = meilleure croissance du lot. Valorisation encore raisonnable. Candidat au renforcement si sous-représenté.' },
      CIEC: { per: '5×', pbr: '0,9×', bna: '+5%', div: 120, cours: 2800, note: 'Défensif stable. Inflation impacte peu les revenus contractuels.', kofiAnalysis: 'Résiste bien à l\'inflation (revenus contractuels indexés). Maintenir si besoin de stabilité.' },
      ORCI: { per: '15×', pbr: 'N/A', bna: 'IPO', div: 0, cours: 1050, note: "2e télécom de la BRVM. Revenus data en forte croissance. Potentiel de dividende dès 2023. Plus grande IPO de l'histoire BRVM.", kofiAnalysis: "IPO à 1 050 FCFA. Capitalisation initiale 1 100 Mds FCFA. Souscrire sur conviction fondamentale data mobile — pas sur l'euphorie médiatique. Volatilité des premières séances probable." },
    },
  },

  dividendsByYear: {
    '2010': { SNTS: 700, SGBC: 500, PALC: 250, SLBC: 800, SIBC: 200, CIEC: 90 },
    '2013': { SNTS: 900, SGBC: 700, PALC: 320, SLBC: 1000, SIBC: 280, CIEC: 120 },
    '2016': { SNTS: 850, SGBC: 600, PALC: 200, SLBC: 1100, SIBC: 300, CIEC: 100 },
    '2019': { SNTS: 1000, SGBC: 800, PALC: 350, SLBC: 1600, SIBC: 400, CIEC: 110 },
    '2022': { SNTS: 950, SGBC: 900, PALC: 300, SLBC: 1700, SIBC: 450, CIEC: 120, ORCI: 0 },
  },

  availableActionsByYear: {
    '2010': {
      canBuy: ['SNTS', 'SGBC', 'PALC', 'SLBC', 'SIBC', 'CIEC'],
      canSell: [],
      consequences: [
        { condition: 'nbTitres >= 3', positive: true, result: '+35 à +50% en moyenne sur 3 ans, dividendes cumulés ~2 200 FCFA/action SONATEL+SGBCI', lesson: 'La diversification sectorielle (télécoms + bancaires + défensif) réduit le risque sans sacrifier le rendement.' },
        { condition: 'nbTitres === 1', positive: false, result: 'Performance variable selon le titre choisi. Risque maximal et souvent choix émotionnel.', lesson: 'La concentration amplifie les résultats dans les deux sens. Sur la BRVM avec 6 titres disponibles, 1 seule ligne est une erreur de diversification.' },
        { condition: 'holdCash === true', positive: false, result: '0% de rendement. +87% de BRVM Composite manqué sur 3 ans.', lesson: "L'aversion au risque mal calibrée a un coût réel et mesurable. Sur une économie en croissance à +4,1% avec des bilans bancaires solides, rester en cash était le vrai risque." },
      ],
    },
    '2013': {
      canBuy: ['SNTS', 'SGBC', 'PALC', 'SLBC', 'SIBC', 'CIEC'],
      canSell: ['SNTS', 'SGBC', 'PALC', 'SLBC', 'SIBC', 'CIEC'],
      consequences: [
        { condition: 'rebalance === true', positive: true, result: '+38% moyenne portefeuille sur 2013-2016 + dividendes cumulés.', lesson: 'Le rééquilibrage discipliné — vendre un peu des gagnants, renforcer les sous-représentés — est supérieur au suivi de tendance sur le long terme.' },
        { condition: 'momentum === true', positive: false, result: 'Entrée à des valorisations tendues. Correction de 2014-2015 efface une partie des gains récents.', lesson: 'Le biais de momentum est dangereux après un bull run de +87%. Les meilleures performances passées sont les plus risquées pour les nouvelles entrées.' },
        { condition: 'sellAll === true', positive: false, result: 'Performance cristallisée à +43%. Marché progresse encore de +35% sur 3 ans supplémentaires.', lesson: "Market timing systématique échoue dans 94% des études sur 20 ans. 'Secure profits' semble rationnel mais prive du rendement long terme." },
      ],
    },
    '2016': {
      canBuy: ['SNTS', 'SGBC', 'PALC', 'SLBC', 'SIBC', 'CIEC'],
      canSell: ['SNTS', 'SGBC', 'PALC', 'SLBC', 'SIBC', 'CIEC'],
      consequences: [
        { condition: 'rotationAgro === true', positive: true, result: 'SONATEL progresse à 20 000 en 2019. Bon choix sur le long terme.', lesson: 'La rotation sectorielle fondée sur les fondamentaux (data vs matières premières) produit de la valeur.' },
        { condition: 'panicSell === true', positive: false, result: 'Cristallise des pertes sur des actifs sains qui rebondissent ensuite de +31% pour PALM CI.', lesson: "L'aversion aux pertes est le biais le plus documenté en finance comportementale. Il pousse à vendre trop tôt des positions qui avaient besoin de patience." },
        { condition: 'distinguishBaisse === true', positive: true, result: 'Ton portefeuille surperforme car tu évites les vrais problèmes tout en maintenant l\'exposition aux baisses temporaires.', lesson: 'La baisse conjoncturelle ne change pas la qualité d\'un business. La baisse fondamentale est irréversible. Les traiter pareil est l\'erreur la plus coûteuse en bourse.' },
      ],
    },
    '2019': {
      canBuy: ['SNTS', 'SGBC', 'PALC', 'SLBC', 'SIBC', 'CIEC'],
      canSell: ['SNTS', 'SGBC', 'PALC', 'SLBC', 'SIBC', 'CIEC'],
      consequences: [
        { condition: 'rebalanceSonatel === true', positive: true, result: 'Portefeuille mieux équilibré. SIB progresse à 6 500 (+45%) sur 3 ans.', lesson: "À 9 ans d'investissement, le rééquilibrage n'est plus optionnel — c'est de la maintenance obligatoire. Une position qui représente 40%+ de ton portefeuille est un risque non rémunéré." },
        { condition: 'concentration === true', positive: false, result: 'Quand SONATEL corrige en 2021-2022, ton portefeuille amplifie la correction.', lesson: "La surperformance passée d'un titre ne justifie pas de lui laisser prendre plus de 30-35% de ton portefeuille." },
      ],
    },
    '2022': {
      canBuy: ['SNTS', 'SGBC', 'PALC', 'SLBC', 'SIBC', 'CIEC', 'ORCI'],
      canSell: ['SNTS', 'SGBC', 'PALC', 'SLBC', 'SIBC', 'CIEC'],
      consequences: [
        { condition: 'ipoOrangeCI === true', positive: true, result: "Orange CI s'apprécie de +15-20% sur 2023-2025. Dividende lancé dès 2023.", lesson: "Participer à une IPO de qualité sur un marché que tu connais bien est une stratégie valide. La clé : souscrire sur conviction fondamentale, pas sur l'enthousiasme médiatique." },
        { condition: 'cashHold === true', positive: false, result: "Les 500K non investis perdent en pouvoir d'achat (-7,4%/an d'inflation) et ne captent pas la progression BRVM.", lesson: "L'inflation est précisément la raison d'investir en actions, pas de rester en cash. Les sociétés cotées répercutent généralement la hausse des prix sur leurs revenus." },
      ],
    },
  },

  lessonsByYear: {
    '2010': [
      { title: 'Leçon 1 — Lire un PER en contexte', content: "Le PER (Price-to-Earnings Ratio) mesure combien tu paies pour 1 FCFA de bénéfice. Un PER de 9,8× pour SONATEL signifie que tu paies 9,8 FCFA pour chaque FCFA de bénéfice annuel généré. Sur la BRVM, la moyenne historique est autour de 11×. Un PER en dessous de la moyenne peut indiquer une sous-valorisation — ou un risque non perçu. La clé : comprendre POURQUOI le marché valorise ainsi, pas juste comparer les chiffres." },
      { title: 'Leçon 2 — Le P/B et la valeur comptable', content: "Le P/B (Price-to-Book) compare le cours de bourse à la valeur comptable de l'entreprise (actifs − dettes). Un P/B < 1 (comme PALM CI à 0,9×) signifie que tu achètes l'entreprise moins cher que ce que vaut son patrimoine sur le papier. C'est un signal rare et souvent intéressant — mais attention : une entreprise peut valoir moins que ses actifs si ses bénéfices futurs sont faibles." },
      { title: 'Leçon 3 — La puissance des dividendes', content: "SOLIBRA verse 800 FCFA par action sur un cours de 11 000 FCFA, soit un rendement de 7,3%. Sur 15 ans, en cumulant les dividendes reçus chaque année, tu peux recevoir en flux de trésorerie une valeur équivalente à plusieurs fois ta mise initiale — indépendamment de l'évolution du cours. C'est le principe du revenu passif en bourse." },
    ],
    '2013': [
      { title: 'Leçon 4 — La règle du rééquilibrage', content: "Quand un titre monte beaucoup plus que les autres, son poids dans ton portefeuille augmente — et donc ton risque se concentre. Si SOLIBRA représentait 20% de ton portefeuille en 2010 et a monté de +45%, il représente peut-être 27% maintenant. La technique du rééquilibrage consiste à vendre une partie des gagnants et renforcer les retardataires pour revenir à ton allocation cible. Ce n'est pas intuitif — mais c'est discipliné." },
      { title: "Leçon 5 — Attention à l'euphorie de marché", content: "Après +87% en 3 ans, le sentiment dominant est l'euphorie. C'est précisément le moment où les investisseurs moins expérimentés entrent massivement — souvent trop tard. L'indicateur de Buffett : quand les chauffeurs de taxi te donnent des conseils boursiers, c'est que le marché est probablement surévalué. La vigilance après une forte hausse est une compétence essentielle." },
    ],
    '2016': [
      { title: 'Leçon 6 — La rotation sectorielle', content: "Les secteurs ne performent pas tous en même temps. En 2016, les agricoles souffrent (matières premières en baisse) tandis que les télécoms excellent (explosion data mobile). Un investisseur éduqué surveille les cycles sectoriels et rééquilibre son exposition selon la phase du cycle économique. Sur la BRVM : bancaires et télécoms résistent généralement mieux aux crises que l'agriculture." },
      { title: 'Leçon 7 — Ne pas confondre baisse de cours et détérioration fondamentale', content: "PALM CI a baissé à cause des cours mondiaux de l'huile de palme, pas parce que la société est mal gérée. Sa capacité de production reste intacte, son management est solide, ses dividendes continuent. Quand les cours des matières premières repartiront à la hausse, PALM CI suivra. Savoir distinguer une baisse temporaire d'une dégradation structurelle est l'une des compétences les plus précieuses en bourse." },
    ],
    '2019': [
      { title: 'Leçon 8 — Le risque de concentration', content: "SONATEL pèse +30% de la BRVM. Si tu détiens 40% de ton portefeuille en SONATEL, ton portefeuille est très corrélé à un seul titre. La diversification ne signifie pas détenir beaucoup de titres — elle signifie que tes positions ne soient pas trop corrélées. Une règle pratique : aucun titre ne devrait dépasser 25-30% de ton portefeuille, même si c'est un excellent business." },
      { title: 'Leçon 9 — Croissance vs Dividendes : choisir sa stratégie', content: "À 9 ans d'investissement, tu peux te poser la question : veux-tu maximiser la valeur finale de ton portefeuille, ou commencer à générer un revenu passif régulier ? SOLIBRA (7,3% de rendement) te paye chaque année. SIB (forte croissance BNA) peut multiplier ta mise. Les deux sont valides — mais répondent à des objectifs différents. L'âge et le projet de vie doivent guider ce choix." },
    ],
    '2022': [
      { title: 'Leçon 10 — La BRVM comme diversificateur de portefeuille mondial', content: "En 2022, la BRVM est restée stable pendant que Wall Street perdait -20%. Cette décorrélation est précieuse : la BRVM évolue principalement selon les fondamentaux des économies UEMOA, pas selon les cycles financiers américains ou européens. Pour un investisseur sophistiqué, investir sur la BRVM n'est pas seulement un pari sur l'Afrique — c'est aussi une stratégie de diversification globale intelligente." },
      { title: "Leçon 11 — Comment analyser une IPO", content: "L'introduction d'Orange CI est un événement rare. Pour évaluer si tu dois souscrire : compare le PER d'introduction au secteur (télécoms BRVM). Regarde le bilan : endettement, free cash-flow, potentiel de dividende. Méfie-toi de l'euphorie médiatique autour des grandes IPO — les premières séances sont souvent volatiles. La règle : n'investis dans une IPO que si tu investirais dans la société cotée depuis 2 ans." },
      { title: 'Leçon finale — Les 3 règles de l\'investisseur BRVM long terme', content: "1. La patience est le seul avantage compétitif gratuit. Les marchés récompensent ceux qui restent investis à travers les cycles.\n\n2. Les dividendes représentent souvent 30 à 40% du rendement total. Un investisseur qui réinvestit ses dividendes accélère exponentiellement la croissance de son capital sur le long terme.\n\n3. L'analyse fondamentale locale protège des paniques globales. La BRVM a ses propres fondamentaux — une crise à New York ou en Europe n'est pas automatiquement une raison de vendre à Abidjan." },
    ],
  },

  quizByYear: {
    '2010': [{ question: "SONATEL se négocie à 14 000 FCFA avec un PER de 9,8×. La moyenne BRVM est de 11×. Que peux-tu en déduire ?", options: ["Le titre est surévalué — il faut éviter", "Le titre semble sous-valorisé vs la moyenne, potentiellement une opportunité", "Le PER ne dit rien sans connaître la croissance des bénéfices"], answer: 1, explanation: "En fait, B et C sont toutes les deux correctes. Le PER de 9,8× est effectivement sous la moyenne BRVM (signal positif), MAIS un PER seul ne suffit jamais. Pour SONATEL en 2010, les bénéfices croissent de +12% — ce qui renforce l'attractivité. La règle d'or : compare toujours le PER au taux de croissance des bénéfices (ratio PEG). Si PEG < 1, le titre est potentiellement bon marché même avec un PER élevé." }],
    '2013': [{ question: "Ton portefeuille SONATEL a monté de +32% depuis 2010. Tu peux maintenant :", options: ["Vendre tout SONATEL pour sécuriser les gains", "Garder la même quantité et réinvestir les nouveaux 500K dans des titres moins chers", "Renforcer SONATEL car il monte — suivre la tendance"], answer: 1, explanation: "Réponse B. Vendre tout (A) est une décision émotionnelle — tu perdrais les dividendes futurs et la croissance long terme. Renforcer ce qui monte (C) est le biais de momentum : dangereux après +87% de marché. La bonne approche : maintenir tes positions rentables ET déployer les nouveaux fonds sur des titres qui n'ont pas encore rattrapé leur valeur fondamentale." }],
    '2016': [{ question: "PALM CI a perdu -19% depuis 2013 à cause de la chute des cours de l'huile de palme. Que fais-tu ?", options: ["Vente immédiate — une position perdante doit être soldée", "Conservation — la baisse est externe (matières premières), pas fondamentale", "Renforcement — une bonne société moins chère est une opportunité"], answer: 1, explanation: "Réponses B et C. Vendre dans la panique (A) cristallise une perte sur un actif sain. Si tu as du capital disponible ET conviction que les matières premières vont se reprendre, C est défendable. Si tu es incertain sur les matières premières, B (conserver) est prudent. L'essentiel : ne jamais vendre une bonne société pour une raison externe et temporaire." }],
    '2019': [{ question: "SONATEL a progressé de +43% depuis 2010. Il représente maintenant 35% de ton portefeuille. Que fais-tu ?", options: ["Je ne change rien — SONATEL est une excellente société, je conserve", "J'allège SONATEL de 10-15% et réinvestis dans des titres sous-représentés", "Je vends tout SONATEL pour diversifier"], answer: 1, explanation: "Réponse B. A est émotionnellement compréhensible (on ne vend pas ce qui marche) mais crée un risque de concentration élevé. C est excessif — tu vendrais une excellente société. B est la bonne approche : alléger progressivement une position trop lourde et réinvestir dans des titres de qualité moins représentés." }],
    '2022': [{ question: "Le S&P 500 perd -20% en 2022. Un ami te dit de vendre tes actions BRVM pour 'sécuriser'. Que fais-tu ?", options: ["Il a raison — quand Wall Street chute, tout chute", "Tu regardes les fondamentaux BRVM : si rien n'a changé, tu ne vends pas", "Tu vends la moitié pour 'limiter les risques'"], answer: 1, explanation: "Réponse B. La corrélation entre BRVM et S&P 500 est historiquement faible. En 2022, la BRVM a tenu à +0,46% pendant que Wall Street perdait -20%. La décision de vendre doit toujours être fondée sur un changement des fondamentaux DE TES SOCIÉTÉS, pas sur ce qui se passe à 8 000 km." }],
  },
};

// ─── SCÉNARIO B : Crise des subprimes 2008 ──────────────────────────────────

const scenarioB = {
  slug: 'crise-subprimes-2008',
  title: 'La Crise des Subprimes 2008',
  description:
    "15 septembre 2008. Lehman Brothers fait faillite. Ton portefeuille BRVM perd -6%. Ce que tu décides dans les prochaines 72 heures va définir ta performance pour les 3 prochaines années.",
  category: 'WORLD_CRISIS',
  tier: 'FREE',
  years: [2008, 2009, 2010],
  availableStocks: ['SNTS', 'SGBC', 'SLBC', 'PALC', 'SIBC'],
  startBudget: 750000,
  isActive: true,

  contextByYear: {
    '2008': {
      kofiPresentation:
        "Nous sommes le 15 septembre 2008 au matin. Tu allumes ton ordinateur et tu lis : 'Lehman Brothers fait faillite'. La plus grande banque d'investissement américaine depuis 158 ans vient de déposer le bilan. Les marchés mondiaux s'effondrent. Ton portefeuille BRVM a déjà perdu -8% depuis hier. Les prochaines décisions que tu prends vont définir ta performance pour les 3 prochaines années.",
      kofiIntro:
        "Portfolio actuel : ~726 600 FCFA (-3,1%) | Liquidités disponibles : 0 FCFA | Pression : maximale. Analyse les fondamentaux — aucune de ces sociétés n'a d'exposition aux subprimes. La baisse est émotionnelle, pas fondamentale.",
      news: [
        { src: 'Reuters', date: '15 sept. 2008', tag: 'BREAKING — Faillite historique', sentiment: 'negative', text: "Lehman Brothers, quatrième banque d'investissement américaine avec 639 milliards $ d'actifs et 25 000 employés, dépose le bilan. C'est la plus grande faillite de l'histoire des États-Unis. Le gouvernement américain refuse de sauver Lehman après avoir sauvé Bear Stearns en mars. Les marchés asiatiques ouvrent en chute de -5% dès l'annonce." },
        { src: 'AFP / France 24', date: '16 sept. 2008', tag: 'Nationalisation AIG', sentiment: 'negative', text: "La Réserve fédérale américaine accorde un prêt d'urgence de 85 milliards $ à AIG, premier assureur mondial, en échange de 79,9% de son capital. Sans cette intervention, AIG faisait faillite le lendemain. Les effets systémiques de la crise dépassent le seul secteur bancaire — l'ensemble du système financier mondial est menacé." },
        { src: 'Les Échos', date: '18 sept. 2008', tag: 'Panique sur les marchés européens', sentiment: 'negative', text: "Le CAC 40 perd -7% en une journée. La Société Générale chute de -10,4%. BNP Paribas -9,3%. L'indice bancaire européen EURO STOXX Banks perd -25% en une semaine. Les investisseurs fuient vers les obligations d'État (valeurs refuges). Le taux interbancaire (Euribor) s'envole — signe que les banques ne se font plus confiance entre elles." },
        { src: 'BRVM Infos', date: '22 sept. 2008', tag: 'La BRVM résiste — mais sous surveillance', sentiment: 'warning', text: "La BRVM Composite recule de -6% depuis début septembre. Les investisseurs institutionnels étrangers se retirent des marchés émergents africains pour couvrir leurs pertes en Europe et aux États-Unis. Les fondamentaux des sociétés BRVM restent solides — aucune exposition directe aux subprimes. Mais le sentiment de marché est négatif et pesant sur les cours." },
      ],
      macro: [
        { label: 'S&P 500 (États-Unis)', value: '-36% ytd', trend: 'down', signal: 'Krach historique — le marché américain efface 10 ans de gains', signification: 'L\'indice boursier américain S&P 500 regroupe les 500 plus grandes entreprises US. Sa chute de -36% illustre l\'ampleur du krach provoqué par la crise des subprimes.' },
        { label: 'Indice bancaire européen', value: '-45% ytd', trend: 'down', signal: 'Effondrement du secteur financier mondial — banques exposées aux CDO', signification: 'Les CDO (Collateralized Debt Obligations) étaient des produits financiers complexes contenant des milliers de crédits immobiliers à risque. Les banques européennes en avaient acheté massivement.' },
        { label: 'CAC 40 (France)', value: '-43% ytd', trend: 'down', signal: 'Banques françaises très exposées aux produits dérivés américains', signification: 'L\'indice boursier français reflète la santé des plus grandes entreprises françaises. BNP Paribas et Société Générale avaient des expositions aux produits dérivés américains.' },
        { label: 'Solidité bancaire UEMOA (Tier 1)', value: '12,4%', trend: 'up', signal: 'Aucune banque UEMOA exposée aux subprimes — avantage structurel majeur', signification: 'Ratio de fonds propres des banques. Les banques UEMOA n\'avaient pas acheté de produits dérivés américains — leur solidité bilancielle est intacte malgré la crise mondiale.' },
        { label: 'Exposition BRVM aux CDO/MBS', value: '~0%', trend: 'flat', signal: 'Avantage structurel clé — les sociétés BRVM ne sont pas touchées opérationnellement', signification: 'Les CDO/MBS (Mortgage-Backed Securities) sont des produits financiers adossés à des crédits immobiliers américains. Les sociétés BRVM n\'en avaient aucun dans leurs bilans.' },
        { label: 'BRVM Composite recul', value: '-6%', trend: 'down', signal: 'Contagion psychologique uniquement — pas de dégradation fondamentale', signification: 'La BRVM recule non pas parce que ses sociétés sont en danger, mais parce que les investisseurs étrangers vendent pour couvrir leurs pertes ailleurs — un phénomène de contagion émotionnelle.' },
      ],
    },
    '2009': {
      kofiPresentation:
        "Nous sommes en mars 2009. Le S&P 500 touche 666 points — son point bas historique. Le mot 'dépression' circule dans les médias. Les marchés mondiaux ont perdu en moyenne -50% depuis un an. Sur la BRVM, les bancaires ont encore chuté de -20% supplémentaires depuis septembre 2008. La peur est à son maximum. C'est précisément maintenant que tout se joue.",
      kofiIntro:
        "Point de douleur maximal. -15,6% sur le capital investi. Mais regarde les fondamentaux : SGBCI vient de publier BNA +8% pour 2008. SONATEL maintient son dividende. Ces sociétés ne sont pas en danger — leurs cours le sont temporairement. C'est exactement ici que les investisseurs disciplinés séparent du reste.",
      news: [
        { src: 'Bloomberg', date: '9 mars 2009', tag: 'Point bas S&P 500', sentiment: 'negative', text: "Le S&P 500 touche 666 points — son niveau le plus bas depuis 1996. Warren Buffett publie dans le New York Times : 'Buy America. I am.' Il détaille sa conviction que les actions américaines sont massivement sous-évaluées et que ceux qui attendent une amélioration des nouvelles avant d'acheter passeront à côté des meilleures opportunités." },
        { src: 'Jeune Afrique / BCEAO', date: '15 mars 2009', tag: 'Zone UEMOA : résilience confirmée', sentiment: 'positive', text: "La BCEAO maintient sa projection de croissance pour la zone UEMOA à +3,7% pour 2009 — malgré la récession mondiale. L'économie réelle ouest-africaine résiste mieux que prévu. Les transferts de la diaspora compensent partiellement le ralentissement du commerce mondial. Le secteur agricole ivoirien bénéficie de cours du cacao encore soutenus." },
        { src: 'BRVM Flash', date: '20 mars 2009', tag: 'Résultats 2008 meilleurs qu\'attendu', sentiment: 'positive', text: "SGBCI publie ses résultats 2008 : BNA en hausse de +8%, dividende maintenu à 500 FCFA par action. SONATEL : BNA +14%, dividende maintenu à 700 FCFA. Ces résultats confirment ce que les données fondamentales montraient depuis septembre 2008 : les sociétés BRVM n'ont pas été affectées dans leurs opérations par la crise mondiale." },
        { src: 'Reuters Afrique', date: '25 mars 2009', tag: 'Premiers signes de stabilisation', sentiment: 'positive', text: "Les volumes sur la BRVM recommencent à progresser. Les investisseurs institutionnels locaux (fonds de pension, compagnies d'assurance UEMOA) reviennent sur le marché. L'indice BRVM Composite semble trouver un plancher après 6 mois de baisse. Des analystes commencent à parler de 'niveaux d'entrée attractifs'." },
      ],
      macro: [
        { label: 'S&P 500', value: '666 pts (-57%)', trend: 'down', signal: 'Point bas historique — -57% depuis le sommet de 2007', signification: 'L\'indice S&P 500 à 666 points représente son niveau le plus bas depuis 1996. Ce plancher symbolise l\'ampleur de la destruction de valeur mondiale liée à la crise des subprimes.' },
        { label: 'BRVM bancaires', value: '-28% depuis sept. 08', trend: 'down', signal: 'Contagion maximale — mais fondamentaux toujours sains', signification: 'Les bancaires BRVM ont suivi la chute des marchés mondiaux par contagion psychologique, mais leurs bilans restent solides : aucune exposition aux CDO, Tier 1 > 12%.' },
        { label: 'BRVM Composite', value: '-22% depuis janv. 08', trend: 'down', signal: 'Pire recul de l\'histoire récente — point d\'entrée historique approche', signification: 'Indice général de la BRVM. Ce recul historique reflète la panique mondiale, pas une dégradation des fondamentaux des sociétés ivoiriennes, sénégalaises ou maliennes.' },
        { label: 'BNA SGBCI 2008', value: '+8%', trend: 'up', signal: 'Bénéfices en hausse malgré la crise mondiale — signal fondamental fort', signification: 'Bénéfice Net par Action (BNA) : part du bénéfice annuel attribuable à chaque action. Une hausse de +8% confirme que SGBCI continue de gagner de l\'argent malgré la tempête mondiale.' },
        { label: 'BNA SONATEL 2008', value: '+14%', trend: 'up', signal: 'Dividende maintenu — résistance opérationnelle totale à la crise', signification: 'SONATEL continue de facturer ses abonnés téléphoniques indépendamment de ce qui se passe sur les marchés financiers. Sa croissance de +14% confirme la thèse télécom.' },
        { label: 'PER bancaires BRVM', value: '5,8×', trend: 'up', signal: 'Niveau historiquement bas — signal d\'achat pour les investisseurs disciplinés', signification: 'PER (Price-to-Earnings Ratio) : un PER de 5,8× signifie que tu achètes 1 FCFA de bénéfice annuel pour seulement 5,8 FCFA. C\'est le niveau le plus bas de la dernière décennie.' },
      ],
    },
    '2010': {
      kofiPresentation:
        "Décembre 2010. La crise mondiale est derrière nous. Les marchés ont rebondi. La BRVM Composite a non seulement effacé ses pertes, mais dépassé ses niveaux de 2007. Voici maintenant ce que les différents comportements pendant la crise ont produit comme résultats. La leçon de ce scénario s'écrit dans ces chiffres.",
      kofiIntro:
        "Le cycle est complet. La crise est derrière. La BRVM a rebondi de +68% depuis le point bas. Voici maintenant les résultats exacts de chaque comportement sur les 750 000 FCFA de départ. Les chiffres ne mentent pas.",
      news: [
        { src: 'BRVM Rapport Annuel', date: '31 déc. 2010', tag: 'Le marché africain surperforme', sentiment: 'positive', text: "La BRVM Composite a progressé de +68% entre le point bas de mars 2009 et décembre 2010. Les bancaires UEMOA affichent les meilleures performances : SGBCI +52%, SIB +58%, CORIS BANK +71%. Aucune banque UEMOA n'a fait faillite pendant la crise. Les sociétés cotées publient des résultats records pour 2010. La BRVM s'impose comme la bourse africaine la plus performante sur la période 2009-2010." },
        { src: 'Jeune Afrique', date: '15 déc. 2010', tag: 'Bilan des gagnants et perdants', sentiment: 'positive', text: "Les gestionnaires qui ont maintenu leurs positions sur les bancaires BRVM pendant la tempête 2008-2009 enregistrent un rendement cumulé de +67% sur 3 ans (dividendes inclus). Ceux qui ont vendu dans la panique de septembre 2008 : +12% seulement, après avoir raté l'essentiel du rebond. Ceux qui ont acheté en mars 2009 : +90% en 18 mois." },
        { src: 'BCEAO — Rapport annuel 2010', date: '31 déc. 2010', tag: 'Système bancaire UEMOA : aucune casse', sentiment: 'positive', text: "Le système bancaire de la zone UEMOA a traversé la pire crise financière mondiale depuis 1929 sans une seule faillite bancaire. Les ratios prudentiels se sont améliorés sur la période. La BCEAO souligne le rôle protecteur de la réglementation prudente et de l'absence d'exposition aux produits dérivés américains." },
      ],
      macro: [
        { label: 'BRVM Composite rebond', value: '+68%', trend: 'up', signal: 'Effacement total des pertes depuis le point bas — record absolu', signification: 'Performance de la BRVM depuis le point bas de mars 2009. Ce rebond de +68% en 18 mois confirme que la baisse de 2008-2009 était bien un phénomène temporaire de contagion émotionnelle.' },
        { label: 'SGBCI cours déc. 2010', value: '12 500 FCFA', trend: 'up', signal: '+52% depuis le point bas mars 2009 à 8 200 FCFA', signification: 'SGBCI a plus que rattrapé ses pertes. Les investisseurs qui ont conservé (ou renforcé) en pleine panique ont été largement récompensés sur 18 mois.' },
        { label: 'SONATEL cours déc. 2010', value: '16 000 FCFA', trend: 'up', signal: '+42% depuis le point bas mars 2009 à 11 300 FCFA', signification: 'SONATEL a rebondi de +42% depuis son point bas. Ses fondamentaux n\'avaient jamais été menacés — la baisse de 2008-09 était une opportunité d\'achat, pas un signal de vente.' },
        { label: 'PIB UEMOA 2010', value: '+4,2%', trend: 'up', signal: 'Accélération économique post-crise confirmée', signification: 'La zone UEMOA retrouve une croissance solide après avoir résisté à la crise mondiale. Sa faible intégration aux marchés financiers internationaux lui a évité les pires effets.' },
        { label: 'Capitalisation BRVM', value: '3 200 Mds FCFA', trend: 'up', signal: 'Record historique — BRVM au plus haut depuis sa création', signification: 'La capitalisation boursière représente la valeur totale de toutes les entreprises cotées. Ce record confirme que les investisseurs ont retrouvé confiance dans les fondamentaux de l\'économie UEMOA.' },
        { label: 'S&P 500 rebond', value: '+48%', trend: 'up', signal: 'Rebond US depuis le point bas mars 2009 — contagion positive', signification: 'Comme la BRVM a souffert de la contagion émotionnelle à la baisse, elle bénéficie de la contagion positive au rebond. Les marchés mondiaux en reprise attirent à nouveau les investisseurs.' },
      ],
    },
  },

  fundamentalsByYear: {
    '2008': {
      SNTS: { per: '9,5×', pbr: '2,0×', bna: '+14%', div: 700, cours: 13500, note: "Revenus récurrents. 70% hors CI. Dividende maintenu. Aucune exposition aux subprimes.", kofiAnalysis: 'BNA +14% en 2008 malgré la crise mondiale. Dividende maintenu. La thèse télécom est intacte — la baisse de cours est purement émotionnelle.' },
      SGBC: { per: '6,5×', pbr: '1,1×', bna: '+8%', div: 500, cours: 8200, note: "Bilans sains. Activité 100% locale. Baisse = contagion émotionnelle. Tier 1 : 14,2%.", kofiAnalysis: 'Aucune exposition aux CDO ou MBS. BNA +8% confirmé après publication. PER 6,5× = valorisation historiquement basse. Signal fort pour les investisseurs de long terme.' },
      SLBC: { per: '8×', pbr: '1,8×', bna: '+7%', div: 750, cours: 10500, note: 'Défensif. La bière se vend en crise comme en période faste. Fondamentaux intacts.', kofiAnalysis: 'Revenus défensifs — peu sensibles au cycle économique. Dividende 750 FCFA maintenu. Valeur refuge par excellence en période de panique.' },
      PALC: { per: '5,5×', pbr: '0,8×', bna: '+5%', div: 220, cours: 4800, note: "Cours huile palme stable. Pas d'effet direct crise financière. P/B < 1.", kofiAnalysis: 'Exposé aux matières premières mais pas aux marchés financiers. P/B < 1 = décote sur actifs. Titre cyclique qui résiste mieux que prévu.' },
      SIBC: { per: '4,5×', pbr: '0,7×', bna: '+12%', div: 180, cours: 3500, note: "Forte croissance crédit. Moins liquide. Fondamentaux intacts. Tier 1 : 13,8%.", kofiAnalysis: 'BNA +12% confirmé. Tier 1 solide. La baisse de cours est purement liée à la liquidité réduite en période de panique, pas aux fondamentaux.' },
    },
    '2009': {
      SNTS: { per: '8×', pbr: '1,7×', bna: '+14%', div: 700, cours: 11300, note: 'Point bas. BNA confirmé +14%. Dividende maintenu. Opportunité historique.', kofiAnalysis: 'Au point bas, SONATEL se négocie à 8× les bénéfices — le plus bas depuis sa cotation. Dividende 700 FCFA = rendement 6,2% sur le cours actuel. Signal d\'achat fort pour investisseur de long terme.' },
      SGBC: { per: '4,8×', pbr: '0,9×', bna: '+8%', div: 500, cours: 7100, note: 'Point bas. PER 4,8× = historiquement bas. BNA +8% confirmé.', kofiAnalysis: 'PER 4,8× = jamais vu depuis 10 ans. P/B < 1 = tu achètes sous la valeur comptable des actifs d\'une banque solide. Moment d\'achat décennal pour les investisseurs qui lisent les fondamentaux.' },
      SLBC: { per: '7×', pbr: '1,6×', bna: '+6%', div: 750, cours: 9800, note: 'Résiste mieux grâce au caractère défensif. -10,9% vs point bas plus prononcé pour les bancaires.', kofiAnalysis: 'Relative résilience confirmée. Recul limité à -10,9% vs -25% pour les bancaires. Dividende maintenu. Joue parfaitement son rôle défensif.' },
      PALC: { per: '4,8×', pbr: '0,7×', bna: '+3%', div: 200, cours: 4200, note: "Recul -19,2%. Cours palm oil stable. P/B 0,7× = décote profonde.", kofiAnalysis: 'Recul important mais pas fondamental. Cours palm oil stable — pas de raison opérationnelle à la baisse. P/B 0,7× = décote profonde sur actifs réels.' },
      SIBC: { per: '3,5×', pbr: '0,6×', bna: '+10%', div: 150, cours: 2800, note: 'Point bas profond. Liquidité réduite amplifie la baisse. Fondamentaux intacts.', kofiAnalysis: 'La faible liquidité amplifie la baisse en période de panique — classique pour les petites capitalisations. BNA +10% confirmé. Pour investisseur avec horizon 2+ ans, opportunité rare.' },
    },
    '2010': {
      SNTS: { per: '10,5×', pbr: '2,3×', bna: '+16%', div: 750, cours: 16000, note: 'Rebond complet. +42% depuis le point bas.', kofiAnalysis: 'Rebond confirmé. La patience sur 2 ans a produit +42%. Les fondamentaux solides ont tenu leurs promesses.' },
      SGBC: { per: '8×', pbr: '1,5×', bna: '+18%', div: 550, cours: 12500, note: '+31,6% depuis le cours d\'achat 2008. +52% depuis le point bas mars 2009.', kofiAnalysis: 'Performance exceptionnelle post-crise. BNA +18% confirme la qualité du bilan. Ceux qui ont conservé ont été largement récompensés.' },
      SLBC: { per: '10×', pbr: '2,3×', bna: '+10%', div: 800, cours: 13500, note: '+22,7% depuis cours achat. Dividendes réguliers maintenus.', kofiAnalysis: 'Performance solide et régulière. Dividendes accumulés sur 3 ans. Rôle défensif parfaitement joué.' },
      PALC: { per: '6×', pbr: '1,0×', bna: '+12%', div: 240, cours: 6200, note: '+19,2% depuis cours achat. Rebond matières premières confirme la thèse.', kofiAnalysis: 'Rebond confirmé avec le cycle matières premières. Patient rewarded. La thèse cyclique s\'est réalisée.' },
      SIBC: { per: '6×', pbr: '1,0×', bna: '+15%', div: 200, cours: 4800, note: 'Fort rebond depuis le point bas. +71% depuis mars 2009.', kofiAnalysis: 'Performance spectaculaire pour les investisseurs courageux de mars 2009. La liquidité réduite joue dans les deux sens.' },
    },
  },

  dividendsByYear: {
    '2008': { SNTS: 700, SGBC: 500, SLBC: 750, PALC: 220, SIBC: 180 },
    '2009': { SNTS: 700, SGBC: 500, SLBC: 750, PALC: 200, SIBC: 150 },
    '2010': { SNTS: 750, SGBC: 550, SLBC: 800, PALC: 240, SIBC: 200 },
  },

  availableActionsByYear: {
    '2008': {
      canBuy: [],
      canSell: ['SNTS', 'SGBC', 'SLBC', 'PALC', 'SIBC'],
      consequences: [
        { condition: 'sellAll === true', positive: false, result: '-8% réalisé. Rebond de +67% manqué. Résultat final : +12% en 3 ans.', lesson: "La panique est la réaction la plus naturelle et la plus coûteuse en bourse. En 2008, chaque FCFA vendu sur la BRVM en panique valait 1,82 FCFA trois ans plus tard." },
        { condition: 'sellHalf === true', positive: false, result: '+28% sur 3 ans. Sous-performe la stratégie conservation.', lesson: 'Le compromis émotionnel produit une performance médiocre des deux côtés — ni la sécurité totale ni le plein rebond.' },
        { condition: 'holdAll === true', positive: true, result: '+67% dividendes inclus sur 3 ans. Meilleur résultat relatif.', lesson: "La règle de Buffett s'applique exactement ici : 'Quand tout le monde est craintif, sois avide.' La condition nécessaire est d'avoir vérifié les fondamentaux." },
      ],
    },
    '2009': {
      canBuy: ['SNTS', 'SGBC', 'SLBC', 'PALC', 'SIBC'],
      canSell: ['SNTS', 'SGBC', 'SLBC', 'PALC', 'SIBC'],
      consequences: [
        { condition: 'dca === true', positive: true, result: '+65% moyen sur 18 mois. Meilleur profil risque/rendement.', lesson: "Le DCA dans la panique est la stratégie qui combine le meilleur rendement moyen avec le meilleur profil de risque. Elle évite le piège du timing parfait que personne ne peut prédire." },
        { condition: 'allIn === true', positive: true, result: 'Si timing juste (mars 09) : +90% sur 18 mois. Risque élevé récompensé.', lesson: "L'all-in au point bas fonctionne si le timing est juste — mais personne ne peut savoir avec certitude que c'est le point bas." },
        { condition: 'waitConfirmation === true', positive: false, result: 'Entrée en juin 2009 : +45% au lieu de +65%. Coût de l\'attente : -20 points.', lesson: "Les meilleures journées (qui concentrent l'essentiel des gains) se produisent en période d'incertitude maximale. Attendre la certitude, c'est arriver après la fête." },
        { condition: 'sellAll === true', positive: false, result: '-15% définitif. Rebond de +90% manqué intégralement.', lesson: "Capitaliser la panique produit la pire performance possible. La patience était la seule stratégie gagnante en 2009." },
      ],
    },
    '2010': {
      canBuy: [],
      canSell: ['SNTS', 'SGBC', 'SLBC', 'PALC', 'SIBC'],
      consequences: [
        { condition: 'holdAll === true', positive: true, result: '+39,4% sur le capital investi. +67% en valeur totale (dividendes inclus).', lesson: "La patience sur 2 ans a produit un résultat que très peu d'investisseurs ont obtenu sur cette période — parce que très peu ont eu la discipline de conserver pendant la panique." },
      ],
    },
  },

  lessonsByYear: {
    '2008': [
      { title: 'Leçon A1 — Comprendre ce que sont les subprimes', content: "Les subprimes sont des crédits immobiliers accordés aux États-Unis à des ménages à risque (revenus insuffisants, mauvaise notation de crédit). Ces crédits ont été 'titrisés' — transformés en produits financiers complexes (CDO, MBS) vendus dans le monde entier. Quand les ménages américains n'ont plus pu rembourser, ces produits ont perdu toute valeur, provoquant des pertes massives dans les bilans bancaires mondiaux. Les banques UEMOA n'avaient pas ces produits dans leurs bilans — c'est leur principal avantage structurel en 2008." },
      { title: 'Leçon A2 — Distinguer risque systémique et risque fondamental', content: "Un risque systémique est une menace qui touche l'ensemble du système financier mondial (comme 2008). Un risque fondamental touche une entreprise spécifique (mauvaise gestion, perte d'un client clé, obsolescence). En 2008, le risque systémique américain crée un sentiment négatif mondial qui fait baisser mécaniquement les cours BRVM — sans que les fondamentaux des sociétés aient changé. Reconnaître cette différence, c'est voir des opportunités là où les autres voient uniquement du danger." },
    ],
    '2009': [
      { title: 'Leçon A3 — Le paradoxe de la peur maximale', content: "Les statistiques boursières montrent une règle contre-intuitive : les meilleurs moments pour acheter sont ceux où la peur est maximale, et les pires moments pour acheter sont ceux où l'euphorie est totale. En mars 2009, les médias parlaient de 'fin du système capitaliste'. C'est exactement à ce moment que les actions les plus solides étaient disponibles à des prix bradés. L'investisseur de Warren Buffett type achète 'quand tout le monde vend avec peur'." },
      { title: 'Leçon A4 — La stratégie DCA dans la tempête', content: "Le Dollar Cost Averaging (investissement programmé) consiste à investir un montant fixe à intervalles réguliers, indépendamment des conditions de marché. En période de baisse, tu achètes plus de titres pour le même montant. En période de hausse, tu en achètes moins. Sur le long terme, cette approche produit un coût moyen d'acquisition inférieur au coût moyen du marché. C'est la stratégie de l'investisseur discipliné face à la volatilité." },
    ],
    '2010': [
      { title: 'Leçon A5 — Les biais cognitifs qui ruinent les investisseurs', content: "Trois biais ont détruit de la valeur en 2008-2009 :\n\n• L'aversion aux pertes : la douleur d'une perte est psychologiquement deux fois plus intense que le plaisir d'un gain équivalent. Résultat : on vend trop vite les perdants.\n\n• Le biais de récence : on extrapole le passé récent dans le futur. Quand les marchés baissent depuis 6 mois, on imagine qu'ils vont baisser encore.\n\n• Le comportement moutonnier : on se fie aux décisions de la foule. Quand tout le monde vend, on a envie de vendre aussi. Ces trois biais combinés expliquent pourquoi la majorité des investisseurs achètent trop haut et vendent trop bas." },
      { title: "Leçon A6 — La règle fondamentale de Warren Buffett adaptée à la BRVM", content: "Buffett dit : 'Soyez craintif quand les autres sont avides, et avides quand les autres sont craintifs.' Sur la BRVM, cette règle se traduit ainsi : quand une crise mondiale fait baisser des sociétés BRVM DONT LES FONDAMENTAUX N'ONT PAS CHANGÉ, c'est une opportunité, pas un danger. La clé est dans la condition : les fondamentaux n'ont pas changé. C'est ce que tu dois toujours vérifier en premier." },
    ],
  },

  quizByYear: {
    '2008': [{ question: "Le Dow Jones vient de perdre -8% en une journée suite à la faillite de Lehman. Ton portefeuille BRVM perd -6%. Quelle est la première question à te poser ?", options: ["Comment vendre rapidement avant que ça baisse encore ?", "Pourquoi la BRVM baisse : est-ce une contagion psychologique ou une dégradation fondamentale réelle ?", "Est-ce que les autres investisseurs vendent aussi sur la BRVM ?"], answer: 1, explanation: "Réponse B. La première question est TOUJOURS : qu'est-ce qui a changé dans les fondamentaux de mes sociétés ? La réponse en septembre 2008 pour la BRVM : rien. Les banques UEMOA n'avaient pas de subprimes. SONATEL continuait de facturer ses abonnés. SOLIBRA continuait de vendre de la bière. La baisse de -6% était purement psychologique — elle représentait une opportunité, pas un danger." }],
    '2009': [{ question: "Mars 2009 — Les marchés sont au plus bas. Tes actions BRVM ont perdu -22%. Tout le monde parle de catastrophe. Que fais-tu avec tes économies disponibles ?", options: ["J'attends que les marchés remontent avant d'investir", "J'investis progressivement (DCA) sur 3-4 mois", "J'investis tout maintenant — c'est clairement le point bas"], answer: 1, explanation: "Réponse B. A (attendre la confirmation) signifie entrer quand les prix ont déjà remonté — tu rates l'essentiel du rebond. C (all-in) est courageux mais dangereux : on ne sait jamais avec certitude qu'on est au point bas — le marché peut encore baisser. B (DCA progressif) est la réponse optimale : tu commences à capturer le rebond sans prendre le risque d'un all-in mal timé." }],
    '2010': [{ question: "Quelle est la leçon principale de ce scénario 2008 pour un investisseur BRVM ?", options: ["Il ne faut jamais investir dans les banques — trop risqué", "La BRVM est immunisée contre toutes les crises mondiales", "Analyser les fondamentaux locaux avant de réagir aux news mondiales est un avantage décisif"], answer: 2, explanation: "Réponse C. A est faux : les bancaires BRVM ont été les meilleures performances post-2008. B est faux : la BRVM n'est pas immunisée — elle peut être affectée si une crise touche directement l'économie UEMOA (comme le COVID en 2020). C est la bonne leçon : l'investisseur qui prend le temps de lire les fondamentaux UEMOA avant de réagir aux titres de CNN avait un avantage décisif en 2008." }],
  },
};

// ─── Main seed function ───────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding Time Machine scenarios...');

  // Upsert Scenario A
  const existingA = await prisma.timeMachineScenario.findUnique({ where: { slug: scenarioA.slug } });
  if (existingA) {
    await prisma.timeMachineScenario.update({
      where: { slug: scenarioA.slug },
      data: scenarioA,
    });
    console.log(`✅ Updated: ${scenarioA.title}`);
  } else {
    await prisma.timeMachineScenario.create({ data: scenarioA });
    console.log(`✅ Created: ${scenarioA.title}`);
  }

  // Upsert Scenario B
  const existingB = await prisma.timeMachineScenario.findUnique({ where: { slug: scenarioB.slug } });
  if (existingB) {
    await prisma.timeMachineScenario.update({
      where: { slug: scenarioB.slug },
      data: scenarioB,
    });
    console.log(`✅ Updated: ${scenarioB.title}`);
  } else {
    await prisma.timeMachineScenario.create({ data: scenarioB });
    console.log(`✅ Created: ${scenarioB.title}`);
  }

  console.log('🎉 Time Machine seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
