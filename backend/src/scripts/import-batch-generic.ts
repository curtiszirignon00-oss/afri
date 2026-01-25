
import prisma from '../config/prisma';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

interface FinancialYear {
    year: number;
    revenue?: number | null;
    revenue_growth?: number | null;
    net_income?: number | null;
    net_income_growth?: number | null;
    eps?: number | null;
    pe_ratio?: number | null;
    dividend?: number | null;
}

interface ShareholderData {
    name: string;
    percentage: number;
}

interface StockData {
    symbol: string;
    company_name: string;
    description: string;
    telephone: string;
    fax: string;
    address: string;
    ceo: string;
    shares_outstanding: number;
    float_percent: number;
    market_cap_text: string;
    shareholders: ShareholderData[];
    financials: FinancialYear[];
}

function cleanNum(val: string): number | null {
    if (!val || val.trim() === '-' || val.trim() === '') return null;
    // Remove spaces, Replace comma with dot
    const cleaned = val.replace(/\s/g, '').replace(',', '.').replace('%', '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

function parseTxt(content: string, symbol: string): StockData {
    const lines = content.split('\n').map(l => l.trim());
    const data: StockData = {
        symbol,
        company_name: '',
        description: '',
        telephone: '',
        fax: '',
        address: '',
        ceo: '',
        shares_outstanding: 0,
        float_percent: 0,
        market_cap_text: '',
        shareholders: [],
        financials: []
    };

    let inShareholders = false;
    let yearsRow: number[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        if (i === 0 && !line.includes(':\\')) {
            data.company_name = line;
        }

        if (line.includes('La société :')) {
            data.description = line.replace('La société :', '').trim();
        } else if (line.startsWith('Téléphone :')) {
            data.telephone = line.replace('Téléphone :', '').trim();
        } else if (line.startsWith('Fax :')) {
            data.fax = line.replace('Fax :', '').trim();
        } else if (line.startsWith('Adresse :')) {
            data.address = line.replace('Adresse :', '').trim();
        } else if (line.startsWith('Dirigeants :')) {
            data.ceo = line.replace('Dirigeants :', '').trim();
            // If next line is also a ruler or similar, handle it? 
            // Usually it's just the CEO name or multiple lines.
        } else if (line.startsWith('Nombre de titres :')) {
            data.shares_outstanding = cleanNum(line.replace('Nombre de titres :', '')) || 0;
        } else if (line.startsWith('Flottant :')) {
            data.float_percent = cleanNum(line.replace('Flottant :', '')) || 0;
        } else if (line.startsWith('Valorisation de la société :')) {
            data.market_cap_text = line.replace('Valorisation de la société :', '').trim();
        } else if (line.includes('Principaux actionnaires')) {
            inShareholders = true;
        } else if (inShareholders && /^[A-Z]/.test(line) && line.includes('%')) {
            const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(/\s{2,}/);
            if (parts.length >= 2) {
                data.shareholders.push({
                    name: parts[0].trim(),
                    percentage: cleanNum(parts[1]) || 0
                });
            } else {
                // Try fallback split
                const lastSpace = line.lastIndexOf(' ');
                const name = line.substring(0, lastSpace).trim();
                const pct = line.substring(lastSpace).trim();
                data.shareholders.push({ name, percentage: cleanNum(pct) || 0 });
            }
        } else if (line.includes('Les chiffres sont en millions')) {
            inShareholders = false;
        } else if (/^20\d{2}/.test(line)) {
            // Looks like the years row
            yearsRow = line.split(/\s+/).map(y => parseInt(y)).filter(y => !isNaN(y));
            yearsRow.forEach(y => data.financials.push({ year: y }));
        } else if (yearsRow.length > 0) {
            const parts = line.split(/\t|\s{2,}/).filter(p => p.trim() !== '');
            const label = parts[0];
            const values = parts.slice(1);

            if (label.includes('Chiffre d\'affaires') || label.includes('Produit Net Bancaire')) {
                values.forEach((v, idx) => { if (data.financials[idx]) data.financials[idx].revenue = (cleanNum(v) || 0) * 1_000_000; });
            } else if (label.includes('Croissance CA') || label.includes('Croissance du PNB')) {
                values.forEach((v, idx) => { if (data.financials[idx]) data.financials[idx].revenue_growth = cleanNum(v); });
            } else if (label.includes('Résultat net')) {
                values.forEach((v, idx) => { if (data.financials[idx]) data.financials[idx].net_income = (cleanNum(v) || 0) * 1_000_000; });
            } else if (label.includes('Croissance RN')) {
                values.forEach((v, idx) => { if (data.financials[idx]) data.financials[idx].net_income_growth = cleanNum(v); });
            } else if (label.includes('BNPA') || label.includes('EPS')) {
                values.forEach((v, idx) => { if (data.financials[idx]) data.financials[idx].eps = cleanNum(v); });
            } else if (label.includes('PER')) {
                values.forEach((v, idx) => { if (data.financials[idx]) data.financials[idx].pe_ratio = cleanNum(v); });
            } else if (label.includes('Dividende')) {
                values.forEach((v, idx) => { if (data.financials[idx]) data.financials[idx].dividend = cleanNum(v); });
            }
        }
    }

    // Handle CEO multi-line if needed (heuristics)
    if (!data.company_name) data.company_name = symbol;

    return data;
}

async function importStock(symbol: string, baseDir: string) {
    const folder = path.join(baseDir, symbol.toLowerCase());
    if (!fs.existsSync(folder)) {
        console.log(`Folder not found for ${symbol}`);
        return;
    }

    const files = fs.readdirSync(folder);
    const txtFile = files.find(f => f.toLowerCase().endsWith('.txt'));
    const xlsxFile = files.find(f => f.toLowerCase().endsWith('.xlsx'));

    if (!txtFile) {
        console.log(`No .txt file for ${symbol}`);
        return;
    }

    console.log(`Importing ${symbol}...`);

    try {
        const txtContent = fs.readFileSync(path.join(folder, txtFile), 'utf8');
        const stockData = parseTxt(txtContent, symbol);

        // 1. Create/Update Stock
        let stock = await prisma.stock.findUnique({ where: { symbol } });
        const market_cap = cleanNum(stockData.market_cap_text.replace('MFCFA', '')) ? (cleanNum(stockData.market_cap_text.replace('MFCFA', '')) || 0) * 1_000_000 : 0;

        if (!stock) {
            stock = await prisma.stock.create({
                data: {
                    symbol,
                    company_name: stockData.company_name || symbol,
                    description: stockData.description,
                    market_cap: market_cap,
                    is_active: true
                }
            });
        } else {
            stock = await prisma.stock.update({
                where: { symbol },
                data: {
                    description: stockData.description,
                    market_cap: market_cap
                }
            });
        }

        // 2. Company Info
        await prisma.companyInfo.upsert({
            where: { stock_ticker: symbol },
            update: {
                description: stockData.description,
                ceo: stockData.ceo,
                headquarters: stockData.address,
                industry: stock.sector || 'N/A'
            },
            create: {
                stock_ticker: symbol,
                description: stockData.description,
                ceo: stockData.ceo,
                headquarters: stockData.address,
                industry: stock.sector || 'N/A'
            }
        });

        // 3. Shareholders
        await prisma.shareholder.deleteMany({ where: { stock_ticker: symbol } });
        for (const sh of stockData.shareholders) {
            await prisma.shareholder.create({
                data: {
                    stock_ticker: symbol,
                    name: sh.name,
                    percentage: sh.percentage,
                    is_public: sh.name.toLowerCase().includes('brvm') || sh.name.toLowerCase().includes('public')
                }
            });
        }

        // 4. Annual Financials & Fundamentals
        await prisma.annualFinancials.deleteMany({ where: { stock_ticker: symbol } });
        for (const fin of stockData.financials) {
            await prisma.annualFinancials.create({
                data: {
                    stock: { connect: { id: stock.id } },
                    stock_ticker: symbol,
                    year: fin.year,
                    revenue: fin.revenue,
                    revenue_growth: fin.revenue_growth,
                    net_income: fin.net_income,
                    net_income_growth: fin.net_income_growth,
                    eps: fin.eps,
                    pe_ratio: fin.pe_ratio,
                    dividend: fin.dividend
                }
            });
        }

        // Latest fundamentals
        const latest = stockData.financials.sort((a, b) => b.year - a.year)[0];
        if (latest) {
            await prisma.stockFundamental.upsert({
                where: { stock_ticker: symbol },
                update: {
                    year: latest.year,
                    revenue: latest.revenue,
                    net_income: latest.net_income,
                    eps: latest.eps,
                    pe_ratio: latest.pe_ratio,
                    market_cap: market_cap,
                    shares_outstanding: stockData.shares_outstanding,
                },
                create: {
                    stockId: stock.id,
                    stock_ticker: symbol,
                    year: latest.year,
                    revenue: latest.revenue,
                    net_income: latest.net_income,
                    eps: latest.eps,
                    pe_ratio: latest.pe_ratio,
                    market_cap: market_cap,
                    shares_outstanding: stockData.shares_outstanding,
                }
            });
        }

        console.log(`✅ ${symbol} Fundamentals imported.`);

        // 5. History if exists
        if (xlsxFile) {
            console.log(`⏳ Importing ${symbol} history from ${xlsxFile}...`);
            const workbook = XLSX.readFile(path.join(folder, xlsxFile));
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawHistory: any[] = XLSX.utils.sheet_to_json(sheet);

            const historyMap = new Map();
            for (const row of rawHistory) {
                const dateVal = row.Date || row.date || row.DATE;
                if (!dateVal) continue;

                let date: Date;
                if (typeof dateVal === 'number') {
                    const d = XLSX.SSF.parse_date_code(dateVal) as any;
                    date = new Date(d.y, d.m - 1, d.d);
                } else {
                    date = new Date(dateVal);
                }
                if (isNaN(date.getTime())) continue;

                const dateStr = date.toISOString().split('T')[0];
                const close = cleanNum(String(row.Close || row.close || row.Clôture || row.Cloture || 0));
                const open = cleanNum(String(row.Open || row.open || row.Ouverture || 0));
                const high = cleanNum(String(row.High || row.high || row['Plus haut'] || 0));
                const low = cleanNum(String(row.Low || row.low || row['Plus bas'] || 0));
                const vol = cleanNum(String(row.Volume || row.volume || row['Volume Titres'] || 0));

                historyMap.set(dateStr, {
                    stockId: stock.id,
                    stock_ticker: symbol,
                    date: new Date(dateStr),
                    open: open || 0,
                    high: high || 0,
                    low: low || 0,
                    close: close || 0,
                    volume: vol || 0
                });
            }

            const historyDataList = Array.from(historyMap.values());

            if (historyDataList.length > 0) {
                // Delete existing history to avoid unique constraint errors and ensure clean import
                await prisma.stockHistory.deleteMany({
                    where: { stock_ticker: symbol }
                });

                // Batch insert (Prisma's createMany is much faster than individual upserts)
                const result = await prisma.stockHistory.createMany({
                    data: historyDataList
                });
                console.log(`   ✅ ${symbol} History imported (${result.count} rows).`);
            }
        }

    } catch (err) {
        console.error(`❌ Error importing ${symbol}:`, err);
    }
}

async function main() {
    const missing = [
        'BICC', 'BNBC', 'BOAB', 'BOAC', 'BOAM', 'BOAN', 'BOAS', 'ECOC', 'ETIT', 'LNBB',
        'NSBC', 'ONTBF', 'ORAC', 'PALC', 'PRSC', 'SAFC', 'SCRC', 'SDCC', 'SEMC', 'SGBC',
        'SHEC', 'SIBC', 'SMBC', 'SNTS', 'SOGC', 'SPHC', 'STBC'
    ];
    const baseDir = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm';

    for (const symbol of missing) {
        await importStock(symbol, baseDir);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
