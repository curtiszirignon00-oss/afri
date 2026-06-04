import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import logger from '../config/logger';

const PACK_REFERRAL_DISCOUNT_PRICE = 24500;
const PACK_REFERRAL_ORIGINAL_PRICE = 35000;

// ─── GET /api/pack-referral/check?code= ──────────────────────────────────────
// Public — valide un code et retourne les infos de réduction
export async function checkReferralCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.query as { code?: string };
    if (!code) return res.status(400).json({ valid: false, message: 'Code manquant.' });

    const referralCode = await prisma.packReferralCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!referralCode || referralCode.status !== 'active' || referralCode.expiresAt < new Date()) {
      return res.json({ valid: false });
    }

    // Incrémenter le compteur de clics (fire-and-forget)
    prisma.packReferralCode.update({
      where: { id: referralCode.id },
      data: { totalClicks: { increment: 1 } },
    }).catch(() => {});

    return res.json({
      valid: true,
      discountedPrice: PACK_REFERRAL_DISCOUNT_PRICE,
      originalPrice: PACK_REFERRAL_ORIGINAL_PRICE,
    });
  } catch (error) {
    return next(error);
  }
}

// ─── GET /api/pack-referral/my-stats ─────────────────────────────────────────
// Auth requis — retourne le code et les stats de l'ambassadeur connecté
export async function getAmbassadorStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Non authentifié.' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPackParticipant: true, bonusAccompagnementMonths: true },
    });

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    const referralCode = await prisma.packReferralCode.findFirst({
      where: { referrerId: userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    if (!referralCode) {
      return res.json({
        hasCode: false,
        isPackParticipant: user.isPackParticipant,
        bonusAccompagnementMonths: user.bonusAccompagnementMonths,
      });
    }

    const referrals = await prisma.packReferral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      select: { refereeEmail: true, status: true, purchasedAt: true, createdAt: true },
    });

    const baseUrl = process.env.FRONTEND_URL ?? 'https://afribourse.com';
    return res.json({
      hasCode: true,
      isPackParticipant: user.isPackParticipant,
      code: referralCode.code,
      link: `${baseUrl}/parcours?ref=${referralCode.code}`,
      status: referralCode.status,
      expiresAt: referralCode.expiresAt,
      totalClicks: referralCode.totalClicks,
      totalPurchases: referralCode.totalPurchases,
      bonusMonthsEarned: referralCode.bonusMonthsEarned,
      bonusAccompagnementMonths: user.bonusAccompagnementMonths,
      referrals,
    });
  } catch (error) {
    return next(error);
  }
}

// ─── POST /api/admin/referrals/create ────────────────────────────────────────
// Admin — crée manuellement un code ambassadeur pour un participant
export async function adminCreateReferralCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, userId: targetUserId } = req.body;
    if (!email && !targetUserId) {
      return res.status(400).json({ message: 'email ou userId requis.' });
    }

    const user = await prisma.user.findFirst({
      where: email ? { email } : { id: targetUserId },
      select: { id: true, email: true, isPackParticipant: true },
    });

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    // Tolérance admin : pas besoin que isPackParticipant soit true pour forcer la création
    // Vérifier si code actif non expiré déjà attribué
    const existing = await prisma.packReferralCode.findFirst({
      where: { referrerId: user.id, status: 'active', expiresAt: { gt: new Date() } },
    });

    if (existing) {
      const baseUrl = process.env.FRONTEND_URL ?? 'https://afribourse.com';
      return res.json({
        message: 'Code ambassadeur déjà actif.',
        code: existing.code,
        link: `${baseUrl}/parcours?ref=${existing.code}`,
        expiresAt: existing.expiresAt,
        alreadyExisted: true,
      });
    }

    const code = await generateUniqueCode();
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // +60 jours

    const created = await prisma.packReferralCode.create({
      data: { referrerId: user.id, code, expiresAt },
    });

    // Marquer isPackParticipant si pas encore fait
    if (!user.isPackParticipant) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isPackParticipant: true },
      });
    }

    const baseUrl = process.env.FRONTEND_URL ?? 'https://afribourse.com';
    logger.info({ userId: user.id, email: user.email, code }, '[REFERRAL] Code ambassadeur créé par admin');

    return res.status(201).json({
      code: created.code,
      link: `${baseUrl}/parcours?ref=${created.code}`,
      expiresAt: created.expiresAt,
      alreadyExisted: false,
    });
  } catch (error) {
    return next(error);
  }
}

// ─── GET /api/admin/referrals ─────────────────────────────────────────────────
// Admin — liste tous les codes + parrainages avec emails
export async function adminListReferrals(req: Request, res: Response, next: NextFunction) {
  try {
    const codes = await prisma.packReferralCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        referrer: { select: { email: true, name: true } },
        referrals: { select: { refereeEmail: true, status: true, purchasedAt: true, discountApplied: true } },
      },
    });

    const baseUrl = process.env.FRONTEND_URL ?? 'https://afribourse.com';
    const data = codes.map((c) => ({
      id: c.id,
      code: c.code,
      link: `${baseUrl}/parcours?ref=${c.code}`,
      referrerEmail: c.referrer.email,
      referrerName: c.referrer.name,
      status: c.status,
      expiresAt: c.expiresAt,
      totalClicks: c.totalClicks,
      totalPurchases: c.totalPurchases,
      bonusMonthsEarned: c.bonusMonthsEarned,
      createdAt: c.createdAt,
      referrals: c.referrals,
    }));

    return res.json({ data, total: data.length });
  } catch (error) {
    return next(error);
  }
}

// ─── PATCH /api/admin/referrals/:codeId/status ───────────────────────────────
// Admin — pause ou réactive un code
export async function adminUpdateReferralStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { codeId } = req.params;
    const { status } = req.body;

    if (!['active', 'paused'].includes(status)) {
      return res.status(400).json({ message: 'Status invalide. Valeurs acceptées : active, paused.' });
    }

    const updated = await prisma.packReferralCode.update({
      where: { id: codeId },
      data: { status },
    });

    logger.info({ codeId, status }, '[REFERRAL] Statut code ambassadeur mis à jour');
    return res.json({ id: updated.id, code: updated.code, status: updated.status });
  } catch (error) {
    return next(error);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateUniqueCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0,O,I,1)
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const exists = await prisma.packReferralCode.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error('Impossible de générer un code unique après 10 tentatives.');
}
