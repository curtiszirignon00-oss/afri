import prisma from '../config/prisma';

const ticker = process.argv[2];

if (!ticker) {
    console.error('Usage: npx ts-node delete-stock-history.ts <TICKER>');
    process.exit(1);
}

async function deleteStockHistory() {
    console.log(`Suppression des données ${ticker}...`);
    const result = await prisma.stockHistory.deleteMany({
        where: { stock_ticker: ticker }
    });
    console.log('Données supprimées:', result.count);
    await prisma.$disconnect();
}

deleteStockHistory();
