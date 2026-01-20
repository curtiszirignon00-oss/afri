// src/services/challenge.service.ts
import { prisma } from '../config/database';
import type { WalletStatus } from '@prisma/client';

// ============= TYPES =============

export interface EnrollmentData {
    experienceLevel: string; // DEBUTANT, INTERMEDIAIRE, EXPERT
    hasRealAccount: boolean;
    discoverySource: string; // SOCIAL_MEDIA, FRIEND, SCHOOL, OTHER
    primaryGoal: string; // WIN_PRIZE, LEARN, NETWORK
    preferredSector: string; // BANK, TELECOM, AGRICULTURE, INDUSTRY, SERVICES
    referralCode?: string;
}

export interface ChallengeStatus {
    enrolled: boolean;
    status?: WalletStatus;
    enrollmentDate?: Date;
    validTransactions?: number;
    isEligible?: boolean;
    acceptedRules?: boolean;
    walletId?: string;
}

// ============= CONSTANTS =============

const CHALLENGE_START_DATE = new Date('2026-02-02T00:00:00Z');
const INITIAL_CHALLENGE_BALANCE = 1000000; // 1M FCFA
const REQUIRED_UNIQUE_TICKERS = 5;

// ============= HELPER FUNCTIONS =============

/**
 * Vérifie si on est un weekend (samedi ou dimanche)
 */
export function isWeekend(date: Date = new Date()): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = dimanche, 6 = samedi
}

/**
 * Vérifie si le challenge est ouvert
 */
export function isChallengeOpen(): boolean {
    return Date.now() >= CHALLENGE_START_DATE.getTime();
}

/**
 * Vérifie si un utilisateur peut trader (contraintes temporelles)
 */
export function canTrade(walletType: 'SANDBOX' | 'CONCOURS', currentTime: Date = new Date()): { allowed: boolean; reason?: string } {
    // Sandbox : toujours autorisé
    if (walletType === 'SANDBOX') {
        return { allowed: true };
    }

    // Concours : vérifier weekend
    if (isWeekend(currentTime)) {
        return {
            allowed: false,
            reason: 'Trading interdit le weekend pour le wallet Concours. Revenez du lundi au vendredi.',
        };
    }

    // Concours : vérifier date d'ouverture
    if (!isChallengeOpen()) {
        const daysRemaining = Math.ceil((CHALLENGE_START_DATE.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24));
        return {
            allowed: false,
            reason: `Le Challenge AfriBourse ouvre le 2 février 2026 (dans ${daysRemaining} jours).`,
        };
    }

    return { allowed: true };
}

// ============= WALLET MANAGEMENT =============

/**
 * Crée le wallet Challenge pour un utilisateur
 */
export async function createChallengeWallet(userId: string) {
    // Vérifier si l'utilisateur a déjà un wallet Concours
    const existingWallet = await prisma.portfolio.findFirst({
        where: {
            userId,
            wallet_type: 'CONCOURS',
        },
    });

    if (existingWallet) {
        throw new Error('Un wallet Concours existe déjà pour cet utilisateur');
    }

    // Créer le nouveau wallet
    const wallet = await prisma.portfolio.create({
        data: {
            userId,
            name: 'Challenge AfriBourse 2026',
            wallet_type: 'CONCOURS',
            status: 'ACTIVE',
            initial_balance: INITIAL_CHALLENGE_BALANCE,
            cash_balance: INITIAL_CHALLENGE_BALANCE,
            is_virtual: true,
            is_weekend_locked: false,
        },
    });

    return wallet;
}

// ============= ENROLLMENT =============

/**
 * Inscrit un utilisateur au Challenge AfriBourse 2026
 */
export async function enrollInChallenge(userId: string, data: EnrollmentData) {
    // Vérifier si déjà inscrit
    const existing = await prisma.challengeParticipant.findUnique({
        where: { userId },
    });

    if (existing) {
        throw new Error('Vous êtes déjà inscrit au Challenge AfriBourse 2026');
    }

    // Créer le participant ET le wallet dans une transaction
    const result = await prisma.$transaction(async (tx) => {
        // 1. Créer l'enregistrement participant
        const participant = await tx.challengeParticipant.create({
            data: {
                userId,
                experience_level: data.experienceLevel,
                has_real_account: data.hasRealAccount,
                discovery_source: data.discoverySource,
                primary_goal: data.primaryGoal,
                preferred_sector: data.preferredSector,
                referral_code: data.referralCode,
                accepted_rules: false, // À valider séparément
            },
        });

        // 2. Créer le wallet Concours
        const wallet = await tx.portfolio.create({
            data: {
                userId,
                name: 'Challenge AfriBourse 2026',
                wallet_type: 'CONCOURS',
                status: 'ACTIVE',
                initial_balance: INITIAL_CHALLENGE_BALANCE,
                cash_balance: INITIAL_CHALLENGE_BALANCE,
                is_virtual: true,
                contest_metadata: {
                    enrollmentAnswers: data,
                    enrollmentDate: new Date().toISOString(),
                },
            },
        });

        return { participant, wallet };
    });

    return result;
}

