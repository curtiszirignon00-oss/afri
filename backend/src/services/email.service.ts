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

  // Handle null or undefined names for old accounts
  const displayName = name || 'Utilisateur';

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

        <p>Bonjour ${displayName},</p>

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

    Bonjour ${displayName},

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
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<void> {
  console.log(`📧 [EMAIL] Tentative d'envoi d'email:`);
  console.log(`   → Destinataire: ${to}`);
  console.log(`   → Sujet: ${subject}`);
  console.log(`   → Expéditeur: "${config.email.fromName}" <${config.email.from}>`);
  console.log(`   → Serveur SMTP: ${config.email.host}:${config.email.port}`);

  try {
    const info = await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to,
      subject,
      html,
      text: text || '',
    });

    console.log(`✅ [EMAIL] Email envoyé avec succès!`);
    console.log(`   → Message ID: ${info.messageId}`);
    console.log(`   → Response: ${info.response}`);
    console.log(`   → Accepted: ${info.accepted?.join(', ') || 'N/A'}`);
    console.log(`   → Rejected: ${info.rejected?.join(', ') || 'Aucun'}`);
  } catch (error: any) {
    console.error(`❌ [EMAIL] ÉCHEC de l'envoi de l'email à ${to}`);
    console.error(`   → Type d'erreur: ${error.name || 'Unknown'}`);
    console.error(`   → Message: ${error.message || 'Aucun message'}`);
    console.error(`   → Code: ${error.code || 'N/A'}`);
    console.error(`   → Command: ${error.command || 'N/A'}`);

    if (error.response) {
      console.error(`   → SMTP Response: ${error.response}`);
    }

    // Log complet de l'erreur pour le debugging
    console.error(`   → Stack trace:`, error.stack);

    throw new Error(`Échec de l'envoi de l'email: ${error.message || 'Erreur inconnue'}`);
  }
}

/**
 * Envoie un email d'alerte de prix
 */
interface SendPriceAlertEmailParams {
  email: string;
  name: string;
  stockTicker: string;
  alertType: 'ABOVE' | 'BELOW';
  targetPrice: number;
  currentPrice: number;
}

