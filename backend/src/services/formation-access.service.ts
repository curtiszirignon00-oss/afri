// backend/src/services/formation-access.service.ts
//
// Contrôle d'accès SERVEUR aux modules payants de l'Académie (« Formation Complète »,
// achat unique planId 'premium-modules' → subscriptionTier 'formation').
// Doit rester aligné avec afribourse/src/config/formation.ts (FORMATION_PREMIUM_FROM_INDEX).
//
// ⚠️ Ne PAS se fier à req.user.subscriptionTier : les middlewares auth/optionalAuth le
// forcent à 'premium' pour tout utilisateur connecté. On relit la valeur réelle en base.

import { prisma } from '../config/database';

/** Premier order_index payant : modules 0–8 gratuits, 9–19 dans la Formation Complète. */
export const FORMATION_PREMIUM_FROM_INDEX = 9;

/** Abonnements / achats qui débloquent les modules payants. */
export const FORMATION_UNLOCK_TIERS = ['premium', 'max', 'pro', 'formation'];

export const FORMATION_REQUIRED_CODE = 'FORMATION_REQUIRED';

export interface FormationAccess {
  unlocked: boolean;
  /** Modules déjà terminés (avant la mise en place du paywall) : restent lisibles. */
  completedModuleIds: Set<string>;
}

const NO_ACCESS: FormationAccess = { unlocked: false, completedModuleIds: new Set() };

export function isPremiumModule(orderIndex: number | null | undefined): boolean {
  return (orderIndex ?? 0) >= FORMATION_PREMIUM_FROM_INDEX;
}

export async function getFormationAccess(userId?: string | null): Promise<FormationAccess> {
  if (!userId) return NO_ACCESS;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, role: true },
  });
  if (!user) return NO_ACCESS;

  const unlocked = user.role === 'admin' || FORMATION_UNLOCK_TIERS.includes(user.subscriptionTier ?? 'free');
  if (unlocked) return { unlocked: true, completedModuleIds: new Set() };

  const done = await prisma.learningProgress.findMany({
    where: { userId, is_completed: true },
    select: { moduleId: true },
  });
  return { unlocked: false, completedModuleIds: new Set(done.map((d) => d.moduleId)) };
}

export function canReadModule(
  module: { id: string; order_index?: number | null },
  access: FormationAccess,
): boolean {
  if (!isPremiumModule(module.order_index)) return true;
  return access.unlocked || access.completedModuleIds.has(module.id);
}

/** Copie du module sans aucun contenu exploitable (titre, description, durée restent visibles). */
export function lockModule<T extends Record<string, any>>(module: T): T & { locked: true } {
  return {
    ...module,
    content: null,
    content_json: null,
    video_url: null,
    audio_url: null,
    attachment_url: null,
    dashboard_url: null,
    locked: true,
  };
}

export const FORMATION_REQUIRED_MESSAGE =
  'Ce module fait partie de la Formation Complète. Débloquez-la pour y accéder.';
