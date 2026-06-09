import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Retourne un offset stable entre 90 et 100 si l'articleId correspond à un
// module d'apprentissage, sinon 0. Les 4 derniers caractères hex de l'ObjectId
// garantissent une valeur fixe mais variée par module.
function isObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

async function getModuleBaseLikes(articleId: string): Promise<number> {
  if (!isObjectId(articleId)) return 0;
  const mod = await prisma.learningModule.findUnique({
    where: { id: articleId },
    select: { id: true },
  });
  if (!mod) return 0;
  const seed = parseInt(articleId.slice(-4), 16);
  return 90 + (seed % 11); // 90–100
}

// ── Likes ─────────────────────────────────────────────────────────────────────

export async function getLikes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id: articleId } = req.params;
    const userId = req.user?.id;

    const [count, liked, baseLikes] = await Promise.all([
      prisma.articleLike.count({ where: { articleId } }),
      userId
        ? prisma.articleLike.findUnique({ where: { articleId_userId: { articleId, userId } } })
        : Promise.resolve(null),
      getModuleBaseLikes(articleId),
    ]);

    return res.json({ count: count + baseLikes, liked: !!liked });
  } catch (err) { return next(err); }
}

export async function toggleLike(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id: articleId } = req.params;
    const userId = req.user!.id;

    const [existing, baseLikes] = await Promise.all([
      prisma.articleLike.findUnique({ where: { articleId_userId: { articleId, userId } } }),
      getModuleBaseLikes(articleId),
    ]);

    if (existing) {
      await prisma.articleLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.articleLike.create({ data: { articleId, userId } });
    }

    const count = await prisma.articleLike.count({ where: { articleId } });
    return res.json({ liked: !existing, count: count + baseLikes });
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

// ── Vues ────────────────────────────────────────────────────────────────────

export async function incrementView(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id: articleId } = req.params;
    if (!articleId) return res.status(400).json({ message: 'articleId requis.' });

    const row = await prisma.articleViewCount.upsert({
      where: { articleId },
      create: { articleId, count: 1 },
      update: { count: { increment: 1 } },
    });

    return res.json({ views: row.count });
  } catch (err) { return next(err); }
}

// ── Compteurs en batch (likes + commentaires + vues) ────────────────────────

export async function batchCounts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const raw = (req.body?.ids ?? []) as unknown;
    const ids = Array.isArray(raw)
      ? raw.filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, 50)
      : [];

    if (ids.length === 0) return res.json({});

    const [likes, comments, views] = await Promise.all([
      prisma.articleLike.groupBy({
        by: ['articleId'],
        where: { articleId: { in: ids } },
        _count: { articleId: true },
      }),
      prisma.articleComment.groupBy({
        by: ['articleId'],
        where: { articleId: { in: ids } },
        _count: { articleId: true },
      }),
      prisma.articleViewCount.findMany({
        where: { articleId: { in: ids } },
        select: { articleId: true, count: true },
      }),
    ]);

    const result: Record<string, { likes: number; comments: number; views: number }> = {};
    for (const id of ids) result[id] = { likes: 0, comments: 0, views: 0 };
    for (const l of likes) result[l.articleId].likes = l._count.articleId;
    for (const c of comments) result[c.articleId].comments = c._count.articleId;
    for (const v of views) result[v.articleId].views = v.count;

    return res.json(result);
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
