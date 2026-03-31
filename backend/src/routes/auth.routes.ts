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
import {
    registerSchema, loginSchema,
    resendConfirmationSchema, requestPasswordResetSchema, resetPasswordSchema
} from "../validation/auth.validation";
import { authLimiter, loginEmailLimiter, resetPasswordLimiter, resetPasswordEmailLimiter } from "../middleware/rateLimiter";

const router = Router();

// Route d'INSCRIPTION (REGISTER) - limite: 5 tentatives / 15 min
router.post('/register', authLimiter, validate(registerSchema), register);

// Route de CONNEXION (LOGIN) — double limite: 10/15min par IP + 10/15min par email (anti brute-force multi-IP)
router.post('/login', authLimiter, loginEmailLimiter, validate(loginSchema), login);

// Route de DÉCONNEXION
router.post('/logout', logout);

// Route pour l'utilisateur courant (getMe)
router.get('/me', auth, getMe);

// Route de confirmation d'email
router.get('/confirm-email', confirmEmail);

// Route pour renvoyer l'email de confirmation - limite: 3 / heure
router.post('/resend-confirmation', resetPasswordLimiter, validate(resendConfirmationSchema), resendConfirmationEmail);

// Route pour demander la réinitialisation du mot de passe — double limite: 3/h par IP + 5/h par email
router.post('/request-password-reset', resetPasswordLimiter, resetPasswordEmailLimiter, validate(requestPasswordResetSchema), requestPasswordReset);

// Route pour réinitialiser le mot de passe - limite: 3 / heure
router.post('/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), resetPassword);

export default router;