/// <reference types="node" />
// Import des etats financiers historiques SONATEL (SNTS) — couche 1 du moteur de valorisation.
//
// Sources (extraites par script, non ressaisies ; 18 assertions d'ancrage verifiees) :
//   - "etat fin SONATEL _PREV_T-1-2026 CZ.xlsx" (feuilles "Etats Financiers", "Projection")
//   - "Valorisation SONATEL _PREV_T-1-2026 CZ.xlsx" (feuille "Valorisation") pour DPA / taux de distribution.
//
// Montants en millions de FCFA. Profil inverse de SODECI : BFR structurellement
// negatif (le telecom encaisse avant de payer) et tresorerie nette positive.
//
// Points de vigilance repris de l'audit du classeur source :
//   - Tresorerie passif 2025 absente du classeur -> importee a null (traitee comme 0
//     dans la dette nette, coherent avec la feuille AE du modele : dette nette 2025 = -232 929).
//   - "Autres Dettes" 2021 differe entre feuilles (Etats Financiers 258 023 vs AE 241 066) :
//     on retient la valeur des Etats Financiers, coherente avec la feuille BFR.
//
// Usage : npx tsx scripts/importSonatelStatements.ts

import { PrismaClient, StatementPeriod } from '@prisma/client';

const prisma = new PrismaClient();

const TICKER = 'SNTS';
// 100 000 000 titres : verifie par la valo (valeur FP DCF 5 604 601 M / 56 046 F = 100 M,
// et ANC 1 274 638 M / 12 746,38 F = 100 M).
const SHARES = 100_000_000;

type FyRow = {
  year: number;
  revenue: number | null; value_added: number | null; ebe: number | null; depreciation: number | null;
  operating_income: number | null; financial_income: number | null; ordinary_income: number | null;
  hao_income: number | null; net_income: number | null; fixed_assets: number | null;
  intangible_assets: number | null; tangible_assets: number | null; financial_assets: number | null;
  current_assets: number | null; inventory: number | null; receivables: number | null;
  other_receivables: number | null; cash_assets: number | null; total_assets: number | null;
  equity: number | null; financial_debt_total: number | null; borrowings: number | null;
  financial_provisions: number | null; current_liabilities: number | null; trade_payables: number | null;
  tax_social_payables: number | null; cash_liabilities: number | null; total_liabilities: number | null;
  payout_ratio: number | null; dividend_per_share: number | null;
  equity_group_share?: number | null; minority_interests?: number | null;
};

// Repartition capitaux propres part du groupe / minoritaires — source : etats financiers
// consolides 2025 (PDF Groupe Sonatel, 16/02/2026). Le classeur Excel ne fournit pas la
// ventilation ; on ne dispose que de 2024 et 2025, suffisant pour l'ANC et le pont DCF
// (bases sur le dernier exercice).
const EQUITY_SPLIT: Record<number, { equity_group_share: number; minority_interests: number }> = {
  2024: { equity_group_share: 1_050_347, minority_interests: 224_291 },
  2025: { equity_group_share: 1_160_715, minority_interests: 238_547 }
};
type InterimRow = { year: number; period: 'T1'; revenue: number | null; net_income: number | null };

