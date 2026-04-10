import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { log } from '../config/logger';

interface AuthRequest extends Request {
  user?: { id: string; email: string; name: string; role?: string };
}

/**
 * POST /api/reviews — Soumettre un avis (auth requis)
 */
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' });

    const { rating, text } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Note invalide (1 à 5)' });
    }
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Texte requis' });
    }
    if (text.trim().length > 200) {
      return res.status(400).json({ success: false, message: 'Texte trop long (200 caractères max)' });
    }

    // Un seul avis par utilisateur — upsert
    const existing = await prisma.review.findFirst({ where: { userId } });
    let review;
    if (existing) {
      review = await prisma.review.update({
        where: { id: existing.id },
        data: { rating: parseInt(rating), text: text.trim(), status: 'pending' },
      });
    } else {
      review = await prisma.review.create({
        data: { userId, rating: parseInt(rating), text: text.trim() },
      });
    }

    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    log.error('Erreur createReview:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * GET /api/reviews/published — Avis publiés (public)
 */
export const getPublishedReviews = async (_req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        rating: true,
        text: true,
        created_at: true,
        user: { select: { name: true, lastname: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    const total = reviews.length;
    const avgRating =
      total > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
        : 0;

    return res.status(200).json({ success: true, data: { reviews, total, avgRating } });
  } catch (error) {
    log.error('Erreur getPublishedReviews:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * GET /api/reviews — Tous les avis (admin)
 */
export const getAllReviews = async (req: AuthRequest, res: Response) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { role: true },
    });
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin uniquement' });
    }

    const status = (req.query.status as string) || 'pending';
    const reviews = await prisma.review.findMany({
      where: status === 'all' ? {} : { status },
      select: {
        id: true,
        rating: true,
        text: true,
        status: true,
        created_at: true,
        user: { select: { id: true, name: true, lastname: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    log.error('Erreur getAllReviews:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * PATCH /api/reviews/:id/status — Publier ou rejeter un avis (admin)
 */
export const updateReviewStatus = async (req: AuthRequest, res: Response) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { role: true },
    });
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin uniquement' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['published', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    const review = await prisma.review.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    log.error('Erreur updateReviewStatus:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
