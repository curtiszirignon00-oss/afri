/// <reference types="node" />
import * as XLSX from 'xlsx';
import prisma from '../config/prisma';
import path from 'path';

interface ABJCRow {
    Date?: string | number;
    date?: string | number;
    DATE?: string | number;
    fermeture?: number | string;
    Fermeture?: number | string;
    '+Bas'?: number | string;
    '+Haut'?: number | string;
    Ouverture?: number | string;
    ouverture?: number | string;
    Volume?: number | string;
    volume?: number | string;
    Variation?: number | string;
    variation?: number | string;
    [key: string]: any;
}

async function importABJCHistory() {
    try {
        console.log('🚀 Démarrage de l\'import des données historiques ABJC (v2)...\n');

        // Chemin vers le fichier Excel
        const excelPath = path.join('C:', 'Users', 'HP', 'OneDrive', 'Desktop', 'actions brvm', 'abjc', 'abjc.xlsx');

        console.log(`📂 Lecture du fichier: ${excelPath}`);

        // Lire le fichier Excel
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convertir en JSON
        const rawData: ABJCRow[] = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 Nombre de lignes trouvées: ${rawData.length}\n`);

        if (rawData.length === 0) {
            console.log('⚠️  Aucune donnée trouvée dans le fichier Excel');
            return;
        }

        // Afficher un aperçu de la première ligne pour debug
        console.log('🔍 Aperçu de la première ligne:');
        console.log(JSON.stringify(rawData[0], null, 2));
        console.log('\n📋 Colonnes disponibles:', Object.keys(rawData[0]));
        console.log('\n');

        // Vérifier si ABJC existe dans la base de données
        let stock = await prisma.stock.findUnique({
            where: { symbol: 'ABJC' }
        });

        // Si ABJC n'existe pas, le créer
        if (!stock) {
            console.log('📝 ABJC non trouvé dans la base de données, création...');
            stock = await prisma.stock.create({
                data: {
                    symbol: 'ABJC',
                    company_name: 'SERVAIR ABIDJAN CI',
                    sector: 'Consommation Discrétionnaire',
                    current_price: 0,
                    daily_change_percent: 0,
                    volume: 0,
                    market_cap: 0
                }
            });
            console.log('✅ ABJC créé avec succès\n');
        } else {
            console.log('✅ ABJC trouvé dans la base de données\n');
        }

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        console.log('🔄 Import des données historiques en cours...\n');

        // Fonction pour nettoyer les nombres (enlever les espaces, virgules, etc.)
        const cleanNumber = (value: any): number => {
            if (value === null || value === undefined || value === '' || value === '-') {
                return 0;
            }
            if (typeof value === 'string') {
                // Enlever les espaces, remplacer virgule par point
                let cleaned = value.replace(/\s/g, '').replace(',', '.');
                // Enlever le symbole % si présent
                cleaned = cleaned.replace('%', '');
                const num = Number(cleaned);
                return isNaN(num) ? 0 : num;
            }
            const num = Number(value);
            return isNaN(num) ? 0 : num;
        };

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];

            try {
                // Extraire les données avec les nouvelles colonnes
                const dateValue = row.Date || row.date || row.DATE;

                // Nouvelles colonnes
                let closeValue = row.fermeture || row.Fermeture || row.close || row.Close;
                let lowValue = row['+Bas'] || row['Plus Bas'] || row.low || row.Low;
                let highValue = row['+Haut'] || row['Plus Haut'] || row.high || row.High;
                let openValue = row.Ouverture || row.ouverture || row.open || row.Open;
                let volumeValue = row.Volume || row.volume;
                let variationValue = row.Variation || row.variation;

                // Nettoyer tous les nombres
                openValue = cleanNumber(openValue);
                highValue = cleanNumber(highValue);
                lowValue = cleanNumber(lowValue);
                closeValue = cleanNumber(closeValue);
                volumeValue = cleanNumber(volumeValue);

                if (!dateValue) {
                    console.log(`⚠️  Ligne ${i + 1}: Date manquante, ignorée`);
                    skippedCount++;
                    continue;
                }

                // Convertir la date Excel en Date JavaScript
                let date: Date;
                if (typeof dateValue === 'number') {
                    // Si c'est un nombre Excel (jours depuis 1900-01-01)
                    const parsedDate = XLSX.SSF.parse_date_code(dateValue) as any;
                    date = new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d);
                } else if (typeof dateValue === 'string') {
                    // Si c'est déjà une chaîne de caractères
                    // Gérer différents formats de date
                    if (dateValue.includes('/')) {
                        // Format DD/MM/YYYY ou MM/DD/YYYY
                        const parts = dateValue.split('/');
                        if (parts.length === 3) {
                            // Supposons DD/MM/YYYY
                            const day = parseInt(parts[0], 10);
                            const month = parseInt(parts[1], 10) - 1;
                            const year = parseInt(parts[2], 10);
                            date = new Date(year, month, day);
                        } else {
                            date = new Date(dateValue);
                        }
                    } else {
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
                            stock_ticker: 'ABJC',
                            date: date
                        }
                    }
                });

                // Préparer les données
                const historyData = {
                    stock_ticker: 'ABJC',
                    date: date,
                    open: openValue,
                    high: highValue,
                    low: lowValue,
                    close: closeValue,
                    volume: volumeValue,
                    stock: {
                        connect: { id: stock.id }
                    }
                };

                if (existing) {
                    // Mettre à jour si les valeurs sont différentes
                    if (existing.open !== openValue || existing.high !== highValue ||
                        existing.low !== lowValue || existing.close !== closeValue ||
                        existing.volume !== volumeValue) {
                        await prisma.stockHistory.update({
                            where: {
                                stock_ticker_date: {
                                    stock_ticker: 'ABJC',
                                    date: date
                                }
                            },
                            data: {
                                open: openValue,
                                high: highValue,
                                low: lowValue,
                                close: closeValue,
                                volume: volumeValue
                            }
                        });
                        updatedCount++;
                        if (updatedCount % 50 === 0) {
                            console.log(`🔄 ${updatedCount} données mises à jour...`);
                        }
                    } else {
                        skippedCount++;
                    }
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
        console.log(`🔄 Données mises à jour: ${updatedCount}`);
        console.log(`ℹ️  Données ignorées (identiques): ${skippedCount}`);
        console.log(`❌ Erreurs: ${errorCount}`);
        console.log(`📈 Total lignes traitées: ${rawData.length}`);
        console.log('='.repeat(60) + '\n');

        // Vérifier le nombre total de données historiques pour ABJC
        const totalHistory = await prisma.stockHistory.count({
            where: { stock_ticker: 'ABJC' }
        });

        console.log(`📊 Total des données historiques ABJC dans la base: ${totalHistory}\n`);
        console.log('✅ Import terminé avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
importABJCHistory()
    .then(() => {
        console.log('\n🎉 Script terminé !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Le script a échoué:', error);
        process.exit(1);
    });
