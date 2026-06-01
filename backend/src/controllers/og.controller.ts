// backend/src/controllers/og.controller.ts

import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import {
  buildStockSVG, buildBadgeSVG, buildPortfolioSVG, buildPageSVG, svgToPng,
  PAGE_CONFIGS,
  type StockOGData, type BadgeOGData, type PortfolioOGData,
} from '../services/og-image.service';
import { generateCertificateOGPng } from '../services/certificate-image.service';

// Simple in-memory cache (Buffer + expiry). Avoids Redis for binary blobs.
interface CacheEntry { buf: Buffer; expiresAt: number }
const imageCache = new Map<string, CacheEntry>();

function cacheGet(key: string): Buffer | null {
  const entry = imageCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { imageCache.delete(key); return null; }
  return entry.buf;
}

function cacheSet(key: string, buf: Buffer, ttlSeconds: number): void {
  imageCache.set(key, { buf, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function sendPng(res: Response, buf: Buffer, maxAge: number): void {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=60`);
  res.setHeader('Content-Length', buf.length);
  res.end(buf);
}

// ─── GET /api/og/image/stock/:symbol ─────────────────────────────────────────

export async function getStockOGImage(req: Request, res: Response, next: NextFunction) {
  try {
    const symbol = req.params.symbol?.toUpperCase();
    if (!symbol) return res.status(400).json({ error: 'Symbol requis' });

    const cacheKey = `og:stock:${symbol}`;
    const cached = cacheGet(cacheKey);
    if (cached) return sendPng(res, cached, 300);

    const stock = await prisma.stock.findUnique({ where: { symbol } });
    if (!stock) return res.status(404).json({ error: 'Action non trouvée' });

    const data: StockOGData = {
      symbol: stock.symbol,
      companyName: stock.company_name,
      currentPrice: stock.current_price,
      dailyChangePercent: stock.daily_change_percent,
      sector: stock.sector,
    };

    const svg = buildStockSVG(data);
    const png = await svgToPng(svg);
    cacheSet(cacheKey, png, 300); // 5 min

    return sendPng(res, png, 300);
  } catch (err) {
    return next(err);
  }
}

// ─── GET /api/og/image/badge/:code ───────────────────────────────────────────

export async function getBadgeOGImage(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.params.code?.toLowerCase();
    if (!code) return res.status(400).json({ error: 'Code badge requis' });

    const cacheKey = `og:badge:${code}`;
    const cached = cacheGet(cacheKey);
    if (cached) return sendPng(res, cached, 3600);

    const achievement = await prisma.achievement.findUnique({ where: { code } });
    if (!achievement) return res.status(404).json({ error: 'Badge non trouvé' });

    const data: BadgeOGData = {
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      rarity: achievement.rarity,
      xpReward: achievement.xp_reward,
      category: achievement.category,
    };

    const svg = buildBadgeSVG(data);
    const png = await svgToPng(svg);
    cacheSet(cacheKey, png, 3600); // 1 hour

    return sendPng(res, png, 3600);
  } catch (err) {
    return next(err);
  }
}

// ─── GET /api/og/image/portfolio/:userId ─────────────────────────────────────
// Only returns a generic portfolio card (no private financial data exposed).

export async function getPortfolioOGImage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ error: 'userId requis' });

    const cacheKey = `og:portfolio:${userId}`;
    const cached = cacheGet(cacheKey);
    if (cached) return sendPng(res, cached, 300);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        portfolios: {
          select: { cash_balance: true, initial_balance: true },
          take: 1,
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const balance = user.portfolios?.[0]?.cash_balance ?? 0;

    const data: PortfolioOGData = {
      displayName: user.name ?? 'Investisseur',
      totalValue: balance,
      gainLossPercent: 0,
      period: 'Portefeuille simulé',
    };

    const svg = buildPortfolioSVG(data);
    const png = await svgToPng(svg);
    cacheSet(cacheKey, png, 300);

    return sendPng(res, png, 300);
  } catch (err) {
    return next(err);
  }
}

// ─── GET /api/og/image/page/:slug ────────────────────────────────────────────

export async function getPageOGImage(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug?.toLowerCase();
    if (!slug) return res.status(400).json({ error: 'Slug requis' });

    const config = PAGE_CONFIGS[slug];
    if (!config) return res.status(404).json({ error: 'Page non trouvée' });

    const cacheKey = `og:page:${slug}`;
    const cached = cacheGet(cacheKey);
    if (cached) return sendPng(res, cached, 86400);

    const svg = buildPageSVG(config);
    const png = await svgToPng(svg);
    cacheSet(cacheKey, png, 86400); // 24h — contenu statique

    return sendPng(res, png, 86400);
  } catch (err) {
    return next(err);
  }
}

// ─── GET /api/og/image/certificate/:uuid ─────────────────────────────────────

export async function getCertificateOGImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { uuid } = req.params;
    if (!uuid) return res.status(400).json({ error: 'UUID requis' });

    const cacheKey = `og:certificate:${uuid}`;
    const cached = cacheGet(cacheKey);
    if (cached) return sendPng(res, cached, 86400);

    const cert = await prisma.certificate.findUnique({
      where: { id: uuid },
      include: { module: true },
    });

    if (!cert || cert.status === 'revoked') return res.status(404).json({ error: 'Certificat introuvable' });

    const png = await generateCertificateOGPng({
      participantName: cert.participantName,
      moduleName: cert.module.name,
      moduleSubtitle: cert.module.subtitle,
      webinarDate: cert.webinarDate,
      issuedAt: cert.issuedAt,
    });

    cacheSet(cacheKey, png, 86400); // 24h
    return sendPng(res, png, 86400);
  } catch (err) {
    return next(err);
  }
}
