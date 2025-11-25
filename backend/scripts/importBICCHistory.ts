import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { existsSync } from 'fs';

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
 * Import historical data from Excel file for BICC
 */
async function importBICCHistory() {
  const ticker = 'BICC';
  const excelPath = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\bicc\\bicc.xlsx';

  console.log(`\n📊 Importing historical data for ${ticker} from Excel...`);
  console.log(`File: ${excelPath}\n`);

  if (!existsSync(excelPath)) {
    console.log(`⚠️  Excel file not found: ${excelPath}`);
    return;
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
      console.log(`⚠️  Stock ${ticker} not found in database, cannot import`);
      return;
    }

    console.log(`✅ Stock found: ${stock.company_name} (ID: ${stock.id})`);
    console.log(`\n🔄 Starting import...\n`);

    let imported = 0;
    let skipped = 0;
    let updated = 0;

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

        const result = await prisma.stockHistory.upsert({
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

        // Check if this was an update or create
        const existing = await prisma.stockHistory.findFirst({
          where: {
            stock_ticker: ticker,
            date: date
          }
        });

        if (existing) {
          updated++;
        }

        imported++;

        // Log progress every 500 records
        if (imported % 500 === 0) {
          console.log(`  Progress: ${imported}/${data.length} records processed...`);
        }
      } catch (error) {
        console.error(`  ⚠️  Error on row:`, error);
        skipped++;
      }
    }

    console.log(`\n✅ Import completed for ${ticker}!`);
    console.log(`  📈 Total imported/updated: ${imported} records`);
    console.log(`  ⏭️  Skipped: ${skipped} invalid rows`);
    console.log(`  🔄 Updated existing: ${updated} records`);
    console.log(`  ➕ New records: ${imported - updated} records\n`);
  } catch (error) {
    console.error(`❌ Error importing ${ticker}:`, error);
  }
}

importBICCHistory()
  .catch((e) => {
    console.error('❌ Fatal error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
