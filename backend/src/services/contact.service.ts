import { log } from '../config/logger';
// backend/src/services/contact.service.ts

import prisma from "../config/prisma";
import { sendEmail } from "./email.service";

interface ContactMessageData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Crée un nouveau message de contact et envoie un email
 */
export const createContactMessage = async (data: ContactMessageData) => {
  // 1. Sauvegarder le message dans la base de données
  const contactMessage = await prisma.contactMessage.create({
    data: {
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: "unread",
    },
  });

  // 2. Préparer l'email à envoyer à contact@africbourse.com
  const emailSubject = `[Contact AfriBourse] ${data.subject}`;
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .info-row {
          margin-bottom: 15px;
          padding: 10px;
          background: white;
          border-radius: 4px;
        }
        .label {
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 5px;
        }
        .message-box {
          background: white;
          padding: 20px;
          border-left: 4px solid #2563eb;
          margin-top: 20px;
          border-radius: 4px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 Nouveau message de contact</h1>
          <p style="margin: 0; font-size: 14px;">Reçu depuis le formulaire de contact AfriBourse</p>
        </div>
        <div class="content">
          <div class="info-row">
            <div class="label">👤 Nom complet</div>
            <div>${data.name}</div>
          </div>

          <div class="info-row">
            <div class="label">📧 Email</div>
            <div><a href="mailto:${data.email}">${data.email}</a></div>
          </div>

          <div class="info-row">
            <div class="label">📋 Sujet</div>
            <div>${data.subject}</div>
          </div>

          <div class="message-box">
            <div class="label">💬 Message</div>
            <div style="margin-top: 10px; white-space: pre-wrap;">${data.message}</div>
          </div>

          <div class="footer">
            <p>Ce message a été envoyé depuis le formulaire de contact d'AfriBourse</p>
            <p>Date: ${new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'long' })}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // 3. Envoyer l'email
  try {
    await sendEmail({
      to: "contact@africbourse.com",
      subject: emailSubject,
      html: emailHtml,
    });
  } catch (emailError) {
    log.error("Erreur lors de l'envoi de l'email:", emailError);
    // On continue même si l'email échoue, le message est sauvegardé
  }

  // 4. Envoyer un email de confirmation à l'utilisateur
  try {
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Message bien reçu !</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${data.name}</strong>,</p>
            <p>Nous avons bien reçu votre message concernant : <strong>${data.subject}</strong></p>
            <p>Notre équipe vous répondra dans les plus brefs délais (généralement sous 24-48 heures ouvrables).</p>
            <p>Merci de votre intérêt pour AfriBourse !</p>
            <br>
            <p>Cordialement,<br><strong>L'équipe AfriBourse</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: data.email,
      subject: "Confirmation de réception - AfriBourse",
      html: confirmationHtml,
    });
  } catch (confirmError) {
    log.error("Erreur lors de l'envoi de la confirmation:", confirmError);
  }

  return contactMessage;
};

/**
 * Récupère tous les messages de contact (pour l'admin)
 */
export const getAllContactMessages = async () => {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { created_at: "desc" },
  });
  return messages;
};

/**
 * Récupère un message de contact par ID
 */
export const getContactMessageById = async (id: string) => {
  const message = await prisma.contactMessage.findUnique({
    where: { id },
  });
  return message;
};

/**
 * Met à jour le statut d'un message de contact
 */
export const updateContactMessageStatus = async (
  id: string,
  status: "unread" | "read" | "responded"
) => {
  const message = await prisma.contactMessage.update({
    where: { id },
    data: { status },
  });
  return message;
};
