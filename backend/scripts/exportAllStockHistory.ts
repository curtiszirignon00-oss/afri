/**
 * Export de l'historique journalier de TOUTES les actions vers un fichier Excel.
 * Une feuille par action, période 01/01/2023 -> 29/09/2026.
 *
 * Connexion via le driver natif `mongodb` car :
 *  - le résolveur DNS local ne gère pas les requêtes SRV/TXT du cluster Atlas M0 ;
 *  - on force donc le DNS sur des serveurs publics (SRV OK) ;
 *  - et on court-circuite la résolution TXT (inexistante ici, sinon timeout 30s).
 *
 * Build & run :
 *   npx esbuild scripts/exportAllStockHistory.ts --bundle --platform=node \
 *     --packages=external --outfile=scripts/.exportAllStockHistory.cjs --format=cjs
 *   node scripts/.exportAllStockHistory.cjs
 */

import dns from 'dns';
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

// --- Contournements DNS pour le cluster Atlas M0 ---
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  dns.promises.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  /* noop */
}
// Ce cluster ne publie pas d'enregistrement TXT et les requêtes TXT expirent (30s).
// On les fait échouer immédiatement : le driver retombe alors sur les options par défaut.
const enodata = Object.assign(new Error('queryTxt ENODATA'), { code: 'ENODATA' });
(dns as any).resolveTxt = (_name: string, cb: Function) => process.nextTick(() => cb(enodata));
(dns.promises as any).resolveTxt = async () => {
  throw enodata;
};

const START_DATE = new Date('2023-01-01T00:00:00.000Z');
const END_DATE = new Date('2026-09-29T23:59:59.999Z');

// Excel: nom de feuille <= 31 caractères, sans []:*?/\
function safeSheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[\[\]:\*\?\/\\]/g, '_').slice(0, 31) || 'SHEET';
  let candidate = base;
  let i = 1;
  while (used.has(candidate.toLowerCase())) {
    const suffix = `_${i++}`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

async function main() {
  console.log("📊 Export de l'historique journalier de toutes les actions...\n");

  const uri = process.env.DATABASE_URI;
  if (!uri) throw new Error('DATABASE_URI manquant dans .env');

  const exportsDir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 30000 });
  await client.connect();
  console.log('   ✅ Connecté à la base.\n');
  const db = client.db();

  const stocks = await db
    .collection('stocks')
    .find({}, { projection: { symbol: 1, company_name: 1 } })
    .sort({ symbol: 1 })
    .toArray();
  console.log(`   ${stocks.length} actions trouvées.\n`);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AfriBourse';
  workbook.created = new Date();

  const usedNames = new Set<string>();
  let totalRows = 0;
  let stocksWithData = 0;
  const summary: { symbol: string; name: string; rows: number }[] = [];

  for (const stock of stocks) {
    const symbol: string = stock.symbol;
    const history = await db
      .collection('stock_history')
      .find(
        { stock_ticker: symbol, date: { $gte: START_DATE, $lte: END_DATE } },
        { projection: { date: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 } }
      )
      .sort({ date: 1 })
      .toArray();

    const sheetName = safeSheetName(symbol, usedNames);
    const ws = workbook.addWorksheet(sheetName);
    ws.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Ouverture', key: 'open', width: 14 },
      { header: 'Plus Haut', key: 'high', width: 14 },
      { header: 'Plus Bas', key: 'low', width: 14 },
      { header: 'Clôture', key: 'close', width: 14 },
      { header: 'Volume', key: 'volume', width: 16 },
    ];

    for (const h of history) {
      const d: Date = h.date instanceof Date ? h.date : new Date(h.date);
      ws.addRow({
        date: d.toISOString().split('T')[0],
        open: h.open,
        high: h.high,
        low: h.low,
        close: h.close,
        volume: h.volume,
      });
    }

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ['open', 'high', 'low', 'close'].forEach((k) => (ws.getColumn(k).numFmt = '#,##0.00'));
    ws.getColumn('volume').numFmt = '#,##0';

    totalRows += history.length;
    if (history.length > 0) stocksWithData++;
    summary.push({ symbol, name: stock.company_name ?? '', rows: history.length });
    console.log(`   ✔ ${symbol.padEnd(8)} ${String(history.length).padStart(5)} lignes`);
  }

  // Feuille récapitulative en première position
  const summaryWs = workbook.addWorksheet('_Résumé');
  workbook.worksheets.pop();
  workbook.worksheets.unshift(summaryWs);
  summaryWs.columns = [
    { header: 'Symbole', key: 'symbol', width: 12 },
    { header: 'Société', key: 'name', width: 40 },
    { header: 'Nb lignes', key: 'rows', width: 12 },
  ];
  summary.forEach((s) => summaryWs.addRow(s));
  summaryWs.getRow(1).font = { bold: true };
  summaryWs.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2196F3' } };

  const filePath = path.join(exportsDir, 'historique_actions_2023-01-01_2026-09-29.xlsx');
  await workbook.xlsx.writeFile(filePath);
  await client.close();

  console.log(`\n🎉 Export terminé.`);
  console.log(`   Fichier : ${filePath}`);
  console.log(
    `   ${stocks.length} feuilles (${stocksWithData} avec données), ${totalRows} lignes au total.`
  );
}

main().catch((e) => {
  console.error('❌ Erreur:', e);
  process.exit(1);
});
