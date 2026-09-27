/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Source : nsia_tableau_evolutif_complet.html (états financiers certifiés CAC 2020-2025)
// + fondamental nsbc.txt pour certains ratios
// Valeurs monétaires en M XOF — stockées telles quelles
// Nombre de titres : 24 734 572 (nominal 1 000 FCFA)

const TICKER = 'NSBC';
const SHARES = 24_734_572;

// ROE = NI / FP_fin (formule standard pour cohérence avec les autres actions)
// Coeff. exploitation = Charges / PNB (source HTML certified)
// Operating_margin = 100 - cost_ratio (= RBE / PNB)
// PER = cours de référence fin d'année / BNA (source HTML)
// Dividende = dividende NET BRVM officiel (XOF/action)

const annualData = [
  {
    year: 2020,
    revenue: 71_364,
    net_income: 7_201,
    total_actif: 1_549_535,
    total_dettes_financieres: null,
    total_capitaux_propres: 108_810,
    roa: 0.46,
    net_margin: 10.1,
    cost_ratio: 66.5,
    operating_margin: 33.5,
    eps: 291.13,
    pe_ratio: 11.7,   // 3 400 / 291 — corrigé (ancien: 41.06 erroné)
    dividend: 0,
  },
  {
    year: 2021,
    revenue: 76_622,
    net_income: 23_713,
    total_actif: 1_644_547,
    total_dettes_financieres: null,
    total_capitaux_propres: 132_524,
    roa: 1.44,
    net_margin: 30.9,
    cost_ratio: 61.9,
    operating_margin: 38.1,
    eps: 958.70,
    pe_ratio: 6.8,    // 6 500 / 959 — corrigé (ancien: 12.47 erroné)
    dividend: 0,
  },
  {
    year: 2022,
    revenue: 80_105,
    net_income: 32_382,
    total_actif: 1_885_056,
    total_dettes_financieres: null,
    total_capitaux_propres: 164_905,
    roa: 1.72,
    net_margin: 40.4,
    cost_ratio: 63.2,
    operating_margin: 36.8,
    eps: 1_309.18,
    pe_ratio: 4.7,    // 6 100 / 1 309 — corrigé (ancien: 9.13 erroné)
    dividend: 404,    // dividende net BRVM officiel (ancien: 356 incorrect)
  },
  {
    year: 2023,
    revenue: 91_002,
    net_income: 34_813,
    total_actif: 2_037_064,
    total_dettes_financieres: null,
    total_capitaux_propres: 189_719,
    roa: 1.71,
    net_margin: 38.3,
    cost_ratio: 58.3,
    operating_margin: 41.7,
    eps: 1_407.00,
    pe_ratio: 5.7,    // 8 000 / 1 407 — corrigé (ancien: 8.50 erroné)
    dividend: 455,    // dividende net BRVM officiel
  },
  {
    year: 2024,
    revenue: 97_819,
    net_income: 38_112,
    total_actif: 2_514_388,
    total_dettes_financieres: null,
    total_capitaux_propres: 215_330,
    roa: 1.52,
    net_margin: 39.0,
    cost_ratio: 59.7,  // corrigé (ancien: 51.06% erroné — Charges/PNB = 58 419/97 819)
    operating_margin: 40.3,
    eps: 1_540.84,
    pe_ratio: 7.5,     // 11 500 / 1 541 — corrigé (ancien: 9.73 erroné)
    dividend: 759,
  },
  {
    year: 2025,
    revenue: 112_928,
    net_income: 40_712,
    total_actif: 3_073_062,
    total_dettes_financieres: null,
    total_capitaux_propres: 233_303,
    roa: 1.32,
    net_margin: 36.1,
    cost_ratio: 54.6,
    operating_margin: 45.4,
    eps: 1_646,        // 40 712 000 000 / 24 734 572 = 1 645,97
    pe_ratio: 8.8,     // 14 500 / 1 646
    dividend: 370,     // source Madis Finance (exercice 2025, payé 2026)
  },
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function safeGrowth(current: number, previous: number): number | null {
  if (previous === 0) return null;
  const ratio = current / Math.abs(previous);
  if (ratio < 0.25 || ratio > 4) return null;
  return round2((current - previous) / Math.abs(previous) * 100);
}

async function main() {
  const stock = await prisma.stock.findUnique({ where: { symbol: TICKER } });
  if (!stock) { console.error(`Action ${TICKER} non trouvée`); process.exit(1); }
  console.log(`\nImport fondamentaux ${TICKER} — ${stock.company_name}\n`);

  // ── AnnualFinancials : upsert 2020–2025 ──────────────────────────────────
  for (let i = 0; i < annualData.length; i++) {
    const row = annualData[i];
    const prev = i > 0 ? annualData[i - 1] : null;

    const revenueGrowth   = prev ? safeGrowth(row.revenue, prev.revenue) : null;
    const niGrowth        = prev ? safeGrowth(row.net_income, prev.net_income) : null;
    // ROE standard = NI / FP_fin
    const roe             = round2(row.net_income / row.total_capitaux_propres * 100);

    await prisma.annualFinancials.upsert({
      where: { stock_ticker_year: { stock_ticker: TICKER, year: row.year } },
      update: {
        revenue:                  row.revenue,
        revenue_growth:           revenueGrowth,
        net_income:               row.net_income,
        net_income_growth:        niGrowth,
        total_actif:              row.total_actif,
        total_dettes_financieres: row.total_dettes_financieres,
        total_capitaux_propres:   row.total_capitaux_propres,
        roe,
        roa:                      row.roa,
        net_margin:               row.net_margin,
        operating_margin:         row.operating_margin,
        cost_ratio:               row.cost_ratio,
        eps:                      row.eps,
        pe_ratio:                 row.pe_ratio,
        dividend:                 row.dividend,
      },
      create: {
        stock_ticker:             TICKER,
        stockId:                  stock.id,
        year:                     row.year,
        revenue:                  row.revenue,
        revenue_growth:           revenueGrowth,
        net_income:               row.net_income,
        net_income_growth:        niGrowth,
        total_actif:              row.total_actif,
        total_dettes_financieres: row.total_dettes_financieres,
        total_capitaux_propres:   row.total_capitaux_propres,
        roe,
        roa:                      row.roa,
        net_margin:               row.net_margin,
        operating_margin:         row.operating_margin,
        cost_ratio:               row.cost_ratio,
        eps:                      row.eps,
        pe_ratio:                 row.pe_ratio,
        dividend:                 row.dividend,
      },
    });

    const dy = prev ? ` | Δ PNB: ${revenueGrowth != null ? revenueGrowth + '%' : 'N/A'} | Δ RN: ${niGrowth != null ? niGrowth + '%' : 'N/A'}` : '';
    console.log(`  ${row.year} | PNB: ${row.revenue.toLocaleString()} | RN: ${row.net_income.toLocaleString()} | ROE: ${roe}% | PER: ${row.pe_ratio}x | Div: ${row.dividend}${dy}`);
  }

  // ── StockFundamental : mettre à jour avec 2025 comme dernière année ───────
  const latest     = annualData[annualData.length - 1]; // 2025
  const roe2025    = round2(latest.net_income / latest.total_capitaux_propres * 100);
  const profitMargin = round2(latest.net_income / latest.revenue * 100);
  const currentPrice = stock.current_price;

  const dividendYield = currentPrice > 0 ? round2(latest.dividend / currentPrice * 100) : null;
  const marketCap     = currentPrice > 0 ? currentPrice * SHARES : null;

  // P/B = cours / (capitaux_propres_M × 1 000 000 / nb_titres)
  const bookValuePerShare = (latest.total_capitaux_propres * 1_000_000) / SHARES;
  const pbRatio = currentPrice > 0 && bookValuePerShare > 0
    ? (() => { const pb = round2(currentPrice / bookValuePerShare); return (pb >= 0.1 && pb <= 100) ? pb : null; })()
    : null;

  const debtToEquity = null; // dettes financières non disponibles

  await prisma.stockFundamental.upsert({
    where:  { stock_ticker: TICKER },
    update: {
      pe_ratio:        latest.pe_ratio,
      pb_ratio:        pbRatio,
      dividend_yield:  dividendYield,
      roe:             roe2025,
      roa:             latest.roa,
      profit_margin:   profitMargin,
      revenue:         latest.revenue,
      net_income:      latest.net_income,
      eps:             latest.eps,
      year:            latest.year,
      debt_to_equity:  debtToEquity,
      book_value:      latest.total_capitaux_propres,
      net_profit:      latest.net_income,
      market_cap:      marketCap,
      shares_outstanding: SHARES,
    },
    create: {
      stock_ticker:    TICKER,
      stockId:         stock.id,
      pe_ratio:        latest.pe_ratio,
      pb_ratio:        pbRatio,
      dividend_yield:  dividendYield,
      roe:             roe2025,
      roa:             latest.roa,
      profit_margin:   profitMargin,
      revenue:         latest.revenue,
      net_income:      latest.net_income,
      eps:             latest.eps,
      year:            latest.year,
      debt_to_equity:  debtToEquity,
      book_value:      latest.total_capitaux_propres,
      net_profit:      latest.net_income,
      market_cap:      marketCap,
      shares_outstanding: SHARES,
    },
  });

  console.log(`\n  StockFundamental 2025 — PER: ${latest.pe_ratio}x | BNPA: ${latest.eps} | DY: ${dividendYield ?? 'N/A'}% | P/B: ${pbRatio ?? 'N/A'} | ROE: ${roe2025}%`);
  console.log(`  Nb titres mis à jour : ${SHARES.toLocaleString()}`);
  console.log(`\nOK ${TICKER}\n`);
}

main()
  .catch(e => { console.error('ERREUR', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
