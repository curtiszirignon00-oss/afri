// backend/src/services/stock.service.prisma.ts

import prisma from "../config/prisma";
import { Prisma } from '@prisma/client';
import { StockData } from "./scraping.service";
import { cacheGet, cacheSet, cacheInvalidatePattern, hashFilters, CACHE_TTL, CACHE_KEYS } from './cache.service';

// <-- AJOUT : Mapping des secteurs pour assignation automatique lors du scraping
const SECTOR_MAPPING: Record<string, string> = {
  // === CONSOMMATION DE BASE ===
  'NTLC': 'Consommation de Base',
  'PALC': 'Consommation de Base',
  'SCRC': 'Consommation de Base',
  'SICC': 'Consommation de Base',
  'SLBC': 'Consommation de Base',
  'SOGC': 'Consommation de Base',
  'SPHC': 'Consommation de Base',
  'STBC': 'Consommation de Base',
  'UNLC': 'Consommation de Base',

  // === CONSOMMATION DISCRÉTIONNAIRE ===
  'ABJC': 'Consommation Discrétionnaire',
  'BNBC': 'Consommation Discrétionnaire',
  'CFAC': 'Consommation Discrétionnaire',
  'LNBB': 'Consommation Discrétionnaire',
  'NEIC': 'Consommation Discrétionnaire',
  'PRSC': 'Consommation Discrétionnaire',
  'UNXC': 'Consommation Discrétionnaire',

  // === ENERGIE ===
  'SHEC': 'Energie',
  'SMBC': 'Energie',
  'TTLC': 'Energie',
  'TTLS': 'Energie',

  // === INDUSTRIELS ===
  'CABC': 'Industriels',
  'FTSC': 'Industriels',
  'SDSC': 'Industriels',
  'SEMC': 'Industriels',
  'SIVC': 'Industriels',
  'STAC': 'Industriels',

  // === SERVICES FINANCIERS ===
  'BICB': 'Services Financiers',
  'BICC': 'Services Financiers',
  'BOAB': 'Services Financiers',
  'BOABF': 'Services Financiers',
  'BOAC': 'Services Financiers',
  'BOAM': 'Services Financiers',
  'BOAN': 'Services Financiers',
  'BOAS': 'Services Financiers',
  'CBIBF': 'Services Financiers',
  'ECOC': 'Services Financiers',
  'ETIT': 'Services Financiers',
  'NSBC': 'Services Financiers',
  'ORGT': 'Services Financiers',
  'SAFC': 'Services Financiers',
  'SGBC': 'Services Financiers',
  'SIBC': 'Services Financiers',

  // === SERVICES PUBLICS ===
  'CIEC': 'Services Publics',
  'SDCC': 'Services Publics',

  // === TÉLÉCOMMUNICATIONS ===
  'ONTBF': 'Télécommunications',
  'ORAC': 'Télécommunications',
  'SNTS': 'Télécommunications',
};

export async function saveStocks(stocksData: StockData[]) {
  try {
    for (const data of stocksData) {
      if (!data.symbol || data.lastPrice === null) continue;

      // Calcule le "previous_close"
      const changeValue = data.change ? (data.lastPrice * (data.change / 100)) : 0;
      const previousClose = data.lastPrice - changeValue;

      // <-- AJOUT : Récupérer le secteur depuis le mapping
      const sector = SECTOR_MAPPING[data.symbol] || null;

      await prisma.stock.upsert({
        where: { symbol: data.symbol },
        update: {
          company_name: data.name,
          current_price: data.lastPrice,
          daily_change_percent: data.change ?? 0,
          volume: data.volume ?? 0,
          previous_close: previousClose,
          sector: sector, // <-- AJOUT : Mise à jour du secteur
          updated_at: new Date(),
        },
        create: {
          symbol: data.symbol,
          company_name: data.name,
          current_price: data.lastPrice,
          daily_change_percent: data.change ?? 0,
          volume: data.volume ?? 0,
          previous_close: previousClose,
          market_cap: data.volumeXOF ?? 0,
          sector: sector, // <-- AJOUT : Assignation du secteur lors de la création
        }
      });
    }
    console.log(`✅ ${stocksData.length} actions traitées par Prisma.`);

    // Invalider le cache des stocks apres mise a jour
    await cacheInvalidatePattern('stocks:*');
    await cacheInvalidatePattern('stock:*');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde Prisma des actions:', error);
    throw error;
  }
}

