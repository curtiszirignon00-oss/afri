import transporter from '../config/mailer';
import config from '../config/environnement';

interface SendEmailConfirmationParams {
  email: string;
  name: string;
  confirmationToken: string;
}

interface SendPasswordResetParams {
  email: string;
  name: string;
  resetToken: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envoie un email de confirmation d'inscription
 */
export async function sendConfirmationEmail({
  email,
  name,
  confirmationToken,
}: SendEmailConfirmationParams): Promise<void> {
  const confirmationUrl = `${config.app.frontendUrl}/confirmer-inscription?token=${confirmationToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmez votre inscription - AfriBourse</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .logo-text {
          font-size: 32px;
          font-weight: bold;
          color: #f97316;
          margin: 0;
        }
        h1 {
          color: #1f2937;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          color: #4b5563;
          margin-bottom: 15px;
        }
        .button {
          display: inline-block;
          padding: 15px 30px;
          background-color: #f97316;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background-color: #ea580c;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        .warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .warning p {
          margin: 0;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M17 6H23V12" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h2 class="logo-text">AfriBourse</h2>
          </div>
        </div>

        <h1>Bienvenue ${name} !</h1>

        <p>Merci de vous être inscrit sur AfriBourse, votre plateforme d'apprentissage et de simulation boursière.</p>

        <p>Pour activer votre compte et commencer à explorer le monde de la bourse, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>

        <div style="text-align: center;">
          <a href="${confirmationUrl}" class="button">Confirmer mon email</a>
        </div>

        <p>Ou copiez et collez ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; color: #f97316;">${confirmationUrl}</p>

        <div class="warning">
          <p><strong>⏰ Ce lien expire dans 24 heures</strong></p>
        </div>

        <p>Si vous n'avez pas créé de compte sur AfriBourse, vous pouvez ignorer cet email en toute sécurité.</p>

        <div class="footer">
          <p>Cet email a été envoyé par AfriBourse</p>
          <p>Si vous avez des questions, contactez-nous à contact@africbourse.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Bienvenue ${name} !

    Merci de vous être inscrit sur AfriBourse.

    Pour confirmer votre adresse email, veuillez cliquer sur le lien suivant :
    ${confirmationUrl}

    Ce lien expire dans 24 heures.

    Si vous n'avez pas créé de compte sur AfriBourse, ignorez cet email.

    AfriBourse - Votre plateforme d'apprentissage boursier
  `;

  await sendEmail({
    to: email,
    subject: 'Confirmez votre inscription - AfriBourse',
    html,
    text,
  });
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail({
  email,
  name,
  resetToken,
}: SendPasswordResetParams): Promise<void> {
  const resetUrl = `${config.app.frontendUrl}/reinitialiser-mot-de-passe?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réinitialisation de mot de passe - AfriBourse</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .logo-text {
          font-size: 32px;
          font-weight: bold;
          color: #f97316;
          margin: 0;
        }
        h1 {
          color: #1f2937;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          color: #4b5563;
          margin-bottom: 15px;
        }
        .button {
          display: inline-block;
          padding: 15px 30px;
          background-color: #f97316;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background-color: #ea580c;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        .warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .warning p {
          margin: 0;
          color: #92400e;
        }
        .security-notice {
          background-color: #fee2e2;
          border-left: 4px solid #ef4444;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .security-notice p {
          margin: 0;
          color: #991b1b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M17 6H23V12" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h2 class="logo-text">AfriBourse</h2>
          </div>
        </div>

        <h1>Réinitialisation de votre mot de passe</h1>

        <p>Bonjour ${name},</p>

        <p>Vous avez demandé à réinitialiser votre mot de passe sur AfriBourse. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>

        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
        </div>

        <p>Ou copiez et collez ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; color: #f97316;">${resetUrl}</p>

        <div class="warning">
          <p><strong>⏰ Ce lien expire dans 1 heure</strong></p>
        </div>

        <div class="security-notice">
          <p><strong>🔒 Sécurité :</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel reste inchangé.</p>
        </div>

        <p>Pour votre sécurité, ce lien ne peut être utilisé qu'une seule fois.</p>

        <div class="footer">
          <p>Cet email a été envoyé par AfriBourse</p>
          <p>Si vous avez des questions, contactez-nous à contact@africbourse.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Réinitialisation de votre mot de passe - AfriBourse

    Bonjour ${name},

    Vous avez demandé à réinitialiser votre mot de passe sur AfriBourse.

    Pour définir un nouveau mot de passe, cliquez sur le lien suivant :
    ${resetUrl}

    Ce lien expire dans 1 heure.

    Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel reste inchangé.

    AfriBourse - Votre plateforme d'apprentissage boursier
  `;

  await sendEmail({
    to: email,
    subject: 'Réinitialisation de mot de passe - AfriBourse',
    html,
    text,
  });
}

/**
 * Fonction générique d'envoi d'email
 */
async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to,
      subject,
      html,
      text: text || '',
    });
    console.log(`📧 Email envoyé avec succès à ${to} depuis ${config.email.from}`);
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi de l'email à ${to}:`, error);
    throw new Error('Échec de l\'envoi de l\'email');
  }
}

export default {
  sendConfirmationEmail,
  sendPasswordResetEmail,
};
