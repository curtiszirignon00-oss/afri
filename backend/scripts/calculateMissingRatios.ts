/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Rejette si le ratio est > 4× ou < 0.25× (signe de mismatch d'unité entre années)
function safeGrowth(current: number, previous: number): number | null {
  if (previous === 0) return null;
  const ratio = current / Math.abs(previous);
  if (ratio < 0.25 || ratio > 4) return null;
  return round2((current - previous) / Math.abs(previous) * 100);
}

// Cherche le dernier cours de clôture disponible en décembre d'une année donnée
async function getYearEndPrice(ticker: string, year: number): Promise<number | null> {
  const row = await prisma.stockHistory.findFirst({
    where: {
      stock_ticker: ticker,
      date: {
        gte: new Date(`${year}-11-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
    orderBy: { date: 'desc' },
  });
  return row?.close ?? null;
}

async function main() {
  const stocks = await prisma.stock.findMany({
    include: {
      fundamentals: true,
      annualFinancials: { orderBy: { year: 'asc' } },
    },
  });

  console.log(`\nCalcul des ratios manquants — ${stocks.length} actions\n`);

  let totalAFUpdated = 0;
  let totalFundUpdated = 0;

  for (const stock of stocks) {
    const ticker = stock.symbol;
    const af = stock.annualFinancials; // triés par year ASC
    const fundamental = stock.fundamentals[0] ?? null;
    const shares = fundamental?.shares_outstanding ?? null;

    if (af.length === 0) {
      console.log(`SKIP ${ticker} — aucune donnée annuelle`);
      continue;
    }

    // ── 1. AnnualFinancials : remplir les champs nuls ─────────────────────
    let afUpdates = 0;

    for (let i = 0; i < af.length; i++) {
      const row = af[i];
      const prev = i > 0 ? af[i - 1] : null;
      const updates: Record<string, number | null> = {};

      // net_margin
      if (row.net_margin == null && row.net_income != null && row.revenue != null && row.revenue !== 0) {
        updates.net_margin = round2(row.net_income / row.revenue * 100);
      }

      // ROE
      if (row.roe == null && row.net_income != null && row.total_capitaux_propres != null && row.total_capitaux_propres !== 0) {
        updates.roe = round2(row.net_income / row.total_capitaux_propres * 100);
      }

      // ROA
      if (row.roa == null && row.net_income != null && row.total_actif != null && row.total_actif !== 0) {
        updates.roa = round2(row.net_income / row.total_actif * 100);
      }

      // Croissance CA
      if (row.revenue_growth == null && prev?.revenue != null && row.revenue != null) {
        const g = safeGrowth(row.revenue, prev.revenue);
        if (g != null) updates.revenue_growth = g;
      }

      // Croissance RN
      if (row.net_income_growth == null && prev?.net_income != null && row.net_income != null) {
        const g = safeGrowth(row.net_income, prev.net_income);
        if (g != null) updates.net_income_growth = g;
      }

      // BNPA (eps) = résultat net / nombre de titres
      if (row.eps == null && row.net_income != null && shares != null && shares > 0) {
        updates.eps = round2(row.net_income / shares);
      }

      // PER = cours fin d'année / BNPA
      if (row.pe_ratio == null) {
        const eps = updates.eps ?? row.eps;
        if (eps != null && eps > 0) {
          const yearEndPrice = await getYearEndPrice(ticker, row.year);
          if (yearEndPrice != null && yearEndPrice > 0) {
            const per = round2(yearEndPrice / eps);
            // Sanity : PER entre 0 et 200
            if (per > 0 && per <= 200) {
              updates.pe_ratio = per;
            }
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        await prisma.annualFinancials.update({
          where: { id: row.id },
          data: updates,
        });
        // Mettre à jour le cache en mémoire pour que les années suivantes puissent l'utiliser
        Object.assign(af[i], updates);
        afUpdates++;
      }
    }

    // ── 2. StockFundamental : remplir les champs nuls ─────────────────────
    const latest = af[af.length - 1];
    const currentPrice = stock.current_price;
    const fundUpdates: Record<string, number | null> = {};

    // profit_margin
    const latestNetMargin = latest.net_margin;
    if (fundamental?.profit_margin == null) {
      if (latestNetMargin != null) {
        fundUpdates.profit_margin = latestNetMargin;
      } else if (latest.net_income != null && latest.revenue != null && latest.revenue !== 0) {
        fundUpdates.profit_margin = round2(latest.net_income / latest.revenue * 100);
      }
    }

    // debt_to_equity
    if (fundamental?.debt_to_equity == null && latest.total_dettes_financieres != null && latest.total_capitaux_propres != null && latest.total_capitaux_propres !== 0) {
      fundUpdates.debt_to_equity = round2(latest.total_dettes_financieres / latest.total_capitaux_propres);
    }

    // book_value
    if (fundamental?.book_value == null && latest.total_capitaux_propres != null) {
      fundUpdates.book_value = latest.total_capitaux_propres;
    }

    // roe / roa
    if (fundamental?.roe == null && latest.roe != null) fundUpdates.roe = latest.roe;
    if (fundamental?.roa == null && latest.roa != null) fundUpdates.roa = latest.roa;

    // dividend_yield : dividende année courante, sinon année précédente en fallback
    if (fundamental?.dividend_yield == null && currentPrice > 0) {
      let dividend = latest.dividend;
      if (dividend == null && af.length >= 2) {
        dividend = af[af.length - 2].dividend; // fallback année précédente
      }
      if (dividend != null) {
        fundUpdates.dividend_yield = round2(dividend / currentPrice * 100);
      }
    }

    // market_cap
    if (fundamental?.market_cap == null && currentPrice > 0 && shares != null) {
      fundUpdates.market_cap = currentPrice * shares;
    }

    // pb_ratio
    if (fundamental?.pb_ratio == null && currentPrice > 0 && shares != null && shares > 0 && latest.total_capitaux_propres != null) {
      const bookValuePerShare = (latest.total_capitaux_propres * 1_000_000) / shares;
      if (bookValuePerShare > 0) {
        const pb = round2(currentPrice / bookValuePerShare);
        if (pb >= 0.1 && pb <= 100) fundUpdates.pb_ratio = pb;
      }
    }

    // eps / pe_ratio / revenue / net_income depuis dernière année
    if (fundamental?.eps == null && latest.eps != null) fundUpdates.eps = latest.eps;
    if (fundamental?.pe_ratio == null && latest.pe_ratio != null) fundUpdates.pe_ratio = latest.pe_ratio;

    // Recalcul BNPA si toujours null (résultat net / nb titres)
    if (fundamental?.eps == null && fundUpdates.eps == null && latest.net_income != null && shares != null && shares > 0) {
      fundUpdates.eps = round2(latest.net_income / shares);
    }

    // Recalcul PER si toujours null (cours / BNPA)
    if (fundamental?.pe_ratio == null && fundUpdates.pe_ratio == null && currentPrice > 0) {
      const eps = fundUpdates.eps ?? fundamental?.eps ?? latest.eps;
      if (eps != null && eps > 0) {
        const per = round2(currentPrice / eps);
        if (per > 0 && per <= 200) fundUpdates.pe_ratio = per;
      }
    }

    if (fundamental?.revenue == null && latest.revenue != null) fundUpdates.revenue = latest.revenue;
    if (fundamental?.net_income == null && latest.net_income != null) fundUpdates.net_income = latest.net_income;
    if (fundamental?.net_profit == null && latest.net_income != null) fundUpdates.net_profit = latest.net_income;

    if (Object.keys(fundUpdates).length > 0) {
      if (fundamental) {
        await prisma.stockFundamental.update({
          where: { stock_ticker: ticker },
          data: fundUpdates,
        });
      } else {
        await prisma.stockFundamental.create({
          data: { stock_ticker: ticker, stockId: stock.id, ...fundUpdates },
        });
      }
      totalFundUpdated++;
    }

    const afMsg = afUpdates > 0 ? `${afUpdates} années mises à jour` : 'RAS';
    const fundMsg = Object.keys(fundUpdates).length > 0 ? Object.keys(fundUpdates).join(', ') : 'RAS';
    console.log(`${ticker.padEnd(8)} | AF: ${afMsg} | Fund: ${fundMsg}`);
    totalAFUpdated += afUpdates;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`AnnualFinancials lignes mises à jour : ${totalAFUpdated}`);
  console.log(`StockFundamental actions mises à jour : ${totalFundUpdated}`);
  console.log('='.repeat(60) + '\n');
}

main()
  .catch(e => { console.error('ERREUR', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
