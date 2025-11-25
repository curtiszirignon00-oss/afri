import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

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
    beta: undefined, // Information non fournie
    rsi: undefined, // Information non fournie
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

// Assurez-vous que les interfaces sont définies ailleurs dans votre code
// export interface FundamentalData { ... }
// export declare function importHistoryFromExcel(excelPath: string, ticker: string): Promise<void>;
// export declare function importFundamentals(data: FundamentalData): Promise<void>;

async function importBICICIData() {
  console.log('\n🚀 Starting import for BICICI (Banque Internationale pour le Commerce et l\'Industrie de la Côte d\'Ivoire)\n');

  const ticker = 'BICICI';
  // Vous devrez ajuster ce chemin d'accès à l'emplacement réel de votre fichier BICICI.xlsx
  const excelPath = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\Bicici\\BICICI.xlsx'; 

  // 1. Import historical data from Excel
  await importHistoryFromExcel(excelPath, ticker);

  // 2. Import fundamental data
  const fundamentalData: FundamentalData = {
    ticker: 'BICICI',
    companyName: 'BANQUE INTERNATIONALE POUR LE COMMERCE ET L\'INDUSTRIE DE CÔTE D\'IVOIRE',
    description:
      "La Banque internationale pour le commerce et l'industrie de la Côte d'Ivoire, abrégée en BICICI, est une filiale du groupe français BNP Paribas. Elle est une banque générale, de gros et de détail, qui offre aux entreprises et aux particuliers du secteur formel tout un ensemble de crédits à court et moyen terme. L'activité s'organise essentiellement autour de 3 pôles : banque de détail ; banque de financement et d'investissement. À fin 2017, le groupe gère 549 milliards FCFA d'encours de dépôts et 440 milliards FCFA d'encours de crédits. La commercialisation des produits et services est assurée au travers d'un réseau de 43 agences implantées en Côte d'Ivoire.",
    phone: '(+225) 20 20 16 05',
    fax: '(+225) 20 20 17 00',
    address:
      "BANQUE INTERNATIONALE POUR LE COMMERCE ET L'INDUSTRIE DE CÔTE D'IVOIRE 01 ABIDJAN",
    ceo: 'Mamady DIAKITE', // Directeur Général
    president: 'Ahmed CISSE', // Président du conseil d'administration
    numberOfShares: 16_666_670,
    freefloat: 32.51, // En %
    marketCap: 333_333_000_000, // 333 333 M FCFA
    pe_ratio: 12.71, // Latest PER from 2024
    beta: undefined, // Information non fournie
    rsi: undefined, // Information non fournie
    // Financial data from 2024 (latest)
    revenue: 68_063_000_000, // Produit Net Bancaire (PNB) 2024 - 68 063 M FCFA
    revenueGrowth: 22.62,
    netIncome: 26_226_000_000, // Résultat net (RN) 2024 - 26 226 M FCFA
    netIncomeGrowth: 57.08,
    bnpa: 1574.00, // BNPA 2024
    dividend: 830.72, // Expected dividend 2024

    // Shareholders data
    shareholders: [
      {
        name: 'IPS-CNPS',
        percentage: 21.54,
        is_public: false, // Supposition : institutionnel
      },
      {
        name: 'BNI',
        percentage: 21.09,
        is_public: false, // Supposition : institutionnel
      },
      {
        name: 'BRANDON & MCAIN CAPITAL',
        percentage: 19.11,
        is_public: false, // Supposition : institutionnel
      },
      {
        name: 'BRVM (DIVERS PORTEURS)',
        percentage: 12.95,
        is_public: true, // Correspond au flottant
      },
      {
        name: 'CAISSE DES DEPÔTS ET DE CONSIGNATION',
        percentage: 12.65,
        is_public: false, // Supposition : institutionnel
      },
      {
        name: 'IPS-CGRAE',
        percentage: 12.65,
        is_public: false, // Supposition : institutionnel
      },
    ],

    // Annual financials data (2020-2024)
    annualFinancials: [
      {
        year: 2020,
        revenue: 45_315_000_000, // PNB
        revenue_growth: undefined,
        net_income: 4_672_000_000,
        net_income_growth: undefined,
        eps: 280.32, // BNPA
        pe_ratio: 71.35,
        dividend: 50.00,
      },
      {
        year: 2021,
        revenue: 44_167_000_000,
        revenue_growth: -2.53,
        net_income: 9_603_000_000,
        net_income_growth: 105.54,
        eps: 576.18,
        pe_ratio: 34.71,
        dividend: 518.40,
      },
      {
        year: 2022,
        revenue: 47_275_000_000,
        revenue_growth: 7.04,
        net_income: 12_391_000_000,
        net_income_growth: 29.03,
        eps: 743.46,
        pe_ratio: 26.90,
        dividend: 401.80,
      },
      {
        year: 2023,
        revenue: 55_508_000_000,
        revenue_growth: 17.42,
        net_income: 16_696_000_000,
        net_income_growth: 34.74,
        eps: 1002.00,
        pe_ratio: 19.96,
        dividend: 540.90,
      },
      {
        year: 2024,
        revenue: 68_063_000_000,
        revenue_growth: 22.62,
        net_income: 26_226_000_000,
        net_income_growth: 57.08,
        eps: 1574.00,
        pe_ratio: 12.71,
        dividend: 830.72,
      },
    ],
  };

  await importFundamentals(fundamentalData);

  console.log('\n✅ Import completed successfully for BICICI!\n');
}



