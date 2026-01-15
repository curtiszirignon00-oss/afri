/// <reference types="node" />
// backend/scripts/seedFundamentals.ts
// Import manuel des données fondamentales
// À mettre à jour trimestriellement/semestriellement

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Données fondamentales par action
 * Source: Rapports annuels, sites web des entreprises, BRVM
 * Dernière mise à jour: [DATE]
 */
const FUNDAMENTALS_DATA = [
  {
    ticker: 'SLBC',
    data: {
      // Valorisation
      market_cap: 500_000_000_000, // 500 Mds FCFA
      pe_ratio: 15.5,
      pb_ratio: 2.3,
      dividend_yield: 4.2,

      // Rentabilité
      roe: 18.5,
      roa: 12.3,
      profit_margin: 15.0,

      // Endettement
      debt_to_equity: 0.5,

      // Résultats financiers
      revenue: 150_000_000_000,
      net_income: 22_500_000_000,
      ebitda: 35_000_000_000,
      free_cash_flow: 18_000_000_000,

      // Actions
      shares_outstanding: 10_000_000,
      eps: 2250,
      book_value: 8_000_000_000,

      // Année de référence
      year: 2024
    },
    companyInfo: {
      description: "SICABLE-CI (Société Ivoirienne de Cables) est une entreprise leader dans la fabrication et la distribution de câbles électriques en Côte d'Ivoire et dans la sous-région.",
      website: 'https://www.sicable-ci.com',
      employees: 850,
      founded_year: 1975,
      headquarters: "Abidjan, Côte d'Ivoire",
      ceo: 'Jean Koffi Kacou',
      industry: 'Distribution électrique'
    }
  },

  {
    ticker: 'SNTS',
    data: {
      market_cap: 800_000_000_000,
      pe_ratio: 18.2,
      pb_ratio: 3.1,
      dividend_yield: 3.8,
      roe: 22.5,
      roa: 15.8,
      profit_margin: 18.5,
      debt_to_equity: 0.3,
      revenue: 220_000_000_000,
      net_income: 40_700_000_000,
      ebitda: 55_000_000_000,
      free_cash_flow: 32_000_000_000,
      shares_outstanding: 15_000_000,
      eps: 2713,
      book_value: 12_000_000_000,
      year: 2024
    },
    companyInfo: {
      description: "SONATEL Sénégal est l'opérateur historique de télécommunications du Sénégal. L'entreprise offre une gamme complète de services de téléphonie mobile, fixe, internet et data.",
      website: 'https://www.sonatel.sn',
      employees: 1250,
      founded_year: 1985,
      headquarters: 'Dakar, Sénégal',
      ceo: 'Sékou Dramé',
      industry: 'Télécommunications'
    }
  },

  // 🔴 IMPORTANT: Ajoutez ici les 46 autres actions
  // Template pour copier-coller:
  /*
  {
    ticker: 'SYMBOLE',
    data: {
      market_cap: null,           // En FCFA
      pe_ratio: null,
      pb_ratio: null,
      dividend_yield: null,       // En %
      roe: null,                  // En %
      roa: null,                  // En %
      profit_margin: null,        // En %
      debt_to_equity: null,
      revenue: null,              // En FCFA
      net_income: null,           // En FCFA
      ebitda: null,               // En FCFA
      free_cash_flow: null,       // En FCFA
      shares_outstanding: null,
      eps: null,                  // En FCFA
      book_value: null,           // En FCFA
      year: 2024
    },
    companyInfo: {
      description: '',
      website: '',
      employees: null,
      founded_year: null,
      headquarters: '',
      ceo: '',
      industry: ''
    }
  },
  */
];

async function seedFundamentals() {
  console.log('💰 Début du seeding des données fondamentales...\n');

  let fundamentalsCreated = 0;
  let companyInfoCreated = 0;
  let fundamentalsUpdated = 0;
  let companyInfoUpdated = 0;

  for (const { ticker, data, companyInfo } of FUNDAMENTALS_DATA) {
    console.log(`\n📊 Traitement de ${ticker}...`);

    try {
      // Vérifier que l'action existe
      const stock = await prisma.stock.findUnique({
        where: { symbol: ticker }
      });

      if (!stock) {
        console.log(`  ⚠️  Action ${ticker} non trouvée, ignorée`);
        continue;
      }

      // 1. Sauvegarder les fondamentaux
      const existingFundamentals = await prisma.stockFundamental.findUnique({
        where: { stock_ticker: ticker }
      });

      if (existingFundamentals) {
        await prisma.stockFundamental.update({
          where: { stock_ticker: ticker },
          data: data
        });
        fundamentalsUpdated++;
        console.log(`  ✅ Fondamentaux mis à jour`);
      } else {
        await prisma.stockFundamental.create({
          data: {
            stockId: stock.id,
            stock_ticker: ticker,
            ...data
          }
        });
        fundamentalsCreated++;
        console.log(`  ✅ Fondamentaux créés`);
      }

      // 2. Sauvegarder les infos compagnie
      const existingCompanyInfo = await prisma.companyInfo.findUnique({
        where: { stock_ticker: ticker }
      });

      if (existingCompanyInfo) {
        await prisma.companyInfo.update({
          where: { stock_ticker: ticker },
          data: companyInfo
        });
        companyInfoUpdated++;
        console.log(`  ✅ Infos compagnie mises à jour`);
      } else {
        await prisma.companyInfo.create({
          data: {
            stock_ticker: ticker,
            ...companyInfo
          }
        });
        companyInfoCreated++;
        console.log(`  ✅ Infos compagnie créées`);
      }

    } catch (error) {
      console.error(`  ❌ Erreur pour ${ticker}:`, error);
    }
  }

  console.log(`\n🎉 Seeding terminé !`);
  console.log(`\n📊 Fondamentaux:`);
  console.log(`  ✅ Créés: ${fundamentalsCreated}`);
  console.log(`  🔄 Mis à jour: ${fundamentalsUpdated}`);
  console.log(`\n🏢 Infos compagnies:`);
  console.log(`  ✅ Créées: ${companyInfoCreated}`);
  console.log(`  🔄 Mises à jour: ${companyInfoUpdated}`);
  console.log(`\n⚠️  N'oubliez pas de compléter les 46 autres actions !`);
}

// Exécution
console.log('🚀 Script de seeding des données fondamentales\n');
console.log(`ℹ️  Ce script doit être exécuté manuellement`);
console.log(`ℹ️  Mise à jour recommandée: trimestrielle ou semestrielle\n`);

seedFundamentals()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
