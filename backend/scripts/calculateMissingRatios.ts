/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Calcul du taux de croissance avec vérification de cohérence d'unité
// Rejette si le ratio entre les deux valeurs est > 4x ou < 0.25x
function safeGrowth(current: number, previous: number): number | null {
  if (previous === 0) return null;
  const ratio = current / Math.abs(previous);
  if (ratio < 0.25 || ratio > 4) return null;
  return round2((current - previous) / Math.abs(previous) * 100);
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

      // revenue_growth (depuis année précédente)
      if (row.revenue_growth == null && prev?.revenue != null && row.revenue != null) {
        const g = safeGrowth(row.revenue, prev.revenue);
        if (g != null) updates.revenue_growth = g;
      }

      // net_income_growth (depuis année précédente)
      if (row.net_income_growth == null && prev?.net_income != null && row.net_income != null) {
        const g = safeGrowth(row.net_income, prev.net_income);
        if (g != null) updates.net_income_growth = g;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.annualFinancials.update({
          where: { id: row.id },
          data: updates,
        });
        afUpdates++;
      }
    }

    // ── 2. StockFundamental : remplir les champs nuls ─────────────────────
    const latest = af[af.length - 1]; // année la plus récente
    const currentPrice = stock.current_price;
    const shares = fundamental?.shares_outstanding ?? null;

    const fundUpdates: Record<string, number | null> = {};

    // profit_margin (= net_margin de la dernière année)
    if ((fundamental?.profit_margin == null) && latest.net_margin != null) {
      fundUpdates.profit_margin = latest.net_margin;
    } else if (fundamental?.profit_margin == null && latest.net_income != null && latest.revenue != null && latest.revenue !== 0) {
      fundUpdates.profit_margin = round2(latest.net_income / latest.revenue * 100);
    }

    // debt_to_equity (depuis dernière année AnnualFinancials)
    if (fundamental?.debt_to_equity == null && latest.total_dettes_financieres != null && latest.total_capitaux_propres != null && latest.total_capitaux_propres !== 0) {
      fundUpdates.debt_to_equity = round2(latest.total_dettes_financieres / latest.total_capitaux_propres);
    }

    // book_value (= total_capitaux_propres de la dernière année)
    if (fundamental?.book_value == null && latest.total_capitaux_propres != null) {
      fundUpdates.book_value = latest.total_capitaux_propres;
    }

    // roe / roa depuis dernière année
    if (fundamental?.roe == null && latest.roe != null) {
      fundUpdates.roe = latest.roe;
    }
    if (fundamental?.roa == null && latest.roa != null) {
      fundUpdates.roa = latest.roa;
    }

    // dividend_yield : dividende_par_action / cours * 100
    if (fundamental?.dividend_yield == null && latest.dividend != null && currentPrice > 0) {
      fundUpdates.dividend_yield = round2(latest.dividend / currentPrice * 100);
    }

    // market_cap : cours × nombre de titres (en XOF)
    if (fundamental?.market_cap == null && currentPrice > 0 && shares != null) {
      fundUpdates.market_cap = currentPrice * shares;
    }

    // pb_ratio : cours / (capitaux_propres_M × 1_000_000 / nb_titres)
    // Uniquement si on a les capitaux propres en M XOF (dernière année disponible)
    if (fundamental?.pb_ratio == null && currentPrice > 0 && shares != null && shares > 0 && latest.total_capitaux_propres != null) {
      const bookValuePerShare = (latest.total_capitaux_propres * 1_000_000) / shares;
      if (bookValuePerShare > 0) {
        const pb = round2(currentPrice / bookValuePerShare);
        // Sanity : P/B doit être entre 0.1 et 100
        if (pb >= 0.1 && pb <= 100) {
          fundUpdates.pb_ratio = pb;
        }
      }
    }

    // revenue / net_income depuis dernière année (si null en Fundamental)
    if (fundamental?.revenue == null && latest.revenue != null) {
      fundUpdates.revenue = latest.revenue;
    }
    if (fundamental?.net_income == null && latest.net_income != null) {
      fundUpdates.net_income = latest.net_income;
    }
    if (fundamental?.net_profit == null && latest.net_income != null) {
      fundUpdates.net_profit = latest.net_income;
    }
    if (fundamental?.eps == null && latest.eps != null) {
      fundUpdates.eps = latest.eps;
    }
    if (fundamental?.pe_ratio == null && latest.pe_ratio != null) {
      fundUpdates.pe_ratio = latest.pe_ratio;
    }

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
    const fundMsg = Object.keys(fundUpdates).length > 0
      ? Object.keys(fundUpdates).join(', ')
      : 'RAS';
    console.log(`${ticker.padEnd(8)} | AnnualFinancials: ${afMsg} | Fundamental: ${fundMsg}`);

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
