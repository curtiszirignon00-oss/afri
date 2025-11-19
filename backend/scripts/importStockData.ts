import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { existsSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

interface StockDataRow {
  Date: string | number;
  // French column names from actual Excel file
  'Dernier'?: number | string;      // Close price
  'Ouv.'?: number | string;          // Open
  ' Plus Haut'?: number | string;    // High (note the leading space!)
  'Plus Bas'?: number | string;      // Low
  'Vol.'?: number | string;          // Volume
  // Alternative column names
  Ouverture?: number;
  'Plus Haut'?: number;
  Cloture?: number;
  Volume?: number;
  Open?: number;
  High?: number;
  Low?: number;
  Close?: number;
}

interface ShareholderData {
  name: string;
  percentage: number;
  is_public?: boolean;
}

interface AnnualFinancialData {
  year: number;
  revenue?: number;          // Chiffre d'affaires
  revenue_growth?: number;   // Croissance CA
  net_income?: number;       // Résultat net
  net_income_growth?: number; // Croissance RN
  eps?: number;              // BNPA
  pe_ratio?: number;         // PER
  dividend?: number;         // Dividende
}

interface FundamentalData {
  ticker: string;
  companyName: string;
  description: string;
  phone?: string;
  fax?: string;
  address?: string;
  website?: string;
  ceo?: string;
  president?: string;
  numberOfShares?: number;
  freefloat?: number;
  marketCap?: number;
  // Financial ratios
  pe_ratio?: number;
  beta?: number;
  rsi?: number;
  // Annual data (most recent year)
  revenue?: number;
  revenueGrowth?: number;
  netIncome?: number;
  netIncomeGrowth?: number;
  bnpa?: number;
  dividend?: number;
  // Historical data
  shareholders?: ShareholderData[];
  annualFinancials?: AnnualFinancialData[];
}

/**
 * Parse Excel file and extract historical stock data
 */
async function importHistoryFromExcel(
  excelFilePath: string,
  ticker: string
): Promise<number> {
  console.log(`\n📊 Importing historical data for ${ticker} from Excel...`);

  if (!existsSync(excelFilePath)) {
    console.error(`❌ File not found: ${excelFilePath}`);
    return 0;
  }

  // Read Excel file
  const workbook = XLSX.readFile(excelFilePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const data: StockDataRow[] = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Found ${data.length} rows in Excel file`);

  // Get stock from database
  const stock = await prisma.stock.findUnique({
    where: { symbol: ticker },
  });

  if (!stock) {
    console.error(`❌ Stock ${ticker} not found in database`);
    return 0;
  }

  let imported = 0;
  let skipped = 0;

  for (const row of data) {
    try {
      // Parse date (handle multiple formats)
      let date: Date;
      if (typeof row.Date === 'string') {
        date = new Date(row.Date);
      } else if (typeof row.Date === 'number') {
        // Excel serial date number - convert to JS Date
        // Excel dates are days since 1900-01-01 (with a leap year bug)
        const excelEpoch = new Date(1900, 0, 1);
        const days = row.Date - 2; // Excel has a 1900 leap year bug
        date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
      } else {
        console.warn(`⚠️  Skipping row with invalid date: ${row.Date}`);
        skipped++;
        continue;
      }

      if (isNaN(date.getTime())) {
        console.warn(`⚠️  Invalid date: ${row.Date}`);
        skipped++;
        continue;
      }

      // Helper function to parse numeric values (handle strings like "23.000" and "0,01K")
      const parseValue = (val: number | string | undefined): number | null => {
        if (val === undefined || val === null) return null;
        if (typeof val === 'number') return val;

        // Handle string formats like "23.000" or "0,01K"
        let str = val.toString().replace(/,/g, '.');

        // Handle K (thousands) multiplier
        if (str.includes('K')) {
          const num = parseFloat(str.replace('K', ''));
          return num * 1000;
        }

        const parsed = parseFloat(str);
        return isNaN(parsed) ? null : parsed;
      };

      // Extract OHLCV data (use actual column names from Excel)
      const close = parseValue(row['Dernier'] || row.Cloture || row.Close);
      const open = parseValue(row['Ouv.'] || row.Ouverture || row.Open);
      const high = parseValue(row[' Plus Haut'] || row['Plus Haut'] || row.High);
      const low = parseValue(row['Plus Bas'] || row.Low);
      const volume = parseValue(row['Vol.'] || row.Volume) || 0;

      if (!close) {
        skipped++;
        continue;
      }

      // Upsert stock history
      await prisma.stockHistory.upsert({
        where: {
          stock_ticker_date: {
            stock_ticker: ticker,
            date: date,
          },
        },
        update: {
          open: open || close,
          high: high || close,
          low: low || close,
          close: close,
          volume: volume,
        },
        create: {
          stockId: stock.id,
          stock_ticker: ticker,
          date: date,
          open: open || close,
          high: high || close,
          low: low || close,
          close: close,
          volume: volume,
        },
      });

      imported++;
    } catch (error) {
      console.error(`Error importing row:`, error);
      skipped++;
    }
  }

  console.log(`✅ Imported ${imported} historical records for ${ticker}`);
  if (skipped > 0) {
    console.log(`⚠️  Skipped ${skipped} invalid rows`);
  }

  return imported;
}

/**
 * Import fundamental data and company information
 */
async function importFundamentals(data: FundamentalData): Promise<void> {
  console.log(`\n📈 Importing fundamental data for ${data.ticker}...`);

  // Get stock from database
  const stock = await prisma.stock.findUnique({
    where: { symbol: data.ticker },
  });

  if (!stock) {
    console.error(`❌ Stock ${data.ticker} not found in database`);
    return;
  }

  // Upsert company info
  await prisma.companyInfo.upsert({
    where: { stock_ticker: data.ticker },
    update: {
      description: data.description,
      website: data.website || null,
      ceo: data.ceo || null,
      headquarters: data.address || null,
      industry: stock.sector || null,
      employees: null,
      founded_year: null,
    },
    create: {
      stock_ticker: data.ticker,
      description: data.description,
      website: data.website || null,
      ceo: data.ceo || null,
      headquarters: data.address || null,
      industry: stock.sector || null,
      employees: null,
      founded_year: null,
    },
  });

  console.log(`✅ Company info imported for ${data.ticker}`);

  // Upsert fundamentals
  const currentYear = new Date().getFullYear();

  await prisma.stockFundamental.upsert({
    where: { stock_ticker: data.ticker },
    update: {
      market_cap: data.marketCap || null,
      pe_ratio: data.pe_ratio || null,
      pb_ratio: null,
      dividend_yield: data.dividend ? (data.dividend / stock.current_price) * 100 : null,
      eps: data.bnpa || null,
      roe: null,
      roa: null,
      debt_to_equity: null,
      profit_margin: null,
      revenue: data.revenue || null,
      net_income: data.netIncome || null,
      ebitda: null,
      free_cash_flow: null,
      shares_outstanding: data.numberOfShares || null,
      year: currentYear,
      book_value: null,
      net_profit: data.netIncome || null,
    },
    create: {
      stockId: stock.id,
      stock_ticker: data.ticker,
      market_cap: data.marketCap || null,
      pe_ratio: data.pe_ratio || null,
      pb_ratio: null,
      dividend_yield: data.dividend ? (data.dividend / stock.current_price) * 100 : null,
      eps: data.bnpa || null,
      roe: null,
      roa: null,
      debt_to_equity: null,
      profit_margin: null,
      revenue: data.revenue || null,
      net_income: data.netIncome || null,
      ebitda: null,
      free_cash_flow: null,
      shares_outstanding: data.numberOfShares || null,
      year: currentYear,
      book_value: null,
      net_profit: data.netIncome || null,
    },
  });

  console.log(`✅ Fundamentals imported for ${data.ticker}`);

  // Import shareholders if provided
  if (data.shareholders && data.shareholders.length > 0) {
    console.log(`\n👥 Importing shareholders for ${data.ticker}...`);

    // Delete existing shareholders
    await prisma.shareholder.deleteMany({
      where: { stock_ticker: data.ticker }
    });

    // Insert new shareholders
    for (const shareholder of data.shareholders) {
      await prisma.shareholder.create({
        data: {
          stock_ticker: data.ticker,
          name: shareholder.name,
          percentage: shareholder.percentage,
          is_public: shareholder.is_public || false,
        }
      });
    }

    console.log(`✅ Imported ${data.shareholders.length} shareholders for ${data.ticker}`);
  }

  // Import annual financials if provided
  if (data.annualFinancials && data.annualFinancials.length > 0) {
    console.log(`\n📊 Importing annual financials for ${data.ticker}...`);

    for (const annual of data.annualFinancials) {
      await prisma.annualFinancials.upsert({
        where: {
          stock_ticker_year: {
            stock_ticker: data.ticker,
            year: annual.year,
          }
        },
        update: {
          revenue: annual.revenue || null,
          revenue_growth: annual.revenue_growth || null,
          net_income: annual.net_income || null,
          net_income_growth: annual.net_income_growth || null,
          eps: annual.eps || null,
          pe_ratio: annual.pe_ratio || null,
          dividend: annual.dividend || null,
        },
        create: {
          stock_ticker: data.ticker,
          year: annual.year,
          revenue: annual.revenue || null,
          revenue_growth: annual.revenue_growth || null,
          net_income: annual.net_income || null,
          net_income_growth: annual.net_income_growth || null,
          eps: annual.eps || null,
          pe_ratio: annual.pe_ratio || null,
          dividend: annual.dividend || null,
        }
      });
    }

    console.log(`✅ Imported ${data.annualFinancials.length} years of financial data for ${data.ticker}`);
  }
}

/**
 * Import data for ABJC (SERVAIR ABIDJAN)
 */
async function importABJCData() {
  console.log('\n🚀 Starting import for ABJC (SERVAIR ABIDJAN)\n');

  const ticker = 'ABJC';
  const excelPath = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\abjc\\abjc.xlsx';

  // Import historical data from Excel
  await importHistoryFromExcel(excelPath, ticker);

  // Import fundamental data based on the description file
  const fundamentalData: FundamentalData = {
    ticker: 'ABJC',
    companyName: 'SERVAIR ABIDJAN',
    description:
      "La société : SERVAIR ABIDJAN anciennement Abidjan Catering, est une société créée en 1968 opérant sur l'avitaillement, la fourniture de repas et le nettoyage des compagnies aériennes qui desservent l'aéroport d'Abidjan. Depuis 2012, SERVAIR ABIDJAN développe aussi des activités Hors Aérienne. En effet, afin de développer son portefeuille clients et tirer profit de la croissance économique du pays, la société a commencé à développer la restauration collective (scolaire, entreprise), son service traiteur événementiel (Grain de Sel) et propose ses services pour le catering et l'avitaillement de Bases Vies (FOXTROT).",
    phone: '+ 225 21 27 82 50 / + 225 21 27 87 39',
    fax: '+ 225 21 27 87 72',
    address:
      "Aéroport International Félix Houphouet Boigny d'Abidjan 07 BP 08 ABIDJAN 07 Côte d'Ivoire ABIDJAN",
    ceo: 'Mr BRAASTAD Mark',
    president: 'Mr Denis HASDENTEUFEUL',
    numberOfShares: 10_912_000,
    freefloat: 19.99,
    marketCap: 26_189_000_000, // 26 189 M FCFA
    pe_ratio: 17.49, // Latest PER from 2024
    beta: 0.66,
    rsi: 65.24,
    // Financial data from 2024 (latest)
    revenue: 12_467_000_000, // 12 467 M FCFA
    revenueGrowth: 10.78,
    netIncome: 1_519_000_000, // 1 519 M FCFA
    netIncomeGrowth: 13.78,
    bnpa: 139.22,
    dividend: 206.0, // Expected dividend

    // Shareholders data
    shareholders: [
      {
        name: 'SIA RESTAURATION PUBLIQUE',
        percentage: 76.16,
        is_public: false,
      },
      {
        name: 'PUBLIC (BRVM)',
        percentage: 14.34,
        is_public: true,
      },
      {
        name: 'LSG SKY CHEFS',
        percentage: 9.5,
        is_public: false,
      },
    ],

    // Annual financials data (2020-2024)
    annualFinancials: [
      {
        year: 2020,
        revenue: 5_708_000_000,
        revenue_growth: undefined,
        net_income: -985_000_000,
        net_income_growth: undefined,
        eps: -90.30,
        pe_ratio: undefined,
        dividend: undefined,
      },
      {
        year: 2021,
        revenue: 8_377_000_000,
        revenue_growth: 46.76,
        net_income: 953_000_000,
        net_income_growth: undefined,
        eps: 87.37,
        pe_ratio: 27.87,
        dividend: 57.73,
      },
      {
        year: 2022,
        revenue: 10_804_000_000,
        revenue_growth: 28.97,
        net_income: 1_268_000_000,
        net_income_growth: 33.05,
        eps: 116.26,
        pe_ratio: 20.94,
        dividend: 82.80,
      },
      {
        year: 2023,
        revenue: 11_254_000_000,
        revenue_growth: 4.17,
        net_income: 1_335_000_000,
        net_income_growth: 5.28,
        eps: 122.00,
        pe_ratio: 19.96,
        dividend: 206.00,
      },
      {
        year: 2024,
        revenue: 12_467_000_000,
        revenue_growth: 10.78,
        net_income: 1_519_000_000,
        net_income_growth: 13.78,
        eps: 139.22,
        pe_ratio: 17.49,
        dividend: undefined, // Not yet announced
      },
    ],
  };

  await importFundamentals(fundamentalData);

  console.log('\n✅ Import completed successfully for ABJC!\n');
}
// Assurez-vous que les interfaces sont définies ailleurs dans votre code
// export interface FundamentalData { ... }
// export declare function importHistoryFromExcel(excelPath: string, ticker: string): Promise<void>;
// import de boabf;

async function importBOABFData() {
  console.log('\n🚀 Starting import for BOABF (BOA BURKINA)\n');

  const ticker = 'BOABF';
  // ATTENTION : J'ai normalisé le chemin d'accès pour éviter les caractères spéciaux invisibles (comme le U+202A de droite à gauche).
  const excelPath = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\Boabf\\BOABF.xlsx';

  // 1. Import historical data from Excel
  await importHistoryFromExcel(excelPath, ticker);

  // 2. Import fundamental data
  const fundamentalData: FundamentalData = {
    ticker: 'BOABF',
    companyName: 'BOA BURKINA',
    description:
      "La société : BOA BURKINA est une filiale du groupe BOA. Elle a été mis en place en 1998 (après les filiales du Mali, du Bénin, du Niger et de la Côte d'Ivoire). BOA BURKINA est l'un des grands acteurs du pays. En tant que banque commerciale, elle est profondément impliquée dans le financement de l'économie burkinabé. Malgré une forte intensité concurrentielle dans le secteur bancaire, BOA BF s’impose comme l’un des acteurs majeurs de la place bancaire burkinabé avec un total bilan de 757 milliards de FCFA. Au 31 décembre 2017, la Banque présentait un total dépôt de la clientèle de près de 524 milliards de F CFA, plus de 366 197 comptes, répartis sur un réseau de 50 agences.",
    phone: '(226) 25 30 88 70 à 73',
    fax: '(226) 25 30 88 74',
    address:
      "770, Avenue du Président Aboubakar Sangoulé Lamizana 01 BP 1319 Ouagadougou",
    ceo: 'Faustin AMOUSSOU', // Le DG
    president: 'N/A', // Information non fournie pour le Président
    numberOfShares: 44_000_000,
    freefloat: 29.10, // En %
    marketCap: 161_920_000_000, // 161 920 M FCFA
    pe_ratio: 7.22, // Latest PER from 2024
    beta: null, // Information non fournie
    rsi: null, // Information non fournie
    // Financial data from 2024 (latest)
    revenue: 57_490_000_000, // Produit Net Bancaire (PNB) 2024 - 57 490 M FCFA
    revenueGrowth: -5.09,
    netIncome: 22_419_000_000, // Résultat net (RN) 2024 - 22 419 M FCFA
    netIncomeGrowth: -22.86,
    bnpa: 510.00, // BNPA 2024
    dividend: 428.00, // Expected dividend 2024

    // Shareholders data
    shareholders: [
      {
        name: 'BOA WEST AFRICA',
        percentage: 56.48,
        is_public: false,
      },
      {
        name: 'DIVERS ACTIONNAIRES PRIVES (BOURSE)',
        percentage: 25.92,
        is_public: true,
      },
      {
        name: 'LASSINE DIAWARA',
        percentage: 9.21,
        is_public: false,
      },
      {
        name: 'UNION DES ASSURANCES DU BURKINA-VIE',
        percentage: 8.39,
        is_public: false,
      },
    ],

    // Annual financials data (2020-2024)
    annualFinancials: [
      {
        year: 2020,
        // Pour une banque, le 'revenue' équivaut généralement au Produit Net Bancaire (PNB)
        revenue: 47_367_000_000, 
        revenue_growth: undefined,
        net_income: 17_608_000_000,
        net_income_growth: undefined,
        eps: 400.18, // BNPA
        pe_ratio: 9.20,
        dividend: 185.00,
      },
      {
        year: 2021,
        revenue: 50_828_000_000,
        revenue_growth: 7.31,
        net_income: 21_245_000_000,
        net_income_growth: 20.66,
        eps: 482.83,
        pe_ratio: 7.62,
        dividend: 185.00,
      },
      {
        year: 2022,
        revenue: 56_646_000_000,
        revenue_growth: 11.45,
        net_income: 25_477_000_000,
        net_income_growth: 19.92,
        eps: 579.02,
        pe_ratio: 6.36,
        dividend: 224.00,
      },
      {
        year: 2023,
        revenue: 60_576_000_000,
        revenue_growth: 6.94,
        net_income: 29_063_000_000,
        net_income_growth: 14.08,
        eps: 660.52,
        pe_ratio: 5.57,
        dividend: 352.00,
      },
      {
        year: 2024,
        revenue: 57_490_000_000,
        revenue_growth: -5.09,
        net_income: 22_419_000_000,
        net_income_growth: -22.86,
        eps: 510.00,
        pe_ratio: 7.22,
        dividend: 428.00, 
      },
    ],
  };

  await importFundamentals(fundamentalData);

  console.log('\n✅ Import completed successfully for BOABF!\n');
}

/**
 * Generic import function for any stock
 */
async function importStockData(
  ticker: string,
  excelPath: string,
  fundamentalData?: FundamentalData
) {
  console.log(`\n🚀 Starting import for ${ticker}\n`);

  // Import historical data
  await importHistoryFromExcel(excelPath, ticker);

  // Import fundamental data if provided
  if (fundamentalData) {
    await importFundamentals(fundamentalData);
  }

  console.log(`\n✅ Import completed successfully for ${ticker}!\n`);
}

// Main execution
async function main() {
  try {
    // Import ABJC data
    await importABJCData();

    // You can add more stocks here
    // await importStockData('TICKER', 'path/to/excel.xlsx', fundamentalData);

  } catch (error) {
    console.error('❌ Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ All imports completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

// Export functions for use in other scripts
export { importHistoryFromExcel, importFundamentals, importStockData };
