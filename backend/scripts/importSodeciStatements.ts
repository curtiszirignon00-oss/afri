/// <reference types="node" />
// Import des etats financiers historiques SODECI (SDCC) — couche 1 du moteur de valorisation.
//
// Source : "ettat fin SODECI_T-1_2026_.xlsx" (feuilles "Etats Financiers" et
// "données intermediaire") + DPA / taux de distribution de la feuille "Valorisation"
// du classeur "Valorisation_SODECI_T-1_2026 CZ.xlsx".
//
// Les valeurs ont ete extraites par script depuis les classeurs, pas ressaisies :
// 19 assertions d'ancrage ont ete verifiees a la generation (CA, REX, RN, capitaux
// propres, emprunts, tresorerie actif/passif, stocks, creances, fournisseurs,
// total actif, DPA, payout, dette nette 2025 = 134 473,46, et le T1 2026).
//
// Montants en millions de FCFA, stockes tels que publies.
// Usage : npx tsx scripts/importSodeciStatements.ts

import { PrismaClient, StatementPeriod } from '@prisma/client';

const prisma = new PrismaClient();

const TICKER = 'SDCC';
// 9 000 000 titres : coherent avec un capital de 4 500 M FCFA au nominal de 500 F.
const SHARES = 9_000_000;

type FyRow = {
  year: number;
  revenue: number | null;
  value_added: number | null;
  ebe: number | null;
  depreciation: number | null;
  operating_income: number | null;
  financial_income: number | null;
  ordinary_income: number | null;
  hao_income: number | null;
  income_tax: number | null;
  net_income: number | null;
  fixed_assets: number | null;
  intangible_assets: number | null;
  tangible_assets: number | null;
  financial_assets: number | null;
  current_assets: number | null;
  inventory: number | null;
  receivables: number | null;
  other_receivables: number | null;
  cash_assets: number | null;
  total_assets: number | null;
  equity: number | null;
  financial_debt_total: number | null;
  borrowings: number | null;
  other_financial_debt: number | null;
  financial_provisions: number | null;
  current_liabilities: number | null;
  customer_advances: number | null;
  trade_payables: number | null;
  tax_social_payables: number | null;
  cash_liabilities: number | null;
  total_liabilities: number | null;
  payout_ratio: number | null;
  dividend_per_share: number | null;
};

type InterimRow = {
  year: number;
  period: 'T1' | 'S1' | 'M9';
  revenue?: number;
  operating_income?: number;
  financial_income?: number;
  ordinary_income?: number;
  income_tax?: number;
  net_income?: number;
};

