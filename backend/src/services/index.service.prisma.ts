import { log } from '../config/logger';
// backend/src/services/index.service.ts

import prisma from '../config/prisma';
import { IndexData, scrapeIndex } from './scraping.service';
import { MarketIndex } from '@prisma/client';

export async function saveIndices(indicesData: IndexData[]) {
  try {
    for (const data of indicesData) {
      if (!data.name || data.lastValue === null) continue;
      
      await prisma.marketIndex.upsert({
        where: { index_name: data.name }, // Notre schéma utilise "index_name"
        update: {
          index_value: data.lastValue,
          daily_change_percent: data.change ?? 0,
          date: new Date(),
        },
        create: {
          index_name: data.name,
          index_value: data.lastValue,
          daily_change_percent: data.change ?? 0,
          date: new Date(),
        }
      });
    }
    log.debug(`✅ ${indicesData.length} indices traités par Prisma.`);
  } catch (error) {
    log.error('❌ Erreur lors de la sauvegarde Prisma des indices:', error);
    throw error;
  }
}

const EXCLUDED_INDICES = ['SIKA TOTAL RETURN', 'IKAFINANCE'];

export async function getAllIndices() {
  try {
    const indices = await prisma.marketIndex.findMany({
      where: {
        index_name: {
          notIn: EXCLUDED_INDICES,
        }
      }
    });
    return indices;
  } catch (error) {
    log.error('❌ Erreur lors de la récupération Prisma des indices:', error);
    throw error;
  }
}
// Get latest main indices (BRVM 30 and BRVM COMPOSITE only)
export async function getLatestIndices(limit: number = 2): Promise<MarketIndex[]> {
    try {
        const indices = await prisma.marketIndex.findMany({
            where: {
                index_name: {
                    in: ['BRVM 30', 'BRVM COMPOSITE'] // Filter for main BRVM indices only
                }
            },
            orderBy: {
                date: 'desc', // Order by date to get latest first
            },
            take: limit, // Take the specified number
        });
        return indices;
    } catch (error) {
        log.error("❌ Error fetching latest indices:", error);
        throw error;
    }
}

/**
 * Sauvegarde l'historique du jour pour tous les indices
 * Appelé à 18h après clôture BRVM (même pattern que saveCurrentDayHistory pour les stocks)
 */
export async function saveCurrentDayIndexHistory() {
    try {
        log.debug('📊 Sauvegarde de l\'historique des indices du jour...');

        const indices = await scrapeIndex();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let savedCount = 0;
        let errorCount = 0;

        log.debug(`📋 ${indices.length} indices récupérés du scraper`);
        indices.forEach(d => log.debug(`   → "${d.name}" | lastValue=${d.lastValue} | open=${d.opening} | high=${d.high} | low=${d.low} | change=${d.change}`));

        for (const data of indices) {
            try {
                if (!data.name || data.lastValue === null) {
                    log.debug(`⏭️  Ignoré (nom vide ou valeur nulle): "${data.name}"`);
                    continue;
                }

                // Upsert dans MarketIndex pour s'assurer que l'entrée existe
                const marketIndex = await prisma.marketIndex.upsert({
                    where: { index_name: data.name },
                    update: {
                        index_value: data.lastValue,
                        daily_change_percent: data.change ?? 0,
                        date: new Date(),
                    },
                    create: {
                        index_name: data.name,
                        index_value: data.lastValue,
                        daily_change_percent: data.change ?? 0,
                        date: new Date(),
                    }
                });

                const open = data.opening ?? data.lastValue;
                const high = data.high ?? data.lastValue;
                const low = data.low ?? data.lastValue;
                const close = data.lastValue;

                await prisma.marketIndexHistory.upsert({
                    where: {
                        index_name_date: {
                            index_name: data.name,
                            date: today
                        }
                    },
                    update: {
                        open,
                        high,
                        low,
                        close,
                        daily_change_percent: data.change ?? 0,
                    },
                    create: {
                        marketIndexId: marketIndex.id,
                        index_name: data.name,
                        date: today,
                        open,
                        high,
                        low,
                        close,
                        daily_change_percent: data.change ?? 0,
                    }
                });

                savedCount++;
            } catch (err) {
                errorCount++;
                log.error(`❌ Erreur pour l'index ${data.name}:`, err);
            }
        }

        log.debug(`📊 Historique indices - Sauvegardés: ${savedCount}, Erreurs: ${errorCount}`);
        return { success: true, savedCount, errorCount, date: today };
    } catch (error) {
        log.error('❌ Erreur lors de la sauvegarde de l\'historique des indices:', error);
        throw error;
    }
}

/**
 * Récupère l'historique d'un indice par nom et période
 */
export async function getIndexHistory(indexName: string, period?: string) {
    try {
        let dateFilter: Date | undefined;

        if (period) {
            const now = new Date();
            switch (period) {
                case '1M':
                    dateFilter = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case '3M':
                    dateFilter = new Date(now.setMonth(now.getMonth() - 3));
                    break;
                case '6M':
                    dateFilter = new Date(now.setMonth(now.getMonth() - 6));
                    break;
                case '1Y':
                    dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
                case 'ALL':
                default:
                    dateFilter = undefined;
                    break;
            }
        }

        const history = await prisma.marketIndexHistory.findMany({
            where: {
                index_name: indexName,
                ...(dateFilter ? { date: { gte: dateFilter } } : {}),
            },
            orderBy: { date: 'asc' },
        });

        return history;
    } catch (error) {
        log.error(`❌ Error fetching index history for ${indexName}:`, error);
        throw error;
    }
}