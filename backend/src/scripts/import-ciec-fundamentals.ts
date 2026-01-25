/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de CIEC (Compagnie Ivoirienne d'Électricité)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\ciec\ciec.txt
 * Date: 2026-01-04
 */

async function importCIECFundamentals() {
  console.log('🚀 Import des données fondamentales CIEC...\n');

  const ticker = 'CIEC';

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
      market_cap: 146_720_000_000, // 146 720 MFCFA
      pe_ratio: 14.56, // PER 2024
      pb_ratio: null, // Non disponible
      dividend_yield: null, // Peut être calculé: (Dividende / Prix) * 100

      // Rentabilité
      roe: null, // Non disponible
      roa: null, // Non disponible
      profit_margin: null, // Peut être calculé: (RN / CA) * 100 = (10101/263294) * 100 ≈ 3.8%

      // Endettement
      debt_to_equity: null, // Non disponible

      // Résultats financiers (2024 - en millions de FCFA)
      revenue: 263_294_000_000, // 263 294 MFCFA
      net_income: 10_101_000_000, // 10 101 MFCFA (Résultat net)
      ebitda: null, // Non disponible
      free_cash_flow: null, // Non disponible

      // Actions
      shares_outstanding: 56_000_000, // Nombre de titres
      eps: 180.00, // BNPA 2024
      book_value: null, // Non disponible
      net_profit: 10_101_000_000, // Même que net_income

      // Année de référence
      year: 2024
    };

    // Informations de la compagnie
    const companyInfoData = {
      description: "Créé le 24 août 1990 par le groupe français BOUYGUES et la société d'électricité EDF, CIE est une société privée ivoirienne de monopole qui détient une concession de service public pour la production, le transport, l'exportation, l'importation, la distribution et la commercialisation d'électricité. Après deux périodes de quinze années chacune de collaboration (allant de 1990 à 2005 et de 2005 à 2020), l'état de Côte d'Ivoire et la CIE ont renouvelé leur partenariat pour une période 12 ans, soit de 2020 à 2032. La compagnie exporte de l'électricité vers le Bénin, le Burkina Faso, le Ghana, le Togo, le Mali et bientôt la Guinée.",
      website: null,
      employees: null,
      founded_year: 1990, // Créé le 24 août 1990
      headquarters: "COMPAGNIE IVOIRIENNE D'ELECTRICITE 1, Avenue Christiani Treichville 01 BP 6923 Abidjan 01 ABIDJAN",
      ceo: "Jean-Christian Turkson", // Directeur Général
      industry: "Services aux collectivités" // Électricité
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
      { name: 'ERANOVE', percentage: 47.00 },
      { name: 'DIVERS ACTIONNAIRES PRIVES (BOURSE)', percentage: 21.00 },
      { name: 'ETAT DE COTE D\'IVOIRE', percentage: 15.00 },
      { name: 'IPS-CNPS', percentage: 7.00 },
      { name: 'FCP - CIE', percentage: 5.00 },
      { name: 'SIDIP', percentage: 3.00 },
      { name: 'MAISON DES ACTIONNAIRES', percentage: 1.00 },
      { name: 'FCP - SODECI', percentage: 1.00 }
    ];

    // Supprimer les anciens actionnaires CIEC
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
        revenue: 722_628_000_000,
        revenue_growth: null,
        net_income: 16_170_000_000,
        net_income_growth: null,
        eps: 288.75,
        pe_ratio: 9.07,
        dividend: 167.14
      },
      {
        year: 2021,
        revenue: 231_783_000_000,
        revenue_growth: -67.92,
        net_income: 9_757_000_000,
        net_income_growth: -39.66,
        eps: 174.23,
        pe_ratio: 15.04,
        dividend: 153.16
      },
      {
        year: 2022,
        revenue: 238_854_000_000,
        revenue_growth: 3.05,
        net_income: 9_819_000_000,
        net_income_growth: 0.64,
        eps: 175.34,
        pe_ratio: 14.94,
        dividend: 157.50
      },
      {
        year: 2023,
        revenue: 257_218_000_000,
        revenue_growth: 7.69,
        net_income: 10_633_000_000,
        net_income_growth: 8.29,
        eps: 190.00,
        pe_ratio: 13.79,
        dividend: 171.00
      },
      {
        year: 2024,
        revenue: 263_294_000_000,
        revenue_growth: 2.36,
        net_income: 10_101_000_000,
        net_income_growth: -5.00,
        eps: 180.00,
        pe_ratio: 14.56,
        dividend: 158.40
      }
    ];

    // Supprimer les anciennes données annuelles CIEC
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
    console.log('\n⚠️  Note: Chute importante du CA en 2021 (-67.92%)');
    console.log('\n💡 Ces données apparaîtront dans:');
    console.log('  - Onglet "Fondamentaux" de la page CIEC');
    console.log('  - Onglet "Vue d\'ensemble" de la page CIEC');
    console.log('  - Section "Actionnaires" de la page CIEC');
    console.log('  - Section "Données financières annuelles" de la page CIEC\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
importCIECFundamentals()
  .then(() => {
    console.log('🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Le script a échoué:', error);
    process.exit(1);
  });