/**
 * Import data for BICB (BIIC - Banque Internationale pour l'Industrie et le Commerce)
 */
async function importBICBData() {
  console.log('\n🚀 Starting import for BICB (BIIC - Banque Internationale pour l\'Industrie et le Commerce)\n');

  const ticker = 'BICB';
  const excelPath = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\bicb\\bicb.xlsx';

  // 1. Import historical data from Excel
  await importHistoryFromExcel(excelPath, ticker);

  // 2. Import fundamental data
  const fundamentalData: FundamentalData = {
    ticker: 'BICB',
    companyName: 'BIIC - Banque Internationale pour l\'Industrie et le Commerce',
    description:
      "La société : Issue de la fusion réussie, en 2020, entre la Banque Africaine de l'Industrie et du Commerce (BAIC) et la Banque Internationale du Bénin pour l'Économie (BIBE), la Banque Internationale pour l'Industrie et le Commerce (BIIC) s'est rapidement imposée comme l'un des acteurs majeurs du secteur bancaire au Bénin. Dotée d'un capital de 82,514 milliards de FCFA, la BIIC se distingue par sa solidité, son esprit d'innovation et sa volonté affirmée d'accompagner les ambitions de ses clients tout en contribuant activement au développement de l'économie nationale.",
    phone: '+2290121312200',
    fax: undefined,
    address:
      'Boulevard St Michel, Cotonou (Bénin), Littoral Département 01 BP 7744 Cotonou',
    website: undefined,
    ceo: 'Arsène M. DANSOU',
    president: 'DAHOUN B. Dieudonné',
    numberOfShares: 57_759_800,
    freefloat: 33.00,
    marketCap: 288_799_000_000,
    pe_ratio: 9.52,
    beta: undefined,
    rsi: undefined,
    revenue: 45_207_000_000,
    revenueGrowth: 15.34,
    netIncome: 30_341_000_000,
    netIncomeGrowth: 11.26,
    bnpa: 525.29,
    dividend: 254.50,

    shareholders: [
      {
        name: 'GRAND PUBLIC',
        percentage: 33.00,
        is_public: true,
      },
      {
        name: 'CAISSE DES DEPOTS ET CONSIGNATIONS DU BENIN',
        percentage: 32.00,
        is_public: false,
      },
      {
        name: 'ETAT DU BENIN',
        percentage: 18.26,
        is_public: false,
      },
      {
        name: 'PORT AUTONOME DE COTONOU',
        percentage: 3.40,
        is_public: false,
      },
    ],

    annualFinancials: [
      {
        year: 2021,
        revenue: 14_898_000_000,
        revenue_growth: undefined,
        net_income: 5_776_000_000,
        net_income_growth: undefined,
        eps: 100.00,
        pe_ratio: 50.00,
        dividend: undefined,
      },
      {
        year: 2022,
        revenue: 24_209_000_000,
        revenue_growth: 62.50,
        net_income: 10_705_000_000,
        net_income_growth: 85.34,
        eps: 185.00,
        pe_ratio: 27.03,
        dividend: undefined,
      },
      {
        year: 2023,
        revenue: 39_196_000_000,
        revenue_growth: 61.91,
        net_income: 27_270_000_000,
        net_income_growth: 154.74,
        eps: 472.00,
        pe_ratio: 10.59,
        dividend: undefined,
      },
      {
        year: 2024,
        revenue: 45_207_000_000,
        revenue_growth: 15.34,
        net_income: 30_341_000_000,
        net_income_growth: 11.26,
        eps: 525.29,
        pe_ratio: 9.52,
        dividend: 254.50,
      },
    ],
  };

  await importFundamentals(fundamentalData);

  console.log('\n✅ Import completed successfully for BICB!\n');
}

