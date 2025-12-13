// backend/src/services/users.service.prisma.ts

import prisma from "../config/prisma";
import { User, UserProfile, Prisma } from "@prisma/client";
import { createError } from "../middlewares/errorHandlers";
import bcrypt from "bcryptjs";

// Interface pour un typage propre des données d'entrée
export interface IUserInput {
  name: string;
  lastname: string;
  email: string;
  password: string; // Mot de passe HACHÉ
  role: string;
  telephone?: string | null;
  address?: string | null;
  email_confirmation_token?: string | null;
  email_confirmation_expires?: Date | null;
}

// ------------------------------------------
// --- CRÉATION & AUTHENTIFICATION ---
// ------------------------------------------

/**
 * Crée un nouvel utilisateur (User) et son Profil (UserProfile) associé de manière atomique.
 */
export const createUser = async (data: IUserInput) => {
    try {
        const user = await prisma.user.create({
            data: {
                name: data.name,
                lastname: data.lastname,
                email: data.email,
                password: data.password, // Mot de passe HACHÉ
                role: data.role,
                telephone: data.telephone,
                address: data.address,
                email_confirmation_token: data.email_confirmation_token,
                email_confirmation_expires: data.email_confirmation_expires,
                // FIX CRITIQUE: Créer le profil associé
                profile: {
                    create: {
                        profile_type: "investor",
                    }
                }
            },
            include: { profile: true }
        });
        // Exclure le mot de passe de l'objet retourné
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error: any) {
        console.error("Erreur lors de la création de l'utilisateur:", error);
        // Gérer la violation de contrainte unique (Email déjà utilisé)
        if (error.code === 'P2002') {
            throw createError.conflict("Un utilisateur avec cet email existe déjà.");
        }
        throw createError.internal("Erreur de base de données lors de l'enregistrement.");
    }
};

/**
 * Trouve l'utilisateur par email (Utilisé par le contrôleur de connexion).
 */
export const getUserByEmail = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });
    return user; // Retourne l'objet User (inclut le mot de passe hashé pour bcrypt.compare)
};

/**
 * Trouve l'utilisateur par token de confirmation.
 */
export const getUserByConfirmationToken = async (token: string) => {
    const user = await prisma.user.findFirst({
        where: { email_confirmation_token: token },
    });
    return user;
};

/**
 * Confirme l'email d'un utilisateur.
 */
export const confirmUserEmail = async (userId: string) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            email_verified_at: new Date(),
            email_confirmation_token: null,
            email_confirmation_expires: null,
        },
    });
    return user;
};

/**
 * Met à jour le token de confirmation d'un utilisateur.
 */
export const updateConfirmationToken = async (
    userId: string,
    token: string,
    expiresAt: Date
) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            email_confirmation_token: token,
            email_confirmation_expires: expiresAt,
        },
    });
    return user;
};

/**
 * Met à jour le token de réinitialisation de mot de passe.
 */
export const updatePasswordResetToken = async (
    userId: string,
    resetToken: string,
    expiresAt: Date
) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            password_reset_token: resetToken,
            password_reset_expires: expiresAt,
        },
    });
    return user;
};

/**
 * Récupère un utilisateur par son token de réinitialisation.
 */
export const getUserByResetToken = async (token: string) => {
    const user = await prisma.user.findFirst({
        where: { password_reset_token: token },
    });
    return user;
};

/**
 * Réinitialise le mot de passe d'un utilisateur.
 */
export const resetUserPassword = async (userId: string, hashedPassword: string) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            password: hashedPassword,
            password_reset_token: null,
            password_reset_expires: null,
        },
    });
    return user;
};


// ------------------------------------------
// --- LECTURE & MISE À JOUR (Profil/Gestion) ---
// ------------------------------------------

export const getAllUsers = async () => {
    // Utiliser select pour exclure le mot de passe par défaut
    const users = await prisma.user.findMany({
        select: {
            id: true, name: true, lastname: true, email: true, role: true,
            telephone: true, address: true, created_at: true, updated_at: true,
        }
    });
    return users;
};

/**
 * Trouve l'utilisateur par ID (pour /users/me - sans le mot de passe).
 */
export const getUserById = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            role: true,
            telephone: true,
            address: true,
            created_at: true,
        }
    });
    return user;
};

/**
 * Récupère l'utilisateur et son profil fusionné (utilisé pour /users/me).
 * FIX: Utilise select au lieu de include pour éviter les problèmes avec les champs null.
 */
