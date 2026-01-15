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
}

// ============= SERVICES =============

/**
 * Get investor profile
 */
export async function getInvestorProfile(userId: string) {
    const profile = await prisma.investorProfile.findUnique({
        where: { user_id: userId },
    });

    return profile;
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
    const investorProfile = await prisma.investorProfile.upsert({
        where: { user_id: userId },
        create: {
            user_id: userId,
            onboarding_completed: true,
            onboarding_date: new Date(),
            ...answers,
        },
        update: {
            onboarding_completed: true,
            onboarding_date: new Date(),
            ...answers,
        },
    });

    return investorProfile;
}
