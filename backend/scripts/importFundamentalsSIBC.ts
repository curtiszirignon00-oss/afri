/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Source : fonda sibc.txt (états financiers certifiés 2021-2025)
// Valeurs monétaires en M XOF — stockées telles quelles
// Nombre de titres : 100 000 000 (vérifié : RN 55 623 M / BNPA 556.23)

const TICKER = 'SIBC';
const SHARES = 100_000_000;

// ROE = NI / FP_fin (vérifié : 55623/204765 = 27.16%)

const annualData = [
  {
    year: 2021,
    revenue: 76_532,
    net_income: 34_031,
    total_actif: 1_316_459,
    total_dettes_financieres: null as number | null,
    total_capitaux_propres: 130_798,
    roa: 2.59,
    net_margin: 44.47,
    cost_ratio: 40.64,
    operating_margin: 54.93,
    pe_ratio: null as number | null,
    dividend: null as number | null, // historique préservé (upsert ne touche pas)
  },
  {
    year: 2022,
    revenue: 83_542,
    net_income: 40_090,
    total_actif: 1_499_554,
    total_dettes_financieres: null,
    total_capitaux_propres: 148_389,
    roa: 2.67,
    net_margin: 47.99,
    cost_ratio: 39.04,
    operating_margin: 56.93,
    pe_ratio: null,
    dividend: null,
  },
  {
    year: 2023,
    revenue: 95_571,
    net_income: 43_513,
    total_actif: 1_605_875,
    total_dettes_financieres: null,
    total_capitaux_propres: 164_402,
    roa: 2.71,
    net_margin: 45.53,
    cost_ratio: 36.52,
    operating_margin: 59.51,
    pe_ratio: null,
    dividend: null,
  },
  {
    year: 2024,
    revenue: 102_763,
    net_income: 50_234,
    total_actif: 1_685_249,
    total_dettes_financieres: null,
    total_capitaux_propres: 187_136,
    roa: 2.98,
    net_margin: 48.88,
    cost_ratio: 35.90,
    operating_margin: 60.95,
    pe_ratio: null,
    dividend: null,
  },
  {
    year: 2025,
    revenue: 108_663,
    net_income: 55_623,
    total_actif: 1_881_733,
    total_dettes_financieres: null,
    total_capitaux_propres: 204_765,
    roa: 2.96,
    net_margin: 51.19,
    cost_ratio: 35.71,
    operating_margin: 61.41,
    pe_ratio: 15.55,
    dividend: 374,  // dividende net/action (source)
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
    const eps           = round2(row.net_income * 1_000_000 / SHARES);

    // Pour 2021-2024 : ne pas écraser le dividende existant en base (préservation historique)
    // Pour 2025 : inclure le dividende 374 XOF
    const is2025 = row.year === 2025;

    const updatePayload: Record<string, unknown> = {
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
    };
    if (is2025) updatePayload.dividend = row.dividend;

    await prisma.annualFinancials.upsert({
      where: { stock_ticker_year: { stock_ticker: TICKER, year: row.year } },
      update: updatePayload as any,
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
    const divStr = is2025 ? row.dividend! + ' XOF' : '(conservé)';
    console.log(`  ${row.year} | PNB: ${row.revenue.toLocaleString()} | RN: ${row.net_income.toLocaleString()} | ROE: ${roe}% | BNPA: ${eps} | Div: ${divStr}${dy}`);
  }

  // ── StockFundamental : mettre à jour avec 2025 comme dernière année ───────
  const latest       = annualData[annualData.length - 1]; // 2025
  const roe2025      = round2(latest.net_income / latest.total_capitaux_propres * 100);
  const profitMargin = round2(latest.net_income / latest.revenue * 100);
  const currentPrice = stock.current_price;

  const dividendYield = currentPrice > 0 ? round2(latest.dividend! / currentPrice * 100) : 5.21;
  const marketCap     = currentPrice > 0 ? currentPrice * SHARES : null;

  const bookValuePerShare = (latest.total_capitaux_propres * 1_000_000) / SHARES;
  const pbRatio = currentPrice > 0 && bookValuePerShare > 0
    ? (() => { const pb = round2(currentPrice / bookValuePerShare); return (pb >= 0.1 && pb <= 100) ? pb : 4.22; })()
    : 4.22;

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
      eps:             round2(latest.net_income * 1_000_000 / SHARES),
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
      eps:             round2(latest.net_income * 1_000_000 / SHARES),
      year:            latest.year,
      debt_to_equity:  null,
      book_value:      latest.total_capitaux_propres,
      net_profit:      latest.net_income,
      market_cap:      marketCap,
      shares_outstanding: SHARES,
    },
  });

  const epsVal = round2(latest.net_income * 1_000_000 / SHARES);
  console.log(`\n  StockFundamental 2025 — PER: ${latest.pe_ratio}x | BNPA: ${epsVal} | DY: ${dividendYield}% | P/B: ${pbRatio} | ROE: ${roe2025}%`);
  console.log(`  Nb titres : ${SHARES.toLocaleString()}`);
  console.log(`\nOK ${TICKER}\n`);
}

main()
  .catch(e => { console.error('ERREUR', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
