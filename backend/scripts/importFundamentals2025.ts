/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// All monetary values in M XOF — stored as-is (no conversion)
// Source: fondamental_brvm_2025.docx (résultats au 31 déc. 2025)
// Note: "BOA CI" section in doc is a copy-paste error of SOGB CI → skipped
const data2025 = [
  {
    ticker: 'SOGC',   // SOGB CI — Société des Caoutchoucs de Grand-Béréby
    isBank: false,
    revenue: 98_617,
    net_income: 12_492,
    total_actif: 90_288,
    total_dettes_financieres: 9_323,
    total_capitaux_propres: 68_430,
    ebitda: 23_541,
    roe: 18.26,
    roa: 20.16,
    net_margin: 12.67,
    operating_margin: 17.30,
    cost_ratio: 76.66,
    eps: 578.28,
    pe_ratio: 13.32,
    dividend: 501,
  },
  {
    ticker: 'ONTBF',  // Onatel Burkina Faso
    isBank: false,
    revenue: 146_176,
    net_income: 15_887,
    total_actif: 324_902,
    total_dettes_financieres: 69_691,
    total_capitaux_propres: 57_541,
    ebitda: 64_220,
    roe: 27.61,
    roa: 1.92,
    net_margin: 10.87,
    operating_margin: 17.56,
    cost_ratio: 63.93,
    eps: 233.63,
    pe_ratio: 11.60,
    dividend: 145,
  },
  {
    ticker: 'BOAB',   // Bank of Africa Burkina Faso (PNB utilisé comme CA)
    isBank: true,
    revenue: 51_274,
    net_income: 20_107,
    total_actif: 964_662,
    total_dettes_financieres: null,
    total_capitaux_propres: 117_507,
    ebitda: 24_157,
    roe: 17.11,
    roa: 2.08,
    net_margin: 39.21,
    operating_margin: 50.47,
    cost_ratio: 44.28,
    eps: 495.72,
    pe_ratio: 16.56,
    dividend: 585,
  },
  {
    ticker: 'BOAC',   // Bank of Africa Côte d'Ivoire (PNB utilisé comme CA)
    isBank: true,
    revenue: 73_545,
    net_income: 35_540,
    total_actif: 1_075_479,
    total_dettes_financieres: null,
    total_capitaux_propres: 112_644,
    ebitda: 47_619,
    roe: 27.91,
    roa: 3.31, // calculé: 35540/1075479*100 (valeur doc 13162% erronée)
    net_margin: 48.32,
    operating_margin: 63.30,
    cost_ratio: 36.70,
    eps: 888.50,
    pe_ratio: 9.68,
    dividend: 595,
  },
  {
    ticker: 'CBIBF',  // Coris Bank International Burkina Faso (PNB utilisé comme CA)
    isBank: true,
    revenue: 138_986,
    net_income: 65_495,
    total_actif: null,           // non disponible dans le doc
    total_dettes_financieres: null,
    total_capitaux_propres: null, // non disponible dans le doc
    ebitda: 88_227,
    roe: null,
    roa: null,
    net_margin: null,
    operating_margin: null,
    cost_ratio: null,
    eps: 2_046.72,
    pe_ratio: 8.06,
    dividend: 555,
  },
  {
    ticker: 'ETIT',   // Ecobank Côte d'Ivoire (PNB utilisé comme CA)
    isBank: true,
    revenue: 132_725,
    net_income: 63_482,
    total_actif: 2_054_491,
    total_dettes_financieres: null,
    total_capitaux_propres: 218_573,
    ebitda: 69_996,
    roe: 29.04,
    roa: 3.09,
    net_margin: 47.83,
    operating_margin: 57.11,
    cost_ratio: 40.49,
    eps: 1_153.16,
    pe_ratio: 14.14,
    dividend: 781,
  },
  {
    ticker: 'SGBC',   // Société Générale de Banques en CI (PNB utilisé comme CA)
    isBank: true,
    revenue: 276_048,
    net_income: 101_351,
    total_actif: 3_769_174,
    total_dettes_financieres: null,
    total_capitaux_propres: 495_113,
    ebitda: 175_466,
    roe: 20.47,
    roa: 2.69,
    net_margin: 36.71,
    operating_margin: 61.25,
    cost_ratio: 33.34,
    eps: 3_257.71,
    pe_ratio: 10.74,
    dividend: 2_293,
  },
  {
    ticker: 'TTLC',   // TotalEnergies Marketing Côte d'Ivoire
    isBank: false,
    revenue: 588_709,
    net_income: 9_087,
    total_actif: 188_472,
    total_dettes_financieres: 3_450,
    total_capitaux_propres: 36_202,
    ebitda: 20_029,
    roe: 25.10,
    roa: 12.76,
    net_margin: 1.54,
    operating_margin: 2.09,
    cost_ratio: 98.37,
    eps: 144.33,
    pe_ratio: 18.71,
    dividend: 140,
  },
];

