/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Source : fonda sucrivoire.txt (états financiers 2021-2025, actualisés)
// Valeurs monétaires en M XOF — stockées telles quelles
// Nombre de titres : 19 600 000 (source scrc.txt + vérifié BNPA 2025 : -6131/19.6 = -312.81)

const TICKER = 'SCRC';
const SHARES = 19_600_000;

// ROE = NI / FP (vérifié : -6131/13822 = -44.36%)
// roa / net_margin / operating_margin / cost_ratio = valeurs sources (non recalculées)
// eps calculé quand non fourni par la source (années à BNPA "-")

const annualData = [
  {
    year: 2020,
    revenue: 63_333,
    net_income: 1_788,
    total_actif: null as number | null,
    total_dettes_financieres: null as number | null,
    total_capitaux_propres: null as number | null,
    roa: null as number | null,
    net_margin: 2.82,
    cost_ratio: null as number | null,
    operating_margin: null as number | null,
    eps: 91.23,
    pe_ratio: 10.96,
    dividend: 40.5,
  },
  {
    year: 2021,
    revenue: 62_497,
    net_income: -6_573,
    total_actif: 107_247,
    total_dettes_financieres: 32_956,
    total_capitaux_propres: 36_443,
    roa: -11.60,
    net_margin: -10.52,
    cost_ratio: 100.05,
    operating_margin: -4.34,
    eps: null,
    pe_ratio: null,
    dividend: null,
  },
  {
    year: 2022,
    revenue: 68_635,
    net_income: -8_756,
    total_actif: 124_042,
    total_dettes_financieres: 43_778,
    total_capitaux_propres: 27_687,
    roa: -12.06,
    net_margin: -12.76,
    cost_ratio: 108.38,
    operating_margin: -7.08,
    eps: null,
    pe_ratio: null,
    dividend: null,
  },
  {
    year: 2023,
    revenue: 68_135,
    net_income: -10_324,
    total_actif: 115_465,
    total_dettes_financieres: 37_997,
    total_capitaux_propres: 17_363,
    roa: -14.40,
    net_margin: -15.15,
    cost_ratio: 100.35,
    operating_margin: -7.21,
    eps: null,
    pe_ratio: null,
    dividend: null,
  },
  {
    year: 2024,
    revenue: 87_219,
    net_income: 2_591,
    total_actif: 123_092,
    total_dettes_financieres: 32_079,
    total_capitaux_propres: 19_954,
    roa: 3.49,
    net_margin: 2.97,
    cost_ratio: 1.71,
    operating_margin: 9.26,
    eps: null,
    pe_ratio: 7.58,
    dividend: null,
  },
  {
    year: 2025,
    revenue: 80_568,
    net_income: -6_131,
    total_actif: 146_852,
    total_dettes_financieres: 69_108,
    total_capitaux_propres: 13_822,
    roa: -7.38,
    net_margin: -7.61,
    cost_ratio: 1.71,
    operating_margin: 2.27,
    eps: -312.81,
    pe_ratio: -12.07,
    dividend: null,
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
    // BNPA calculé si non fourni par la source
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

    const dy = prev ? ` | Δ CA: ${revenueGrowth != null ? revenueGrowth + '%' : 'N/A'} | Δ RN: ${niGrowth != null ? niGrowth + '%' : 'N/A'}` : '';
    console.log(`  ${row.year} | CA: ${row.revenue.toLocaleString()} | RN: ${row.net_income.toLocaleString()} | ROE: ${roe ?? 'N/A'}% | BNPA: ${eps} | Div: ${row.dividend ?? '-'}${dy}`);
  }

  // ── StockFundamental : mettre à jour avec 2025 comme dernière année ───────
  const latest       = annualData[annualData.length - 1]; // 2025
  const roe2025      = round2(latest.net_income / latest.total_capitaux_propres! * 100);
  const profitMargin = round2(latest.net_income / latest.revenue * 100);
  const currentPrice = stock.current_price;
  const marketCap    = currentPrice > 0 ? currentPrice * SHARES : null;

  await prisma.stockFundamental.upsert({
    where:  { stock_ticker: TICKER },
    update: {
      pe_ratio:        latest.pe_ratio,
      pb_ratio:        5.35, // valeur source (P/B ratio)
      dividend_yield:  null,
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
      pb_ratio:        5.35,
      dividend_yield:  null,
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

  console.log(`\n  StockFundamental 2025 — PER: ${latest.pe_ratio}x | BNPA: ${latest.eps} | P/B: 5.35 | ROE: ${roe2025}%`);
  console.log(`  Nb titres : ${SHARES.toLocaleString()}`);
  console.log(`\nOK ${TICKER}\n`);
}

main()
  .catch(e => { console.error('ERREUR', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
