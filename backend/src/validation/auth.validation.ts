import zod from "zod";
// CORRECTION 1: Suppression de l'extension .js
import { validate } from "../utils/validate.util";

export const loginSchema = zod.object({
    email: zod.email(),
    password: zod.string().min(6).max(100),
});

export const registerSchema = zod.object({
    email: zod.email(),
    password: zod.string().min(6).max(100),
    name: zod.string().min(2).max(100),
    // CORRECTION 2: Ajout de 'lastname' pour correspondre au contrôleur et à la base de données
    lastname: zod.string().min(2).max(100), 
});

export const validateLogin = validate(loginSchema);
export const validateRegister = validate(registerSchema);