export const getCurrentUserProfile = async (userId: string) => {
    try {
        const userWithProfile = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                lastname: true,
                email: true,
                email_verified_at: true,
                telephone: true,
                address: true,
                role: true,
                // Note: On ne sélectionne PAS created_at ni updated_at qui peuvent causer des problèmes
                profile: {
                    select: {
                        id: true,
                        userId: true,
                        first_name: true,
                        last_name: true,
                        phone_number: true,
                        country: true,
                        experience_level: true,
                        investment_goals: true,
                        birth_date: true,
                        has_invested: true,
                        main_goals: true,
                        monthly_amount: true,
                        profile_type: true,
                        topic_interests: true,
                        discovery_channel: true,
                        key_feature: true,
                        username: true,
                        bio: true,
                        avatar_url: true,
                        banner_url: true,
                        banner_type: true,
                        social_links: true,
                        is_public: true,
                        level: true,
                        total_xp: true,
                        current_streak: true,
                        longest_streak: true,
                        last_activity_date: true,
                        streak_freezes: true,
                        global_rank: true,
                        country_rank: true,
                        show_avatar: true,
                        show_bio: true,
                        show_country: true,
                        show_birth_date: true,
                        show_level: true,
                        show_xp: true,
                        show_rank: true,
                        show_streak: true,
                        show_portfolio_value: true,
                        show_roi: true,
                        show_positions: true,
                        show_transactions: true,
                        show_achievements: true,
                        show_badges: true,
                        show_completed_modules: true,
                        show_quiz_scores: true,
                        show_followers_count: true,
                        show_following_count: true,
                        show_followers_list: true,
                        show_following_list: true,
                        show_activity_feed: true,
                        appear_in_search: true,
                        appear_in_suggestions: true,
                        allow_follow_requests: true,
                        // Note: On ne sélectionne PAS created_at ni updated_at
                    }
                }
            }
        });

        if (!userWithProfile) {
            return null;
        }

        // Fusionner l'utilisateur et les détails du profil
        return {
            ...userWithProfile,
            ...(userWithProfile.profile ? userWithProfile.profile : {}),
        };

    } catch (error) {
        console.error(`❌ Erreur lors de la récupération du profil pour l'utilisateur ${userId}:`, error);
        throw error;
    }
};

// --- UPDATE/DELETE & UPSERT PROFILE ---

export const updateUser = async (id: string, data: Partial<User>) => {
    const user = await prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            email_verified_at: true,
            telephone: true,
            address: true,
            role: true,
            // Note: On ne sélectionne PAS created_at ni updated_at
        }
    });
    return user;
};

export const deleteUser = async (id: string) => {
    const user = await prisma.user.delete({
        where: { id },
    });
    return user;
};

/**
 * Met à jour ou crée le profil utilisateur (UserProfile).
 */
