// backend/src/routes/news.routes.ts
import { Router } from 'express';
import { getLatestArticle, getRecentArticles } from '../controllers/news.controller';

const router = Router();

router.get('/',       getRecentArticles); // GET /api/news?limit=8&category=...
router.get('/latest', getLatestArticle);  // GET /api/news/latest

export default router;