import zod from "zod";
import { validate } from "../utils/validate.util.js";

export const loginSchema = zod.object({
    email: zod.email(),
    password: zod.string().min(6).max(100),
});

export const registerSchema = zod.object({
    email: zod.email(),
    password: zod.string().min(6).max(100),
    name: zod.string().min(2).max(100),
});

export const validateLogin = validate(loginSchema);
export const validateRegister = validate(registerSchema);
