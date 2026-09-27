/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Source : fondamentale orgt.txt (états financiers 2021-2025)
// Valeurs monétaires en M XOF — stockées telles quelles
// Nombre de titres : 69 415 031

const TICKER = 'ORGT';
const SHARES = 69_415_031;

// ROE = NI / FP_fin (formule standard)
// operating_margin = Marge Opérationnelle (RBE/PNB)
// cost_ratio = Coefficient d'exploitation (Charges/PNB)

const annualData = [
  {
    year: 2020,
    revenue: 155_395,
    net_income: 9_440,
    total_actif: null as number | null,
    total_dettes_financieres: null as number | null,
    total_capitaux_propres: null as number | null,
    roa: null as number | null,
    net_margin: null as number | null,
    cost_ratio: null as number | null,
    operating_margin: null as number | null,
    eps: 135.99,
    pe_ratio: 18.97,
    dividend: null as number | null,
  },
  {
    year: 2021,
    revenue: 187_315,
    net_income: 19_798,
    total_actif: 4_058_135,
    total_dettes_financieres: null,
    total_capitaux_propres: 164_752,
    roa: 0.49,
    net_margin: 10.57,
    cost_ratio: 62.80,
    operating_margin: 37.21,
    eps: 285.21,
    pe_ratio: 9.05,
    dividend: null,
  },
  {
    year: 2022,
    revenue: 222_431,
    net_income: 19_199,
    total_actif: 4_732_757,
    total_dettes_financieres: null,
    total_capitaux_propres: 165_995,
    roa: 0.41,
    net_margin: 8.63,
    cost_ratio: 61.91,
    operating_margin: 38.09,
    eps: 277.00,
    pe_ratio: 9.31,
    dividend: null,
  },
  {
    year: 2023,
    revenue: 215_280,
    net_income: -18_186,
    total_actif: 4_236_478,
    total_dettes_financieres: null,
    total_capitaux_propres: 143_822,
    roa: -0.43,
    net_margin: -8.45,
    cost_ratio: 70.97,
    operating_margin: 29.72,
    eps: null,      // résultat négatif
    pe_ratio: null, // résultat négatif
    dividend: null,
  },
  {
    year: 2024,
    revenue: 195_436,
    net_income: -44_363,
    total_actif: 3_961_395,
    total_dettes_financieres: null,
    total_capitaux_propres: 96_720,
    roa: -1.12,
    net_margin: -22.70,
    cost_ratio: 87.57,
    operating_margin: 12.43,
    eps: null,      // résultat négatif
    pe_ratio: null, // résultat négatif
    dividend: null,
  },
  {
    year: 2025,
    revenue: 186_609,
    net_income: 21_643,
    total_actif: 4_014_192,
    total_dettes_financieres: null,
    total_capitaux_propres: 113_165,
    roa: 0.54,
    net_margin: 11.60,
    cost_ratio: 80.63,
    operating_margin: 19.37,
    eps: 311.79,
    pe_ratio: 8.31,
    dividend: null,  // pas de dividende (DY=0%)
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
    const niGrowth      = (prev && prev.net_income > 0 && row.net_income > 0)
      ? safeGrowth(row.net_income, prev.net_income)
      : null;
    const roe = row.total_capitaux_propres != null
      ? round2(row.net_income / row.total_capitaux_propres * 100)
      : null;

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
    const roeStr = roe != null ? roe + '%' : 'N/A';
    console.log(`  ${row.year} | PNB: ${row.revenue.toLocaleString()} | RN: ${row.net_income.toLocaleString()} | ROE: ${roeStr} | PER: ${row.pe_ratio ?? 'N/A'}x | Div: ${row.dividend ?? '-'}${dy}`);
  }

  // ── StockFundamental : mettre à jour avec 2025 comme dernière année ───────
  const latest      = annualData[annualData.length - 1]; // 2025
  const roe2025     = latest.total_capitaux_propres != null
    ? round2(latest.net_income / latest.total_capitaux_propres * 100)
    : null;
  const profitMargin = round2(latest.net_income / latest.revenue * 100);
  const currentPrice = stock.current_price;

  const dividendYield = 0; // DY=0%, pas de dividende
  const marketCap     = currentPrice > 0 ? currentPrice * SHARES : null;

  // P/B = cours / (capitaux_propres_M × 1 000 000 / nb_titres)
  const bookValuePerShare = latest.total_capitaux_propres != null
    ? (latest.total_capitaux_propres * 1_000_000) / SHARES
    : null;
  const pbRatio = currentPrice > 0 && bookValuePerShare != null && bookValuePerShare > 0
    ? (() => { const pb = round2(currentPrice / bookValuePerShare); return (pb >= 0.1 && pb <= 100) ? pb : null; })()
    : 1.59; // valeur source si cours non disponible

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

  console.log(`\n  StockFundamental 2025 — PER: ${latest.pe_ratio}x | BNPA: ${latest.eps} | DY: 0% | P/B: ${pbRatio ?? 'N/A'} | ROE: ${roe2025 ?? 'N/A'}%`);
  console.log(`  Nb titres : ${SHARES.toLocaleString()}`);
  console.log(`\nOK ${TICKER}\n`);
}

main()
  .catch(e => { console.error('ERREUR', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
