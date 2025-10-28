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
}

export const getUserFromToken = async (req: Request) => {
    try {
        const isMobile = isUserOnMobile(req)
        const token = isMobile ? req.headers['authorization']?.split(' ')[1] : req.cookies.token
        if(!token) createError.badRequest("Le token n'existe pas.")
        const decoded = jwt.verify(token, config.jwt.secret);
        if (typeof decoded === "string" || !decoded) {
            createError.badRequest("Le token est invalide.");
        }
        const user = await prisma.user.findUnique({where: {id: (decoded as DecodedToken).id}})
        if(!user) createError.notFound("L'utilisateur n'existe pas.")
        return {user};
    } catch (error) {
        return {error}
    }
}