/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de BICB (BIIC Bénin)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\bicb\bicb.txt
 * Date: 2026-01-16
 */

async function importBICBFundamentals() {
    console.log('🚀 Import des données fondamentales BICB...\n');

    const ticker = 'BICB';

    try {
        // Vérifier que l'action existe
        const stock = await prisma.stock.findUnique({
            where: { symbol: ticker }
        });

        if (!stock) {
            console.log(`⚠️  Action ${ticker} non trouvée dans la base de données`);
            return;
        }

        console.log(`✅ Action trouvée: ${stock.company_name}\n`);

        // Données financières basées sur 2024 (dernière année disponible)
        // Note: Pour les banques, on utilise le Produit Net Bancaire (PNB) comme "revenue"
        const fundamentalsData = {
            // Valorisation
            market_cap: 288_799_000_000, // 288 799 MFCFA
            pe_ratio: 9.52, // PER 2024
            pb_ratio: null, // Non disponible
            dividend_yield: null, // Peut être calculé: (Dividende / Prix) * 100

            // Rentabilité
            roe: null, // Non disponible
            roa: null, // Non disponible
            profit_margin: null, // Peut être calculé: (RN / PNB) * 100 = (30341/45207) * 100 ≈ 67%

            // Endettement
            debt_to_equity: null, // Non disponible

            // Résultats financiers (2024 - en millions de FCFA)
            revenue: 45_207_000_000, // 45 207 MFCFA (Produit Net Bancaire)
            net_income: 30_341_000_000, // 30 341 MFCFA (Résultat net)
            ebitda: null, // Non applicable pour une banque
            free_cash_flow: null, // Non disponible

            // Actions
            shares_outstanding: 57_759_800, // Nombre de titres
            eps: 525.29, // BNPA 2024
            book_value: null, // Non disponible
            net_profit: 30_341_000_000, // Même que net_income

            // Année de référence
            year: 2024
        };

        // Informations de la compagnie
        const companyInfoData = {
            description: "Issue de la fusion réussie, en 2020, entre la Banque Africaine de l'Industrie et du Commerce (BAIC) et la Banque Internationale du Bénin pour l'Économie (BIBE), la Banque Internationale pour l'Industrie et le Commerce (BIIC) s'est rapidement imposée comme l'un des acteurs majeurs du secteur bancaire au Bénin. Dotée d'un capital de 82,514 milliards de FCFA, la BIIC se distingue par sa solidité, son esprit d'innovation et sa volonté affirmée d'accompagner les ambitions de ses clients tout en contribuant activement au développement de l'économie nationale.",
            website: null,
            employees: null,
            founded_year: 2020, // Année de fusion
            headquarters: "Boulevard St Michel, Cotonou (Bénin), Littoral Département 01 BP 7744 Cotonou",
            ceo: "Arsène M. DANSOU", // Directeur Général
            industry: "Finance" // Secteur bancaire
        };

        // 1. Importer/Mettre à jour les fondamentaux
        console.log('📊 Import des données fondamentales...');
        const existingFundamentals = await prisma.stockFundamental.findUnique({
            where: { stock_ticker: ticker }
        });

        if (existingFundamentals) {
            await prisma.stockFundamental.update({
                where: { stock_ticker: ticker },
                data: fundamentalsData
            });
            console.log('  ✅ Fondamentaux mis à jour\n');
        } else {
            await prisma.stockFundamental.create({
                data: {
                    stockId: stock.id,
                    stock_ticker: ticker,
                    ...fundamentalsData
                }
            });
            console.log('  ✅ Fondamentaux créés\n');
        }

        // 2. Importer/Mettre à jour les infos compagnie
        console.log('🏢 Import des informations de la compagnie...');
        const existingCompanyInfo = await prisma.companyInfo.findUnique({
            where: { stock_ticker: ticker }
        });

        if (existingCompanyInfo) {
            await prisma.companyInfo.update({
                where: { stock_ticker: ticker },
                data: companyInfoData
            });
            console.log('  ✅ Informations compagnie mises à jour\n');
        } else {
            await prisma.companyInfo.create({
                data: {
                    stock_ticker: ticker,
                    ...companyInfoData
                }
            });
            console.log('  ✅ Informations compagnie créées\n');
        }

        // 3. Créer les données d'actionnaires (Shareholders)
        console.log('👥 Import des actionnaires...');

        const shareholders = [
            { name: 'GRAND PUBLIC', percentage: 33.00 },
            { name: 'CAISSE DES DEPOTS ET CONSIGNATIONS DU BENIN', percentage: 32.00 },
            { name: 'ETAT DU BENIN', percentage: 18.26 },
            { name: 'PORT AUTONOME DE COTONOU', percentage: 3.40 }
        ];

        // Supprimer les anciens actionnaires BICB
        await prisma.shareholder.deleteMany({
            where: { stock_ticker: ticker }
        });

        // Créer les nouveaux
        for (const shareholder of shareholders) {
            await prisma.shareholder.create({
                data: {
                    stock_ticker: ticker,
                    name: shareholder.name,
                    percentage: shareholder.percentage,
                    is_public: shareholder.name === 'GRAND PUBLIC'
                }
            });
        }
        console.log(`  ✅ ${shareholders.length} actionnaires importés\n`);

        // 4. Créer les données financières annuelles (AnnualFinancials)
        console.log('📈 Import des données financières annuelles...');

        const annualFinancials = [
            {
                year: 2021,
                revenue: 14_898_000_000, // Produit Net Bancaire
                revenue_growth: null,
                net_income: 5_776_000_000,
                net_income_growth: null,
                eps: 100.00,
                pe_ratio: 50.00,
                dividend: null // Marqué "-" dans le fichier
            },
            {
                year: 2022,
                revenue: 24_209_000_000,
                revenue_growth: 62.50,
                net_income: 10_705_000_000,
                net_income_growth: 85.34,
                eps: 185.00,
                pe_ratio: 27.03,
                dividend: null // Marqué "-" dans le fichier
            },
            {
                year: 2023,
                revenue: 39_196_000_000,
                revenue_growth: 61.91,
                net_income: 27_270_000_000,
                net_income_growth: 154.74,
                eps: 472.00,
                pe_ratio: 10.59,
                dividend: null // Marqué "-" dans le fichier
            },
            {
                year: 2024,
                revenue: 45_207_000_000,
                revenue_growth: 15.34,
                net_income: 30_341_000_000,
                net_income_growth: 11.26,
                eps: 525.29,
                pe_ratio: 9.52,
                dividend: 254.50
            }
        ];

        // Supprimer les anciennes données annuelles BICB
        await prisma.annualFinancials.deleteMany({
            where: { stock_ticker: ticker }
        });

        // Créer les nouvelles
        for (const yearData of annualFinancials) {
            await prisma.annualFinancials.create({
                data: {
                    stock_ticker: ticker,
                    stockId: stock.id,
                    year: yearData.year,
                    revenue: yearData.revenue,
                    revenue_growth: yearData.revenue_growth,
                    net_income: yearData.net_income,
                    net_income_growth: yearData.net_income_growth,
                    eps: yearData.eps,
                    pe_ratio: yearData.pe_ratio,
                    dividend: yearData.dividend
                }
            });
        }
        console.log(`  ✅ ${annualFinancials.length} années de données financières importées\n`);

        console.log('='.repeat(60));
        console.log('✅ Import terminé avec succès !');
        console.log('='.repeat(60));
        console.log('\n📊 Résumé:');
        console.log('  ✅ Données fondamentales (StockFundamental)');
        console.log('  ✅ Informations compagnie (CompanyInfo)');
        console.log(`  ✅ ${shareholders.length} actionnaires (Shareholder)`);
        console.log(`  ✅ ${annualFinancials.length} années de données financières (AnnualFinancials)`);
        console.log('\n💡 Ces données apparaîtront dans:');
        console.log('  - Onglet "Fondamentaux" de la page BICB');
        console.log('  - Onglet "Vue d\'ensemble" de la page BICB');
        console.log('  - Section "Actionnaires" de la page BICB');
        console.log('  - Section "Données financières annuelles" de la page BICB\n');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
importBICBFundamentals()
    .then(() => {
        console.log('🎉 Script terminé !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Le script a échoué:', error);
        process.exit(1);
    });
