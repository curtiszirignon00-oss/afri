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
// Get latest 2 indices
export async function getLatestIndices(limit: number = 2): Promise<MarketIndex[]> {
    try {
        const indices = await prisma.marketIndex.findMany({
            orderBy: {
                date: 'desc', // Order by date to get latest first
            },
            take: limit, // Take the specified number
             distinct: ['index_name'] // Get only the latest entry for each distinct index name
        });
        // Since we order by date desc and take distinct, we might get older dates first
        // Optional: Re-sort if needed, or adjust query. For just 2, it might be okay.
        return indices;
    } catch (error) {
        console.error("❌ Error fetching latest indices:", error);
        throw error;
    }
}