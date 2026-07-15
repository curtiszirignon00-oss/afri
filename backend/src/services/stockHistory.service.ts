import { log } from '../config/logger';
// backend/src/services/stockHistory.service.ts
// Service pour sauvegarder l'historique quotidien à partir du scraper existant

import prisma from '../config/prisma';
import { scrapeStock, StockData } from './scraping.service';

/**
 * Sauvegarde l'historique du jour pour toutes les actions
 * Utilise le scraper existant scrapeStock()
 */
export async function saveCurrentDayHistory() {
  try {
    log.debug('📊 Sauvegarde de l\'historique du jour...');

    // Récupérer les données du scraper existant
    const stocks = await scrapeStock();

    // Date d'aujourd'hui à minuit UTC (évite les doublons timezone)
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    let savedCount = 0;
    let errorCount = 0;

    for (const stock of stocks) {
      try {
        // Vérifier que le stock existe dans la table Stock
        const existingStock = await prisma.stock.findUnique({
          where: { symbol: stock.symbol }
        });

        if (!existingStock) {
          log.debug(`⚠️  Stock ${stock.symbol} n'existe pas dans la DB, ignoré`);
          continue;
        }

        // Vérifier que nous avons les données minimales nécessaires
        if (stock.lastPrice === null) {
          log.debug(`⚠️  ${stock.symbol}: pas de prix, ignoré`);
          continue;
        }

        // Utiliser les valeurs disponibles, avec des fallbacks intelligents
        const open = stock.opening ?? stock.lastPrice;
        const high = stock.high ?? stock.lastPrice;
        const low = stock.low ?? stock.lastPrice;
        const close = stock.lastPrice;
        const volume = stock.volume ?? 0;

        // Sauvegarder dans StockHistory avec upsert (évite les doublons)
        await prisma.stockHistory.upsert({
          where: {
            stock_ticker_date: {
              stock_ticker: stock.symbol,
              date: today
            }
          },
          update: {
            open,
            high,
            low,
            close,
            volume
          },
          create: {
            stockId: existingStock.id,
            stock_ticker: stock.symbol,
            date: today,
            open,
            high,
            low,
            close,
            volume
          }
        });

        savedCount++;
        log.debug(`✅ ${stock.symbol}: historique sauvegardé`);

      } catch (stockError) {
        errorCount++;
        log.error(`❌ Erreur pour ${stock.symbol}:`, stockError);
      }
    }

    log.debug(`\n📊 Résumé de sauvegarde:`);
    log.debug(`  ✅ Sauvegardés: ${savedCount}`);
    log.debug(`  ❌ Erreurs: ${errorCount}`);
    log.debug(`  📅 Date: ${today.toISOString().split('T')[0]}`);

    return {
      success: true,
      savedCount,
      errorCount,
      date: today
    };

  } catch (error) {
    log.error('❌ Erreur globale lors de la sauvegarde de l\'historique:', error);
    throw error;
  }
}

/**
 * Vrai si l'instant donné est dans la fenêtre de cotation BRVM (élargie).
 * Séance BRVM ≈ 9h30–15h00 GMT — on garde 9h00–15h30 GMT, lun–ven.
 */
export function isWithinBRVMTradingHours(date: Date = new Date()): boolean {
  const day = date.getUTCDay(); // 0=dim, 6=sam
  if (day === 0 || day === 6) return false;
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  return minutes >= 9 * 60 && minutes <= 15 * 60 + 30;
}

/**
 * Sauvegarde un snapshot intraday (prix + volume cumulé) pour chaque action.
 * Appelé par le cron de scraping toutes les 15 min ; les snapshots sont ensuite
 * agrégés en bougies horaires par getIntradayHourly().
 * Ne fait rien hors des heures de cotation BRVM.
 */
export async function saveIntradaySnapshots(stocks: StockData[]) {
  const now = new Date();
  if (!isWithinBRVMTradingHours(now)) {
    return { success: true, savedCount: 0, skipped: 'hors heures de cotation' };
  }

  try {
    const snapshots = stocks
      .filter(s => s.symbol && s.lastPrice !== null)
      .map(s => ({
        stock_ticker: s.symbol,
        timestamp: now,
        price: s.lastPrice as number,
        volume: s.volume ?? 0,
      }));

    if (snapshots.length === 0) {
      return { success: true, savedCount: 0 };
    }

    await prisma.intradaySnapshot.createMany({ data: snapshots });
    log.debug(`📸 ${snapshots.length} snapshots intraday sauvegardés (${now.toISOString()})`);
    return { success: true, savedCount: snapshots.length };
  } catch (error) {
    log.error('❌ Erreur sauvegarde snapshots intraday:', error);
    throw error;
  }
}

/**
 * Purge les snapshots intraday plus vieux que `days` jours (par défaut 30).
 */
export async function purgeOldIntradaySnapshots(days: number = 30) {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const result = await prisma.intradaySnapshot.deleteMany({
    where: { timestamp: { lt: cutoff } },
  });
  log.debug(`🧹 Purge intraday: ${result.count} snapshots supprimés (avant ${cutoff.toISOString()})`);
  return result.count;
}

/**
 * Sauvegarde l'historique pour une action spécifique
 * Utile pour mise à jour manuelle
 */
export async function saveStockHistory(symbol: string, date: Date, data: {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}) {
  try {
    // Vérifier que le stock existe
    const stock = await prisma.stock.findUnique({
      where: { symbol }
    });

    if (!stock) {
      throw new Error(`Stock ${symbol} n'existe pas`);
    }

    // Normaliser la date (minuit UTC)
    const normalizedDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    // Sauvegarder avec upsert
    const history = await prisma.stockHistory.upsert({
      where: {
        stock_ticker_date: {
          stock_ticker: symbol,
          date: normalizedDate
        }
      },
      update: {
        ...data
      },
      create: {
        stockId: stock.id,
        stock_ticker: symbol,
        date: normalizedDate,
        ...data
      }
    });

    log.debug(`✅ Historique sauvegardé pour ${symbol} le ${normalizedDate.toISOString().split('T')[0]}`);
    return history;

  } catch (error) {
    log.error(`❌ Erreur sauvegarde historique ${symbol}:`, error);
    throw error;
  }
}

/**
 * Récupère l'historique pour une action
 * (Wrapper pour utiliser depuis les jobs)
 */
export async function getStockHistoryData(symbol: string, days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

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
    log.error(`❌ Erreur récupération historique ${symbol}:`, error);
    throw error;
  }
}
