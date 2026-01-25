/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de NTLC (Nestlé Côte d'Ivoire)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\ntlc\ntlc.txt
 * Date: 2026-01-03
 */

async function importNTLCFundamentals() {
  console.log('🚀 Import des données fondamentales NTLC...\n');

  const ticker = 'NTLC';

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
      market_cap: 254_472_000_000, // 254 472 MFCFA
      pe_ratio: 14.03, // PER 2024
      pb_ratio: null, // Non disponible
      dividend_yield: null, // Peut être calculé: (Dividende / Prix) * 100

      // Rentabilité
      roe: null, // Non disponible
      roa: null, // Non disponible
      profit_margin: null, // Peut être calculé: (RN / CA) * 100 = (18150/220113) * 100 ≈ 8.2%

      // Endettement
      debt_to_equity: null, // Non disponible

      // Résultats financiers (2024 - en millions de FCFA)
      revenue: 220_113_000_000, // 220 113 MFCFA
      net_income: 18_150_000_000, // 18 150 MFCFA (Résultat net)
      ebitda: null, // Non disponible
      free_cash_flow: null, // Non disponible

      // Actions
      shares_outstanding: 22_070_400, // Nombre de titres
      eps: 822.00, // BNPA 2024
      book_value: null, // Non disponible
      net_profit: 18_150_000_000, // Même que net_income

      // Année de référence
      year: 2024
    };

    // Informations de la compagnie
    const companyInfoData = {
      description: "En Côte d'Ivoire, NESTLÉ est le leader dans la fabrication de produits de café, du thé, la production de soupes déshydratées, les assaisonnements et la distribution de produits laitiers pour enfants. La société dispose de deux grandes usines et d'un centre de recherche & développement à Abidjan.",
      website: null,
      employees: null,
      founded_year: null, // Non spécifié
      headquarters: "Rue des Chevaliers de Clieu - Zone 4 C Marcory 01 BP 1840 Abidjan 01 Abidjan",
      ceo: "Mohamad ITANI", // Directeur Général
      industry: "Consommation de Base" // Agroalimentaire
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
      { name: 'NESTLE SA', percentage: 73.92 },
      { name: 'PUBLIC (BRVM)', percentage: 19.14 },
      { name: 'ENTREPRISE MAGGI SA', percentage: 6.94 }
    ];

    // Supprimer les anciens actionnaires NTLC
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
          is_public: shareholder.name.includes('BRVM')
        }
      });
    }
    console.log(`  ✅ ${shareholders.length} actionnaires importés\n`);

    // 4. Créer les données financières annuelles (AnnualFinancials)
    console.log('📈 Import des données financières annuelles...');

    const annualFinancials = [
      {
        year: 2020,
        revenue: 173_225_000_000,
        revenue_growth: null,
        net_income: 20_900_000_000,
        net_income_growth: null,
        eps: 946.95,
        pe_ratio: 12.18,
        dividend: 363.66
      },
      {
        year: 2021,
        revenue: 195_188_000_000,
        revenue_growth: 12.68,
        net_income: 21_268_000_000,
        net_income_growth: 1.76,
        eps: 963.65,
        pe_ratio: 11.96,
        dividend: 856.80
      },
      {
        year: 2022,
        revenue: 206_734_000_000,
        revenue_growth: 5.92,
        net_income: 16_627_000_000,
        net_income_growth: -21.82,
        eps: 753.36,
        pe_ratio: 15.30,
        dividend: 728.00
      },
      {
        year: 2023,
        revenue: 203_618_000_000,
        revenue_growth: -1.51,
        net_income: 16_557_000_000,
        net_income_growth: -0.42,
        eps: 750.00,
        pe_ratio: 15.37,
        dividend: 675.00
      },
      {
        year: 2024,
        revenue: 220_113_000_000,
        revenue_growth: 8.10,
        net_income: 18_150_000_000,
        net_income_growth: 9.62,
        eps: 822.00,
        pe_ratio: 14.03,
        dividend: 722.00
      }
    ];

    // Supprimer les anciennes données annuelles NTLC
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
    console.log('  - Onglet "Fondamentaux" de la page NTLC');
    console.log('  - Onglet "Vue d\'ensemble" de la page NTLC');
    console.log('  - Section "Actionnaires" de la page NTLC');
    console.log('  - Section "Données financières annuelles" de la page NTLC\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
importNTLCFundamentals()
  .then(() => {
    console.log('🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Le script a échoué:', error);
    process.exit(1);
  });
