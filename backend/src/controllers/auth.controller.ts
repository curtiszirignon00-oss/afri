import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { signJWT } from "../utils";
import { createError } from "../middlewares/errorHandlers";
import config from "../config/environnement";
import { generateConfirmationToken, getTokenExpirationDate, isTokenExpired, hashToken } from "../utils/token.utils";
import { sendConfirmationEmail, sendPasswordResetEmail } from "../services/email.service";

// --- CONSOLIDATION : N'IMPORTER QUE LE SERVICE PRISMA ---
import * as usersServicePrisma from "../services/users.service.prisma";
import * as portfolioService from "../services/portfolio.service.prisma";
// Import gamification services
import * as streakService from "../services/streak.service";
import * as achievementService from "../services/achievement.service";
import { prisma } from "../config/database";
// Audit logging
import { writeAuditLog, getClientIp, getUserAgent } from "../services/audit.service";

// --- INSCRIPTION (REGISTER) ---
export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        // Le frontend doit envoyer : name, lastname, email, password
        const { name, lastname, email, password } = req.body;

        // 1. Bloquer les domaines d'emails jetables connus
        const BLOCKED_DOMAINS = ['dollicons.com', 'virgilian.com', 'fake-afribourse.com', 'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwam.com', 'yopmail.com', 'trashmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'guerrillamail.info', 'spam4.me', 'maildrop.cc'];
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (emailDomain && BLOCKED_DOMAINS.includes(emailDomain)) {
            return next(createError.badRequest("Ce fournisseur d'email n'est pas autorisé. Utilisez une adresse email permanente."));
        }

        // 2. Vérifier si l'utilisateur existe déjà
        const existingUser = await usersServicePrisma.getUserByEmail(email);

        if (existingUser) {
            return next(createError.conflict("Un utilisateur avec cet email existe déjà."));
        }

        // 2. Hachage CRITIQUE du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Générer le token de confirmation et sa date d'expiration
        const confirmationToken = generateConfirmationToken();
        const tokenExpiration = getTokenExpirationDate(24); // 24 heures

        // 4. Créer l'utilisateur (le service gère la création du UserProfile obligatoire)
        const newUser = await usersServicePrisma.createUser({
            name,
            lastname,
            email,
            password: hashedPassword, // ENVOI DU HASH
            role: 'user',
            email_confirmation_token: confirmationToken,
            email_confirmation_expires: tokenExpiration,
        });

        if (!newUser) {
            return next(createError.internal("Impossible de créer l'utilisateur."));
        }

        // 5. Envoyer l'email de confirmation
        let emailSent = false;
        let emailError: any = null;

        try {
            await sendConfirmationEmail({
                email,
                name,
                confirmationToken,
            });
            emailSent = true;
        } catch (error) {
            emailError = error;
            emailSent = false;
        }

        // 6. Créer automatiquement un portfolio pour le nouvel utilisateur
        try {
            await portfolioService.createPortfolio(newUser.id, {
                name: 'Mon Portefeuille',
                initial_balance: 1000000,
                is_virtual: true,
            });
        } catch (portfolioError) {
            // Ne pas bloquer l'inscription si la création du portfolio échoue
        }

        // 7. Répondre avec un message de succès (sans créer de session)
        const {
            email_confirmation_token: __,
            email_confirmation_expires: ___,
            remember_token: _rt2,
            password_reset_token: _prt2,
            password_reset_expires: _pre2,
            ...userWithoutSensitiveData
        } = newUser;

        // Audit log - Inscription réussie
        await writeAuditLog({
            userId: newUser.id,
            userEmail: newUser.email,
            userRole: 'user',
            action: 'REGISTER',
            details: `Nouvel utilisateur inscrit: ${newUser.email}`,
            ip: getClientIp(req),
            userAgent: getUserAgent(req),
        });

        // Message personnalisé selon si l'email a été envoyé ou non
        const message = emailSent
            ? "Inscription réussie ! Un email de confirmation a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception."
            : "Inscription réussie ! Cependant, nous n'avons pas pu envoyer l'email de confirmation. Vous pouvez demander un nouveau lien via le bouton 'Renvoyer l'email'.";

        return res.status(201).json({
            message,
            user: userWithoutSensitiveData,
            emailSent,
            emailError: emailError ? emailError.message : null,
        });

    } catch (error) {
        next(error);
        return;
    }
}