export async function getAllStocks(filters: {
  searchTerm?: string,
  sector?: string,
  sortBy?: string,
  minMarketCap?: number,
  maxMarketCap?: number,
  minPE?: number,
  maxPE?: number,
  minDividend?: number,
  maxDividend?: number
}) {
  try {
    const { searchTerm, sector, sortBy, minMarketCap, maxMarketCap, minPE, maxPE, minDividend, maxDividend } = filters;

    // Cache: verifier le cache
    const cacheKey = CACHE_KEYS.stocks(hashFilters(filters));
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) return cached;

    // Build WHERE clause dynamically
    const whereClause: Prisma.StockWhereInput = {
      is_active: true, // Always filter for active stocks
    };
    if (searchTerm) {
      whereClause.OR = [ // Search in symbol OR company name
        { symbol: { contains: searchTerm, mode: 'insensitive' } },
        { company_name: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    if (sector && sector !== 'all') {
      whereClause.sector = sector;
    }

    // Market cap filters
    if (minMarketCap !== undefined) {
      whereClause.market_cap = { ...whereClause.market_cap as any, gte: minMarketCap };
    }
    if (maxMarketCap !== undefined) {
      whereClause.market_cap = { ...whereClause.market_cap as any, lte: maxMarketCap };
    }

    // Fetch stocks with fundamentals and annual financials
    const stocks = await prisma.stock.findMany({
      where: whereClause,
      include: {
        fundamentals: {
          take: 1,
          orderBy: { year: 'desc' }
        },
        annualFinancials: {
          orderBy: { year: 'desc' },
          take: 1
        }
      }
    });

    // Calculate P/E ratio and dividend yield for each stock
    const stocksWithCalculations = stocks.map(stock => {
      // Get latest BNPA (EPS) from annual financials or fundamentals
      const latestFinancial = stock.annualFinancials[0];
      const bnpa = latestFinancial?.eps || stock.fundamentals[0]?.eps || null;

      // Calculate P/E Ratio: Current Price / BNPA
      const pe_ratio = bnpa && bnpa > 0 ? stock.current_price / bnpa : null;

      // Get latest dividend from annual financials
      const latestDividend = latestFinancial?.dividend || null;

      // Calculate Dividend Yield: (Dividend / Current Price) * 100
      const dividend_yield = latestDividend && stock.current_price > 0
        ? (latestDividend / stock.current_price) * 100
        : null;

      return {
        ...stock,
        pe_ratio,
        dividend_yield
      };
    });

    // Apply P/E and dividend filters
    let filteredStocks = stocksWithCalculations;

    if (minPE !== undefined) {
      filteredStocks = filteredStocks.filter(s => s.pe_ratio !== null && s.pe_ratio >= minPE);
    }
    if (maxPE !== undefined) {
      filteredStocks = filteredStocks.filter(s => s.pe_ratio !== null && s.pe_ratio <= maxPE);
    }
    if (minDividend !== undefined) {
      filteredStocks = filteredStocks.filter(s => s.dividend_yield !== null && s.dividend_yield >= minDividend);
    }
    if (maxDividend !== undefined) {
      filteredStocks = filteredStocks.filter(s => s.dividend_yield !== null && s.dividend_yield <= maxDividend);
    }

    // Sort by P/E or dividend if requested
    if (sortBy === 'pe') {
      filteredStocks.sort((a, b) => {
        if (a.pe_ratio === null) return 1;
        if (b.pe_ratio === null) return -1;
        return a.pe_ratio - b.pe_ratio;
      });
    } else if (sortBy === 'dividend') {
      filteredStocks.sort((a, b) => {
        if (a.dividend_yield === null) return 1;
        if (b.dividend_yield === null) return -1;
        return b.dividend_yield - a.dividend_yield; // Descending order for dividend
      });
    } else {
      // Apply original sorting
      switch (sortBy) {
        case 'change':
          filteredStocks.sort((a, b) => b.daily_change_percent - a.daily_change_percent);
          break;
        case 'price':
          filteredStocks.sort((a, b) => b.current_price - a.current_price);
          break;
        case 'volume':
          filteredStocks.sort((a, b) => b.volume - a.volume);
          break;
        case 'name':
          filteredStocks.sort((a, b) => a.company_name.localeCompare(b.company_name));
          break;
      }
    }

    // Cache: stocker le resultat (TTL 1h)
    await cacheSet(cacheKey, filteredStocks, CACHE_TTL.STOCKS);

    return filteredStocks;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération Prisma des actions:', error);
    throw error;
  }
}

export async function getStockBySymbol(symbol: string) {
  try {
    const stock = await prisma.stock.findUnique({
      where: { symbol },
    });
    return stock;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération de ${symbol}:`, error);
    throw error;
  }
}

export async function getTopStocks(limit: number = 6) {
  try {
    const stocks = await prisma.stock.findMany({
      where: { is_active: true },
      orderBy: {
        daily_change_percent: 'desc',
      },
      take: limit,
    });
    return stocks;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des top stocks:', error);
    throw error;
  }
}

// ========================================
// NOUVELLES FONCTIONS POUR STOCK DETAILS
// ========================================

/**
 * Récupère l'historique des prix d'une action
 * @param symbol - Le symbole de l'action (ex: SLBC)
 * @param period - Période: '1M' | '3M' | '6M' | '1Y' | 'ALL'
 */
export async function getStockHistory(
  symbol: string,
  period: '1M' | '3M' | '6M' | '1Y' | 'ALL' = '1Y'
) {
  try {
    // Calculer la date de début selon la période
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '1M':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate()));
        break;
      case '3M':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, now.getUTCDate()));
        break;
      case '6M':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, now.getUTCDate()));
        break;
      case '1Y':
        startDate = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()));
        break;
      case 'ALL':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()));
    }

    const history = await prisma.stockHistory.findMany({
      where: {
        stock_ticker: symbol,
        date: {
          gte: startDate,
          lte: now // Ne jamais retourner de dates futures
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Normaliser les dates et dédupliquer
    // Les imports Excel ont créé des dates à 22:00/23:00 UTC (timezone locale)
    // On normalise en prenant la date calendaire locale (jour suivant pour 22:00/23:00 UTC)
    const dateMap = new Map<string, typeof history[0]>();

    for (const record of history) {
      const utcHours = record.date.getUTCHours();
      let dateKey: string;

      if (utcHours >= 22) {
        // 22:00 ou 23:00 UTC = lendemain en timezone locale (UTC+1/+2)
        const nextDay = new Date(record.date);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        dateKey = `${nextDay.getUTCFullYear()}-${String(nextDay.getUTCMonth() + 1).padStart(2, '0')}-${String(nextDay.getUTCDate()).padStart(2, '0')}`;
      } else {
        dateKey = `${record.date.getUTCFullYear()}-${String(record.date.getUTCMonth() + 1).padStart(2, '0')}-${String(record.date.getUTCDate()).padStart(2, '0')}`;
      }

      // Garder l'entree la plus recente (la plus precise, souvent du scraper)
      if (!dateMap.has(dateKey) || record.date > dateMap.get(dateKey)!.date) {
        dateMap.set(dateKey, record);
      }
    }

    // Retourner avec des dates normalisées (YYYY-MM-DD à minuit UTC)
    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, record]) => ({
        ...record,
        date: new Date(dateKey + 'T00:00:00.000Z')
      }));
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération de l'historique de ${symbol}:`, error);
    throw error;
  }
}

/**
 * Récupère les données fondamentales d'une action
 * @param symbol - Le symbole de l'action
 */
export async function getStockFundamentals(symbol: string) {
  try {
    const fundamentals = await prisma.stockFundamental.findUnique({
      where: { stock_ticker: symbol }
    });
    return fundamentals;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des fondamentaux de ${symbol}:`, error);
    throw error;
  }
}

/**
 * Récupère les informations sur la compagnie
 * @param symbol - Le symbole de l'action
 */
export async function getCompanyInfo(symbol: string) {
  try {
    const companyInfo = await prisma.companyInfo.findUnique({
      where: { stock_ticker: symbol }
    });
    return companyInfo;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des infos de ${symbol}:`, error);
    throw error;
  }
}

