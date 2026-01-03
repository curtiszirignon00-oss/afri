// backend/src/routes/contact.routes.ts

import { Router } from "express";
import {
  createContactMessage,
  getAllContactMessages,
  getContactMessageById,
  updateContactMessageStatus,
} from "../controllers/contact.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

// Route publique pour envoyer un message de contact
router.post("/", createContactMessage);

// Routes protégées pour l'administration (nécessitent authentification)
router.get("/", auth, getAllContactMessages);
router.get("/:id", auth, getContactMessageById);
router.patch("/:id/status", auth, updateContactMessageStatus);

export default router;
