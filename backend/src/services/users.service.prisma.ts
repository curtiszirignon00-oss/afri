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
 */
export const getCurrentUserProfile = async (userId: string) => {
    try {
        const userWithProfile = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });

        if (!userWithProfile) {
            return null;
        }

        // Exclure le mot de passe
        const { password, ...userWithoutPassword } = userWithProfile;
        
        // Fusionner l'utilisateur (sans le mot de passe) et les détails du profil
        return {
            ...userWithoutPassword,
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