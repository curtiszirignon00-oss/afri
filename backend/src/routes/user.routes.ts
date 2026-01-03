// backend/src/routes/user.routes.ts (Exemple de ce à quoi il devrait ressembler)

import { Router } from "express";
import { getUsers, getCurrentUser, updateUserProfile, getUserCount } from "../controllers/user.controller";
import { auth } from "../middlewares/auth.middleware";
// import { validate } from "../utils/validate.util"; // Si vous avez des schémas de validation pour les mises à jour

const router = Router();

// Route pour obtenir le nombre total d'utilisateurs (publique)
router.get("/count", getUserCount);

// Route pour obtenir tous les utilisateurs (probablement pour les admins)
router.get("/", getUsers);

// Route pour l'utilisateur connecté et son profil
router.get("/me", auth, getCurrentUser); 
router.put("/profile", auth, updateUserProfile); 
// router.patch("/profile", auth, updateUserProfile); // Optionnel

export default router;