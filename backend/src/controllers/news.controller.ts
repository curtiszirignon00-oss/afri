// backend/src/controllers/news.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as newsService from '../services/news.service.prisma';

export async function getLatestArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const article = await newsService.getLatestNewsArticle();
    if (!article) return res.status(404).json({ message: "Aucun article trouvé." });
    return res.status(200).json(article);
  } catch (error) {
    return next(error);
  }
}

export async function getRecentArticles(req: Request, res: Response, next: NextFunction) {
  try {
    const limit    = Math.min(parseInt(String(req.query.limit ?? '8'), 10) || 8, 50);
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const ticker   = typeof req.query.ticker === 'string' ? req.query.ticker : undefined;
    const articles = await newsService.getRecentNews(limit, category, ticker);
    return res.status(200).json(articles);
  } catch (error) {
    return next(error);
  }
}

export async function getArticleBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const article = await newsService.getNewsBySlug(slug);
    if (!article) return res.status(404).json({ message: 'Article introuvable.' });
    return res.status(200).json(article);
  } catch (error) {
    return next(error);
  }
}