// --- CONNEXION (LOGIN) ---
export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const {email, password} = req.body;

        // Requête UNIQUEMENT au service Prisma
        const user = await usersServicePrisma.getUserByEmail(email);

        if (!user) {
            // Audit log - Tentative de connexion echouee (email inconnu)
            await writeAuditLog({
                userEmail: email,
                action: 'LOGIN_FAILED',
                details: 'Tentative de connexion avec email inconnu',
                ip: getClientIp(req),
                userAgent: getUserAgent(req),
                success: false,
                errorMsg: 'Email ou mot de passe invalide',
            });
            return next(createError.unauthorized("Email ou mot de passe invalide"));
        }

        // 2. Vérifier que l'email a été confirmé
        if (!user.email_verified_at) {
            return next(createError.forbidden("Veuillez confirmer votre adresse email avant de vous connecter. Vérifiez votre boîte de réception."));
        }

        // 3. Comparaison CRITIQUE du mot de passe
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Audit log - Tentative de connexion echouee (mauvais mot de passe)
            await writeAuditLog({
                userId: user.id,
                userEmail: email,
                action: 'LOGIN_FAILED',
                details: 'Tentative de connexion avec mauvais mot de passe',
                ip: getClientIp(req),
                userAgent: getUserAgent(req),
                success: false,
                errorMsg: 'Email ou mot de passe invalide',
            });
            return next(createError.unauthorized("Email ou mot de passe invalide"));
        }
        
        // 3. Création du token et réponse

        // Régénérer le remember_token à chaque connexion (invalide les sessions parallèles suspectes)
        const crypto = await import('crypto');
        const newRememberToken = crypto.randomBytes(16).toString('hex');
        await prisma.user.update({
            where: { id: user.id },
            data: { remember_token: newRememberToken },
        });

        const token = signJWT({ id: user.id, email: user.email, role: user.role, rtk: newRememberToken });

        const {
            password: _,
            remember_token: _rt,
            password_reset_token: _prt,
            password_reset_expires: _pre,
            email_confirmation_token: _ect,
            email_confirmation_expires: _ece,
            ...userWithoutPassword
        } = user;

        const cookieOptions: import('express').CookieOptions = {
            httpOnly: true,
            secure: config.nodeEnv === "production",
            sameSite: config.nodeEnv === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
            path: '/', // Ensure cookie is available on all paths
        };

        res.cookie("token", token, cookieOptions);

        // ========== GAMIFICATION TRIGGERS ==========
        let gamificationData: any = {};

        try {
            const userId = userAsAny.id;

            // 1. Enregistrer activité de streak (login compte comme visite profil)
            await streakService.recordActivity(userId, 'profile_visit');

            // 2. Vérifier et débloquer les badges automatiquement
            const achievementResults = await achievementService.checkAllAchievements(userId);
            if (achievementResults.total > 0) {
                gamificationData.newAchievements = achievementResults;
            }

            // 3. Récupérer les stats gamification pour la réponse
            const userGamificationStats = await prisma.userProfile.findUnique({
                where: { userId },
                select: {
                    total_xp: true,
                    level: true,
                    current_streak: true,
                    streak_freezes: true
                }
            });

            gamificationData.stats = userGamificationStats;

            // NOTE: Pour activer le tracking early_bird/night_owl, exécuter:
            // npx prisma generate
            // Les champs early_logins_count et night_logins_count ont été ajoutés au schema

        } catch (gamificationError) {
            // Non-blocking gamification error
        }
        // ========== FIN GAMIFICATION ==========

        // Audit log - Connexion reussie
        await writeAuditLog({
            userId: userAsAny.id,
            userEmail: userAsAny.email,
            userRole: userAsAny.role,
            action: 'LOGIN',
            details: 'Connexion reussie',
            ip: getClientIp(req),
            userAgent: getUserAgent(req),
        });

        return res.status(200).json({ user: userWithoutPassword, token, gamification: gamificationData });
    } catch (error) {
        next(error);
        return;
    }
}

