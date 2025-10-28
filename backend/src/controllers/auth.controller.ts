import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { signJWT } from "../utils";
import { createError } from "../middlewares/errorHandlers";
import config from "@/config/environnement";

import * as usersServicePrisma from "../services/users.service.prisma";
import * as usersServiceMongo from "../services/users.service.mongodb";

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const {email, password} = req.body;

        /** Utiliser cette méthode si vous utilisez prisma */
        const userPrisma = await usersServicePrisma.getUserByEmail(email);

        /** Utiliser cette méthode si vous utilisez MongoDB avec Mongoose */
        const userMongo = await usersServiceMongo.getUserByEmail(email);

        //Vous pourrez choisir l'un ou l'autre selon la base de données utilisée
        const user = userPrisma || userMongo;

        if (!user) {
            return next(createError.unauthorized("Email ou mot de passe invalide"));
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return next(createError.unauthorized("Email ou mot de passe invalide"));
        }
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

        //Vous pourrez choisir l'un ou l'autre selon la base de données utilisée
        const user = userPrisma || userMongo; 

        if (!user) {
            return next(createError.notFound("Utilisateur non trouvé"));
        }
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
        next(error);
        return;
    }
}