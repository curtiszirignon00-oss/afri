
import prisma from '../config/prisma';
import fs from 'fs';
import path from 'path';

async function checkStocks() {
    const baseDir = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm';
    const folders = fs.readdirSync(baseDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name.toUpperCase());

    const dbStocks = await prisma.stock.findMany({
        include: {
            fundamentals: true,
            history: { take: 1 }
        }
    });

    const dbSymbols = dbStocks.map(s => s.symbol.toUpperCase());

    console.log(`Found ${folders.length} folders in ${baseDir}`);
    console.log(`Found ${dbStocks.length} stocks in database`);

    const results = folders.map(folder => {
        const stock = dbStocks.find(s => s.symbol.toUpperCase() === folder);
        const hasFundamentals = stock && stock.fundamentals.length > 0;
        const hasHistory = stock && stock.history.length > 0;

        // Check if files exist
        const folderPath = path.join(baseDir, folder.toLowerCase());
        const txtFile = fs.readdirSync(folderPath).find(f => f.toLowerCase().endsWith('.txt'));
        const xlsxFile = fs.readdirSync(folderPath).find(f => f.toLowerCase().endsWith('.xlsx'));

        return {
            symbol: folder,
            inDb: !!stock,
            hasFundamentals,
            hasHistory,
            hasTxt: !!txtFile,
            hasXlsx: !!xlsxFile,
            txtPath: txtFile ? path.join(folderPath, txtFile) : null,
            xlsxPath: xlsxFile ? path.join(folderPath, xlsxFile) : null
        };
    });

    console.log('\n--- Missing Fundamentals ---');
    results.filter(r => r.hasTxt && !r.hasFundamentals).forEach(r => console.log(r.symbol));

    console.log('\n--- Missing History ---');
    results.filter(r => r.hasXlsx && !r.hasHistory).forEach(r => console.log(r.symbol));

    console.log('\n--- Not in DB at all ---');
    results.filter(r => !r.inDb).forEach(r => console.log(r.symbol));
}

checkStocks().catch(console.error).finally(() => prisma.$disconnect());
