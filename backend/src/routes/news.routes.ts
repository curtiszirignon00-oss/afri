// backend/src/routes/news.routes.ts
import { Router } from 'express';
import { getLatestArticle, getRecentArticles, getArticleBySlug } from '../controllers/news.controller';

const router = Router();

router.get('/',       getRecentArticles); // GET /api/news?limit=8&category=...
router.get('/latest', getLatestArticle);  // GET /api/news/latest
router.get('/:slug',  getArticleBySlug);  // GET /api/news/:slug — must be last

export default router;