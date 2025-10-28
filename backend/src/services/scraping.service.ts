import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

function parseNumber(text: string | undefined): number | null {
  if (!text || text.trim() === '-' || text.trim() === '') return null
  try {
    const cleanedText = text.replace(/\s|&nbsp;/g, '').replace('%', '')
    const number = parseFloat(cleanedText)
    return isNaN(number) ? null : number
  } catch (e) {
    console.error(`Erreur parsing nombre: ${text}`, e)
    return null
  }
}

const SCRAPING_URL = 'https://www.sikafinance.com/marches/aaz';

export interface StockData {
    symbol: string;
    name: string;
    opening: number | null;
    high: number | null;
    low: number | null;
    volume: number | null;
    volumeXOF: number | null;
    lastPrice: number | null;
    change: number | null;
}

export async function scrapeStock() {
    try {
        const response = await fetch(SCRAPING_URL);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`)
        const html = await response.text()
        const $ = cheerio.load(html)
        const scrapedStocks: StockData[] = []
    
        $('table#tblShare tbody.alri > tr').each((_index, row) => {
            const cols = $(row).find('td');
            
            // Extraction du nom et du symbole
            const nameCell = $(cols[0]);
            const link = nameCell.find('a');
            const name = link.text().trim();
            const href = link.attr('href');
            let symbol = '';
            
            if (href) {
                const lastPart = href.split('/').pop(); 
                const symbolPart = lastPart?.split('_')[1]; 
                symbol = symbolPart?.split('.')[0] || ''; 
            }
            
            // Extraction des autres données
            const data: StockData = {
                symbol,
                name,
                opening: parseNumber($(cols[1]).text()),
                high: parseNumber($(cols[2]).text()),
                low: parseNumber($(cols[3]).text()),
                volume: parseNumber($(cols[4]).text()),
                volumeXOF: parseNumber($(cols[5]).text()),
                lastPrice: parseNumber($(cols[6]).find('b').text()),
                change: parseNumber($(cols[7]).text())
            };

            if (symbol && data.lastPrice !== null) {
                scrapedStocks.push(data);
                // console.log(`Scraped Stocks: ${symbol} - ${name}`);
                // console.log('Data:', data);
            }
        });
    
        if (scrapedStocks.length === 0) {
            throw new Error("Aucune action extraite. Problème avec les sélecteurs CSS.")
        }
    
        console.log(`✅ Extraction réussie: ${scrapedStocks.length} actions trouvées.`);
        return scrapedStocks;

    } catch (error) {
        console.error('❌ Erreur lors du scraping des données:', error);
        throw error;
    }
}

export interface IndexData {
    symbol: string;
    name: string;
    opening: number | null;
    high: number | null;
    low: number | null;
    lastValue: number | null;
    change: number | null;
}

export async function scrapeIndex() {
    try {
        const response = await fetch(SCRAPING_URL);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`)
        const html = await response.text()
        const $ = cheerio.load(html)
        const scrapedIndices: IndexData[] = []
    
        $('table#tabQuotes2 tbody.alri > tr').each((_index, row) => {
            const cols = $(row).find('td');
            
            // Extraction du nom et du symbole
            const nameCell = $(cols[0]);
            const link = nameCell.find('a');
            const name = link.text().trim();
            const href = link.attr('href');
            let symbol = '';
            
            if (href) {
                symbol = href.split('/').pop() || ''; // Le symbole est la dernière partie de l'URL
            }
            
            // Extraction des autres données
            const data: IndexData = {
                symbol,
                name,
                opening: parseNumber($(cols[1]).text()),
                high: parseNumber($(cols[2]).text()),
                low: parseNumber($(cols[3]).text()),
                lastValue: parseNumber($(cols[4]).text()),
                change: parseNumber($(cols[5]).find('span').text())
            };

            if (symbol) {
                scrapedIndices.push(data);
                console.log(`Scraped Index: ${symbol} - ${name}`);
                // console.log('Data:', data);
            }
        });
    
        if (scrapedIndices.length === 0) {
            throw new Error("Aucun indice extrait. Problème avec les sélecteurs CSS.")
        }
    
        console.log(`✅ Extraction réussie: ${scrapedIndices.length} indices trouvés.`);
        return scrapedIndices;

    } catch (error) {
        console.error('❌ Erreur lors du scraping des indices:', error);
        throw error;
    }
}