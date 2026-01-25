/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de BOABF (BOA Burkina Faso)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\Boabf\boabf.txt
 * Date: 2026-01-03
 */

async function importBOABFFundamentals() {
  console.log('🚀 Import des données fondamentales BOABF...\n');

  const ticker = 'BOABF';

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
      market_cap: 161_920_000_000, // 161 920 MFCFA
      pe_ratio: 7.22, // PER 2024
      pb_ratio: null, // Non disponible
      dividend_yield: null, // Peut être calculé: (Dividende / Prix) * 100

      // Rentabilité
      roe: null, // Non disponible
      roa: null, // Non disponible
      profit_margin: null, // Peut être calculé: (RN / PNB) * 100 = (22419/57490) * 100 ≈ 39%

      // Endettement
      debt_to_equity: null, // Non disponible

      // Résultats financiers (2024 - en millions de FCFA)
      revenue: 57_490_000_000, // 57 490 MFCFA (Produit Net Bancaire)
      net_income: 22_419_000_000, // 22 419 MFCFA (Résultat net)
      ebitda: null, // Non applicable pour une banque
      free_cash_flow: null, // Non disponible

      // Actions
      shares_outstanding: 44_000_000, // Nombre de titres
      eps: 510.00, // BNPA 2024
      book_value: null, // Non disponible
      net_profit: 22_419_000_000, // Même que net_income

      // Année de référence
      year: 2024
    };

    // Informations de la compagnie
    const companyInfoData = {
      description: "BOA BURKINA est une filiale du groupe BOA. Elle a été mis en place en 1998 (après les filiales du Mali, du Bénin, du Niger et de la Côte d'Ivoire). BOA BURKINA est l'un des grands acteurs du pays. En tant que banque commerciale, elle est profondément impliquée dans le financement de l'économie burkinabé. Malgré une forte intensité concurrentielle dans le secteur bancaire, BOA BF s'impose comme l'un des acteurs majeurs de la place bancaire burkinabé avec un total bilan de 757 milliards de FCFA. Au 31 décembre 2017, la Banque présentait un total dépôt de la clientèle de près de 524 milliards de F CFA, plus de 366 197 comptes, répartis sur un réseau de 50 agences.",
      website: null,
      employees: null,
      founded_year: 1998,
      headquarters: "770, Avenue du Président Aboubakar Sangoulé Lamizana 01 BP 1319 Ouagad Ouagadougou",
      ceo: "Faustin AMOUSSOU", // Directeur Général
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
      { name: 'BOA WEST AFRICA', percentage: 56.48 },
      { name: 'DIVERS ACTIONNAIRES PRIVES (BOURSE)', percentage: 25.92 },
      { name: 'LASSINE DIAWARA', percentage: 9.21 },
      { name: 'UNION DES ASSURANCES DU BURKINA-VIE', percentage: 8.39 }
    ];

    // Supprimer les anciens actionnaires BOABF
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
          is_public: shareholder.name.includes('BOURSE')
        }
      });
    }
    console.log(`  ✅ ${shareholders.length} actionnaires importés\n`);

    // 4. Créer les données financières annuelles (AnnualFinancials)
    console.log('📈 Import des données financières annuelles...');

    const annualFinancials = [
      {
        year: 2020,
        revenue: 47_367_000_000, // Produit Net Bancaire
        revenue_growth: null,
        net_income: 17_608_000_000,
        net_income_growth: null,
        eps: 400.18,
        pe_ratio: 9.20,
        dividend: 185.00
      },
      {
        year: 2021,
        revenue: 50_828_000_000,
        revenue_growth: 7.31,
        net_income: 21_245_000_000,
        net_income_growth: 20.66,
        eps: 482.83,
        pe_ratio: 7.62,
        dividend: 185.00
      },
      {
        year: 2022,
        revenue: 56_646_000_000,
        revenue_growth: 11.45,
        net_income: 25_477_000_000,
        net_income_growth: 19.92,
        eps: 579.02,
        pe_ratio: 6.36,
        dividend: 224.00
      },
      {
        year: 2023,
        revenue: 60_576_000_000,
        revenue_growth: 6.94,
        net_income: 29_063_000_000,
        net_income_growth: 14.08,
        eps: 660.52,
        pe_ratio: 5.57,
        dividend: 352.00
      },
      {
        year: 2024,
        revenue: 57_490_000_000,
        revenue_growth: -5.09,
        net_income: 22_419_000_000,
        net_income_growth: -22.86,
        eps: 510.00,
        pe_ratio: 7.22,
        dividend: 428.00
      }
    ];

    // Supprimer les anciennes données annuelles BOABF
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
    console.log('  - Onglet "Fondamentaux" de la page BOABF');
    console.log('  - Onglet "Vue d\'ensemble" de la page BOABF');
    console.log('  - Section "Actionnaires" de la page BOABF');
    console.log('  - Section "Données financières annuelles" de la page BOABF\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
importBOABFFundamentals()
  .then(() => {
    console.log('🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Le script a échoué:', error);
    process.exit(1);
  });
