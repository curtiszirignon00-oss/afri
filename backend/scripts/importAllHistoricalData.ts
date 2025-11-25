import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { existsSync, readFileSync } from 'fs';
import { basename, dirname } from 'path';

const prisma = new PrismaClient();

interface StockDataRow {
  Date: string | number;
  // Format 1: French column names
  'Dernier'?: number | string;
  'Ouv.'?: number | string;
  'Plus Haut'?: number | string;
  'Plus Bas'?: number | string;
  'Volume'?: number | string;
  // Format 2: Alternative French column names
  'Clôture'?: number | string;
  'Ouverture'?: number | string;
  'Plus haut'?: number | string;
  'Plus bas'?: number | string;
  'Volume Titres'?: number | string;
  'Volume FCFA'?: number | string;
}

/**
 * Parse Excel date to JavaScript Date
 */
function parseExcelDate(excelDate: number | string): Date {
  if (typeof excelDate === 'string') {
    const parsed = Date.parse(excelDate);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }
    return new Date(excelDate);
  }

  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date;
}

/**
 * Import historical data from Excel file for a specific ticker
 */
async function importHistoryFromExcel(excelPath: string, ticker: string): Promise<number> {
  console.log(`\n📊 Importing historical data for ${ticker} from Excel...`);

  if (!existsSync(excelPath)) {
    console.log(`⚠️  Excel file not found: ${excelPath}`);
    return 0;
  }

  try {
    const workbook = XLSX.readFile(excelPath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data: StockDataRow[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} rows in Excel file`);

    // Get stock from database
    const stock = await prisma.stock.findUnique({
      where: { symbol: ticker }
    });

    if (!stock) {
      console.log(`⚠️  Stock ${ticker} not found in database, skipping...`);
      return 0;
    }

    let imported = 0;
    let skipped = 0;

    for (const row of data) {
      try {
        if (!row.Date) {
          skipped++;
          continue;
        }

        const date = parseExcelDate(row.Date);

        if (isNaN(date.getTime())) {
          skipped++;
          continue;
        }

        // Support multiple column name formats
        const close = parseFloat(String(row['Dernier'] || row['Clôture'] || '0').replace(/\s/g, ''));
        const open = parseFloat(String(row['Ouv.'] || row['Ouverture'] || close).replace(/\s/g, ''));
        const high = parseFloat(String(row['Plus Haut'] || row['Plus haut'] || close).replace(/\s/g, ''));
        const low = parseFloat(String(row['Plus Bas'] || row['Plus bas'] || close).replace(/\s/g, ''));
        const volume = parseInt(String(row['Volume'] || row['Volume Titres'] || row['Volume FCFA'] || '0').replace(/\s/g, ''), 10);

        if (isNaN(close) || close <= 0) {
          skipped++;
          continue;
        }

        await prisma.stockHistory.upsert({
          where: {
            stock_ticker_date: {
              stock_ticker: ticker,
              date: date
            }
          },
          update: {
            open: open || close,
            high: high || close,
            low: low || close,
            close: close,
            volume: volume || 0
          },
          create: {
            stockId: stock.id,
            stock_ticker: ticker,
            date: date,
            open: open || close,
            high: high || close,
            low: low || close,
            close: close,
            volume: volume || 0
          }
        });

        imported++;
      } catch (error) {
        skipped++;
      }
    }

    console.log(`✅ Imported ${imported} historical records for ${ticker}`);
    if (skipped > 0) {
      console.log(`⚠️  Skipped ${skipped} invalid rows`);
    }

    return imported;
  } catch (error) {
    console.error(`❌ Error importing ${ticker}:`, error);
    return 0;
  }
}

/**
 * Extract ticker from file path
 */
function extractTickerFromPath(filePath: string): string {
  const dirName = basename(dirname(filePath));
  return dirName.toUpperCase();
}

/**
 * Main function to import all historical data
 */
async function main() {
  console.log('🚀 Starting bulk historical data import...\n');

  // Read the file containing all Excel paths
  const xlsListPath = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\all xls files.txt';
  const fileContent = readFileSync(xlsListPath, 'utf-8');
  const lines = fileContent.split('\n').map(l => l.trim()).filter(l => l && l.endsWith('.xlsx'));

  console.log(`📂 Found ${lines.length} Excel files to process\n`);

  let totalImported = 0;
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const filePath = lines[i].replace(/^‪/, ''); // Remove invisible characters
    const ticker = extractTickerFromPath(filePath);

    console.log(`\n[${i + 1}/${lines.length}] Processing ${ticker}...`);
    console.log(`File: ${filePath}`);

    try {
      const imported = await importHistoryFromExcel(filePath, ticker);
      if (imported > 0) {
        totalImported += imported;
        successCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to process ${ticker}:`, error);
      failedCount++;
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully processed: ${successCount} stocks`);
  console.log(`❌ Failed: ${failedCount} stocks`);
  console.log(`📈 Total historical records imported: ${totalImported}`);
  console.log('='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
