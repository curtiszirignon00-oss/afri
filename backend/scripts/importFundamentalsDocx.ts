/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();
const JSON_PATH = 'C:/Users/HP/Downloads/brvm_fundamentals_fixed.json';

async function main() {
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  console.log(`\n Importing ${data.length} stocks...\n`);
  let ok = 0, skip = 0;

  for (const doc of data) {
    const stock = await prisma.stock.findUnique({ where: { symbol: doc.ticker } });
    if (!stock) { console.log(`SKIP ${doc.ticker} not in DB`); skip++; continue; }

    const latest = doc.latest || {};
    const latestYear = doc.latest_year;

    // 1. StockFundamental
    await prisma.stockFundamental.upsert({
      where: { stock_ticker: doc.ticker },
      update: {
        market_cap: doc.market_cap ?? null,
        pe_ratio: latest.pe_ratio ?? null,
        roe: latest.roe ?? null,
        roa: latest.roa ?? null,
        profit_margin: latest.net_margin ?? null,
        revenue: latest.revenue ?? null,
        net_income: latest.net_income ?? null,
        shares_outstanding: doc.shares_outstanding ?? null,
        eps: latest.eps ?? null,
        year: latestYear ?? null,
        debt_to_equity: (latest.total_dettes_financieres && latest.total_capitaux_propres)
          ? +(latest.total_dettes_financieres / latest.total_capitaux_propres).toFixed(4) : null,
        book_value: latest.total_capitaux_propres ?? null,
        net_profit: latest.net_income ?? null,
      },
      create: {
        stock_ticker: doc.ticker, stockId: stock.id,
        market_cap: doc.market_cap ?? null,
        pe_ratio: latest.pe_ratio ?? null,
        roe: latest.roe ?? null,
        roa: latest.roa ?? null,
        profit_margin: latest.net_margin ?? null,
        revenue: latest.revenue ?? null,
        net_income: latest.net_income ?? null,
        shares_outstanding: doc.shares_outstanding ?? null,
        eps: latest.eps ?? null,
        year: latestYear ?? null,
        debt_to_equity: (latest.total_dettes_financieres && latest.total_capitaux_propres)
          ? +(latest.total_dettes_financieres / latest.total_capitaux_propres).toFixed(4) : null,
        book_value: latest.total_capitaux_propres ?? null,
        net_profit: latest.net_income ?? null,
      }
    });

    // 2. AnnualFinancials
    for (const [yearStr, row] of Object.entries(doc.annual_data) as [string, any][]) {
      const year = parseInt(yearStr);
      if (isNaN(year)) continue;
      await prisma.annualFinancials.upsert({
        where: { stock_ticker_year: { stock_ticker: doc.ticker, year } },
        update: {
          revenue: row.revenue ?? null, revenue_growth: row.revenue_growth ?? null,
          net_income: row.net_income ?? null, net_income_growth: row.net_income_growth ?? null,
          eps: row.eps ?? null, pe_ratio: row.pe_ratio ?? null, dividend: row.dividend ?? null,
          total_actif: row.total_actif ?? null,
          total_dettes_financieres: row.total_dettes_financieres ?? null,
          total_capitaux_propres: row.total_capitaux_propres ?? null,
          roe: row.roe ?? null, roa: row.roa ?? null,
          net_margin: row.net_margin ?? null, operating_margin: row.operating_margin ?? null,
          cost_ratio: row.cost_ratio ?? null,
        },
        create: {
          stock_ticker: doc.ticker, stockId: stock.id, year,
          revenue: row.revenue ?? null, revenue_growth: row.revenue_growth ?? null,
          net_income: row.net_income ?? null, net_income_growth: row.net_income_growth ?? null,
          eps: row.eps ?? null, pe_ratio: row.pe_ratio ?? null, dividend: row.dividend ?? null,
          total_actif: row.total_actif ?? null,
          total_dettes_financieres: row.total_dettes_financieres ?? null,
          total_capitaux_propres: row.total_capitaux_propres ?? null,
          roe: row.roe ?? null, roa: row.roa ?? null,
          net_margin: row.net_margin ?? null, operating_margin: row.operating_margin ?? null,
          cost_ratio: row.cost_ratio ?? null,
        }
      });
    }

    // 3. CompanyInfo
    await prisma.companyInfo.upsert({
      where: { stock_ticker: doc.ticker },
      update: {
        description: doc.description ?? undefined,
        headquarters: doc.address ?? undefined,
        ceo: doc.directors ?? undefined,
        industry: doc.sector ?? undefined,
      },
      create: {
        stock_ticker: doc.ticker,
        description: doc.description ?? null,
        headquarters: doc.address ?? null,
        ceo: doc.directors ?? null,
        industry: doc.sector ?? null,
      }
    });

    // 4. Shareholders
    if (doc.shareholders.length > 0) {
      await prisma.shareholder.deleteMany({ where: { stock_ticker: doc.ticker } });
      await prisma.shareholder.createMany({
        data: doc.shareholders.map((sh: any) => ({
          stock_ticker: doc.ticker,
          name: sh.name,
          percentage: sh.percentage ?? 0,
          is_public: sh.name.toLowerCase().includes('public') || sh.name.toLowerCase().includes('divers'),
        }))
      });
    }

    const yrs = Object.keys(doc.annual_data).length;
    console.log(`OK ${doc.ticker.padEnd(8)} ${yrs} ans | ${doc.shareholders.length} actionnaires`);
    ok++;
  }

  console.log(`\nDone: ${ok} imported, ${skip} skipped`);
}

main()
  .catch(e => { console.error('ERROR', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
