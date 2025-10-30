// backend/src/controllers/user.controller.ts

import { Response, Request, NextFunction } from "express";
import * as usersService from "../services/users.service.prisma"; 

// Interface pour les requêtes authentifiées (pour la cohérence du typage)
interface AuthenticatedRequest extends Request {
  user?: { id: string }; 
}

// 1. Contrôleur pour GET /api/users
export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await usersService.getAllUsers();
    // On ne renvoie pas le mot de passe, même pour la liste
    const safeUsers = users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
    });
    return res.status(200).json(safeUsers); 
  } catch (error) {
    return next(error); 
  }
}

// 2. Contrôleur pour GET /api/users/me (Récupérer l'utilisateur courant et son profil)
export async function getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Récupère l'ID ajouté par le middleware 'auth'
    const userId = req.user?.id; 
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const userProfile = await usersService.getCurrentUserProfile(userId);

    if (!userProfile) {
      return res.status(404).json({ message: 'Profil utilisateur non trouvé' }); 
    }

    // Renvoie l'utilisateur et les données de profil combinées
    return res.status(200).json(userProfile);

  } catch (error) {
    return next(error);
  }
}

// 3. Contrôleur pour PUT/PATCH /api/users/profile (Mise à jour du profil)
export async function updateUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const profileData = req.body; 
    
    if (!profileData || Object.keys(profileData).length === 0) {
        return res.status(400).json({ message: 'Aucune donnée de profil fournie.'});
    }

    const updatedProfile = await usersService.upsertUserProfile(userId, profileData);
    return res.status(200).json(updatedProfile); 

  } catch (error) {
    return next(error);
  }
}

// --- Les fonctions login, signup, et logout ont été retirées car elles sont gérées dans auth.controller.ts ---