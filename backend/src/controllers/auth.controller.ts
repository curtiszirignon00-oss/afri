import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { signJWT } from "../utils";
import { createError } from "../middlewares/errorHandlers";
import config from "../config/environnement"; // Chemin relatif corrigé
import { generateConfirmationToken, getTokenExpirationDate, isTokenExpired } from "../utils/token.utils";
import { sendConfirmationEmail, sendPasswordResetEmail } from "../services/email.service";

// --- CONSOLIDATION : N'IMPORTER QUE LE SERVICE PRISMA ---
import * as usersServicePrisma from "../services/users.service.prisma";
import * as portfolioService from "../services/portfolio.service.prisma";
// Import gamification services
import * as streakService from "../services/streak.service";
import * as achievementService from "../services/achievement.service";
import { prisma } from "../config/database";
// L'import vers usersServiceMongo n'est plus nécessaire

// --- INSCRIPTION (REGISTER) ---
export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        // Le frontend doit envoyer : name, lastname, email, password
        const { name, lastname, email, password } = req.body;

        // 1. Vérifier si l'utilisateur existe déjà
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
        console.log(`📧 [REGISTER] Préparation de l'envoi de l'email de confirmation pour ${email}`);
        console.log(`   → Token: ${confirmationToken.substring(0, 10)}...`);
        console.log(`   → Expire le: ${tokenExpiration.toISOString()}`);

        let emailSent = false;
        let emailError: any = null;

        try {
            await sendConfirmationEmail({
                email,
                name,
                confirmationToken,
            });
            emailSent = true;
            console.log(`✅ [REGISTER] Email de confirmation envoyé avec succès à ${email}`);
        } catch (error) {
            emailError = error;
            emailSent = false;
            console.error('❌ [REGISTER] ÉCHEC de l\'envoi de l\'email de confirmation!');
            console.error('   → Erreur:', error);
            // On ne bloque pas l'inscription, mais on informe l'utilisateur
            // L'utilisateur pourra renvoyer l'email plus tard via /api/resend-confirmation
        }

        // 6. Créer automatiquement un portfolio pour le nouvel utilisateur
        try {
            const user = newUser as any;
            await portfolioService.createPortfolio(user.id, {
                name: 'Mon Portefeuille',
                initial_balance: 1000000, // 1,000,000 FCFA de départ pour la simulation
                is_virtual: true,
            });
            console.log('✅ [REGISTER] Portfolio créé automatiquement pour:', user.email);
        } catch (portfolioError) {
            console.error('❌ [REGISTER] Erreur lors de la création du portfolio:', portfolioError);
            // Ne pas bloquer l'inscription si la création du portfolio échoue
            // L'utilisateur pourra le créer manuellement plus tard
        }

        // 7. Répondre avec un message de succès (sans créer de session)
        const user = newUser as any;
        const { password: _, email_confirmation_token: __, email_confirmation_expires: ___, ...userWithoutSensitiveData } = user;

        console.log('✅ [REGISTER] Utilisateur créé avec succès:', user.email);
        console.log(`   → Email envoyé: ${emailSent ? 'OUI ✅' : 'NON ❌'}`);

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
            return next(createError.unauthorized("Email ou mot de passe invalide"));
        }

        // 2. Vérifier que l'email a été confirmé
        if (!user.email_verified_at) {
            return next(createError.forbidden("Veuillez confirmer votre adresse email avant de vous connecter. Vérifiez votre boîte de réception."));
        }

        // 3. Comparaison CRITIQUE du mot de passe
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return next(createError.unauthorized("Email ou mot de passe invalide"));
        }
        
        // 3. Création du token et réponse
        const userAsAny = user as any;
        const token = signJWT({ id: userAsAny.id, email: userAsAny.email, role: userAsAny.role });

        const {password: _, ...userWithoutPassword} = userAsAny;

        const cookieOptions = {
            httpOnly: true,
            secure: config.nodeEnv === "production",
            sameSite: config.nodeEnv === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
            path: '/', // Ensure cookie is available on all paths
        };

        console.log('🍪 [LOGIN] Setting cookie with options:', JSON.stringify(cookieOptions));
        console.log('🌍 [LOGIN] NODE_ENV:', config.nodeEnv);
        console.log('🔐 [LOGIN] Token created for user:', userAsAny.email);

        res.cookie("token", token, cookieOptions as any);

        // ========== GAMIFICATION TRIGGERS ==========
        let gamificationData: any = {};

        try {
            const userId = userAsAny.id;

            // 1. Enregistrer activité de streak (login compte comme visite profil)
            await streakService.recordActivity(userId, 'profile_visit');

            // 2. Récupérer les stats gamification pour la réponse
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
            console.error('Erreur gamification (login):', gamificationError);
        }
        // ========== FIN GAMIFICATION ==========

        console.log('✅ [LOGIN] Cookie set, sending response');
        return res.status(200).json({ token, user: userWithoutPassword, gamification: gamificationData });
    } catch (error) {
        next(error);
        return;
    }
}

// --- GET ME ---
export async function getMe(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = (req as any).user.id;
        
        // Requête UNIQUEMENT au service Prisma
        const user = await usersServicePrisma.getUserById(userId); 

        if (!user) {
            return next(createError.notFound("Utilisateur non trouvé"));
        }
        
        const userAsAny = user as any; 
        
        return res.status(200).json({ user: userAsAny });
    } catch (error) {
        next(error);
        return;
    }
}

// --- LOGOUT ---
export async function logout(req: Request, res: Response, next: NextFunction) {
    try {
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

        console.log(`✅ [CONFIRM_EMAIL] Email confirmé pour l'utilisateur: ${user.email}`);

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
            console.log(`✅ [RESEND_CONFIRMATION] Email de confirmation renvoyé à ${user.email}`);
        } catch (emailError) {
            console.error('❌ [RESEND_CONFIRMATION] Erreur lors de l\'envoi de l\'email:', emailError);
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

        // 2. Générer un token de réinitialisation (expire dans 1 heure)
        const resetToken = generateConfirmationToken();
        const tokenExpiration = getTokenExpirationDate(1); // 1 heure

        // 3. Mettre à jour le token dans la base de données
        await usersServicePrisma.updatePasswordResetToken(user.id, resetToken, tokenExpiration);

        // 4. Envoyer l'email de réinitialisation
        try {
            await sendPasswordResetEmail({
                email: user.email,
                name: user.name,
                resetToken,
            });
            console.log(`✅ [PASSWORD_RESET] Email de réinitialisation envoyé à ${user.email}`);
        } catch (emailError) {
            console.error('❌ [PASSWORD_RESET] Erreur lors de l\'envoi de l\'email:', emailError);
            return next(createError.internal("Échec de l'envoi de l'email de réinitialisation"));
        }

        return res.status(200).json({
            message: "Si cette adresse email existe dans notre système, un email de réinitialisation a été envoyé.",
            emailSent: true,
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

        // 2. Trouver l'utilisateur par token
        const user = await usersServicePrisma.getUserByResetToken(token);

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

        console.log(`✅ [PASSWORD_RESET] Mot de passe réinitialisé pour l'utilisateur: ${user.email}`);

        return res.status(200).json({
            message: "Votre mot de passe a été réinitialisé avec succès ! Vous pouvez maintenant vous connecter.",
            success: true,
        });
    } catch (error) {
        next(error);
        return;
    }
}