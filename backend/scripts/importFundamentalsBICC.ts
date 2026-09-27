/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Source : bici fondamentale.txt (états financiers certifiés 2021-2025)
// Valeurs monétaires en M XOF — stockées telles quelles
// Nombre de titres : 16 667 124 (BNPA 2191.20 = RN 36 520 M / shares)

const TICKER = 'BICC';
const SHARES = 16_667_124;

// ROE = NI / FP_fin (vérifié : 36520/120570 = 30.29%)
// operating_margin = Marge Opérationnelle (RBE/PNB)
// cost_ratio = Coefficient d'exploitation

const annualData = [
  {
    year: 2021,
    revenue: 44_167,
    net_income: 9_603,
    total_actif: 847_724,
    total_dettes_financieres: null as number | null,
    total_capitaux_propres: 71_522,
    roa: 1.13,
    net_margin: 21.74,
    cost_ratio: 62.12,
    operating_margin: 30.26,
    eps: null as number | null,  // calculé en script
    pe_ratio: null as number | null,
    dividend: null as number | null,
  },
  {
    year: 2022,
    revenue: 47_275,
    net_income: 12_391,
    total_actif: 926_252,
    total_dettes_financieres: null,
    total_capitaux_propres: 74_313,
    roa: 1.34,
    net_margin: 26.21,
    cost_ratio: 62.47,
    operating_margin: 31.33,
    eps: null,
    pe_ratio: null,
    dividend: null,
  },
  {
    year: 2023,
    revenue: 55_506,
    net_income: 16_694,
    total_actif: 920_563,
    total_dettes_financieres: null,
    total_capitaux_propres: 83_574,
    roa: 1.81,
    net_margin: 30.08,
    cost_ratio: 64.10,
    operating_margin: 30.29,
    eps: null,
    pe_ratio: null,
    dividend: null,
  },
  {
    year: 2024,
    revenue: 68_063,
    net_income: 26_226,
    total_actif: 1_015_578,
    total_dettes_financieres: null,
    total_capitaux_propres: 99_783,
    roa: 2.58,
    net_margin: 38.53,
    cost_ratio: 51.00,
    operating_margin: 44.19,
    eps: null,
    pe_ratio: null,
    dividend: null,
  },
  {
    year: 2025,
    revenue: 79_563,
    net_income: 36_520,
    total_actif: 1_126_270,
    total_dettes_financieres: null,
    total_capitaux_propres: 120_570,
    roa: 3.24,
    net_margin: 45.90,
    cost_ratio: 43.05,
    operating_margin: 49.17,
    eps: 2_191.20,
    pe_ratio: 12.92,
    dividend: 1_157,  // dividende net/action (source)
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

  // ── AnnualFinancials : upsert 2021–2025 ──────────────────────────────────
  for (let i = 0; i < annualData.length; i++) {
    const row = annualData[i];
    const prev = i > 0 ? annualData[i - 1] : null;

    const revenueGrowth = prev ? safeGrowth(row.revenue, prev.revenue) : null;
    const niGrowth      = prev ? safeGrowth(row.net_income, prev.net_income) : null;
    const roe           = round2(row.net_income / row.total_capitaux_propres * 100);
    // BNPA calculé si non fourni
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
    console.log(`  ${row.year} | PNB: ${row.revenue.toLocaleString()} | RN: ${row.net_income.toLocaleString()} | ROE: ${roe}% | BNPA: ${eps} | Div: ${row.dividend ?? '-'}${dy}`);
  }

  // ── StockFundamental : mettre à jour avec 2025 comme dernière année ───────
  const latest      = annualData[annualData.length - 1]; // 2025
  const roe2025     = round2(latest.net_income / latest.total_capitaux_propres * 100);
  const profitMargin = round2(latest.net_income / latest.revenue * 100);
  const currentPrice = stock.current_price;

  const dividendYield = currentPrice > 0 ? round2(latest.dividend! / currentPrice * 100) : 5.95;
  const marketCap     = currentPrice > 0 ? currentPrice * SHARES : null;

  // P/B = cours / (FP_M × 1 000 000 / nb_titres)
  const bookValuePerShare = (latest.total_capitaux_propres * 1_000_000) / SHARES;
  const pbRatio = currentPrice > 0 && bookValuePerShare > 0
    ? (() => { const pb = round2(currentPrice / bookValuePerShare); return (pb >= 0.1 && pb <= 100) ? pb : 3.91; })()
    : 3.91; // valeur source

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
