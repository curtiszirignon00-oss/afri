/// <reference types="node" />
import * as XLSX from 'xlsx';
import prisma from '../config/prisma';
import path from 'path';

interface SDSCRow {
    Date?: string | number;
    date?: string | number;
    DATE?: string | number;
    Open?: number;
    open?: number;
    OPEN?: number;
    Ouverture?: number;
    High?: number;
    high?: number;
    HIGH?: number;
    'Plus haut'?: number;
    Low?: number;
    low?: number;
    LOW?: number;
    'Plus bas'?: number;
    Close?: number;
    close?: number;
    CLOSE?: number;
    'Clôture'?: number;
    Cloture?: number;
    Volume?: number | string;
    volume?: number | string;
    VOLUME?: number | string;
    'Volume Titres'?: number | string;
    [key: string]: any;
}

async function importSDSCHistory() {
    try {
        console.log('🚀 Démarrage de l\'import des données historiques SDSC...\n');

        // Chemin vers le fichier Excel
        const excelPath = path.join('C:', 'Users', 'HP', 'OneDrive', 'Desktop', 'actions brvm', 'sdsc', 'sdsc.xlsx');

        console.log(`📂 Lecture du fichier: ${excelPath}`);

        // Lire le fichier Excel
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convertir en JSON
        const rawData: SDSCRow[] = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 Nombre de lignes trouvées: ${rawData.length}\n`);

        if (rawData.length === 0) {
            console.log('⚠️  Aucune donnée trouvée dans le fichier Excel');
            return;
        }

        // Afficher un aperçu de la première ligne pour debug
        console.log('🔍 Aperçu de la première ligne:');
        console.log(JSON.stringify(rawData[0], null, 2));
        console.log('\n');

        // Vérifier si SDSC existe dans la base de données
        let stock = await prisma.stock.findUnique({
            where: { symbol: 'SDSC' }
        });

        // Si SDSC n'existe pas, le créer
        if (!stock) {
            console.log('📝 SDSC non trouvé dans la base de données, création...');
            stock = await prisma.stock.create({
                data: {
                    symbol: 'SDSC',
                    company_name: 'AFRICA GLOBAL LOGISTICS',
                    sector: 'Industriels',
                    current_price: 0,
                    daily_change_percent: 0,
                    volume: 0,
                    market_cap: 0
                }
            });
            console.log('✅ SDSC créé avec succès\n');
        } else {
            console.log('✅ SDSC trouvé dans la base de données\n');
        }

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        console.log('🔄 Import des données historiques en cours...\n');

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];

            try {
                // Extraire les données avec gestion des différentes casses et colonnes françaises
                const dateValue = row.Date || row.date || row.DATE;
                let openValue = row.Open || row.open || row.OPEN || row.Ouverture;
                let highValue = row.High || row.high || row.HIGH || row['Plus haut'];
                let lowValue = row.Low || row.low || row.LOW || row['Plus bas'];
                let closeValue = row.Close || row.close || row.CLOSE || row['Clôture'] || row.Cloture;
                let volumeValue = row.Volume || row.volume || row.VOLUME || row['Volume Titres'];

                // Fonction pour nettoyer les nombres (enlever les espaces)
                const cleanNumber = (value: any): number => {
                    if (value === null || value === undefined || value === '') {
                        return 0;
                    }
                    if (typeof value === 'string') {
                        const cleaned = value.replace(/\s/g, '');
                        const num = Number(cleaned);
                        return isNaN(num) ? 0 : num;
                    }
                    const num = Number(value);
                    return isNaN(num) ? 0 : num;
                };

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
                    date = new Date(dateValue);
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
                            stock_ticker: 'SDSC',
                            date: date
                        }
                    }
                });

                // Préparer les données
                const historyData = {
                    stock_ticker: 'SDSC',
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
                    // Ne mettre à jour QUE si les données Excel sont plus récentes ou différentes
                    // Mais en général, on ne touche pas aux données existantes
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

        // Vérifier le nombre total de données historiques pour SDSC
        const totalHistory = await prisma.stockHistory.count({
            where: { stock_ticker: 'SDSC' }
        });

        console.log(`📊 Total des données historiques SDSC dans la base: ${totalHistory}\n`);
        console.log('✅ Import terminé avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
importSDSCHistory()
    .then(() => {
        console.log('\n🎉 Script terminé !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Le script a échoué:', error);
        process.exit(1);
    });
