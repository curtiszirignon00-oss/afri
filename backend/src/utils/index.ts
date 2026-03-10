import jwt from "jsonwebtoken";
import { createError } from '../middlewares/errorHandlers'; // <-- CORRECTED PATH
import prisma from "../config/prisma"
import config from '../config/environnement'
import { Request } from "express";

export function isUserOnMobile(req: Request) {
    const isMobile = req.headers['user-agent']?.includes('iPhone') || req.headers['user-agent']?.includes('Android');
    return isMobile;
}

export function signJWT(data : object) {
    const token = jwt.sign(
      data,
      String(config.jwt.secret) as jwt.Secret,
      { expiresIn: config.jwt.expiresIn as string | number } as jwt.SignOptions
    );
    return token;
}

interface DecodedToken extends jwt.JwtPayload {
    id: string;
    rtk?: string; // remember_token snapshot — invalide si changé (ex: reset mot de passe)
}

export const getUserFromToken = async (req: Request) => {
    try {
        // Essayer d'abord le header Authorization (mobile et desktop)
        let token = req.headers['authorization']?.split(' ')[1];

        // Si pas de token dans le header, essayer le cookie (desktop)
        if (!token) {
            token = req.cookies.token;
        }

        if(!token) throw createError.badRequest("Le token n'existe pas.")

        const decoded = jwt.verify(token, config.jwt.secret);
        if (typeof decoded === "string" || !decoded) {
            throw createError.badRequest("Le token est invalide.");
        }
        const user = await prisma.user.findUnique({where: {id: (decoded as DecodedToken).id}})
        if(!user) throw createError.notFound("L'utilisateur n'existe pas.")

        // Valider le remember_token : si le token JWT contient un rtk qui ne correspond
        // plus à la DB (ex: après reset de mot de passe), rejeter la session
        const decodedRtk = (decoded as DecodedToken).rtk;
        if (decodedRtk && user.remember_token && decodedRtk !== user.remember_token) {
            throw createError.unauthorized("Session invalidée. Veuillez vous reconnecter.");
        }

        return {user};
    } catch (error) {
        return {error}
    }
}