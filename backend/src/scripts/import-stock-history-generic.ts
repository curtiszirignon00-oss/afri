/// <reference types="node" />
import * as XLSX from 'xlsx';
import prisma from '../config/prisma';
import { existsSync } from 'fs';

interface StockDataRow {
  Date?: string | number;
  date?: string | number;
  DATE?: string | number;
  // Format 1: French column names (variant 1)
  'Dernier'?: number | string;
  'Ouv.'?: number | string;
  'Plus Haut'?: number | string;
  'Plus Bas'?: number | string;
  'Volume'?: number | string;
  // Format 2: French column names (variant 2)
  'Clôture'?: number | string;
  'Cloture'?: number | string;
  'Ouverture'?: number | string;
  'Plus haut'?: number | string;
  'Plus bas'?: number | string;
  'Volume Titres'?: number | string;
  'Volume FCFA'?: number | string;
  // English format
  'Close'?: number | string;
  'Open'?: number | string;
  'High'?: number | string;
  'Low'?: number | string;
  [key: string]: any;
}

/**
 * Parse Excel date to JavaScript Date
 */
function parseExcelDate(excelDate: number | string): Date {
  if (typeof excelDate === 'string') {
    // Handle DD/MM/YYYY format (European/French)
    const ddmmyyyy = excelDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1; // 0-indexed
      const year = parseInt(ddmmyyyy[3], 10);
      return new Date(Date.UTC(year, month, day)); // UTC pour eviter les decalages timezone
    }
    // Handle YYYY-MM-DD or other standard formats
    const parsed = Date.parse(excelDate);
    if (!isNaN(parsed)) {
      // Normaliser a minuit UTC
      const d = new Date(parsed);
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    }
    return new Date(excelDate);
  }

  // Excel date: number of days since 1900-01-01
  const parsedDate = XLSX.SSF.parse_date_code(excelDate) as any;
  return new Date(Date.UTC(parsedDate.y, parsedDate.m - 1, parsedDate.d)); // UTC
}

/**
 * Extract value from row with multiple possible column names
 */
function extractValue(row: StockDataRow, columnNames: string[]): number | string | undefined {
  for (const colName of columnNames) {
    if (row[colName] !== undefined && row[colName] !== null && row[colName] !== '') {
      return row[colName];
    }
  }
  return undefined;
}

/**
 * Parse numeric value from string (handles spaces like "1 107")
 */
