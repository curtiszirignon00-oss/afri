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
    console.log(`✅ ${indicesData.length} indices traités par Prisma.`);
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde Prisma des indices:', error);
    throw error;
  }
}

export async function getAllIndices() {
  try {
    // Traduction de "Index.find().exec()"
    const indices = await prisma.marketIndex.findMany();
    return indices;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération Prisma des indices:', error);
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
        console.error("❌ Error fetching latest indices:", error);
        throw error;
    }
}

/**
 * Sauvegarde l'historique du jour pour tous les indices
 * Appelé à 18h après clôture BRVM (même pattern que saveCurrentDayHistory pour les stocks)
 */
export async function saveCurrentDayIndexHistory() {
    try {
        console.log('📊 Sauvegarde de l\'historique des indices du jour...');

        const indices = await scrapeIndex();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let savedCount = 0;
        let errorCount = 0;

        for (const data of indices) {
            try {
                if (!data.name || data.lastValue === null) continue;

                const existingIndex = await prisma.marketIndex.findUnique({
                    where: { index_name: data.name }
                });

                if (!existingIndex) {
                    console.log(`⚠️  Index ${data.name} n'existe pas dans la DB, ignoré`);
                    continue;
                }

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
                        marketIndexId: existingIndex.id,
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
                console.error(`❌ Erreur pour l'index ${data.name}:`, err);
            }
        }

        console.log(`📊 Historique indices - Sauvegardés: ${savedCount}, Erreurs: ${errorCount}`);
        return { success: true, savedCount, errorCount, date: today };
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de l\'historique des indices:', error);
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
        console.error(`❌ Error fetching index history for ${indexName}:`, error);
        throw error;
    }
}