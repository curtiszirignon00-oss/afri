// backend/src/services/stock.service.prisma.ts

import prisma from "../config/prisma";
import { Prisma } from '@prisma/client'; // <-- ADD THIS LINE
import { StockData } from "./scraping.service"; // On importe le type du scraper

export async function saveStocks(stocksData: StockData[]) {
  try {
    for (const data of stocksData) {
      if (!data.symbol || data.lastPrice === null) continue;

      // Calcule le "previous_close"
      const changeValue = data.change ? (data.lastPrice * (data.change / 100)) : 0;
      const previousClose = data.lastPrice - changeValue;

      await prisma.stock.upsert({
        where: { symbol: data.symbol },
        update: {
          company_name: data.name,
          current_price: data.lastPrice,
          daily_change_percent: data.change ?? 0,
          volume: data.volume ?? 0,
          previous_close: previousClose,
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
        { symbol: { contains: searchTerm, mode: 'insensitive' } }, // insensitive = ignore case
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
      default: // Default sort by name
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
    // <-- Misplaced comment removed from here
} // <-- Closing brace for getStockBySymbol

// Nouvelle fonction pour récupérer les top stocks
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
} // <-- Closing brace for getTopStocks

// <-- Extra closing brace removed from here