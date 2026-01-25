/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de CABC (SICABLE)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\cabc\cabc.txt
 * Date: 2026-01-15
 */

async function importCABCFundamentals() {
  console.log('🚀 Import des données fondamentales CABC (SICABLE)...\n');

  const ticker = 'CABC';

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
      market_cap: 14_208_000_000, // 14 208 MFCFA
      pe_ratio: 11.59, // PER 2024
      pb_ratio: null, // Non disponible
      dividend_yield: null, // Peut être calculé: (112.73 / 2400) * 100 ≈ 4.70%

      // Rentabilité
      roe: null, // Non disponible
      roa: null, // Non disponible
      profit_margin: null, // Peut être calculé: (1225 / 19125) * 100 ≈ 6.41%

      // Endettement
      debt_to_equity: null, // Non disponible

      // Résultats financiers (2024 - en millions de FCFA)
      revenue: 19_125_000_000, // 19 125 MFCFA
      net_income: 1_225_000_000, // 1 225 MFCFA (Résultat net)
      ebitda: null, // Non disponible
      free_cash_flow: null, // Non disponible

      // Actions
      shares_outstanding: 5_920_000, // Nombre de titres
      eps: 207.00, // BNPA 2024
      book_value: null, // Non disponible
      net_profit: 1_225_000_000, // Même que net_income

      // Année de référence
      year: 2024
    };

    // Informations de la compagnie
    const companyInfoData = {
      description: "Créée en 1976, la SICABLE est une entreprise ivoirienne, filiale du Groupe PRYSMIAN, elle est spécialisée dans la fabrication de câbles électriques. La société commercialise des câbles de basse, moyenne et haute tension pour l'utilisation dans l'industrie, la construction, l'infrastructure et les réseaux aériens. La SICABLE exporte vers les pays de la sous-région ouest africaine.",
      website: null,
      employees: null,
      founded_year: 1976,
      headquarters: "Rue du textile Zone Industrielle de Vridi CI 15 BP 35 Abidjan 15 Abidjan",
      ceo: "Frédéric Tailheuret", // Directeur Général
      industry: "Industriels" // Secteur
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
      { name: 'PRYSMIAN CABLES ET SYSTÈME FRANCE', percentage: 51.3 },
      { name: 'PUBLIC (BRVM)', percentage: 48.7 }
    ];

    // Supprimer les anciens actionnaires CABC
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
        revenue: 18_898_000_000,
        revenue_growth: null,
        net_income: 1_167_000_000,
        net_income_growth: null,
        eps: 197.07,
        pe_ratio: 12.18,
        dividend: 133.00
      },
      {
        year: 2021,
        revenue: 19_037_000_000,
        revenue_growth: 0.74,
        net_income: 40_000_000,
        net_income_growth: -96.57,
        eps: 6.77,
        pe_ratio: 354.51,
        dividend: 69.00
      },
      {
        year: 2022,
        revenue: 16_481_000_000,
        revenue_growth: -13.43,
        net_income: 1_075_000_000,
        net_income_growth: 2587.50,
        eps: 181.62,
        pe_ratio: 13.21,
        dividend: 69.00
      },
      {
        year: 2023,
        revenue: 17_753_000_000,
        revenue_growth: 7.72,
        net_income: 1_430_000_000,
        net_income_growth: 33.01,
        eps: 242.00,
        pe_ratio: 9.92,
        dividend: 79.58
      },
      {
        year: 2024,
        revenue: 19_125_000_000,
        revenue_growth: 7.73,
        net_income: 1_225_000_000,
        net_income_growth: -14.34,
        eps: 207.00,
        pe_ratio: 11.59,
        dividend: 112.73
      }
    ];

    // Supprimer les anciennes données annuelles CABC
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
    console.log('  - Onglet "Fondamentaux" de la page CABC');
    console.log('  - Onglet "Vue d\'ensemble" de la page CABC');
    console.log('  - Section "Actionnaires" de la page CABC');
    console.log('  - Section "Données financières annuelles" de la page CABC\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
importCABCFundamentals()
  .then(() => {
    console.log('🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Le script a échoué:', error);
    process.exit(1);
  });