const FY: FyRow[] = [
  {
    year: 2014,
    revenue: 816019,
    value_added: 503142,
    ebe: 426234,
    depreciation: 121466,
    operating_income: 315949,
    financial_income: 3592,
    ordinary_income: 319541,
    hao_income: 226,
    net_income: 218214,
    fixed_assets: 689862,
    intangible_assets: 28519,
    tangible_assets: 530360,
    financial_assets: 130966,
    current_assets: 203960,
    inventory: 16327,
    receivables: 105589,
    other_receivables: 82044,
    cash_assets: 224072,
    total_assets: 1117894,
    equity: 655021,
    financial_debt_total: 45507,
    borrowings: 2922,
    financial_provisions: 42346,
    current_liabilities: 390095,
    trade_payables: 182606,
    tax_social_payables: 207489,
    cash_liabilities: 27271,
    total_liabilities: 1117894,
    payout_ratio: 0.6699,
    dividend_per_share: 1461.8156
  },
  {
    year: 2015,
    revenue: 863291,
    value_added: 529974,
    ebe: 455856,
    depreciation: 138736,
    operating_income: 327791,
    financial_income: 3012,
    ordinary_income: 330801,
    hao_income: -1811,
    net_income: 221088,
    fixed_assets: 738415,
    intangible_assets: 31137,
    tangible_assets: 565288,
    financial_assets: 141977,
    current_assets: 208623,
    inventory: 15645,
    receivables: 114983,
    other_receivables: 77995,
    cash_assets: 266027,
    total_assets: 1213065,
    equity: 692241,
    financial_debt_total: 55820,
    borrowings: 2191,
    financial_provisions: 53404,
    current_liabilities: 427138,
    trade_payables: 195411,
    tax_social_payables: 231727,
    cash_liabilities: 37866,
    total_liabilities: 1213065,
    payout_ratio: 0.6647,
    dividend_per_share: 1469.5719
  },
  {
    year: 2016,
    revenue: 905036,
    value_added: 526224,
    ebe: 442775,
    depreciation: 131426,
    operating_income: 323158,
    financial_income: -10426,
    ordinary_income: 312732,
    hao_income: 3648,
    net_income: 215881,
    fixed_assets: 929340,
    intangible_assets: 77558,
    tangible_assets: 595046,
    financial_assets: 255536,
    current_assets: 213271,
    inventory: 16143,
    receivables: 128217,
    other_receivables: 68911,
    cash_assets: 248690,
    total_assets: 1391301,
    equity: 711128,
    financial_debt_total: 61821,
    borrowings: 1923,
    financial_provisions: 59225,
    current_liabilities: 421677,
    trade_payables: 188326,
    tax_social_payables: 233351,
    cash_liabilities: 196676,
    total_liabilities: 1391302,
    payout_ratio: 0.7722,
    dividend_per_share: 1667.0331
  },
  {
    year: 2017,
    revenue: 972905,
    value_added: 542287,
    ebe: 448662,
    depreciation: 160593,
    operating_income: 307786,
    financial_income: -8659,
    ordinary_income: 299128,
    hao_income: -1662,
    net_income: 202186,
    fixed_assets: 1106709,
    intangible_assets: 297606,
    tangible_assets: 652255,
    financial_assets: 155950,
    current_assets: 257615,
    inventory: 14236,
    receivables: 120951,
    other_receivables: 122428,
    cash_assets: 231339,
    total_assets: 1595663,
    equity: 715941,
    financial_debt_total: 218684,
    borrowings: 158329,
    financial_provisions: 59694,
    current_liabilities: 514082,
    trade_payables: 273017,
    tax_social_payables: 241065,
    cash_liabilities: 146956,
    total_liabilities: 1595663,
    payout_ratio: 0.8245,
    dividend_per_share: 1667.0236
  },
  {
    year: 2018,
    revenue: 1021956,
    value_added: 580895,
    ebe: 472477,
    depreciation: 168955,
    operating_income: 312287,
    financial_income: -13517,
    ordinary_income: 298769,
    hao_income: -3380,
    net_income: 202297,
    fixed_assets: 1157723,
    intangible_assets: 287573,
    tangible_assets: 706798,
    financial_assets: 163352,
    current_assets: 298211,
    inventory: 13157,
    receivables: 129735,
    other_receivables: 155319,
    cash_assets: 317439,
    total_assets: 1773373,
    equity: 717426,
    financial_debt_total: 262995,
    borrowings: 190053,
    financial_provisions: 72293,
    current_liabilities: 568963,
    trade_payables: 264233,
    tax_social_payables: 304730,
    cash_liabilities: 223989,
    total_liabilities: 1773373,
    payout_ratio: 0.891,
    dividend_per_share: 1802.4663
  },
  {
    year: 2019,
    revenue: 1086756,
    value_added: 599415,
    ebe: 481090,
    depreciation: 182825,
    operating_income: 316748,
    financial_income: -24539,
    ordinary_income: 292209,
    hao_income: 2490,
    net_income: 195343,
    fixed_assets: 1246983,
    intangible_assets: 323538,
    tangible_assets: 759475,
    financial_assets: 163970,
    current_assets: 295399,
    inventory: 14338,
    receivables: 123228,
    other_receivables: 157833,
    cash_assets: 352815,
    total_assets: 1895197,
    equity: 714420,
    financial_debt_total: 306834,
    borrowings: 234728,
    financial_provisions: 72106,
    current_liabilities: 667628,
    trade_payables: 289355,
    tax_social_payables: 378273,
    cash_liabilities: 206415,
    total_liabilities: 1895297,
    payout_ratio: 0.6968,
    dividend_per_share: 1361.15
  },
  {
    year: 2020,
    revenue: 1206086,
    value_added: null,
    ebe: null,
    depreciation: 286385,
    operating_income: 339081,
    financial_income: -29460,
    ordinary_income: null,
    hao_income: null,
    net_income: 201272,
    fixed_assets: 1277514,
    intangible_assets: 313593,
    tangible_assets: 778797,
    financial_assets: 185124,
    current_assets: 419669,
    inventory: 12302,
    receivables: 130467,
    other_receivables: 276900,
    cash_assets: 199692,
    total_assets: 1896875,
    equity: 749177,
    financial_debt_total: 350903,
    borrowings: 341143,
    financial_provisions: 9760,
    current_liabilities: 668099,
    trade_payables: 478183,
    tax_social_payables: 189916,
    cash_liabilities: 128694,
    total_liabilities: 1896873,
    payout_ratio: 0.6763,
    dividend_per_share: 1361.2025
  },
  {
    year: 2021,
    revenue: 1334874,
    value_added: null,
    ebe: 580276,
    depreciation: 308709,
    operating_income: 399654,
    financial_income: -24177,
    ordinary_income: null,
    hao_income: null,
    net_income: 252459,
    fixed_assets: 1316762,
    intangible_assets: 309744,
    tangible_assets: 843065,
    financial_assets: 163953,
    current_assets: 502877,
    inventory: 18098,
    receivables: 142135,
    other_receivables: 342644,
    cash_assets: 244206,
    total_assets: 2063845,
    equity: 821250,
    financial_debt_total: 259273,
    borrowings: 247705,
    financial_provisions: 11568,
    current_liabilities: 813727,
    trade_payables: 555704,
    tax_social_payables: 258023,
    cash_liabilities: 169594,
    total_liabilities: 2063844,
    payout_ratio: 0.6162,
    dividend_per_share: 1555.6524
  },
  {
    year: 2022,
    revenue: 1455049,
    value_added: null,
    ebe: null,
    depreciation: 337646,
    operating_income: 437059,
    financial_income: -14785,
    ordinary_income: null,
    hao_income: null,
    net_income: 278913,
    fixed_assets: 1370876,
    intangible_assets: 277578,
    tangible_assets: 921033,
    financial_assets: 172265,
    current_assets: 604524,
    inventory: 26652,
    receivables: 166102,
    other_receivables: 411770,
    cash_assets: 276791,
    total_assets: 2252191,
    equity: 898524,
    financial_debt_total: 256647,
    borrowings: 244261,
    financial_provisions: 12386,
    current_liabilities: 909125,
    trade_payables: 614187,
    tax_social_payables: 294938,
    cash_liabilities: 187896,
    total_liabilities: 2252192,
    payout_ratio: 0.5976,
    dividend_per_share: 1666.7841
  },
  {
    year: 2023,
    revenue: 1620701,
    value_added: null,
    ebe: null,
    depreciation: 346077,
    operating_income: 515707.4,
    financial_income: -19244,
    ordinary_income: null,
    hao_income: null,
    net_income: 331748.4,
    fixed_assets: 1501529,
    intangible_assets: 298763,
    tangible_assets: 1000314,
    financial_assets: 202452,
    current_assets: 672307,
    inventory: 26136,
    receivables: 184735,
    other_receivables: 461436,
    cash_assets: 400024,
    total_assets: 2573860,
    equity: 1065723.642,
    financial_debt_total: 221263.841,
    borrowings: 186546.325,
    financial_provisions: 34717.516,
    current_liabilities: 1067634.667,
    trade_payables: 296873.667,
    tax_social_payables: 770761,
    cash_liabilities: 219235.899,
    total_liabilities: 2573858.049,
    payout_ratio: 0.5275,
    dividend_per_share: 1749.9728
  },
  {
    year: 2024,
    revenue: 1776443,
    value_added: null,
    ebe: null,
    depreciation: 231654,
    operating_income: 619524,
    financial_income: -23268,
    ordinary_income: null,
    hao_income: null,
    net_income: 393662,
    fixed_assets: 1634589,
    intangible_assets: 288038,
    tangible_assets: 1120744,
    financial_assets: 225807,
    current_assets: 1010338,
    inventory: 25321,
    receivables: 245489,
    other_receivables: 739528,
    cash_assets: 460360,
    total_assets: 3105287,
    equity: 1274638,
    financial_debt_total: 326443,
    borrowings: 304227,
    financial_provisions: 22216,
    current_liabilities: 1279285,
    trade_payables: 768521,
    tax_social_payables: 510764,
    cash_liabilities: 224922,
    total_liabilities: 3105288,
    payout_ratio: 0.4671,
    dividend_per_share: 1838.7952
  },
  {
    year: 2025,
    revenue: 1923122,
    value_added: null,
    ebe: null,
    depreciation: 251451,
    operating_income: 669792,
    financial_income: -20805,
    ordinary_income: null,
    hao_income: null,
    net_income: 413588,
    fixed_assets: 1626022,
    intangible_assets: 249633,
    tangible_assets: 1143487,
    financial_assets: 232902,
    current_assets: 1108050,
    inventory: 26127,
    receivables: 243228,
    other_receivables: 838695,
    cash_assets: 536105,
    total_assets: 3270177,
    equity: 1399263,
    financial_debt_total: 303176,
    borrowings: 289610,
    financial_provisions: 13566,
    current_liabilities: 1299772,
    trade_payables: 655916,
    tax_social_payables: 643856,
    cash_liabilities: null,
    total_liabilities: 3002211,
    payout_ratio: 0.4674,
    dividend_per_share: 1933.1103
  }];