export async function sendPriceAlertEmail({
  email,
  name,
  stockTicker,
  alertType,
  targetPrice,
  currentPrice,
}: SendPriceAlertEmailParams): Promise<void> {
  const alertTypeText = alertType === 'ABOVE' ? 'dépassé' : 'descendu sous';
  const displayName = name || 'Investisseur';

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Alerte Prix - ${stockTicker} - AfriBourse</title>
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
        .alert-box {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          padding: 25px;
          border-radius: 12px;
          margin: 30px 0;
          text-align: center;
        }
        .alert-box h2 {
          margin: 0 0 15px 0;
          font-size: 28px;
          color: white;
        }
        .price-info {
          display: flex;
          justify-content: space-around;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .price-item {
          background-color: rgba(255,255,255,0.2);
          padding: 15px 20px;
          border-radius: 8px;
          margin: 5px;
          min-width: 120px;
        }
        .price-label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 5px;
        }
        .price-value {
          font-size: 20px;
          font-weight: bold;
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
        .info-box {
          background-color: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box p {
          margin: 0;
          color: #1e40af;
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

        <h1>🔔 Alerte Prix Déclenchée</h1>

        <p>Bonjour ${displayName},</p>

        <p>Votre alerte de prix pour <strong>${stockTicker}</strong> a été déclenchée !</p>

        <div class="alert-box">
          <h2>${stockTicker}</h2>
          <p style="margin: 0; font-size: 18px;">Le prix a ${alertTypeText} votre seuil cible</p>

          <div class="price-info">
            <div class="price-item">
              <div class="price-label">Prix Cible</div>
              <div class="price-value">${targetPrice.toLocaleString('fr-FR')} FCFA</div>
            </div>
            <div class="price-item">
              <div class="price-label">Prix Actuel</div>
              <div class="price-value">${currentPrice.toLocaleString('fr-FR')} FCFA</div>
            </div>
          </div>
        </div>

        <div class="info-box">
          <p><strong>ℹ️ Information :</strong> Cette alerte a été automatiquement désactivée. Vous pouvez la réactiver depuis votre tableau de bord si vous souhaitez continuer à surveiller ce prix.</p>
        </div>

        <p>Consultez les détails complets de l'action et décidez de votre stratégie d'investissement :</p>

        <div style="text-align: center;">
          <a href="${config.app.frontendUrl}/stocks/${stockTicker}" class="button">Voir ${stockTicker}</a>
        </div>

        <div class="footer">
          <p>Cet email a été envoyé par AfriBourse - Système d'alertes de prix</p>
          <p>Si vous ne souhaitez plus recevoir ces alertes, vous pouvez les désactiver depuis votre profil.</p>
          <p>Questions ? Contactez-nous à contact@africbourse.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Alerte Prix - ${stockTicker} - AfriBourse

    Bonjour ${displayName},

    Votre alerte de prix pour ${stockTicker} a été déclenchée !

    Le prix a ${alertTypeText} votre seuil cible.

    Prix Cible: ${targetPrice.toLocaleString('fr-FR')} FCFA
    Prix Actuel: ${currentPrice.toLocaleString('fr-FR')} FCFA

    Cette alerte a été automatiquement désactivée. Vous pouvez la réactiver depuis votre tableau de bord.

    Consultez les détails: ${config.app.frontendUrl}/stocks/${stockTicker}

    AfriBourse - Votre plateforme d'apprentissage boursier
  `;

  await sendEmail({
    to: email,
    subject: `🔔 Alerte Prix: ${stockTicker} a atteint ${currentPrice.toLocaleString('fr-FR')} FCFA`,
    html,
    text,
  });
}

/**
 * Envoie un email de résumé bi-hebdomadaire du portefeuille
 */
interface SendPortfolioSummaryEmailParams {
  email: string;
  name: string;
  portfolioStats: {
    totalValue: number;
    cashBalance: number;
    investedValue: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    topPerformers: Array<{
      ticker: string;
      gainLossPercent: number;
      value: number;
    }>;
    topLosers: Array<{
      ticker: string;
      gainLossPercent: number;
      value: number;
    }>;
    positionsCount: number;
    period: string;
    biweeklyEvolution?: {
      previousValue: number;
      currentValue: number;
      change: number;
      changePercent: number;
    };
  };
}

export async function sendPortfolioSummaryEmail({
  email,
  name,
  portfolioStats,
}: SendPortfolioSummaryEmailParams): Promise<void> {
  const displayName = name || 'Investisseur';
  const isProfit = portfolioStats.totalGainLoss >= 0;
  const gainLossColor = isProfit ? '#10b981' : '#ef4444';
  const gainLossIcon = isProfit ? '📈' : '📉';

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Résumé de Portefeuille - AfriBourse</title>
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
          margin-bottom: 10px;
        }
        .period {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 20px;
        }
        .summary-box {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin: 30px 0;
          text-align: center;
        }
        .summary-box h2 {
          margin: 0 0 10px 0;
          font-size: 16px;
          opacity: 0.9;
          font-weight: normal;
        }
        .summary-box .value {
          font-size: 36px;
          font-weight: bold;
          margin: 10px 0;
        }
        .summary-box .gain-loss {
          font-size: 20px;
          font-weight: 600;
          padding: 10px 20px;
          background-color: rgba(255,255,255,0.2);
          border-radius: 8px;
          display: inline-block;
          margin-top: 10px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 30px 0;
        }
        .stat-card {
          background-color: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .stat-card h3 {
          color: #6b7280;
          font-size: 12px;
          margin: 0 0 5px 0;
          text-transform: uppercase;
          font-weight: 600;
        }
        .stat-card .value {
          color: #1f2937;
          font-size: 22px;
          font-weight: bold;
          margin: 0;
        }
        .performers-section {
          margin: 30px 0;
        }
        .performers-section h3 {
          color: #1f2937;
          font-size: 18px;
          margin-bottom: 15px;
        }
        .performer-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          margin-bottom: 10px;
          border-radius: 8px;
          background-color: #f9fafb;
        }
        .performer-item.top {
          border-left: 4px solid #10b981;
        }
        .performer-item.bottom {
          border-left: 4px solid #ef4444;
        }
        .performer-name {
          font-weight: 600;
          color: #1f2937;
        }
        .performer-gain {
          font-weight: 700;
          font-size: 16px;
        }
        .performer-gain.positive {
          color: #10b981;
        }
        .performer-gain.negative {
          color: #ef4444;
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
        .tip-box {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .tip-box p {
          margin: 0;
          color: #92400e;
          font-size: 14px;
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

        <h1>📊 Résumé de votre Portefeuille</h1>
        <p class="period">${portfolioStats.period}</p>

        <p>Bonjour ${displayName},</p>

        <p>Voici le résumé de votre portefeuille pour les deux dernières semaines.</p>

        <div class="summary-box">
          <h2>Valeur Totale du Portefeuille</h2>
          <div class="value">${portfolioStats.totalValue.toLocaleString('fr-FR')} FCFA</div>
          <div class="gain-loss" style="color: ${gainLossColor};">
            ${gainLossIcon} ${isProfit ? '+' : ''}${portfolioStats.totalGainLoss.toLocaleString('fr-FR')} FCFA
            (${isProfit ? '+' : ''}${portfolioStats.totalGainLossPercent.toFixed(2)}%)
          </div>
        </div>

        ${portfolioStats.biweeklyEvolution ? `
        <div class="evolution-box" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.95; font-weight: normal;">📊 Évolution Bi-hebdomadaire</h3>
          <div style="display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
              <div style="font-size: 12px; opacity: 0.85; margin-bottom: 5px;">Précédent</div>
              <div style="font-size: 18px; font-weight: bold;">${portfolioStats.biweeklyEvolution.previousValue.toLocaleString('fr-FR')} FCFA</div>
            </div>
            <div style="font-size: 24px;">→</div>
            <div>
              <div style="font-size: 12px; opacity: 0.85; margin-bottom: 5px;">Actuel</div>
              <div style="font-size: 18px; font-weight: bold;">${portfolioStats.biweeklyEvolution.currentValue.toLocaleString('fr-FR')} FCFA</div>
            </div>
          </div>
          <div style="margin-top: 15px; padding: 10px 20px; background-color: rgba(255,255,255,0.2); border-radius: 8px; display: inline-block;">
            <span style="font-size: 20px; font-weight: bold;">
              ${portfolioStats.biweeklyEvolution.change >= 0 ? '↗' : '↘'}
              ${portfolioStats.biweeklyEvolution.change >= 0 ? '+' : ''}${portfolioStats.biweeklyEvolution.change.toLocaleString('fr-FR')} FCFA
              (${portfolioStats.biweeklyEvolution.changePercent >= 0 ? '+' : ''}${portfolioStats.biweeklyEvolution.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        ` : ''}

        <div class="stats-grid">
          <div class="stat-card">
            <h3>Liquidités</h3>
            <p class="value">${portfolioStats.cashBalance.toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div class="stat-card">
            <h3>Investi</h3>
            <p class="value">${portfolioStats.investedValue.toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div class="stat-card">
            <h3>Positions</h3>
            <p class="value">${portfolioStats.positionsCount}</p>
          </div>
          <div class="stat-card">
            <h3>Performance</h3>
            <p class="value" style="color: ${gainLossColor};">
              ${isProfit ? '+' : ''}${portfolioStats.totalGainLossPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        ${portfolioStats.topPerformers.length > 0 ? `
        <div class="performers-section">
          <h3>🏆 Meilleures Performances</h3>
          ${portfolioStats.topPerformers.map(perf => `
            <div class="performer-item top">
              <div>
                <span class="performer-name">${perf.ticker}</span>
                <div style="font-size: 12px; color: #6b7280;">${perf.value.toLocaleString('fr-FR')} FCFA</div>
              </div>
              <span class="performer-gain positive">+${perf.gainLossPercent.toFixed(2)}%</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${portfolioStats.topLosers.length > 0 ? `
        <div class="performers-section">
          <h3>📉 Moins Bonnes Performances</h3>
          ${portfolioStats.topLosers.map(perf => `
            <div class="performer-item bottom">
              <div>
                <span class="performer-name">${perf.ticker}</span>
                <div style="font-size: 12px; color: #6b7280;">${perf.value.toLocaleString('fr-FR')} FCFA</div>
              </div>
              <span class="performer-gain negative">${perf.gainLossPercent.toFixed(2)}%</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="tip-box">
          <p><strong>💡 Conseil :</strong> ${
            isProfit
              ? 'Excellent travail ! Pensez à diversifier vos gains pour minimiser les risques.'
              : 'Les marchés sont volatils. Gardez votre stratégie long terme et ne paniquez pas sur les baisses temporaires.'
          }</p>
        </div>

        <p style="text-align: center; margin-top: 30px;">
          Consultez votre tableau de bord pour plus de détails :
        </p>

        <div style="text-align: center;">
          <a href="${config.app.frontendUrl}/dashboard" class="button">Voir Mon Dashboard</a>
        </div>

        <div class="footer">
          <p>Cet email a été envoyé par AfriBourse - Résumé bi-hebdomadaire</p>
          <p>Vous recevez cet email car vous avez un portefeuille actif sur AfriBourse.</p>
          <p>Questions ? Contactez-nous à contact@africbourse.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Résumé de Portefeuille - AfriBourse
    ${portfolioStats.period}

    Bonjour ${displayName},

    Voici le résumé de votre portefeuille pour les deux dernières semaines.

    📊 VALEUR TOTALE: ${portfolioStats.totalValue.toLocaleString('fr-FR')} FCFA
    ${gainLossIcon} Gain/Perte: ${isProfit ? '+' : ''}${portfolioStats.totalGainLoss.toLocaleString('fr-FR')} FCFA (${isProfit ? '+' : ''}${portfolioStats.totalGainLossPercent.toFixed(2)}%)

    💰 Liquidités: ${portfolioStats.cashBalance.toLocaleString('fr-FR')} FCFA
    📈 Investi: ${portfolioStats.investedValue.toLocaleString('fr-FR')} FCFA
    🎯 Positions: ${portfolioStats.positionsCount}

    ${portfolioStats.topPerformers.length > 0 ? `
    🏆 MEILLEURES PERFORMANCES:
    ${portfolioStats.topPerformers.map(p => `   ${p.ticker}: +${p.gainLossPercent.toFixed(2)}% (${p.value.toLocaleString('fr-FR')} FCFA)`).join('\n')}
    ` : ''}

    ${portfolioStats.topLosers.length > 0 ? `
    📉 MOINS BONNES PERFORMANCES:
    ${portfolioStats.topLosers.map(p => `   ${p.ticker}: ${p.gainLossPercent.toFixed(2)}% (${p.value.toLocaleString('fr-FR')} FCFA)`).join('\n')}
    ` : ''}

    💡 Conseil: ${
      isProfit
        ? 'Excellent travail ! Pensez à diversifier vos gains pour minimiser les risques.'
        : 'Les marchés sont volatils. Gardez votre stratégie long terme.'
    }

    Consultez votre dashboard: ${config.app.frontendUrl}/dashboard

    AfriBourse - Votre plateforme d'apprentissage boursier
  `;

  await sendEmail({
    to: email,
    subject: `📊 Résumé de Portefeuille - ${portfolioStats.period}`,
    html,
    text,
  });
}

/**
 * Envoie un email de résumé hebdomadaire d'apprentissage
 */
interface SendLearningSummaryEmailParams {
  email: string;
  name: string;
  learningStats: {
    totalModulesCompleted: number;
    totalModulesAvailable: number;
    completionPercent: number;
    totalTimeSpentMinutes: number;
    averageQuizScore: number;
    weeklyModulesCompleted: number;
    weeklyQuizzesTaken: number;
    weeklyTimeSpentMinutes: number;
    weeklyXpEarned: number;
    currentStreak: number;
    currentLevel: number;
    totalXp: number;
    recentCompletedModules: Array<{
      title: string;
      slug: string;
      quizScore?: number;
      completedAt: Date;
    }>;
    suggestedModules: Array<{
      title: string;
      slug: string;
      difficulty: string;
      durationMinutes?: number;
    }>;
    recentAchievements: Array<{
      name: string;
      description: string;
      unlockedAt: Date;
    }>;
    period: string;
    isReminder?: boolean;
  };
}

export async function sendLearningSummaryEmail({
  email,
  name,
  learningStats,
}: SendLearningSummaryEmailParams): Promise<void> {
  const displayName = name || 'Apprenant';
  const isReminder = learningStats.isReminder || false;

  // Formatage du temps
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Traduire le niveau de difficulté
  const translateDifficulty = (difficulty: string): string => {
    const map: Record<string, string> = {
      debutant: 'Débutant',
      intermediaire: 'Intermédiaire',
      avance: 'Avancé',
    };
    return map[difficulty] || difficulty;
  };

  // Message de motivation basé sur la progression
  const getMotivationMessage = (): string => {
    if (isReminder) {
      return "Vous n'avez pas étudié cette semaine. Reprenez votre apprentissage pour maintenir votre streak !";
    }
    if (learningStats.weeklyModulesCompleted >= 5) {
      return "Incroyable performance ! Vous êtes une machine d'apprentissage !";
    }
    if (learningStats.weeklyModulesCompleted >= 3) {
      return "Excellent travail cette semaine ! Continuez sur cette lancée !";
    }
    if (learningStats.weeklyModulesCompleted >= 1) {
      return "Bon progrès ! Chaque module vous rapproche de vos objectifs.";
    }
    if (learningStats.weeklyQuizzesTaken > 0) {
      return "Beau travail sur les quiz ! Pensez à compléter plus de modules.";
    }
    return "Continuez votre apprentissage pour devenir un investisseur averti !";
  };

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Résumé d'Apprentissage - AfriBourse</title>
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
          margin-bottom: 10px;
        }
        .period {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 20px;
        }
        .highlight-box {
          background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin: 30px 0;
          text-align: center;
        }
        .highlight-box.reminder {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        .highlight-box h2 {
          margin: 0 0 10px 0;
          font-size: 16px;
          opacity: 0.9;
          font-weight: normal;
        }
        .highlight-box .value {
          font-size: 48px;
          font-weight: bold;
          margin: 10px 0;
        }
        .highlight-box .subtitle {
          font-size: 14px;
          opacity: 0.9;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
          margin: 30px 0;
        }
        .stat-card {
          background-color: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          text-align: center;
        }
        .stat-card h3 {
          color: #6b7280;
          font-size: 11px;
          margin: 0 0 5px 0;
          text-transform: uppercase;
          font-weight: 600;
        }
        .stat-card .value {
          color: #1f2937;
          font-size: 20px;
          font-weight: bold;
          margin: 0;
        }
        .stat-card .value.purple {
          color: #8b5cf6;
        }
        .stat-card .value.green {
          color: #10b981;
        }
        .stat-card .value.orange {
          color: #f97316;
        }
        .progress-section {
          margin: 30px 0;
        }
        .progress-bar-container {
          background-color: #e5e7eb;
          border-radius: 10px;
          height: 20px;
          overflow: hidden;
          margin: 10px 0;
        }
        .progress-bar {
          background: linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%);
          height: 100%;
          border-radius: 10px;
          transition: width 0.3s ease;
        }
        .progress-text {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #6b7280;
        }
        .modules-section {
          margin: 30px 0;
        }
        .modules-section h3 {
          color: #1f2937;
          font-size: 18px;
          margin-bottom: 15px;
        }
        .module-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          margin-bottom: 10px;
          border-radius: 8px;
          background-color: #f9fafb;
          border-left: 4px solid #10b981;
        }
        .module-item.suggested {
          border-left-color: #3b82f6;
        }
        .module-name {
          font-weight: 600;
          color: #1f2937;
        }
        .module-meta {
          font-size: 12px;
          color: #6b7280;
        }
        .module-score {
          font-weight: 700;
          font-size: 16px;
          color: #10b981;
        }
        .badge-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 15px;
          margin: 5px;
          border-radius: 20px;
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
        }
        .badge-icon {
          font-size: 18px;
        }
        .badge-name {
          font-weight: 600;
          color: #92400e;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          padding: 15px 30px;
          background-color: #8b5cf6;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background-color: #7c3aed;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        .motivation-box {
          background-color: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .motivation-box p {
          margin: 0;
          color: #1e40af;
          font-size: 14px;
        }
        .streak-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          padding: 8px 15px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }
        .level-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
          color: white;
          padding: 8px 15px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
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

        <h1>${isReminder ? '⏰ Rappel d\'Apprentissage' : '📚 Résumé de votre Apprentissage'}</h1>
        <p class="period">${learningStats.period}</p>

        <p>Bonjour ${displayName},</p>

        <p>${isReminder ? 'Voici où vous en êtes dans votre parcours d\'apprentissage.' : 'Voici le résumé de votre progression cette semaine.'}</p>

        <div style="text-align: center; margin: 20px 0;">
          <span class="level-badge">🎓 Niveau ${learningStats.currentLevel}</span>
          ${learningStats.currentStreak > 0 ? `<span class="streak-badge">🔥 ${learningStats.currentStreak} jours de streak</span>` : ''}
        </div>

        <div class="highlight-box${isReminder ? ' reminder' : ''}">
          <h2>${isReminder ? 'Modules cette semaine' : 'Modules complétés cette semaine'}</h2>
          <div class="value">${learningStats.weeklyModulesCompleted}</div>
          <div class="subtitle">+${learningStats.weeklyXpEarned.toLocaleString('fr-FR')} XP gagnés</div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <h3>Quiz passés</h3>
            <p class="value purple">${learningStats.weeklyQuizzesTaken}</p>
          </div>
          <div class="stat-card">
            <h3>Temps d'étude</h3>
            <p class="value green">${formatTime(learningStats.weeklyTimeSpentMinutes)}</p>
          </div>
          <div class="stat-card">
            <h3>Score moyen</h3>
            <p class="value orange">${learningStats.averageQuizScore > 0 ? Math.round(learningStats.averageQuizScore) + '%' : '-'}</p>
          </div>
        </div>

        <div class="progress-section">
          <h3>📊 Progression Globale</h3>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${Math.min(learningStats.completionPercent, 100)}%;"></div>
          </div>
          <div class="progress-text">
            <span>${learningStats.totalModulesCompleted} modules complétés</span>
            <span>${Math.round(learningStats.completionPercent)}% du parcours</span>
          </div>
          <p style="font-size: 12px; color: #6b7280; margin-top: 5px;">
            Total XP: ${learningStats.totalXp.toLocaleString('fr-FR')} • Temps total: ${formatTime(learningStats.totalTimeSpentMinutes)}
          </p>
        </div>

        ${learningStats.recentCompletedModules.length > 0 ? `
        <div class="modules-section">
          <h3>✅ Modules Complétés Cette Semaine</h3>
          ${learningStats.recentCompletedModules.map(m => `
            <div class="module-item">
              <div>
                <div class="module-name">${m.title}</div>
                <div class="module-meta">Complété le ${new Date(m.completedAt).toLocaleDateString('fr-FR')}</div>
              </div>
              ${m.quizScore !== undefined ? `<span class="module-score">${Math.round(m.quizScore)}%</span>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${learningStats.recentAchievements.length > 0 ? `
        <div class="modules-section">
          <h3>🏆 Badges Débloqués</h3>
          <div style="text-align: center;">
            ${learningStats.recentAchievements.map(a => `
              <div class="badge-item">
                <span class="badge-icon">🏅</span>
                <span class="badge-name">${a.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${learningStats.suggestedModules.length > 0 ? `
        <div class="modules-section">
          <h3>📖 Prochains Modules Suggérés</h3>
          ${learningStats.suggestedModules.map(m => `
            <div class="module-item suggested">
              <div>
                <div class="module-name">${m.title}</div>
                <div class="module-meta">${translateDifficulty(m.difficulty)}${m.durationMinutes ? ` • ${m.durationMinutes} min` : ''}</div>
              </div>
              <a href="${config.app.frontendUrl}/formation/${m.slug}" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Commencer →</a>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="motivation-box">
          <p><strong>💪 ${getMotivationMessage()}</strong></p>
        </div>

        <p style="text-align: center; margin-top: 30px;">
          Continuez votre apprentissage :
        </p>

        <div style="text-align: center;">
          <a href="${config.app.frontendUrl}/formation" class="button">Accéder à la Formation</a>
        </div>

        <div class="footer">
          <p>Cet email a été envoyé par AfriBourse - Résumé hebdomadaire</p>
          <p>Vous recevez cet email car vous avez commencé un parcours d'apprentissage sur AfriBourse.</p>
          <p>Questions ? Contactez-nous à contact@africbourse.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Résumé d'Apprentissage - AfriBourse
    ${learningStats.period}

    Bonjour ${displayName},

    ${isReminder ? 'Voici où vous en êtes dans votre parcours d\'apprentissage.' : 'Voici le résumé de votre progression cette semaine.'}

    🎓 Niveau ${learningStats.currentLevel} | 🔥 Streak: ${learningStats.currentStreak} jours

    📚 CETTE SEMAINE:
    → Modules complétés: ${learningStats.weeklyModulesCompleted}
    → Quiz passés: ${learningStats.weeklyQuizzesTaken}
    → Temps d'étude: ${formatTime(learningStats.weeklyTimeSpentMinutes)}
    → XP gagnés: +${learningStats.weeklyXpEarned}

    📊 PROGRESSION GLOBALE:
    → ${learningStats.totalModulesCompleted}/${learningStats.totalModulesAvailable} modules (${Math.round(learningStats.completionPercent)}%)
    → Score moyen: ${learningStats.averageQuizScore > 0 ? Math.round(learningStats.averageQuizScore) + '%' : '-'}
    → Total XP: ${learningStats.totalXp}

    ${learningStats.recentCompletedModules.length > 0 ? `
    ✅ MODULES COMPLÉTÉS:
    ${learningStats.recentCompletedModules.map(m => `   ${m.title}${m.quizScore ? ` (${Math.round(m.quizScore)}%)` : ''}`).join('\n')}
    ` : ''}

    ${learningStats.recentAchievements.length > 0 ? `
    🏆 BADGES DÉBLOQUÉS:
    ${learningStats.recentAchievements.map(a => `   ${a.name}`).join('\n')}
    ` : ''}

    ${learningStats.suggestedModules.length > 0 ? `
    📖 PROCHAINS MODULES:
    ${learningStats.suggestedModules.map(m => `   ${m.title} (${translateDifficulty(m.difficulty)})`).join('\n')}
    ` : ''}

    💪 ${getMotivationMessage()}

    Continuez votre apprentissage: ${config.app.frontendUrl}/formation

    AfriBourse - Votre plateforme d'apprentissage boursier
  `;

  await sendEmail({
    to: email,
    subject: isReminder
      ? `⏰ Rappel: Reprenez votre apprentissage sur AfriBourse`
      : `📚 Votre semaine d'apprentissage - ${learningStats.weeklyModulesCompleted} module(s) complété(s)`,
    html,
    text,
  });
}

/**
 * Envoie un email de félicitations aux top performers du classement
 */
interface SendLeaderboardCongratulationParams {
  email: string;
  name: string;
  rank: number;
  roi: number;
}

export async function sendLeaderboardCongratulationEmail({
  email,
  name,
  rank,
  roi,
}: SendLeaderboardCongratulationParams): Promise<void> {
  const displayName = name || 'Investisseur';
  const classementUrl = `${config.app.frontendUrl}/classement`;

  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
  const rankLabel = rank === 1 ? '1er' : `${rank}ème`;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Félicitations ! Vous êtes dans le Top 5 - AfriBourse</title>
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
          font-size: 28px;
          font-weight: bold;
          color: #f97316;
        }
        .rank-badge {
          display: inline-block;
          font-size: 48px;
          margin: 20px 0;
        }
        .rank-text {
          font-size: 24px;
          font-weight: bold;
          color: #1e293b;
          margin: 10px 0;
        }
        .roi-badge {
          display: inline-block;
          background-color: ${roi >= 0 ? '#ecfdf5' : '#fef2f2'};
          color: ${roi >= 0 ? '#059669' : '#dc2626'};
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 18px;
          font-weight: bold;
          margin: 10px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white !important;
          text-decoration: none;
          padding: 14px 30px;
          border-radius: 10px;
          font-weight: bold;
          font-size: 16px;
          margin: 20px 0;
        }
        .new-badge {
          display: inline-block;
          background-color: #dbeafe;
          color: #2563eb;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .feature-box {
          background-color: #f8fafc;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #6366f1;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M17 6H23V12" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="logo-text">AfriBourse</span>
          </div>
        </div>

        <div style="text-align: center;">
          <div class="rank-badge">${rankEmoji}</div>
          <h1 style="color: #1e293b; margin: 0;">Félicitations ${displayName} !</h1>
          <p class="rank-text">Vous êtes ${rankLabel} du classement !</p>
          <div class="roi-badge">${roi >= 0 ? '+' : ''}${roi.toFixed(1)}% de rendement</div>
        </div>

        <p style="text-align: center; font-size: 16px; color: #64748b; margin-top: 20px;">
          Votre stratégie d'investissement porte ses fruits. Vous faites partie des <strong>5 meilleurs portfolios simulés</strong> sur AfriBourse. Bravo !
        </p>

        <div class="feature-box">
          <span class="new-badge">🆕 NOUVEAU</span>
          <h3 style="margin: 0 0 10px 0; color: #1e293b;">Le classement est maintenant public !</h3>
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            Nous avons lancé une nouvelle page <strong>Classement</strong> visible par toute la communauté. Votre performance est désormais affichée dans la section communauté et sur la page classement dédiée. Continuez à investir intelligemment pour garder votre place au sommet !
          </p>
        </div>

        <div style="text-align: center;">
          <a href="${classementUrl}" class="button">🏆 Voir le classement</a>
        </div>

        <p style="text-align: center; font-size: 14px; color: #94a3b8;">
          Continuez à analyser, diversifier et prendre des décisions éclairées.<br/>
          La communauté AfriBourse vous observe ! 💪
        </p>

        <div class="footer">
          <p>Cet email a été envoyé par AfriBourse</p>
          <p>Si vous avez des questions, contactez-nous à contact@africbourse.com</p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} AfriBourse. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Félicitations ${displayName} ! ${rankEmoji}

Vous êtes ${rankLabel} du classement des meilleurs portfolios simulés sur AfriBourse avec un rendement de ${roi >= 0 ? '+' : ''}${roi.toFixed(1)}% !

🆕 NOUVEAU : Le classement est maintenant public !
Nous avons lancé une nouvelle page Classement visible par toute la communauté. Votre performance est affichée dans la section communauté et sur la page classement dédiée.

Voir le classement : ${classementUrl}

Continuez à analyser, diversifier et prendre des décisions éclairées.
La communauté AfriBourse vous observe !

---
AfriBourse - Apprenez, simulez et investissez en toute confiance.
  `;

  await sendEmail({
    to: email,
    subject: `${rankEmoji} Félicitations ! Vous êtes ${rankLabel} du classement AfriBourse`,
    html,
    text,
  });
}

/**
 * Envoie un email d'annonce de l'application installable (PWA)
 */
export async function sendPWAAnnouncementEmail({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const displayName = name || 'Investisseur';
  const appUrl = config.app.frontendUrl;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AfriBourse est maintenant une application ! 📱</title>
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
          font-size: 28px;
          font-weight: bold;
          color: #f97316;
        }
        .hero-emoji {
          font-size: 56px;
          text-align: center;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white !important;
          text-decoration: none;
          padding: 14px 30px;
          border-radius: 10px;
          font-weight: bold;
          font-size: 16px;
          margin: 15px 0;
        }
        .step-card {
          background-color: #f8fafc;
          border-radius: 10px;
          padding: 16px 20px;
          margin: 12px 0;
          border-left: 4px solid #f97316;
        }
        .step-number {
          display: inline-block;
          width: 28px;
          height: 28px;
          background-color: #f97316;
          color: white;
          border-radius: 50%;
          text-align: center;
          line-height: 28px;
          font-weight: bold;
          font-size: 14px;
          margin-right: 10px;
        }
        .platform-section {
          margin: 25px 0;
        }
        .platform-title {
          font-size: 16px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .advantage-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin: 8px 0;
        }
        .advantage-icon {
          font-size: 18px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M17 6H23V12" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="logo-text">AfriBourse</span>
          </div>
        </div>

        <div class="hero-emoji">📱💻</div>

        <h1 style="text-align: center; color: #1e293b; margin: 0 0 10px 0;">
          AfriBourse est maintenant une application !
        </h1>
        <p style="text-align: center; color: #64748b; font-size: 16px;">
          Bonjour ${displayName}, bonne nouvelle ! Vous pouvez maintenant installer AfriBourse directement sur votre téléphone ou votre ordinateur, comme une vraie application.
        </p>

        <!-- Avantages -->
        <div style="margin: 25px 0;">
          <h3 style="color: #1e293b; margin-bottom: 12px;">Pourquoi installer l'application ?</h3>
          <div class="advantage-item">
            <span class="advantage-icon">⚡</span>
            <span><strong>Accès rapide</strong> – Lancez AfriBourse en un clic depuis votre écran d'accueil</span>
          </div>
          <div class="advantage-item">
            <span class="advantage-icon">🔔</span>
            <span><strong>Notifications</strong> – Recevez des alertes en temps réel sur vos investissements</span>
          </div>
          <div class="advantage-item">
            <span class="advantage-icon">📊</span>
            <span><strong>Plein écran</strong> – Une expérience immersive sans barre de navigateur</span>
          </div>
          <div class="advantage-item">
            <span class="advantage-icon">🚀</span>
            <span><strong>Plus rapide</strong> – Chargement quasi instantané après l'installation</span>
          </div>
        </div>

        <!-- Mobile -->
        <div class="platform-section">
          <div class="platform-title">📱 Sur mobile (Android / iPhone)</div>
          <div class="step-card">
            <span class="step-number">1</span>
            Ouvrez <strong>${appUrl.replace('https://', '')}</strong> dans votre navigateur (Chrome ou Safari)
          </div>
          <div class="step-card">
            <span class="step-number">2</span>
            <strong>Sur Android :</strong> Appuyez sur le menu ⋮ puis <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong>
          </div>
          <div class="step-card">
            <span class="step-number">2</span>
            <strong>Sur iPhone :</strong> Appuyez sur le bouton de partage <strong>↑</strong> puis <strong>"Sur l'écran d'accueil"</strong>
          </div>
          <div class="step-card">
            <span class="step-number">3</span>
            Confirmez et l'icône AfriBourse apparaîtra sur votre écran d'accueil !
          </div>
        </div>

        <!-- PC -->
        <div class="platform-section">
          <div class="platform-title">💻 Sur PC (Windows / Mac)</div>
          <div class="step-card">
            <span class="step-number">1</span>
            Ouvrez <strong>${appUrl.replace('https://', '')}</strong> dans Chrome ou Edge
          </div>
          <div class="step-card">
            <span class="step-number">2</span>
            Cliquez sur l'icône d'installation <strong>⊕</strong> dans la barre d'adresse (à droite)
          </div>
          <div class="step-card">
            <span class="step-number">3</span>
            Cliquez sur <strong>"Installer"</strong> et AfriBourse s'ouvre comme une application de bureau !
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}" class="button">📱 Installer AfriBourse</a>
        </div>

        <p style="text-align: center; font-size: 14px; color: #94a3b8;">
          Pas besoin de passer par l'App Store ou le Play Store.<br/>
          L'installation se fait directement depuis votre navigateur en 30 secondes !
        </p>

        <div class="footer">
          <p>Cet email a été envoyé par AfriBourse</p>
          <p>Si vous avez des questions, contactez-nous à contact@africbourse.com</p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} AfriBourse. Tous droits réservés.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bonjour ${displayName} !

AfriBourse est maintenant une application installable sur mobile et PC !

POURQUOI INSTALLER L'APPLICATION ?
⚡ Accès rapide – Lancez AfriBourse en un clic depuis votre écran d'accueil
🔔 Notifications – Recevez des alertes en temps réel
📊 Plein écran – Une expérience immersive
🚀 Plus rapide – Chargement quasi instantané

📱 SUR MOBILE (Android / iPhone) :
1. Ouvrez ${appUrl.replace('https://', '')} dans votre navigateur
2. Android : Menu ⋮ > "Installer l'application" ou "Ajouter à l'écran d'accueil"
   iPhone : Bouton partage ↑ > "Sur l'écran d'accueil"
3. Confirmez et c'est fait !

💻 SUR PC (Windows / Mac) :
1. Ouvrez ${appUrl.replace('https://', '')} dans Chrome ou Edge
2. Cliquez sur l'icône d'installation dans la barre d'adresse
3. Cliquez sur "Installer"

Pas besoin de passer par l'App Store ou le Play Store.
L'installation se fait directement depuis votre navigateur en 30 secondes !

---
AfriBourse - Apprenez, simulez et investissez en toute confiance.
  `;

  await sendEmail({
    to: email,
    subject: '📱 AfriBourse est maintenant une application ! Installez-la en 30 secondes',
    html,
    text,
  });
}

export default {
  sendConfirmationEmail,
  sendPasswordResetEmail,
  sendPriceAlertEmail,
  sendPortfolioSummaryEmail,
  sendLearningSummaryEmail,
  sendLeaderboardCongratulationEmail,
  sendPWAAnnouncementEmail,
  sendEmail,
};
