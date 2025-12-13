// backend/src/routes/auth.routes.ts
import { Router } from "express";
// Assurez-vous que 'register' est listé ici
import {
    login,
    logout,
    getMe,
    register,
    confirmEmail,
    resendConfirmationEmail
} from "../controllers/auth.controller";
import { auth } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.util";
import { registerSchema, loginSchema } from "../validation/auth.validation";

const router = Router();

// Route d'INSCRIPTION (REGISTER)
router.post('/register', validate(registerSchema), register);

// Route de CONNEXION (LOGIN)
router.post('/login', validate(loginSchema), login);

// --- CORRECTION : AJOUT DE LA ROUTE DE DÉCONNEXION ---
router.post('/logout', logout);

// Route pour l'utilisateur courant (getMe)
router.get('/me', auth, getMe);

// Route de confirmation d'email
router.get('/confirm-email', confirmEmail);

// Route pour renvoyer l'email de confirmation
router.post('/resend-confirmation', resendConfirmationEmail);

export default router;