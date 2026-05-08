import { log } from '../config/logger';
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
          <p><strong>⏰ Ce lien expire dans 72 heures</strong></p>
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

    Ce lien expire dans 72 heures.

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
 * Envoie un email d'invitation à l'essai gratuit de 14 jours
 */
export async function sendTrialInviteEmail({
  email,
  name,
  token,
}: {
  email: string;
  name: string;
  token: string;
}): Promise<void> {
  const claimUrl = `${config.app.frontendUrl}/essai-gratuit?token=${token}`;
  const displayName = name.split(' ')[0];

  const frontendUrl = config.app.frontendUrl;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Votre essai gratuit 14 jours - AfriBourse IA</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0f4f8; }
        .container { background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .logo-text { font-size: 28px; font-weight: bold; color: #f97316; margin: 0; text-align: center; }
        .hero { background: linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%); border-radius: 12px; padding: 32px 24px; text-align: center; margin: 20px 0 28px; }
        .hero h1 { color: #ffffff; font-size: 24px; margin: 0 0 8px 0; }
        .hero p { color: #c7d2fe; margin: 0; font-size: 15px; }
        .section-title { font-size: 16px; font-weight: 700; color: #1f2937; margin: 28px 0 12px; border-left: 4px solid #f97316; padding-left: 10px; }
        .feature-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; margin-bottom: 14px; }
        .feature-card.blue { border-left: 4px solid #3b82f6; background: #eff6ff; }
        .feature-card.purple { border-left: 4px solid #8b5cf6; background: #f5f3ff; }
        .feature-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .feature-emoji { font-size: 22px; }
        .feature-name { font-weight: 700; font-size: 15px; color: #1f2937; }
        .feature-tag { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; margin-left: auto; }
        .tag-blue { background: #dbeafe; color: #1d4ed8; }
        .tag-purple { background: #ede9fe; color: #7c3aed; }
        .feature-desc { font-size: 13px; color: #4b5563; margin: 0 0 10px; }
        .feature-capabilities { list-style: none; padding: 0; margin: 0 0 12px; }
        .feature-capabilities li { font-size: 13px; color: #374151; padding: 3px 0; }
        .feature-capabilities li::before { content: "✓ "; color: #10b981; font-weight: bold; }
        .where-to-find { background: #f9fafb; border-radius: 6px; padding: 8px 12px; font-size: 12px; color: #6b7280; }
        .where-to-find strong { color: #374151; }
        .where-link { color: #f97316; font-weight: 600; text-decoration: none; }
        .cta-block { text-align: center; margin: 28px 0; }
        .button { display: inline-block; padding: 16px 44px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-size: 17px; font-weight: bold; }
        .timer { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center; color: #92400e; font-size: 14px; }
        .url-fallback { word-break: break-all; color: #f97316; font-size: 12px; }
        .note { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 10px; }
        .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">

        <p class="logo-text">📈 AfriBourse</p>

        <div class="hero">
          <h1>🎁 14 jours d'accès IA offerts</h1>
          <p>Découvrez SIMBA et l'Analyste IA — gratuitement, sans carte bancaire</p>
        </div>

        <p>Bonjour <strong>${displayName}</strong>,</p>
        <p>Nous vous offrons un accès complet à nos outils IA pour tester par vous-même ce qu'ils peuvent faire pour votre investissement sur la BRVM.</p>

        <!-- FEATURE 1 : SIMBA COACH -->
        <p class="section-title">🤖 SIMBA — Votre Coach IA personnel</p>
        <div class="feature-card blue">
          <div class="feature-header">
            <span class="feature-emoji">💬</span>
            <span class="feature-name">SIMBA — Coach IA</span>
            <span class="feature-tag tag-blue">Académie</span>
          </div>
          <p class="feature-desc">Un assistant intelligent qui répond à toutes vos questions sur la bourse, l'investissement et les marchés africains — disponible à tout moment, en français.</p>
          <ul class="feature-capabilities">
            <li>Expliquer les concepts boursiers (PER, dividende, action, obligation…)</li>
            <li>Répondre à vos questions sur la BRVM et les marchés africains</li>
            <li>Vous guider dans vos modules d'apprentissage</li>
            <li>Vous aider à comprendre vos résultats de quiz</li>
          </ul>
          <div class="where-to-find">
            📍 <strong>Où le trouver :</strong> Allez dans
            <a href="${frontendUrl}/learn" class="where-link">Académie (Apprendre)</a>
            → ouvrez n'importe quel module → bouton <strong>"Demander à SIMBA"</strong>
          </div>
        </div>

        <!-- FEATURE 2 : ANALYSTE DE MARCHÉ -->
        <p class="section-title">📊 Analyste de Marché — L'IA qui lit vos actions</p>
        <div class="feature-card purple">
          <div class="feature-header">
            <span class="feature-emoji">🔍</span>
            <span class="feature-name">Analyste SIMBA</span>
            <span class="feature-tag tag-purple">Marchés</span>
          </div>
          <p class="feature-desc">Une analyse approfondie de n'importe quelle action cotée sur la BRVM — valorisation, ratios, risques, comparaison sectorielle. Plus un chat pour poser vos questions directement sur l'action.</p>
          <ul class="feature-capabilities">
            <li>Analyse complète d'une action (PER, rendement, valorisation)</li>
            <li>Comparaison avec le secteur et les moyennes du marché</li>
            <li>Identification des points forts et des risques</li>
            <li>Chat en direct : posez n'importe quelle question sur l'action</li>
          </ul>
          <div class="where-to-find">
            📍 <strong>Où le trouver :</strong> Allez dans
            <a href="${frontendUrl}/markets" class="where-link">Marchés</a>
            → cliquez sur une action (ex : SGBC, BOAB, ONTBF…) → onglet <strong>"Vue d'ensemble"</strong> → section <strong>"Analyse par SIMBA"</strong>
          </div>
        </div>

        <!-- CTA -->
        <div class="cta-block">
          <div class="timer">⏰ <strong>Offre limitée — 14 jours à partir de l'activation</strong><br>Aucun paiement requis, aucune carte bancaire demandée.</div>
          <a href="${claimUrl}" class="button">🚀 Activer mon accès gratuit</a>
          <p class="note">Ou copiez ce lien dans votre navigateur :</p>
          <p class="url-fallback">${claimUrl}</p>
        </div>

        <div class="footer">
          <p>© AfriBourse — Votre plateforme d'investissement africaine</p>
          <p>Après 14 jours, votre compte revient automatiquement sur le plan gratuit.<br>Si vous n'êtes pas à l'origine de cette offre, ignorez simplement cet email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bonjour ${displayName},

Nous vous offrons 14 jours d'accès gratuit aux outils IA d'AfriBourse.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 SIMBA — Coach IA personnel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Posez toutes vos questions sur la bourse et la BRVM.
✓ Explique les concepts (PER, dividende, obligations…)
✓ Répond à vos questions sur les marchés africains
✓ Vous aide dans vos modules d'apprentissage

📍 Où le trouver : Académie (Apprendre) → ouvrez un module → "Demander à SIMBA"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Analyste de Marché IA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyse complète de n'importe quelle action BRVM.
✓ Valorisation, PER, rendement du dividende
✓ Comparaison sectorielle et risques
✓ Chat en direct sur l'action de votre choix

📍 Où le trouver : Marchés → cliquez sur une action → "Vue d'ensemble" → "Analyse par SIMBA"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Activez votre accès (14 jours, gratuit) :
${claimUrl}

Après 14 jours, votre compte revient automatiquement sur le plan gratuit.
Aucun paiement, aucune carte bancaire.

AfriBourse — Votre plateforme d'investissement africaine
  `;

  await sendEmail({
    to: email,
    subject: '🎁 Votre essai gratuit 14 jours — SIMBA IA & Conseiller Financier',
    html,
    text,
  });
}

/**
 * Fonction générique d'envoi d'email
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<void> {
  log.debug(`📧 [EMAIL] Tentative d'envoi d'email:`);
  log.debug(`   → Destinataire: ${to}`);
  log.debug(`   → Sujet: ${subject}`);
  log.debug(`   → Expéditeur: "${config.email.fromName}" <${config.email.from}>`);
  log.debug(`   → Serveur SMTP: ${config.email.host}:${config.email.port}`);

  try {
    const info = await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to,
      subject,
      html,
      text: text || '',
    });

    log.debug(`✅ [EMAIL] Email envoyé avec succès!`);
    log.debug(`   → Message ID: ${info.messageId}`);
    log.debug(`   → Response: ${info.response}`);
    log.debug(`   → Accepted: ${info.accepted?.join(', ') || 'N/A'}`);
    log.debug(`   → Rejected: ${info.rejected?.join(', ') || 'Aucun'}`);
  } catch (error: any) {
    log.error(`❌ [EMAIL] ÉCHEC de l'envoi de l'email à ${to}`);
    log.error(`   → Type d'erreur: ${error.name || 'Unknown'}`);
    log.error(`   → Message: ${error.message || 'Aucun message'}`);
    log.error(`   → Code: ${error.code || 'N/A'}`);
    log.error(`   → Command: ${error.command || 'N/A'}`);

    if (error.response) {
      log.error(`   → SMTP Response: ${error.response}`);
    }

    // Log complet de l'erreur pour le debugging
    log.error(`   → Stack trace:`, error.stack);

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
  topSignalTicker?: string;
}

export async function sendLeaderboardCongratulationEmail({
  email,
  name,
  rank,
  roi,
  topSignalTicker,
}: SendLeaderboardCongratulationParams): Promise<void> {
  const firstName = (name || 'Investisseur').split(' ')[0];
  const rankLabel = rank === 1 ? '1er' : `${rank}ème`;
  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
  const roiDisplay = `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`;
  const ctaUrl = topSignalTicker
    ? `${config.app.frontendUrl}/stock/${topSignalTicker}`
    : `${config.app.frontendUrl}/classement`;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Top classement — AfriBourse</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f0f4f8;
          color: #1e293b;
        }
        .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
        .card {
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .hero {
          background: linear-gradient(135deg, #0A1628 0%, #1a3a5c 100%);
          padding: 40px 32px 32px;
          text-align: center;
        }
        .hero-emoji { font-size: 52px; display: block; margin-bottom: 12px; }
        .hero-title { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 6px; }
        .hero-sub { font-size: 14px; color: rgba(255,255,255,0.7); }
        .roi-pill {
          display: inline-block;
          background: ${roi >= 0 ? 'rgba(0,212,168,0.15)' : 'rgba(239,68,68,0.15)'};
          color: ${roi >= 0 ? '#00D4A8' : '#ef4444'};
          border: 1px solid ${roi >= 0 ? '#00D4A8' : '#ef4444'};
          border-radius: 100px;
          padding: 6px 18px;
          font-size: 18px;
          font-weight: 700;
          margin-top: 14px;
        }
        .body { padding: 32px; }
        .section-title {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }
        .option-row {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .option-box {
          flex: 1;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
        }
        .option-label {
          font-size: 13px;
          font-weight: 700;
          color: #0A1628;
          margin-bottom: 4px;
        }
        .option-desc { font-size: 12px; color: #64748b; line-height: 1.5; }
        .cta-wrap { text-align: center; margin: 8px 0 24px; }
        .cta-btn {
          display: inline-block;
          background: linear-gradient(135deg, #00D4A8, #00b894);
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 15px;
        }
        .signature { font-size: 14px; color: #64748b; line-height: 1.7; }
        .signature strong { color: #0A1628; }
        .footer {
          text-align: center;
          padding: 20px 32px;
          border-top: 1px solid #f1f5f9;
          font-size: 11px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <!-- Hero -->
          <div class="hero">
            <span class="hero-emoji">${rankEmoji}</span>
            <div class="hero-title">🏆 ${firstName}, vous êtes ${rankLabel} du classement</div>
            <div class="hero-sub">et votre stratégie fonctionne</div>
            <div class="roi-pill">${roiDisplay} cette semaine</div>
          </div>

          <!-- Body -->
          <div class="body">
            <p style="font-size:15px;color:#334155;line-height:1.7;margin-bottom:24px;">
              Bravo, ${firstName}. Être <strong>${rankLabel}</strong> du classement AfriBourse avec <strong>${roiDisplay}</strong>,
              ce n'est pas de la chance — c'est le résultat d'une analyse rigoureuse.<br><br>
              Maintenant, deux options s'offrent à vous :
            </p>

            <p class="section-title">Votre prochaine étape</p>
            <div class="option-row">
              <div class="option-box">
                <div class="option-label">🛡️ Consolider</div>
                <div class="option-desc">
                  Sécurisez vos gains. Diversifiez sur des valeurs défensives pour protéger votre avance.
                </div>
              </div>
              <div class="option-box">
                <div class="option-label">⚡ Attaquer</div>
                <div class="option-desc">
                  SIMBA a repéré des signaux forts cette semaine. Agissez avant que le marché ne réagisse.
                </div>
              </div>
            </div>

            <div class="cta-wrap">
              <a href="${ctaUrl}" class="cta-btn">
                Voir les recommandations SIMBA →
              </a>
            </div>

            <p class="signature">
              Bravo, ${firstName}. Le marché BRVM vous appartient cette semaine.<br><br>
              — <strong>KOFI</strong><br>
              <span style="font-size:12px;color:#94a3b8;">Équipe AfriBourse</span>
            </p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} AfriBourse · <a href="${config.app.frontendUrl}" style="color:#00D4A8;text-decoration:none;">afribourse.com</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🏆 ${firstName}, vous êtes ${rankLabel} du classement — et votre stratégie fonctionne

${roiDisplay} cette semaine. Être ${rankLabel} du classement AfriBourse, ce n'est pas de la chance.

Deux options s'offrent à vous :

🛡️ Consolider — Sécurisez vos gains sur des valeurs défensives.
⚡ Attaquer — SIMBA a repéré des signaux forts cette semaine.

Voir les recommandations SIMBA : ${ctaUrl}

Bravo, ${firstName}. Le marché BRVM vous appartient cette semaine.
— KOFI, Équipe AfriBourse
  `;

  await sendEmail({
    to: email,
    subject: `🏆 ${firstName}, vous êtes ${rankLabel} du classement — et votre stratégie fonctionne`,
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

/**
 * Envoie un email d'annonce du Grand Challenge AfriBourse
 */
export async function sendGrandChallengeAnnouncementEmail({
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
      <title>Le Grand Challenge AfriBourse a commencé !</title>
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
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo-text {
          font-size: 28px;
          font-weight: bold;
          color: #f97316;
        }
        .hero-banner {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 12px;
          padding: 30px 20px;
          text-align: center;
          margin: 20px 0 30px;
        }
        .hero-trophy {
          font-size: 60px;
          display: block;
          margin-bottom: 10px;
        }
        .hero-title {
          font-size: 24px;
          font-weight: bold;
          color: #f97316;
          margin: 0 0 8px;
          letter-spacing: 0.5px;
        }
        .hero-subtitle {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        }
        .greeting {
          font-size: 16px;
          color: #1e293b;
          margin-bottom: 16px;
        }
        .intro-text {
          font-size: 15px;
          color: #475569;
          margin-bottom: 24px;
        }
        .highlight-box {
          background: linear-gradient(135deg, #fff7ed, #ffedd5);
          border: 1px solid #fed7aa;
          border-radius: 10px;
          padding: 20px 24px;
          margin: 20px 0;
        }
        .highlight-box h3 {
          font-size: 16px;
          color: #c2410c;
          margin: 0 0 12px;
        }
        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin: 10px 0;
          font-size: 14px;
          color: #374151;
        }
        .info-icon {
          font-size: 18px;
          flex-shrink: 0;
        }
        .community-box {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 10px;
          padding: 20px 24px;
          margin: 20px 0;
          text-align: center;
        }
        .community-box h3 {
          font-size: 16px;
          color: #166534;
          margin: 0 0 8px;
        }
        .community-box p {
          font-size: 14px;
          color: #166534;
          margin: 0 0 14px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white !important;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 10px;
          font-weight: bold;
          font-size: 16px;
          margin: 8px 0;
        }
        .button-secondary {
          display: inline-block;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: white !important;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 10px;
          font-weight: bold;
          font-size: 14px;
          margin: 8px 0;
        }
        .divider {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 28px 0;
        }
        .good-luck {
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, #1e293b, #0f172a);
          border-radius: 10px;
          margin: 20px 0;
        }
        .good-luck p {
          color: #f8fafc;
          font-size: 16px;
          margin: 0 0 4px;
          font-weight: 600;
        }
        .good-luck .sub {
          color: #94a3b8;
          font-size: 13px;
          font-style: italic;
        }
        .footer {
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
          margin-top: 30px;
        }
        .footer a {
          color: #f97316;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">AfriBourse</div>
        </div>

        <div class="hero-banner">
          <span class="hero-trophy">🏆</span>
          <h1 class="hero-title">Le Grand Challenge AfriBourse</h1>
          <p class="hero-subtitle">Le défi qui va révéler les meilleurs investisseurs d'Afrique</p>
        </div>

        <p class="greeting">Bonjour <strong>${displayName}</strong>,</p>

        <p class="intro-text">
          Le moment est venu. Le <strong>Grand Challenge AfriBourse</strong> est officiellement lancé !
          C'est votre chance de prouver que vous êtes parmi les meilleurs investisseurs de notre communauté.
        </p>

        <div class="highlight-box">
          <h3>📋 Ce que vous devez savoir</h3>
          <div class="info-item">
            <span class="info-icon">📅</span>
            <span><strong>Échéances :</strong> Toutes les dates importantes sont disponibles dans la communauté</span>
          </div>
          <div class="info-item">
            <span class="info-icon">📜</span>
            <span><strong>Règles :</strong> Consultez les règles complètes dans la section communauté</span>
          </div>
          <div class="info-item">
            <span class="info-icon">🏅</span>
            <span><strong>Classement :</strong> Suivez votre progression en temps réel, tout est visible et transparent</span>
          </div>
          <div class="info-item">
            <span class="info-icon">🎁</span>
            <span><strong>Prix :</strong> Des récompenses exceptionnelles attendent les meilleurs — découvrez-les dans la communauté</span>
          </div>
        </div>

        <div class="community-box">
          <h3>🌍 Tout se passe dans la Communauté</h3>
          <p>
            Les annonces, les mises à jour du classement, les règles et les prix sont tous publiés dans notre espace communautaire.
            Restez connecté pour ne rien manquer !
          </p>
          <a href="${appUrl}/communaute" class="button-secondary">Rejoindre la Communauté</a>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${appUrl}/challenge" class="button">🚀 Participer au Challenge</a>
        </div>

        <hr class="divider" />

        <p style="font-size: 15px; color: #475569; text-align: center; margin-bottom: 20px;">
          Merci de faire partie de cette aventure. Votre confiance et votre engagement font d'AfriBourse une communauté unique et exceptionnelle.
          <strong style="color: #1e293b;">Vous êtes l'âme de ce projet.</strong>
        </p>

        <div class="good-luck">
          <p>Bonne chance à tous !</p>
          <p class="sub">Que les meilleurs gagnent 🌟</p>
        </div>

        <div class="footer">
          <p>L'équipe AfriBourse</p>
          <p>
            <a href="${appUrl}">afribourse.com</a> ·
            <a href="${appUrl}/communaute">Communauté</a>
          </p>
          <p style="margin-top: 12px; color: #cbd5e1;">
            AfriBourse — Apprenez, simulez et investissez en toute confiance.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Le Grand Challenge AfriBourse a commencé !

Bonjour ${displayName},

Le Grand Challenge AfriBourse est officiellement lancé ! C'est votre chance de prouver que vous êtes parmi les meilleurs investisseurs de notre communauté.

Ce que vous devez savoir :
- Échéances : Disponibles dans la communauté
- Règles : Consultez la section communauté
- Classement : Visible en temps réel, tout est transparent
- Prix : Découvrez les récompenses dans la communauté

Rendez-vous sur : ${appUrl}/challenge

Merci de faire partie de cette aventure.
Bonne chance à tous — que les meilleurs gagnent !

L'équipe AfriBourse
${appUrl}
---
AfriBourse - Apprenez, simulez et investissez en toute confiance.
  `;

  await sendEmail({
    to: email,
    subject: '🏆 Le Grand Challenge AfriBourse a commencé — Bonne chance !',
    html,
    text,
  });
}

/**
 * Envoie un email pour inviter les utilisateurs à compléter leur profil
 */
export async function sendCompleteProfileEmail({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const displayName = name || 'Investisseur';
  const profileUrl = `${config.app.frontendUrl}/profile`;

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Complétez votre profil AfriBourse</title>
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
        .checklist {
          margin: 20px 0;
          padding: 0;
          list-style: none;
        }
        .checklist li {
          padding: 10px 15px;
          margin: 8px 0;
          background-color: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid #f97316;
          font-size: 15px;
        }
        .checklist li span.icon {
          margin-right: 8px;
        }
        .benefit-box {
          background: linear-gradient(135deg, #fef3c7, #fff7ed);
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
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

        <div class="hero-emoji">👤✨</div>

        <h1 style="text-align: center; color: #1e293b; margin: 0 0 10px 0;">
          Complétez votre profil !
        </h1>
        <p style="text-align: center; color: #64748b; font-size: 16px;">
          Bonjour ${displayName}, votre profil AfriBourse n'est pas encore complet. Un profil complet vous permet de profiter pleinement de la plateforme et d'être plus visible dans la communauté.
        </p>

        <h3 style="color: #1e293b; margin-top: 25px;">Ce que vous pouvez ajouter :</h3>
        <ul class="checklist">
          <li><span class="icon">📝</span> <strong>Lien vers vos reseaux sociaux</strong> – Montrez qui vous êtes à la communauté</li>
          <li><span class="icon">🏷️</span> <strong>Nom d'utilisateur</strong> – Choisissez un @ unique et mémorable</li>
          <li><span class="icon">📝</span> <strong>Bio</strong> – Partagez votre parcours et vos centres d'intérêt</li>
          <li><span class="icon">🌍</span> <strong>Pays</strong> – Rejoignez le classement de votre pays</li>
          <li><span class="icon">📈</span> <strong>Objectifs d'investissement</strong> – Personnalisez votre expérience</li>
        </ul>

        <div class="benefit-box">
          <p style="margin: 0; font-size: 15px; color: #92400e;">
            🏆 <strong>Un profil complet vous donne de l'XP</strong> et vous aide à débloquer des badges exclusifs !
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${profileUrl}" class="button">👤 Compléter mon profil</a>
        </div>

        <p style="text-align: center; font-size: 14px; color: #94a3b8;">
          Ça ne prend que 2 minutes et ça fait toute la différence !
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

Votre profil AfriBourse n'est pas encore complet. Un profil complet vous permet de profiter pleinement de la plateforme et d'être plus visible dans la communauté.

CE QUE VOUS POUVEZ AJOUTER :
🏷️ Nom d'utilisateur – Choisissez un @ unique
📝 Bio – Partagez votre parcours
🌍 Pays – Rejoignez le classement de votre pays
📈 Objectifs d'investissement – Personnalisez votre expérience
📝 Lien vers vos reseaux sociaux
🏆 Un profil complet vous donne de l'XP et vous aide à débloquer des badges exclusifs !

Compléter mon profil : ${profileUrl}

Ça ne prend que 2 minutes et ça fait toute la différence !

---
AfriBourse - Apprenez, simulez et investissez en toute confiance.
  `;

  await sendEmail({
    to: email,
    subject: '👤 Complétez votre profil AfriBourse – Débloquez des récompenses !',
    html,
    text,
  });
}

/**
 * Envoie la newsletter de mars 2026 : Badges, Dashboards et Challenge 10M FCFA
 */
export async function sendNewsletterMarch2026Email({
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
      <title>Du nouveau sur Afribourse : Badges, Dashboards et 10 000 000 FCFA à gagner !</title>
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
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo-text {
          font-size: 28px;
          font-weight: bold;
          color: #f97316;
        }
        .hero-banner {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 12px;
          padding: 28px 20px;
          text-align: center;
          margin: 20px 0 30px;
        }
        .hero-title {
          font-size: 22px;
          font-weight: bold;
          color: #f97316;
          margin: 0 0 6px;
        }
        .hero-subtitle {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        }
        .greeting {
          font-size: 16px;
          color: #1e293b;
          margin-bottom: 12px;
          font-weight: 600;
        }
        .intro-text {
          font-size: 15px;
          color: #475569;
          margin-bottom: 28px;
        }
        .section {
          border-left: 4px solid #f97316;
          padding: 16px 20px;
          margin: 20px 0;
          background-color: #fff7ed;
          border-radius: 0 10px 10px 0;
        }
        .section h3 {
          margin: 0 0 8px;
          color: #1e293b;
          font-size: 16px;
        }
        .section p {
          margin: 0 0 14px;
          font-size: 14px;
          color: #475569;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white !important;
          text-decoration: none;
          padding: 11px 24px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 14px;
        }
        .button-primary {
          display: inline-block;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white !important;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 10px;
          font-weight: bold;
          font-size: 16px;
          margin: 4px 0;
        }
        .leaderboard-box {
          background-color: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 10px;
          padding: 18px 22px;
          margin: 20px 0;
        }
        .leaderboard-box h3 {
          font-size: 16px;
          color: #0369a1;
          margin: 0 0 10px;
        }
        .leaderboard-item {
          font-size: 14px;
          color: #1e293b;
          margin: 6px 0;
        }
        .challenge-box {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 1px solid #fbbf24;
          border-radius: 10px;
          padding: 22px 24px;
          margin: 20px 0;
          text-align: center;
        }
        .challenge-box h3 {
          font-size: 18px;
          color: #92400e;
          margin: 0 0 8px;
        }
        .challenge-box p {
          font-size: 14px;
          color: #78350f;
          margin: 0 0 16px;
        }
        .footer {
          text-align: center;
          margin-top: 36px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
          font-size: 13px;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">AfriBourse</div>
        </div>

        <div class="hero-banner">
          <div class="hero-title">🚀 Du nouveau sur Afribourse !</div>
          <div class="hero-subtitle">Badges, Dashboards et 10 000 000 FCFA à gagner</div>
        </div>

        <p class="greeting">Bonjour ${displayName},</p>
        <p class="intro-text">
          L'aventure Afribourse s'accélère ! Nous travaillons sans relâche pour vous offrir l'expérience
          d'investissement la plus immersive et pédagogique possible. Voici ce qui vous attend sur votre plateforme :
        </p>

        <!-- Section 1 : Navigation visuelle -->
        <div class="section">
          <h3>🖼️ Une navigation plus visuelle</h3>
          <p>
            Pour vous repérer en un clin d'œil, des images ont été ajoutées à chaque action.
            Identifier vos titres favoris n'a jamais été aussi intuitif.
          </p>
          <a href="${appUrl}/markets" class="button">Découvrir le nouveau visuel</a>
        </div>

        <!-- Section 2 : Module 8 Uniwax -->
        <div class="section">
          <h3>📊 Zoom sur Uniwax (Module 8)</h3>
          <p>
            Le Module 8 s'enrichit ! Pour ceux d'entre vous qui ont validé les étapes précédentes,
            vous pouvez désormais explorer les études de cas et le dashboard analytique exclusif d'Uniwax.
            Une occasion unique d'analyser une valeur phare comme un pro.
          </p>
          <a href="${appUrl}/learn" class="button">Accéder au Module 8</a>
        </div>

        <!-- Section 3 : Badges -->
        <div class="section">
          <h3>🏆 Gamification : Gagnez bien plus que de l'expérience</h3>
          <p>
            Nous lançons les nouveaux badges Afribourse ! En progressant, vous gagnez de l'XP et montez en niveau
            pour débloquer des récompenses concrètes : de l'argent virtuel pour votre Wallet Sandbox,
            et même... vos premières vraies actions offertes !
          </p>
          <a href="${appUrl}/achievements" class="button">Consulter mes badges et progrès</a>
        </div>

        <!-- Section 4 : Classement -->
        <div class="leaderboard-box">
          <h3>🏁 Le Top 10 Sandbox est en feu !</h3>
          <p style="font-size:14px;color:#374151;margin:0 0 10px;">
            La compétition fait rage dans la communauté. Félicitations à nos leaders actuels :
          </p>
          <div class="leaderboard-item">🥉 9ème : Patrice Siaba (+22%) 📈</div>
          <div class="leaderboard-item">🏅 10ème : Mohamed Samake (+17%) 📈</div>
          <p style="font-size:14px;color:#374151;margin:12px 0 14px;">Qui parviendra à détrôner le sommet du classement ?</p>
          <a href="${appUrl}/classement" class="button">Voir le classement complet</a>
        </div>

        <!-- Section 5 : Challenge -->
        <div class="challenge-box">
          <h3>🔥 Challenge Afribourse — 10 000 000 FCFA</h3>
          <p>
            Le grand challenge est toujours en cours ! Il n'est pas trop tard pour rejoindre la course
            et tenter de remporter une part de la cagnotte de <strong>10 000 000 FCFA</strong>.
          </p>
          <a href="${appUrl}/communities/-challenge-afribourse-le-hub-de-lelite" class="button-primary">
            🚀 JE M'INSCRIS AU CHALLENGE MAINTENANT
          </a>
        </div>

        <p style="font-size:15px;color:#475569;text-align:center;margin-top:28px;">
          Bon investissement à tous sur Afribourse !<br>
          <strong style="color:#f97316;">L'équipe Afribourse</strong>
        </p>

        <div class="footer">
          <p>Vous recevez cet email car vous êtes inscrit sur AfriBourse.</p>
          <p>© 2026 AfriBourse — Tous droits réservés</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bonjour ${displayName},

L'aventure Afribourse s'accélère ! Voici les dernières nouveautés :

🖼️ Navigation visuelle : Des images ont été ajoutées à chaque action.
→ ${appUrl}/markets

📊 Module 8 Uniwax : Explorez le dashboard analytique exclusif d'Uniwax.
→ ${appUrl}/learn

🏆 Nouveaux Badges : Gagnez de l'XP, montez en niveau, débloquez des récompenses.
→ ${appUrl}/achievements

🏁 Top Sandbox :
  9ème : Patrice Siaba (+22%)
  10ème : Mohamed Samake (+17%)
→ ${appUrl}/classement

🔥 Challenge 10 000 000 FCFA — Il n'est pas trop tard !
→ ${appUrl}/communities/-challenge-afribourse-le-hub-de-lelite

Bon investissement !
L'équipe Afribourse
  `.trim();

  await sendEmail({
    to: email,
    subject: '🚀 Du nouveau sur Afribourse : Badges, Dashboards et 10 000 000 FCFA à gagner !',
    html,
    text,
  });
}

// ─── EMAIL 0 — Relance confirmation (J+1 sans confirmation) ───────────────────

export async function sendReengagementEmail0({
  email,
  name,
  confirmationToken,
}: { email: string; name: string; confirmationToken: string }): Promise<void> {
  const confirmationUrl = `${config.app.frontendUrl}/confirmer-inscription?token=${confirmationToken}`;
  const firstName = name.split(' ')[0];

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${firstName}, votre place dans le classement vous attend</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
    .container { background-color: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .logo-text { font-size: 28px; font-weight: bold; color: #f97316; }
    h1 { color: #1f2937; font-size: 22px; margin-bottom: 20px; }
    p { color: #4b5563; margin-bottom: 15px; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; margin: 20px 0; }
    .feature-list { list-style: none; padding: 0; margin: 16px 0; }
    .feature-list li { padding: 8px 0; color: #374151; font-size: 15px; }
    .community-badge { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center; color: #c2410c; font-weight: 600; font-size: 15px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <p class="logo-text">AfriBourse</p>
    <h1>${firstName}, votre place dans le classement vous attend</h1>
    <p>Je suis <strong>SIMBA</strong>, votre coach IA sur AfriBourse.</p>
    <p>Pendant que vous lisez cet email, <strong>2 500+ investisseurs</strong> de la communauté UEMOA suivent déjà leurs positions, apprennent, et s'affrontent dans le classement.</p>
    <p>Votre compte est créé — mais pas encore activé. Un seul clic vous sépare de :</p>
    <ul class="feature-list">
      <li>▸ Votre premier achat simulé (sans risquer un seul franc)</li>
      <li>▸ L'accès aux 47 titres BRVM en temps réel</li>
      <li>▸ Votre score de signal sur chaque action</li>
    </ul>
    <div style="text-align: center;">
      <a href="${confirmationUrl}" class="button">✅ Activer mon compte maintenant →</a>
    </div>
    <div class="community-badge">Le marché n'attend pas. Moi non plus.</div>
    <p style="margin-top: 20px;">— <strong>SIMBA, votre coach BRVM</strong><br><span style="color: #9ca3af; font-size: 13px;">Afribourse · africbourse.com</span></p>
    <div class="footer"><p>Afribourse · africbourse.com</p></div>
  </div>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `${firstName}, votre place dans le classement vous attend — 1 clic suffit`,
    html,
    text: `${firstName},\n\nJe suis SIMBA, votre coach IA sur AfriBourse.\n\nPendant que vous lisez cet email, 2 500+ investisseurs de la communauté UEMOA suivent déjà leurs positions.\n\nVotre compte est créé — mais pas encore activé. Activez-le ici :\n${confirmationUrl}\n\nLe marché n'attend pas. Moi non plus.\n— SIMBA, votre coach BRVM\nAfribourse · africbourse.com`,
  });
}

// ─── EMAIL 1 — Réengagement J+1 (après confirmation, sans reconnexion) ────────

export async function sendReengagementEmail1({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const learnUrl = `${config.app.frontendUrl}/learn`;
  const firstName = name.split(' ')[0];

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIMBA vous attend, ${firstName}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
    .container { background-color: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .logo-text { font-size: 28px; font-weight: bold; color: #f97316; }
    h1 { color: #1f2937; font-size: 22px; margin-bottom: 20px; }
    p { color: #4b5563; margin-bottom: 15px; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; margin: 20px 0; }
    .action-card { background: #f9fafb; border-radius: 10px; padding: 18px; margin: 14px 0; border-left: 4px solid #f97316; display: flex; align-items: center; gap: 14px; }
    .action-card .num { flex-shrink: 0; background: #f97316; color: white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
    .action-card p { margin: 0; color: #1f2937; font-size: 14px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <p class="logo-text">AfriBourse</p>
    <h1>SIMBA vous attend, ${firstName}</h1>
    <p>${firstName},</p>
    <p>Votre compte est actif. Vous faites maintenant partie des personnes qui apprennent vraiment à investir sur la BRVM.</p>
    <p>Je m'appelle <strong>SIMBA</strong>. Je suis votre coach IA — formé uniquement sur les marchés UEMOA.</p>
    <p>Ma première recommandation : commencez par le <strong>Module 1</strong>. Il dure <strong>8 minutes</strong>. À la fin, vous maîtriserez les fondamentaux de la BRVM comme un Pro.</p>
    <p>Ensuite, faites votre premier achat simulé. Choisissez un titre, investissez virtuellement, et voyez votre portefeuille prendre vie — sans risquer un franc.</p>
    <p>Ce sont les 2 actions que font tous nos meilleurs investisseurs dès leur premier jour :</p>
    <div class="action-card">
      <div class="num">1</div>
      <p><strong>Module 1</strong> — 8 min pour maîtriser les bases de la BRVM</p>
    </div>
    <div class="action-card">
      <div class="num">2</div>
      <p><strong>Premier achat simulé</strong> — Sans risquer un seul franc</p>
    </div>
    <div style="text-align: center;">
      <a href="${learnUrl}" class="button">🚀 Commencer avec SIMBA →</a>
    </div>
    <p>À tout de suite sur la plateforme,<br>— <strong>SIMBA</strong><br><span style="color: #9ca3af; font-size: 13px;">Afribourse · africbourse.com</span></p>
    <div class="footer"><p>Afribourse · africbourse.com</p></div>
  </div>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `SIMBA vous attend, ${firstName} — voici par où commencer`,
    html,
    text: `${firstName},\n\nVotre compte est actif. Vous faites maintenant partie des personnes qui apprennent vraiment à investir sur la BRVM.\n\nJe m'appelle SIMBA. Je suis votre coach IA — formé uniquement sur les marchés UEMOA.\n\nÉtape 1 : Module 1 (8 min) — les bases de la BRVM\nÉtape 2 : Premier achat simulé — sans risquer un franc\n\nDémarrez ici : ${learnUrl}\n\n— SIMBA\nAfribourse · africbourse.com`,
  });
}

// ─── EMAIL 2 — Marché BRVM J+3 (sans session depuis confirmation) ─────────────

export async function sendReengagementEmail2({
  email,
  name,
  stocks,
}: {
  email: string;
  name: string;
  stocks: { symbol: string; companyName: string; weeklyChangePercent: number }[];
}): Promise<void> {
  const firstName = name.split(' ')[0];
  const topStock = stocks[0];
  const stockUrl = `${config.app.frontendUrl}/stock/${topStock.symbol}`;

  const fmt = (pct: number) => {
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1).replace('.', ',')}%`;
  };

  const topChange = fmt(topStock.weeklyChangePercent);

  const rows = stocks.map(s => {
    const isUp = s.weeklyChangePercent >= 0;
    const cls = isUp ? 'up' : 'down';
    const signal = isUp
      ? 'Signal haussier — à surveiller de près'
      : 'Repli en cours — opportunité potentielle';
    return `<tr><td><strong>${s.symbol}</strong><br><span style="color:#9ca3af;font-size:11px;">${s.companyName}</span></td><td class="${cls}">${fmt(s.weeklyChangePercent)}</td><td>${signal}</td></tr>`;
  }).join('');

  const textRows = stocks.map(s =>
    `${s.symbol} : ${fmt(s.weeklyChangePercent)} (${s.companyName})`
  ).join('\n');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topStock.symbol} ${topChange} cette semaine — SIMBA a une analyse pour vous</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
    .container { background-color: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .logo-text { font-size: 28px; font-weight: bold; color: #f97316; }
    h1 { color: #1f2937; font-size: 22px; margin-bottom: 20px; }
    p { color: #4b5563; margin-bottom: 15px; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; border-radius: 8px; overflow: hidden; }
    th { background: #1f2937; color: white; padding: 11px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) { background: #f9fafb; }
    .up { color: #16a34a; font-weight: 700; font-size: 14px; }
    .down { color: #dc2626; font-weight: 700; font-size: 14px; }
    .simba-note { background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; padding: 14px 16px; margin: 20px 0; }
    .simba-note p { margin: 0; color: #1e40af; font-size: 14px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <p class="logo-text">AfriBourse</p>
    <h1>📈 ${topStock.symbol} ${topChange} cette semaine — SIMBA a une analyse pour vous</h1>
    <p>${firstName},</p>
    <p>Trois choses se sont passées sur le BRVM depuis votre inscription :</p>
    <table>
      <tr><th>Titre</th><th>Variation</th><th>Signal</th></tr>
      ${rows}
    </table>
    <div class="simba-note">
      <p>Sur AfriBourse, SIMBA analyse ces signaux en temps réel et note chaque titre de <strong>0 à 100</strong>.<br>
      <strong>${topStock.symbol} est actuellement noté par SIMBA. Voici pourquoi →</strong></p>
    </div>
    <div style="text-align: center;">
      <a href="${stockUrl}" class="button">Voir l'analyse SIMBA de ${topStock.symbol}</a>
    </div>
    <p style="text-align:center; font-size:13px; color:#6b7280;">(Vous pouvez aussi l'acheter dans votre simulateur et suivre sa performance en direct)</p>
    <p>— <strong>SIMBA</strong><br><span style="color: #9ca3af; font-size: 13px;">Afribourse · africbourse.com</span></p>
    <div class="footer"><p>Afribourse · africbourse.com</p></div>
  </div>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `${topStock.symbol} ${topChange} cette semaine — SIMBA a une analyse pour vous`,
    html,
    text: `${firstName},\n\nTrois choses se sont passées sur le BRVM depuis votre inscription :\n\n${textRows}\n\nSur AfriBourse, SIMBA analyse ces signaux en temps réel et note chaque titre de 0 à 100.\n\nVoir l'analyse SIMBA de ${topStock.symbol} : ${stockUrl}\n\n— SIMBA\nAfribourse · africbourse.com`,
  });
}

// ─── EMAIL 3 — Simulateur & Top 3 réel J+7 ───────────────────────────────────

export async function sendReengagementEmail3({
  email,
  name,
  leaders,
}: {
  email: string;
  name: string;
  leaders: { rank: number; displayName: string; totalValue: number; roi: number }[];
}): Promise<void> {
  const firstName = name.split(' ')[0];
  const classementUrl = `${config.app.frontendUrl}/classement`;

  const fmt = (roi: number) => {
    const sign = roi >= 0 ? '+' : '';
    return `${sign}${roi.toFixed(1).replace('.', ',')}%`;
  };

  const top1 = leaders[0] ?? { displayName: 'Kouassi A.', totalValue: 1_450_000, roi: 18.4 };
  const rankEmojis = ['🥇', '🥈', '🥉'];

  const rows = leaders.slice(0, 3).map((l, i) =>
    `<tr><td>${rankEmojis[i] ?? l.rank}</td><td><strong>${l.displayName}</strong></td><td>${l.totalValue.toLocaleString('fr-FR')} FCFA</td><td class="perf">${fmt(l.roi)}</td></tr>`
  ).join('');

  const textRows = leaders.slice(0, 3).map((l, i) =>
    `${rankEmojis[i] ?? l.rank} ${l.displayName} — ${fmt(l.roi)} (${l.totalValue.toLocaleString('fr-FR')} FCFA)`
  ).join('\n');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${firstName}, ${top1.displayName} fait ${fmt(top1.roi)} cette semaine. Voici son secret.</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
    .container { background-color: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .logo-text { font-size: 28px; font-weight: bold; color: #f97316; }
    h1 { color: #1f2937; font-size: 22px; margin-bottom: 20px; }
    p { color: #4b5563; margin-bottom: 15px; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; border-radius: 8px; overflow: hidden; }
    th { background: #1f2937; color: white; padding: 11px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) { background: #f9fafb; }
    .perf { color: #16a34a; font-weight: 700; font-size: 14px; }
    .secret-card { background: #f9fafb; border-radius: 10px; padding: 18px; margin: 14px 0; border-left: 4px solid #f97316; display: flex; align-items: flex-start; gap: 12px; }
    .secret-card .num { flex-shrink: 0; background: #f97316; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-top: 2px; }
    .secret-card p { margin: 0; color: #1f2937; font-size: 14px; }
    .stat-bar { background: #fff7ed; border-radius: 8px; padding: 14px 18px; text-align: center; margin: 20px 0; color: #c2410c; font-weight: 600; font-size: 14px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <p class="logo-text">AfriBourse</p>
    <h1>🏆 ${firstName}, ${top1.displayName} fait ${fmt(top1.roi)} cette semaine. Voici son secret.</h1>
    <p>Cela fait 7 jours que vous avez créé votre compte.</p>
    <p>Pendant ce temps, voici ce que font les meilleurs investisseurs AfriBourse :</p>
    <table>
      <tr><th>Rang</th><th>Investisseur</th><th>Portefeuille</th><th>ROI</th></tr>
      ${rows}
    </table>
    <p>${top1.displayName} a commencé exactement comme vous — avec <strong>1 000 000 FCFA virtuels</strong> et zéro expérience.</p>
    <p><strong>Sa stratégie en 3 étapes :</strong></p>
    <div class="secret-card">
      <div class="num">1</div>
      <p>Il a terminé le <strong>Module 1 (8 min)</strong> pour comprendre les bases</p>
    </div>
    <div class="secret-card">
      <div class="num">2</div>
      <p>Il a acheté <strong>2-3 titres BRVM</strong> dans le simulateur</p>
    </div>
    <div class="secret-card">
      <div class="num">3</div>
      <p>Il suit ses positions <strong>chaque matin</strong> depuis le dashboard</p>
    </div>
    <p>Vous pouvez faire exactement la même chose — maintenant.</p>
    <div style="text-align: center;">
      <a href="${classementUrl}" class="button">🏆 Rejoindre le classement cette semaine →</a>
    </div>
    <div class="stat-bar">2 100+ investisseurs actifs · Gratuit · Sans risque</div>
    <p>— <strong>SIMBA</strong><br><span style="color: #9ca3af; font-size: 13px;">Afribourse · afribourse.com</span></p>
    <div class="footer"><p>Afribourse · afribourse.com · <a href="${config.app.frontendUrl}/desabonnement">Se désabonner</a></p></div>
  </div>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `${firstName}, ${top1.displayName} fait ${fmt(top1.roi)} cette semaine. Voici son secret.`,
    html,
    text: `Cela fait 7 jours que vous avez créé votre compte.\n\nVoici le classement cette semaine :\n\n${textRows}\n\n${top1.displayName} a commencé comme vous — 1 000 000 FCFA virtuels, zéro expérience.\n\nSa stratégie : Module 1 (8 min) → 2-3 titres dans le simulateur → suivi quotidien.\n\nRejoignez le classement : ${classementUrl}\n\n— SIMBA\nAfribourse · afribourse.com`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RAPPORT HEBDOMADAIRE COMBINÉ
// ─────────────────────────────────────────────────────────────────────────────

interface MarketMoverEmail {
  symbol: string;
  companyName: string;
  currentPrice: number;
  weeklyChangePercent: number;
}

interface SendWeeklyReportEmailParams {
  email: string;
  name: string;
  period: string;
  segment: 'A' | 'B' | 'C';
  portfolioStats?: {
    totalValue: number;
    cashBalance: number;
    investedValue: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    topPerformers: Array<{ ticker: string; gainLossPercent: number; value: number }>;
    topLosers: Array<{ ticker: string; gainLossPercent: number; value: number }>;
    positionsCount: number;
    biweeklyEvolution?: {
      previousValue: number;
      currentValue: number;
      change: number;
      changePercent: number;
    };
  };
  learningStats?: {
    weeklyModulesCompleted: number;
    weeklyXpEarned: number;
    currentStreak: number;
    currentLevel: number;
    totalXp: number;
    completionPercent: number;
    totalModulesCompleted: number;
    totalModulesAvailable: number;
    suggestedModules: Array<{ title: string; slug: string; difficulty: string; durationMinutes?: number }>;
    recentAchievements: Array<{ name: string; description: string }>;
    rank?: number;
    isReminder?: boolean;
  };
}

export async function sendWeeklyReportEmail({
  email,
  name,
  period,
  segment,
  portfolioStats,
  learningStats,
}: SendWeeklyReportEmailParams): Promise<void> {
  const firstName = (name || 'Investisseur').split(' ')[0];

  const fmtFCFA = (n: number) =>
    Math.round(n).toLocaleString('fr-FR') + ' FCFA';
  const fmtPct = (n: number) =>
    `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

  // ── Subject ────────────────────────────────────────────────────────────────
  let subject: string;
  if (segment === 'A' && learningStats && portfolioStats) {
    subject = `${firstName}, votre semaine BRVM — 📚 ${learningStats.weeklyModulesCompleted} module(s) · 📊 ${fmtPct(portfolioStats.totalGainLossPercent)} portefeuille`;
  } else if (segment === 'B' && learningStats) {
    subject = `${firstName}, votre semaine BRVM — 📚 ${learningStats.weeklyModulesCompleted} module(s) complété(s)`;
  } else {
    subject = `${firstName}, votre semaine BRVM — 📊 ${portfolioStats ? fmtPct(portfolioStats.totalGainLossPercent) : ''} sur votre portefeuille`;
  }

  // ── Section 1 — Apprentissage (segments A & B) ─────────────────────────────
  let learnSection = '';
  if (learningStats && (segment === 'A' || segment === 'B')) {
    const rankCell = learningStats.rank
      ? `<td style="width:25%;padding:0 6px 0 0;">
           <table width="100%" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;" cellpadding="14" cellspacing="0">
             <tr><td style="text-align:center;">
               <div style="font-size:20px;font-weight:800;color:#0A1628;">${learningStats.rank}e</div>
               <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:2px;">Classement</div>
             </td></tr>
           </table>
         </td>`
      : '';

    const badgeBlock = learningStats.recentAchievements.length > 0
      ? learningStats.recentAchievements.slice(0, 1).map(a => `
        <tr><td style="padding:16px 0 0;">
          <table width="100%" cellpadding="14" cellspacing="0" style="background:rgba(0,212,168,0.06);border:1.5px solid rgba(0,212,168,0.25);border-radius:10px;">
            <tr><td>
              <span style="font-size:13px;font-weight:700;color:#0A1628;">🎖️ Badge débloqué : <span style="color:#00D4A8;">${a.name}</span></span>
              ${a.description ? `<div style="font-size:12px;color:#64748b;margin-top:3px;">${a.description}</div>` : ''}
            </td></tr>
          </table>
        </td></tr>`).join('')
      : '';

    const suggestedRows = learningStats.suggestedModules.slice(0, 2).map((m, i) => `
      <tr><td style="padding:${i === 0 ? '12px 0 6px' : '0 0 0'} 0;">
        <table width="100%" cellpadding="10" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
          <tr>
            <td>
              <div style="font-size:12px;font-weight:700;color:#0A1628;">→ ${m.title}</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${m.durationMinutes ? m.durationMinutes + ' min · ' : ''}+50 XP</div>
            </td>
            <td style="text-align:right;white-space:nowrap;">
              <a href="${config.app.frontendUrl}/learn" style="font-size:11px;font-weight:700;color:#00D4A8;text-decoration:none;">Suivre →</a>
            </td>
          </tr>
        </table>
      </td></tr>`).join('');

    learnSection = `
      <!-- Section 1: Apprentissage -->
      <tr><td style="padding-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding-bottom:12px;">
            <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">📚 Section 1 — Votre semaine d'apprentissage</span>
          </td></tr>

          <!-- 4 metric tiles -->
          <tr>
            <td style="width:25%;padding:0 6px 0 0;">
              <table width="100%" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;" cellpadding="14" cellspacing="0">
                <tr><td style="text-align:center;">
                  <div style="font-size:20px;font-weight:800;color:#00D4A8;">${learningStats.weeklyModulesCompleted}</div>
                  <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:2px;">Modules</div>
                </td></tr>
              </table>
            </td>
            <td style="width:25%;padding:0 6px;">
              <table width="100%" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;" cellpadding="14" cellspacing="0">
                <tr><td style="text-align:center;">
                  <div style="font-size:20px;font-weight:800;color:#00D4A8;">+${learningStats.weeklyXpEarned}</div>
                  <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:2px;">XP gagnés</div>
                </td></tr>
              </table>
            </td>
            <td style="width:25%;padding:0 6px;">
              <table width="100%" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;" cellpadding="14" cellspacing="0">
                <tr><td style="text-align:center;">
                  <div style="font-size:20px;font-weight:800;color:#f97316;">🔥 ${learningStats.currentStreak}</div>
                  <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:2px;">Streak jours</div>
                </td></tr>
              </table>
            </td>
            ${rankCell || `<td style="width:25%;padding:0 0 0 6px;">
              <table width="100%" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;" cellpadding="14" cellspacing="0">
                <tr><td style="text-align:center;">
                  <div style="font-size:20px;font-weight:800;color:#0A1628;">${learningStats.totalModulesCompleted}</div>
                  <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:2px;">Total modules</div>
                </td></tr>
              </table>
            </td>`}
          </tr>

          ${badgeBlock}

          <!-- Modules suggérés -->
          ${suggestedRows ? `<tr><td style="padding-top:16px;">
            <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Prochains modules suggérés par KOFI</div>
            <table width="100%" cellpadding="0" cellspacing="0">${suggestedRows}</table>
          </td></tr>` : ''}
        </table>
      </td></tr>`;
  }

  // ── Teaser simulateur (segment B uniquement) ───────────────────────────────
  const simulatorTeaser = segment === 'B' ? `
    <tr><td style="padding-bottom:20px;">
      <table width="100%" cellpadding="20" cellspacing="0" style="background:linear-gradient(135deg,#0A1628,#1a3a5c);border-radius:12px;">
        <tr><td>
          <div style="font-size:14px;font-weight:700;color:#ffffff;margin-bottom:6px;">📊 Tu n'as pas encore de positions simulées</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;margin-bottom:14px;">
            Essaie le simulateur — achète ta première action BRVM sans aucun risque financier.
          </div>
          <a href="${config.app.frontendUrl}/markets" style="display:inline-block;padding:10px 22px;background:#00D4A8;color:#0A1628;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">
            Découvrir le simulateur →
          </a>
        </td></tr>
      </table>
    </td></tr>` : '';

  // ── Section 2 — Portefeuille (segments A & C) ──────────────────────────────
  let portfolioSection = '';
  if (portfolioStats && (segment === 'A' || segment === 'C')) {
    const isProfit = portfolioStats.totalGainLossPercent >= 0;
    const roiColor = isProfit ? '#00D4A8' : '#ef4444';

    const biweeklyRow = portfolioStats.biweeklyEvolution ? `
      <tr><td style="padding-top:12px;">
        <table width="100%" cellpadding="10" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
          <tr>
            <td style="text-align:center;border-right:1px solid #e2e8f0;">
              <div style="font-size:11px;color:#94a3b8;">Semaine préc.</div>
              <div style="font-size:14px;font-weight:700;color:#0A1628;">${fmtFCFA(portfolioStats.biweeklyEvolution.previousValue)}</div>
            </td>
            <td style="text-align:center;padding:0 8px;">
              <div style="font-size:18px;color:#94a3b8;">→</div>
            </td>
            <td style="text-align:center;border-left:1px solid #e2e8f0;">
              <div style="font-size:11px;color:#94a3b8;">Cette semaine</div>
              <div style="font-size:14px;font-weight:700;color:#0A1628;">${fmtFCFA(portfolioStats.biweeklyEvolution.currentValue)}</div>
            </td>
          </tr>
        </table>
      </td></tr>` : '';

    const topPerformersBlock = portfolioStats.topPerformers.length > 0 ? `
      <tr><td style="padding-top:16px;">
        <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">🏆 Meilleures performances</div>
        ${portfolioStats.topPerformers.slice(0, 2).map(p => `
          <table width="100%" cellpadding="8" cellspacing="0" style="background:#f0fdf4;border-left:3px solid #00D4A8;border-radius:4px;margin-bottom:6px;">
            <tr>
              <td style="font-weight:700;color:#0A1628;">${p.ticker}</td>
              <td style="text-align:right;font-weight:700;color:#00D4A8;">${fmtPct(p.gainLossPercent)}</td>
            </tr>
          </table>`).join('')}
      </td></tr>` : '';

    const flopBlock = portfolioStats.topLosers.length > 0 ? `
      <tr><td style="padding-top:8px;">
        <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">📉 Moins bonnes</div>
        ${portfolioStats.topLosers.slice(0, 1).map(p => `
          <table width="100%" cellpadding="8" cellspacing="0" style="background:#fef2f2;border-left:3px solid #ef4444;border-radius:4px;margin-bottom:6px;">
            <tr>
              <td style="font-weight:700;color:#0A1628;">${p.ticker}</td>
              <td style="text-align:right;font-weight:700;color:#ef4444;">${fmtPct(p.gainLossPercent)}</td>
            </tr>
          </table>`).join('')}
      </td></tr>` : '';

    const simbaAdvice = portfolioStats.positionsCount < 2
      ? 'Diversifiez votre portefeuille sur 2–3 secteurs pour réduire le risque non-systémique.'
      : isProfit
        ? 'Excellent travail ! Pensez à rééquilibrer vos gains sur 2–3 secteurs pour protéger votre avance.'
        : 'La BRVM récompense la patience. Restez dans votre plan et évitez les décisions sous pression.';

    portfolioSection = `
      <!-- Section 2: Portefeuille -->
      <tr><td style="padding-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding-bottom:12px;">
            <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">📊 Section 2 — Votre portefeuille simulé</span>
          </td></tr>

          <!-- Hero valeur -->
          <tr><td>
            <table width="100%" cellpadding="20" cellspacing="0" style="background:linear-gradient(135deg,#0A1628,#1a3a5c);border-radius:12px;">
              <tr><td style="text-align:center;">
                <div style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:.08em;">Valeur totale</div>
                <div style="font-size:28px;font-weight:800;color:#ffffff;margin:6px 0;">${fmtFCFA(portfolioStats.totalValue)}</div>
                <div style="display:inline-block;padding:5px 16px;background:${isProfit ? 'rgba(0,212,168,0.15)' : 'rgba(239,68,68,0.15)'};border:1px solid ${roiColor};border-radius:100px;font-size:14px;font-weight:700;color:${roiColor};">
                  ${fmtPct(portfolioStats.totalGainLossPercent)} &nbsp;·&nbsp; ${fmtFCFA(portfolioStats.totalGainLoss)}
                </div>
              </td></tr>
            </table>
          </td></tr>

          <!-- 3 secondary tiles -->
          <tr><td style="padding-top:10px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:33%;padding-right:6px;">
                  <table width="100%" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;" cellpadding="12" cellspacing="0">
                    <tr><td style="text-align:center;">
                      <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Liquidités</div>
                      <div style="font-size:14px;font-weight:700;color:#0A1628;margin-top:4px;">${fmtFCFA(portfolioStats.cashBalance)}</div>
                    </td></tr>
                  </table>
                </td>
                <td style="width:33%;padding:0 3px;">
                  <table width="100%" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;" cellpadding="12" cellspacing="0">
                    <tr><td style="text-align:center;">
                      <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Positions</div>
                      <div style="font-size:14px;font-weight:700;color:#0A1628;margin-top:4px;">${portfolioStats.positionsCount}</div>
                    </td></tr>
                  </table>
                </td>
                <td style="width:33%;padding-left:6px;">
                  <table width="100%" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;" cellpadding="12" cellspacing="0">
                    <tr><td style="text-align:center;">
                      <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Performance</div>
                      <div style="font-size:14px;font-weight:700;color:${roiColor};margin-top:4px;">${fmtPct(portfolioStats.totalGainLossPercent)}</div>
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td></tr>

          ${biweeklyRow}
          ${topPerformersBlock}
          ${flopBlock}

          <!-- Conseil SIMBA -->
          <tr><td style="padding-top:14px;">
            <table width="100%" cellpadding="14" cellspacing="0" style="background:#fffbeb;border-left:3px solid #f59e0b;border-radius:4px;">
              <tr><td style="font-size:13px;color:#92400e;">💡 <strong>Conseil SIMBA :</strong> ${simbaAdvice}</td></tr>
            </table>
          </td></tr>
        </table>
      </td></tr>`;
  }

  // ── Nudge module (segment C uniquement) ───────────────────────────────────
  const moduleNudge = segment === 'C' && learningStats?.suggestedModules?.[0] ? `
    <tr><td style="padding-bottom:20px;">
      <table width="100%" cellpadding="16" cellspacing="0" style="background:#f8fafc;border:1.5px dashed #e2e8f0;border-radius:12px;">
        <tr><td>
          <div style="font-size:13px;font-weight:700;color:#0A1628;margin-bottom:4px;">📚 KOFI te suggère cette semaine</div>
          <div style="font-size:13px;color:#64748b;margin-bottom:12px;">
            ${learningStats.suggestedModules[0].title}${learningStats.suggestedModules[0].durationMinutes ? ' · ' + learningStats.suggestedModules[0].durationMinutes + ' min' : ''} · <strong style="color:#00D4A8;">+50 XP</strong>
          </div>
          <a href="${config.app.frontendUrl}/learn" style="display:inline-block;padding:9px 20px;background:#0A1628;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:12px;">
            Commencer ce module →
          </a>
        </td></tr>
      </table>
    </td></tr>` : '';

  // ── CTAs ───────────────────────────────────────────────────────────────────
  const ctaLearn = `<a href="${config.app.frontendUrl}/learn" style="display:inline-block;padding:13px 28px;background:#00D4A8;color:#0A1628;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">📚 Continuer mon parcours →</a>`;
  const ctaPortfolio = `<a href="${config.app.frontendUrl}/dashboard" style="display:inline-block;padding:13px 28px;background:#0A1628;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">📊 Voir mon portefeuille →</a>`;

  const ctaBlock = segment === 'A'
    ? `<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
        <td style="padding-right:12px;">${ctaLearn}</td>
        <td>${ctaPortfolio}</td>
       </tr></table>`
    : segment === 'B'
      ? `<div style="text-align:center;">${ctaLearn}</div>`
      : `<div style="text-align:center;">${ctaPortfolio}</div>`;

  // ── Full HTML ──────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bilan Hebdo BRVM — AfriBourse</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HERO HEADER -->
        <tr><td style="background:linear-gradient(135deg,#0A1628 0%,#1a3a5c 100%);border-radius:16px 16px 0 0;padding:36px 32px 28px;text-align:center;">
          <div style="font-size:11px;font-weight:700;color:#00D4A8;text-transform:uppercase;letter-spacing:.12em;margin-bottom:12px;">AfriBourse · Bilan Hebdo</div>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;">
            ${firstName}, votre semaine BRVM
          </h1>
          <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.6);">${period}</p>
          <p style="margin:16px 0 0;font-size:14px;color:rgba(255,255,255,0.85);line-height:1.6;">
            SIMBA a compilé vos progrès${segment !== 'C' ? ' en formation' : ''}${segment !== 'B' ? ' et les performances de votre portefeuille simulé' : ''}.
          </p>
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#ffffff;padding:32px;">
          <table width="100%" cellpadding="0" cellspacing="0">

            ${learnSection}
            ${simulatorTeaser}
            ${portfolioSection}
            ${moduleNudge}

            <!-- CTA -->
            <tr><td style="padding:8px 0 24px;">
              ${ctaBlock}
            </td></tr>

            <!-- Signature -->
            <tr><td style="padding-top:20px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.8;">
                — <strong style="color:#0A1628;">SIMBA</strong>, votre coach BRVM<br>
                <span style="font-size:11px;color:#94a3b8;">Équipe AfriBourse</span>
              </p>
            </td></tr>

          </table>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#f8fafc;border-radius:0 0 16px 16px;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">
            © ${new Date().getFullYear()} AfriBourse ·
            <a href="${config.app.frontendUrl}" style="color:#00D4A8;text-decoration:none;">afribourse.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textParts: string[] = [
    `Bonjour ${firstName},\n\nVoici votre bilan de la semaine (${period}).`,
  ];
  if (learningStats && segment !== 'C') {
    textParts.push(`\n📚 Apprentissage\n${learningStats.weeklyModulesCompleted} module(s) · +${learningStats.weeklyXpEarned} XP · 🔥 ${learningStats.currentStreak} jours streak`);
  }
  if (portfolioStats && segment !== 'B') {
    textParts.push(`\n📊 Portefeuille\nValeur : ${fmtFCFA(portfolioStats.totalValue)} · Performance : ${fmtPct(portfolioStats.totalGainLossPercent)}`);
  }
  textParts.push(`\nDashboard : ${config.app.frontendUrl}/dashboard\n\n— SIMBA, votre coach BRVM`);

  await sendEmail({
    to: email,
    subject,
    html,
    text: textParts.join(''),
  });
}

export async function sendSAFCArticleEmail({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const displayName = name || 'Investisseur';
  const articleUrl = 'https://www.africbourse.com/news';

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SAFC : Tout comprendre sur l'augmentation de capital d'Alios Finance CI</title>
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
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo-text {
          font-size: 28px;
          font-weight: bold;
          color: #f97316;
        }
        .hero-banner {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 12px;
          padding: 28px 24px;
          text-align: center;
          margin: 20px 0 30px;
        }
        .hero-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #64748b;
          margin: 0 0 10px;
        }
        .hero-title {
          font-size: 22px;
          font-weight: bold;
          color: #f97316;
          margin: 0 0 8px;
          line-height: 1.3;
        }
        .hero-subtitle {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
        }
        .greeting {
          font-size: 16px;
          color: #1e293b;
          margin-bottom: 12px;
          font-weight: 600;
        }
        .intro-text {
          font-size: 15px;
          color: #475569;
          margin-bottom: 8px;
        }
        .verdict-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #f97316;
          border-radius: 0 10px 10px 0;
          padding: 16px 20px;
          margin: 20px 0 24px;
          font-size: 14px;
          color: #334155;
          line-height: 1.6;
        }
        .checklist-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 14px;
        }
        .checklist-item {
          display: flex;
          align-items: flex-start;
          font-size: 14px;
          color: #334155;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        .check-icon {
          color: #22c55e;
          font-weight: bold;
          margin-right: 10px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .deadline-box {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 1px solid #fbbf24;
          border-radius: 10px;
          padding: 18px 22px;
          margin: 28px 0;
          text-align: center;
        }
        .deadline-text {
          font-size: 15px;
          font-weight: 700;
          color: #92400e;
          margin: 0;
        }
        .cta-wrapper {
          text-align: center;
          margin: 28px 0;
        }
        .button-primary {
          display: inline-block;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white !important;
          text-decoration: none;
          padding: 14px 36px;
          border-radius: 10px;
          font-weight: bold;
          font-size: 16px;
        }
        .divider {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 28px 0;
        }
        .footer {
          text-align: center;
          margin-top: 28px;
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.6;
        }
        .footer a {
          color: #f97316;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">

        <div class="header">
          <div class="logo-text">AfriBourse</div>
        </div>

        <div class="hero-banner">
          <div class="hero-label">🔔 Analyse de marché</div>
          <div class="hero-title">SAFC — Alios Finance CI (ex-SAFCA)</div>
          <div class="hero-subtitle">Augmentation de capital 2026 : décryptage complet</div>
        </div>

        <p class="greeting">Bonjour ${displayName},</p>

        <p class="intro-text">
          Depuis quelques semaines, un titre concentre toute l'attention sur la BRVM : <strong>SAFC — Alios Finance CI (ex-SAFCA)</strong>.
        </p>

        <div class="verdict-box">
          Le verdict ? Une augmentation de capital de <strong>1,5 milliard FCFA</strong> lancée le 27 avril 2026.
          Et un cours qui a été <strong>divisé par 2</strong> depuis l'annonce. Mais pourquoi ?
        </div>

        <p class="checklist-title">Nous avons décrypté l'intégralité de cette opération pour vous :</p>

        <div class="checklist-item">
          <span class="check-icon">✅</span>
          <span>Pourquoi la Commission Bancaire de l'UMOA a mis la pression sur l'entreprise</span>
        </div>
        <div class="checklist-item">
          <span class="check-icon">✅</span>
          <span>Comment fonctionne le DPS — et ce que vous risquez si vous ne faites rien avant le <strong>9 juin</strong></span>
        </div>
        <div class="checklist-item">
          <span class="check-icon">✅</span>
          <span>Pourquoi le cours a chuté de <strong>7 500 à 3 900 FCFA</strong> — et la mécanique derrière</span>
        </div>
        <div class="checklist-item">
          <span class="check-icon">✅</span>
          <span>Les chiffres du redressement 2025 : <strong>+525 % de bénéfice</strong>, une performance inédite depuis 10 ans</span>
        </div>
        <div class="checklist-item">
          <span class="check-icon">✅</span>
          <span>Les perspectives jusqu'en 2030 — et quand les dividendes pourraient revenir</span>
        </div>

        <div class="deadline-box">
          <p class="deadline-text">🗓️ Vous avez jusqu'au 11 juin 2026 pour agir.</p>
        </div>

        <div class="cta-wrapper">
          <a href="${articleUrl}" class="button-primary">→ Lire l'analyse complète</a>
        </div>

        <hr class="divider" />

        <p style="font-size: 14px; color: #475569; margin: 0;">
          Bonne lecture,<br />
          <strong style="color: #1e293b;">L'équipe d'AfriBourse</strong>
        </p>

        <div class="footer">
          <p>
            Vous recevez cet email car vous êtes inscrit sur <a href="https://www.africbourse.com">AfriBourse</a>.<br />
            Cet article est fourni à titre informatif uniquement — il ne constitue pas un conseil en investissement.
          </p>
          <p>© 2026 AfriBourse · <a href="https://www.africbourse.com">africbourse.com</a></p>
        </div>

      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: '🔔 SAFC : Tout comprendre sur l\'augmentation de capital d\'Alios Finance CI',
    html,
    text: `Bonjour ${displayName},\n\nDepuis quelques semaines, un titre concentre toute l'attention sur la BRVM : SAFC — Alios Finance CI (ex-SAFCA).\n\nLe verdict ? Une augmentation de capital de 1,5 milliard FCFA lancée le 27 avril 2026. Et un cours qui a été divisé par 2 depuis l'annonce.\n\nNous avons décrypté l'intégralité de cette opération :\n✅ Pourquoi la Commission Bancaire de l'UMOA a mis la pression\n✅ Comment fonctionne le DPS — et ce que vous risquez si vous ne faites rien avant le 9 juin\n✅ Pourquoi le cours a chuté de 7 500 à 3 900 FCFA\n✅ Les chiffres du redressement 2025 : +525 % de bénéfice\n✅ Les perspectives jusqu'en 2030\n\n🗓️ Vous avez jusqu'au 11 juin 2026 pour agir.\n\n→ Lire l'analyse complète : ${articleUrl}\n\nBonne lecture,\nL'équipe d'AfriBourse\n\nCet article est fourni à titre informatif uniquement — il ne constitue pas un conseil en investissement.`,
  });
}

export default {
  sendConfirmationEmail,
  sendPasswordResetEmail,
  sendPriceAlertEmail,
  sendPortfolioSummaryEmail,
  sendLearningSummaryEmail,
  sendWeeklyReportEmail,
  sendLeaderboardCongratulationEmail,
  sendPWAAnnouncementEmail,
  sendGrandChallengeAnnouncementEmail,
  sendCompleteProfileEmail,
  sendNewsletterMarch2026Email,
  sendSAFCArticleEmail,
  sendReengagementEmail0,
  sendReengagementEmail1,
  sendReengagementEmail2,
  sendReengagementEmail3,
  sendEmail,
};
