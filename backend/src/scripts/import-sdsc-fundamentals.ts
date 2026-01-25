/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de SDSC (Mediterranean Shipping Company CI)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\sdsc\sdsc.txt
 * Date: 2026-01-15
 */

async function importSDSCFundamentals() {
    console.log('🚀 Import des données fondamentales SDSC...\n');

    const ticker = 'SDSC';

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
        const fundamentalsData = {
            // Valorisation
            market_cap: 80_292_000_000, // 80 292 MFCFA
            pe_ratio: 3.81, // PER 2024
            pb_ratio: null, // Non disponible
            dividend_yield: null, // Peut être calculé: (92 / prix) * 100

            // Rentabilité
            roe: null, // Non disponible
            roa: null, // Non disponible
            profit_margin: null, // Peut être calculé: (RN / CA) * 100 = (21069/85643) * 100 ≈ 24.6%

            // Endettement
            debt_to_equity: null, // Non disponible

            // Résultats financiers (2024 - en millions de FCFA)
            revenue: 85_643_000_000, // 85 643 MFCFA
            net_income: 21_069_000_000, // 21 069 MFCFA (Résultat net)
            ebitda: null, // Non disponible
            free_cash_flow: null, // Non disponible

            // Actions
            shares_outstanding: 54_435_300, // Nombre de titres
            eps: 387.00, // BNPA 2024
            book_value: null, // Non disponible
            net_profit: 21_069_000_000, // Même que net_income

            // Année de référence
            year: 2024
        };

        // Informations de la compagnie
        const companyInfoData = {
            description: "MEDITERRANEAN SHIPPING COMPANY CI (MSC CI) est l'un des principaux acteurs du secteur du transport, de la manutention et de la logistique. La société est connue pour ses offres multisectorielles et multi-entreprises. Sa mission est de contrôler l'ensemble de la chaîne d'approvisionnement, ce qui permet à l'entreprise de fournir à ses clients un service complet: expédition de fret, manutention (levage et terrain), distribution (groupage et express) et logistique contractuelle.",
            website: null,
            employees: null,
            founded_year: null,
            headquarters: "BOLLORE AFRICA LOGISTICS COTE D'IVOIRE Avenue Christiani, Abidjan ABIDJAN",
            ceo: "Asta-Rosa CISSE", // Directeur Général
            industry: "Transport et Logistique" // Secteur
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
            { name: 'MSC', percentage: 79.92 },
            { name: 'PUBLIC (BRVM)', percentage: 20.08 }
        ];

        // Supprimer les anciens actionnaires SDSC
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
                    is_public: shareholder.name === 'PUBLIC (BRVM)'
                }
            });
        }
        console.log(`  ✅ ${shareholders.length} actionnaires importés\n`);

        // 4. Créer les données financières annuelles (AnnualFinancials)
        console.log('📈 Import des données financières annuelles...');

        const annualFinancials = [
            {
                year: 2020,
                revenue: 84_241_000_000,
                revenue_growth: null,
                net_income: 13_455_000_000,
                net_income_growth: null,
                eps: 247.00,
                pe_ratio: 5.97,
                dividend: 90.00
            },
            {
                year: 2021,
                revenue: 88_721_000_000,
                revenue_growth: 5.32,
                net_income: 13_942_000_000,
                net_income_growth: 3.62,
                eps: 256.13,
                pe_ratio: 5.76,
                dividend: 130.00
            },
            {
                year: 2022,
                revenue: 86_997_000_000,
                revenue_growth: -1.94,
                net_income: 10_044_000_000,
                net_income_growth: -27.96,
                eps: 184.51,
                pe_ratio: 7.99,
                dividend: 82.80
            },
            {
                year: 2023,
                revenue: 82_623_000_000,
                revenue_growth: -5.03,
                net_income: 17_138_000_000,
                net_income_growth: 70.63,
                eps: 315.00,
                pe_ratio: 4.68,
                dividend: 92.00
            },
            {
                year: 2024,
                revenue: 85_643_000_000,
                revenue_growth: 3.66,
                net_income: 21_069_000_000,
                net_income_growth: 22.94,
                eps: 387.00,
                pe_ratio: 3.81,
                dividend: 92.00
            }
        ];

        // Supprimer les anciennes données annuelles SDSC
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
        console.log('  - Onglet "Fondamentaux" de la page SDSC');
        console.log('  - Onglet "Vue d\'ensemble" de la page SDSC');
        console.log('  - Section "Actionnaires" de la page SDSC');
        console.log('  - Section "Données financières annuelles" de la page SDSC\n');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
importSDSCFundamentals()
    .then(() => {
        console.log('🎉 Script terminé !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Le script a échoué:', error);
        process.exit(1);
    });
