// backend/src/controllers/user.controller.ts

import { Response, Request, NextFunction } from "express";
import * as usersService from "../services/users.service.prisma"; 

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await usersService.getAllUsers();
    return res.status(200).json(users); // <-- CORRECTION: Ajout de 'return'
  } catch (error) {
    return next(error); // <-- CORRECTION: Ajout de 'return'
  }
}

// Contrôleur pour l'inscription
export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    // On vérifie si l'utilisateur existe déjà
    const existingUser = await usersService.getUserByEmail(req.body.email);
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" }); // Ce 'return' était déjà là
    }

    // On crée le nouvel utilisateur
    const user = await usersService.createUser(req.body);
    
    // On ne renvoie pas le mot de passe au client
    const { password, ...userWithoutPassword } = user;
    return res.status(201).json(userWithoutPassword); // <-- CORRECTION: Ajout de 'return'
  } catch (error) {
    return next(error); // <-- CORRECTION: Ajout de 'return'
  }
}

// Contrôleur pour la connexion
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await usersService.loginUser(email, password);

    // On peut stocker le token dans un cookie (plus sécurisé)
    res.cookie("token", result.token, {
      httpOnly: true, // Le cookie n'est pas accessible en JavaScript
      secure: process.env.NODE_ENV === "production", // HTTPS seulement en production
    });

    return res.status(200).json(result); // <-- CORRECTION: Ajout de 'return'
  } catch (error: any) {
    return res.status(401).json({ message: error.message }); // <-- CORRECTION: Ajout de 'return'
  }
}
// Add these functions to user.controller.ts

// Interface for authenticated requests (should already be there or defined globally)
interface AuthenticatedRequest extends Request {
  user?: { id: string }; 
}

// Controller for GET /api/users/me
export async function getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id; // Get ID added by 'auth' middleware
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const userProfile = await usersService.getCurrentUserProfile(userId);

    if (!userProfile) {
      // This case might happen if user exists but profile somehow doesn't
      return res.status(404).json({ message: 'Profil utilisateur non trouvé' }); 
    }

    // Send back the user and profile data
    return res.status(200).json(userProfile);

  } catch (error) {
    return next(error);
  }
}

// Controller for POST /api/users/logout
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    // Clear the authentication cookie
    res.cookie('token', '', { // Set token to empty string
        httpOnly: true,
        expires: new Date(0), // Set expiry date to the past
        secure: process.env.NODE_ENV === "production", 
        // sameSite: 'strict' // Consider adding sameSite attribute
    });
    return res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    return next(error);
  }
}
export async function updateUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const profileData = req.body; // Get profile data from request body
    
    // Basic validation: ensure body is not empty
    if (!profileData || Object.keys(profileData).length === 0) {
        return res.status(400).json({ message: 'Aucune donnée de profil fournie.'});
    }

    const updatedProfile = await usersService.upsertUserProfile(userId, profileData);
    return res.status(200).json(updatedProfile); // Return the updated profile

  } catch (error) {
    return next(error);
  }
}