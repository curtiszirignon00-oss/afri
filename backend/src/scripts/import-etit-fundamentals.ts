/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de ETIT (Ecobank Transnational Incorporated)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\etit\etit.txt
 * Date: 2026-01-16
 */

async function importETITFundamentals() {
    console.log('🚀 Import des données fondamentales ETIT...\n');

    const ticker = 'ETIT';

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
            market_cap: 434_019_000_000, // 434 019 MFCFA
            pe_ratio: 1.45, // PER 2024
            pb_ratio: null, // Non disponible
            dividend_yield: null, // Pas de dividende en 2024

            // Rentabilité
            roe: null, // Non disponible
            roa: null, // Non disponible
            profit_margin: null, // Peut être calculé: (RN / PNB) * 100 = (299706/1268402) * 100 ≈ 23.6%

            // Endettement
            debt_to_equity: null, // Non disponible

            // Résultats financiers (2024 - en millions de FCFA)
            revenue: 1_268_402_000_000, // 1 268 402 MFCFA (Produit Net Bancaire)
            net_income: 299_706_000_000, // 299 706 MFCFA (Résultat net)
            ebitda: null, // Non applicable pour une banque
            free_cash_flow: null, // Non disponible

            // Actions
            shares_outstanding: 18_084_106_722, // Nombre de titres
            eps: 16.57, // BNPA 2024
            book_value: null, // Non disponible
            net_profit: 299_706_000_000, // Même que net_income

            // Année de référence
            year: 2024
        };

        // Informations de la compagnie
        const companyInfoData = {
            description: "Ecobank Transnational Incorporated (ETI) est une banque fondée au Togo en 1985 et présente dans 36 pays du continent. En fin 2017, le Groupe affichait un total bilan de 22,4 milliards USD et 2,2 milliards USD en capitaux propres. Ecobank Transnational Incorporated est côté sur les principales bourses de la sous-région : la Nigerian Stock Exchange (NSE) à Lagos, la Ghana Stock exchange (GSE) à Accra et la Bourse Régionale des Valeurs Mobilières (BRVM) à Abidjan.",
            website: "ir@ecobank.com", // Email fourni comme contact
            employees: null,
            founded_year: 1985,
            headquarters: "2365, Boulevard du Mono - BP : 3261 Lome, Togo",
            ceo: "Jeremy Awori", // Directeur Général du Groupe
            industry: "Holding Bancaire" // Secteur
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
            { name: 'BOSQUET INVESTMENTS LTD', percentage: 21.22 },
            { name: 'QATAR NATIONAL BANK', percentage: 20.10 },
            { name: 'ARISE BV', percentage: 14.10 },
            { name: 'PIC (GEPF)', percentage: 13.50 },
            { name: 'SSNIT', percentage: 3.90 },
            { name: 'PUBLIC & AUTRES', percentage: 27.18 } // Reste (100 - total des autres)
        ];

        // Supprimer les anciens actionnaires ETIT
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
                    is_public: shareholder.name === 'PUBLIC & AUTRES'
                }
            });
        }
        console.log(`  ✅ ${shareholders.length} actionnaires importés\n`);

        // 4. Créer les données financières annuelles (AnnualFinancials)
        console.log('📈 Import des données financières annuelles...');

        const annualFinancials = [
            {
                year: 2020,
                revenue: 966_891_000_000,
                revenue_growth: null,
                net_income: 50_837_000_000,
                net_income_growth: null,
                eps: 2.99,
                pe_ratio: 8.03,
                dividend: null // Marqué "-" dans le fichier
            },
            {
                year: 2021,
                revenue: 974_058_000_000,
                revenue_growth: 0.74,
                net_income: 198_151_000_000,
                net_income_growth: 289.78,
                eps: 10.72,
                pe_ratio: 2.24,
                dividend: 0.90
            },
            {
                year: 2022,
                revenue: 1_161_428_000_000,
                revenue_growth: 19.24,
                net_income: 228_750_000_000,
                net_income_growth: 15.44,
                eps: 12.65,
                pe_ratio: 1.90,
                dividend: 0.60
            },
            {
                year: 2023,
                revenue: 1_251_677_000_000,
                revenue_growth: 7.77,
                net_income: 246_811_000_000,
                net_income_growth: 7.90,
                eps: 13.65,
                pe_ratio: 1.76,
                dividend: null // Marqué "-" dans le fichier
            },
            {
                year: 2024,
                revenue: 1_268_402_000_000,
                revenue_growth: 1.34,
                net_income: 299_706_000_000,
                net_income_growth: 21.43,
                eps: 16.57,
                pe_ratio: 1.45,
                dividend: null // Marqué "-" dans le fichier
            }
        ];

        // Supprimer les anciennes données annuelles ETIT
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
        console.log('  - Onglet "Fondamentaux" de la page ETIT');
        console.log('  - Onglet "Vue d\'ensemble" de la page ETIT');
        console.log('  - Section "Actionnaires" de la page ETIT');
        console.log('  - Section "Données financières annuelles" de la page ETIT\n');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
importETITFundamentals()
    .then(() => {
        console.log('🎉 Script terminé !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Le script a échoué:', error);
        process.exit(1);
    });
