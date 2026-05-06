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

export async function getRecentNews(limit: number = 8, category?: string): Promise<NewsArticle[]> {
  try {
    const articles = await prisma.newsArticle.findMany({
      where: category ? { category } : undefined,
      orderBy: { published_at: 'desc' },
      take: limit,
    });
    return articles;
  } catch (error) {
    log.error("❌ Erreur récupération recent news:", error);
    throw error;
  }
}