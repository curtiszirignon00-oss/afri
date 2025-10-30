import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { signJWT } from "../utils";
import { createError } from "../middlewares/errorHandlers";
import config from "@/config/environnement";

import * as usersServicePrisma from "../services/users.service.prisma";
import * as usersServiceMongo from "../services/users.service.mongodb";

// --- NOUVELLE FONCTION POUR L'INSCRIPTION (REGISTER) ---
export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const { name, lastname, email, password } = req.body; 

        // 1. Vérifier si l'utilisateur existe déjà
        const existingUserPrisma = await usersServicePrisma.getUserByEmail(email);
        const existingUserMongo = await usersServiceMongo.getUserByEmail(email);
        const existingUser = existingUserPrisma || existingUserMongo;

        if (existingUser) {
            return next(createError.conflict("Un utilisateur avec cet email existe déjà."));
        }

        // 2. Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Créer l'utilisateur (Utiliser UNIQUEMENT l'un des deux services)
        // ATTENTION: Assurez-vous d'utiliser uniquement le service que vous avez choisi (Prisma ou Mongo)
        const newUser = await usersServicePrisma.createUser({ 
            name, 
            lastname, 
            email, 
            password: hashedPassword, 
            role: 'user' 
        }); 
        
        if (!newUser) {
            return next(createError.internal("Impossible de créer l'utilisateur.")); 
        }

        // 4. Générer le JWT et répondre
        // CORRECTION DE TYPAGE: Caster newUser en 'any' pour accéder aux propriétés communes.
        const user = newUser as any; 
        const token = signJWT({ id: user.id, email: user.email, role: user.role });
        const { password: _, ...userWithoutPassword } = user;
        
        res.cookie("token", token, {
            httpOnly: config.nodeEnv === "production",
            secure: config.nodeEnv === "production",
            sameSite: config.host === config.cors.origin ? "lax" : "strict",
        });

        return res.status(201).json({ token, user: userWithoutPassword });

    } catch (error) {
        next(error);
        return;
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const {email, password} = req.body;

        /** Utiliser cette méthode si vous utilisez prisma */
        const userPrisma = await usersServicePrisma.getUserByEmail(email);

        /** Utiliser cette méthode si vous utilisez MongoDB avec Mongoose */
        const userMongo = await usersServiceMongo.getUserByEmail(email);

        //Vous pourrez choisir l'un ou l'autre selon la base de données utilisée
        const rawUser = userPrisma || userMongo; // Renommer pour la clarté

        if (!rawUser) {
            return next(createError.unauthorized("Email ou mot de passe invalide"));
        }
        
        // CORRECTION DE TYPAGE: Caster rawUser en 'any' pour accéder aux propriétés communes.
        const user = rawUser as any; 
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return next(createError.unauthorized("Email ou mot de passe invalide"));
        }
        
        // C'est ici que l'erreur TS2339 se produisait
        const token = signJWT({ id: user.id, email: user.email, role: user.role });
        
        const {password: _, ...userWithoutPassword} = user;
        
        res.cookie("token", token, {
            httpOnly: config.nodeEnv === "production",
            secure: config.nodeEnv === "production",
            sameSite: config.host === config.cors.origin ? "lax" : "strict",
        });
        return res.status(200).json({ token, user: userWithoutPassword });
    } catch (error) {
        next(error);
        return;
    }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        res.clearCookie("token", {
            httpOnly: config.nodeEnv === "production",
            secure: config.nodeEnv === "production",
            sameSite: config.host === config.cors.origin ? "lax" : "strict",
        });
        return res.status(200).json({ message: "Déconnexion réussie" });
    } catch (error) {
        next(error);
        return;
    }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user.id;
        /** Utiliser cette méthode si vous utilisez prisma */
        const userPrisma = await usersServicePrisma.getUserById(userId);

        /** Utiliser cette méthode si vous utilisez MongoDB avec Mongoose */
        const userMongo = await usersServiceMongo.getUserById(userId);

        const rawUser = userPrisma || userMongo; 

        if (!rawUser) {
            return next(createError.notFound("Utilisateur non trouvé"));
        }
        
        // CORRECTION DE TYPAGE
        const user = rawUser as any; 
        
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
        next(error);
        return;
    }
}