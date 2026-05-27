/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();
const TICKER = 'BOAB';
const EXCEL_PATH = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\Boab\\BOAB.xlsx';

/**
 * Parse date string "dd/mm/yyyy" → Date (UTC midnight)
 */
function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const d = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parse number string with spaces as thousand separators, e.g. "6 555" → 6555
 */
function parseNum(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  const str = String(val).replace(/\s/g, '').replace(',', '.');
  if (str === '-' || str === '') return 0;
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

async function main() {
  console.log(`🚀 Import historique BOAB depuis Excel...\n`);

  // Verify stock exists
  const stock = await prisma.stock.findUnique({ where: { symbol: TICKER } });
  if (!stock) {
    console.error(`❌ Action ${TICKER} introuvable en base de données.`);
    process.exit(1);
  }
  console.log(`✅ Action trouvée: ${stock.name} (${stock.symbol})`);

  // Read Excel
  const workbook = XLSX.readFile(EXCEL_PATH);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet);
  console.log(`📊 ${rows.length} lignes trouvées dans l'Excel`);

  // Only import rows with dates ≤ 23/01/2026 (Excel cutoff)
  // Scrapper data (after this date) is preserved automatically via upsert
  const CUTOFF = new Date(Date.UTC(2026, 0, 23)); // 23 Jan 2026

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const date = parseDate(String(row.Date || ''));
    if (!date) { skipped++; continue; }

    // Skip dates after Excel cutoff — leave scrapper data untouched
    if (date > CUTOFF) { skipped++; continue; }

    const close = parseNum(row['fermeture']);
    const open  = parseNum(row['Ouverture']) || close;
    const high  = parseNum(row['Haut']) || close;
    const low   = parseNum(row['Bas']) || close;
    const volume = Math.round(parseNum(row['Volume']));

    if (close <= 0) { skipped++; continue; }

    try {
      await prisma.stockHistory.upsert({
        where: { stock_ticker_date: { stock_ticker: TICKER, date } },
        update:  { open, high, low, close, volume },
        create:  { stockId: stock.id, stock_ticker: TICKER, date, open, high, low, close, volume }
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  console.log(`\n✅ Importés/mis à jour : ${imported}`);
  console.log(`⚠️  Ignorés (invalides ou post-23/01/2026) : ${skipped}`);
  console.log(`\n🎯 Données récentes du scrapper (après 23/01/2026) préservées.`);
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