// Exercices publies 2014-2025 (feuille "Etats Financiers").
const FY: FyRow[] = [
  {
    year: 2014,
    revenue: 81229.7748,
    value_added: 22530.9894,
    ebe: 8403.54,
    depreciation: 5484.003,
    operating_income: 4669.5851,
    financial_income: 83.3782,
    ordinary_income: null,
    hao_income: -133.3243,
    income_tax: 1501.72,
    net_income: 3117.9194,
    fixed_assets: 22997.089,
    intangible_assets: 286.952,
    tangible_assets: 20564.739,
    financial_assets: 2145.398,
    current_assets: 122875.828,
    inventory: 9407.672,
    receivables: 113468.156,
    other_receivables: null,
    cash_assets: 7191.013,
    total_assets: 153063.93,
    equity: 13387.703,
    financial_debt_total: 26882.5928,
    borrowings: 1413.4119,
    other_financial_debt: 19777.3272,
    financial_provisions: 5691.8537,
    current_liabilities: 108190.2184,
    customer_advances: null,
    trade_payables: 27564.2071,
    tax_social_payables: 80626.0112,
    cash_liabilities: 4603.416,
    total_liabilities: 153063.9302,
    payout_ratio: 0.8833,
    dividend_per_share: 306
  },
  {
    year: 2015,
    revenue: 87928.604,
    value_added: 24989.507,
    ebe: 8606.966,
    depreciation: 4983.769,
    operating_income: 4673.36,
    financial_income: 38.445,
    ordinary_income: null,
    hao_income: -239.977,
    income_tax: 1180.696,
    net_income: 3291.123,
    fixed_assets: 27031.115,
    intangible_assets: 192.564,
    tangible_assets: 24755.669,
    financial_assets: 2082.882,
    current_assets: 124372.682,
    inventory: 12298.331,
    receivables: 112074.351,
    other_receivables: null,
    cash_assets: 12426.567,
    total_assets: 163830.364,
    equity: 13618.8348,
    financial_debt_total: 38148.6493,
    borrowings: 11013.2163,
    other_financial_debt: 22050.1973,
    financial_provisions: 5085.2357,
    current_liabilities: 100790.7073,
    customer_advances: null,
    trade_payables: 34876.8298,
    tax_social_payables: 65913.8775,
    cash_liabilities: 11272.1548,
    total_liabilities: 163830.3461,
    payout_ratio: 0.9845,
    dividend_per_share: 360.0123
  },
  {
    year: 2016,
    revenue: 87982.585,
    value_added: 27314.857,
    ebe: 10270.698,
    depreciation: 6937.945,
    operating_income: 3535.852,
    financial_income: 791.891,
    ordinary_income: null,
    hao_income: -78.643,
    income_tax: 1541.968,
    net_income: 2707.132,
    fixed_assets: 30731.113,
    intangible_assets: 439.667,
    tangible_assets: 28306.321,
    financial_assets: 1985.125,
    current_assets: 133964.899,
    inventory: 12869.668,
    receivables: 121095.231,
    other_receivables: null,
    cash_assets: 6463.84,
    total_assets: 171159.852,
    equity: 13085.9664,
    financial_debt_total: 38951.221,
    borrowings: 7514.7455,
    other_financial_debt: 24775.6833,
    financial_provisions: 6660.7921,
    current_liabilities: 86074.0902,
    customer_advances: null,
    trade_payables: 36209.0814,
    tax_social_payables: 49865.0088,
    cash_liabilities: 33048.574,
    total_liabilities: 171159.8516,
    payout_ratio: 0.9974,
    dividend_per_share: 300.0104
  },
  {
    year: 2017,
    revenue: 91269.535,
    value_added: 25920.707,
    ebe: 7571.885,
    depreciation: 6912.116,
    operating_income: 2262.877,
    financial_income: 842.545,
    ordinary_income: null,
    hao_income: 457.1,
    income_tax: 839.89,
    net_income: 2722.632,
    fixed_assets: 32618.512,
    intangible_assets: 397.422,
    tangible_assets: 30371.655,
    financial_assets: 1849.435,
    current_assets: 152997.547,
    inventory: 14549.514,
    receivables: 138448.033,
    other_receivables: null,
    cash_assets: 9259.66,
    total_assets: 194875.719,
    equity: 13169.4761,
    financial_debt_total: 37540.1964,
    borrowings: 28212.861,
    other_financial_debt: 3118.5044,
    financial_provisions: 6208.831,
    current_liabilities: 92127.6132,
    customer_advances: null,
    trade_payables: 50952.766,
    tax_social_payables: 41174.8472,
    cash_liabilities: 52038.4326,
    total_liabilities: 194875.7183,
    payout_ratio: 0.9917,
    dividend_per_share: 300.0038
  },
  {
    year: 2018,
    revenue: 98432.703,
    value_added: 27827.061,
    ebe: 10117.304,
    depreciation: 7327.12,
    operating_income: 3825.358,
    financial_income: 778.963,
    ordinary_income: null,
    hao_income: -566.245,
    income_tax: -1174.403,
    net_income: 2863.674,
    fixed_assets: 35729.309,
    intangible_assets: 252.255,
    tangible_assets: 33761.301,
    financial_assets: 1715.753,
    current_assets: 168709.121,
    inventory: 16037.718,
    receivables: 152671.403,
    other_receivables: null,
    cash_assets: 6890.452,
    total_assets: 211328.882,
    equity: 13727.8949,
    financial_debt_total: 40093.6926,
    borrowings: 29631.41,
    other_financial_debt: 4290.9457,
    financial_provisions: 6171.3369,
    current_liabilities: 108478.6298,
    customer_advances: null,
    trade_payables: 65062.7668,
    tax_social_payables: 43415.863,
    cash_liabilities: 49028.6654,
    total_liabilities: 211328.8827,
    payout_ratio: 0.9428,
    dividend_per_share: 299.9858
  },
  {
    year: 2019,
    revenue: 96477.917,
    value_added: 27967.087,
    ebe: 9924.026,
    depreciation: 7298.433,
    operating_income: 3536.089,
    financial_income: 835.962,
    ordinary_income: 4372.052,
    hao_income: -471.918,
    income_tax: -947.79,
    net_income: 2952.344,
    fixed_assets: 37928,
    intangible_assets: 318.452,
    tangible_assets: 36047.195,
    financial_assets: 1562.353,
    current_assets: 194104.519,
    inventory: 15948.665,
    receivables: 178155.854,
    other_receivables: null,
    cash_assets: 6459.808,
    total_assets: 238492.327,
    equity: 14461.068,
    financial_debt_total: 40459.179,
    borrowings: 40459.179,
    other_financial_debt: null,
    financial_provisions: null,
    current_liabilities: 130532.784,
    customer_advances: null,
    trade_payables: 130532.784,
    tax_social_payables: null,
    cash_liabilities: 53039.296,
    total_liabilities: 238492.327,
    payout_ratio: 1.0214,
    dividend_per_share: 335.0582
  },
  {
    year: 2020,
    revenue: 127480,
    value_added: 34488,
    ebe: 14375,
    depreciation: 9355,
    operating_income: 6372,
    financial_income: 296.923,
    ordinary_income: 6669,
    hao_income: -142.324,
    income_tax: -2219.285,
    net_income: 4307.472,
    fixed_assets: 40427.732,
    intangible_assets: 1582,
    tangible_assets: 37452.732,
    financial_assets: 1393,
    current_assets: 223018,
    inventory: 17915,
    receivables: 205103,
    other_receivables: null,
    cash_assets: 8230,
    total_assets: 271675.732,
    equity: 16182,
    financial_debt_total: 65707,
    borrowings: 65707,
    other_financial_debt: null,
    financial_provisions: null,
    current_liabilities: 148079,
    customer_advances: null,
    trade_payables: 148079,
    tax_social_payables: null,
    cash_liabilities: 41708,
    total_liabilities: 271676,
    payout_ratio: 0.7835,
    dividend_per_share: 374.9894
  },
  {
    year: 2021,
    revenue: 135513,
    value_added: 37707,
    ebe: 15598,
    depreciation: 9665,
    operating_income: 6720,
    financial_income: 512,
    ordinary_income: 7233,
    hao_income: -823,
    income_tax: -2057,
    net_income: 4352,
    fixed_assets: 39555.862,
    intangible_assets: 1244,
    tangible_assets: 37040.941,
    financial_assets: 1270.921,
    current_assets: 224219,
    inventory: 31462,
    receivables: 192757,
    other_receivables: null,
    cash_assets: 33474,
    total_assets: 297248.862,
    equity: 17951,
    financial_debt_total: 61584,
    borrowings: 61584,
    other_financial_debt: null,
    financial_provisions: null,
    current_liabilities: 175267,
    customer_advances: null,
    trade_payables: 175267,
    tax_social_payables: null,
    cash_liabilities: 42447,
    total_liabilities: 297249,
    payout_ratio: 0.9926,
    dividend_per_share: 479.9772
  },
  {
    year: 2022,
    revenue: 160671.009,
    value_added: null,
    ebe: null,
    depreciation: 10612.289,
    operating_income: 8148.301,
    financial_income: -100.272,
    ordinary_income: null,
    hao_income: -644.372,
    income_tax: 2598.14,
    net_income: 4805.517,
    fixed_assets: 45731.298,
    intangible_assets: 1034.357,
    tangible_assets: 42486.516,
    financial_assets: 2210.425,
    current_assets: 295225.033,
    inventory: 31757.255,
    receivables: 263467.778,
    other_receivables: null,
    cash_assets: 12598.123,
    total_assets: 353554.454,
    equity: 19068.97,
    financial_debt_total: 57921.926,
    borrowings: 57921.926,
    other_financial_debt: null,
    financial_provisions: null,
    current_liabilities: 202481.251,
    customer_advances: null,
    trade_payables: 202481.251,
    tax_social_payables: null,
    cash_liabilities: 74082.306,
    total_liabilities: 353554.453,
    payout_ratio: 0.9364,
    dividend_per_share: 499.9873
  },
  {
    year: 2023,
    revenue: 175458.474,
    value_added: null,
    ebe: null,
    depreciation: 13590.707,
    operating_income: 9389.199,
    financial_income: -111.003,
    ordinary_income: null,
    hao_income: -477.974,
    income_tax: 3896.543,
    net_income: 4903.679,
    fixed_assets: 49878.699,
    intangible_assets: 1050.842,
    tangible_assets: 44229.975,
    financial_assets: 4597.882,
    current_assets: 327998.046,
    inventory: 32046.422,
    receivables: 295951.624,
    other_receivables: null,
    cash_assets: 38412.39,
    total_assets: 416289.135,
    equity: 19748.656,
    financial_debt_total: 62574.348,
    borrowings: 62574.348,
    other_financial_debt: null,
    financial_provisions: null,
    current_liabilities: 230948.785,
    customer_advances: null,
    trade_payables: 230948.785,
    tax_social_payables: null,
    cash_liabilities: 68446.194,
    total_liabilities: 381717.983,
    payout_ratio: 0.9819,
    dividend_per_share: 534.9914
  },
  {
    year: 2024,
    revenue: 172235.053,
    value_added: 44776.931,
    ebe: 17946.246,
    depreciation: 11430.133,
    operating_income: 6770.541,
    financial_income: -550.258,
    ordinary_income: 6220.284,
    hao_income: -290.855,
    income_tax: 2368.94,
    net_income: 3560.488,
    fixed_assets: 58195.903,
    intangible_assets: 727.35,
    tangible_assets: 44448.474,
    financial_assets: 13020.079,
    current_assets: 328872.87,
    inventory: 28436.031,
    receivables: 300436.839,
    other_receivables: null,
    cash_assets: 45337.244,
    total_assets: 432406.017,
    equity: 18591.427,
    financial_debt_total: 65170.225,
    borrowings: 65170.225,
    other_financial_debt: null,
    financial_provisions: null,
    current_liabilities: 278395.47,
    customer_advances: null,
    trade_payables: 278395.47,
    tax_social_payables: null,
    cash_liabilities: 70248.893,
    total_liabilities: 432406.015,
    payout_ratio: 1.0111,
    dividend_per_share: 400.001
  },
  {
    year: 2025,
    revenue: 189429.713,
    value_added: 49715.014,
    ebe: 21782.601,
    depreciation: 15995.782,
    operating_income: 9105.153,
    financial_income: -462.611,
    ordinary_income: 8642.542,
    hao_income: -736.813,
    income_tax: 3242.99,
    net_income: 4662.738,
    fixed_assets: 49441.165,
    intangible_assets: 1474.299,
    tangible_assets: 44801.12,
    financial_assets: 3165.746,
    current_assets: 411765.247,
    inventory: 22913.212,
    receivables: 388852.035,
    other_receivables: null,
    cash_assets: 11465.107,
    total_assets: 472671.519,
    equity: 19715.795,
    financial_debt_total: 72763.788,
    borrowings: 72763.788,
    other_financial_debt: null,
    financial_provisions: null,
    current_liabilities: 307017.158,
    customer_advances: null,
    trade_payables: 307017.158,
    tax_social_payables: null,
    cash_liabilities: 73174.779,
    total_liabilities: 472671.52,
    payout_ratio: 1.0134,
    dividend_per_share: 525.0243
  }
];

