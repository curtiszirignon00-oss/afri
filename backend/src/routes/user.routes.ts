// backend/src/routes/user.routes.ts

import { Router } from "express";
import { getUsers, signup, login, getCurrentUser, logout, updateUserProfile } from "../controllers/user.controller"; // <-- Import updateUserProfile
import { auth } from "../middlewares/auth.middleware";
const router = Router();

// Public routes
router.post('/signup', signup); 
router.post('/login', login);   
router.post('/logout', logout); // <-- ADDED Logout route

// Protected routes (require login)
router.get('/me', auth, getCurrentUser); // <-- ADDED Get current user route (protected)
router.get('/', /* auth, admin? */ getUsers); // Consider protecting/restricting getUsers
router.put('/me/profile', auth, updateUserProfile);
export default router;