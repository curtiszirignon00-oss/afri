// backend/src/middlewares/level.middleware.ts
// Middleware pour vérifier le niveau utilisateur et les fonctionnalités débloquées

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { LEVEL_FEATURES } from '../types/gamification.types';

// ============= TYPES =============

interface LevelRequirement {
    minLevel: number;
    feature: string;
    description: string;
}

// ============= FEATURE REQUIREMENTS =============

/**
 * Liste des fonctionnalités avec leur niveau minimum requis
 */
export const FEATURE_REQUIREMENTS: Record<string, LevelRequirement> = {
    // Alertes de prix
    EXTRA_ALERTS: {
        minLevel: 10,
        feature: 'extra_alerts',
        description: '3 alertes de prix supplémentaires'
    },
    // Watchlist étendue
    EXTRA_WATCHLIST: {
        minLevel: 15,
        feature: 'extra_watchlist',
        description: '3 actions supplémentaires en watchlist'
    },
    // Comparateur étendu
    EXTRA_COMPARATOR: {
        minLevel: 20,
        feature: 'extra_comparator',
        description: '1 action supplémentaire dans le comparateur'
    },
    // Création de communauté
    CREATE_COMMUNITY: {
        minLevel: 30,
        feature: 'create_community',
        description: 'Créer une communauté'
    },
    // Badge vérifié
    VERIFIED_BADGE: {
        minLevel: 40,
        feature: 'verified_badge',
        description: 'Badge investisseur vérifié'
    },
    // Webinaires premium
    PREMIUM_WEBINARS: {
        minLevel: 50,
        feature: 'premium_webinars',
        description: 'Accès aux webinaires premium'
    },
    // Second simulateur
    SECOND_SIMULATOR: {
        minLevel: 65,
        feature: 'second_simulator',
        description: 'Second portefeuille simulateur de 1M FCFA'
    },
    // Bonus simulateur 10M
    BONUS_SIMULATOR: {
        minLevel: 80,
        feature: 'bonus_simulator',
        description: 'Bonus de 10M FCFA sur le simulateur'
    }
};

// ============= HELPER FUNCTIONS =============

/**
 * Récupère le niveau actuel d'un utilisateur
 */
async function getUserLevel(userId: string): Promise<number> {
    const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { level: true }
    });

    return profile?.level || 1;
}

/**
 * Vérifie si une fonctionnalité est débloquée pour un niveau donné
 */
export function isFeatureUnlocked(featureKey: string, userLevel: number): boolean {
    const requirement = FEATURE_REQUIREMENTS[featureKey];
    if (!requirement) {
        return true; // Fonctionnalité non listée = accessible à tous
    }

    return userLevel >= requirement.minLevel;
}

/**
 * Récupère toutes les fonctionnalités débloquées pour un niveau
 */
export function getUnlockedFeatures(userLevel: number): string[] {
    const unlocked: string[] = [];

    for (const [key, requirement] of Object.entries(FEATURE_REQUIREMENTS)) {
        if (userLevel >= requirement.minLevel) {
            unlocked.push(requirement.feature);
        }
    }

    return unlocked;
}

/**
 * Récupère la prochaine fonctionnalité à débloquer
 */
export function getNextFeatureToUnlock(userLevel: number): LevelRequirement | null {
    let nextFeature: LevelRequirement | null = null;
    let minLevelDiff = Infinity;

    for (const requirement of Object.values(FEATURE_REQUIREMENTS)) {
        if (requirement.minLevel > userLevel) {
            const diff = requirement.minLevel - userLevel;
            if (diff < minLevelDiff) {
                minLevelDiff = diff;
                nextFeature = requirement;
            }
        }
    }

    return nextFeature;
}

// ============= MIDDLEWARES =============

/**
 * Middleware factory pour vérifier le niveau minimum requis
 * @param featureKey - Clé de la fonctionnalité à vérifier
 */