// --- GET ME ---
export async function getMe(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.id;

        // Requête UNIQUEMENT au service Prisma
        const user = await usersServicePrisma.getUserById(userId);

        if (!user) {
            return next(createError.notFound("Utilisateur non trouvé"));
        }

        const userResponse: Record<string, unknown> = { ...user };

        // Les admins ont accès max à toutes les fonctionnalités
        if (user.role === 'admin') {
            userResponse.subscriptionTier = 'max';
        }

        // Essai gratuit : enrichir la réponse avec le statut trial
        if (user.subscriptionTier === 'free') {
            const trial = await prisma.freeTrial.findFirst({
                where: { userId: user.id, claimed: true },
                orderBy: { expiresAt: 'desc' },
            });
            if (trial?.expiresAt && new Date() < trial.expiresAt) {
                userResponse.subscriptionTier = 'premium';
                userResponse.hasTrial = true;
                userResponse.trialExpiresAt = trial.expiresAt;
            }
        }

        // Renvoyer le token dans le body pour les clients qui ne peuvent pas lire les cookies
        // (ex: Safari iOS avec ITP qui bloque les cookies cross-site)
        const rawToken = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

        return res.status(200).json({ user: userResponse, token: rawToken ?? null });
    } catch (error) {
        next(error);
        return;
    }
}

// --- LOGOUT ---
export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
        // Audit log - Deconnexion
        const user = req.user;
        if (user) {
            await writeAuditLog({
                userId: user.id,
                userEmail: user.email,
                action: 'LOGOUT',
                details: 'Deconnexion utilisateur',
                ip: getClientIp(req),
                userAgent: getUserAgent(req),
            });
        }

        res.clearCookie("token", {
            httpOnly: true,
            secure: config.nodeEnv === "production",
            sameSite: config.nodeEnv === "production" ? "none" : "lax",
        });
        return res.status(200).json({ message: "Déconnexion réussie" });
    } catch (error) {
        next(error);
        return;
    }
}

// --- CONFIRMATION D'EMAIL ---
export async function confirmEmail(req: Request, res: Response, next: NextFunction) {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            return next(createError.badRequest("Token de confirmation manquant ou invalide"));
        }

        // 1. Trouver l'utilisateur avec ce token
        const user = await usersServicePrisma.getUserByConfirmationToken(token);

        if (!user) {
            return next(createError.notFound("Token de confirmation invalide ou expiré"));
        }

        // 2. Vérifier que le token n'a pas expiré
        if (isTokenExpired(user.email_confirmation_expires)) {
            return next(createError.badRequest("Le token de confirmation a expiré. Veuillez demander un nouveau lien."));
        }

        // 3. Vérifier que l'email n'est pas déjà confirmé
        if (user.email_verified_at) {
            return res.status(200).json({
                message: "Votre email a déjà été confirmé. Vous pouvez vous connecter.",
                alreadyVerified: true,
            });
        }

        // 4. Confirmer l'email
        await usersServicePrisma.confirmUserEmail(user.id);


        return res.status(200).json({
            message: "Votre email a été confirmé avec succès ! Vous pouvez maintenant vous connecter.",
            verified: true,
        });
    } catch (error) {
        next(error);
        return;
    }
}

// --- RENVOYER L'EMAIL DE CONFIRMATION ---
export async function resendConfirmationEmail(req: Request, res: Response, next: NextFunction) {
    try {
        const { email } = req.body;

        if (!email) {
            return next(createError.badRequest("L'adresse email est requise"));
        }

        // 1. Trouver l'utilisateur
        const user = await usersServicePrisma.getUserByEmail(email);

        if (!user) {
            // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
            return res.status(200).json({
                message: "Si cette adresse email existe dans notre système, un email de confirmation a été envoyé.",
            });
        }

        // 2. Vérifier que l'email n'est pas déjà confirmé
        if (user.email_verified_at) {
            return next(createError.badRequest("Votre email a déjà été confirmé. Vous pouvez vous connecter."));
        }

        // 3. Générer un nouveau token
        const confirmationToken = generateConfirmationToken();
        const tokenExpiration = getTokenExpirationDate(24);

        // 4. Mettre à jour le token dans la base de données
        await usersServicePrisma.updateConfirmationToken(user.id, confirmationToken, tokenExpiration);

        // 5. Envoyer l'email de confirmation
        try {
            await sendConfirmationEmail({
                email: user.email,
                name: user.name,
                confirmationToken,
            });
        } catch (emailError) {
            return next(createError.internal("Échec de l'envoi de l'email de confirmation"));
        }

        return res.status(200).json({
            message: "Un nouvel email de confirmation a été envoyé à votre adresse.",
            emailSent: true,
        });
    } catch (error) {
        next(error);
        return;
    }
}

