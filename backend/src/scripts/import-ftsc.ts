/// <reference types="node" />
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';

const prisma = new PrismaClient();

async function importFTSCData() {
  console.log('📊 Importation des données FTSC...\n');

  try {
    // Lire le fichier Excel
    const filePath = path.join('C:', 'Users', 'HP', 'OneDrive', 'Desktop', 'actions brvm', 'ftsc', 'FTSC.xlsx');
    console.log(`📁 Lecture du fichier: ${filePath}\n`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir en JSON
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📋 ${data.length} lignes trouvées dans le fichier\n`);

    if (data.length === 0) {
      console.log('⚠️  Aucune donnée trouvée dans le fichier');
      return;
    }

    // Afficher les en-têtes pour comprendre la structure
    console.log('📌 Structure des données:');
    console.log(Object.keys(data[0]));
    console.log('\n📝 Première ligne exemple:');
    console.log(data[0]);
    console.log('\n');

    // Trouver ou créer l'action FTSC
    let stock = await prisma.stock.findFirst({
      where: { symbol: 'FTSC' }
    });

    if (!stock) {
      console.log('🏢 Création de l\'action FTSC...');
      stock = await prisma.stock.create({
        data: {
          symbol: 'FTSC',
          company_name: 'Filtisac Côte d\'Ivoire',
          sector: 'Industrie',
          country: 'CI',
          description: 'Filtisac Côte d\'Ivoire est spécialisée dans la fabrication de sacs en polypropylène tissé.',
          is_active: true,
          current_price: 0,
          previous_close: 0,
          daily_change_percent: 0,
          volume: 0,
          market_cap: 0
        }
      });
      console.log('✅ Action FTSC créée\n');
    } else {
      console.log('✅ Action FTSC trouvée\n');
    }

    // Insérer les données de cours
    let insertCount = 0;
    let updateCount = 0;
    let skipCount = 0;

    for (const row of data) {
      // Adapter selon la structure réelle du fichier
      const dateStr = row['Date'];
      const closePrice = parseFloat(row['Clôture']);
      const openPrice = parseFloat(row['Ouverture']);
      const highPrice = parseFloat(row['Plus haut']);
      const lowPrice = parseFloat(row['Plus bas']);
      const volumeFCFA = parseInt(row['Volume FCFA'] || '0');

      if (!dateStr || isNaN(closePrice)) {
        skipCount++;
        continue;
      }

      // Convertir la date
      let tradeDate: Date;
      if (typeof dateStr === 'number') {
        // Excel date (nombre de jours depuis 1900-01-01)
        const parsedDate = XLSX.SSF.parse_date_code(dateStr);
        tradeDate = new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d);
      } else {
        tradeDate = new Date(dateStr);
      }

      if (isNaN(tradeDate.getTime())) {
        console.log(`⚠️  Date invalide ignorée: ${dateStr}`);
        skipCount++;
        continue;
      }

      // Vérifier si l'enregistrement existe déjà
      const existing = await prisma.stockHistory.findFirst({
        where: {
          stock_ticker: 'FTSC',
          date: tradeDate
        }
      });

      if (existing) {
        // Mettre à jour
        await prisma.stockHistory.update({
          where: { id: existing.id },
          data: {
            close: closePrice,
            open: openPrice || closePrice,
            high: highPrice || closePrice,
            low: lowPrice || closePrice,
            volume: volumeFCFA || 0
          }
        });
        updateCount++;
      } else {
        // Créer
        await prisma.stockHistory.create({
          data: {
            stock_ticker: 'FTSC',
            stockId: stock.id,
            date: tradeDate,
            close: closePrice,
            open: openPrice || closePrice,
            high: highPrice || closePrice,
            low: lowPrice || closePrice,
            volume: volumeFCFA || 0
          }
        });
        insertCount++;
      }
    }

    console.log('\n✅ Importation terminée!');
    console.log(`   📈 ${insertCount} nouveaux enregistrements insérés`);
    console.log(`   🔄 ${updateCount} enregistrements mis à jour`);
    console.log(`   ⏭️  ${skipCount} lignes ignorées`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importFTSCData();
