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

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre compte Afribourse n'est pas encore activé</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
    .container { background-color: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .logo-text { font-size: 28px; font-weight: bold; color: #f97316; }
    h1 { color: #1f2937; font-size: 22px; }
    p { color: #4b5563; margin-bottom: 15px; }
    .button { display: inline-block; padding: 14px 28px; background-color: #f97316; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .feature-list { list-style: none; padding: 0; }
    .feature-list li { padding: 6px 0; color: #374151; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <p class="logo-text">AfriBourse</p>
    <h1>⚠️ Votre compte Afribourse n'est pas encore activé</h1>
    <p>Bonjour ${name},</p>
    <p>Vous vous êtes inscrit(e) sur Afribourse il y a 24 heures — mais votre compte n'est pas encore actif.</p>
    <p>Un seul clic vous sépare de l'accès à :</p>
    <ul class="feature-list">
      <li>▸ Le simulateur de portefeuille BRVM — investissez sans risque</li>
      <li>▸ Les cours en temps réel des 45 titres cotés</li>
      <li>▸ Les modules de formation animés par Simba, votre coach IA</li>
    </ul>
    <p>Le lien de confirmation est valable 48h.</p>
    <div style="text-align: center;">
      <a href="${confirmationUrl}" class="button">✅ Confirmer mon adresse email</a>
    </div>
    <p style="font-size: 13px; color: #6b7280;">Si vous n'avez pas reçu l'email précédent ou si le lien a expiré, vous pouvez en demander un nouveau directement depuis la page de connexion.</p>
    <p>À tout de suite sur la plateforme,<br><strong>Simba — Votre coach BRVM</strong><br>Afribourse · africbourse.com</p>
    <div class="footer"><p>Afribourse · africbourse.com</p></div>
  </div>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: '⚠️ Votre compte Afribourse n\'est pas encore activé',
    html,
    text: `Bonjour ${name},\n\nVous vous êtes inscrit(e) sur Afribourse il y a 24 heures mais votre compte n'est pas encore actif.\n\nConfirmez votre email : ${confirmationUrl}\n\nSimba — Votre coach BRVM\nAfribourse · africbourse.com`,
  });
}

// ─── EMAIL 1 — Réengagement J+1 (après confirmation, sans reconnexion) ────────

export async function sendReengagementEmail1({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const platformUrl = `${config.app.frontendUrl}/dashboard`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Voici ce qui vous attend sur Afribourse</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
    .container { background-color: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .logo-text { font-size: 28px; font-weight: bold; color: #f97316; }
    h1 { color: #1f2937; font-size: 22px; }
    p { color: #4b5563; margin-bottom: 15px; }
    .button { display: inline-block; padding: 14px 28px; background-color: #f97316; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .step-card { background: #f9fafb; border-radius: 8px; padding: 16px; margin: 12px 0; border-left: 4px solid #f97316; }
    .step-card p { margin: 0; color: #374151; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <p class="logo-text">AfriBourse</p>
    <h1>🌱 Voici ce qui vous attend sur Afribourse, ${name}</h1>
    <p>Bonjour ${name},</p>
    <p>Je suis Simba, votre coach IA sur Afribourse. Votre compte est activé — maintenant, le vrai voyage commence.</p>
    <p>Voici ce que vous allez apprendre et maîtriser sur la plateforme :</p>
    <div class="step-card">
      <p><strong>📚 Les bases</strong><br>Comprendre la BRVM, son fonctionnement et les 45 titres cotés. Lisez les cours comme un pro.</p>
    </div>
    <div class="step-card">
      <p><strong>📊 Analyser un titre</strong><br>Décrypter un bilan, lire un graphique de cours, identifier les signaux d'achat et de vente.</p>
    </div>
    <div class="step-card">
      <p><strong>🎮 Simulateur — Sans risque</strong><br>Construisez votre portefeuille virtuel avec de vraies données BRVM. Apprenez à investir sans perdre un franc.</p>
    </div>
    <div class="step-card">
      <p><strong>🏆 Construire une stratégie</strong><br>Diversification, gestion du risque, horizon d'investissement — les mêmes techniques que les pros.</p>
    </div>
    <p>Tout ça vous attend. Gratuit. Maintenant.</p>
    <div style="text-align: center;">
      <a href="${platformUrl}" class="button">🚀 Commencer mon parcours BRVM</a>
    </div>
    <p>À bientôt sur la plateforme,<br><strong>Simba — Votre coach BRVM</strong><br>Afribourse · africbourse.com</p>
    <div class="footer"><p>Afribourse · africbourse.com</p></div>
  </div>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `🌱 Voici ce qui vous attend sur Afribourse, ${name}`,
    html,
    text: `Bonjour ${name},\n\nJe suis Simba, votre coach IA sur Afribourse. Votre compte est activé — le vrai voyage commence.\n\nCommencez votre parcours : ${platformUrl}\n\nSimba — Votre coach BRVM\nAfribourse · africbourse.com`,
  });
}

// ─── EMAIL 2 — Marché BRVM J+3 (sans session depuis confirmation) ─────────────

export async function sendReengagementEmail2({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const platformUrl = `${config.app.frontendUrl}/dashboard`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ce qui s'est passé sur le BRVM cette semaine</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
    .container { background-color: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .logo-text { font-size: 28px; font-weight: bold; color: #f97316; }
    h1 { color: #1f2937; font-size: 22px; }
    p { color: #4b5563; margin-bottom: 15px; }
    .button { display: inline-block; padding: 14px 28px; background-color: #f97316; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f97316; color: white; padding: 10px; text-align: left; font-size: 13px; }
    td { padding: 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; }
    tr:nth-child(even) { background: #f9fafb; }
    .up { color: #16a34a; font-weight: 600; }
    .down { color: #dc2626; font-weight: 600; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <p class="logo-text">AfriBourse</p>
    <h1>📈 Ce qui s'est passé sur le BRVM cette semaine, ${name}</h1>
    <p>Bonjour ${name},</p>
    <p>Pendant que vous étiez absent(e), le BRVM n'a pas chômé. Voici 3 mouvements que tout investisseur informé devrait connaître :</p>
    <table>
      <tr><th>Titre</th><th>Variation</th><th>Ce que ça signifie</th></tr>
      <tr><td>SONATEL SN</td><td class="up">+3,2%</td><td>Signal haussier après résultats semestriels — bon momentum</td></tr>
      <tr><td>ECOBANK CI</td><td class="down">-1,8%</td><td>Prise de bénéfices après un pic — surveiller le support</td></tr>
      <tr><td>CFAO CI</td><td class="up">+5,1%</td><td>Fort volume, annonce d'un partenariat — à analyser</td></tr>
    </table>
    <p>Vous souhaitez comprendre comment interpréter ces mouvements ? Sur Afribourse, je vous explique pas à pas comment analyser chaque titre — et comment réagir en simulant vos décisions d'investissement sans risque.</p>
    <div style="text-align: center;">
      <a href="${platformUrl}" class="button">📊 Analyser ces titres sur Afribourse</a>
    </div>
    <p>Les marchés ne s'arrêtent pas. Votre formation non plus.</p>
    <p><strong>Simba — Votre coach BRVM</strong><br>Afribourse · africbourse.com</p>
    <div class="footer"><p>Afribourse · africbourse.com</p></div>
  </div>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `📈 Ce qui s'est passé sur le BRVM cette semaine, ${name}`,
    html,
    text: `Bonjour ${name},\n\nPendant que vous étiez absent(e), le BRVM n'a pas chômé.\n\nSONATEL SN : +3,2% — Signal haussier après résultats semestriels\nECOBANK CI : -1,8% — Prise de bénéfices après un pic\nCFAO CI : +5,1% — Fort volume, annonce d'un partenariat\n\nAnalysez ces titres : ${platformUrl}\n\nSimba — Votre coach BRVM\nAfribourse · africbourse.com`,
  });
}

// ─── EMAIL 3 — Simulateur & Top 5 J+7 ────────────────────────────────────────

export async function sendReengagementEmail3({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const simulatorUrl = `${config.app.frontendUrl}/simulateur`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Le Top 5 de la communauté Afribourse cette semaine</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
    .container { background-color: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .logo-text { font-size: 28px; font-weight: bold; color: #f97316; }
    h1 { color: #1f2937; font-size: 22px; }
    p { color: #4b5563; margin-bottom: 15px; }
    .button { display: inline-block; padding: 14px 28px; background-color: #f97316; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f97316; color: white; padding: 10px; text-align: left; font-size: 13px; }
    td { padding: 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; }
    tr:nth-child(even) { background: #f9fafb; }
    .perf { color: #16a34a; font-weight: 600; }
    .steps { list-style: none; padding: 0; }
    .steps li { padding: 6px 0; color: #374151; }
    .stat-bar { background: #fff7ed; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; }
    .stat-bar p { margin: 0; color: #c2410c; font-weight: 600; font-size: 15px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <p class="logo-text">AfriBourse</p>
    <h1>🏆 Le Top 5 de la communauté Afribourse cette semaine</h1>
    <p>Bonjour ${name},</p>
    <p>Cela fait une semaine que vous avez créé votre compte Afribourse. Pendant ce temps, les meilleurs investisseurs de la communauté ont fait travailler leur simulateur.</p>
    <p><strong>Voici le Top 5 de cette semaine :</strong></p>
    <table>
      <tr><th>Rang</th><th>Investisseur</th><th>Performance</th><th>Stratégie</th></tr>
      <tr><td>🥇 1</td><td>Kouassi A.</td><td class="perf">+18,4%</td><td>Concentration SONATEL + ECOBANK</td></tr>
      <tr><td>🥈 2</td><td>Mariama D.</td><td class="perf">+15,2%</td><td>Diversification 8 titres UEMOA</td></tr>
      <tr><td>🥉 3</td><td>Ousmane T.</td><td class="perf">+12,7%</td><td>Secteur bancaire + agroalimentaire</td></tr>
      <tr><td>4</td><td>Awa S.</td><td class="perf">+10,1%</td><td>Blue chips + attente dividendes</td></tr>
      <tr><td>5</td><td>Ibrahima K.</td><td class="perf">+8,9%</td><td>Stratégie défensive long terme</td></tr>
    </table>
    <p>Ces 5 investisseurs ont commencé exactement comme vous — un compte, un simulateur, et la volonté d'apprendre. Chaque semaine, le classement est remis à zéro. <strong>Vous pouvez faire partie du Top 5 dès cette semaine.</strong></p>
    <p>Voici comment commencer en moins de 5 minutes :</p>
    <ul class="steps">
      <li>▸ Connectez-vous à votre compte</li>
      <li>▸ Allez dans l'onglet Simulateur</li>
      <li>▸ Choisissez 2-3 titres BRVM et construisez votre premier portefeuille</li>
      <li>▸ Suivez vos performances en temps réel</li>
    </ul>
    <div style="text-align: center;">
      <a href="${simulatorUrl}" class="button">🏆 Rejoindre le classement cette semaine</a>
    </div>
    <div class="stat-bar">
      <p>2 100+ investisseurs déjà actifs sur la BRVM · 0 XOF pour commencer</p>
    </div>
    <p>On vous attend dans l'arène,<br><strong>Simba — Votre coach BRVM</strong><br>Afribourse · afribourse.com</p>
    <div class="footer"><p>Afribourse · afribourse.com · <a href="${config.app.frontendUrl}/desabonnement">Se désabonner</a></p></div>
  </div>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: '🏆 Le Top 5 de la communauté Afribourse cette semaine',
    html,
    text: `Bonjour ${name},\n\nCela fait une semaine que vous avez créé votre compte. Voici le Top 5 simulateur de la semaine :\n\n1. Kouassi A. — +18,4%\n2. Mariama D. — +15,2%\n3. Ousmane T. — +12,7%\n4. Awa S. — +10,1%\n5. Ibrahima K. — +8,9%\n\nRejoingnez le classement : ${simulatorUrl}\n\nSimba — Votre coach BRVM\nAfribourse · afribourse.com`,
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
  marketData: {
    topGainers: MarketMoverEmail[];
    topLosers: MarketMoverEmail[];
    weekLabel: string;
  };
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
    weeklyQuizzesTaken: number;
    weeklyXpEarned: number;
    weeklyTimeSpentMinutes: number;
    currentStreak: number;
    currentLevel: number;
    totalXp: number;
    completionPercent: number;
    totalModulesCompleted: number;
    totalModulesAvailable: number;
    recentCompletedModules: Array<{ title: string; slug: string; quizScore?: number; completedAt: Date }>;
    suggestedModules: Array<{ title: string; slug: string; difficulty: string; durationMinutes?: number }>;
    recentAchievements: Array<{ name: string; description: string; unlockedAt: Date }>;
    isReminder?: boolean;
  };
}

export async function sendWeeklyReportEmail({
  email,
  name,
  period,
  marketData,
  portfolioStats,
  learningStats,
}: SendWeeklyReportEmailParams): Promise<void> {
  const displayName = name || 'Investisseur';

  const formatFCFA = (n: number) => n.toLocaleString('fr-FR') + ' FCFA';
  const formatPct = (n: number, showPlus = true) =>
    `${showPlus && n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
  const formatTime = (min: number) => {
    if (min < 60) return `${Math.round(min)} min`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  // ── Section marché ─────────────────────────────────────────────────────────
  const gainersRows = marketData.topGainers.map(s => `
    <tr>
      <td style="padding:8px 12px;font-weight:600;color:#1f2937;">${s.symbol}</td>
      <td style="padding:8px 12px;color:#6b7280;font-size:13px;">${s.companyName}</td>
      <td style="padding:8px 12px;text-align:right;font-weight:700;color:#10b981;">${formatPct(s.weeklyChangePercent)}</td>
      <td style="padding:8px 12px;text-align:right;color:#4b5563;">${s.currentPrice.toLocaleString('fr-FR')}</td>
    </tr>`).join('');

  const losersRows = marketData.topLosers.map(s => `
    <tr>
      <td style="padding:8px 12px;font-weight:600;color:#1f2937;">${s.symbol}</td>
      <td style="padding:8px 12px;color:#6b7280;font-size:13px;">${s.companyName}</td>
      <td style="padding:8px 12px;text-align:right;font-weight:700;color:#ef4444;">${formatPct(s.weeklyChangePercent)}</td>
      <td style="padding:8px 12px;text-align:right;color:#4b5563;">${s.currentPrice.toLocaleString('fr-FR')}</td>
    </tr>`).join('');

  // ── Section portefeuille ───────────────────────────────────────────────────
  let portfolioSection = '';
  if (portfolioStats) {
    const isProfit = portfolioStats.totalGainLoss >= 0;
    const glColor = isProfit ? '#10b981' : '#ef4444';
    const glIcon = isProfit ? '📈' : '📉';

    const evolutionBlock = portfolioStats.biweeklyEvolution ? `
      <div style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:16px 20px;border-radius:10px;margin:16px 0;text-align:center;">
        <div style="font-size:13px;opacity:.9;margin-bottom:10px;">📊 Évolution depuis la semaine dernière</div>
        <div style="display:flex;justify-content:space-around;align-items:center;flex-wrap:wrap;gap:12px;">
          <div><div style="font-size:11px;opacity:.8;">Précédent</div><div style="font-weight:bold;">${formatFCFA(portfolioStats.biweeklyEvolution.previousValue)}</div></div>
          <div style="font-size:20px;">→</div>
          <div><div style="font-size:11px;opacity:.8;">Actuel</div><div style="font-weight:bold;">${formatFCFA(portfolioStats.biweeklyEvolution.currentValue)}</div></div>
        </div>
        <div style="margin-top:12px;padding:8px 16px;background:rgba(255,255,255,.2);border-radius:6px;display:inline-block;font-weight:bold;">
          ${portfolioStats.biweeklyEvolution.change >= 0 ? '↗' : '↘'} ${formatFCFA(portfolioStats.biweeklyEvolution.change)} (${formatPct(portfolioStats.biweeklyEvolution.changePercent)})
        </div>
      </div>` : '';

    const performersBlock = portfolioStats.topPerformers.length > 0 ? `
      <div style="margin-top:16px;">
        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">🏆 Meilleures positions</div>
        ${portfolioStats.topPerformers.map(p => `
          <div style="display:flex;justify-content:space-between;padding:8px 12px;background:#f0fdf4;border-left:3px solid #10b981;border-radius:4px;margin-bottom:6px;">
            <span style="font-weight:600;">${p.ticker}</span>
            <span style="color:#10b981;font-weight:700;">${formatPct(p.gainLossPercent)}</span>
          </div>`).join('')}
      </div>` : '';

    const losersBlock = portfolioStats.topLosers.length > 0 ? `
      <div style="margin-top:12px;">
        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">📉 Positions en recul</div>
        ${portfolioStats.topLosers.map(p => `
          <div style="display:flex;justify-content:space-between;padding:8px 12px;background:#fef2f2;border-left:3px solid #ef4444;border-radius:4px;margin-bottom:6px;">
            <span style="font-weight:600;">${p.ticker}</span>
            <span style="color:#ef4444;font-weight:700;">${formatPct(p.gainLossPercent)}</span>
          </div>`).join('')}
      </div>` : '';

    portfolioSection = `
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="margin:0 0 16px;font-size:18px;color:#1f2937;">📊 Votre Portefeuille</h2>

        <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;padding:20px;border-radius:10px;text-align:center;">
          <div style="font-size:13px;opacity:.9;">Valeur Totale</div>
          <div style="font-size:32px;font-weight:bold;margin:8px 0;">${formatFCFA(portfolioStats.totalValue)}</div>
          <div style="display:inline-block;padding:6px 16px;background:rgba(255,255,255,.2);border-radius:6px;font-weight:600;color:${glColor};">
            ${glIcon} ${formatFCFA(portfolioStats.totalGainLoss)} (${formatPct(portfolioStats.totalGainLossPercent)})
          </div>
        </div>

        ${evolutionBlock}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">
          <div style="background:#f9fafb;padding:14px;border-radius:8px;border:1px solid #e5e7eb;">
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Liquidités</div>
            <div style="font-size:18px;font-weight:bold;color:#1f2937;">${formatFCFA(portfolioStats.cashBalance)}</div>
          </div>
          <div style="background:#f9fafb;padding:14px;border-radius:8px;border:1px solid #e5e7eb;">
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Investi</div>
            <div style="font-size:18px;font-weight:bold;color:#1f2937;">${formatFCFA(portfolioStats.investedValue)}</div>
          </div>
        </div>

        ${performersBlock}
        ${losersBlock}
      </div>`;
  }

  // ── Section apprentissage ──────────────────────────────────────────────────
  let learningSection = '';
  if (learningStats) {
    const hasActivity = learningStats.weeklyModulesCompleted > 0
      || learningStats.weeklyQuizzesTaken > 0
      || learningStats.weeklyXpEarned > 0;

    const motivationMsg = learningStats.isReminder
      ? "Pas de cours cette semaine ? Revenez apprendre pour ne pas perdre votre streak !"
      : learningStats.weeklyModulesCompleted >= 3
        ? "Excellent rythme cette semaine ! Vous progressez vite."
        : learningStats.weeklyModulesCompleted >= 1
          ? "Bon effort ! Chaque module vous rapproche de vos objectifs."
          : "Continuez votre apprentissage pour devenir un investisseur averti !";

    const recentModulesBlock = learningStats.recentCompletedModules.length > 0 ? `
      <div style="margin-top:16px;">
        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">✅ Modules complétés cette semaine</div>
        ${learningStats.recentCompletedModules.map(m => `
          <div style="padding:8px 12px;background:#f0f9ff;border-left:3px solid #3b82f6;border-radius:4px;margin-bottom:6px;">
            <span style="font-weight:600;color:#1e40af;">${m.title}</span>
            ${m.quizScore !== undefined ? `<span style="margin-left:8px;font-size:12px;color:#6b7280;">Quiz: ${m.quizScore}%</span>` : ''}
          </div>`).join('')}
      </div>` : '';

    const suggestedBlock = learningStats.suggestedModules.length > 0 ? `
      <div style="margin-top:16px;">
        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">📖 Prochains modules suggérés</div>
        ${learningStats.suggestedModules.map(m => `
          <div style="padding:8px 12px;background:#fefce8;border-left:3px solid #eab308;border-radius:4px;margin-bottom:6px;">
            <span style="font-weight:600;">${m.title}</span>
            ${m.durationMinutes ? `<span style="margin-left:8px;font-size:12px;color:#6b7280;">${m.durationMinutes} min</span>` : ''}
          </div>`).join('')}
      </div>` : '';

    const achievementsBlock = learningStats.recentAchievements.length > 0 ? `
      <div style="margin-top:16px;">
        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">🏅 Badges débloqués</div>
        ${learningStats.recentAchievements.map(a => `
          <div style="padding:8px 12px;background:#fdf4ff;border-left:3px solid #a855f7;border-radius:4px;margin-bottom:6px;">
            <span style="font-weight:600;">${a.name}</span>
            ${a.description ? `<div style="font-size:12px;color:#6b7280;">${a.description}</div>` : ''}
          </div>`).join('')}
      </div>` : '';

    learningSection = `
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="margin:0 0 16px;font-size:18px;color:#1f2937;">📚 Votre Apprentissage</h2>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
          <div style="background:#f0f9ff;padding:14px;border-radius:8px;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#3b82f6;">${learningStats.weeklyModulesCompleted}</div>
            <div style="font-size:11px;color:#6b7280;">modules</div>
          </div>
          <div style="background:#fdf4ff;padding:14px;border-radius:8px;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#a855f7;">${learningStats.weeklyXpEarned}</div>
            <div style="font-size:11px;color:#6b7280;">XP gagnés</div>
          </div>
          <div style="background:#fff7ed;padding:14px;border-radius:8px;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#f97316;">🔥 ${learningStats.currentStreak}</div>
            <div style="font-size:11px;color:#6b7280;">jours streak</div>
          </div>
        </div>

        <div style="background:#f9fafb;padding:12px 16px;border-radius:8px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:13px;color:#374151;">Progression globale</span>
            <span style="font-size:13px;font-weight:600;">${learningStats.completionPercent.toFixed(0)}%</span>
          </div>
          <div style="background:#e5e7eb;border-radius:4px;height:8px;">
            <div style="background:#3b82f6;height:8px;border-radius:4px;width:${Math.min(learningStats.completionPercent, 100).toFixed(0)}%;"></div>
          </div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">${learningStats.totalModulesCompleted} / ${learningStats.totalModulesAvailable} modules</div>
        </div>

        <div style="background:#fef3c7;border-left:3px solid #f59e0b;padding:10px 14px;border-radius:4px;font-size:13px;color:#92400e;">
          💡 ${motivationMsg}
        </div>

        ${recentModulesBlock}
        ${suggestedBlock}
        ${achievementsBlock}
      </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport Hebdomadaire - AfriBourse</title>
</head>
<body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;max-width:620px;margin:0 auto;padding:20px;background-color:#f4f4f4;">
  <div style="background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 10px rgba(0,0,0,.1);">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M17 6H23V12" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span style="font-size:28px;font-weight:bold;color:#f97316;">AfriBourse</span>
      </div>
      <h1 style="margin:0;font-size:22px;color:#1f2937;">Rapport Hebdomadaire</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${period}</p>
    </div>

    <p style="color:#4b5563;margin-bottom:24px;">Bonjour <strong>${displayName}</strong>,<br>Voici votre bilan de la semaine : marché BRVM, portefeuille et progression en apprentissage.</p>

    <!-- Section marché -->
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:24px;">
      <h2 style="margin:0 0 16px;font-size:18px;color:#1f2937;">🌍 Marché BRVM — Top / Flop de la semaine</h2>

      ${marketData.topGainers.length > 0 ? `
      <div style="margin-bottom:20px;">
        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">📈 Meilleures hausses</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">Titre</th>
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">Société</th>
              <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:600;">Variation</th>
              <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:600;">Prix (FCFA)</th>
            </tr>
          </thead>
          <tbody>${gainersRows}</tbody>
        </table>
      </div>` : ''}

      ${marketData.topLosers.length > 0 ? `
      <div>
        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">📉 Plus fortes baisses</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">Titre</th>
              <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;">Société</th>
              <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:600;">Variation</th>
              <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:600;">Prix (FCFA)</th>
            </tr>
          </thead>
          <tbody>${losersRows}</tbody>
        </table>
      </div>` : ''}

      ${marketData.topGainers.length === 0 && marketData.topLosers.length === 0
        ? '<p style="color:#6b7280;text-align:center;font-style:italic;">Données de marché non disponibles pour cette semaine.</p>'
        : ''}
    </div>

    <!-- Sections dynamiques -->
    ${portfolioSection}
    ${learningSection}

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0 20px;">
      <a href="${config.app.frontendUrl}/dashboard"
         style="display:inline-block;padding:14px 32px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
        Voir Mon Dashboard
      </a>
    </div>

    <!-- Footer -->
    <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center;">
      <p style="margin:0;">Rapport hebdomadaire AfriBourse · <a href="${config.app.frontendUrl}" style="color:#f97316;">afribourse.com</a></p>
      <p style="margin:4px 0 0;">Questions ? <a href="mailto:contact@afribourse.com" style="color:#f97316;">contact@afribourse.com</a></p>
    </div>
  </div>
</body>
</html>`;

  const hasPortfolio = !!portfolioStats;
  const hasLearning = !!learningStats;
  const subjectParts: string[] = [];
  if (hasPortfolio) subjectParts.push('Portefeuille');
  if (hasLearning) subjectParts.push('Apprentissage');
  subjectParts.push('Marché BRVM');

  await sendEmail({
    to: email,
    subject: `📬 Rapport hebdo AfriBourse — ${subjectParts.join(' · ')} (${period})`,
    html,
    text: `Bonjour ${displayName},\n\nVoici votre rapport hebdomadaire AfriBourse (${period}).\n\nConsultez votre dashboard : ${config.app.frontendUrl}/dashboard\n\nAfriBourse · afribourse.com`,
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
  sendReengagementEmail0,
  sendReengagementEmail1,
  sendReengagementEmail2,
  sendReengagementEmail3,
  sendEmail,
};