function parseNumericValue(value: number | string | undefined, defaultValue: number = 0): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  if (typeof value === 'number') {
    return value;
  }
  const cleaned = String(value).replace(/\s/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Import historical data from Excel file for a specific ticker
 */
export async function importStockHistoryFromExcel(
  ticker: string,
  excelPath: string,
  options: {
    skipExisting?: boolean; // Si true, ignore les données existantes au lieu de les mettre à jour
    verbose?: boolean;
  } = {}
): Promise<{ imported: number; updated: number; skipped: number; errors: number }> {
  const { skipExisting = true, verbose = true } = options;

  if (verbose) {
    console.log(`\n📊 Import des données historiques pour ${ticker}...`);
    console.log(`📂 Fichier: ${excelPath}\n`);
  }

  if (!existsSync(excelPath)) {
    console.log(`⚠️  Fichier Excel introuvable: ${excelPath}`);
    return { imported: 0, updated: 0, skipped: 0, errors: 0 };
  }

  try {
    // Lire le fichier Excel
    const workbook = XLSX.readFile(excelPath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data: StockDataRow[] = XLSX.utils.sheet_to_json(worksheet);

    if (verbose) {
      console.log(`📋 ${data.length} lignes trouvées dans le fichier Excel`);
      if (data.length > 0) {
        console.log('🔍 Aperçu de la première ligne:');
        console.log(JSON.stringify(data[0], null, 2));
        console.log('');
      }
    }

    // Vérifier que le stock existe dans la base de données
    const stock = await prisma.stock.findUnique({
      where: { symbol: ticker }
    });

    if (!stock) {
      console.log(`⚠️  Action ${ticker} non trouvée dans la base de données`);
      console.log(`💡 Veuillez d'abord créer l'action dans la base de données`);
      return { imported: 0, updated: 0, skipped: 0, errors: 0 };
    }

    if (verbose) {
      console.log(`✅ Action trouvée: ${stock.company_name}`);
      console.log(`🔄 Début de l'import...\n`);
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        // Extraire la date
        const dateValue = extractValue(row, ['Date', 'date', 'DATE']);
        if (!dateValue) {
          skipped++;
          continue;
        }

        const date = parseExcelDate(dateValue);
        if (isNaN(date.getTime())) {
          if (verbose) {
            console.log(`⚠️  Ligne ${i + 1}: Date invalide (${dateValue}), ignorée`);
          }
          skipped++;
          continue;
        }

        // Extraire les valeurs OHLCV avec support de multiples formats de colonnes
        const closeValue = extractValue(row, ['Close', 'close', 'Clôture', 'Cloture', 'Dernier', 'fermeture', 'Fermeture']);
        const close = parseNumericValue(closeValue, 0);

        if (close <= 0) {
          skipped++;
          continue;
        }

        const openValue = extractValue(row, ['Open', 'open', 'Ouverture', 'Ouv.', 'ouverture']);
        const open = parseNumericValue(openValue, close);

        const highValue = extractValue(row, ['High', 'high', 'Plus haut', 'Plus Haut', '+Haut', '+haut']);
        const high = parseNumericValue(highValue, close);

        const lowValue = extractValue(row, ['Low', 'low', 'Plus bas', 'Plus Bas', '+Bas', '+bas']);
        const low = parseNumericValue(lowValue, close);

        const volumeValue = extractValue(row, ['Volume', 'volume', 'Volume Titres', 'Volume FCFA', 'Vol.']);
        const volume = Math.floor(parseNumericValue(volumeValue, 0));

        // Vérifier si la donnée existe déjà
        const existing = await prisma.stockHistory.findUnique({
          where: {
            stock_ticker_date: {
              stock_ticker: ticker,
              date: date
            }
          }
        });

        if (existing) {
          if (skipExisting) {
            // Ne pas toucher aux données existantes
            skipped++;
          } else {
            // Mettre à jour les données existantes
            await prisma.stockHistory.update({
              where: { id: existing.id },
              data: {
                open,
                high,
                low,
                close,
                volume
              }
            });
            updated++;
          }
        } else {
          // Créer une nouvelle entrée
          await prisma.stockHistory.create({
            data: {
              stockId: stock.id,
              stock_ticker: ticker,
              date: date,
              open,
              high,
              low,
              close,
              volume
            }
          });
          imported++;
        }

        // Afficher la progression tous les 50 enregistrements
        if (verbose && (imported + updated) % 50 === 0 && (imported + updated) > 0) {
          console.log(`  ✅ ${imported + updated} enregistrements traités...`);
        }

      } catch (error) {
        errors++;
        if (verbose) {
          console.error(`  ❌ Erreur ligne ${i + 1}:`, error instanceof Error ? error.message : error);
        }
      }
    }

    if (verbose) {
      console.log('\n' + '='.repeat(60));
      console.log(`📊 RÉSUMÉ DE L'IMPORT - ${ticker}`);
      console.log('='.repeat(60));
      console.log(`✅ Nouvelles données ajoutées: ${imported}`);
      console.log(`🔄 Données mises à jour: ${updated}`);
      console.log(`ℹ️  Données ignorées (déjà existantes): ${skipped}`);
      console.log(`❌ Erreurs: ${errors}`);
      console.log(`📈 Total traité: ${data.length}`);
      console.log('='.repeat(60) + '\n');
    }

    return { imported, updated, skipped, errors };

  } catch (error) {
    console.error(`❌ Erreur lors de l'import de ${ticker}:`, error);
    throw error;
  }
}

/**
 * Import multiple stocks from a list of Excel files
 */
export async function importMultipleStocks(
  stocks: Array<{ ticker: string; excelPath: string }>,
  options: {
    skipExisting?: boolean;
    verbose?: boolean;
  } = {}
): Promise<void> {
  console.log('🚀 Import en masse des données historiques...\n');
  console.log(`📂 ${stocks.length} actions à importer\n`);

  let totalImported = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < stocks.length; i++) {
    const { ticker, excelPath } = stocks[i];
    console.log(`\n[${ i + 1}/${stocks.length}] Traitement de ${ticker}...`);

    try {
      const result = await importStockHistoryFromExcel(ticker, excelPath, options);
      if (result.imported > 0 || result.updated > 0) {
        totalImported += result.imported;
        totalUpdated += result.updated;
        totalSkipped += result.skipped;
        totalErrors += result.errors;
        successCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      console.error(`❌ Échec de l'import pour ${ticker}:`, error);
      failedCount++;
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ GLOBAL');
  console.log('='.repeat(60));
  console.log(`✅ Actions traitées avec succès: ${successCount}`);
  console.log(`❌ Actions échouées: ${failedCount}`);
  console.log(`📈 Total nouvelles données: ${totalImported}`);
  console.log(`🔄 Total mises à jour: ${totalUpdated}`);
  console.log(`ℹ️  Total ignorées: ${totalSkipped}`);
  console.log(`❌ Total erreurs: ${totalErrors}`);
  console.log('='.repeat(60) + '\n');
}

// Si le script est exécuté directement
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: npm run import-stock-history <TICKER> <EXCEL_PATH>');
    console.log('Exemple: npm run import-stock-history FTSC "C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\ftsc\\FTSC.xlsx"');
    process.exit(1);
  }

  const ticker = args[0].toUpperCase();
  const excelPath = args[1];

  importStockHistoryFromExcel(ticker, excelPath, { skipExisting: true, verbose: true })
    .then((result) => {
      console.log('\n🎉 Import terminé avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erreur fatale:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