const INTERIM: InterimRow[] = [
  { year: 2025, period: 'T1', revenue: 471600, net_income: 108400 },
  { year: 2026, period: 'T1', revenue: 504200, net_income: 113800 }];

async function main() {
  const stock = await prisma.stock.findUnique({ where: { symbol: TICKER } });
  if (!stock) throw new Error(`Action ${TICKER} absente de la table stocks.`);

  if (stock.shares_outstanding !== SHARES) {
    await prisma.stock.update({ where: { id: stock.id }, data: { shares_outstanding: SHARES, currency: 'XOF' } });
    console.log(`Stock ${TICKER} : shares_outstanding = ${SHARES.toLocaleString('fr-FR')}`);
  }

  let upserts = 0;
  for (const { year, ...rest } of FY) {
    const fields = { ...rest, ...(EQUITY_SPLIT[year] ?? {}) };
    await prisma.financialStatement.upsert({
      where: { stock_ticker_year_period: { stock_ticker: TICKER, year, period: StatementPeriod.FY } },
      create: { stock_ticker: TICKER, year, period: StatementPeriod.FY, source: 'Rapport annuel SYSCOHADA', ...fields },
      update: fields
    });
    upserts += 1;
  }
  for (const { year, period, ...fields } of INTERIM) {
    await prisma.financialStatement.upsert({
      where: { stock_ticker_year_period: { stock_ticker: TICKER, year, period: StatementPeriod[period] } },
      create: { stock_ticker: TICKER, year, period: StatementPeriod[period], source: `Publication ${period} ${year}`, ...fields },
      update: fields
    });
    upserts += 1;
  }

  const y = FY.find((r) => r.year === 2025)!;
  const netDebt = (y.financial_debt_total ?? 0) + (y.cash_liabilities ?? 0) - (y.cash_assets ?? 0);
  const bfr = (y.receivables ?? 0) + (y.other_receivables ?? 0) + (y.inventory ?? 0) - (y.trade_payables ?? 0) - (y.tax_social_payables ?? 0);
  if (Math.abs(netDebt - -232929) > 0.01) throw new Error(`Dette nette 2025 = ${netDebt}, attendu -232929`);
  if (Math.abs(bfr - -191722) > 0.01) throw new Error(`BFR 2025 = ${bfr}, attendu -191722`);

  console.log(`${upserts} etats financiers upsertes pour ${TICKER}.`);
  console.log(`Controle dette nette 2025 : ${netDebt.toFixed(0)} M (net cash) — OK`);
  console.log(`Controle BFR 2025 : ${bfr.toFixed(0)} M (negatif) — OK`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
