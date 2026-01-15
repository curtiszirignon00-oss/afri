/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import {
  getStockHistory,
  getStockFundamentals,
  getCompanyInfo
} from '../src/services/stock.service.prisma';

const prisma = new PrismaClient();

async function testAPI() {
  console.log('🧪 Test des services API pour ABJC\n');

  try {
    // Test 1: Historique sur 1 an
    console.log('1️⃣ Test getStockHistory (1Y)...');
    const history1Y = await getStockHistory('ABJC', '1Y');
    console.log(`   ✅ ${history1Y.length} enregistrements récupérés`);
    if (history1Y.length > 0) {
      console.log(`   Premier: ${history1Y[0].date} - ${history1Y[0].close} FCFA`);
      console.log(`   Dernier: ${history1Y[history1Y.length - 1].date} - ${history1Y[history1Y.length - 1].close} FCFA`);
    }

    // Test 2: Historique sur 3 mois
    console.log('\n2️⃣ Test getStockHistory (3M)...');
    const history3M = await getStockHistory('ABJC', '3M');
    console.log(`   ✅ ${history3M.length} enregistrements récupérés`);

    // Test 3: Historique complet
    console.log('\n3️⃣ Test getStockHistory (ALL)...');
    const historyAll = await getStockHistory('ABJC', 'ALL');
    console.log(`   ✅ ${historyAll.length} enregistrements récupérés`);

    // Test 4: Données fondamentales
    console.log('\n4️⃣ Test getStockFundamentals...');
    const fundamentals = await getStockFundamentals('ABJC');
    if (fundamentals) {
      console.log(`   ✅ Données récupérées`);
      console.log(`   PER: ${fundamentals.pe_ratio}`);
      console.log(`   Market Cap: ${(fundamentals.market_cap! / 1_000_000).toFixed(0)} M FCFA`);
      console.log(`   BPA: ${fundamentals.eps} FCFA`);
      console.log(`   Dividend Yield: ${fundamentals.dividend_yield?.toFixed(2)}%`);
    } else {
      console.log(`   ❌ Aucune donnée`);
    }

    // Test 5: Informations sur l'entreprise
    console.log('\n5️⃣ Test getCompanyInfo...');
    const company = await getCompanyInfo('ABJC');
    if (company) {
      console.log(`   ✅ Informations récupérées`);
      console.log(`   CEO: ${company.ceo}`);
      console.log(`   Siège: ${company.headquarters?.substring(0, 50)}...`);
      console.log(`   Site web: ${company.website || 'N/A'}`);
    } else {
      console.log(`   ❌ Aucune information`);
    }

    console.log('\n✅ Tous les tests sont passés!');

  } catch (error) {
    console.error('\n❌ Erreur pendant les tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();
