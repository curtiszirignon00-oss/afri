// backend/src/routes/auth.routes.ts
import { Router } from "express";
import {
    login,
    logout,
    getMe,
    register,
    confirmEmail,
    resendConfirmationEmail,
    requestPasswordReset,
    resetPassword
} from "../controllers/auth.controller";
import { auth } from "../middlewares/auth.middleware";
import { validate } from "../utils/validate.util";
import { registerSchema, loginSchema } from "../validation/auth.validation";
import { authLimiter, resetPasswordLimiter } from "../middleware/rateLimiter";

const router = Router();

// Route d'INSCRIPTION (REGISTER) - limite: 5 tentatives / 15 min
router.post('/register', authLimiter, validate(registerSchema), register);

// Route de CONNEXION (LOGIN) - limite: 5 tentatives / 15 min
router.post('/login', authLimiter, validate(loginSchema), login);

// Route de DÉCONNEXION
router.post('/logout', logout);

// Route pour l'utilisateur courant (getMe)
router.get('/me', auth, getMe);

// Route de confirmation d'email
router.get('/confirm-email', confirmEmail);

// Route pour renvoyer l'email de confirmation - limite: 3 / heure
router.post('/resend-confirmation', resetPasswordLimiter, resendConfirmationEmail);

// Route pour demander la réinitialisation du mot de passe - limite: 3 / heure
router.post('/request-password-reset', resetPasswordLimiter, requestPasswordReset);

// Route pour réinitialiser le mot de passe - limite: 3 / heure
router.post('/reset-password', resetPasswordLimiter, resetPassword);

export default router;