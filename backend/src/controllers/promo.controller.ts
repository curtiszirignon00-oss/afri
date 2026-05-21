import { Response } from 'express';
import { prisma } from '../config/database';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

const PLAN_PRICES: Record<string, number> = {
  'investisseur-plus': 9900,
  'pro': 300000,
};

// GET /api/promo/check?planId=investisseur-plus
export async function checkPromo(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Non authentifié' });

  const planId = req.query.planId as string;
  if (!planId) return res.status(400).json({ error: 'planId requis' });

  const promo = await prisma.userPromo.findFirst({
    where: { userId, planId, expiresAt: { gt: new Date() } },
  });

  if (!promo || promo.usedCount >= promo.maxUses) {
    return res.json({ hasDiscount: false });
  }

  const originalAmount = PLAN_PRICES[planId];
  if (!originalAmount) return res.json({ hasDiscount: false });

  const discountedAmount = Math.round(originalAmount * (1 - promo.discountPercent / 100));

  return res.json({
    hasDiscount: true,
    discountPercent: promo.discountPercent,
    originalAmount,
    discountedAmount,
    usedCount: promo.usedCount,
    maxUses: promo.maxUses,
    remainingUses: promo.maxUses - promo.usedCount,
    expiresAt: promo.expiresAt,
  });
}
