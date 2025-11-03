// backend/src/services/index.service.ts

import prisma from '../config/prisma';
import { IndexData } from './scraping.service'; // On importe le type du scraper
import { MarketIndex } from '@prisma/client'; // Ensure type is imported

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