/**
 * Valide l'acceptation du règlement
 */
export async function acceptChallengeRules(userId: string) {
    const participant = await prisma.challengeParticipant.findUnique({
        where: { userId },
    });

    if (!participant) {
        throw new Error('Vous devez d\'abord vous inscrire au challenge');
    }

    if (participant.accepted_rules) {
        throw new Error('Vous avez déjà accepté le règlement');
    }

    const updated = await prisma.challengeParticipant.update({
        where: { userId },
        data: {
            accepted_rules: true,
            rules_accepted_at: new Date(),
        },
    });

    return updated;
}

// ============= TRANSACTION VALIDATION =============

/**
 * Valide une transaction et met à jour le compteur de tickers uniques
 */
export async function validateTransaction(userId: string, ticker: string) {
    const participant = await prisma.challengeParticipant.findUnique({
        where: { userId },
    });

    if (!participant) {
        return; // Pas participant au challenge, pas de validation
    }

    // Récupérer tous les tickers uniques déjà tradés
    const challengeWallet = await prisma.portfolio.findFirst({
        where: {
            userId,
            wallet_type: 'CONCOURS',
        },
    });

    if (!challengeWallet) {
        return;
    }

    const uniqueTickers = await prisma.transaction.findMany({
        where: {
            portfolioId: challengeWallet.id,
        },
        select: { stock_ticker: true },
        distinct: ['stock_ticker'],
    });

    const tickerSet = new Set(uniqueTickers.map(t => t.stock_ticker));
    const uniqueCount = tickerSet.size;

    // Mettre à jour le compteur et l'éligibilité
    await prisma.challengeParticipant.update({
        where: { userId },
        data: {
            valid_transactions: uniqueCount,
            is_eligible: uniqueCount >= REQUIRED_UNIQUE_TICKERS,
        },
    });
}

// ============= STATUS & INFO =============

/**
 * Récupère le statut de participation d'un utilisateur
 */
export async function getChallengeStatus(userId: string): Promise<ChallengeStatus> {
    const participant = await prisma.challengeParticipant.findUnique({
        where: { userId },
        include: {
            user: {
                include: {
                    portfolios: {
                        where: { wallet_type: 'CONCOURS' },
                    },
                },
            },
        },
    });

    if (!participant) {
        return { enrolled: false };
    }

    const wallet = participant.user.portfolios[0];

    return {
        enrolled: true,
        status: participant.status,
        enrollmentDate: participant.enrollment_date,
        validTransactions: participant.valid_transactions,
        isEligible: participant.is_eligible,
        acceptedRules: participant.accepted_rules,
        walletId: wallet?.id,
    };
}

// ============= BANNISHMENT =============

/**
 * Bannit un participant du challenge
 */
export async function banParticipant(userId: string, reason: string, adminId: string) {
    const participant = await prisma.challengeParticipant.findUnique({
        where: { userId },
    });

    if (!participant) {
        throw new Error('Participant non trouvé');
    }

    if (participant.status === 'BANNED') {
        throw new Error('Participant déjà banni');
    }

    await prisma.$transaction(async (tx) => {
        // 1. Bannir le participant
        await tx.challengeParticipant.update({
            where: { userId },
            data: {
                status: 'BANNED',
                banned_at: new Date(),
                ban_reason: reason,
            },
        });

        // 2. Bloquer le wallet Concours
        await tx.portfolio.updateMany({
            where: {
                userId,
                wallet_type: 'CONCOURS',
            },
            data: {
                status: 'BANNED',
            },
        });

        // 3. Log de modération (si table existe)
        // await tx.moderationLog.create({...});
    });

    return { success: true, message: 'Participant banni avec succès' };
}

/**
 * Débannit un participant
 */
export async function unbanParticipant(userId: string, adminId: string) {
    await prisma.$transaction(async (tx) => {
        await tx.challengeParticipant.update({
            where: { userId },
            data: {
                status: 'ACTIVE',
                banned_at: null,
                ban_reason: null,
            },
        });

        await tx.portfolio.updateMany({
            where: {
                userId,
                wallet_type: 'CONCOURS',
            },
            data: {
                status: 'ACTIVE',
            },
        });
    });

    return { success: true, message: 'Participant débanni avec succès' };
}

// ============= ADMIN =============

/**
 * Liste tous les participants avec pagination
 */
export async function getParticipants(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [participants, total] = await Promise.all([
        prisma.challengeParticipant.findMany({
            skip,
            take: limit,
            orderBy: { enrollment_date: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true,
                    },
                },
            },
        }),
        prisma.challengeParticipant.count(),
    ]);

    return {
        data: participants,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}
