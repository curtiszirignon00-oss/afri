// backend/src/controllers/user.controller.ts

import { Response, Request, NextFunction } from "express";
import * as usersService from "../services/users.service.prisma";
import { createError } from "../middlewares/errorHandlers";
import { prisma } from "../config/database";

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

// Contrôleur pour GET /api/users/count
export async function getUserCount(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await usersService.getUserCount();
    return res.status(200).json({ count });
  } catch (error) {
    return next(error);
  }
}

// 2. Contrôleur pour GET /api/users/me (Récupérer l'utilisateur courant et son profil)
export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Récupère l'ID ajouté par le middleware 'auth'
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    console.log('[getCurrentUser] Fetching profile for userId:', userId);

    // Le service getCurrentUserProfile retourne les données de l'utilisateur fusionnées (sans mot de passe)
    const userProfile = await usersService.getCurrentUserProfile(userId);

    if (!userProfile) {
      return res.status(404).json({ message: 'Profil utilisateur non trouvé' });
    }

    console.log('[getCurrentUser] Profile fetched successfully');
    return res.status(200).json(userProfile);

  } catch (error: any) {
    console.error('[getCurrentUser] Error:', error.message);
    console.error('[getCurrentUser] Stack:', error.stack);
    return next(error);
  }
}

// 3. Contrôleur pour PUT/PATCH /api/users/profile (Mise à jour du profil)
export async function updateUserProfile(req: Request, res: Response, next: NextFunction) {
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

// Contrôleur pour GET /api/users/welcome-popup
// Vérifie si l'utilisateur a un popup de bienvenue à afficher
export async function getWelcomePopup(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    // Vérifier si l'utilisateur a le badge pioneer_2026 et n'a pas encore vu le popup
    const [pioneerBadge, userProfile] = await Promise.all([
      prisma.userAchievement.findFirst({
        where: {
          userId: userId,
          achievement: { code: 'pioneer_2026' },
        },
        include: {
          achievement: true,
        },
      }),
      prisma.userProfile.findUnique({
        where: { userId: userId },
        select: { welcome_popup_seen: true },
      }),
    ]);

    // Si l'utilisateur a le badge et n'a pas vu le popup
    if (pioneerBadge && !userProfile?.welcome_popup_seen) {
      // Récupérer le portefeuille pour montrer le bonus
      const portfolio = await prisma.portfolio.findFirst({
        where: { userId: userId, wallet_type: 'SANDBOX' },
        select: { cash_balance: true },
      });

      return res.status(200).json({
        show: true,
        data: {
          badge: {
            name: pioneerBadge.achievement.name,
            icon: pioneerBadge.achievement.icon,
            description: pioneerBadge.achievement.description,
            rarity: pioneerBadge.achievement.rarity,
          },
          bonusCapital: 500000,
          bonusXp: 500,
          modulesUnlocked: 2,
          portfolioBalance: portfolio?.cash_balance || 0,
        },
      });
    }

    return res.status(200).json({ show: false });

  } catch (error) {
    return next(error);
  }
}

// Contrôleur pour POST /api/users/welcome-popup/dismiss
// Marque le popup comme vu
export async function dismissWelcomePopup(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    await prisma.userProfile.update({
      where: { userId: userId },
      data: { welcome_popup_seen: true },
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    return next(error);
  }
}