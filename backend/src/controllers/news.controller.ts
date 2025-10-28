// backend/src/controllers/news.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as newsService from '../services/news.service.prisma';

export async function getLatestArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const article = await newsService.getLatestNewsArticle();
    if (!article) {
        return res.status(404).json({ message: "Aucun article trouvé." });
    }
    return res.status(200).json(article);
  } catch (error) {
    return next(error);
  }
}
// TODO: Add controller for getFeaturedNews