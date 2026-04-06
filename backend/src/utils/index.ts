import jwt from "jsonwebtoken";
import { createError } from '../middlewares/errorHandlers'; // <-- CORRECTED PATH
import prisma from "../config/prisma"
import config from '../config/environnement'
import { Request } from "express";

export function isUserOnMobile(req: Request) {
    const isMobile = req.headers['user-agent']?.includes('iPhone') || req.headers['user-agent']?.includes('Android');
    return isMobile;
}

// expiresIn optionnel — utilise ACCESS_TOKEN_TTL par défaut (15m)
export function signJWT(data: object, expiresIn?: string) {
    const token = jwt.sign(
      data,
      String(config.jwt.secret) as jwt.Secret,
      { expiresIn: (expiresIn ?? config.jwt.accessTokenTtl) as string } as jwt.SignOptions
    );
    return token;
}

interface DecodedToken extends jwt.JwtPayload {
    id: string;
}

export const getUserFromToken = async (req: Request) => {
    try {
        // Essayer d'abord le header Authorization (mobile)
        let token = req.headers['authorization']?.split(' ')[1];

        // Sinon le cookie httpOnly (web)
        if (!token) {
            token = req.cookies.token;
        }

        if (!token) throw createError.badRequest("Le token n'existe pas.");

        const decoded = jwt.verify(token, config.jwt.secret);
        if (typeof decoded === 'string' || !decoded) {
            throw createError.badRequest("Le token est invalide.");
        }

        const user = await prisma.user.findUnique({ where: { id: (decoded as DecodedToken).id } });
        if (!user) throw createError.notFound("L'utilisateur n'existe pas.");

        return { user };
    } catch (error) {
        return { error };
    }
}