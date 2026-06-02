import { log } from '../config/logger';
// backend/src/services/news.service.prisma.ts
import prisma from '../config/prisma';
import { NewsArticle } from '@prisma/client';

export async function getLatestNewsArticle(): Promise<NewsArticle | null> {
  try {
    const latestArticle = await prisma.newsArticle.findFirst({
      orderBy: {
        published_at: 'desc', // Get the most recent
      },
      // Optionally select only needed fields: select: { title: true, summary: true }
    });
    return latestArticle;
  } catch (error) {
    log.error("❌ Error fetching latest news article:", error);
    throw error;
  }
}
// TODO: Add function getFeaturedNews(limit: number) for HomePage
// backend/src/services/news.service.prisma.ts
// ... (imports et getLatestNewsArticle) ...

// Récupère les articles marqués comme "featured"
export async function getFeaturedNews(limit: number = 3): Promise<NewsArticle[]> {
  try {
    const featuredArticles = await prisma.newsArticle.findMany({
      where: { is_featured: true },
      orderBy: { published_at: 'desc' },
      take: limit,
    });
    return featuredArticles;
  } catch (error) {
    log.error("❌ Erreur récupération featured news:", error);
    throw error;
  }
}

// Mapping des slugs de la page news vers les valeurs de category stockées en DB
const CATEGORY_DB_VALUES: Record<string, string[]> = {
  analyse:    ['analyse', 'Analyse', 'Analyse Fondamentale', 'Fondamentale', 'Secteur', 'Stratégie'],
  marches:    ['marches', 'Marché', 'Marchés', 'Marche'],
  economie:   ['economie', 'Économie', 'Economie', 'Macro', 'Macroéconomie'],
  dividendes: ['dividendes', 'Dividendes', 'Dividende'],
  interview:  ['interview', 'Interview', 'Interviews'],
  resultats:  ['resultats', 'Résultats', 'Resultats'],
};

export async function getRecentNews(limit: number = 8, category?: string, ticker?: string): Promise<NewsArticle[]> {
  try {
    const where: any = {};
    if (category) {
      const mapped = CATEGORY_DB_VALUES[category];
      where.category = mapped ? { in: mapped } : category;
    }
    if (ticker) where.tickers = { has: ticker };

    const articles = await prisma.newsArticle.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { published_at: 'desc' },
      take: limit,
    });
    return articles;
  } catch (error) {
    log.error("❌ Erreur récupération recent news:", error);
    throw error;
  }
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  try {
    return await prisma.newsArticle.findFirst({ where: { slug } });
  } catch (error) {
    log.error('❌ Erreur récupération article by slug:', error);
    throw error;
  }
}