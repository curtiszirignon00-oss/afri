/// <reference types="node" />
import * as XLSX from 'xlsx';
import prisma from '../config/prisma';
import path from 'path';

interface RowData {
    Date?: string | number;
    fermeture?: string | number;
    '+Bas'?: string | number;
    '+Haut'?: string | number;
    Ouverture?: string | number;
    Volume?: string | number;
    Variation?: string;
    [key: string]: any;
}

async function importLNBBHistory() {
    try {
        console.log('🚀 Démarrage de l\'import des données historiques LNBB...\n');

        // Chemin vers le fichier Excel
        const excelPath = path.join('C:', 'Users', 'HP', 'OneDrive', 'Desktop', 'actions brvm', 'lnbb', 'lnbb.xlsx');

        console.log(`📂 Lecture du fichier: ${excelPath}`);

        // Lire le fichier Excel
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convertir en JSON
        const rawData: RowData[] = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 Nombre de lignes trouvées: ${rawData.length}\n`);

        if (rawData.length === 0) {
            console.log('⚠️  Aucune donnée trouvée dans le fichier Excel');
            return;
        }

        // Afficher un aperçu de la première ligne pour debug
        console.log('🔍 Aperçu de la première ligne:');
        console.log(JSON.stringify(rawData[0], null, 2));
        console.log('\n');

        // Vérifier si LNBB existe dans la base de données
        let stock = await prisma.stock.findUnique({
            where: { symbol: 'LNBB' }
        });

        // Si LNBB n'existe pas, le créer
        if (!stock) {
            console.log('📝 LNBB non trouvé dans la base de données, création...');
            stock = await prisma.stock.create({
                data: {
                    symbol: 'LNBB',
                    company_name: 'LONACI - LOTERIE NATIONALE DE COTE D\'IVOIRE',
                    sector: 'Services aux consommateurs',
                    current_price: 0,
                    daily_change_percent: 0,
                    volume: 0,
                    market_cap: 0
                }
            });
            console.log('✅ LNBB créé avec succès\n');
        } else {
            console.log('✅ LNBB trouvé dans la base de données\n');
        }

        let addedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        console.log('🔄 Import des données historiques en cours...\n');

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];

            try {
                // Extraire les données avec les colonnes spécifiques du fichier LNBB
                const dateValue = row.Date;
                let closeValue = row.fermeture;
                let lowValue = row['+Bas'];
                let highValue = row['+Haut'];
                let openValue = row.Ouverture;
                let volumeValue = row.Volume;

                // Fonction pour nettoyer les nombres (enlever les espaces)
                const cleanNumber = (value: any): number => {
                    if (value === null || value === undefined || value === '') {
                        return 0;
                    }
                    if (typeof value === 'string') {
                        // Enlever les espaces et remplacer la virgule par un point si nécessaire
                        const cleaned = value.replace(/\s/g, '').replace(',', '.');
                        const num = Number(cleaned);
                        return isNaN(num) ? 0 : num;
                    }
                    const num = Number(value);
                    return isNaN(num) ? 0 : num;
                };

                // Nettoyer tous les nombres
                const open = cleanNumber(openValue);
                const high = cleanNumber(highValue);
                const low = cleanNumber(lowValue);
                const close = cleanNumber(closeValue);
                const volume = cleanNumber(volumeValue);

                if (!dateValue) {
                    console.log(`⚠️  Ligne ${i + 1}: Date manquante, ignorée`);
                    skippedCount++;
                    continue;
                }

                // Convertir la date - format attendu: DD/MM/YYYY
                let date: Date;
                if (typeof dateValue === 'number') {
                    // Si c'est un nombre Excel (jours depuis 1900-01-01)
                    const parsedDate = XLSX.SSF.parse_date_code(dateValue) as any;
                    date = new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d);
                } else if (typeof dateValue === 'string') {
                    // Format DD/MM/YYYY
                    const parts = dateValue.split('/');
                    if (parts.length === 3) {
                        const day = parseInt(parts[0], 10);
                        const month = parseInt(parts[1], 10) - 1; // Mois 0-indexé
                        const year = parseInt(parts[2], 10);
                        date = new Date(year, month, day);
                    } else {
                        // Essayer le parsing par défaut
                        date = new Date(dateValue);
                    }
                } else {
                    console.log(`⚠️  Ligne ${i + 1}: Format de date invalide, ignorée`);
                    skippedCount++;
                    continue;
                }

                // Vérifier que la date est valide
                if (isNaN(date.getTime())) {
                    console.log(`⚠️  Ligne ${i + 1}: Date invalide (${dateValue}), ignorée`);
                    skippedCount++;
                    continue;
                }

                // Vérifier si les données existent déjà
                const existing = await prisma.stockHistory.findUnique({
                    where: {
                        stock_ticker_date: {
                            stock_ticker: 'LNBB',
                            date: date
                        }
                    }
                });

                // Préparer les données
                const historyData = {
                    stock_ticker: 'LNBB',
                    date: date,
                    open: open,
                    high: high,
                    low: low,
                    close: close,
                    volume: volume,
                    stock: {
                        connect: { id: stock.id }
                    }
                };

                if (existing) {
                    console.log(`ℹ️  Ligne ${i + 1}: Donnée déjà existante pour ${date.toISOString().split('T')[0]}, ignorée`);
                    skippedCount++;
                } else {
                    // Ajouter la nouvelle donnée historique
                    await prisma.stockHistory.create({
                        data: historyData
                    });
                    addedCount++;

                    if (addedCount % 50 === 0) {
                        console.log(`✅ ${addedCount} nouvelles données ajoutées...`);
                    }
                }

            } catch (error) {
                errorCount++;
                console.error(`❌ Erreur ligne ${i + 1}:`, error instanceof Error ? error.message : error);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 RÉSUMÉ DE L\'IMPORT');
        console.log('='.repeat(60));
        console.log(`✅ Nouvelles données ajoutées: ${addedCount}`);
        console.log(`ℹ️  Données ignorées (déjà existantes): ${skippedCount}`);
        console.log(`❌ Erreurs: ${errorCount}`);
        console.log(`📈 Total lignes traitées: ${rawData.length}`);
        console.log('='.repeat(60) + '\n');

        // Vérifier le nombre total de données historiques pour LNBB
        const totalHistory = await prisma.stockHistory.count({
            where: { stock_ticker: 'LNBB' }
        });

        console.log(`📊 Total des données historiques LNBB dans la base: ${totalHistory}\n`);
        console.log('✅ Import terminé avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
importLNBBHistory()
    .then(() => {
        console.log('\n🎉 Script terminé !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Le script a échoué:', error);
        process.exit(1);
    });