const YEAR = 2025;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function main() {
  console.log(`\nImport fondamentaux 2025 — ${data2025.length} actions\n`);
  let ok = 0, skip = 0;

  for (const row of data2025) {
    // --- Lookup stock ---
    const stock = await prisma.stock.findUnique({ where: { symbol: row.ticker } });
    if (!stock) {
      console.log(`SKIP ${row.ticker} — non trouvé en base`);
      skip++;
      continue;
    }

    // --- Ratios calculables localement ---
    const debtToEquity = (row.total_dettes_financieres != null && row.total_capitaux_propres != null)
      ? round2(row.total_dettes_financieres / row.total_capitaux_propres)
      : null;

    const profitMargin = (row.revenue && row.net_income)
      ? round2(row.net_income / row.revenue * 100)
      : null;

    // ROE/ROA calculés si nulls dans le doc (ex: CBIBF)
    const roe = row.roe ?? (
      (row.net_income != null && row.total_capitaux_propres != null)
        ? round2(row.net_income / row.total_capitaux_propres * 100)
        : null
    );
    const roa = row.roa ?? (
      (row.net_income != null && row.total_actif != null)
        ? round2(row.net_income / row.total_actif * 100)
        : null
    );
    const net_margin = row.net_margin ?? profitMargin;

    // --- Revenue growth depuis données 2024 en base ---
    let revenueGrowth: number | null = null;
    const prev = await prisma.annualFinancials.findUnique({
      where: { stock_ticker_year: { stock_ticker: row.ticker, year: 2024 } },
    });
    if (prev?.revenue != null && row.revenue != null && prev.revenue > 0) {
      const ratio = row.revenue / prev.revenue;
      const rawGrowth = (ratio - 1) * 100;
      // Ecarter si le ratio est > 5× ou < 0.2× — signe de mismatch d'unité en DB
      if (ratio >= 0.25 && ratio <= 4) {
        revenueGrowth = round2(rawGrowth);
      } else {
        console.warn(`  [WARN] ${row.ticker} Δ CA aberrant (${rawGrowth.toFixed(1)}%) — données 2024 en base dans une unité différente (rev2024=${prev.revenue})`);
      }
    }

    // --- Net income growth depuis données 2024 en base ---
    let netIncomeGrowth: number | null = null;
    if (prev?.net_income != null && row.net_income != null && prev.net_income !== 0) {
      const ratio = row.net_income / Math.abs(prev.net_income);
      const rawNiGrowth = (row.net_income - prev.net_income) / Math.abs(prev.net_income) * 100;
      if (ratio >= 0.25 && ratio <= 4) {
        netIncomeGrowth = round2(rawNiGrowth);
      } else {
        console.warn(`  [WARN] ${row.ticker} Δ RN aberrant (${rawNiGrowth.toFixed(1)}%) — données 2024 en base dans une unité différente (ni2024=${prev.net_income})`);
      }
    }

    // --- Données de marché depuis la table Stock + StockFundamental ---
    const currentPrice = stock.current_price; // en XOF
    const fundamental = await prisma.stockFundamental.findUnique({
      where: { stock_ticker: row.ticker },
    });
    const sharesOutstanding = fundamental?.shares_outstanding ?? null;

    // Dividend yield : dividende_par_action (XOF) / cours (XOF) * 100
    // Sanity check : DY > 30% signale un cours anormal en base
    let dividendYield: number | null = null;
    if (row.dividend != null && currentPrice > 0) {
      const rawDY = row.dividend / currentPrice * 100;
      if (rawDY <= 30) {
        dividendYield = round2(rawDY);
      } else {
        console.warn(`  [WARN] ${row.ticker} DY aberrant (${rawDY.toFixed(1)}%) — current_price=${currentPrice} XOF en base semble incorrect`);
      }
    }

    // Market cap : cours × nombre de titres (en XOF)
    // Sanity check : on ignore si current_price < 100 XOF (clairement erroné pour une action BRVM)
    let marketCap: number | null = null;
    if (currentPrice >= 100 && sharesOutstanding != null) {
      marketCap = currentPrice * sharesOutstanding;
    } else if (currentPrice < 100) {
      console.warn(`  [WARN] ${row.ticker} current_price=${currentPrice} XOF trop bas — market_cap non calculé`);
    }

    // P/B ratio : cours / (capitaux_propres_M × 1_000_000 / nb_titres)
    let pbRatio: number | null = null;
    if (currentPrice >= 100 && row.total_capitaux_propres != null && sharesOutstanding != null && sharesOutstanding > 0) {
      const bookValuePerShare = (row.total_capitaux_propres * 1_000_000) / sharesOutstanding;
      pbRatio = round2(currentPrice / bookValuePerShare);
    }

    // --- Upsert AnnualFinancials 2025 ---
    await prisma.annualFinancials.upsert({
      where: { stock_ticker_year: { stock_ticker: row.ticker, year: YEAR } },
      update: {
        revenue: row.revenue,
        revenue_growth: revenueGrowth,
        net_income: row.net_income,
        net_income_growth: netIncomeGrowth,
        eps: row.eps,
        pe_ratio: row.pe_ratio,
        dividend: row.dividend,
        total_actif: row.total_actif,
        total_dettes_financieres: row.total_dettes_financieres,
        total_capitaux_propres: row.total_capitaux_propres,
        roe,
        roa,
        net_margin,
        operating_margin: row.operating_margin,
        cost_ratio: row.cost_ratio,
      },
      create: {
        stock_ticker: row.ticker,
        stockId: stock.id,
        year: YEAR,
        revenue: row.revenue,
        revenue_growth: revenueGrowth,
        net_income: row.net_income,
        net_income_growth: netIncomeGrowth,
        eps: row.eps,
        pe_ratio: row.pe_ratio,
        dividend: row.dividend,
        total_actif: row.total_actif,
        total_dettes_financieres: row.total_dettes_financieres,
        total_capitaux_propres: row.total_capitaux_propres,
        roe,
        roa,
        net_margin,
        operating_margin: row.operating_margin,
        cost_ratio: row.cost_ratio,
      },
    });

    // --- Upsert StockFundamental ---
    await prisma.stockFundamental.upsert({
      where: { stock_ticker: row.ticker },
      update: {
        pe_ratio: row.pe_ratio,
        pb_ratio: pbRatio,
        dividend_yield: dividendYield,
        roe,
        roa,
        profit_margin: profitMargin,
        revenue: row.revenue,
        net_income: row.net_income,
        ebitda: row.ebitda,
        eps: row.eps,
        year: YEAR,
        debt_to_equity: debtToEquity,
        book_value: row.total_capitaux_propres,
        net_profit: row.net_income,
        market_cap: marketCap,
      },
      create: {
        stock_ticker: row.ticker,
        stockId: stock.id,
        pe_ratio: row.pe_ratio,
        pb_ratio: pbRatio,
        dividend_yield: dividendYield,
        roe,
        roa,
        profit_margin: profitMargin,
        revenue: row.revenue,
        net_income: row.net_income,
        ebitda: row.ebitda,
        eps: row.eps,
        year: YEAR,
        debt_to_equity: debtToEquity,
        book_value: row.total_capitaux_propres,
        net_profit: row.net_income,
        market_cap: marketCap,
      },
    });

    // --- Log ---
    const prevCA = prev?.revenue?.toLocaleString() ?? 'N/A';
    console.log(`OK  ${row.ticker.padEnd(8)} | CA: ${row.revenue.toLocaleString()} M (vs ${prevCA}) | Δ CA: ${revenueGrowth != null ? revenueGrowth.toFixed(2) + '%' : 'N/A'} | Δ RN: ${netIncomeGrowth != null ? netIncomeGrowth.toFixed(2) + '%' : 'N/A'} | DY: ${dividendYield != null ? dividendYield.toFixed(2) + '%' : 'N/A'} | P/B: ${pbRatio ?? 'N/A'}`);
    ok++;
  }

  console.log(`\nTerminé : ${ok} importées, ${skip} ignorées`);
}

main()
  .catch(e => { console.error('ERREUR', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
