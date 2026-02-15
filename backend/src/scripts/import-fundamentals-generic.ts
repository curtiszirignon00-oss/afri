/// <reference types="node" />
import prisma from '../config/prisma';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

interface ParsedFundamentals {
  ticker: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  ceo: string | null;
  founded_year: number | null;
  industry: string | null;
  website: string | null;
  shares_outstanding: number | null;
  float_percent: number | null;
  market_cap: number | null;
  shareholders: Array<{ name: string; percentage: number }>;
  financials: {
    years: number[];
    revenue: (number | null)[];
    revenue_growth: (number | null)[];
    net_income: (number | null)[];
    net_income_growth: (number | null)[];
    eps: (number | null)[];
    per: (number | null)[];
    dividend: (number | null)[];
  };
  isBank: boolean;
}

/**
 * Parse a number from French format string (e.g. "1 234", "45,67%", "-985")
 */
function parseNumber(value: string): number | null {
  if (!value || value.trim() === '' || value.trim() === '-' || value.trim() === 'N/A') {
    return null;
  }
  // Remove spaces, tabs, % sign
  let cleaned = value.trim().replace(/\s/g, '').replace(/%$/, '').replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse a .txt file for a BRVM stock
 */
function parseTxtFile(filePath: string, ticker: string): ParsedFundamentals {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.replace(/\r$/, ''));

  const result: ParsedFundamentals = {
    ticker,
    description: null,
    phone: null,
    address: null,
    ceo: null,
    founded_year: null,
    industry: null,
    website: null,
    shares_outstanding: null,
    float_percent: null,
    market_cap: null,
    shareholders: [],
    financials: {
      years: [],
      revenue: [],
      revenue_growth: [],
      net_income: [],
      net_income_growth: [],
      eps: [],
      per: [],
      dividend: [],
    },
    isBank: false,
  };

  let inShareholders = false;
  let inFinancials = false;
  let yearsLine: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Description
    if (trimmed.startsWith('La soci') && trimmed.includes(':')) {
      const descStart = trimmed.indexOf(':') + 1;
      result.description = trimmed.substring(descStart).trim();
      // Extract founded year from description
      const yearMatch = result.description.match(/cr[ée]{1,2}e?\s+en\s+(\d{4})/i);
      if (yearMatch) {
        result.founded_year = parseInt(yearMatch[1]);
      }
      continue;
    }

    // Phone
    if (trimmed.startsWith('T') && trimmed.includes('l') && trimmed.includes('phone')) {
      result.phone = trimmed.replace(/^T[ée]l[ée]phone\s*:\s*/i, '').trim();
      continue;
    }

    // Address
    if (trimmed.startsWith('Adresse')) {
      result.address = trimmed.replace(/^Adresse\s*:\s*/i, '').trim();
      continue;
    }

    // Directors (CEO)
    if (trimmed.startsWith('Dirigeants') || trimmed.includes('Directeur G')) {
      // Extract CEO/DG
      const dgMatch = trimmed.match(/Directeur\s+G[ée]n[ée]ral[^:]*:\s*(?:Mr\s+|Mme\s+)?(.+?)(?:\s*$)/i);
      if (dgMatch) {
        result.ceo = dgMatch[1].trim();
      } else {
        // Try next lines for DG
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j].trim();
          const dgMatch2 = nextLine.match(/Directeur\s+G[ée]n[ée]ral[^:]*:\s*(?:Mr\s+|Mme\s+)?(.+?)(?:\s*$)/i);
          if (dgMatch2) {
            result.ceo = dgMatch2[1].trim();
            break;
          }
          // Also try "Managing Director" pattern
          const mdMatch = nextLine.match(/(.+?)\s+Managing\s+Director/i);
          if (mdMatch) {
            result.ceo = mdMatch[1].trim();
            break;
          }
        }
      }
      // If still no CEO, try "Managing Director" pattern on the current line
      if (!result.ceo) {
        const mdMatch = trimmed.match(/Dirigeants\s*:\s*(.+?)\s+Managing\s+Director/i);
        if (mdMatch) {
          result.ceo = mdMatch[1].trim();
        }
      }
      continue;
    }

    // Shares outstanding
    if (trimmed.startsWith('Nombre de titres')) {
      const sharesStr = trimmed.replace(/^Nombre de titres\s*:\s*/i, '');
      result.shares_outstanding = parseNumber(sharesStr);
      continue;
    }

    // Float
    if (trimmed.startsWith('Flottant')) {
      const floatStr = trimmed.replace(/^Flottant\s*:\s*/i, '');
      result.float_percent = parseNumber(floatStr);
      continue;
    }

    // Market cap (Valorisation)
    if (trimmed.startsWith('Valorisation de la soci')) {
      const valStr = trimmed.replace(/^Valorisation de la soci[ée]t[ée]\s*:\s*/i, '');
      const valNum = parseNumber(valStr.replace(/\s*MFCFA$/i, ''));
      if (valNum !== null) {
        result.market_cap = valNum * 1_000_000; // Convert from MFCFA to FCFA
      }
      continue;
    }

    // Shareholders section
    if (trimmed.startsWith('Principaux actionnaires')) {
      inShareholders = true;
      continue;
    }

    // Financial data start
    if (trimmed.startsWith('Les chiffres sont en millions')) {
      inShareholders = false;
      inFinancials = true;
      continue;
    }

    // Parse shareholders
    if (inShareholders && trimmed.includes('\t')) {
      const parts = trimmed.split('\t').filter(p => p.trim());
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const pctStr = parts[parts.length - 1].trim();
        const pct = parseNumber(pctStr);
        if (pct !== null && name.length > 1) {
          result.shareholders.push({ name, percentage: pct });
        }
      }
      continue;
    }

    // Parse financial data
    if (inFinancials) {
      const tabParts = trimmed.split('\t').filter(p => p !== '');

      // Years line (e.g. "2020\t2021\t2022\t2023\t2024")
      if (tabParts.length >= 3 && tabParts.every(p => /^\d{4}$/.test(p.trim()))) {
        yearsLine = tabParts.map(p => p.trim());
        result.financials.years = yearsLine.map(y => parseInt(y));
        continue;
      }

      if (yearsLine.length === 0) continue;

      // Revenue line
      if (trimmed.startsWith('Chiffre d') || trimmed.startsWith('Produit Net Bancaire')) {
        if (trimmed.startsWith('Produit Net Bancaire')) {
          result.isBank = true;
        }
        const values = extractFinancialValues(trimmed, yearsLine.length);
        result.financials.revenue = values;
        continue;
      }

      // Revenue growth
      if (trimmed.startsWith('Croissance CA') || trimmed.startsWith('Croissance du PNB')) {
        const values = extractFinancialValues(trimmed, yearsLine.length);
        result.financials.revenue_growth = values;
        continue;
      }

      // Net income
      if (trimmed.startsWith('R') && trimmed.includes('sultat net')) {
        const values = extractFinancialValues(trimmed, yearsLine.length);
        result.financials.net_income = values;
        continue;
      }

      // Net income growth
      if (trimmed.startsWith('Croissance RN')) {
        const values = extractFinancialValues(trimmed, yearsLine.length);
        result.financials.net_income_growth = values;
        continue;
      }

      // EPS (BNPA)
      if (trimmed.startsWith('BNPA')) {
        const values = extractFinancialValues(trimmed, yearsLine.length);
        result.financials.eps = values;
        continue;
      }

      // PER
      if (trimmed.startsWith('PER')) {
        const values = extractFinancialValues(trimmed, yearsLine.length);
        result.financials.per = values;
        continue;
      }

      // Dividend
      if (trimmed.startsWith('Dividende')) {
        const values = extractFinancialValues(trimmed, yearsLine.length);
        result.financials.dividend = values;
        continue;
      }
    }
  }

  return result;
}