// --- DEMANDER LA RÉINITIALISATION DU MOT DE PASSE ---
export async function requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
        const { email } = req.body;

        if (!email) {
            return next(createError.badRequest("L'adresse email est requise"));
        }

        // 1. Trouver l'utilisateur
        const user = await usersServicePrisma.getUserByEmail(email);

        if (!user) {
            // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
            return res.status(200).json({
                message: "Si cette adresse email existe dans notre système, un email de réinitialisation a été envoyé.",
            });
        }

        // 2. Générer un token de réinitialisation (expire dans 15 minutes)
        const resetToken = generateConfirmationToken();
        const hashedToken = hashToken(resetToken); // On stocke le hash, pas le token brut
        const tokenExpiration = getTokenExpirationDate(15); // 15 minutes

        // 3. Mettre à jour le token (hashé) dans la base de données
        await usersServicePrisma.updatePasswordResetToken(user.id, hashedToken, tokenExpiration);

        // 4. Audit log de la demande de reset
        await writeAuditLog({
            userId: user.id,
            userEmail: user.email,
            action: 'PASSWORD_RESET',
            details: `Demande de réinitialisation de mot de passe depuis IP: ${getClientIp(req)}`,
            ip: getClientIp(req),
            userAgent: getUserAgent(req),
        });

        // 5. Envoyer l'email — erreur silencieuse pour ne pas révéler si l'email existe
        try {
            await sendPasswordResetEmail({
                email: user.email,
                name: user.name,
                resetToken,
            });
        } catch (emailError) {
            // On continue — même réponse que si l'email n'existait pas
        }

        // Réponse identique que l'email existe ou non (anti-énumération)
        return res.status(200).json({
            message: "Si cette adresse email existe dans notre système, un email de réinitialisation a été envoyé.",
        });
    } catch (error) {
        next(error);
        return;
    }
}

// --- RÉINITIALISER LE MOT DE PASSE ---
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return next(createError.badRequest("Le token et le nouveau mot de passe sont requis"));
        }

        // 1. Validation du mot de passe
        if (newPassword.length < 8) {
            return next(createError.badRequest("Le mot de passe doit contenir au moins 8 caractères"));
        }

        // 2. Trouver l'utilisateur par token (on compare le hash du token reçu)
        const user = await usersServicePrisma.getUserByResetToken(hashToken(token));

        if (!user) {
            return next(createError.badRequest("Token de réinitialisation invalide ou expiré"));
        }

        // 3. Vérifier que le token n'a pas expiré
        if (!user.password_reset_expires || isTokenExpired(user.password_reset_expires)) {
            return next(createError.badRequest("Le token de réinitialisation a expiré. Veuillez demander un nouveau lien."));
        }

        // 4. Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 5. Mettre à jour le mot de passe et supprimer le token
        await usersServicePrisma.resetUserPassword(user.id, hashedPassword);


        // Audit log - Reinitialisation du mot de passe
        await writeAuditLog({
            userId: user.id,
            userEmail: user.email,
            action: 'PASSWORD_RESET',
            details: 'Mot de passe reinitialise avec succes',
            ip: getClientIp(req),
            userAgent: getUserAgent(req),
        });

        return res.status(200).json({
            message: "Votre mot de passe a été réinitialisé avec succès ! Vous pouvez maintenant vous connecter.",
            success: true,
        });
    } catch (error) {
        next(error);
        return;
    }
}