/**
 * Récupère les actualités liées à une action
 * @param symbol - Le symbole de l'action
 * @param limit - Nombre d'actualités à retourner
 */
export async function getStockNews(symbol: string, limit: number = 10) {
  try {
    const news = await prisma.stockNews.findMany({
      where: { stock_ticker: symbol },
      orderBy: { published_at: 'desc' },
      take: limit
    });
    return news;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des news de ${symbol}:`, error);
    throw error;
  }
}

/**
 * Récupère les actionnaires d'une action
 * @param symbol - Le symbole de l'action
 */
export async function getShareholders(symbol: string) {
  try {
    const shareholders = await prisma.shareholder.findMany({
      where: { stock_ticker: symbol },
      orderBy: { percentage: 'desc' }
    });
    return shareholders;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des actionnaires de ${symbol}:`, error);
    throw error;
  }
}

/**
 * Récupère les données financières annuelles d'une action
 * @param symbol - Le symbole de l'action
 * @param yearsBack - Nombre d'années à retourner (par défaut 5)
 */
export async function getAnnualFinancials(symbol: string, yearsBack: number = 5) {
  try {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - yearsBack + 1;

    const financials = await prisma.annualFinancials.findMany({
      where: {
        stock_ticker: symbol,
        year: {
          gte: startYear
        }
      },
      orderBy: { year: 'asc' }
    });
    return financials;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des données financières de ${symbol}:`, error);
    throw error;
  }
}
export async function getHistoryForComparison(symbols: string[], period: number) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    const history = await prisma.stockHistory.findMany({
      where: { stock_ticker: { in: symbols }, date: { gte: startDate } },
      orderBy: { date: 'asc' },
      select: { stock_ticker: true, date: true, close: true }
    });
    const groupedByDate: Record<string, any> = {};
    history.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = { date: dateKey };
      groupedByDate[dateKey][record.stock_ticker] = record.close;
    });
    return Object.values(groupedByDate).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Erreur historique:', error);
    throw error;
  }
}