/**
 * Extract financial values from a tab-separated line
 * Line format: "Label\tvalue1\tvalue2\tvalue3..."
 */
function extractFinancialValues(line: string, expectedCount: number): (number | null)[] {
  const parts = line.split('\t');
  // Remove the label (first part)
  const valueParts = parts.slice(1);

  const values: (number | null)[] = [];

  for (let i = 0; i < expectedCount; i++) {
    if (i < valueParts.length) {
      const val = valueParts[i].trim();
      if (val === '' || val === '-' || val === 'N/A') {
        values.push(null);
      } else {
        values.push(parseNumber(val));
      }
    } else {
      values.push(null);
    }
  }

  return values;
}

/**
 * Determine industry/sector based on company description and whether it's a bank
 */
function guessIndustry(data: ParsedFundamentals): string {
  if (data.isBank) return 'Banque';
  const desc = (data.description || '').toLowerCase();
  if (desc.includes('banque') || desc.includes('bancaire') || desc.includes('bank')) return 'Banque';
  if (desc.includes('assurance')) return 'Assurance';
  if (desc.includes('caoutchouc') || desc.includes('huile de palme') || desc.includes('palmier')) return 'Agriculture';
  if (desc.includes('ciment') || desc.includes('construction') || desc.includes('btp')) return 'Industrie';
  if (desc.includes('telecom') || desc.includes('t\u00e9l\u00e9com') || desc.includes('mobile') || desc.includes('sonatel')) return 'Telecommunications';
  if (desc.includes('distribution') || desc.includes('commerce')) return 'Distribution';
  if (desc.includes('transport') || desc.includes('logistique')) return 'Transport';
  if (desc.includes('energie') || desc.includes('\u00e9nergie') || desc.includes('electricit') || desc.includes('\u00e9lectricit')) return 'Energie';
  if (desc.includes('hotel') || desc.includes('h\u00f4tel') || desc.includes('tourisme')) return 'Tourisme';
  if (desc.includes('restauration') || desc.includes('catering') || desc.includes('avitaillement')) return 'Services aux consommateurs';
  if (desc.includes('p\u00e9trole') || desc.includes('petrole') || desc.includes('hydrocarbure') || desc.includes('carburant')) return 'Petrole & Gaz';
  if (desc.includes('minier') || desc.includes('mine') || desc.includes('mining')) return 'Mines';
  if (desc.includes('pharmaceuti') || desc.includes('m\u00e9dica') || desc.includes('medica')) return 'Pharmacie';
  if (desc.includes('sucre') || desc.includes('sucrerie') || desc.includes('sucri')) return 'Agro-industrie';
  if (desc.includes('industri')) return 'Industrie';
  return 'Autres';
}