export function requireLevel(featureKey: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Non authentifié'
                });
            }

            const requirement = FEATURE_REQUIREMENTS[featureKey];

            if (!requirement) {
                // Fonctionnalité non listée, accès autorisé
                return next();
            }

            const userLevel = await getUserLevel(userId);

            if (userLevel < requirement.minLevel) {
                return res.status(403).json({
                    success: false,
                    message: `Cette fonctionnalité nécessite le niveau ${requirement.minLevel}`,
                    error: 'LEVEL_REQUIRED',
                    details: {
                        currentLevel: userLevel,
                        requiredLevel: requirement.minLevel,
                        feature: requirement.feature,
                        description: requirement.description
                    }
                });
            }

            // Niveau suffisant, continuer
            return next();

        } catch (error) {
            console.error('Erreur middleware niveau:', error);
            return next(error);
        }
    };
}

/**
 * Middleware pour ajouter les infos de niveau à la requête
 * Enrichit req.user avec les données de niveau
 */
export async function attachLevelInfo(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return next();
        }

        const profile = await prisma.userProfile.findUnique({
            where: { userId },
            select: {
                level: true,
                total_xp: true
            }
        });

        if (profile) {
            // Enrichir l'objet user avec les infos de niveau
            (req as any).userLevel = {
                level: profile.level,
                totalXP: profile.total_xp,
                unlockedFeatures: getUnlockedFeatures(profile.level),
                nextFeature: getNextFeatureToUnlock(profile.level)
            };
        }

        return next();

    } catch (error) {
        console.error('Erreur attachLevelInfo:', error);
        return next();
    }
}

// ============= FEATURE LIMITS =============

/**
 * Calcule les limites basées sur le niveau pour différentes fonctionnalités
 */
export function getFeatureLimits(userLevel: number): Record<string, number> {
    const limits: Record<string, number> = {
        // Limites de base
        price_alerts: 5,
        watchlist_items: 10,
        comparator_stocks: 3,
        portfolios: 1
    };

    // Bonus niveau 10: +3 alertes
    if (userLevel >= 10) {
        limits.price_alerts += 3;
    }

    // Bonus niveau 15: +3 watchlist
    if (userLevel >= 15) {
        limits.watchlist_items += 3;
    }

    // Bonus niveau 20: +1 comparateur
    if (userLevel >= 20) {
        limits.comparator_stocks += 1;
    }

    // Bonus niveau 65: second portfolio
    if (userLevel >= 65) {
        limits.portfolios += 1;
    }

    return limits;
}

/**
 * Vérifie si l'utilisateur peut créer un nouvel élément basé sur les limites
 */
export async function canCreateItem(
    userId: string,
    itemType: 'price_alerts' | 'watchlist_items' | 'comparator_stocks' | 'portfolios',
    currentCount: number
): Promise<{ allowed: boolean; limit: number; current: number }> {
    const userLevel = await getUserLevel(userId);
    const limits = getFeatureLimits(userLevel);
    const limit = limits[itemType] || 0;

    return {
        allowed: currentCount < limit,
        limit,
        current: currentCount
    };
}

// ============= LEVEL UP REWARDS =============

/**
 * Structure des récompenses de niveau
 */
interface LevelUpReward {
    type: 'cash' | 'feature' | 'badge' | 'freeze';
    value: number | string | boolean;
    description: string;
}

/**
 * Récupère les récompenses pour un niveau donné
 */
