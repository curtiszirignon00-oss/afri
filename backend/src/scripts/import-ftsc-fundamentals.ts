/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de FTSC
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\ftsc\ftsc.txt
 * Date: 2026-01-03
 */

async function importFTSCFundamentals() {
  console.log('🚀 Import des données fondamentales FTSC...\n');

  const ticker = 'FTSC';

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
      market_cap: 31_733_000_000, // 31 733 MFCFA
      pe_ratio: 1.71, // PER 2024
      pb_ratio: null, // Non disponible dans le fichier
      dividend_yield: null, // À calculer si besoin: (Dividende / Prix) * 100

      // Rentabilité
      roe: null, // Non disponible
      roa: null, // Non disponible
      profit_margin: null, // Peut être calculé: (Résultat net / CA) * 100 = (18595/30695) * 100 ≈ 60.6%

      // Endettement
      debt_to_equity: null, // Non disponible

      // Résultats financiers (2024 - en millions de FCFA)
      revenue: 30_695_000_000, // 30 695 MFCFA
      net_income: 18_595_000_000, // 18 595 MFCFA (Résultat net)
      ebitda: null, // Non disponible
      free_cash_flow: null, // Non disponible

      // Actions
      shares_outstanding: 14_103_740, // Nombre de titres
      eps: 1318.00, // BNPA 2024
      book_value: null, // Non disponible
      net_profit: 18_595_000_000, // Même que net_income

      // Année de référence
      year: 2024
    };

    // Informations de la compagnie
    const companyInfoData = {
      description: "Filtisac ou filature tissage sac, est une unité de fabrication de sacs en fibre naturelle de l'entreprise IPS (Industrial Promotion Services). Fondée en 1965, la société s'est aujourd'hui diversifiée avec la création d'une unité de fabrication d'emballages en fibres synthétiques pour des produits tels que: le coton, le riz, les engrais, le cacao, le café et l'anacarde ainsi que la production d'emballages rigides (préformes, bouteilles, boîtes). Leader en Afrique subsaharienne, FILTISAC possède de nombreuses filiales en Afrique de l'Ouest et du Centre.",
      website: null,
      employees: null,
      founded_year: 1965,
      headquarters: "FILATURE, TISSAGE, SACS DE CÔTE D'IVOIRE Km8, Route d'Adzopé Abidjan Abidjan",
      ceo: "SYLLA MAHAMADOU", // Directeur Général
      industry: "Industrie" // Secteur
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
      { name: 'AKFED', percentage: 35.8 },
      { name: 'PUBLIC (BRVM)', percentage: 33.48 },
      { name: 'IPS-WA', percentage: 10.0 },
      { name: 'AKA INVEST TRUST', percentage: 5.09 },
      { name: 'IAD', percentage: 5.09 }
    ];

    // Supprimer les anciens actionnaires FTSC
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
        revenue: 39_020_000_000,
        revenue_growth: null,
        net_income: 3_552_000_000,
        net_income_growth: null,
        eps: 251.82,
        pe_ratio: 8.93,
        dividend: 235.00
      },
      {
        year: 2021,
        revenue: 41_474_000_000,
        revenue_growth: 6.29,
        net_income: -1_276_000_000,
        net_income_growth: null,
        eps: null,
        pe_ratio: null,
        dividend: null
      },
      {
        year: 2022,
        revenue: 45_464_000_000,
        revenue_growth: 9.62,
        net_income: 154_000_000,
        net_income_growth: null,
        eps: 10.88,
        pe_ratio: 206.80,
        dividend: null
      },
      {
        year: 2023,
        revenue: 38_215_000_000,
        revenue_growth: -15.94,
        net_income: 3_076_000_000,
        net_income_growth: 1897.40,
        eps: 218.00,
        pe_ratio: 10.32,
        dividend: 130.00
      },
      {
        year: 2024,
        revenue: 30_695_000_000,
        revenue_growth: -19.68,
        net_income: 18_595_000_000,
        net_income_growth: 504.53,
        eps: 1318.00,
        pe_ratio: 1.71,
        dividend: 1726.55
      }
    ];

    // Supprimer les anciennes données annuelles FTSC
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
    console.log('  - Onglet "Fondamentaux" de la page FTSC');
    console.log('  - Onglet "Vue d\'ensemble" de la page FTSC');
    console.log('  - Section "Actionnaires" de la page FTSC');
    console.log('  - Section "Données financières annuelles" de la page FTSC\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
importFTSCFundamentals()
  .then(() => {
    console.log('🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Le script a échoué:', error);
    process.exit(1);
  });
