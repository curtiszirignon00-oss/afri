/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Source : fondamental boabf.txt (états financiers 2021-2025)
// + historique dividendes conservé (2020-2024 ancien script)
// Valeurs monétaires en M XOF — stockées telles quelles
// Nombre de titres : 44 000 000 (vérifié : RN 2025 / BNPA 437.55)

const TICKER = 'BOABF';
const SHARES = 44_000_000;

// ROE = NI / FP_fin (vérifié : 19252/126516 = 15.22%)

const annualData = [
  {
    // 2020 : données conservées de l'ancien script (pas dans nouveau fichier)
    year: 2020,
    revenue: 47_367,
    net_income: 17_608,
    total_actif: null as number | null,
    total_dettes_financieres: null as number | null,
    total_capitaux_propres: null as number | null,
    roa: null as number | null,
    net_margin: null as number | null,
    cost_ratio: null as number | null,
    operating_margin: null as number | null,
    eps: 400.18,
    pe_ratio: 9.20,
    dividend: 185,
  },
  {
    year: 2021,
    revenue: 50_828,
    net_income: 21_245,
    total_actif: 1_073_229,
    total_dettes_financieres: null,
    total_capitaux_propres: 112_900,
    roa: 1.98,
    net_margin: 41.80,
    cost_ratio: 39.49,
    operating_margin: 56.63,
    eps: null as number | null,
    pe_ratio: 7.62,
    dividend: 185,
  },
  {
    year: 2022,
    revenue: 56_646,
    net_income: 25_477,
    total_actif: 1_163_300,
    total_dettes_financieres: null,
    total_capitaux_propres: 124_551,
    roa: 2.19,
    net_margin: 44.98,
    cost_ratio: 39.36,
    operating_margin: 57.61,
    eps: null,
    pe_ratio: 6.36,
    dividend: 224,
  },
  {
    year: 2023,
    revenue: 60_576,
    net_income: 29_063,
    total_actif: 1_098_276,
    total_dettes_financieres: null,
    total_capitaux_propres: 125_144,
    roa: 2.65,
    net_margin: 47.98,
    cost_ratio: 40.12,
    operating_margin: 57.06,
    eps: null,
    pe_ratio: 5.57,
    dividend: 352,
  },
  {
    year: 2024,
    revenue: 57_490,
    net_income: 22_419,
    total_actif: 1_079_053,
    total_dettes_financieres: null,
    total_capitaux_propres: 129_272,
    roa: 2.08,
    net_margin: 39.00,
    cost_ratio: 44.68,
    operating_margin: 52.18,
    eps: null,
    pe_ratio: 7.22,
    dividend: 428,
  },
  {
    year: 2025,
    revenue: 57_819,
    net_income: 19_252,
    total_actif: 1_148_674,
    total_dettes_financieres: null,
    total_capitaux_propres: 126_516,
    roa: 1.68,
    net_margin: 33.30,
    cost_ratio: 43.96,
    operating_margin: 52.81,
    eps: 437.55,
    pe_ratio: 12.68,
    dividend: 397,   // dividende net/action (source)
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

    const revenueGrowth = prev ? safeGrowth(row.revenue, prev.revenue) : null;
    const niGrowth      = prev ? safeGrowth(row.net_income, prev.net_income) : null;
    const roe           = row.total_capitaux_propres != null
      ? round2(row.net_income / row.total_capitaux_propres * 100)
      : null;
    const eps           = row.eps ?? round2(row.net_income * 1_000_000 / SHARES);

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
        eps,
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
        eps,
        pe_ratio:                 row.pe_ratio,
        dividend:                 row.dividend,
      },
    });

    const dy = prev ? ` | Δ PNB: ${revenueGrowth != null ? revenueGrowth + '%' : 'N/A'} | Δ RN: ${niGrowth != null ? niGrowth + '%' : 'N/A'}` : '';
    const roeStr = roe != null ? roe + '%' : 'N/A';
    console.log(`  ${row.year} | PNB: ${row.revenue.toLocaleString()} | RN: ${row.net_income.toLocaleString()} | ROE: ${roeStr} | BNPA: ${eps} | Div: ${row.dividend}${dy}`);
  }

  // ── StockFundamental : mettre à jour avec 2025 comme dernière année ───────
  const latest      = annualData[annualData.length - 1]; // 2025
  const roe2025     = round2(latest.net_income / latest.total_capitaux_propres! * 100);
  const profitMargin = round2(latest.net_income / latest.revenue * 100);
  const currentPrice = stock.current_price;

  const dividendYield = currentPrice > 0 ? round2(latest.dividend! / currentPrice * 100) : 10.59;
  const marketCap     = currentPrice > 0 ? currentPrice * SHARES : null;

  const bookValuePerShare = (latest.total_capitaux_propres! * 1_000_000) / SHARES;
  const pbRatio = currentPrice > 0 && bookValuePerShare > 0
    ? (() => { const pb = round2(currentPrice / bookValuePerShare); return (pb >= 0.1 && pb <= 100) ? pb : 1.93; })()
    : 1.93;

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
      debt_to_equity:  null,
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
      debt_to_equity:  null,
      book_value:      latest.total_capitaux_propres,
      net_profit:      latest.net_income,
      market_cap:      marketCap,
      shares_outstanding: SHARES,
    },
  });

  console.log(`\n  StockFundamental 2025 — PER: ${latest.pe_ratio}x | BNPA: ${latest.eps} | DY: ${dividendYield}% | P/B: ${pbRatio} | ROE: ${roe2025}%`);
  console.log(`  Nb titres : ${SHARES.toLocaleString()}`);
  console.log(`\nOK ${TICKER}\n`);
}

main()
  .catch(e => { console.error('ERREUR', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
