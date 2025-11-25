// backend/scripts/importHistoryFromCSV.ts
// Script pour importer l'historique depuis un fichier CSV

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

interface CSVRow {
  symbol: string;
  date: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  // Ajoutez d'autres colonnes selon votre CSV
}

/**
 * Importe l'historique depuis un fichier CSV
 * Format attendu: symbol,date,open,high,low,close,volume
 */
async function importHistoryFromCSV(csvFilePath: string) {
  console.log(`📂 Lecture du fichier CSV: ${csvFilePath}`);

  const results: CSVRow[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data: CSVRow) => results.push(data))
      .on('end', async () => {
        console.log(`\n📊 ${results.length} lignes lues depuis le CSV`);
        console.log(`🔄 Début de l'import dans la base de données...\n`);

        let importedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Grouper par action pour un affichage plus clair
        const groupedByStock = results.reduce((acc, row) => {
          if (!acc[row.symbol]) acc[row.symbol] = [];
          acc[row.symbol].push(row);
          return acc;
        }, {} as Record<string, CSVRow[]>);

        for (const [symbol, rows] of Object.entries(groupedByStock)) {
          console.log(`\n📈 Import de ${symbol} (${rows.length} jours)...`);

          // Vérifier que l'action existe
          const stock = await prisma.stock.findUnique({
            where: { symbol }
          });

          if (!stock) {
            console.log(`  ⚠️  Action ${symbol} non trouvée dans la DB, ignorée`);
            skippedCount += rows.length;
            continue;
          }

          let stockImported = 0;
          let stockSkipped = 0;

          for (const row of rows) {
            try {
              // Parser la date (ajuster le format selon votre CSV)
              const date = new Date(row.date);
              date.setHours(0, 0, 0, 0);

              // Parser les nombres
              const open = parseFloat(row.open);
              const high = parseFloat(row.high);
              const low = parseFloat(row.low);
              const close = parseFloat(row.close);
              const volume = parseInt(row.volume) || 0;

              // Vérifier que les données sont valides
              if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
                stockSkipped++;
                continue;
              }

              // Vérifier si l'entrée existe déjà
              const existing = await prisma.stockHistory.findUnique({
                where: {
                  stock_ticker_date: {
                    stock_ticker: symbol,
                    date: date
                  }
                }
              });

              if (existing) {
                stockSkipped++;
                continue; // Skip si déjà existant
              }

              // Créer l'entrée
              await prisma.stockHistory.create({
                data: {
                  stockId: stock.id,
                  stock_ticker: symbol,
                  date: date,
                  open,
                  high,
                  low,
                  close,
                  volume
                }
              });

              stockImported++;
              importedCount++;

            } catch (error) {
              console.error(`  ❌ Erreur ligne ${row.date}:`, error);
              errorCount++;
            }
          }

          console.log(`  ✅ ${stockImported} jours importés, ${stockSkipped} déjà existants`);
        }

        console.log(`\n🎉 Import terminé !`);
        console.log(`  ✅ Importés: ${importedCount}`);
        console.log(`  ⏭️  Ignorés: ${skippedCount}`);
        console.log(`  ❌ Erreurs: ${errorCount}`);

        resolve({ importedCount, skippedCount, errorCount });
      })
      .on('error', (error) => {
        console.error('❌ Erreur lecture CSV:', error);
        reject(error);
      });
  });
}

// Exécution
const csvPath = process.argv[2] || path.join(__dirname, '../../data/stock_history.csv');

console.log('🚀 Script d\'import historique depuis CSV\n');
console.log(`Configuration:`);
console.log(`  - Fichier CSV: ${csvPath}\n`);

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Fichier non trouvé: ${csvPath}`);
  console.log(`\nUsage: npx ts-node scripts/importHistoryFromCSV.ts [chemin/vers/fichier.csv]`);
  process.exit(1);
}

importHistoryFromCSV(csvPath)
  .then(() => {
    console.log('\n✅ Import terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