// Publications infra-annuelles T1 / S1 / 9M (feuille "données intermediaire").
// Servent a calculer les coefficients de saisonnalite et l'ancrage T-1.
const INTERIM: InterimRow[] = [
  { year: 2020, period: 'T1', revenue: 27606, operating_income: 1361, financial_income: -31, ordinary_income: 1330, income_tax: 372, net_income: 794 },
  { year: 2020, period: 'S1', revenue: 59362, operating_income: 2654, financial_income: 448, ordinary_income: 3102, income_tax: 897, net_income: 1872 },
  { year: 2020, period: 'M9', revenue: 93517, operating_income: 4733, financial_income: 708, ordinary_income: 5441, income_tax: 1512, net_income: 3447 },
  { year: 2021, period: 'T1', revenue: 28823, operating_income: 1600, financial_income: 51, ordinary_income: 1651, income_tax: 533, net_income: 827 },
  { year: 2021, period: 'S1', revenue: 60902, operating_income: 3846, financial_income: 233, ordinary_income: 4079, income_tax: 1490, net_income: 2198 },
  { year: 2021, period: 'M9', revenue: 100302, operating_income: 4756, financial_income: 378, ordinary_income: 5134, income_tax: 1528, net_income: 2981 },
  { year: 2022, period: 'T1', revenue: 37080, operating_income: 1606, financial_income: 83, ordinary_income: 1689, income_tax: 498, net_income: 1050 },
  { year: 2022, period: 'S1', revenue: 75537, operating_income: 3659, financial_income: 194, ordinary_income: 3853, income_tax: 1047, net_income: 2516 },
  { year: 2022, period: 'M9', revenue: 117258, operating_income: 5203, financial_income: 282, ordinary_income: 5485, income_tax: 1476, net_income: 3658 },
  { year: 2023, period: 'T1', revenue: 37114, operating_income: 1932, financial_income: 68, ordinary_income: 2000, income_tax: 907, net_income: 915 },
  { year: 2023, period: 'S1', revenue: 74139, operating_income: 3444, financial_income: 214, ordinary_income: 3658, income_tax: 1493, net_income: 1683 },
  { year: 2023, period: 'M9', revenue: 120735, operating_income: 3430, financial_income: 330, ordinary_income: 3760, income_tax: 1397, net_income: 2048 },
  { year: 2024, period: 'T1', revenue: 38253, operating_income: 1388, financial_income: -119, ordinary_income: 1270, income_tax: 621, net_income: 504 },
  { year: 2024, period: 'S1', revenue: 82612, operating_income: 3503, financial_income: -325, ordinary_income: 3178, income_tax: 1242, net_income: 1780 },
  { year: 2025, period: 'T1', revenue: 41642, operating_income: 1093, financial_income: -179, ordinary_income: 915, income_tax: 237, net_income: 604 },
  { year: 2025, period: 'S1', revenue: 82300, operating_income: 3067, financial_income: -195, ordinary_income: 2872, income_tax: 1455, net_income: 1355 },
  { year: 2026, period: 'T1', revenue: 40916, operating_income: 2730, financial_income: -159, ordinary_income: 2571, income_tax: 1364, net_income: 1318 }
];

