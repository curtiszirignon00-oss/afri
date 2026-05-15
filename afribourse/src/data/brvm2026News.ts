// src/data/brvm2026News.ts
// Intelligence de marché BRVM 2026 — 12 articles
// Source : Publications officielles BRVM · Usage éducatif uniquement

export type ImpactType = "Positif" | "Négatif" | "Neutre" | "Mixte";

export interface TickerImpact {
  ticker: string;
  impact: ImpactType;
  note: string;
}

export type ContentBlock =
  | { type: 'disclaimer'; text: string }
  | { type: 'heading'; level: 1 | 2; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; caption?: string }
  | { type: 'table'; caption?: string; headers?: string[]; rows: string[][] }
  | { type: 'key-stats'; items: { label: string; value: string }[] }
  | { type: 'highlight'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; variant: 'info' | 'warn' | 'ok' | 'note'; title: string; paragraphs: string[] }
  | { type: 'pull-quote'; text: string }
  | { type: 'verdict'; title: string; items: { label: string; text: string }[] }
  | { type: 'chart'; chartId: string }
  | { type: 'glossary'; items: { term: string; definition: string }[] };

export interface BRVMArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: string;
  sources: string[];
  tags: string[];
  tickers: TickerImpact[];
  isFeatured: boolean;
  image_url?: string;
  richContent?: ContentBlock[];
}

