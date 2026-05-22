import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

// ── Likes ─────────────────────────────────────────────────────────────────────

export async function getLikes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id: articleId } = req.params;
    const userId = req.user?.id;

    const [count, liked] = await Promise.all([
      prisma.articleLike.count({ where: { articleId } }),
      userId
        ? prisma.articleLike.findUnique({ where: { articleId_userId: { articleId, userId } } })
        : Promise.resolve(null),
    ]);

    return res.json({ count, liked: !!liked });
  } catch (err) { return next(err); }
}

export async function toggleLike(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id: articleId } = req.params;
    const userId = req.user!.id;

    const existing = await prisma.articleLike.findUnique({
      where: { articleId_userId: { articleId, userId } },
    });

    if (existing) {
      await prisma.articleLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.articleLike.create({ data: { articleId, userId } });
    }

    const count = await prisma.articleLike.count({ where: { articleId } });
    return res.json({ liked: !existing, count });
  } catch (err) { return next(err); }
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function getComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id: articleId } = req.params;

    const comments = await prisma.articleComment.findMany({
      where: { articleId },
      orderBy: { created_at: 'asc' },
      include: {
        user: { select: { id: true, name: true, lastname: true } },
      },
    });

    return res.json(comments);
  } catch (err) { return next(err); }
}

export async function addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id: articleId } = req.params;
    const userId = req.user!.id;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: 'Le commentaire ne peut pas être vide.' });
    }
    if (text.trim().length > 1000) {
      return res.status(400).json({ message: 'Commentaire trop long (max 1000 caractères).' });
    }

    const comment = await prisma.articleComment.create({
      data: { articleId, userId, text: text.trim() },
      include: {
        user: { select: { id: true, name: true, lastname: true } },
      },
    });

    return res.status(201).json(comment);
  } catch (err) { return next(err); }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { commentId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const comment = await prisma.articleComment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ message: 'Commentaire introuvable.' });

    if (comment.userId !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé.' });
    }

    await prisma.articleComment.delete({ where: { id: commentId } });
    return res.json({ success: true });
  } catch (err) { return next(err); }
}
