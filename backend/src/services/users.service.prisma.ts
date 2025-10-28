// backend/src/services/users.service.prisma.ts

import prisma from "../config/prisma";
import { User } from "@prisma/client"; // Importe le type User généré par Prisma
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import config from "../config/environnement";
import { UserProfile } from '@prisma/client';
// Traduction de : User.find()
export const getAllUsers = async () => {
const users = await prisma.user.findMany();
return users;
};

// Traduction de : User.create(data)
// C'est la fonction d'INSCRIPTION (SIGNUP)
export const createUser = async (data: Omit<User, "id" | "created_at" | "updated_at">) => {
  // Hachage du mot de passe
const hashedPassword = await bcrypt.hash(data.password, 10);

const user = await prisma.user.create({
data: {
 ...data,
 password: hashedPassword, // On stocke le mot de passe haché
  },
 });
 return user;
};

// Nouvelle fonction pour la CONNEXION (LOGIN)
export const loginUser = async (email: string, password_plain: string) => {
  // 1. Trouver l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Email ou mot de passe incorrect");
  }

  // 2. Vérifier son mot de passe
  const isPasswordValid = await bcrypt.compare(password_plain, user.password);

  if (!isPasswordValid) {
    throw new Error("Email ou mot de passe incorrect");
  }

  // --- CORRECTION POUR L'ERREUR JWT ---
  // On vérifie que les secrets du .env sont bien chargés
  if (!config.jwt.secret || !config.jwt.expiresIn) {
    console.error("Erreur: JWT_SECRET ou JWT_EXPIRES_IN n'est pas défini dans le .env");
    throw new Error("Erreur de configuration du serveur.");
  }
  // --- FIN DE LA CORRECTION ---

  // 3. Créer un token JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role }, // Payload
    config.jwt.secret as jwt.Secret, // Cast to jwt.Secret type
    { expiresIn: config.jwt.expiresIn } as SignOptions // Cast to SignOptions type
  );

  // 4. Renvoyer l'utilisateur (sans le mot de passe) et le token
  const { password, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

// Traduction de : User.findById(id)
// Note : L'ID est un string dans Prisma/MongoDB
export const getUserById = async (id: string) => {
 const user = await prisma.user.findUnique({
 where: { id },
});
 return user;
};

// Traduction de : User.findOne({ email })
export const getUserByEmail = async (email: string) => {
 const user = await prisma.user.findUnique({
 where: { email },
 });
 return user;
};
// Add this function to users.service.prisma.ts

export const getCurrentUserProfile = async (userId: string) => {
  try {
    // Find the user and include their profile information
    const userWithProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true, // This tells Prisma to fetch the related UserProfile
      },
    });

    if (!userWithProfile) {
      return null; // Or throw an error if user should always exist
    }

    // Return a combined object or just the profile part, as needed
    // Let's return the user minus password, plus the profile
    const { password, ...userWithoutPassword } = userWithProfile;

    // Combine user details (without password) and profile details
    return {
        ...userWithoutPassword, // Includes id, email, name, lastname, role etc.
        // If profile exists, spread its properties, otherwise set profile to null
        ...(userWithProfile.profile ? userWithProfile.profile : { profile: null }), 
        // We might need to flatten the structure depending on frontend needs
        // Example: first_name: userWithProfile.profile?.first_name 
    };

  } catch (error) {
    console.error(`❌ Erreur lors de la récupération du profil pour l'utilisateur ${userId}:`, error);
    throw error;
  }
};
// Traduction de : User.findByIdAndUpdate(id, data)
export const updateUser = async (id: string, data: Partial<User>) => {
 const user = await prisma.user.update({
 where: { id },
 data,
 });
 return user;
};

// Traduction de : User.findByIdAndDelete(id)
export const deleteUser = async (id: string) => {
 const user = await prisma.user.delete({
 where: { id },
 });
return user;
};
// Function to update or create a user profile
export const upsertUserProfile = async (userId: string, profileData: any /* Using any temporarily to bypass initial type check on incoming data */) => {
  try {
    // Convert boolean strings 'Oui'/'Non' from frontend data to actual boolean
    let hasInvestedBoolean: boolean | undefined | null = undefined; // Initialize as undefined
    // Check the type and value of the incoming data before assigning
    if (typeof profileData.has_invested === 'string') {
        if (profileData.has_invested.toLowerCase() === 'oui') {
             hasInvestedBoolean = true;
        } else if (profileData.has_invested.toLowerCase() === 'non') {
             hasInvestedBoolean = false;
        } else if (profileData.has_invested === '') {
             // Handle empty string case if necessary, maybe treat as null?
             hasInvestedBoolean = null;
        }
    } else if (typeof profileData.has_invested === 'boolean') {
        // If the frontend somehow sends a boolean already
        hasInvestedBoolean = profileData.has_invested;
    } else if (profileData.has_invested === null) {
        hasInvestedBoolean = null;
    }
    // If hasInvestedBoolean remains undefined, Prisma will ignore the field during update

    // Convert date string to Date object if provided
    let birthDateObject: Date | undefined | null = undefined; // Initialize as undefined
    if (profileData.birth_date && typeof profileData.birth_date === 'string') {
        try {
            birthDateObject = new Date(profileData.birth_date);
             if (isNaN(birthDateObject.getTime())) {
                 birthDateObject = undefined; // Invalid date string
                 console.warn(`Invalid birth_date format: ${profileData.birth_date}`);
             }
        } catch (e) {
            birthDateObject = undefined;
            console.warn(`Error parsing birth_date: ${profileData.birth_date}`, e);
        }
    } else if (profileData.birth_date === null) {
        birthDateObject = null;
    }

    // Ensure main_goals is an array or null/undefined
    let mainGoalsArray: string[] | undefined | null = undefined;
    if (Array.isArray(profileData.main_goals)) {
        mainGoalsArray = profileData.main_goals.length > 0 ? profileData.main_goals : undefined; // Store empty array as undefined? or []? Prisma schema expects String[]
    } else if (profileData.main_goals === null) {
        mainGoalsArray = null;
    }


    const profile = await prisma.userProfile.upsert({
      where: { userId: userId },
      update: { // Data to update
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        country: profileData.country,
        birth_date: birthDateObject, // Use Date object or undefined/null
        has_invested: hasInvestedBoolean, // Use boolean or undefined/null
        experience_level: profileData.experience_level,
        main_goals: mainGoalsArray === null ? undefined : mainGoalsArray, // Use array or undefined/null
        monthly_amount: profileData.monthly_amount,
        profile_type: profileData.profile_type,
      },
      create: { // Data to create
        userId: userId,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        country: profileData.country,
        birth_date: birthDateObject ?? null, // Use Date object or null
        has_invested: hasInvestedBoolean ?? null, // Use boolean or null
        experience_level: profileData.experience_level,
        main_goals: mainGoalsArray ?? [], // Use array or empty array for create
        monthly_amount: profileData.monthly_amount,
        profile_type: profileData.profile_type,
      },
    });
    return profile;
  } catch (error) {
    console.error(`❌ Erreur upsert profile pour ${userId}:`, error);
    throw error;
  }
};

// ... (rest of the file) ...