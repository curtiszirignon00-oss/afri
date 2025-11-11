import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { signJWT } from "../utils";
import { createError } from "../middlewares/errorHandlers";
import config from "../config/environnement"; // Chemin relatif corrigé

// --- CONSOLIDATION : N'IMPORTER QUE LE SERVICE PRISMA ---
import * as usersServicePrisma from "../services/users.service.prisma";
import * as portfolioService from "../services/portfolio.service.prisma";
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

        // 3. Créer l'utilisateur (le service gère la création du UserProfile obligatoire)
        const newUser = await usersServicePrisma.createUser({
            name,
            lastname,
            email,
            password: hashedPassword, // ENVOI DU HASH
            role: 'user'
        });

        if (!newUser) {
            return next(createError.internal("Impossible de créer l'utilisateur."));
        }

        // 3.5. Créer automatiquement un portfolio pour le nouvel utilisateur
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

        // 4. Générer le JWT et répondre
        const user = newUser as any;
        const token = signJWT({ id: user.id, email: user.email, role: user.role });
        const { password: _, ...userWithoutPassword } = user;

        const cookieOptions = {
            httpOnly: true,
            secure: config.nodeEnv === "production",
            sameSite: config.nodeEnv === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
            path: '/',
        };

        console.log('🍪 [REGISTER] Setting cookie with options:', JSON.stringify(cookieOptions));
        console.log('🌍 [REGISTER] NODE_ENV:', config.nodeEnv);
        console.log('🔐 [REGISTER] Token created for user:', user.email);

        res.cookie("token", token, cookieOptions as any);

        console.log('✅ [REGISTER] Cookie set, sending response');
        return res.status(201).json({ token, user: userWithoutPassword });

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
        
        // 2. Comparaison CRITIQUE du mot de passe
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

        console.log('✅ [LOGIN] Cookie set, sending response');
        return res.status(200).json({ token, user: userWithoutPassword });
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