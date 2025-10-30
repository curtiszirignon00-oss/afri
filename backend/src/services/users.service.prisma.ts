// backend/src/services/users.service.prisma.ts

import prisma from "../config/prisma";
import { User } from "@prisma/client"; // Importe le type User généré par Prisma
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import config from "../config/environnement";
import { UserProfile } from '@prisma/client';
// Importation nécessaire pour la gestion des erreurs
import { createError } from "../middlewares/errorHandlers"; 

// Traduction de : User.find()
export const getAllUsers = async () => {
    const users = await prisma.user.findMany();
    return users;
};

// --- Création de l'utilisateur (Le mot de passe DOIT être haché dans le contrôleur) ---
/**
 * Crée un nouvel utilisateur dans la base de données Prisma.
 * @param data Les données de l'utilisateur (name, email, mot de passe haché, role)
 */
export const createUser = async (data: { name: string, lastname: string, email: string, password: string, role: string }) => {
    try {
        const user = await prisma.user.create({
            data: {
                name: data.name,
                lastname: data.lastname,
                email: data.email,
                password: data.password, // Le mot de passe haché est utilisé ici
                role: data.role
            },
        });
        return user;
    } catch (error) {
        console.error("Erreur lors de la création de l'utilisateur:", error);
        // CORRECTION TS2339: Utilisation de 'createError.internal' au lieu de 'createError.internalServerError'
        throw createError.internal("Erreur de base de données lors de l'enregistrement.");
    }
};


// Traduction de : User.findById(id)
export const getUserById = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id },
    });
    return user;
};

// Traduction de : User.findOne({ email })
export const getUserByEmail = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });
    return user;
};

export const getCurrentUserProfile = async (userId: string) => {
    try {
        const userWithProfile = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
            },
        });

        if (!userWithProfile) {
            return null;
        }

        const { password, ...userWithoutPassword } = userWithProfile;

        return {
            ...userWithoutPassword,
            ...(userWithProfile.profile ? userWithProfile.profile : { profile: null }), 
        };

    } catch (error) {
        console.error(`❌ Erreur lors de la récupération du profil pour l'utilisateur ${userId}:`, error);
        throw error;
    }
};

// Traduction de : User.findByIdAndUpdate(id, data)
export const updateUser = async (id: string, data: Partial<User>) => {
    const user = await prisma.user.update({
        where: { id },
        data,
    });
    return user;
};

// Traduction de : User.findByIdAndDelete(id)
export const deleteUser = async (id: string) => {
    const user = await prisma.user.delete({
        where: { id },
    });
    return user;
};

// Function to update or create a user profile
export const upsertUserProfile = async (userId: string, profileData: any /* Using any temporarily to bypass initial type check on incoming data */) => {
    try {
        // Convert boolean strings 'Oui'/'Non' from frontend data to actual boolean
        let hasInvestedBoolean: boolean | undefined | null = undefined; 
        if (typeof profileData.has_invested === 'string') {
            if (profileData.has_invested.toLowerCase() === 'oui') {
                hasInvestedBoolean = true;
            } else if (profileData.has_invested.toLowerCase() === 'non') {
                hasInvestedBoolean = false;
            } else if (profileData.has_invested === '') {
                hasInvestedBoolean = null;
            }
        } else if (typeof profileData.has_invested === 'boolean') {
            hasInvestedBoolean = profileData.has_invested;
        } else if (profileData.has_invested === null) {
            hasInvestedBoolean = null;
        }

        // Convert date string to Date object if provided
        let birthDateObject: Date | undefined | null = undefined; 
        if (profileData.birth_date && typeof profileData.birth_date === 'string') {
            try {
                birthDateObject = new Date(profileData.birth_date);
                if (isNaN(birthDateObject.getTime())) {
                    birthDateObject = undefined; 
                    console.warn(`Invalid birth_date format: ${profileData.birth_date}`);
                }
            } catch (e) {
                birthDateObject = undefined;
                console.warn(`Error parsing birth_date: ${profileData.birth_date}`, e);
            }
        } else if (profileData.birth_date === null) {
            birthDateObject = null;
        }

        // Ensure main_goals is an array or null/undefined
        let mainGoalsArray: string[] | undefined | null = undefined;
        if (Array.isArray(profileData.main_goals)) {
            mainGoalsArray = profileData.main_goals.length > 0 ? profileData.main_goals : []; 
        } else if (profileData.main_goals === null) {
            mainGoalsArray = null;
        }


        const profile = await prisma.userProfile.upsert({
            where: { userId: userId },
            update: { // Data to update
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                country: profileData.country,
                birth_date: birthDateObject,
                has_invested: hasInvestedBoolean,
                experience_level: profileData.experience_level,
                main_goals: mainGoalsArray === null ? undefined : mainGoalsArray,
                monthly_amount: profileData.monthly_amount,
                profile_type: profileData.profile_type,
            },
            create: { // Data to create
                userId: userId,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                country: profileData.country,
                birth_date: birthDateObject ?? null,
                has_invested: hasInvestedBoolean ?? null,
                experience_level: profileData.experience_level,
                main_goals: mainGoalsArray ?? [],
                monthly_amount: profileData.monthly_amount,
                profile_type: profileData.profile_type,
            },
        });
        return profile;
    } catch (error) {
        console.error(`❌ Erreur upsert profile pour ${userId}:`, error);
        throw error;
    }
};