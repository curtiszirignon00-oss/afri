import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { log } from '../config/logger';
import { notifyAllUsersOfNewArticle } from '../services/notification.service';

interface AuthRequest extends Request {
  user?: { id: string; email: string; name: string; role?: string };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function listAdminArticles(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(50, parseInt(String(req.query.limit ?? '20'), 10));
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      prisma.newsArticle.findMany({
        orderBy: { published_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          category: true,
          author: true,
          tickers: true,
          is_featured: true,
          published_at: true,
          created_at: true,
          updated_at: true,
        },
      }),
      prisma.newsArticle.count(),
    ]);

    return res.json({ articles, total, page, limit });
  } catch (err) {
    return next(err);
  }
}

export async function getAdminArticle(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const article = await prisma.newsArticle.findUnique({ where: { id } });
    if (!article) return res.status(404).json({ message: 'Article introuvable.' });
    return res.json(article);
  } catch (err) {
    return next(err);
  }
}

export async function createAdminArticle(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const {
      title, summary, content, rich_content, tickers,
      category, author, source, country, sector,
      image_url, is_featured, published_at,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Le titre est requis.' });
    }

    const slug = slugify(title);

    const article = await prisma.newsArticle.create({
      data: {
        title: title.trim(),
        slug,
        summary: summary?.trim() ?? null,
        content: content?.trim() ?? null,
        rich_content: rich_content ? JSON.stringify(rich_content) : null,
        tickers: Array.isArray(tickers) ? tickers.map((t: any) => t.ticker) : [],
        category: category?.trim() ?? null,
        author: author?.trim() ?? null,
        source: source?.trim() ?? null,
        country: country?.trim() ?? null,
        sector: sector?.trim() ?? null,
        image_url: image_url?.trim() ?? null,
        is_featured: Boolean(is_featured),
        published_at: published_at ? new Date(published_at) : new Date(),
      },
    });

    log.info(`[Admin] Article créé: ${article.id} "${article.title}"`);

    // Notifier tous les utilisateurs (non bloquant pour la réponse)
    notifyAllUsersOfNewArticle(article.id, article.title, article.slug, article.category)
      .then(n => log.info(`[Admin] ${n} notifications envoyées pour l'article ${article.id}`))
      .catch(err => log.warn({ err }, `[Admin] Échec notifications article ${article.id}`));

    return res.status(201).json(article);
  } catch (err) {
    return next(err);
  }
}

export async function updateAdminArticle(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const {
      title, summary, content, rich_content, tickers,
      category, author, source, country, sector,
      image_url, is_featured, published_at,
    } = req.body;

    const existing = await prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Article introuvable.' });

    const slug = title ? slugify(title) : existing.slug;

    const article = await prisma.newsArticle.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim(), slug }),
        ...(summary !== undefined && { summary: summary?.trim() ?? null }),
        ...(content !== undefined && { content: content?.trim() ?? null }),
        ...(rich_content !== undefined && { rich_content: rich_content ? JSON.stringify(rich_content) : null }),
        ...(tickers !== undefined && { tickers: Array.isArray(tickers) ? tickers.map((t: any) => t.ticker) : [] }),
        ...(category !== undefined && { category: category?.trim() ?? null }),
        ...(author !== undefined && { author: author?.trim() ?? null }),
        ...(source !== undefined && { source: source?.trim() ?? null }),
        ...(country !== undefined && { country: country?.trim() ?? null }),
        ...(sector !== undefined && { sector: sector?.trim() ?? null }),
        ...(image_url !== undefined && { image_url: image_url?.trim() ?? null }),
        ...(is_featured !== undefined && { is_featured: Boolean(is_featured) }),
        ...(published_at !== undefined && { published_at: new Date(published_at) }),
      },
    });

    log.info(`[Admin] Article mis à jour: ${article.id}`);
    return res.json(article);
  } catch (err) {
    return next(err);
  }
}

export async function uploadArticleCover(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni.' });
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const url = `${baseUrl}/uploads/posts/${req.file.filename}`;
    return res.json({ url });
  } catch (err) {
    return next(err);
  }
}

export async function deleteAdminArticle(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const existing = await prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Article introuvable.' });

    await prisma.newsArticle.delete({ where: { id } });
    log.info(`[Admin] Article supprimé: ${id}`);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}
