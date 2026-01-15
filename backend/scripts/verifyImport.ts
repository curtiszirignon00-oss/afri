/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyImport() {
  console.log('🔍 Vérification de l\'import pour ABJC\n');

  // 1. Historique des prix
  const historyCount = await prisma.stockHistory.count({
    where: { stock_ticker: 'ABJC' }
  });

  console.log(`📊 Historique des prix:`);
  console.log(`   Total d'enregistrements: ${historyCount}`);

  if (historyCount > 0) {
    const latest = await prisma.stockHistory.findFirst({
      where: { stock_ticker: 'ABJC' },
      orderBy: { date: 'desc' }
    });

    const oldest = await prisma.stockHistory.findFirst({
      where: { stock_ticker: 'ABJC' },
      orderBy: { date: 'asc' }
    });

    console.log(`   Date la plus récente: ${latest?.date.toISOString().split('T')[0]}`);
    console.log(`   Prix le plus récent: ${latest?.close} FCFA`);
    console.log(`   Date la plus ancienne: ${oldest?.date.toISOString().split('T')[0]}`);
    console.log(`   Prix le plus ancien: ${oldest?.close} FCFA`);

    // Statistiques
    const avgVolume = await prisma.stockHistory.aggregate({
      where: { stock_ticker: 'ABJC' },
      _avg: { volume: true, close: true },
      _max: { close: true, volume: true },
      _min: { close: true }
    });

    console.log(`\n   📈 Statistiques:`);
    console.log(`   Prix moyen: ${avgVolume._avg.close?.toFixed(2)} FCFA`);
    console.log(`   Prix max: ${avgVolume._max.close} FCFA`);
    console.log(`   Prix min: ${avgVolume._min.close} FCFA`);
    console.log(`   Volume moyen: ${avgVolume._avg.volume?.toFixed(0)} titres`);
    console.log(`   Volume max: ${avgVolume._max.volume} titres`);
  }

  // 2. Informations sur l'entreprise
  console.log(`\n🏢 Informations sur l'entreprise:`);
  const companyInfo = await prisma.companyInfo.findUnique({
    where: { stock_ticker: 'ABJC' }
  });

  if (companyInfo) {
    console.log(`   ✅ Informations disponibles`);
    console.log(`   Description: ${companyInfo.description?.substring(0, 100)}...`);
    console.log(`   Siège social: ${companyInfo.headquarters || 'N/A'}`);
    console.log(`   CEO: ${companyInfo.ceo || 'N/A'}`);
    console.log(`   Site web: ${companyInfo.website || 'N/A'}`);
  } else {
    console.log(`   ❌ Aucune information disponible`);
  }

  // 3. Données fondamentales
  console.log(`\n💰 Données fondamentales:`);
  const fundamentals = await prisma.stockFundamental.findUnique({
    where: { stock_ticker: 'ABJC' }
  });

  if (fundamentals) {
    console.log(`   ✅ Données disponibles`);
    console.log(`   Capitalisation: ${(fundamentals.market_cap! / 1_000_000).toFixed(0)} M FCFA`);
    console.log(`   PER: ${fundamentals.pe_ratio || 'N/A'}`);
    console.log(`   Rendement du dividende: ${fundamentals.dividend_yield?.toFixed(2)}%`);
    console.log(`   BPA: ${fundamentals.eps} FCFA`);
    console.log(`   Chiffre d'affaires: ${(fundamentals.revenue! / 1_000_000).toFixed(0)} M FCFA`);
    console.log(`   Résultat net: ${(fundamentals.net_income! / 1_000_000).toFixed(0)} M FCFA`);
    console.log(`   Année de référence: ${fundamentals.year}`);
  } else {
    console.log(`   ❌ Aucune donnée disponible`);
  }

  // 4. Vérifier que le stock est bien dans la base
  console.log(`\n🔖 Information du stock:`);
  const stock = await prisma.stock.findUnique({
    where: { symbol: 'ABJC' }
  });

  if (stock) {
    console.log(`   Symbole: ${stock.symbol}`);
    console.log(`   Nom: ${stock.company_name}`);
    console.log(`   Secteur: ${stock.sector || 'N/A'}`);
    console.log(`   Prix actuel: ${stock.current_price} FCFA`);
    console.log(`   Variation: ${stock.daily_change_percent.toFixed(2)}%`);
  }

  console.log(`\n✅ Vérification terminée!`);

  await prisma.$disconnect();
}

verifyImport();
