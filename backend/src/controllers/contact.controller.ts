// backend/src/controllers/contact.controller.ts

import { Response, Request, NextFunction } from "express";
import * as contactService from "../services/contact.service";

/**
 * Contrôleur pour créer un nouveau message de contact
 * POST /api/contact
 */
export async function createContactMessage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, email, subject, message } = req.body;

    // Validation des champs requis
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: "Tous les champs sont requis (name, email, subject, message)",
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Format d'email invalide",
      });
    }

    // Créer le message et envoyer l'email
    const contactMessage = await contactService.createContactMessage({
      name,
      email,
      subject,
      message,
    });

    return res.status(201).json({
      message: "Message envoyé avec succès",
      data: contactMessage,
    });
  } catch (error: any) {
    console.error("[createContactMessage] Error:", error.message);
    return next(error);
  }
}

/**
 * Contrôleur pour récupérer tous les messages de contact (admin)
 * GET /api/contact
 */
export async function getAllContactMessages(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const messages = await contactService.getAllContactMessages();
    return res.status(200).json(messages);
  } catch (error) {
    return next(error);
  }
}

/**
 * Contrôleur pour récupérer un message de contact par ID
 * GET /api/contact/:id
 */
export async function getContactMessageById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const message = await contactService.getContactMessageById(id);

    if (!message) {
      return res.status(404).json({
        message: "Message non trouvé",
      });
    }

    return res.status(200).json(message);
  } catch (error) {
    return next(error);
  }
}

/**
 * Contrôleur pour mettre à jour le statut d'un message
 * PATCH /api/contact/:id/status
 */
export async function updateContactMessageStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["unread", "read", "responded"].includes(status)) {
      return res.status(400).json({
        message: "Statut invalide. Valeurs acceptées: unread, read, responded",
      });
    }

    const message = await contactService.updateContactMessageStatus(id, status);

    return res.status(200).json({
      message: "Statut mis à jour avec succès",
      data: message,
    });
  } catch (error) {
    return next(error);
  }
}
