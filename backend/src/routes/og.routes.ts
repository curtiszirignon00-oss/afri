// backend/src/routes/og.routes.ts
// Endpoints publics pour les images Open Graph (PNG, 1200×630)
// Accessibles sans authentification — utilisés par les crawlers sociaux.

import { Router } from 'express';
import { getStockOGImage, getBadgeOGImage, getPortfolioOGImage, getCertificateOGImage, getPageOGImage, getProfileOGImage } from '../controllers/og.controller';

const router = Router();

// GET /api/og/image/stock/:symbol
router.get('/image/stock/:symbol', getStockOGImage);

// GET /api/og/image/badge/:code
router.get('/image/badge/:code', getBadgeOGImage);

// GET /api/og/image/portfolio/:userId
router.get('/image/portfolio/:userId', getPortfolioOGImage);

// GET /api/og/image/profile/:username  (carte Passeport Investisseur ADN ; ?format=story)
router.get('/image/profile/:username', getProfileOGImage);

// GET /api/og/image/certificate/:uuid
router.get('/image/certificate/:uuid', getCertificateOGImage);

// GET /api/og/image/page/:slug  (home, markets, learn, news, glossary, indices, about, contact, help, formation, community, communities, classement, essai-gratuit)
router.get('/image/page/:slug', getPageOGImage);

export default router;