export function getLevelRewards(level: number): LevelUpReward[] {
    const rewards: LevelUpReward[] = [];

    // Niveau 5: +250,000 FCFA
    if (level === 5) {
        rewards.push({
            type: 'cash',
            value: 250000,
            description: 'Bonus de 250,000 FCFA ajouté à votre portefeuille!'
        });
    }

    // Niveau 10: +3 alertes
    if (level === 10) {
        rewards.push({
            type: 'feature',
            value: 'extra_alerts',
            description: '3 alertes de prix supplémentaires débloquées!'
        });
    }

    // Niveau 15: +3 watchlist
    if (level === 15) {
        rewards.push({
            type: 'feature',
            value: 'extra_watchlist',
            description: '3 positions supplémentaires en watchlist!'
        });
    }

    // Niveau 20: +1 comparateur
    if (level === 20) {
        rewards.push({
            type: 'feature',
            value: 'extra_comparator',
            description: '1 action supplémentaire dans le comparateur!'
        });
    }

    // Niveau 30: Créer communauté
    if (level === 30) {
        rewards.push({
            type: 'feature',
            value: 'create_community',
            description: 'Vous pouvez maintenant créer votre propre communauté!'
        });
    }

    // Niveau 40: Badge vérifié
    if (level === 40) {
        rewards.push({
            type: 'badge',
            value: 'verified_investor',
            description: 'Badge Investisseur Vérifié obtenu!'
        });
    }

    // Niveau 50: Webinaires premium
    if (level === 50) {
        rewards.push({
            type: 'feature',
            value: 'premium_webinars',
            description: 'Accès aux webinaires premium débloqué!'
        });
    }

    // Niveau 65: Second simulateur
    if (level === 65) {
        rewards.push({
            type: 'cash',
            value: 1000000,
            description: 'Second portefeuille simulateur de 1,000,000 FCFA créé!'
        });
    }

    // Niveau 80: Bonus 10M
    if (level === 80) {
        rewards.push({
            type: 'cash',
            value: 10000000,
            description: 'Bonus de 10,000,000 FCFA ajouté à votre simulateur!'
        });
    }

    return rewards;
}

/**
 * Applique les récompenses de niveau à un utilisateur
 */
export async function applyLevelRewards(userId: string, newLevel: number): Promise<LevelUpReward[]> {
    const rewards = getLevelRewards(newLevel);

    for (const reward of rewards) {
        try {
            switch (reward.type) {
                case 'cash':
                    // Ajouter du cash au portefeuille principal
                    const portfolio = await prisma.portfolio.findFirst({
                        where: {
                            userId,
                            wallet_type: 'SANDBOX',
                            status: 'ACTIVE'
                        }
                    });

                    if (portfolio) {
                        await prisma.portfolio.update({
                            where: { id: portfolio.id },
                            data: {
                                cash_balance: {
                                    increment: reward.value as number
                                }
                            }
                        });

                        console.log(`✅ [LEVEL UP] +${reward.value} FCFA ajoutés au portfolio de ${userId}`);
                    }
                    break;

                case 'badge':
                    // Attribuer le badge vérifié si niveau 40
                    if (reward.value === 'verified_investor') {
                        await prisma.userProfile.update({
                            where: { userId },
                            data: { verified_investor: true }
                        });

                        console.log(`✅ [LEVEL UP] Badge vérifié attribué à ${userId}`);
                    }
                    break;

                case 'freeze':
                    // Ajouter des freezes
                    await prisma.userProfile.update({
                        where: { userId },
                        data: {
                            streak_freezes: {
                                increment: reward.value as number
                            }
                        }
                    });

                    console.log(`✅ [LEVEL UP] +${reward.value} freezes ajoutés à ${userId}`);
                    break;

                case 'feature':
                    // Les features sont automatiquement débloquées par le niveau
                    console.log(`✅ [LEVEL UP] Feature ${reward.value} débloquée pour ${userId}`);
                    break;
            }
        } catch (error) {
            console.error(`Erreur application récompense niveau ${newLevel}:`, error);
        }
    }

    return rewards;
}

export default {
    requireLevel,
    attachLevelInfo,
    isFeatureUnlocked,
    getUnlockedFeatures,
    getNextFeatureToUnlock,
    getFeatureLimits,
    canCreateItem,
    getLevelRewards,
    applyLevelRewards
};