/**
 * Import fundamentals for a single stock from its .txt file
 */
export async function importFundamentalsFromTxt(
  ticker: string,
  txtPath: string,
  options: { verbose?: boolean } = {}
): Promise<{ success: boolean; error?: string }> {
  const { verbose = true } = options;

  if (verbose) {
    console.log(`\n--- Import fondamentaux ${ticker} ---`);
  }

  if (!existsSync(txtPath)) {
    if (verbose) console.log(`  Fichier .txt introuvable: ${txtPath}`);
    return { success: false, error: 'Fichier introuvable' };
  }

  try {
    const data = parseTxtFile(txtPath, ticker);

    // Find stock in DB
    const stock = await prisma.stock.findUnique({ where: { symbol: ticker } });
    if (!stock) {
      if (verbose) console.log(`  Action ${ticker} non trouvee en base`);
      return { success: false, error: 'Action non trouvee' };
    }

    if (verbose) console.log(`  Action trouvee: ${stock.company_name}`);

    // Get the latest year data
    const years = data.financials.years;
    const latestIdx = years.length - 1;

    // 1. StockFundamental (upsert)
    const latestRevenue = latestIdx >= 0 ? data.financials.revenue[latestIdx] : null;
    const latestNetIncome = latestIdx >= 0 ? data.financials.net_income[latestIdx] : null;
    const latestEps = latestIdx >= 0 ? data.financials.eps[latestIdx] : null;
    const latestPer = latestIdx >= 0 ? data.financials.per[latestIdx] : null;
    const latestYear = latestIdx >= 0 ? years[latestIdx] : null;

    // Calculate profit margin if possible
    let profitMargin: number | null = null;
    if (latestRevenue && latestNetIncome && latestRevenue > 0) {
      profitMargin = (latestNetIncome / latestRevenue) * 100;
    }

    const fundamentalsData: any = {
      market_cap: data.market_cap,
      pe_ratio: latestPer,
      pb_ratio: null,
      dividend_yield: null,
      roe: null,
      roa: null,
      profit_margin: profitMargin ? Math.round(profitMargin * 100) / 100 : null,
      debt_to_equity: null,
      revenue: latestRevenue ? latestRevenue * 1_000_000 : null,
      net_income: latestNetIncome ? latestNetIncome * 1_000_000 : null,
      ebitda: null,
      free_cash_flow: null,
      shares_outstanding: data.shares_outstanding,
      eps: latestEps,
      book_value: null,
      net_profit: latestNetIncome ? latestNetIncome * 1_000_000 : null,
      year: latestYear,
    };

    const existingFundamentals = await prisma.stockFundamental.findUnique({
      where: { stock_ticker: ticker }
    });

    if (existingFundamentals) {
      await prisma.stockFundamental.update({
        where: { stock_ticker: ticker },
        data: fundamentalsData,
      });
      if (verbose) console.log('  Fondamentaux mis a jour');
    } else {
      await prisma.stockFundamental.create({
        data: { stockId: stock.id, stock_ticker: ticker, ...fundamentalsData },
      });
      if (verbose) console.log('  Fondamentaux crees');
    }

    // 2. CompanyInfo (upsert)
    const companyInfoData = {
      description: data.description,
      website: data.website,
      employees: null as number | null,
      founded_year: data.founded_year,
      headquarters: data.address,
      ceo: data.ceo,
      industry: guessIndustry(data),
    };

    const existingCompanyInfo = await prisma.companyInfo.findUnique({
      where: { stock_ticker: ticker }
    });

    if (existingCompanyInfo) {
      await prisma.companyInfo.update({
        where: { stock_ticker: ticker },
        data: companyInfoData,
      });
      if (verbose) console.log('  CompanyInfo mis a jour');
    } else {
      await prisma.companyInfo.create({
        data: { stock_ticker: ticker, ...companyInfoData },
      });
      if (verbose) console.log('  CompanyInfo cree');
    }

    // 3. Shareholders (delete + recreate)
    if (data.shareholders.length > 0) {
      await prisma.shareholder.deleteMany({ where: { stock_ticker: ticker } });
      for (const sh of data.shareholders) {
        await prisma.shareholder.create({
          data: {
            stock_ticker: ticker,
            name: sh.name,
            percentage: sh.percentage,
            is_public: sh.name.includes('PUBLIC') || sh.name.includes('BRVM') || sh.name.includes('DIVERS PORTEURS'),
          },
        });
      }
      if (verbose) console.log(`  ${data.shareholders.length} actionnaires importes`);
    }

    // 4. AnnualFinancials (delete + recreate)
    if (years.length > 0) {
      await prisma.annualFinancials.deleteMany({ where: { stock_ticker: ticker } });
      for (let i = 0; i < years.length; i++) {
        await prisma.annualFinancials.create({
          data: {
            stock_ticker: ticker,
            stockId: stock.id,
            year: years[i],
            revenue: data.financials.revenue[i] ? data.financials.revenue[i]! * 1_000_000 : null,
            revenue_growth: data.financials.revenue_growth[i] ?? null,
            net_income: data.financials.net_income[i] ? data.financials.net_income[i]! * 1_000_000 : null,
            net_income_growth: data.financials.net_income_growth[i] ?? null,
            eps: data.financials.eps[i] ?? null,
            pe_ratio: data.financials.per[i] ?? null,
            dividend: data.financials.dividend[i] ?? null,
          },
        });
      }
      if (verbose) console.log(`  ${years.length} annees financieres importees`);
    }

    if (verbose) console.log(`  OK ${ticker}`);
    return { success: true };

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (verbose) console.error(`  ERREUR ${ticker}: ${errMsg}`);
    return { success: false, error: errMsg };
  }
}

