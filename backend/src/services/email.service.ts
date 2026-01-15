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

export default {
  sendConfirmationEmail,
  sendPasswordResetEmail,
  sendPriceAlertEmail,
  sendPortfolioSummaryEmail,
  sendEmail,
};
