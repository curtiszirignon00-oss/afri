// backend/src/routes/og.routes.ts
// Endpoints publics pour les images Open Graph (PNG, 1200×630)
// Accessibles sans authentification — utilisés par les crawlers sociaux.

import { Router } from 'express';
import { getStockOGImage, getBadgeOGImage, getPortfolioOGImage, getCertificateOGImage } from '../controllers/og.controller';

const router = Router();

// GET /api/og/image/stock/:symbol
router.get('/image/stock/:symbol', getStockOGImage);

// GET /api/og/image/badge/:code
router.get('/image/badge/:code', getBadgeOGImage);

// GET /api/og/image/portfolio/:userId
router.get('/image/portfolio/:userId', getPortfolioOGImage);

// GET /api/og/image/certificate/:uuid
router.get('/image/certificate/:uuid', getCertificateOGImage);

export default router;