export const BRVM_NEWS: BRVMArticle[] = [
  {
    id: "cfac-analyse-t1-2026",
    category: "Analyse",
    isFeatured: true,
    title: "Alios Finance CI : résultats T1 2026 — résultat net ×12, solvabilité sous surveillance",
    summary: "PNB +29%, résultat net multiplié par 12 en un an : Alios Finance CI publie un T1 2026 remarquable. Mais le ratio de solvabilité frôle la limite réglementaire à 11,64% pour une norme de 11,5%. Tout comprendre, pas à pas.",
    publishedAt: "2026-05-14T08:00:00Z",
    content: "",
    sources: [
      "Rapport d'activités T1 2026 — Alios Finance CI (données non certifiées)",
      "BCEAO — Normes prudentielles Bâle III / UEMOA",
    ],
    tags: ['SAFCA', 'T1 2026', 'leasing', 'crédit-bail', 'solvabilité', 'résultats', 'analyse éducative'],
    tickers: [
      { ticker: 'SAFCA', impact: 'Mixte', note: 'RN ×12 et PNB +29% — excellente performance opérationnelle, tempérée par une solvabilité globale à seulement 14 bps au-dessus du plancher réglementaire.' },
    ],
    richContent: [
      { type: 'disclaimer', text: "Les données du T1 2026 n'ont pas fait l'objet d'une certification par les commissaires aux comptes. Cet article est fourni à titre éducatif uniquement et ne constitue pas un conseil en investissement." },

      { type: 'heading', level: 1, text: "01 · Qui est Alios Finance CI ?" },
      { type: 'paragraph', text: "Alios Finance Côte d'Ivoire, cotée sur la BRVM sous le ticker SAFCA, est un établissement financier spécialisé dans le crédit aux entreprises — principalement le leasing (crédit-bail) et le financement à moyen terme. Son métier : prêter de l'argent aux entreprises ivoiriennes pour qu'elles financent leurs équipements, leurs véhicules, ou leurs projets de développement. Elle fait partie du groupe Alios Finance, présent dans plusieurs pays d'Afrique subsaharienne, avec un capital social de 3,25 milliards de FCFA." },
      { type: 'callout', variant: 'note', title: "Analogie concrète", paragraphs: [
        "Imaginez un commerçant d'Adjamé qui veut acheter un camion de livraison à 25 millions de FCFA mais n'a pas les liquidités. Il va voir Alios Finance, qui achète le camion et le lui loue pendant 5 ans. Le commerçant paie des mensualités, et au bout du contrat, il devient propriétaire. C'est le cœur du métier d'Alios Finance.",
      ]},

      { type: 'heading', level: 1, text: "02 · Le PNB : le chiffre d'affaires d'une banque" },
      { type: 'paragraph', text: "Dans une banque ou un établissement de crédit, on ne parle pas de « chiffre d'affaires » comme dans une entreprise classique. On parle de Produit Net Bancaire (PNB). C'est la différence entre ce que l'établissement gagne sur ses prêts (les intérêts et commissions reçus) et ce qu'il paie pour se refinancer (les intérêts versés sur les emprunts)." },
      { type: 'callout', variant: 'note', title: "Analogie concrète", paragraphs: [
        "Un boulanger achète sa farine à 200 FCFA le kilo et vend son pain à 600 FCFA. Sa « marge brute » est de 400 FCFA. Le PNB, c'est la même idée : Alios Finance emprunte de l'argent à un certain taux et le reprête à un taux plus élevé. La différence, c'est son PNB.",
      ]},
      { type: 'paragraph', text: "Au T1 2026, le PNB d'Alios Finance CI atteint 1 395 millions de FCFA, contre 1 080 millions un an plus tôt, soit une hausse de 29%. C'est une très bonne performance. Deux facteurs l'expliquent : la croissance des volumes de crédits accordés (plus de clients, plus de prêts) et une meilleure tenue des marges (l'écart entre le taux de prêt et le taux de refinancement s'est amélioré)." },
      { type: 'callout', variant: 'ok', title: "Chiffre à retenir", paragraphs: [
        "+29% de PNB en un an. C'est presque 3× la croissance du PIB ivoirien attendue sur la période — Alios Finance croît nettement plus vite que l'économie dans son ensemble.",
      ]},

      { type: 'heading', level: 1, text: "03 · Le coût du risque : la mauvaise dette maîtrisée" },
      { type: 'paragraph', text: "Quand une banque prête de l'argent, elle sait que certains clients ne rembourseront pas. Le coût du risque, c'est la provision qu'elle passe en charge pour anticiper ces impayés — ou pour couvrir les créances qu'elle considère comme définitivement irrécouvrables." },
      { type: 'callout', variant: 'note', title: "Analogie concrète", paragraphs: [
        "Un taxi-man prête son véhicule à un collègue pour la journée. Pour se protéger, il met de côté 5 000 FCFA « au cas où il y aurait un accrochage ». C'est son « coût du risque » personnel. Plus il fait confiance à son collègue, moins il met de côté.",
      ]},
      { type: 'paragraph', text: "Au T1 2026, le coût du risque ressort à -22 millions de FCFA, contre -89 millions au T1 2025. Le signe négatif signifie que c'est une charge (une dépense). Mais cette charge a diminué de 75% en un an. Cela veut dire qu'Alios Finance a beaucoup mieux maîtrisé la qualité de son portefeuille de prêts : moins de clients en défaut, meilleur suivi des dossiers, recouvrement plus efficace." },
      { type: 'callout', variant: 'ok', title: "Ce que dit la direction", paragraphs: [
        "« Cette évolution reflète une meilleure maîtrise du portefeuille et les effets des actions de suivi, de recouvrement et de contrôle du risque. » — en clair, l'équipe de gestion du risque a bien travaillé ces 12 derniers mois.",
      ]},

      { type: 'heading', level: 1, text: "04 · Le résultat net : ce qu'il reste à la fin" },
      { type: 'paragraph', text: "Après avoir déduit toutes les charges opérationnelles (salaires, loyers, informatique...) et le coût du risque du PNB, on obtient le résultat net. C'est ce que l'entreprise a réellement gagné sur la période — l'argent qui peut être redistribué aux actionnaires ou réinvesti dans l'activité." },
      { type: 'paragraph', text: "Au T1 2026, le résultat net s'établit à 151 millions de FCFA, contre seulement 13 millions au T1 2025. C'est une hausse de +1 062%, soit une multiplication par environ 12. Ce chiffre spectaculaire est le résultat de la conjonction des deux dynamiques décrites ci-dessus : un PNB en forte hausse et un coût du risque en forte baisse." },
      { type: 'callout', variant: 'info', title: "Ce que ça représente concrètement", paragraphs: [
        "Sur un capital social de 3,25 milliards de FCFA, un résultat net trimestriel de 151 millions correspond à un ROE annualisé d'environ 18,5%. C'est un niveau de rentabilité élevé pour un établissement financier dans la zone UEMOA — comparable aux meilleures banques de la région.",
        "Pour comparaison, un placement en bons du Trésor ivoirien rapporte environ 6-7% par an. Alios Finance génère plus de 2,5× ce rendement sur ses fonds propres.",
      ]},

      { type: 'heading', level: 1, text: "05 · Tableau de bord analytique — T1 2026" },
      { type: 'key-stats', items: [
        { label: 'Prod. Net Bancaire · +29%',      value: '1 395 M FCFA' },
        { label: 'Résultat Net · +1 062%',         value: '151 M FCFA' },
        { label: 'Coût du Risque · −75%',          value: '−22 M FCFA' },
        { label: 'Total Bilan · +21%',             value: '88 419 M FCFA' },
        { label: 'Créances Clientèle · +26%',      value: '64 428 M FCFA' },
        { label: 'Capitaux Propres · +16%',        value: '6 067 M FCFA' },
      ]},
      { type: 'chart', chartId: 'cfac-pnb-rn' },
      { type: 'chart', chartId: 'cfac-cout-risque' },
      { type: 'chart', chartId: 'cfac-actif' },
      { type: 'chart', chartId: 'cfac-passif' },
      { type: 'table', caption: 'Ratios prudentiels BCEAO / Bâle III — au 31/03/2026', headers: ['Ratio', 'Valeur', 'Norme', 'Statut'], rows: [
        ['Ratio CET1 (fonds propres durs)',       '10,35%', '≥ 7,5%',  'Conforme'],
        ['Ratio Tier 1 (fonds propres de base)',  '10,35%', '≥ 8,5%',  'Conforme'],
        ['Solvabilité globale',                   '11,64%', '≥ 11,5%', 'Marge serrée ⚠'],
        ['Ratio de levier',                       '4,03%',  '≥ 3%',    'Conforme'],
        ['Immob. hors exploitation',              '12,59%', '≤ 15%',   'Conforme'],
        ['Immo. + participations / total',        '80,48%', '≤ 100%',  'Conforme'],
      ]},

      { type: 'heading', level: 1, text: "06 · Le bilan : radiographie financière en un instant T" },
      { type: 'paragraph', text: "Le bilan d'une entreprise, c'est une photo de sa santé financière à une date précise. À gauche (l'actif) : ce que l'entreprise possède ou a prêté. À droite (le passif) : comment elle a financé tout ça — ses dettes et ses fonds propres." },
      { type: 'paragraph', text: "Au 31 mars 2026, le total du bilan d'Alios Finance CI s'établit à 88 419 millions de FCFA, en hausse de 21% en un an. Le poste principal à l'actif, les créances sur la clientèle (les prêts accordés), représente 64 428 millions — soit 73% du bilan total. Cette concentration est normale pour un établissement de crédit spécialisé." },
      { type: 'callout', variant: 'info', title: "Point intéressant au passif", paragraphs: [
        "Les ressources interbancaires (l'argent emprunté auprès d'autres banques) reculent de 9% pendant que les dépôts clientèle explosent de +87%. C'est une excellente nouvelle structurelle : Alios Finance s'appuie de moins en moins sur des ressources bancaires coûteuses et volatiles, et de plus en plus sur des fonds clients, plus stables et généralement moins chers.",
      ]},

      { type: 'heading', level: 1, text: "07 · Les ratios prudentiels : les limites de vitesse réglementaires" },
      { type: 'paragraph', text: "Les établissements financiers ne peuvent pas faire ce qu'ils veulent. La BCEAO (la banque centrale de l'UEMOA) leur impose des ratios prudentiels, c'est-à-dire des limites réglementaires qu'ils doivent respecter en permanence. Ces ratios sont conçus pour s'assurer que la banque ne prend pas trop de risques et pourra rembourser ses clients même en cas de crise." },
      { type: 'callout', variant: 'note', title: "Analogie concrète", paragraphs: [
        "Imaginez que vous êtes autorisé à construire un immeuble, mais le règlement dit que votre chantier ne peut pas dépasser 15 étages. Si vous en construisez 14, vous êtes conforme. Si vous en construisez 16, l'autorité de tutelle peut vous obliger à démolir. Les ratios prudentiels, c'est exactement ça pour une banque.",
      ]},
      { type: 'paragraph', text: "Au T1 2026, tous les ratios sont respectés. Mais le ratio de solvabilité globale à 11,64% pour une norme minimale à 11,5% laisse une marge de seulement 0,14 point de pourcentage. C'est très serré. Si le bilan continue de croître au même rythme (+21% par an) sans renforcement des fonds propres, ce ratio pourrait passer sous la norme d'ici 2-3 trimestres." },
      { type: 'callout', variant: 'warn', title: "Qu'est-ce que le ratio de solvabilité globale ?", paragraphs: [
        "Il mesure la proportion des fonds propres de l'établissement par rapport à ses actifs pondérés par le risque (les RWA). Plus un prêt est risqué, plus il « pèse » dans ce calcul. Le ratio dit : « Pour 100 FCFA de risques pris, combien avez-vous de fonds propres pour absorber les pertes ? » La norme BCEAO exige au minimum 11,5 FCFA pour 100 FCFA de risques.",
      ]},
      { type: 'paragraph', text: "La direction d'Alios Finance en est consciente et l'indique clairement dans son commentaire : elle appelle à « un pilotage rapproché de la production, du recouvrement et de la consommation des fonds propres ». En langage courant : croître, oui, mais pas n'importe comment." },

      { type: 'heading', level: 1, text: "08 · Ce que ces résultats signifient pour un investisseur BRVM" },
      { type: 'paragraph', text: "En tant qu'investisseur qui suit SAFCA sur la BRVM, voici les questions pertinentes que ces résultats soulèvent :" },
      { type: 'paragraph', text: "1. La croissance est-elle soutenable ? Le portefeuille de prêts croît de 26% en un an. C'est impressionnant, mais une croissance trop rapide du crédit peut cacher une dégradation future de la qualité des actifs. Le coût du risque très bas au T1 2026 devra être confirmé dans les prochains trimestres." },
      { type: 'paragraph', text: "2. La solvabilité sera-t-elle un frein ? Avec 14 bps de marge sur le ratio réglementaire le plus contraignant, la direction pourrait être amenée à lever de nouveaux fonds propres (augmentation de capital) ou à ralentir volontairement la production de crédit. Les deux scénarios ont des implications différentes pour l'actionnaire." },
      { type: 'paragraph', text: "3. Le dividende est-il envisageable ? Avec 151 millions de résultat net au T1 uniquement, si la tendance se confirme sur l'année, Alios Finance pourrait afficher un bénéfice annuel significativement plus élevé qu'en 2025 — ouvrant potentiellement la voie à un dividende ou à un renforcement des réserves." },

      { type: 'verdict', title: "Résumé pour aller plus loin", items: [
        { label: 'PNB +29%', text: "L'activité commerciale se développe fortement, portée par la croissance des volumes et des marges. Signal positif." },
        { label: 'Coût du risque −75%', text: "La qualité du portefeuille de prêts s'améliore nettement. Signal positif, à surveiller pour confirmer la tendance." },
        { label: 'Résultat net ×12', text: "Conjonction des deux points précédents. ROE annualisé estimé à ~18,5% — excellente rentabilité des fonds propres." },
        { label: 'Solvabilité globale 11,64%', text: "Marge de seulement 14 bps sur la norme réglementaire. Point de vigilance important pour les prochains trimestres." },
        { label: 'Diversification du funding', text: "Recul des ressources interbancaires au profit des dépôts clientèle (+87%) — amélioration structurelle du profil de liquidité." },
      ]},
    ],
  },
  {
    id: "brvm-record-2025",
    category: "Marché",
    isFeatured: true,
    title: "BRVM 2025 : +25,26% — un record historique et 4 200 Md XOF mobilisés",
    summary: "La bourse régionale clôture l'exercice 2025 à son plus haut niveau depuis sa création, propulsée par le secteur bancaire et l'agro-industrie.",
    publishedAt: "2026-01-20T08:00:00Z",
    content: `La Bourse Régionale des Valeurs Mobilières (BRVM) a franchi en 2025 un nouveau seuil historique : l'indice BRVM Composite a progressé de 25,26%, atteignant 345,75 points — record absolu depuis l'ouverture en 1998. La progression cumulée sur cinq ans dépasse désormais 100%, plaçant la BRVM parmi les bourses africaines les plus dynamiques.

Sur le plan des mobilisations, le marché financier régional a levé 4 204,7 milliards XOF en 2025, un niveau jamais atteint. Les emprunts obligataires souverains représentent 87,6% du total (3 684,9 Md XOF), avec le Sénégal en tête avec 12 nouvelles émissions. Trois emprunts thématiques (social bonds) ont été recensés, confirmant la BRVM comme 2e place africaine de cotation des social bonds.

La capitalisation boursière totale s'établit à 24 781,3 milliards XOF (18,37% du PIB de l'UEMOA), conservant la 5e place africaine derrière Johannesburg, Casablanca, Nigeria et Égypte. La Côte d'Ivoire concentre 34 sociétés pour 8 412 Md XOF de capitalisation, le Sénégal 3 sociétés pour 2 882 Md XOF.

Par secteur : les services financiers dominent (16 sociétés, 5 277 Md XOF — 39,6%), devant les télécommunications (4 928 Md XOF — 37%) et la consommation (1 901 Md XOF — 14,3%). L'indice BRVM Principal a bondi de 57,59% sur l'exercice, l'indice Agricole de 73,35%. Le secteur des Services publics a en revanche chuté de 86,14%.

47 sociétés sont cotées fin 2025, avec une moyenne quotidienne de 1 082 573 titres échangés et 1,4 milliard XOF de volume moyen par séance. Pour 2026, la BRVM vise une transformation technologique (ETF, IA, blockchain) et cible l'entrée en bourse des industries extractives.`,
    sources: [
      "BRVM — Conférence de presse annuelle · 20 jan 2026 · brvm.org",
      "AIP (Agence Ivoirienne de Presse) · 20 jan 2026 · aip.ci",
      "Connectionivoirienne.net · 22 jan 2026",
    ],
    tags: ["BRVM", "bilan-2025", "capitalisation", "indice-composite", "record"],
    tickers: [
      { ticker: "SGBC", impact: "Positif", note: "Meilleure société cotée BRVM Awards 2025" },
      { ticker: "ECOC", impact: "Positif", note: "+363% sur 5 ans — référence de la création de valeur" },
      { ticker: "SNTS", impact: "Positif", note: "Plus grande liquidité BRVM, 208 M XOF/séance" },
      { ticker: "STBC", impact: "Positif", note: "1er rendement dividende BRVM 2026 à 9,79%" },
    ],
  },
  {
    id: "uemoa-macro-2026",
    category: "Macroéconomie",
    isFeatured: false,
    title: "UEMOA : croissance 6,4% attendue, déficit budgétaire ramené à 3,7% du PIB en 2025",
    summary: "Zone UEMOA en santé macroéconomique solide. Côte d'Ivoire vise 6,7% de croissance portée par les hydrocarbures, le numérique et les infrastructures.",
    publishedAt: "2026-03-23T08:00:00Z",
    content: `L'Union économique et monétaire ouest-africaine affiche des indicateurs macroéconomiques robustes en ce début 2026. Le déficit budgétaire de la zone a été ramené à 3,7% du PIB en 2025 contre 5,4% un an auparavant, tandis que la dette publique recule à 63% du PIB. La masse monétaire progresse fortement (+17,4%), portée par l'augmentation des actifs extérieurs nets et des crédits à l'économie.

La Côte d'Ivoire, locomotive de l'union avec 40% du PIB régional, vise une croissance de 6,7% en 2026, soutenue par l'essor pétrolier et gazier autour du gisement Baleine (consortium Eni-Petroci, réserves estimées à 2,5 milliards de barils). Le budget ivoirien 2026 s'établit à 17 350,2 milliards XOF (+13,1%). Le pays a levé 3 582,7 Md XOF sur le marché régional en 2025, dépassant de 14% son objectif.

Le Sénégal arrive en deuxième position avec 7 433,9 Md XOF de budget (+12,4%), boosté par les nouvelles productions pétrolières et gazières. Le Burkina Faso maintient un budget de 3 918,3 Md XOF avec un déficit contenu à 2,6% du PIB malgré les contraintes sécuritaires.

L'inflation converge vers la cible de 3% fixée par l'UEMOA. Le FMI anticipe une croissance ivoirienne atteignant 7% d'ici 2029, tirée par le tertiaire, les hydrocarbures et les mines. Le nouveau PND 2026-2030, successeur du PND 2021-2025 (77,1% de réalisation), cible la montée en gamme industrielle et la réduction des inégalités.`,
    sources: [
      "BCEAO — Rapport trimestriel T4 2025 · mars 2026 · bceao.int",
      "Banque Mondiale — Rapport économique CI · juil 2025",
      "Pravda Burkina Faso · 23 mars 2026",
      "Direction Générale du Trésor (France) · août 2025",
    ],
    tags: ["UEMOA", "macroéconomie", "Côte-d'Ivoire", "croissance", "PIB", "Sénégal", "PND"],
    tickers: [
      { ticker: "SGBC", impact: "Positif", note: "Croissance crédit favorable aux bilans bancaires UEMOA" },
      { ticker: "ECOC", impact: "Positif", note: "Expansion activité bancaire portée par la dynamique macro" },
      { ticker: "BOAC", impact: "Positif", note: "Investissements publics ivoiriens soutiennent la demande de financement" },
      { ticker: "CBIBF", impact: "Neutre", note: "Budget Burkina en hausse mais contexte sécuritaire persiste" },
      { ticker: "SNTS", impact: "Positif", note: "Croissance économique et bancarisation soutiennent les usages télécoms" },
    ],
  },
  {
    id: "crise-cacao-2026",
    category: "Matières premières",
    isFeatured: true,
    title: "Crise du cacao 2026 : de 10 000 $ à 3 100 $ — l'effondrement qui frappe l'agro-industrie",
    summary: "Après des records en 2024-2025, le cacao s'effondre à 2 900 $/tonne. La CI abaisse le prix bord champ à 1 200 XOF/kg (-57%). Impact direct sur SOGB, SAPH, PALM CI.",
    publishedAt: "2026-03-10T08:00:00Z",
    content: `Après deux ans de cours historiquement élevés oscillant entre 8 000 et 10 000 USD par tonne, le marché du cacao s'est brutalement retourné début 2026. La tonne est tombée à 3 100 USD en avril 2026, proche des creux de juin 2023, sous l'effet conjugué d'une offre mondiale abondante et d'une demande des industriels chocolatiers structurellement affaiblie.

La Côte d'Ivoire, premier producteur mondial (35% des exportations), a été contrainte le 4 mars 2026 d'abaisser le prix bord champ de 2 800 XOF/kg à 1 200 XOF/kg pour la campagne intermédiaire — une chute de 57%. Des centaines de milliers de tonnes restent immobilisées dans les ports d'Abidjan et de San Pedro.

Le problème structurel est double. D'une part, la CI avait vendu par anticipation 1,3 million de tonnes de contrats à des prix deux fois supérieurs aux cours actuels (entre mars et août 2025 à 8 000 $/T). D'autre part, la production nationale recule de 25 à 30% sur la récolte intermédiaire 2026, combinant vieillissement du verger, maladies virales (swollen shoot) et stress hydrique.

Les stocks certifiés ICE atteignent un niveau record de 2 610 453 sacs au 13 avril 2026, limitant tout rebond rapide des cours. Les perspectives pour la mi-récolte 2026 (mai-juillet) sont plus encourageantes selon le CCC, avec des pluies récentes favorables dans les zones de culture.

Pour les sociétés cotées à la BRVM, l'impact est différencié. SOGB CI (caoutchouc) est moins directement exposé que SAPH CI (hévéa) et PALM CI (palmier à huile), mais la crise de la filière agricole ivoirienne pèse sur l'économie rurale dans son ensemble.`,
    sources: [
      "Jeune Afrique — Analyse filière cacao · 6 mars 2026 · jeuneafrique.com",
      "France 24 — Crisis cacao Côte d'Ivoire · 25 jan 2026 · france24.com",
      "Reporterre — Planteurs en détresse · 12 mars 2026 · reporterre.net",
      "SikaFinance — Prix bord champ · mars 2026 · sikafinance.com",
      "Trading Economics — Cacao Futures · avril 2026",
    ],
    tags: ["cacao", "matières-premières", "agro-industrie", "Côte-d'Ivoire", "crise", "prix-bord-champ"],
    tickers: [
      { ticker: "SOGC", impact: "Mixte", note: "Caoutchouc, pas cacao — mais environnement agro difficile" },
      { ticker: "SPHC", impact: "Négatif", note: "SAPH CI — hévéa, contexte agro-industrie difficile" },
      { ticker: "PALC", impact: "Négatif", note: "PALM CI — corrélation partielle avec secteur agricole CI" },
      { ticker: "TTLC", impact: "Neutre", note: "Ralentissement activité agricole, distribution pétrolière diversifiée" },
      { ticker: "SGBC", impact: "Neutre", note: "Risque crédit portefeuille agricole à surveiller" },
    ],
  },
  {
    id: "resultats-bancaires-2025",
    category: "Secteur bancaire",
    isFeatured: true,
    title: "Résultats bancaires BRVM 2025 : bilans solides avec niveaux de vigilance différenciés",
    summary: "Ecobank CI, BOAC et CBIBF se distinguent par leur croissance. SGBC distinguée BRVM Awards 2025. BOABF démontre une résilience remarquable dans un contexte difficile.",
    publishedAt: "2026-04-15T08:00:00Z",
    content: `La saison de publication des résultats 2025 confirme la solidité structurelle du secteur bancaire coté à la BRVM. Ecobank Côte d'Ivoire (ECOC) réalise la meilleure croissance avec 63,5 Md XOF de bénéfice net (+10,4%), portant la progression sur 5 ans à +85%. La banque a émis le premier Gender Bond UEMOA et intégré la plateforme PI-SPI de la BCEAO.

Coris Bank International BF (CBIBF) signe la performance bénéficiaire la plus spectaculaire avec un BNPA en hausse de 36,6% à 2 047 XOF — meilleur rebond du secteur après un exercice 2024 décevant. Son PER de 8,1x au cours BOC de référence (13 000 XOF) reste l'une des valorisations les plus attractives de la cote bancaire régionale.

Bank of Africa CI (BOAC) confirme cinq années de croissance ininterrompue du résultat net : de 16,6 Md XOF en 2021 à 35,5 Md en 2025, soit +113%. Le cours BOAC au 24 avril 2026 s'établit à 8 500 XOF (+18,4% YTD). Bank of Africa BF (BOABF) affiche le 2e meilleur rendement dividende de la BRVM 2026 à 9,20%, avec un cours en hausse de +38,5% YTD à 5 400 XOF.

Société Générale CI (SGBC), distinguée Meilleure société cotée aux BRVM Awards 2025, publie un coefficient d'exploitation de 33,3% — meilleur niveau sur 5 ans. Le T1 2026 confirme la dynamique : bénéfice net de 27,08 Md XOF (+2,2%), ratio coûts/revenus amélioré à 37%.

Point de vigilance collectif : le coût du risque sur les PME reste élevé dans plusieurs établissements. La normalisation des provisions est attendue mais incertaine pour 2026, dans un contexte de tensions persistantes sur certains segments d'activité de la zone UEMOA.`,
    sources: [
      "Agence Ecofin — Analyse sectorielle banques · avril 2026 · agenceecofin.com",
      "BOC BRVM — Rapports états financiers 2025 · mars-avril 2026 · brvm.org",
      "Dabafinance — Ecobank CI résultats · 14 avr 2026 · dabafinance.com",
      "SikaFinance — SGBC signature rendement · 18 avr 2026 · sikafinance.com",
    ],
    tags: ["banque", "résultats-2025", "UEMOA", "ROE", "dividende", "secteur-bancaire"],
    tickers: [
      { ticker: "ECOC", impact: "Positif", note: "RN +10,4%, ROE 29%, paiement div 22 mai 2026" },
      { ticker: "CBIBF", impact: "Positif", note: "BNPA +36,6%, rebond fort, PER 8,1x" },
      { ticker: "BOAC", impact: "Positif", note: "5 ans de croissance, PER 9,7x, +113% RN sur 5 ans" },
      { ticker: "SGBC", impact: "Positif", note: "Meilleure société cotée BRVM Awards 2025, T1 2026 en hausse" },
      { ticker: "BOABF", impact: "Positif", note: "Résilience maintenue, DY 9,2% — 2e meilleur rendement BRVM 2026" },
      { ticker: "SIBC", impact: "Neutre", note: "SIB CI : dividende 330 XOF, DY 4,85%" },
      { ticker: "NSBC", impact: "Neutre", note: "NSIA Banque : dividende 668 XOF, DY 4,77%" },
    ],
  },
  {
    id: "sonatel-analyse-2026",
    category: "Télécoms",
    isFeatured: false,
    title: "Sonatel (SNTS) : PER 7x, DY 5,7% — la valeur de référence BRVM reste sous-évaluée",
    summary: "20+ ans de dividende ininterrompu, PER de 7,01x, +11% sur un an à 29 000 XOF. La plus grande liquidité de la cote régionale avec 200+ M XOF échangés par séance.",
    publishedAt: "2026-03-26T08:00:00Z",
    content: `Sonatel (SNTS), filiale d'Orange SA depuis 1997 et cotée à la BRVM depuis 1998, est régulièrement citée comme la valeur de référence du marché régional. L'opérateur opère sous les marques Orange Sénégal, Orange Mali, Orange Guinée, Orange Guinée-Bissau et Orange Sierra Leone — une diversification géographique naturelle dans la zone UEMOA.

Au cours de 29 000 XOF (avril 2026), Sonatel affiche un PER de 7,01x. Pour comparaison, les opérateurs télécoms européens cotent entre 12 et 18 fois leurs bénéfices. Cette décote est jugée anomale par les analystes, compte tenu de la qualité des franchises et de la régularité des résultats.

Le dividende 2025 s'établit à 1 655 XOF par action (DY 5,71%), pour un 20e exercice consécutif de distribution — record absolu à la BRVM. L'État sénégalais détient 27% du capital, Orange SA 42%, le reste du capital est en flottant. Le titre affiche un gain de +11,03% sur un an.

Sonatel est la valeur la plus liquide de la BRVM avec plus de 200 millions XOF échangés par séance en moyenne. Cette liquidité facilite les entrées/sorties pour les investisseurs institutionnels régionaux.

Point de vigilance : le déploiement 5G en cours génère des investissements importants qui pourraient peser sur les marges à court terme. La concurrence dans le mobile money s'intensifie (Wave, Orange Money, MTN). Après +11% sur un an, la valeur est partiellement dans le cours.`,
    sources: [
      "FluxBourse — Analyse fondamentale Sonatel 2026 · 26 mars 2026 · fluxbourse.com",
      "African Markets — SNTS Profile · 2026 · african-markets.com",
    ],
    tags: ["Sonatel", "télécoms", "dividende", "analyse", "Sénégal", "Orange", "liquidité"],
    tickers: [
      { ticker: "SNTS", impact: "Positif", note: "PER 7x sous-évalué vs pairs, DY 5,7%, 20 ans dividende, liquidité record" },
      { ticker: "ORAC", impact: "Neutre", note: "Orange CI : concurrence directe sur mobile money, DY 4,4%" },
      { ticker: "ONTBF", impact: "Mixte", note: "Onatel BF : contexte sécuritaire pèse, DY 6,77% au cours BOC" },
    ],
  },
  {
    id: "orange-ci-dividende-2026",
    category: "Télécoms",
    isFeatured: false,
    title: "Orange CI (ORAC) : dividende 660 XOF net confirmé au BOC — DY 4,4%",
    summary: "La filiale ivoirienne d'Orange Group confirme ses résultats 2025. Cours à sommets historiques en 2025, consolidation à 14 900 XOF en 2026.",
    publishedAt: "2026-04-05T08:00:00Z",
    content: `Orange Côte d'Ivoire (ORAC) a confirmé au Bulletin Officiel de la Cotation un dividende net de 660 XOF par action pour l'exercice 2025, pour un rendement de 4,4% au cours de référence BOC de 15 000 XOF. Cours au 24 avril 2026 : 14 900 XOF.

Dabafinance avait estimé le dividende 2025 à 1 037 XOF brut, proche du montant finalement validé, illustrant la prévisibilité de la politique de distribution. La mise en paiement est prévue dans les semaines suivant l'AGO.

L'enjeu stratégique réside dans la monétisation du portefeuille de services digitaux — Orange Money en particulier — dans un marché UEMOA où Wave et d'autres acteurs exercent une pression concurrentielle croissante. La BCEAO a lancé en septembre 2025 sa plateforme PI-SPI d'interopérabilité des paiements, dans laquelle Orange CI s'est intégrée.

La valeur a atteint des niveaux historiques en 2025 avant une consolidation début 2026. L'AGO d'Orange SA au niveau du groupe est fixée au 19 mai 2026 à la Salle Pleyel à Paris.`,
    sources: [
      "BOC BRVM — Avis officiel ORAC 2026 · avril 2026 · brvm.org",
      "Dabafinance — Estimations dividendes 2026 · jan 2026 · dabafinance.com",
      "FluxBourse — Calendrier dividendes BRVM 2026 · mars 2026 · fluxbourse.com",
    ],
    tags: ["Orange-CI", "télécoms", "mobile-money", "dividende", "ORAC", "BCEAO"],
    tickers: [
      { ticker: "ORAC", impact: "Positif", note: "Dividende 660 XOF confirmé BOC, intégration PI-SPI BCEAO" },
      { ticker: "SNTS", impact: "Neutre", note: "Concurrence directe sur les marchés sénégalais et régional" },
    ],
  },
  {
    id: "sitab-rendement-2026",
    category: "Marché",
    isFeatured: false,
    title: "SITAB CI (STBC) : meilleur rendement BRVM 2026 à 9,79% — mais bénéfice T4 2025 en chute de 74%",
    summary: "2 096 XOF de dividende net, PER 6,57x. Signal d'alerte : la pression fiscale sur le tabac a comprimé le bénéfice trimestriel. La suspension des taxes mégots offre un répit.",
    publishedAt: "2026-02-10T08:00:00Z",
    content: `Société Ivoirienne de Tabac (STBC) se classe en tête du palmarès des rendements dividendes de la BRVM 2026 avec 2 096 XOF par action (DY 9,79% au cours BOC de 21 400 XOF). Sur cinq ans, le dividende a progressé de +379%, passant de 436 XOF en 2020 à 2 096 XOF en 2026.

Le rapport d'activités du 4e trimestre 2025, publié le 30 janvier 2026, révèle cependant une chute de 74% du bénéfice trimestriel — impact direct de la pression fiscale accentuée sur le secteur tabac. La suspension des taxes sur les mégots annoncée début février 2026 offre un répit stratégique temporaire, mais l'incertitude réglementaire demeure.

Sur les 9 premiers mois de 2025, le résultat net avait progressé de 44% — performance solide avant le choc fiscal du Q4. Le CA annualisé dépasse 254 milliards XOF avec une marge nette d'environ 21%. Selon Dabafinance, chaque salarié génère en moyenne 833 millions XOF de CA — indicateur d'un modèle industriel très efficace.

La valorisation reste basse : PER 6,57x, reflétant la prime de risque réglementaire que le marché intègre. La tendance mondiale à la hausse des taxes tabac, combinée aux objectifs de santé publique UEMOA, constitue un risque structurel pour la trajectoire des résultats futurs.`,
    sources: [
      "SikaFinance — SITAB actualités · 5 fév 2026 · sikafinance.com",
      "BOC BRVM — Rapport d'activités SITAB T4 2025 · 30 jan 2026 · brvm.org",
      "FluxBourse — Calendrier dividendes BRVM 2026 · mars 2026 · fluxbourse.com",
      "Dabafinance — Top 10 actions BRVM à surveiller 2026 · 4 jan 2026 · dabafinance.com",
    ],
    tags: ["SITAB", "tabac", "dividende-record", "rendement", "risque-fiscal", "BRVM"],
    tickers: [
      { ticker: "STBC", impact: "Mixte", note: "1er DY BRVM 9,79% mais bénéfice T4 2025 -74%, risque fiscal structurel" },
    ],
  },
  {
    id: "bicici-resultats-2026",
    category: "Secteur bancaire",
    isFeatured: false,
    title: "BICICI (BICC) : résultats 2025 bien accueillis — +5,46% à la publication, dividende +1 561% sur 5 ans",
    summary: "BNP Paribas CI publie des comptes solides. Cours à 24 000 XOF, dividende net 831 XOF (DY 3,61%). La plus forte progression dividende de toute la cote BRVM sur 5 ans.",
    publishedAt: "2026-04-18T08:00:00Z",
    content: `BNP Paribas CI (BICC) a publié ses résultats annuels 2025, très bien accueillis par le marché. L'action a bondi de 5,46% à 25 000 XOF le jour de la publication (séance du 18 avril 2026), avant une consolidation autour de 24 000 XOF. Volume global de 2,82 milliards XOF échangés cette journée — séance particulièrement active.

Le dividende net de 831 XOF par action confirmé au BOC représente un DY de 3,61% au cours de référence de 23 000 XOF. La progression sur cinq ans est spectaculaire : +1 561%, passant de 50 XOF (2020) à 831 XOF (2026) — la plus forte progression dividende de toute la cote BRVM selon FinanceSAO.

Cette performance reflète un redressement opérationnel profond de l'établissement, filiale du groupe BNP Paribas. La banque bénéficie du dynamisme de la place financière d'Abidjan, du développement du financement des grandes entreprises et de l'amélioration de la gestion des risques.

La capitalisation de BICICI a franchi plusieurs niveaux historiques en 2025. Le cours au 24 avril 2026 s'établit à 23 755 XOF. Un point de vigilance subsiste sur la liquidité du titre : les variations de cours de 3 à 5% lors de flux d'achats concentrés restent fréquentes.`,
    sources: [
      "SikaFinance — BICICI résultats annuels · 18 avr 2026 · sikafinance.com",
      "BOC BRVM — Dividende BICC 2026 · 2026 · brvm.org",
      "FinanceSAO — Palmarès dividendes BRVM 2020-2025 · fév 2026 · financesao.com",
    ],
    tags: ["BICICI", "BNP-Paribas", "banque", "résultats-2025", "dividende", "redressement"],
    tickers: [
      { ticker: "BICC", impact: "Positif", note: "Résultats solides, +5,46% à la publication, dividende ×17 en 5 ans" },
    ],
  },
  {
    id: "unilever-ci-2026",
    category: "Marché",
    isFeatured: false,
    title: "Unilever CI (UNLC) : +68% YTD à 59 000 XOF — la remontée impressionne, les fondamentaux restent à confirmer",
    summary: "L'action UNLC est l'une des plus fortes hausses de la cote en 2026. Le marché anticipe une reprise de la rentabilité, mais le CA 2023 (38 Md XOF) reste en dessous du pic 2019 (54 Md XOF).",
    publishedAt: "2026-04-20T08:00:00Z",
    content: `Unilever Côte d'Ivoire (UNLC) est l'une des grandes surprises boursières de 2026. Le cours a atteint 59 000 XOF au 25 avril 2026 (+68% depuis les 35 000 XOF du 1er janvier). La capitalisation de la filiale ivoirienne du groupe Unilever PLC franchit de nouveaux seuils.

Les fondamentaux restent cependant à vérifier. Le CA 2023 (dernier publié) s'établissait à 38,2 milliards XOF, encore inférieur au pic de 53,7 Md XOF de 2019. Le résultat opérationnel était redevenu positif à 1,57 Md XOF, mais le résultat net de 640 M XOF incorporait un gain exceptionnel de 970 M XOF lié à une cession d'actifs. Hors exceptionnels, les bénéfices auraient été nettement inférieurs.

La hausse du cours anticipe une accélération de la normalisation opérationnelle. Unilever CI fabrique et distribue savons, alimentaire emballé, soins personnels et entretien ménager — secteurs qui bénéficient directement de la croissance de la consommation privée ivoirienne (+6,7% PIB attendu 2026).

Risque à surveiller : le flux de trésorerie 2023 était négatif à -402 M XOF, indiquant que la société dépensait plus qu'elle ne générait. Les prochains résultats annuels seront déterminants pour valider ou infirmer les anticipations du marché.`,
    sources: [
      "Dabafinance — Top 10 actions BRVM 2026 · 4 jan 2026 · dabafinance.com",
      "BRVM — Cours officiel 24-25 avril 2026 · brvm.org",
    ],
    tags: ["Unilever", "consommation", "redressement", "Côte-d'Ivoire", "cours-bourse"],
    tickers: [
      { ticker: "UNLC", impact: "Mixte", note: "+68% YTD mais fondamentaux à confirmer, trésorerie encore sous pression" },
    ],
  },
  {
    id: "dividendes-palmares-2026",
    category: "Dividendes",
    isFeatured: true,
    title: "803 Md XOF redistribués en 2025 — palmarès complet des dividendes BRVM 2026",
    summary: "27 sociétés maintiennent ou augmentent leur dividende. SITAB 9,79%, BOABF 9,20%, BOAN 8,11% en tête. Deux sociétés ne distribuent pas : BOA Niger et Setao CI.",
    publishedAt: "2026-04-01T08:00:00Z",
    content: `La saison des dividendes 2026 (exercice 2025) confirme l'attractivité de la BRVM pour les investisseurs orientés revenus. Au total, 803 milliards XOF ont été redistribués aux actionnaires au titre des résultats 2025 selon FinanceSAO. Le calendrier de publication et de paiement s'étale de mars à juin 2026, au fil des AGO.

Palmarès des meilleurs rendements (source : FluxBourse / BOC officiel) :
• SITAB CI (STBC) : 9,79% / 2 096 XOF
• BOA BF (BOABF) : 9,20% / 428 XOF
• BOA Niger (BOAN) : 8,11% / 209 XOF
• TotalEnergies SN (TTLS) : 7,59% / 222 XOF
• Loterie Nationale Bénin (LNBB) : 7,13% / 275 XOF
• TotalEnergies CI (TTLC) : 6,94% / 196 XOF
• BOA Bénin (BOAB) : 6,83% / 468 XOF
• Onatel BF (ONTBF) : 6,77% / 190 XOF
• SOGB CI (SOGC) : 6,36% / 528 XOF

Du côté des banques ivoiriennes : BOAC 6,01% / 469 XOF · SGBC 4,94% / 1 646 XOF net (brut 2 293 XOF, record historique) · NSBC 4,77% / 668 XOF · Ecobank CI 4,19% / 708 XOF net (mise en paiement 22 mai 2026, total 48,9 Md XOF).

Sur la période 2020-2024, BICICI signe la plus forte progression (+1 561%, de 50 à 831 XOF). PALM CI progresse de +340%. Sonatel maintient 20+ ans de dividende ininterrompu — record absolu BRVM. Deux sociétés ont décidé de ne pas distribuer pour 2026 : BOA Niger et Setao CI.

Processus BRVM : AGO → détachement du cours → date de jouissance → paiement (J+15 à J+30). Pour percevoir le dividende, il est impératif de détenir l'action AVANT la date de détachement publiée au BOC.`,
    sources: [
      "FluxBourse — Calendrier dividendes BRVM 2026 · mars 2026 · fluxbourse.com",
      "FinanceSAO — Actions meilleurs dividendes BRVM · fév 2026 · financesao.com",
      "Financial Afrik — Ecobank CI 49 Md XOF · 13 avr 2026 · financialafrik.com",
      "RichBourse — Dividendes BRVM 2026 · richbourse.com",
    ],
    tags: ["dividende", "rendement", "palmarès", "BRVM-2026", "revenus", "BOC", "payout"],
    tickers: [
      { ticker: "STBC", impact: "Positif", note: "DY 9,79% — 1er rendement BRVM 2026" },
      { ticker: "BOABF", impact: "Positif", note: "DY 9,20% — 2e rendement, cours +38,5% YTD" },
      { ticker: "TTLC", impact: "Positif", note: "DY 6,94% — 7e rendement BRVM" },
      { ticker: "SOGC", impact: "Positif", note: "DY 6,36%, dividende ×2,6 vs creux 2023" },
      { ticker: "SGBC", impact: "Positif", note: "Record historique 2 293 XOF brut, ×6,2 vs 2020" },
      { ticker: "ECOC", impact: "Positif", note: "Paiement 22 mai 2026, 48,9 Md XOF distribués" },
      { ticker: "SNTS", impact: "Positif", note: "20+ ans de dividende ininterrompu, DY 5,71%" },
    ],
  },
  {
    id: "brvm-reglementation-2026",
    category: "Réglementation",
    isFeatured: false,
    title: "BRVM 2026-2030 : nouveau BOC, ETF en préparation, IA et blockchain dans la feuille de route",
    summary: "Depuis le 2 janvier 2026, nouveau format du BOC. ETF, produits dérivés, tokenisation et IA au cœur d'une stratégie de transformation vers le top 3 africain.",
    publishedAt: "2026-01-20T09:00:00Z",
    content: `Depuis le 2 janvier 2026, la BRVM a introduit plusieurs évolutions structurantes dans son Bulletin Officiel de la Cotation (BOC). Le nouveau format améliore la lisibilité et la réactivité de l'information pour les 47 sociétés cotées et leurs investisseurs. Le BOC est publié quotidiennement sur bfin.brvm.org.

Dans la feuille de route technologique 2026-2030, la BRVM vise une transformation numérique complète : intégration de l'IA dans l'analyse de marché, déploiement de la blockchain pour la traçabilité des transactions, big data pour la supervision prudentielle. L'objectif est de se hisser dans le top 3 africain d'ici 2030.

L'introduction de fonds d'investissement cotés (ETF) constitue la priorité court terme. En s'inspirant du Nigerian Exchange Group, la BRVM prépare également des produits dérivés et des mécanismes de couverture. Ces innovations élargiraient considérablement les outils disponibles pour les investisseurs institutionnels.

La BRVM a officiellement admis la BIIC (Banque Internationale pour l'Industrie et le Commerce du Bénin) à sa cote en 2025, portant le nombre de sociétés cotées à 47. La bourse cible de nouvelles cotations dans les secteurs extractifs (mines, hydrocarbures) et les industries manufacturières.

En matière de financement durable, la BRVM confirme sa position de 2e place africaine de cotation des social bonds, avec trois emprunts thématiques enregistrés en 2025. Le Gender Bond d'Ecobank CI (premier de la zone UEMOA) a été émis en 2025 et coté sur la BRVM.`,
    sources: [
      "BRVM — Bilan 2025 et perspectives 2026-2030 · 20 jan 2026 · brvm.org",
      "AIP — 4 200 Md FCFA mobilisés en 2025 · 20 jan 2026 · aip.ci",
      "Connectionivoirienne.net · 22 jan 2026",
      "L'économiste du Faso — BOC du 14 avril 2026 · 15 avr 2026",
    ],
    tags: ["BRVM", "ETF", "blockchain", "IA", "innovation", "réglementation", "BOC", "2026-2030"],
    tickers: [
      { ticker: "SGBC", impact: "Positif", note: "Approfondissement du marché bénéfique aux valeurs de référence" },
      { ticker: "ECOC", impact: "Positif", note: "Précurseur fintech UEMOA, Gender Bond coté sur BRVM" },
      { ticker: "SNTS", impact: "Positif", note: "Digitalisation cohérente avec l'écosystème Orange" },
    ],
  },
  {
    id: "agro-palmci-saph-2026",
    category: "Agro-industrie",
    isFeatured: false,
    title: "PALM CI et SAPH CI : dividendes confirmés — les agro-industries résistent dans un secteur sous pression",
    summary: "PALM CI (451 XOF, DY 5,01%) et SAPH CI (324 XOF, DY 4,15%) distribuent malgré la crise de l'environnement agricole ivoirien. AGO convoquées au BOC du 25 mars 2026.",
    publishedAt: "2026-04-10T08:00:00Z",
    content: `PALM CI (PALC) et SAPH CI (SPHC) ont toutes deux reçu leur avis de convocation à l'AGO publiés dans le BOC BRVM du 25 mars 2026. Les deux groupes agro-industriels confirment leur politique de distribution : PALM CI 451 XOF net (DY 5,01% au cours de 9 000 XOF) et SAPH CI 324 XOF net (DY 4,15% au cours de 7 810 XOF).

PALM CI a progressé de +340% sur son dividende en cinq ans, démontrant sa résilience malgré la cyclicité du secteur. La filière huile de palme bénéficie d'une demande mondiale soutenue par les usages alimentaires et cosmétiques, moins volatils que le cacao.

SAPH CI, spécialisée dans le caoutchouc naturel (hévéa), partage avec SOGB CI le positionnement sur un marché de matière première influencé par la production asiatique (Thaïlande, Indonésie). Les tensions géopolitiques mondiales créent ponctuellement de la volatilité sur les coûts d'expédition.

Le risque commun aux deux groupes reste l'impact indirect de la crise du cacao sur l'économie rurale ivoirienne : baisse du pouvoir d'achat des ménages agricoles, ralentissement potentiel des investissements dans les plantations, et tensions sociales pouvant affecter la main-d'œuvre agricole.`,
    sources: [
      "BOC BRVM du 25 mars 2026 — Avis de convocation PALM CI et SAPH CI · brvm.org",
      "L'économiste du Faso — BOC 25 mars 2026 · 26 mars 2026",
      "FluxBourse — Calendrier dividendes BRVM 2026 · mars 2026 · fluxbourse.com",
      "FinanceSAO — Palmarès dividendes 2020-2025 · fév 2026 · financesao.com",
    ],
    tags: ["PALM-CI", "SAPH", "agro-industrie", "hévéa", "palmier", "dividende", "CI"],
    tickers: [
      { ticker: "PALC", impact: "Neutre", note: "Dividende 451 XOF BOC, DY 5,01%, contexte agro difficile" },
      { ticker: "SPHC", impact: "Neutre", note: "Dividende 324 XOF BOC, DY 4,15%, caoutchouc moins exposé au cacao" },
      { ticker: "SOGC", impact: "Mixte", note: "CA +10,3% mais environnement agro dégradé globalement" },
    ],
  },
  {
    id: "safc-augmentation-capital-2026",
    category: "Analyse",
    isFeatured: true,
    image_url: "/images/safc-chart-2026.png",
    title: "SAFC (Alios Finance CI) : Augmentation de Capital 2026 — Décryptage complet d'une opération stratégique",
    summary: "SAFC lance une augmentation de capital de 1,5 milliard FCFA. Après 8 ans de pertes, un redressement spectaculaire en 2025 (+701 M FCFA de résultat net) et l'arrivée de CREDAF GROUP. Décryptage complet : qui souscrit, à quel prix, et pourquoi le cours a chuté de 50 % depuis les sommets.",
    publishedAt: "2026-04-30T08:00:00Z",
    content: `Avertissement : Cet article est fourni à titre informatif et éducatif uniquement. Il ne constitue pas un conseil en investissement. Tout investissement comporte des risques, y compris la perte en capital. Consultez un conseiller financier agréé avant toute décision d'investissement.

INTRODUCTION — L'ÉVÉNEMENT BOURSIER DU PRINTEMPS 2026

SAFC (Alios Finance Côte d'Ivoire, anciennement SAFCA — Société Africaine de Crédit Automobile) a lancé une augmentation de capital de 1,5 milliard FCFA. Cet article décrypte pourquoi cette opération a lieu, qui peut y participer, et ce que cela signifie concrètement pour les investisseurs.

1. QUI EST ALIOS FINANCE CI (ex-SAFCA) ?

Fondée en 1956, siège à Treichville (Abidjan), agence à San Pedro, succursales au Burkina Faso, Mali et Sénégal. Métier principal : crédit-bail (leasing) pour véhicules, équipements agricoles/industriels, immobilier et crédits à la consommation.

Données clés : Total bilan de 73,3 milliards FCFA à fin 2024. Part de marché de 52,2 % dans le crédit-bail en Côte d'Ivoire. Cotée BRVM sous le code SAFC. Participation de 52,02 % détenue par CREDAF GROUP.

2. UN NOUVEAU CHAPITRE : L'ARRIVÉE DE CREDAF GROUP

Alios Finance SA (Luxembourg) détenait 52,02 % de SAFCA CI. En décembre 2023, accord de rachat par CREDAF GROUP, holding panafricain fondé par l'industriel ivoirien Serge Aimé Bilé. Prise de contrôle effective le 30 avril 2025. Objectif déclaré : faire d'Alios Finance CI la plus grande compagnie de leasing de la sous-région.

3. LE REDRESSEMENT SPECTACULAIRE DE 2025

Entre 2022 et 2024, la société accumulait des pertes nettes. Pire année : 2023 (résultat d'exploitation -385 %). En 2024, la perte nette était réduite à -165 millions FCFA (vs -579 M en 2023).

Puis retournement total en 2025 :
• T1 2025 : +13 M FCFA (vs -406 M FCFA au T1 2024), PNB +34 %, Coût du risque -61 %
• T2 2025 : +226 M FCFA (+710 % vs T2 2024), Créances clientèle +12 %
• Année 2025 : Résultat net +701 M FCFA (+525 % vs 2024), PNB +44 % (3,98 → 5,73 Mds)

Résultat net annuel : +701 M FCFA, dépassant les objectifs du CA de 36 % (vs 514 M prévus). Fin de 8 années consécutives de déficit. Les leviers : recentrage sur les segments rentables, renforcement du recouvrement, discipline opérationnelle, sélectivité accrue, impact de la gouvernance CREDAF.

4. L'AUGMENTATION DE CAPITAL : LES DÉTAILS DE L'OPÉRATION

Raison n°1 — Obligation réglementaire : La Commission Bancaire de l'UMOA a imposé une augmentation du capital social d'au moins 1 milliard FCFA suite à l'érosion des fonds propres sous les seuils prudentiels.

Raison n°2 — Financer la croissance : Capitaux propres renforcés pour emprunter davantage, développer de nouveaux produits et répondre à la demande croissante de leasing.

Paramètres clés de l'opération :
• Montant total levé : 1 500 000 000 FCFA (1,5 milliard)
• Nombre d'actions nouvelles : 3 750 000 actions
• Prix d'émission : 400 FCFA par action
• Parité de souscription : 6 nouvelles actions pour 13 anciennes (DPS)
• Ouverture des souscriptions : 27 avril 2026
• Clôture des souscriptions : 11 juin 2026
• Négociation des DPS (BRVM) : 27 avril — 9 juin 2026
• Date de jouissance : 1er janvier 2025 (rétroactive)
• Fonds propres avant opération : 5,2 milliards FCFA
• Fonds propres après opération : 6,7 milliards FCFA (+1,5 Md)

Le Droit Préférentiel de Souscription (DPS) permet aux actionnaires existants d'acheter 6 nouvelles actions pour 13 DPS détenus, au prix de 400 FCFA. Les DPS peuvent aussi être vendus sur la BRVM jusqu'au 9 juin 2026.

5. L'ÉVOLUTION DU COURS BOURSIER : UNE LEÇON DE MARCHÉ

Le graphique ci-dessous (Source : AfriBourse) retrace l'évolution du titre SAFC de septembre 2024 à avril 2026.

Acte I — Léthargie (sept. 2024 — juin 2025) : Cours stable autour de 1 000 FCFA, titre peu suivi.

Acte II — Envol spéculatif (juil. 2025 — début 2026) : Montée jusqu'à ~7 500 FCFA. Titre multiplié par 7 en moins de 6 mois, porté par l'annonce des résultats 2025 et les ambitions de CREDAF GROUP.

Acte III — Correction post-annonce (avr. 2026) : Annonce le 13 avril 2026 → cours revenu autour de 3 900 FCFA (divisé par ~2 depuis le pic).

Mécanique du DPS et baisse du cours — le TERP : (13 × 7 500 + 6 × 400) / 19 ≈ 5 257 FCFA est la valeur théorique ex-droit. Le marché a anticipé et accentué la dilution.

6. PERSPECTIVES : OÙ VA ALIOS FINANCE CI ?

Projections financières :
• 701 M FCFA — Résultat net 2025 (point de départ)
• +30 %/an — Croissance annuelle visée
• 2,78 Mds FCFA — Bénéfice ciblé en 2030
• 2028 — Horizon retour aux dividendes

Points de surveillance : Résultats T1 2026 (attendus mai 2026), taux de souscription à l'augmentation de capital, évolution du cours après la clôture (11 juin 2026), retour éventuel aux dividendes en 2028, expansion sous-régionale (Sénégal, Mali, Burkina Faso).

7. QUE FAIRE ? LE GUIDE PRATIQUE DE L'INVESTISSEUR

Si vous êtes déjà actionnaire SAFC :
• Option 1 — Souscrire : Acheter 6 nouvelles actions pour 13 DPS à 400 FCFA. Avantage : maintient votre % de participation, prix attractif. Risque : mobilise de la trésorerie.
• Option 2 — Vendre vos DPS : Céder vos droits sur la BRVM jusqu'au 9 juin. Avantage : liquidité immédiate. Risque : dilution de votre participation.
• Option 3 — Ne rien faire : Laisser expirer les DPS. C'est la moins avantageuse — vous perdez la valeur des DPS ET subissez la dilution maximale.

Si vous n'êtes pas encore actionnaire : L'augmentation s'adresse en priorité aux actionnaires existants. Des actions nouvelles pourraient être allouées à d'autres investisseurs si des droits restent non exercés. La vigilance s'impose car le cours a déjà fortement progressé depuis les creux de 2024.

CONCLUSION : UN PARI SUR LE RENOUVEAU DU CRÉDIT-BAIL IVOIRIEN

L'augmentation de capital cristallise une transition profonde. Les chiffres de 2025 (résultat net +701 M FCFA, PNB +44 %, objectifs dépassés de 36 %) prouvent le redressement. La correction de 50 % depuis les sommets offre peut-être une fenêtre de réflexion, mais le passé ne préjuge pas de l'avenir.`,
    sources: [
      "BRVM — Bulletin Officiel de la Cotation · avr. 2026 · brvm.org",
      "Agence Ecofin — Analyse SAFC augmentation capital · avr. 2026 · agenceecofin.com",
      "Sika Finance — Résultats trimestriels SAFC 2025 · sikafinance.com",
      "Financial Afrik — CREDAF GROUP prise de contrôle · 2025 · financialafrik.com",
      "AllAfrica — Alios Finance CI rapport annuel 2025 · allAfrica.com",
      "Rapports officiels SAFCA CI (T1–T4 2025) · brvm.org",
    ],
    tags: ["SAFC", "SAFCA", "Alios-Finance", "augmentation-capital", "DPS", "crédit-bail", "CREDAF-GROUP", "BRVM", "Côte-d'Ivoire", "analyse", "leasing"],
    tickers: [
      { ticker: "SAFC", impact: "Mixte", note: "Augmentation de capital 1,5 Md FCFA — parité 6/13 à 400 FCFA. Redressement spectaculaire 2025 (+701 M), mais cours divisé par 2 depuis le pic. DPS à vendre avant le 9 juin 2026." },
    ],
    richContent: [
      {
        type: 'disclaimer',
        text: "Avertissement : Cet article est fourni à titre informatif et éducatif uniquement. Il ne constitue pas un conseil en investissement. Tout investissement comporte des risques, y compris la perte en capital. Consultez un conseiller financier agréé avant toute décision d'investissement.",
      },
      { type: 'paragraph', text: "SAFC (Alios Finance Côte d'Ivoire, anciennement SAFCA — Société Africaine de Crédit Automobile) a lancé une augmentation de capital de 1,5 milliard FCFA. Cet article décrypte pourquoi cette opération a lieu, qui peut y participer, et ce que cela signifie concrètement pour les investisseurs." },

      { type: 'heading', level: 1, text: "1. Qui est Alios Finance CI (ex-SAFCA) ?" },
      { type: 'heading', level: 2, text: "Une institution presque septuagénaire" },
      { type: 'paragraph', text: "Fondée en 1956, siège à Treichville (Abidjan), agence à San Pedro, succursales au Burkina Faso, Mali et Sénégal. Métier principal : crédit-bail (leasing) pour véhicules, équipements agricoles/industriels, immobilier et crédits à la consommation." },
      { type: 'heading', level: 2, text: "Leader incontesté du crédit-bail en Côte d'Ivoire" },
      { type: 'paragraph', text: "Total bilan : 73,3 milliards FCFA à fin 2024. Part de marché : 52,2 % dans le crédit-bail en CI. Cotée BRVM sous code SAFC." },
      {
        type: 'key-stats',
        items: [
          { value: '1956', label: 'Année de création' },
          { value: '52,2 %', label: 'Part de marché CI' },
          { value: '73,3 Mds FCFA', label: 'Total bilan 2024' },
          { value: '52,02 %', label: 'Participation CREDAF GROUP' },
        ],
      },

      { type: 'heading', level: 1, text: "2. Un nouveau chapitre : l'arrivée de CREDAF GROUP" },
      { type: 'paragraph', text: "Alios Finance SA (Luxembourg) détenait 52,02 % de SAFCA CI. En décembre 2023, accord de rachat par CREDAF GROUP, holding panafricain fondé par l'industriel ivoirien Serge Aimé Bilé. Prise de contrôle effective le 30 avril 2025. Objectif déclaré : faire d'Alios Finance CI la plus grande compagnie de leasing de la sous-région." },
      { type: 'highlight', text: "Qu'est-ce que le crédit-bail ? Le leasing est un contrat par lequel une société financière acquiert un bien (véhicule, équipement, immobilier) pour le louer à une entreprise ou un particulier. À la fin du contrat, le locataire peut racheter le bien à sa valeur résiduelle. Alios Finance CI est le leader de cette activité en Côte d'Ivoire avec 52,2 % de part de marché." },

      { type: 'heading', level: 1, text: "3. Le redressement spectaculaire de 2025 : la renaissance" },
      { type: 'paragraph', text: "Entre 2022 et 2024, la société accumulait des pertes nettes. Pire année : 2023 (résultat d'exploitation -385 %). En 2024, la perte nette était réduite à -165 millions FCFA (vs -579 M en 2023). Puis retournement total en 2025 :" },
      {
        type: 'table',
        caption: 'Résultats trimestriels 2025',
        headers: ['Période', 'Résultat Net', 'Variation vs N-1', 'Indicateur clé'],
        rows: [
          ['T1 2025', '+13 M FCFA', 'vs -406 M FCFA', 'PNB +34 %, Coût risque -61 %'],
          ['T2 2025', '+226 M FCFA', '+710 % vs T2 2024', 'Créances clientèle +12 %'],
          ['Année 2025', '+701 M FCFA', '+525 % vs 2024', 'PNB +44 % (3,98 → 5,73 Mds)'],
        ],
      },
      { type: 'paragraph', text: "Résultat net annuel : +701 M FCFA, dépassant les objectifs du CA de 36 % (vs 514 M prévus). Fin de 8 années consécutives de déficit." },
      {
        type: 'table',
        caption: 'Les leviers du redressement',
        headers: ['Levier', 'Impact'],
        rows: [
          ['Recentrage sur les segments rentables', 'Amélioration des marges'],
          ['Renforcement du recouvrement', 'Coût du risque -61 %'],
          ['Discipline opérationnelle', 'PNB +44 %'],
          ['Sélectivité accrue', 'Créances clientèle +12 %'],
          ['Impact gouvernance CREDAF', 'Objectifs dépassés de 36 %'],
        ],
      },

      { type: 'heading', level: 1, text: "4. L'augmentation de capital : les détails de l'opération" },
      { type: 'heading', level: 2, text: "Raison n°1 — Obligation réglementaire" },
      { type: 'paragraph', text: "La Commission Bancaire de l'UMOA a imposé une augmentation du capital social d'au moins 1 milliard FCFA suite à l'érosion des fonds propres sous les seuils prudentiels." },
      { type: 'heading', level: 2, text: "Raison n°2 — Financer la croissance" },
      { type: 'paragraph', text: "Capitaux propres renforcés pour emprunter davantage, développer de nouveaux produits et répondre à la demande croissante de leasing dans la sous-région." },
      {
        type: 'table',
        caption: "Paramètres clés de l'opération",
        headers: ['Paramètre', 'Détail'],
        rows: [
          ['Montant total levé', '1 500 000 000 FCFA (1,5 milliard)'],
          ["Nombre d'actions nouvelles", '3 750 000 actions'],
          ["Prix d'émission", '400 FCFA par action'],
          ['Parité de souscription', '6 nouvelles actions pour 13 anciennes'],
          ['Ouverture des souscriptions', '27 avril 2026'],
          ['Clôture des souscriptions', '11 juin 2026'],
          ['Négociation des DPS (BRVM)', '27 avril — 9 juin 2026'],
          ['Date de jouissance', '1er janvier 2025 (rétroactive)'],
          ['Fonds propres avant opération', '5,2 milliards FCFA'],
          ['Fonds propres après opération', '6,7 milliards FCFA (+1,5 Md)'],
        ],
      },
      { type: 'highlight', text: "Le DPS (Droit Préférentiel de Souscription) est votre ticket prioritaire. Vous possédez 13 actions SAFC ? Vous pouvez acheter 6 nouvelles actions à seulement 400 FCFA l'unité. Ou vendre ce droit sur la BRVM (jusqu'au 9 juin 2026) si vous préférez la liquidité immédiate." },

      { type: 'heading', level: 1, text: "5. L'évolution du cours boursier : une leçon de marché" },
      { type: 'paragraph', text: "Acte I — Léthargie (sept. 2024 — juin 2025) : Cours stable autour de 1 000 FCFA, titre peu suivi par le marché." },
      { type: 'image', src: '/images/safc-chart-2026.png', caption: 'Cours du titre SAFC (SAFCA / Alios Finance CI) — sept. 2024 à avr. 2026 — Source : AfriBourse' },
      { type: 'paragraph', text: "Acte II — Envol spéculatif (juil. 2025 — début 2026) : Montée jusqu'à ~7 500 FCFA. Titre multiplié par 7 en moins de 6 mois, porté par l'annonce des résultats 2025 et les ambitions de CREDAF GROUP." },
      { type: 'paragraph', text: "Acte III — Correction post-annonce (avr. 2026) : Annonce le 13 avril 2026 → cours revenu autour de 3 900 FCFA (divisé par ~2 depuis le pic)." },
      {
        type: 'table',
        caption: 'Mécanique du DPS et baisse du cours — le TERP',
        headers: ['Calcul', 'Résultat'],
        rows: [
          ['(13 × 7 500 FCFA + 6 × 400 FCFA) ÷ 19', '≈ 5 257 FCFA — valeur théorique ex-droit'],
          ['Cours actuel (avr. 2026)', '≈ 3 900 FCFA'],
          ['Correction depuis le pic (7 500 FCFA)', '≈ -48 %'],
        ],
      },

      { type: 'heading', level: 1, text: "6. Perspectives : où va Alios Finance CI ?" },
      {
        type: 'key-stats',
        items: [
          { value: '701 M', label: 'Résultat net 2025 (FCFA)' },
          { value: '+30 %/an', label: 'Croissance annuelle visée' },
          { value: '2,78 Mds', label: 'Bénéfice ciblé en 2030 (FCFA)' },
          { value: '2028', label: 'Horizon retour aux dividendes' },
        ],
      },
      { type: 'heading', level: 2, text: "Points de surveillance pour les investisseurs" },
      {
        type: 'list',
        items: [
          'Résultats T1 2026 (attendus mai 2026)',
          "Taux de souscription à l'augmentation de capital",
          'Évolution du cours après la clôture (11 juin 2026)',
          'Retour éventuel aux dividendes en 2028',
          'Expansion sous-régionale (Sénégal, Mali, Burkina Faso)',
        ],
      },

      { type: 'heading', level: 1, text: "7. Que faire ? Le guide pratique de l'investisseur" },
      { type: 'heading', level: 2, text: "Si vous êtes déjà actionnaire SAFC" },
      {
        type: 'table',
        headers: ['Option', 'Action', 'Avantage', 'Risque'],
        rows: [
          ['1. Souscrire', 'Acheter 6 nouvelles actions pour 13 DPS à 400 FCFA', 'Maintient % de participation, prix attractif', 'Mobilise de la trésorerie'],
          ['2. Vendre vos DPS', 'Céder droits sur BRVM (jusqu\'au 9 juin)', 'Liquidité immédiate', 'Dilution'],
          ['3. Ne rien faire', 'Laisser expirer les DPS', 'Aucune action requise', 'Perte valeur DPS + dilution maximale'],
        ],
      },
      { type: 'highlight', text: "⚠ Conseil : L'option 3 (ne rien faire) est la moins avantageuse. Vendez au moins vos DPS sur la BRVM avant le 9 juin 2026 pour récupérer leur valeur." },
      { type: 'heading', level: 2, text: "Si vous n'êtes pas encore actionnaire" },
      { type: 'paragraph', text: "L'augmentation s'adresse en priorité aux actionnaires existants. Si des droits restent non exercés, des actions nouvelles pourraient être allouées à d'autres investisseurs. La vigilance s'impose car le cours a déjà fortement progressé depuis les creux de 2024." },

      { type: 'heading', level: 1, text: "Conclusion : Un pari sur le renouveau du crédit-bail ivoirien" },
      { type: 'paragraph', text: "L'augmentation de capital cristallise une transition profonde. Les chiffres de 2025 (résultat net +701 M FCFA, PNB +44 %, objectifs dépassés de 36 %) prouvent le redressement. La correction de 50 % depuis les sommets offre peut-être une fenêtre de réflexion, mais le passé ne préjuge pas de l'avenir." },
    ],
  },

  // ── SGBCI T1 2026 ──────────────────────────────────────────────────────────
  {
    id: "sgbci-analyse-t1-2026",
    category: "Analyse",
    isFeatured: true,
    image_url: "/images/sgbci-building.jpg",
    title: "Société Générale Côte d'Ivoire : solidité sous pression — Analyse T1 2026",
    summary: "Résultat net T1 2026 en recul de −11,5% à 23,9 Md FCFA. Coefficient d'exploitation remonté à 40,6%. Mais à PER 10× et rendement dividende 7,9%, la SGBCI intègre-t-elle déjà les mauvaises nouvelles ? Analyse approfondie sur 5 ans de données.",
    publishedAt: "2026-05-05T08:00:00Z",
    sources: [
      "Rapport d'activité annuel SGCI 2024 (données auditées, 07/02/2025) · brvm.org",
      "Rapport d'activité annuel SGCI 2025 (données auditées, 17/04/2026) · brvm.org",
      "Rapports trimestriels T1 2024, T1 2025, T1 2026 (30/04/2026, non audités) · SGBCI",
      "APBEF-CI — Statistiques secteur bancaire CI · oct. 2024",
      "Bloomfield Investment Corporation — Note AAA · 2024",
    ],
    tags: ["SGBCI", "SGBC", "Société-Générale", "T1-2026", "analyse", "banque", "coefficient-exploitation", "dividende", "NPL", "PER", "BRVM"],
    tickers: [
      { ticker: "SGBC", impact: "Mixte", note: "RN T1 2026 −11,5%, coeff. exploitation 40,6%, NPL 8%. Mais PER 10×, rendement 7,9%, AAA Bloomfield. Catalyseur : T2 2026." },
    ],
    content: "Analyse approfondie des résultats du premier trimestre 2026 de SGBCI. Résultat net −11,5% à 23,9 Md FCFA. Coefficient d'exploitation remonté à 40,6%. Trois mécanismes simultanés : effet ciseaux revenues/coûts, escalade du coût du risque (NPL 8%), compression des commissions. À PER 10× et rendement 7,9%, le titre intègre une partie des mauvaises nouvelles. Catalyseur : T2 2026.",
    richContent: [
      { type: 'disclaimer', text: "Analyse financière · BRVM / UEMOA — Édition éducative. Données : rapports annuels 2024–2025 + T1 2026. Non auditées (T1). Cette étude est produite à des fins éducatives et ne constitue pas un conseil en investissement. Tout investissement en bourse comporte un risque de perte en capital." },

      { type: 'key-stats', items: [
        { value: '33 000 FCFA', label: 'Cours · 02/05/2026' },
        { value: '1 026,7 Md', label: 'Capitalisation' },
        { value: '10,1×', label: 'PER (base 2025)' },
        { value: '2,07×', label: 'Price-to-Book' },
        { value: '7,9%', label: 'Rendement dividende 2025' },
        { value: 'AAA', label: 'Note Bloomfield 2024' },
        { value: '20%', label: 'Part de marché crédits' },
        { value: '31 111 110', label: 'Actions' },
      ]},

      { type: 'heading', level: 1, text: "01 · Portrait de l'entreprise" },
      { type: 'paragraph', text: "Société Générale Côte d'Ivoire (SGCI) est la première banque privée de Côte d'Ivoire et l'un des acteurs financiers les plus puissants de toute la zone UEMOA. Filiale du groupe français Société Générale, elle détient 20% de part de marché sur les crédits et 16% sur les dépôts selon les statistiques APBEF-CI d'octobre 2024 — des positions de leader incontestées." },
      { type: 'paragraph', text: "Son bilan dépasse 3 769 milliards FCFA. Son résultat net excède 100 milliards par an. En 2024, l'agence Bloomfield Investment Corporation lui a attribué la note AAA — une première dans le secteur bancaire ivoirien, et la seule banque de la place à porter cette distinction." },
      { type: 'paragraph', text: "L'action est cotée sur la BRVM sous le ticker SGBCI. Avec plus de 1 000 milliards FCFA de capitalisation boursière, elle figure parmi les titres les plus liquides et les plus suivis de la bourse régionale." },
      { type: 'callout', variant: 'info', title: "Repère — Qu'est-ce que le Produit Net Bancaire (PNB) ?", paragraphs: [
        "Le PNB est l'équivalent du chiffre d'affaires pour une banque. Il additionne deux sources de revenus : la marge nette d'intérêt (différence entre ce que la banque prête à 7% et emprunte à 3%) et les commissions (frais de tenue de compte, virements, services). Pour SGCI en 2025 : 276 milliards FCFA de PNB, dont ~84% viennent des intérêts et ~16% des commissions nettes.",
      ]},

      { type: 'heading', level: 1, text: "02 · Cinq ans de résultats : la trajectoire de fond (2021–2025)" },
      { type: 'paragraph', text: "Avant de lire le T1 2026, il est indispensable de comprendre d'où vient la banque. Le tableau ci-dessous présente les états financiers annuels complets sur cinq exercices." },
      { type: 'table', caption: 'Compte de résultat (M FCFA)', headers: ['', '2021', '2022', '2023', '2024', '2025'], rows: [
        ['Produit Net Bancaire', '189 096', '215 101', '253 286', '263 207', '276 048'],
        ['Frais Généraux', '—', '—', '-105 585', '-99 723', '-106 974'],
        ['Résultat Brut d\'Exploitation', '98 446', '118 708', '147 701', '163 484', '169 074'],
        ['Coût Net du Risque', '—', '—', '-27 654', '-36 235', '-46 829'],
        ['Résultat Avant Impôt', '—', '—', '119 617', '127 561', '126 507'],
        ['Résultat Net', '67 438', '74 612', '97 230', '101 228', '101 352'],
      ]},
      { type: 'table', caption: 'Ratios clés', headers: ['', '2021', '2022', '2023', '2024', '2025'], rows: [
        ['Coefficient d\'exploitation', '42,6%', '40,1%', '41,7%', '37,9%', '38,8%'],
        ['ROE', '22,1%', '21,6%', '24,1%', '22,4%', '20,5%'],
        ['ROA', '2,2%', '2,2%', '2,8%', '2,8%', '2,7%'],
        ['NPL (créances douteuses)', '—', '—', '6,8%', '7,5%', '8,0%'],
        ['Dividende brut / action', '—', '—', '1 719 F', '1 863 F', '2 606 F'],
        ['Taux de distribution', '—', '—', '55,0%', '57,3%', '80,0%'],
      ]},
      { type: 'chart', chartId: 'sgbci-annuel' },
      { type: 'paragraph', text: "L'histoire de SGCI sur cinq ans est celle d'une croissance organique soutenue, avec une rupture positive en 2023 où le résultat net a bondi de +30%. Deux tendances méritent l'attention : d'une part, le coût net du risque en accélération continue (+31% en 2024, +29% en 2025), signal que la qualité du portefeuille se détériore progressivement. D'autre part, le dividende qui fait un saut remarquable de +40% en 2025, passant de 1 863 à 2 606 FCFA — avec un taux de distribution qui monte à 80%, ce qui est inhabituellement élevé pour une banque en phase d'investissement." },
      { type: 'callout', variant: 'note', title: "Point d'analyse — Le dividende 2025 à 80% de distribution", paragraphs: [
        "Un taux de distribution de 80% signifie que la banque reverse aux actionnaires 80 FCFA sur chaque 100 FCFA gagnés. C'est généreux — et c'est un signal fort envoyé au marché en amont d'une période d'investissements lourds (rénovation siège, IT). La logique : récompenser les actionnaires avant la phase de dépenses, qui pèsera sur les résultats 2026. Au cours de 33 000 FCFA, le rendement brut du dividende 2025 est de 7,9% — exceptionnel pour un titre de cette qualité sur la BRVM.",
      ]},

      { type: 'heading', level: 1, text: "03 · L'évolution trimestrielle T1 : quatre ans de perspective" },
      { type: 'table', caption: 'T1 comparaison (M FCFA)', headers: ['T1', 'T1 2023', 'T1 2024', 'T1 2025', 'T1 2026', 'Var. 25→26'], rows: [
        ['Produit Net Bancaire', '59 476', '65 427', '66 275', '65 644', '−1,0%'],
        ['Frais Généraux', '—', '~26 800', '24 515', '26 646', '+8,7%'],
        ['Coeff. d\'exploitation', '—', '41,0%', '37,0%', '40,6%', '+3,6 pp'],
        ['Résultat Avant Impôt', '27 134', '32 588', '33 862', '29 987', '−11,4%'],
        ['Résultat Net', '22 509', '26 498', '27 081', '23 976', '−11,5%'],
      ]},
      { type: 'chart', chartId: 'sgbci-rn-t1' },
      { type: 'paragraph', text: "Le T1 2026 rompt une progression trimestrielle régulière sur trois ans. Mais la perspective historique révèle un détail capital : le coefficient d'exploitation à 40,6% au T1 2026 est exactement le niveau qui prévalait au T1 2024. Et la direction avait réussi à le ramener à 37% dès le T1 2025 grâce à une stratégie active de maîtrise des coûts. Ce n'est pas la première fois que SGCI traverse ce type de pic de charges — et elle en est sortie par le haut." },
      { type: 'pull-quote', text: "Le T1 2026 n'est pas une dégradation sans précédent. C'est un retour au niveau de 2024 — que la banque avait déjà su dépasser." },

      { type: 'heading', level: 1, text: "04 · Anatomie de la baisse : trois mécanismes simultanés" },
      { type: 'heading', level: 2, text: "Mécanisme 1 — L'effet ciseaux revenus/coûts" },
      { type: 'paragraph', text: "Le PNB recule de 631 millions FCFA (−1%) tandis que les frais généraux progressent de 2 131 millions (+9%). Les deux courbes s'écartent comme les lames d'une paire de ciseaux : revenus stagnants, coûts en hausse. L'espace entre les deux — le bénéfice brut d'exploitation — se comprime mécaniquement." },
      { type: 'paragraph', text: "L'origine de la hausse des frais : rénovation du siège social, construction d'un nouveau site, et surtout migration IT des clients entreprises vers une nouvelle plateforme de banque à distance. Ce dernier poste est le plus incertain : les migrations informatiques dépassent régulièrement leurs délais et leurs budgets." },
      { type: 'chart', chartId: 'sgbci-ciseaux' },
      { type: 'heading', level: 2, text: "Mécanisme 2 — Le coût du risque en escalade structurelle" },
      { type: 'paragraph', text: "C'est le signal le plus préoccupant et le moins commenté. Depuis 2023, le coût net du risque (provisions pour mauvaises créances) ne cesse d'accélérer : +31% en 2024, +29% en 2025. Parallèlement, le taux de NPL (créances douteuses) progresse de 6,8% à 7,5% puis 8,0%. Le rapport T1 2026 ne donne pas de chiffre précis, mais l'écart entre le RBE (−7%) et le RAI (−11%) suggère environ 1,1 milliard de provisions supplémentaires au T1 2026." },
      { type: 'callout', variant: 'warn', title: "Signal structurel — La dégradation du portefeuille", paragraphs: [
        "Quand le taux de NPL passe de 6,8% à 8,0% en deux ans sur un portefeuille de 2 546 milliards FCFA, cela représente environ 30 milliards FCFA de créances supplémentaires en souffrance. La banque maintient un taux de couverture à 82% (en baisse depuis les 95% de 2023), ce qui signifie qu'une partie du risque résiduel n'est pas encore pleinement provisionnée. Ce point mérite une surveillance attentive sur 2026.",
      ]},
      { type: 'heading', level: 2, text: "Mécanisme 3 — La compression des commissions" },
      { type: 'paragraph', text: "Les commissions nettes représentaient 39,7% du PNB en 2023 — elles n'en représentent plus que 24,8% en 2025. La migration IT des clients entreprises perturbe précisément cette ligne : pendant la transition, les services numériques générant des commissions sont partiellement indisponibles. La direction le reconnaît explicitement dans le rapport T1 2026." },
      { type: 'callout', variant: 'info', title: "Repère — Pourquoi les commissions sont-elles importantes ?", paragraphs: [
        "Les commissions sont des revenus stables et peu risqués — une banque n'a aucun risque de crédit sur un virement ou une tenue de compte. À l'inverse, les intérêts sur crédits génèrent du risque de non-remboursement. Un PNB avec une forte proportion de commissions est donc structurellement plus solide. La baisse de la part des commissions chez SGCI (de ~40% à ~25% du PNB) est un recul qualitatif, au-delà du seul recul quantitatif.",
      ]},

      { type: 'heading', level: 1, text: "05 · L'histoire du coefficient d'exploitation" },
      { type: 'paragraph', text: "Le coefficient d'exploitation est la variable centrale de cette analyse. Son évolution sur l'ensemble de la période disponible :" },
      { type: 'chart', chartId: 'sgbci-coeff' },
      { type: 'paragraph', text: "Sur base annuelle, le coefficient d'exploitation s'est amélioré de 2,9 points entre 2023 et 2025, passant de 41,7% à 38,8%. La direction a tenu sa promesse d'efficacité opérationnelle. Mais les T1 sont systématiquement plus élevés que la moyenne annuelle (phénomène de saisonnalité). Le T1 2026 à 40,6% n'est donc pas aussi éloigné de la 'normale trimestrielle' qu'il n'y paraît au premier regard." },

      { type: 'heading', level: 1, text: "06 · Valorisation de l'action SGBCI" },
      { type: 'paragraph', text: "Avec 31 111 110 actions et un cours de 33 000 FCFA au 2 mai 2026, voici les métriques de valorisation calculées à partir des données auditées :" },
      { type: 'key-stats', items: [
        { value: '1 026,7 Md FCFA', label: 'Capitalisation boursière' },
        { value: '3 258 FCFA', label: 'BPA 2025 (annuel audité)' },
        { value: '10,1×', label: 'PER sur BPA 2025' },
        { value: '3 082 FCFA', label: 'BPA T1 2026 annualisé' },
        { value: '10,7×', label: 'PER sur T1 annualisé' },
        { value: '15 913 FCFA', label: 'Valeur comptable / action' },
        { value: '2,07×', label: 'Price-to-Book' },
        { value: '7,9%', label: 'Rendement dividende 2025' },
      ]},
      { type: 'callout', variant: 'info', title: "Repère — Lire ces métriques ensemble", paragraphs: [
        "PER de 10,1× : Pour chaque 100 FCFA de bénéfice annuel, le marché paie 1 010 FCFA. C'est modéré pour une banque AAA à 20% de part de marché — les banques comparables en Afrique de l'Ouest s'échangent entre 7× et 14×.",
        "P/B de 2,07× : Le marché valorise la banque au double de sa valeur comptable, justifié par son ROE de 20%+. Si le ROE baissait vers 12-15%, ce multiple deviendrait difficile à défendre.",
        "Rendement de 7,9% : C'est le 'loyer' annuel que l'actionnaire perçoit en dividende. À titre de comparaison, les obligations d'État ivoiriennes à 10 ans offrent environ 6-7%. SGBCI offre donc un rendement supérieur aux obligations souveraines — ce qui est rare pour un titre aussi solide.",
      ]},
      { type: 'heading', level: 2, text: "Sensibilité du BPA au coefficient d'exploitation" },
      { type: 'paragraph', text: "Le tableau ci-dessous quantifie l'impact direct du coefficient d'exploitation sur le bénéfice par action, à PNB constant (276 Md, niveau 2025) :" },
      { type: 'table', caption: 'Scénarios de valorisation (PNB fixe 276 Md)', headers: ['Scénario', 'Coeff.', 'RN estimé', 'BPA estimé', 'PER à 33 000', 'Rendement div.'], rows: [
        ['Dégradation continue', '44,0%', '~83 Md', '2 668 F', '12,4×', '~6,5%'],
        ['Stabilisation au T1', '40,6%', '~88 Md', '2 828 F', '11,7×', '~6,9%'],
        ['Rebond partiel', '38,8%', '~94 Md', '3 022 F', '10,9×', '~7,3%'],
        ['Retour niveau 2024', '37,9%', '~98 Md', '3 150 F', '10,5×', '~7,6%'],
        ['Retour niveau 2025 ✓', '38,8%', '~101 Md', '3 248 F', '10,2×', '~7,9%'],
      ]},
      { type: 'chart', chartId: 'sgbci-sensib' },

      { type: 'heading', level: 1, text: "07 · Le dividende : l'argument souvent oublié" },
      { type: 'paragraph', text: "La progression du dividende est l'une des données les plus remarquables de ces rapports annuels, et l'une des moins discutées dans la lecture des résultats trimestriels." },
      { type: 'table', caption: 'Dividende brut par action (FCFA) · 2023–2025', headers: ['Exercice', 'Dividende brut', 'Variation', 'Taux de distribution', 'Rendement à 33 000 F'], rows: [
        ['2023', '1 719 FCFA', '—', '55,0%', '5,2%'],
        ['2024', '1 863 FCFA', '+8,4%', '57,3%', '5,6%'],
        ['2025', '2 606 FCFA', '+39,9%', '80,0%', '7,9%'],
      ]},
      { type: 'chart', chartId: 'sgbci-div' },
      { type: 'paragraph', text: "En deux ans, le dividende par action a progressé de +51,6% (de 1 719 à 2 606 FCFA). Pour un investisseur ayant acheté l'action à 34 000 FCFA avant l'annonce des résultats T1 2026, le dividende 2025 de 2 606 FCFA représente un rendement de 7,66% — entièrement encaissé quel que soit le cours. C'est l'argument de l'investisseur de valeur : on peut accepter une pression temporaire sur le cours si le flux de dividendes reste solide." },
      { type: 'callout', variant: 'ok', title: "Perspective long terme — Le rendement total", paragraphs: [
        "Un investisseur qui aurait acheté SGBCI il y a deux ans à, disons, 28 000 FCFA, aurait encaissé : dividende 2023 (1 719 F) + dividende 2024 (1 863 F) + dividende 2025 (2 606 F) = 6 188 FCFA de dividendes, soit 22,1% du prix d'achat en trois ans — sans compter la plus-value de cours. C'est le profil d'un titre de rendement de très haute qualité.",
      ]},

      { type: 'heading', level: 1, text: "08 · La réaction du marché et ce qu'elle signifie" },
      { type: 'paragraph', text: "Le rapport a été publié jeudi 30 avril. Les marchés BRVM étant fermés vendredi 1er mai (fête du Travail), la première réaction n'a pu s'exprimer que le lundi 4 mai. En un seul jour de cotation, l'action est passée de 34 000 à 33 000 FCFA : −1 000 FCFA par action, soit −2,9%." },
      { type: 'paragraph', text: "En termes de destruction de valeur absolue : 31 111 110 × 1 000 = 31,1 milliards FCFA de capitalisation boursière évaporés en une séance. Soit l'équivalent de 1,3 fois le résultat net trimestriel de la banque." },
      { type: 'callout', variant: 'info', title: "Lecture de marché — Ce que −2,9% révèle", paragraphs: [
        "Ce n'est pas une panique. Une réaction de −2,9% sur une banque ayant publié −11% de résultat net suggère que la dégradation était partiellement anticipée. Sur la BRVM, des publications vraiment négatives provoquent des baisses de 5 à 15%.",
        "Ce n'est pas non plus de l'indifférence. La baisse est réelle et significative. Le marché sanctionne la rupture du trend de croissance et la dégradation du coefficient d'exploitation.",
        "Le test de vérité sera le T2 2026. Si la migration IT se stabilise comme annoncé et que le coefficient revient vers 38-39%, la thèse d'investissement à 33 000 FCFA sera confortée. Dans le cas contraire, un nouveau palier de correction est possible.",
      ]},

      { type: 'heading', level: 1, text: "09 · Les signaux à surveiller en 2026" },
      { type: 'callout', variant: 'ok', title: "Signaux positifs", paragraphs: [
        "Dividende 2025 de 2 606 FCFA — rendement 7,9% au cours de 33 000 F, supérieur aux obligations souveraines ivoiriennes.",
        "Notation AAA Bloomfield — unique dans le secteur bancaire ivoirien. Signal de solidité financière maximale.",
        "Bilan solide — ratio de solvabilité à 16,3% (seuil réglementaire : 12,5%). Coussin de 300+ bps au-dessus des exigences.",
        "Précédent 2024–2025 — la banque a déjà redressé un coefficient à 41% vers 37% en un an. Elle sait le faire.",
      ]},
      { type: 'callout', variant: 'warn', title: "Signaux de vigilance", paragraphs: [
        "NPL à 8,0% — en progression constante depuis 2023 (6,8% → 7,5% → 8,0%). Le taux de couverture recule (95% → 84% → 82%). Tension sur les PME ivoiriennes.",
        "Coût du risque structurellement haut — +29% en 2025, accélère depuis 2023. Le résultat net 2025 est quasi-stable non pas grâce à la performance commerciale mais grâce à la fiscalité.",
        "Commissions en recul — de 39,7% à 24,8% du PNB en 2 ans. Baisse qualitative de la structure du PNB.",
        "ROE en baisse continue — 24,1% (2023) → 22,4% (2024) → 20,5% (2025). Trend à surveiller.",
      ]},
      { type: 'paragraph', text: "Le catalyseur numéro un reste la publication du rapport d'activité T2 2026 (attendue vers fin juillet 2026). Si le coefficient d'exploitation revient sous 39% et que le PNB rebondit grâce à la stabilisation de la migration IT, la thèse constructive est confirmée. C'est le seul élément qui peut catalyser un rebond significatif du cours." },

      { type: 'verdict', title: "Synthèse pour l'investisseur BRVM", items: [
        { label: "Ce que les données confirment :", text: "SGCI est l'une des institutions financières les plus solides de la zone UEMOA. Bilan de 3 769 Md, résultat net >100 Md par an, notation AAA, dividende en croissance de +51% en deux ans, leader de marché avec 20% de part sur les crédits. Ces fondamentaux ne se discutent pas." },
        { label: "Ce que le T1 2026 révèle :", text: "La banque entre dans un cycle d'investissements lourds (IT, immobilier) simultanément à une dégradation graduelle de la qualité de son portefeuille de crédits (NPL 8%, coût du risque +29%). Le résultat net 2025 aurait été en forte baisse sans un impact fiscal favorable." },
        { label: "La question centrale :", text: "Le coefficient d'exploitation va-t-il rebondir rapidement (scénario direction) ou rester élevé pendant plusieurs trimestres (scénario prudent) ? La réponse dictera la trajectoire du cours en 2026." },
        { label: "Pour l'investisseur de valeur :", text: "À 33 000 FCFA, PER 10× et rendement dividende 7,9%, SGBCI intègre déjà une bonne partie des mauvaises nouvelles. Le titre n'est pas cher au regard de sa qualité fondamentale. Mais il manque un catalyseur positif — et ce catalyseur s'appelle T2 2026." },
      ]},

      { type: 'glossary', items: [
        { term: 'PNB — Produit Net Bancaire', definition: "Équivalent du chiffre d'affaires pour une banque. Additionne la marge nette d'intérêt (différence entre taux prêteurs et emprunteurs) et les commissions sur services." },
        { term: "Coefficient d'exploitation", definition: "Frais généraux / PNB. Plus il est bas, plus la banque transforme efficacement ses revenus en profits. Seuil sain : sous 50%. Excellent : sous 40%." },
        { term: 'Coût Net du Risque (CNR)', definition: "Provisions constituées pour couvrir les risques de non-remboursement des crédits accordés. Un CNR en hausse signale une dégradation de la qualité du portefeuille ou une politique prudentielle plus stricte." },
        { term: 'NPL — Non Performing Loans', definition: "Créances douteuses ou en souffrance. Un NPL de 8% signifie que 8% de l'encours de crédits présente des signes de difficulté de remboursement. Seuil de confort habituel : sous 5-6% pour une banque saine." },
        { term: 'ROE — Return on Equity', definition: "Résultat net / capitaux propres. Mesure le rendement généré pour chaque franc investi par les actionnaires. Un ROE de 20% = 20 FCFA de profit pour 100 FCFA de fonds propres." },
        { term: 'PER — Price Earnings Ratio', definition: "Cours / bénéfice par action. Combien de fois les profits annuels les investisseurs paient-ils pour posséder l'action. PER 10× : il faudrait théoriquement 10 ans de profits pour « récupérer » le prix payé." },
        { term: 'Price-to-Book (P/B)', definition: "Cours / valeur comptable par action. Un P/B de 2× signifie que le marché valorise la banque au double de ce que ses livres comptables indiquent. Justifié si le ROE est durablement élevé." },
        { term: 'Rendement du dividende', definition: "Dividende par action / cours de l'action. Mesure le « revenu » annuel versé à l'actionnaire en pourcentage de son investissement. À comparer aux taux obligataires pour évaluer l'attractivité relative." },
        { term: 'Ratio de solvabilité', definition: "Mesure la robustesse financière d'une banque face à ses risques. Réglementation UEMOA : minimum 12,5%. SGCI : 16,3% en 2024, soit +300 points de base de coussin de sécurité." },
        { term: 'Effet ciseaux', definition: "Phénomène où les revenus stagnent ou reculent pendant que les coûts progressent, comprimant le résultat. Les deux courbes s'écartent visuellement comme les lames de ciseaux." },
      ]},
    ],
  },
];

export const BRVM_CATEGORIES = [
  "Marché", "Macroéconomie", "Matières premières", "Secteur bancaire",
  "Télécoms", "Dividendes", "Réglementation", "Agro-industrie", "Analyse",
] as const;
