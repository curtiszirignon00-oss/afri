/// <reference types="node" />
import prisma from '../config/prisma';

async function checkUNLC() {
  try {
    console.log('🔍 Vérification des données UNLC...\n');

    // Stock
    const stock = await prisma.stock.findUnique({
      where: { symbol: 'UNLC' }
    });

    console.log('📊 Stock UNLC:');
    console.log(JSON.stringify(stock, null, 2));
    console.log('\n');

    // Fundamentals
    const fundamentals = await prisma.stockFundamental.findUnique({
      where: { stock_ticker: 'UNLC' }
    });

    console.log('💰 Données Fondamentales UNLC:');
    console.log(JSON.stringify(fundamentals, null, 2));
    console.log('\n');

    // Company Info
    const companyInfo = await prisma.companyInfo.findUnique({
      where: { stock_ticker: 'UNLC' }
    });

    console.log('🏢 Informations Compagnie UNLC:');
    console.log(JSON.stringify(companyInfo, null, 2));

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUNLC();
