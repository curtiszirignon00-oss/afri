/// <reference types="node" />
/**
 * Import générique d'historique boursier depuis un fichier Excel BRVM
 * Usage: npx ts-node scripts/importExcelHistory.ts <TICKER> "<chemin/vers/fichier.xlsx>"
 *
 * Gère automatiquement les variantes de noms de colonnes :
 *   fermeture / Clôture / Dernier
 *   Ouverture / Ouv.
 *   +Haut / Haut / Plus Haut / Plus haut
 *   +Bas  / Bas  / Plus Bas  / Plus bas
 *   Volume / Volume Titres / Volume FCFA
 */
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Pas de CUTOFF — upsert est safe (même valeurs pour les dates communes avec le scrapper)

function parseDate(val: string | number): Date | null {
  // Numeric Excel serial date (e.g. 46045)
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (isNaN(d.getTime())) return null;
    // Normalize to UTC midnight
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  // String "dd/mm/yyyy"
  const m = String(val).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return isNaN(d.getTime()) ? null : d;
}

function num(row: any, ...keys: string[]): number {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '-' && row[k] !== '') {
      const n = parseFloat(String(row[k]).replace(/\s/g, '').replace(',', '.'));
      if (!isNaN(n)) return n;
    }
  }
  return 0;
}

export async function importExcel(ticker: string, excelPath: string) {
  console.log(`\n📊 Import ${ticker} ← ${excelPath}`);

  const stock = await prisma.stock.findUnique({ where: { symbol: ticker } });
  if (!stock) { console.error(`❌ ${ticker} introuvable en base`); return; }

  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws);
  console.log(`   ${rows.length} lignes dans l'Excel`);

  let imported = 0, skipped = 0;

  for (const row of rows) {
    const date = parseDate(row.Date ?? '');
    if (!date) { skipped++; continue; }

    const close  = num(row, 'fermeture', 'Clôture', 'Dernier');
    const open   = num(row, 'Ouverture', 'Ouv.') || close;
    const high   = num(row, '+Haut', 'Haut', 'Plus Haut', 'Plus haut') || close;
    const low    = num(row, '+Bas',  'Bas',  'Plus Bas',  'Plus bas')  || close;
    const volume = Math.round(num(row, 'Volume', 'Volume Titres', 'Volume FCFA'));

    if (close <= 0) { skipped++; continue; }

    try {
      await prisma.stockHistory.upsert({
        where: { stock_ticker_date: { stock_ticker: ticker, date } },
        update:  { open, high, low, close, volume },
        create:  { stockId: stock.id, stock_ticker: ticker, date, open, high, low, close, volume }
      });
      imported++;
    } catch { skipped++; }
  }

  console.log(`   ✅ Importés/mis à jour : ${imported}`);
  if (skipped) console.log(`   ⚠️  Ignorés : ${skipped}`);
}

export async function runImport(ticker: string, excelPath: string) {
  await importExcel(ticker, excelPath);
}

async function main() {
  const [,, ticker, excelPath] = process.argv;
  if (!ticker || !excelPath) {
    console.error('Usage: npx ts-node scripts/importExcelHistory.ts <TICKER> "<path>"');
    process.exit(1);
  }
  await importExcel(ticker.toUpperCase(), excelPath);
}

// Only run main() when executed directly (not when imported)
if (require.main === module) {
  main()
    .catch(e => { console.error('❌', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
