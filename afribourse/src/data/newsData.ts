// src/data/newsData.ts
// Données fondamentales BRVM 2025 — Fil d'actualités
// Source : Publications officielles BRVM — Usage éducatif uniquement

export type Sector = "Banque" | "Agro-industrie" | "Distribution pétrolière" | "Télécommunications";
export type Trend = "hausse" | "baisse" | "stable";

export interface YearlyData {
  year: number;
  revenue: number;
  netIncome: number;
  dividend: number;
  dy: number;
  roe?: number;
}

export interface StockNews {
  id: string;
  ticker: string;
  name: string;
  shortName: string;
  sector: Sector;
  country: "CI" | "BF" | "SN";
  publishedAt: string;
  fiscalYear: number;
  revenueLabel: "CA" | "PNB";
  history: YearlyData[];
  per: number;
  pb: number;
  dyAnnual: number;
  bnpa: number;
  bnpaVar: number;
  payout: number;
  ebitda: number;
  dividendTrend: Trend;
  incomeTrend: Trend;
  revenueTrend: Trend;
  headline: string;
  summary: string;
  keyFacts: string[];
  analyst_note: string;
  tags: string[];
}

function trend(values: number[]): Trend {
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const pct = ((last - prev) / Math.abs(prev)) * 100;
  if (pct > 2) return "hausse";
  if (pct < -2) return "baisse";
  return "stable";
}