export const upsertUserProfile = async (userId: string, profileData: any) => {
    try {
        // --- Logique de conversion des données (pour has_invested, date, goals) ---
        let hasInvestedBoolean: boolean | undefined | null = undefined;
        if (typeof profileData.has_invested === 'string') {
            if (profileData.has_invested.toLowerCase() === 'oui') {
                hasInvestedBoolean = true;
            } else if (profileData.has_invested.toLowerCase() === 'non') {
                hasInvestedBoolean = false;
            } else if (profileData.has_invested === '') {
                hasInvestedBoolean = null;
            }
        } else if (profileData.has_invested === null) {
            hasInvestedBoolean = null;
        }

        let birthDateObject: Date | undefined | null = undefined;
        if (profileData.birth_date && typeof profileData.birth_date === 'string') {
            try {
                birthDateObject = new Date(profileData.birth_date);
                if (isNaN(birthDateObject.getTime())) {
                    birthDateObject = undefined;
                }
            } catch (e) {
                birthDateObject = undefined;
            }
        } else if (profileData.birth_date === null) {
            birthDateObject = null;
        }

        let mainGoalsArray: string[] | undefined | null = undefined;
        if (Array.isArray(profileData.main_goals)) {
            mainGoalsArray = profileData.main_goals.length > 0 ? profileData.main_goals : [];
        } else if (profileData.main_goals === null) {
            mainGoalsArray = null;
        }

        let isPublicBoolean: boolean | undefined | null = undefined;
        if (typeof profileData.is_public === 'boolean') {
            isPublicBoolean = profileData.is_public;
        } else if (profileData.is_public === 'true' || profileData.is_public === true) {
             isPublicBoolean = true;
        } else if (profileData.is_public === 'false' || profileData.is_public === false) {
             isPublicBoolean = false;
        } else if (profileData.is_public === null) {
             isPublicBoolean = null;
        }

        // Conversion pour topic_interests (array)
        let topicInterestsArray: string[] | undefined | null = undefined;
        if (Array.isArray(profileData.topic_interests)) {
            topicInterestsArray = profileData.topic_interests.length > 0 ? profileData.topic_interests : [];
        } else if (profileData.topic_interests === null) {
            topicInterestsArray = null;
        }

        // FIN Logique de conversion

        const profile = await prisma.userProfile.upsert({
            where: { userId: userId },
            update: ({
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                phone_number: profileData.phone_number,
                country: profileData.country,
                birth_date: birthDateObject,
                has_invested: hasInvestedBoolean,
                experience_level: profileData.experience_level,
                main_goals: mainGoalsArray === null ? undefined : mainGoalsArray,
                monthly_amount: profileData.monthly_amount,
                profile_type: profileData.profile_type,
                // CORRECTION UTILISANT SNAKE_CASE (car le client Prisma l'exige ici)
                avatar_url: profileData.avatar_url,
                is_public: isPublicBoolean,
                bio: profileData.bio,
                social_links: profileData.social_links,
                // Nouveaux champs pour les préférences
                topic_interests: topicInterestsArray === null ? undefined : topicInterestsArray,
                discovery_channel: profileData.discovery_channel,
                key_feature: profileData.key_feature,
            } as Prisma.UserProfileUncheckedUpdateInput),
            create: ({
                userId: userId,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                phone_number: profileData.phone_number,
                country: profileData.country,
                birth_date: birthDateObject ?? null,
                has_invested: hasInvestedBoolean ?? null,
                experience_level: profileData.experience_level,
                main_goals: mainGoalsArray ?? [],
                monthly_amount: profileData.monthly_amount,
                profile_type: profileData.profile_type,
                avatar_url: profileData.avatar_url,
                is_public: isPublicBoolean ?? false,
                bio: profileData.bio,
                social_links: profileData.social_links ?? [],
                // Nouveaux champs pour les préférences
                topic_interests: topicInterestsArray ?? [],
                discovery_channel: profileData.discovery_channel ?? null,
                key_feature: profileData.key_feature ?? null,
            } as Prisma.UserProfileUncheckedCreateInput),
            select: {
                id: true,
                userId: true,
                first_name: true,
                last_name: true,
                phone_number: true,
                country: true,
                experience_level: true,
                investment_goals: true,
                birth_date: true,
                has_invested: true,
                main_goals: true,
                monthly_amount: true,
                profile_type: true,
                topic_interests: true,
                discovery_channel: true,
                key_feature: true,
                username: true,
                bio: true,
                avatar_url: true,
                banner_url: true,
                banner_type: true,
                social_links: true,
                is_public: true,
                level: true,
                total_xp: true,
                current_streak: true,
                longest_streak: true,
                last_activity_date: true,
                streak_freezes: true,
                global_rank: true,
                country_rank: true,
                show_avatar: true,
                show_bio: true,
                show_country: true,
                show_birth_date: true,
                show_level: true,
                show_xp: true,
                show_rank: true,
                show_streak: true,
                show_portfolio_value: true,
                show_roi: true,
                show_positions: true,
                show_transactions: true,
                show_achievements: true,
                show_badges: true,
                show_completed_modules: true,
                show_quiz_scores: true,
                show_followers_count: true,
                show_following_count: true,
                show_followers_list: true,
                show_following_list: true,
                show_activity_feed: true,
                appear_in_search: true,
                appear_in_suggestions: true,
                allow_follow_requests: true,
                // Note: On ne sélectionne PAS created_at ni updated_at
            }
        });
        return profile;
    } catch (error) {
        console.error(`❌ Erreur upsert profile pour ${userId}:`, error);
        throw error;
    }
};

// Export final de l'objet
export const usersService = {
   getAllUsers,
    getUserByEmail,
    getUserById,
    getCurrentUserProfile,
    createUser,
    updateUser,
    deleteUser,
    upsertUserProfile,
};
