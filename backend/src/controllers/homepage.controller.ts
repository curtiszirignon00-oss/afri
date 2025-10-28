// backend/src/controllers/homepage.controller.ts

import { Request, Response, NextFunction } from "express";
import * as stockService from "../services/stock.service.prisma";
import * as indexService from "../services/index.service.prisma";
import * as newsService from "../services/news.service.prisma";
// Importe le service news (on devra le créer/vérifier)
// import * as newsService from "../services/news.service.prisma"; 

export async function getHomepageData(req: Request, res: Response, next: NextFunction) {
  try {
    // Lance tous les appels en parallèle
    const [indices, topStocks, featuredNews ] = await Promise.all([ // <-- AJOUTER featuredNews
      indexService.getAllIndices(),
      stockService.getTopStocks(6),
      newsService.getFeaturedNews(3), // <-- AJOUTER Appel service news (3 articles)
    ]);

    // Renvoie toutes les données
    return res.status(200).json({
      indices: indices || [],
      topStocks: topStocks || [],
      featuredNews: featuredNews || [] // <-- AJOUTER News à la réponse
    });

  } catch (error) {
    return next(error);
  }
}