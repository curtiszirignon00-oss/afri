// backend/src/controllers/user.controller.ts

import { Response, Request, NextFunction } from "express";
import * as usersService from "../services/users.service.prisma"; 
import { createError } from "../middlewares/errorHandlers";

// FIX 1: Définir l'interface manquante
interface AuthenticatedRequest extends Request {
  user?: { id: string }; 
}

// 1. Contrôleur pour GET /api/users
export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    // Le service retourne désormais les utilisateurs SANS mot de passe
    const users = await usersService.getAllUsers(); 
    return res.status(200).json(users); 
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

    // Le service getCurrentUserProfile retourne les données de l'utilisateur fusionnées (sans mot de passe)
    const userProfile = await usersService.getCurrentUserProfile(userId);

    if (!userProfile) {
      return res.status(404).json({ message: 'Profil utilisateur non trouvé' }); 
    }

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
    // Séparer les données: User (name, lastname) vs UserProfile (tout le reste)
    const { name, lastname, telephone, address, ...profileFields } = profileData;

  // Debug logs to help trace incoming payloads (will appear in server logs)
  console.debug('[updateUserProfile] userId =', userId);
  console.debug('[updateUserProfile] profileFields =', JSON.stringify(profileFields));

    // --- 1. Mettre à jour les champs du Modèle User (name, lastname, etc.) ---
    const userUpdate = await usersService.updateUser(userId, { name, lastname, telephone, address });

    // --- 2. Mapper les clés du frontend vers le format attendu par Prisma/service ---
    const mappedProfileFields: any = { ...profileFields };

    // Si le frontend envoie "name"/"lastname", mapper vers "first_name"/"last_name" pour UserProfile
    // Note: name/lastname sont déjà extraits et mis à jour dans User, donc on les mappe aussi pour UserProfile
    if (name !== undefined) {
      mappedProfileFields.first_name = name;
    }
    if (lastname !== undefined) {
      mappedProfileFields.last_name = lastname;
    }
    // Si le frontend envoie "telephone", mapper aussi vers "phone_number" pour UserProfile
    if (telephone !== undefined) {
      mappedProfileFields.phone_number = telephone;
    }

    const keyMap: Record<string, string> = {
      avatarUrl: 'avatar_url',
      isPublic: 'is_public',
      birthDate: 'birth_date',
      hasInvested: 'has_invested',
      mainGoals: 'main_goals',
      monthlyAmount: 'monthly_amount',
      profileType: 'profile_type',
      topicInterests: 'topic_interests',
      discoveryChannel: 'discovery_channel',
      keyFeature: 'key_feature',
      socialLinks: 'social_links'
    };
    for (const [k, v] of Object.entries(keyMap)) {
      if (k in mappedProfileFields) {
        mappedProfileFields[v] = (mappedProfileFields as any)[k];
        delete (mappedProfileFields as any)[k];
      }
    }

    // --- 3. Mettre à jour/Créer les champs du Modèle UserProfile ---
    // Le service upsertUserProfile attend les champs en snake_case
    const updatedProfile = await usersService.upsertUserProfile(userId, mappedProfileFields);
    
    // Renvoyer les données fusionnées pour mettre à jour le frontend
    const finalProfile = await usersService.getCurrentUserProfile(userId);

    return res.status(200).json(finalProfile);

  } catch (error) {
    return next(error);
  }
}