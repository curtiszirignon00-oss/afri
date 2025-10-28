// backend/src/routes/news.routes.ts
import { Router } from 'express';
import { getLatestArticle } from '../controllers/news.controller';

const router = Router();

router.get('/latest', getLatestArticle); // GET /api/news/latest
// TODO: Add route for featured news: router.get('/featured', getFeaturedNewsController);
// TODO: Add route for all news: router.get('/', getAllNewsController);

export default router;