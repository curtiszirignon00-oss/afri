// backend/src/routes/auth.routes.ts
import { Router } from "express";
// Assurez-vous que 'register' est listé ici
import { login, logout, getMe, register } from "../controllers/auth.controller"; 
import { auth } from "../middlewares/auth.middleware"; 
import { validate } from "../utils/validate.util"; 
import { registerSchema, loginSchema } from "../validation/auth.validation"; 

const router = Router();

// Route d'INSCRIPTION (REGISTER)
router.post('/register', validate(registerSchema), register); // Ajout de la route /register

// Route de CONNEXION (LOGIN)
router.post('/login', validate(loginSchema), login); 

// ... (autres routes)

export default router;