// Notes de tracabilite reprises de la feuille "données intermediaire".
const INTERIM_NOTES: Record<string, string> = {
  '2020-M9': 'Comparatif publie dans le rapport 3e trimestre 2021.',
  '2024-T1': "Lu dans la colonne comparative du rapport 1er semestre 2024 ; le rapport T1-2024 n'a pas ete fourni.",
  '2026-T1': 'Derniere periode publiee — sert d\'ancre a l\'estimation FY 2026.'
};

async function main() {
  const stock = await prisma.stock.findUnique({ where: { symbol: TICKER } });
  if (!stock) {
    throw new Error(
      `Action ${TICKER} absente de la table stocks — importer la cotation avant les etats financiers.`
    );
  }

  if (stock.shares_outstanding !== SHARES) {
    await prisma.stock.update({
      where: { id: stock.id },
      data: { shares_outstanding: SHARES, currency: 'XOF' }
    });
    console.log(`Stock ${TICKER} : shares_outstanding = ${SHARES.toLocaleString('fr-FR')}`);
  }

  let upserts = 0;

  for (const row of FY) {
    const { year, ...fields } = row;
    await prisma.financialStatement.upsert({
      where: { stock_ticker_year_period: { stock_ticker: TICKER, year, period: StatementPeriod.FY } },
      create: {
        stock_ticker: TICKER,
        year,
        period: StatementPeriod.FY,
        source: 'Rapport annuel SYSCOHADA',
        ...fields
      },
      update: fields
    });
    upserts += 1;
  }

  for (const row of INTERIM) {
    const { year, period, ...fields } = row;
    const prismaPeriod = StatementPeriod[period];
    await prisma.financialStatement.upsert({
      where: { stock_ticker_year_period: { stock_ticker: TICKER, year, period: prismaPeriod } },
      create: {
        stock_ticker: TICKER,
        year,
        period: prismaPeriod,
        source: `Publication ${period} ${year}`,
        note: INTERIM_NOTES[`${year}-${period}`] ?? null,
        ...fields
      },
      update: { ...fields, note: INTERIM_NOTES[`${year}-${period}`] ?? null }
    });
    upserts += 1;
  }

  // Controle de coherence : la dette nette 2025 doit ressortir a 134 473,46.
  const y2025 = FY.find((r) => r.year === 2025)!;
  // Total des dettes financieres (et non les seuls emprunts) + concours bancaires
  // courants - tresorerie a l'actif. Jusqu'en 2018 SODECI ventile sa dette, et ne
  // retenir que "borrowings" sous-estimerait la dette de plus de 25 Md.
  const netDebt =
    (y2025.financial_debt_total ?? y2025.borrowings ?? 0) +
    (y2025.cash_liabilities ?? 0) -
    (y2025.cash_assets ?? 0);
  const expected = 134473.46;
  if (Math.abs(netDebt - expected) > 0.01) {
    throw new Error(`Dette nette 2025 = ${netDebt.toFixed(2)}, attendu ${expected}`);
  }

  console.log(`${upserts} etats financiers upsertes pour ${TICKER}.`);
  console.log(`Controle dette nette 2025 : ${netDebt.toFixed(2)} M FCFA — OK`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