/**
 * Import fundamentals for multiple stocks
 */
export async function importAllFundamentals(
  stocks: Array<{ ticker: string; txtPath: string }>,
  options: { verbose?: boolean } = {}
): Promise<void> {
  console.log(`\n=== Import fondamentaux pour ${stocks.length} actions ===\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < stocks.length; i++) {
    const { ticker, txtPath } = stocks[i];
    console.log(`[${i + 1}/${stocks.length}] ${ticker}...`);

    const result = await importFundamentalsFromTxt(ticker, txtPath, options);
    if (result.success) {
      success++;
    } else if (result.error === 'Fichier introuvable') {
      skipped++;
    } else {
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('RESUME IMPORT FONDAMENTAUX');
  console.log('='.repeat(60));
  console.log(`Succes: ${success}`);
  console.log(`Echoues: ${failed}`);
  console.log(`Ignores (pas de .txt): ${skipped}`);
  console.log(`Total: ${stocks.length}`);
  console.log('='.repeat(60) + '\n');
}

// Si execute directement
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npx ts-node src/scripts/import-fundamentals-generic.ts <TICKER> <TXT_PATH>');
    process.exit(1);
  }

  const ticker = args[0].toUpperCase();
  const txtPath = args[1];

  importFundamentalsFromTxt(ticker, txtPath, { verbose: true })
    .then((result) => {
      if (result.success) {
        console.log('\nImport termine avec succes !');
      } else {
        console.log('\nImport echoue:', result.error);
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\nErreur fatale:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
