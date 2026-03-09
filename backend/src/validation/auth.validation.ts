import zod from "zod";
// CORRECTION 1: Suppression de l'extension .js
import { validate } from "../utils/validate.util";

export const loginSchema = zod.object({
    email: zod.email(),
    password: zod.string().min(1).max(100), // Login: pas de min strict (utilisateurs existants)
});

export const registerSchema = zod.object({
    email: zod.email().max(254),
    password: zod.string()
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .max(100)
        .refine(p => /[A-Z]/.test(p), 'Doit contenir au moins une majuscule')
        .refine(p => /[0-9]/.test(p), 'Doit contenir au moins un chiffre'),
    name: zod.string().min(2).max(100),
    lastname: zod.string().min(2).max(100),
});

export const validateLogin = validate(loginSchema);
export const validateRegister = validate(registerSchema);