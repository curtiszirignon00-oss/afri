// backend/src/services/stock.service.prisma.ts

import prisma from "../config/prisma";
import { Prisma } from '@prisma/client';
import { StockData } from "./scraping.service";

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
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde Prisma des actions:', error);
    throw error;
  }
}

export async function getAllStocks(filters: { searchTerm?: string, sector?: string, sortBy?: string }) {
  try {
    const { searchTerm, sector, sortBy } = filters;

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

    // Build ORDER BY clause dynamically
    let orderByClause: Prisma.StockOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'change':
        orderByClause = { daily_change_percent: 'desc' };
        break;
      case 'price':
        orderByClause = { current_price: 'desc' };
        break;
      case 'volume':
        orderByClause = { volume: 'desc' };
        break;
      case 'name':
      default:
        orderByClause = { company_name: 'asc' };
        break;
    }

    const stocks = await prisma.stock.findMany({
      where: whereClause,
      orderBy: orderByClause,
    });
    return stocks;
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
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3M':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '6M':
        startDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '1Y':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'ALL':
        startDate = new Date(0); // Depuis l'origine
        break;
      default:
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }

    const history = await prisma.stockHistory.findMany({
      where: {
        stock_ticker: symbol,
        date: {
          gte: startDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    return history;
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