/**
 * Parse and import all stocks from consolidated text file
 */
async function importAllStocksFromConsolidatedFile(filePath: string) {
  console.log('\n🚀 Starting import from consolidated file...\n');
  console.log(`📂 Reading file: ${filePath}\n`);

  const fileContent = readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');

  let currentStock: any = null;
  let lineIndex = 0;
  let importedCount = 0;
  let skippedCount = 0;

  const parsePercentage = (str: string): number => {
    return parseFloat(str.replace('%', '').replace(',', '.').trim());
  };

  const parseNumber = (str: string): number => {
    return parseFloat(str.replace(/\s/g, '').replace(',', '.'));
  };

  while (lineIndex < lines.length) {
    const line = lines[lineIndex].trim();

    // Check if line is a ticker (4-5 uppercase letters at start of line)
    if (line && /^[A-Z]{4,6}$/.test(line) && lineIndex < lines.length - 10) {
      // Save previous stock if exists
      if (currentStock && currentStock.ticker) {
        try {
          console.log(`\n📊 Processing ${currentStock.ticker}...`);

          // Find Excel file
          const excelPath = findExcelFile(currentStock.ticker);
          if (excelPath) {
            await importHistoryFromExcel(excelPath, currentStock.ticker);
          } else {
            console.log(`⚠️  No Excel file found for ${currentStock.ticker}`);
          }

          // Import fundamentals
          await importFundamentals(currentStock);
          importedCount++;
        } catch (error) {
          console.error(`❌ Error importing ${currentStock.ticker}:`, error);
          skippedCount++;
        }
      }

      // Start new stock
      currentStock = {
        ticker: line,
        companyName: '',
        description: '',
        phone: undefined,
        fax: undefined,
        address: undefined,
        website: undefined,
        ceo: undefined,
        president: undefined,
        numberOfShares: undefined,
        freefloat: undefined,
        marketCap: undefined,
        pe_ratio: undefined,
        beta: undefined,
        rsi: undefined,
        revenue: undefined,
        revenueGrowth: undefined,
        netIncome: undefined,
        netIncomeGrowth: undefined,
        bnpa: undefined,
        dividend: undefined,
        shareholders: [],
        annualFinancials: []
      };

      lineIndex++;
      continue;
    }

    if (!currentStock) {
      lineIndex++;
      continue;
    }

    // Parse description
    if (line.startsWith('La société :')) {
      currentStock.description = line.replace('La société :', '').trim();
      lineIndex++;
      continue;
    }

    // Parse phone
    if (line.startsWith('Téléphone :')) {
      currentStock.phone = line.replace('Téléphone :', '').trim() || undefined;
      lineIndex++;
      continue;
    }

    // Parse fax
    if (line.startsWith('Fax :')) {
      const fax = line.replace('Fax :', '').trim();
      currentStock.fax = fax || undefined;
      lineIndex++;
      continue;
    }

    // Parse address
    if (line.startsWith('Adresse :')) {
      currentStock.address = line.replace('Adresse :', '').trim() || undefined;
      lineIndex++;
      continue;
    }

    // Parse dirigeants
    if (line.startsWith('Dirigeants :')) {
      const dirigeants = line.replace('Dirigeants :', '').trim();
      // Extract CEO and President
      if (dirigeants.includes('DG :') || dirigeants.includes('Directeur Général')) {
        const dgMatch = dirigeants.match(/(?:DG|Directeur Général)[:\s]+([^,\n]+)/i);
        if (dgMatch) currentStock.ceo = dgMatch[1].trim();
      }
      if (dirigeants.includes('PCA :') || dirigeants.includes('Président')) {
        const pcaMatch = dirigeants.match(/(?:PCA|Président(?:\sdu\sConseil\sd'Administration)?)[:\s]+([^,\n]+)/i);
        if (pcaMatch) currentStock.president = pcaMatch[1].trim();
      }
      lineIndex++;
      continue;
    }

    // Parse number of shares
    if (line.startsWith('Nombre de titres :')) {
      const shares = line.replace('Nombre de titres :', '').trim();
      currentStock.numberOfShares = parseNumber(shares);
      lineIndex++;
      continue;
    }

    // Parse freefloat
    if (line.startsWith('Flottant :')) {
      const ff = line.replace('Flottant :', '').trim();
      currentStock.freefloat = parsePercentage(ff);
      lineIndex++;
      continue;
    }

    // Parse market cap
    if (line.startsWith('Valorisation de la société :')) {
      const val = line.replace('Valorisation de la société :', '').replace('MFCFA', '').trim();
      currentStock.marketCap = parseNumber(val) * 1_000_000;
      lineIndex++;
      continue;
    }

    // Parse shareholders
    if (line === 'Principaux actionnaires') {
      lineIndex++;
      // Skip empty lines
      while (lineIndex < lines.length && !lines[lineIndex].trim()) lineIndex++;

      // Read shareholders until we hit financial data or another section
      while (lineIndex < lines.length) {
        const shLine = lines[lineIndex].trim();
        if (!shLine || shLine.startsWith('Les chiffres') || shLine.startsWith('Volume') || /^\d{4}/.test(shLine)) {
          break;
        }

        // Parse shareholder line (format: "NAME\tPERCENTAGE")
        if (shLine.includes('\t') || shLine.includes('%')) {
          const parts = shLine.split(/\t|%/);
          if (parts.length >= 2) {
            const name = parts[0].trim();
            const percentage = parsePercentage(parts[1]);
            if (name && !isNaN(percentage)) {
              currentStock.shareholders.push({
                name,
                percentage,
                is_public: name.toUpperCase().includes('PUBLIC') || name.toUpperCase().includes('BRVM')
              });
            }
          }
        }
        lineIndex++;
      }
      continue;
    }

    // Parse annual financials table
    if (line.startsWith('Les chiffres sont en millions de FCFA')) {
      lineIndex++;

      // Read years line
      const yearsLine = lines[lineIndex]?.trim();
      if (!yearsLine) {
        lineIndex++;
        continue;
      }

      const years = yearsLine.split(/\t+/).filter((y: string) => /^\d{4}$/.test(y.trim())).map((y: string) => parseInt(y.trim()));
      lineIndex++;

      // Read financial rows
      const financialData: any = {};
      const rowNames = [
        'Chiffre d\'affaires', 'Produit Net Bancaire', 'Croissance CA', 'Croissance du PNB',
        'Résultat net', 'Croissance RN', 'BNPA', 'PER', 'Dividende'
      ];

      while (lineIndex < lines.length) {
        const rowLine = lines[lineIndex].trim();
        if (!rowLine || rowLine.startsWith('Volume') || rowLine.startsWith('Beta') || /^[A-Z]{4,6}$/.test(rowLine)) {
          break;
        }

        // Check if line starts with a known row name
        const matchedRow = rowNames.find(name => rowLine.startsWith(name));
        if (matchedRow) {
          const values = rowLine.replace(matchedRow, '').trim().split(/\t+/);
          financialData[matchedRow] = values;
        }

        lineIndex++;
      }

      // Convert to annualFinancials array
      years.forEach((year: number, idx: number) => {
        const revenue = financialData['Chiffre d\'affaires']?.[idx] || financialData['Produit Net Bancaire']?.[idx];
        const revenueGrowth = financialData['Croissance CA']?.[idx] || financialData['Croissance du PNB']?.[idx];
        const netIncome = financialData['Résultat net']?.[idx];
        const netIncomeGrowth = financialData['Croissance RN']?.[idx];
        const eps = financialData['BNPA']?.[idx];
        const per = financialData['PER']?.[idx];
        const dividend = financialData['Dividende']?.[idx];

        if (revenue && revenue !== '-') {
          currentStock.annualFinancials.push({
            year,
            revenue: parseNumber(revenue) * 1_000_000,
            revenue_growth: revenueGrowth && revenueGrowth !== '-' ? parsePercentage(revenueGrowth) : undefined,
            net_income: netIncome && netIncome !== '-' ? parseNumber(netIncome) * 1_000_000 : undefined,
            net_income_growth: netIncomeGrowth && netIncomeGrowth !== '-' ? parsePercentage(netIncomeGrowth) : undefined,
            eps: eps && eps !== '-' ? parseNumber(eps) : undefined,
            pe_ratio: per && per !== '-' ? parseNumber(per) : undefined,
            dividend: dividend && dividend !== '-' ? parseNumber(dividend) : undefined
          });
        }
      });

      // Set latest year data
      if (currentStock.annualFinancials.length > 0) {
        const latest = currentStock.annualFinancials[currentStock.annualFinancials.length - 1];
        currentStock.revenue = latest.revenue;
        currentStock.revenueGrowth = latest.revenue_growth;
        currentStock.netIncome = latest.net_income;
        currentStock.netIncomeGrowth = latest.net_income_growth;
        currentStock.bnpa = latest.eps;
        currentStock.pe_ratio = latest.pe_ratio;
        currentStock.dividend = latest.dividend;
      }

      continue;
    }

    // Parse Beta
    if (line.startsWith('Beta')) {
      const beta = line.split(/\s+/)[2];
      if (beta) currentStock.beta = parseNumber(beta);
      lineIndex++;
      continue;
    }

    // Parse RSI
    if (line.startsWith('RSI')) {
      const rsi = line.split(/\s+/)[1];
      if (rsi) currentStock.rsi = parseNumber(rsi);
      lineIndex++;
      continue;
    }

    lineIndex++;
  }

  // Import last stock
  if (currentStock && currentStock.ticker) {
    try {
      console.log(`\n📊 Processing ${currentStock.ticker}...`);

      const excelPath = findExcelFile(currentStock.ticker);
      if (excelPath) {
        await importHistoryFromExcel(excelPath, currentStock.ticker);
      } else {
        console.log(`⚠️  No Excel file found for ${currentStock.ticker}`);
      }

      await importFundamentals(currentStock);
      importedCount++;
    } catch (error) {
      console.error(`❌ Error importing ${currentStock.ticker}:`, error);
      skippedCount++;
    }
  }

  console.log(`\n\n✅ Import completed!`);
  console.log(`   📈 Successfully imported: ${importedCount} stocks`);
  console.log(`   ⚠️  Skipped: ${skippedCount} stocks\n`);
}

/**
 * Helper function to find Excel file for a given ticker
 */
function findExcelFile(ticker: string): string | null {
  const baseDir = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm';
  const possiblePaths = [
    join(baseDir, ticker.toLowerCase(), `${ticker.toLowerCase()}.xlsx`),
    join(baseDir, ticker, `${ticker}.xlsx`),
    join(baseDir, ticker.toUpperCase(), `${ticker.toUpperCase()}.xlsx`),
  ];

  for (const filePath of possiblePaths) {
    if (existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

// Main execution
async function main() {
  try {
    // Import all stocks from consolidated file
    const consolidatedFilePath = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\ALL action.txt';
    await importAllStocksFromConsolidatedFile(consolidatedFilePath);

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
export { importHistoryFromExcel, importFundamentals, importStockData, importBICBData };