const rawData: Omit<StockNews, "dividendTrend" | "incomeTrend" | "revenueTrend">[] = [
  {
    id: "sgbc-ci-2025",
    ticker: "SGBC CI",
    name: "Société Générale de Banques en Côte d'Ivoire",
    shortName: "SGBC",
    sector: "Banque",
    country: "CI",
    publishedAt: "2025-04-10T08:00:00Z",
    fiscalYear: 2025,
    revenueLabel: "PNB",
    history: [
      { year: 2021, revenue: 189096, netIncome: 67438, dividend: 1950, dy: 7.0,  roe: 22.11 },
      { year: 2022, revenue: 215101, netIncome: 74612, dividend: 2100, dy: 7.5,  roe: 21.63 },
      { year: 2023, revenue: 253286, netIncome: 97230, dividend: 2200, dy: 7.8,  roe: 24.07 },
      { year: 2024, revenue: 263207, netIncome: 101228, dividend: 2250, dy: 7.6, roe: 22.41 },
      { year: 2025, revenue: 276048, netIncome: 101351, dividend: 2293, dy: 6.56, roe: 20.47 },
    ],
    per: 10.74, pb: 2.20, dyAnnual: 7.67, bnpa: 3257.71, bnpaVar: 0.11,
    payout: 79.99, ebitda: 175466,
    headline: "SGBC CI — Dividende record de 2 293 XOF : 5e hausse consécutive",
    summary: "La Société Générale de Banques en Côte d'Ivoire publie un résultat net stable à 101,4 Md XOF pour l'exercice 2025, avec un PNB en progression de +4,9% à 276 Md XOF. Le dividende atteint un nouveau sommet historique à 2 293 XOF par action, confirmant une trajectoire de distribution ininterrompue depuis 2021.",
    keyFacts: [
      "PNB +4,9% à 276 Md XOF — croissance de 46% sur 5 ans",
      "Résultat net quasi stable à 101,4 Md XOF (+0,1%)",
      "Dividende 2 293 XOF — +17,6% par rapport à 2021",
      "Coefficient d'exploitation de 33,3% — meilleur niveau sur 5 ans",
      "ROE 20,5% — solide malgré la légère compression vs 2023",
    ],
    analyst_note: "La stabilité du résultat net masque une performance opérationnelle de qualité. Le coefficient d'exploitation à 33,3% place SGBC parmi les banques les plus efficientes de la BRVM. À un PER de 10,7x, la valorisation reste raisonnable pour une franchise de cette qualité.",
    tags: ["dividende-record", "banque", "UEMOA", "résultats-2025"],
  },
  {
    id: "etit-ci-2025",
    ticker: "ETIT CI",
    name: "Ecobank Côte d'Ivoire",
    shortName: "Ecobank CI",
    sector: "Banque",
    country: "CI",
    publishedAt: "2025-04-08T08:00:00Z",
    fiscalYear: 2025,
    revenueLabel: "PNB",
    history: [
      { year: 2021, revenue: 90545,  netIncome: 34304, dividend: 550, dy: 4.0,  roe: 23.69 },
      { year: 2022, revenue: 99155,  netIncome: 44598, dividend: 650, dy: 4.5,  roe: 27.24 },
      { year: 2023, revenue: 110189, netIncome: 48071, dividend: 680, dy: 4.6,  roe: 26.97 },
      { year: 2024, revenue: 122316, netIncome: 57477, dividend: 750, dy: 4.8,  roe: 28.83 },
      { year: 2025, revenue: 132725, netIncome: 63482, dividend: 781, dy: 4.79, roe: 29.04 },
    ],
    per: 14.14, pb: 4.11, dyAnnual: 4.88, bnpa: 1153.16, bnpaVar: 10.46,
    payout: 77.01, ebitda: 69996,
    headline: "ETIT CI — Croissance soutenue : résultat net +85% en 5 ans",
    summary: "Ecobank Côte d'Ivoire affiche une trajectoire de croissance remarquable avec un résultat net de 63,5 Md XOF en 2025 (+10,4%), soit une progression de +85% depuis 2021. Le dividende atteint 781 XOF par action, cinquième hausse consécutive. Le ROE dépasse 29%, record sur la période.",
    keyFacts: [
      "PNB +8,5% à 132,7 Md XOF — croissance continue depuis 2021",
      "Résultat net +10,4% à 63,5 Md XOF — +85% sur 5 ans",
      "Dividende 781 XOF — +42% vs 2021",
      "ROE 29,0% — meilleur niveau historique de la série",
      "BNPA +10,5% à 1 153 XOF — accélération confirmée",
    ],
    analyst_note: "La régularité de la croissance d'Ecobank CI est exceptionnelle dans le contexte BRVM. Chaque indicateur progresse de façon ordonnée depuis 5 ans. Le P/B de 4,1x peut sembler élevé mais se justifie par un ROE de 29% — rare sur la cote régionale.",
    tags: ["croissance", "banque", "dividende-hausse", "ROE-premium"],
  },
  {
    id: "boac-2025",
    ticker: "BOAC",
    name: "Bank of Africa Côte d'Ivoire",
    shortName: "BOA CI",
    sector: "Banque",
    country: "CI",
    publishedAt: "2025-04-05T08:00:00Z",
    fiscalYear: 2025,
    revenueLabel: "PNB",
    history: [
      { year: 2021, revenue: 41545, netIncome: 16638, dividend: 450, dy: 5.8, roe: 23.78 },
      { year: 2022, revenue: 47810, netIncome: 20069, dividend: 480, dy: 6.0, roe: 24.56 },
      { year: 2023, revenue: 60811, netIncome: 26075, dividend: 500, dy: 6.2, roe: 27.22 },
      { year: 2024, revenue: 72724, netIncome: 32044, dividend: 560, dy: 6.7, roe: 28.45 },
      { year: 2025, revenue: 73545, netIncome: 35540, dividend: 595, dy: 6.91, roe: 27.91 },
    ],
    per: 9.68, pb: 2.70, dyAnnual: 8.28, bnpa: 888.50, bnpaVar: 10.92,
    payout: 76.03, ebitda: 47619,
    headline: "BOAC — Résultat net +113% en 5 ans, dividende en hausse continue",
    summary: "Bank of Africa Côte d'Ivoire confirme sa dynamique de croissance avec un résultat net de 35,5 Md XOF (+10,9%) et un dividende de 595 XOF par action. Sur cinq ans, le résultat net a plus que doublé (+113%). À un PER de 9,7x, l'action offre l'une des meilleures combinaisons croissance/valorisation du secteur bancaire BRVM.",
    keyFacts: [
      "PNB +1,1% à 73,5 Md XOF — consolidation après forte croissance 2023-24",
      "Résultat net +10,9% à 35,5 Md XOF — +113% sur 5 ans",
      "Dividende 595 XOF — 5e hausse consécutive (+32% vs 2021)",
      "PER 9,7x — décote vs pairs malgré une croissance supérieure",
      "DY 8,3% — parmi les plus élevés du secteur bancaire BRVM",
    ],
    analyst_note: "BOAC présente un profil rare : forte croissance des résultats, dividende en hausse chaque année, et valorisation encore modérée. Le PER de 9,7x sous la moyenne sectorielle constitue un point d'entrée intéressant selon une lecture historique des données.",
    tags: ["valorisation-attractive", "banque", "croissance", "DY-élevé"],
  },
  {
    id: "boab-2025",
    ticker: "BOAB",
    name: "Bank of Africa Burkina Faso",
    shortName: "BOA BF",
    sector: "Banque",
    country: "BF",
    publishedAt: "2025-04-03T08:00:00Z",
    fiscalYear: 2025,
    revenueLabel: "PNB",
    history: [
      { year: 2021, revenue: 45259, netIncome: 16664, dividend: 400, dy: 5.5, roe: 17.15 },
      { year: 2022, revenue: 46413, netIncome: 19143, dividend: 450, dy: 6.0, roe: 18.29 },
      { year: 2023, revenue: 47832, netIncome: 21529, dividend: 550, dy: 7.5, roe: 19.08 },
      { year: 2024, revenue: 46527, netIncome: 19647, dividend: 560, dy: 7.6, roe: 16.74 },
      { year: 2025, revenue: 51274, netIncome: 20107, dividend: 585, dy: 7.13, roe: 17.11 },
    ],
    per: 16.56, pb: 2.83, dyAnnual: 10.00, bnpa: 495.72, bnpaVar: 2.42,
    payout: 124.26, ebitda: 24157,
    headline: "BOAB — Rendement 10% : résilience remarquable dans un contexte difficile",
    summary: "Malgré un contexte sécuritaire exigeant au Burkina Faso, Bank of Africa BF maintient un résultat net de 20,1 Md XOF (+2,4%) et distribue un dividende de 585 XOF par action, pour un rendement exceptionnel de 10% sur le cours annuel.",
    keyFacts: [
      "PNB +10,2% à 51,3 Md XOF — rebond après le recul de 2024",
      "Résultat net +2,4% à 20,1 Md XOF — stabilité dans un contexte difficile",
      "Dividende 585 XOF — DY de 10% sur le cours annuel",
      "Payout ratio 124% — distribution supérieure au résultat net de l'exercice",
      "ROE 17,1% — stable malgré les contraintes contextuelles",
    ],
    analyst_note: "Un payout ratio de 124% est un signal à surveiller : la banque puise dans ses réserves pour maintenir le dividende. Cela témoigne d'une politique de distribution volontariste, mais la soutenabilité à moyen terme mérite attention. La résilience opérationnelle reste néanmoins remarquable.",
    tags: ["DY-exceptionnel", "banque", "Burkina", "résilience"],
  },
  {
    id: "cbibf-2025",
    ticker: "CBIBF",
    name: "Coris Bank International Burkina Faso",
    shortName: "Coris Bank",
    sector: "Banque",
    country: "BF",
    publishedAt: "2025-04-01T08:00:00Z",
    fiscalYear: 2025,
    revenueLabel: "PNB",
    history: [
      { year: 2021, revenue: 90298,  netIncome: 46549, dividend: 400, dy: 3.5 },
      { year: 2022, revenue: 110567, netIncome: 56478, dividend: 450, dy: 3.8 },
      { year: 2023, revenue: 129203, netIncome: 64247, dividend: 500, dy: 4.1 },
      { year: 2024, revenue: 130987, netIncome: 47937, dividend: 510, dy: 3.3 },
      { year: 2025, revenue: 138986, netIncome: 65495, dividend: 555, dy: 3.37 },
    ],
    per: 8.06, pb: 1.17, dyAnnual: 5.61, bnpa: 2046.72, bnpaVar: 36.63,
    payout: 42.34, ebitda: 88227,
    headline: "CBIBF — BNPA +36,6% : la meilleure progression du secteur en 2025",
    summary: "Coris Bank International Burkina Faso réalise la meilleure performance bénéficiaire du secteur bancaire BRVM avec un BNPA en hausse de +36,6% à 2 047 XOF. Le résultat net bondit à 65,5 Md XOF après un creux de 2024. À un PER de seulement 8,1x et un P/B de 1,2x, l'action affiche la valorisation la plus basse du secteur.",
    keyFacts: [
      "PNB +6,1% à 139 Md XOF — leader du secteur au Burkina Faso",
      "Résultat net +36,6% à 65,5 Md XOF — fort rebond après 2024",
      "BNPA 2 047 XOF — plus forte progression sectorielle",
      "PER 8,1x — valorisation la plus basse du secteur bancaire BRVM",
      "Payout 42,3% — politique de distribution conservative, capital préservé",
    ],
    analyst_note: "Le rebond du résultat net en 2025 après le recul de 2024 confirme la solidité du modèle Coris Bank. Un PER de 8x avec un BNPA en hausse de 37% constitue une anomalie de valorisation rare. Le faible payout (42%) laisse une marge de progression du dividende significative pour les années à venir.",
    tags: ["valorisation-basse", "BNPA-croissance", "banque", "Burkina"],
  },
  {
    id: "sogb-ci-2025",
    ticker: "SOGB CI",
    name: "Société des Caoutchoucs de Grand-Béréby",
    shortName: "SOGB",
    sector: "Agro-industrie",
    country: "CI",
    publishedAt: "2025-03-28T08:00:00Z",
    fiscalYear: 2025,
    revenueLabel: "CA",
    history: [
      { year: 2021, revenue: 83074, netIncome: 14728, dividend: 480, dy: 5.8, roe: 22.24 },
      { year: 2022, revenue: 93884, netIncome: 15653, dividend: 525, dy: 6.1, roe: 22.73 },
      { year: 2023, revenue: 73448, netIncome: 5270,  dividend: 200, dy: 2.5, roe: 8.67  },
      { year: 2024, revenue: 89415, netIncome: 13111, dividend: 490, dy: 5.9, roe: 19.03 },
      { year: 2025, revenue: 98617, netIncome: 12492, dividend: 501, dy: 6.34, roe: 18.26 },
    ],
    per: 13.32, pb: 2.43, dyAnnual: 6.34, bnpa: 578.28, bnpaVar: -4.73,
    payout: 98.57, ebitda: 23541,
    headline: "SOGB CI — Reprise confirmée : dividende 501 XOF après le creux de 2023",
    summary: "Société des Caoutchoucs de Grand-Béréby publie un chiffre d'affaires de 98,6 Md XOF (+10,3%) et un résultat net de 12,5 Md XOF. L'exercice 2025 confirme le retour à la normale après l'exercice 2023 exceptionnel.",
    keyFacts: [
      "CA +10,3% à 98,6 Md XOF — meilleur niveau sur 5 ans",
      "Résultat net 12,5 Md XOF — retour au niveau 2021-2022",
      "Dividende 501 XOF vs 200 XOF en 2023 — reprise totale",
      "Payout 98,6% — quasi-intégralité du bénéfice redistribuée",
      "ROE 18,3% — encore en phase de reconstitution vs pic 2022",
    ],
    analyst_note: "La trajectoire de SOGB CI illustre la sensibilité du secteur agro-industriel aux cycles de prix des matières premières. La reprise post-2023 est franche. Le payout proche de 100% limite la capacité d'autofinancement mais signale la confiance du management dans la récurrence des résultats.",
    tags: ["reprise", "agro-industrie", "dividende-hausse", "caoutchouc"],
  },
  {
    id: "ontbf-2025",
    ticker: "ONTBF",
    name: "Onatel Burkina Faso",
    shortName: "Onatel",
    sector: "Télécommunications",
    country: "BF",
    publishedAt: "2025-03-20T08:00:00Z",
    fiscalYear: 2025,
    revenueLabel: "CA",
    history: [
      { year: 2021, revenue: 154881, netIncome: 32374, dividend: 220, dy: 7.0, roe: 44.24 },
      { year: 2022, revenue: 145625, netIncome: 22372, dividend: 165, dy: 5.3, roe: 35.41 },
      { year: 2023, revenue: 139154, netIncome: 21129, dividend: 145, dy: 4.8, roe: 34.12 },
      { year: 2024, revenue: 141841, netIncome: 21471, dividend: 155, dy: 5.1, roe: 34.32 },
      { year: 2025, revenue: 146176, netIncome: 15887, dividend: 145, dy: 5.35, roe: 27.61 },
    ],
    per: 11.60, pb: 3.20, dyAnnual: 5.84, bnpa: 233.63, bnpaVar: 1.62,
    payout: 71.08, ebitda: 64220,
    headline: "ONTBF — Résultat net -26% : le contexte sécuritaire pèse sur la profitabilité",
    summary: "Onatel Burkina Faso publie un chiffre d'affaires en hausse de +3,1% à 146,2 Md XOF, mais un résultat net en recul de -26% à 15,9 Md XOF. La dégradation de la rentabilité reflète les surcoûts opérationnels liés au contexte sécuritaire régional.",
    keyFacts: [
      "CA +3,1% à 146,2 Md XOF — résilience commerciale",
      "Résultat net -26% à 15,9 Md XOF — point bas de la série 5 ans",
      "Résultat d'exploitation -23,5% à 25,7 Md XOF",
      "ROE 27,6% vs 44,2% en 2021 — compression significative",
      "Dividende maintenu à 145 XOF malgré la baisse du résultat",
    ],
    analyst_note: "La trajectoire d'Onatel reflète l'impact structurel du contexte sécuritaire au Burkina Faso sur les coûts d'exploitation télécoms. Le maintien du CA est encourageant mais la compression des marges est sévère. Le dividende maintenu à 145 XOF est un signal positif de la direction.",
    tags: ["recul-résultat", "télécoms", "Burkina", "contexte-sécuritaire"],
  },
  {
    id: "ttlc-ci-2025",
    ticker: "TTLC CI",
    name: "TotalEnergies Marketing Côte d'Ivoire",
    shortName: "Total CI",
    sector: "Distribution pétrolière",
    country: "CI",
    publishedAt: "2025-03-15T08:00:00Z",
    fiscalYear: 2025,
    revenueLabel: "CA",
    history: [
      { year: 2021, revenue: 494433, netIncome: 11143, dividend: 130, dy: 4.8, roe: 23.15 },
      { year: 2022, revenue: 573130, netIncome: 12279, dividend: 200, dy: 6.2, roe: 24.92 },
      { year: 2023, revenue: 578922, netIncome: 8709,  dividend: 130, dy: 4.5, roe: 19.06 },
      { year: 2024, revenue: 621042, netIncome: 9374,  dividend: 150, dy: 5.2, roe: 22.80 },
      { year: 2025, revenue: 588709, netIncome: 9087,  dividend: 140, dy: 5.18, roe: 25.10 },
    ],
    per: 18.71, pb: 4.70, dyAnnual: 5.99, bnpa: 144.33, bnpaVar: 3.15,
    payout: 110.05, ebitda: 20029,
    headline: "TTLC CI — CA 589 Md XOF, dividende 140 XOF malgré des marges sous pression",
    summary: "TotalEnergies Marketing Côte d'Ivoire publie un chiffre d'affaires de 588,7 Md XOF (-5,2%) et un résultat net de 9,1 Md XOF (-3,1%). La marge nette reste structurellement basse à 1,5%, caractéristique du secteur distribution pétrolière.",
    keyFacts: [
      "CA -5,2% à 588,7 Md XOF — recul après le pic 2024",
      "Résultat net -3,1% à 9,1 Md XOF — marge nette 1,5%",
      "Dividende 140 XOF — payout 110% (supérieur au résultat net)",
      "ROE 25,1% — malgré la faiblesse des marges absolues",
      "PER 18,7x — valorisation prime vs pairs sectoriels",
    ],
    analyst_note: "Le modèle économique de la distribution pétrolière génère de forts volumes mais des marges très comprimées. Un payout de 110% sur deux ans consécutifs interroge sur la politique de dividende. Le ROE élevé (25%) est soutenu par un faible niveau de capitaux propres relatif au CA, non par des marges larges.",
    tags: ["distribution-pétrolière", "marges-faibles", "DY-régulier"],
  },
];

export const NEWS_DATA: StockNews[] = rawData.map(d => ({
  ...d,
  dividendTrend: trend(d.history.map(h => h.dividend)),
  incomeTrend:   trend(d.history.map(h => h.netIncome)),
  revenueTrend:  trend(d.history.map(h => h.revenue)),
}));

export const SECTORS: Sector[] = ["Banque", "Agro-industrie", "Distribution pétrolière", "Télécommunications"];

export function findNewsByTicker(symbol: string): StockNews | undefined {
  const sym = symbol.toUpperCase();
  return NEWS_DATA.find(n => {
    const base = n.ticker.split(' ')[0].toUpperCase();
    return base === sym || n.ticker.toUpperCase() === sym;
  });
}
