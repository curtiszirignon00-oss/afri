// src/services/investor-profile.service.ts
import { prisma } from '../config/database';
import type { RiskProfile, InvestmentHorizon, VisibilityLevel } from '@prisma/client';

// ============= TYPES =============

export interface InvestorDNADto {
    risk_profile?: RiskProfile;
    investment_horizon?: InvestmentHorizon;
    favorite_sectors?: string[];
    investment_style?: string;
    monthly_investment?: number;
    investment_goals?: string[];
    experience_level?: string;
    preferred_analysis?: string[];
    trading_frequency?: string;
}

export interface PrivacySettingsDto {
    portfolio_visibility?: VisibilityLevel;
    show_performance?: boolean;
    show_transactions?: boolean;
    show_holdings?: boolean;
}

export interface OnboardingDto {
    risk_profile: RiskProfile;
    investment_horizon: InvestmentHorizon;
    favorite_sectors: string[];
    investment_style?: string;
    monthly_investment?: number;
    investment_goals?: string[];
    experience_level?: string;
    quiz_score?: number;
    profession?: string;
    phone_number?: string;
}

// ============= SERVICES =============

/**
 * Get investor profile (merged with UserProfile social data)
 */
export async function getInvestorProfile(userId: string) {
    // Récupérer les deux profils et les badges en parallèle
    const [investorProfile, existingUserProfile, userAchievements] = await Promise.all([
        prisma.investorProfile.findUnique({
            where: { user_id: userId },
        }),
        prisma.userProfile.findUnique({
            where: { userId: userId },
        }),
        prisma.userAchievement.findMany({
            where: { userId: userId },
            include: {
                achievement: {
                    select: {
                        code: true,
                        name: true,
                        description: true,
                        icon: true,
                        category: true,
                        rarity: true,
                    },
                },
            },
            orderBy: { unlocked_at: 'desc' },
        }),
    ]);

    // Créer UserProfile s'il n'existe pas (pour les utilisateurs existants)
    let userProfile = existingUserProfile;
    if (!userProfile) {
        // Compter les vrais followers, following et posts depuis la DB
        const [followersCount, followingCount, postsCount] = await Promise.all([
            prisma.follow.count({ where: { followingId: userId } }),
            prisma.follow.count({ where: { followerId: userId } }),
            prisma.post.count({ where: { author_id: userId, is_hidden: false } }),
        ]);

        userProfile = await prisma.userProfile.create({
            data: {
                userId: userId,
                followers_count: followersCount,
                following_count: followingCount,
                posts_count: postsCount,
            },
        });
    }

    // Transformer les badges en format simplifié
    const badges = userAchievements.map(ua => ({
        code: ua.achievement.code,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        category: ua.achievement.category,
        rarity: ua.achievement.rarity,
        unlocked_at: ua.unlocked_at,
    }));

    // Fusionner les données (UserProfile contient les infos sociales)
    return {
        ...investorProfile,
        // Données sociales depuis UserProfile
        username: userProfile?.username || null,
        bio: userProfile?.bio || null,
        avatar_url: userProfile?.avatar_url || null,
        avatar_color: userProfile?.avatar_color || null,
        banner_url: userProfile?.banner_url || null,
        banner_color: userProfile?.banner_color || null,
        banner_type: userProfile?.banner_type || 'gradient',
        country: userProfile?.country || investorProfile?.favorite_sectors?.[0] || null,
        social_links: userProfile?.social_links || null,
        verified_investor: userProfile?.verified_investor || false,
        // Stats sociales
        followers_count: userProfile?.followers_count || 0,
        following_count: userProfile?.following_count || 0,
        posts_count: userProfile?.posts_count || 0,
        level: userProfile?.level || 1,
        total_xp: userProfile?.total_xp || 0,
        current_streak: userProfile?.current_streak || 0,
        // Badges
        badges: badges,
        // Timestamp
        created_at: investorProfile?.created_at || userProfile?.created_at,
    };
}

/**
 * Update investor DNA
 */
export async function updateInvestorDNA(userId: string, dna: InvestorDNADto) {
    const investorProfile = await prisma.investorProfile.upsert({
        where: { user_id: userId },
        create: {
            user_id: userId,
            ...dna,
        },
        update: dna,
    });

    return investorProfile;
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(userId: string, settings: PrivacySettingsDto) {
    const investorProfile = await prisma.investorProfile.upsert({
        where: { user_id: userId },
        create: {
            user_id: userId,
            ...settings,
        },
        update: settings,
    });

    return investorProfile;
}

/**
 * Check onboarding status
 */
export async function checkOnboardingStatus(userId: string) {
    const investorProfile = await prisma.investorProfile.findUnique({
        where: { user_id: userId },
    });

    return {
        completed: investorProfile?.onboarding_completed || false,
        profile: investorProfile,
    };
}

/**
 * Complete onboarding questionnaire
 */
export async function completeOnboarding(userId: string, answers: OnboardingDto) {
    // Séparer les champs pour InvestorProfile et UserProfile
    const { profession, phone_number, ...investorData } = answers;

    // Mettre à jour InvestorProfile
    const investorProfile = await prisma.investorProfile.upsert({
        where: { user_id: userId },
        create: {
            user_id: userId,
            onboarding_completed: true,
            onboarding_date: new Date(),
            ...investorData,
        },
        update: {
            onboarding_completed: true,
            onboarding_date: new Date(),
            ...investorData,
        },
    });

    // Mettre à jour UserProfile avec profession et phone_number
    if (profession || phone_number) {
        await prisma.userProfile.upsert({
            where: { userId: userId },
            create: {
                userId: userId,
                profession,
                phone_number,
            },
            update: {
                profession,
                phone_number,
            },
        });
    }

    return investorProfile;
}

/**
 * Sync social stats (recalculate from actual data)
 */
export async function syncSocialStats(userId: string) {
    // Compter les vrais followers, following et posts depuis la DB
    const [followersCount, followingCount, postsCount] = await Promise.all([
        prisma.follow.count({ where: { followingId: userId } }),
        prisma.follow.count({ where: { followerId: userId } }),
        prisma.post.count({ where: { author_id: userId, is_hidden: false } }),
    ]);

    const userProfile = await prisma.userProfile.upsert({
        where: { userId: userId },
        update: {
            followers_count: followersCount,
            following_count: followingCount,
            posts_count: postsCount,
        },
        create: {
            userId: userId,
            followers_count: followersCount,
            following_count: followingCount,
            posts_count: postsCount,
        },
    });

    return userProfile;
}
