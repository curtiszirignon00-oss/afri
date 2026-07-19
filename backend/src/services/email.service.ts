import { log } from '../config/logger';
import transporter, { smtpReady } from '../config/mailer';
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
  const displayName = (name && name.trim()) ? name.trim() : 'Investisseur';
  const confirmationUrl = `${config.app.frontendUrl}/confirmer-inscription?token=${confirmationToken}`;
  log.info(`[EMAIL] Envoi email confirmation → ${email} (token: ${confirmationToken?.slice(0, 10)}...)`);

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

        <h1>Bienvenue ${displayName} !</h1>

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
Bienvenue ${displayName} !

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
 * Fonction générique d'envoi d'email avec retry automatique (3 tentatives)
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<void> {
  if (!smtpReady) {
    log.error(`[EMAIL] ❌ SMTP non configuré — email non envoyé à ${to} (sujet: "${subject}")`);
    throw new Error('SMTP non configuré : variables SMTP_HOST/SMTP_USER/SMTP_PASS manquantes');
  }

  const MAX_ATTEMPTS = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const info = await transporter.sendMail({
        from: `"${config.email.fromName}" <${config.email.from}>`,
        to,
        subject,
        html,
        text: text || '',
      });

      log.info(`[EMAIL] ✅ Envoyé à ${to} (sujet: "${subject}", messageId: ${info.messageId})`);
      return;
    } catch (error: any) {
      lastError = error;
      log.error(
        `[EMAIL] ❌ Tentative ${attempt}/${MAX_ATTEMPTS} échouée pour ${to} — ` +
        `${error.code || error.name}: ${error.message}` +
        (error.response ? ` | SMTP: ${error.response}` : '')
      );

      if (attempt < MAX_ATTEMPTS) {
        // Backoff exponentiel : 2s, 4s
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }
  }

  throw new Error(`Échec de l'envoi de l'email après ${MAX_ATTEMPTS} tentatives : ${lastError?.message}`);
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
            <p>© ${new Date().getFullYear()} AfriBourse · <a href="${config.app.frontendUrl}" style="color:#00D4A8;text-decoration:none;">africbourse.com</a></p>
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
            <a href="${appUrl}">africbourse.com</a> ·
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
}: { email: string; name: string | null; confirmationToken: string }): Promise<void> {
  const confirmationUrl = `${config.app.frontendUrl}/confirmer-inscription?token=${confirmationToken}`;
  const firstName = (name && name.trim()) ? name.trim().split(' ')[0] : 'Investisseur';

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
    <p>— <strong>SIMBA</strong><br><span style="color: #9ca3af; font-size: 13px;">Afribourse · africbourse.com</span></p>
    <div class="footer"><p>Afribourse · africbourse.com · <a href="${config.app.frontendUrl}/desabonnement">Se désabonner</a></p></div>
  </div>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `${firstName}, ${top1.displayName} fait ${fmt(top1.roi)} cette semaine. Voici son secret.`,
    html,
    text: `Cela fait 7 jours que vous avez créé votre compte.\n\nVoici le classement cette semaine :\n\n${textRows}\n\n${top1.displayName} a commencé comme vous — 1 000 000 FCFA virtuels, zéro expérience.\n\nSa stratégie : Module 1 (8 min) → 2-3 titres dans le simulateur → suivi quotidien.\n\nRejoignez le classement : ${classementUrl}\n\n— SIMBA\nAfribourse · africbourse.com`,
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
            <a href="${config.app.frontendUrl}" style="color:#00D4A8;text-decoration:none;">africbourse.com</a>
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

export async function sendWebinarLaunchEmail({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const displayName = name || 'Investisseur';
  const webinarUrl = 'https://www.africbourse.com/webinaires';

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🎓 Maîtrisez la BRVM avec nos experts — 3 webinaires exclusifs</title>
    </head>
    <body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

      <!-- Preheader (invisible) -->
      <span style="display:none;max-height:0;overflow:hidden;">Places limitées · Tarif spécial pour les 20 premiers inscrits &#847;&zwnj;&nbsp;&#847;</span>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F5F9;">
        <tr>
          <td align="center" style="padding:32px 16px;">

            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

              <!-- Logo header -->
              <tr>
                <td style="background-color:#FFFFFF;border-radius:16px 16px 0 0;padding:28px 40px 20px;border-bottom:1px solid #E2E8F0;text-align:center;">
                  <span style="font-size:26px;font-weight:900;color:#1D4ED8;letter-spacing:-0.5px;">AFRI</span><span style="font-size:26px;font-weight:900;color:#F97316;">BOURSE</span>
                </td>
              </tr>

              <!-- Hero banner -->
              <tr>
                <td style="background:linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 50%,#4338CA 100%);padding:40px 40px 36px;text-align:center;">
                  <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#BFDBFE;letter-spacing:2px;text-transform:uppercase;">Formation Live · BRVM</p>
                  <h1 style="margin:0 0 12px;font-size:28px;font-weight:900;color:#FFFFFF;line-height:1.3;">🎓 Nos premiers webinaires<br>de formation arrivent !</h1>
                  <p style="margin:0 0 20px;font-size:15px;color:#BFDBFE;line-height:1.6;">3 sessions live animées par des experts marchés et analystes BRVM.<br>Places limitées — tarif préférentiel pour les 20 premiers.</p>
                  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                    <tr>
                      <td style="background-color:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:100px;padding:6px 18px;">
                        <span style="font-size:12px;font-weight:700;color:#FFFFFF;">3 webinaires · 1 parcours complet · Des experts à vos côtés</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="background-color:#FFFFFF;padding:36px 40px;">

                  <!-- Greeting -->
                  <p style="margin:0 0 20px;font-size:15px;color:#374151;font-weight:600;">Bonjour ${displayName},</p>
                  <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.7;">Depuis que vous avez rejoint Afribourse, vous apprenez à votre rythme sur les marchés africains.</p>
                  <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">Aujourd'hui, nous franchissons une nouvelle étape ensemble : nos <strong>premiers webinaires de formation en direct</strong>, animés par des experts et analystes de marché.</p>

                  <!-- Section title -->
                  <h2 style="margin:0 0 20px;font-size:18px;font-weight:800;color:#0F172A;border-bottom:2px solid #E2E8F0;padding-bottom:10px;">Les 3 sessions au programme</h2>

                  <!-- Session 1 -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;border:1px solid #BFDBFE;border-radius:12px;overflow:hidden;">
                    <tr>
                      <td style="background-color:#EFF6FF;border-left:4px solid #1D4ED8;padding:18px 20px;">
                        <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#1D4ED8;text-transform:uppercase;letter-spacing:0.5px;">Session 1 — Samedi 13 juin 2026</p>
                        <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#0F172A;">Maîtriser les fondamentaux de la bourse</p>
                        <p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.6;">Passez de zéro à investisseur en une seule session. Comprendre la BRVM, les actions, les obligations, et poser vos premières bases solides.</p>
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding-right:16px;font-size:13px;color:#64748B;">⏱ Durée : <strong>3H</strong></td>
                            <td style="font-size:13px;color:#64748B;">💰 Prix : <strong>10 000 XOF</strong></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Session 2 -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;border:1px solid #A7F3D0;border-radius:12px;overflow:hidden;">
                    <tr>
                      <td style="background-color:#ECFDF5;border-left:4px solid #065F46;padding:18px 20px;">
                        <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#065F46;text-transform:uppercase;letter-spacing:0.5px;">Session 2 — 20 &amp; 21 juin 2026</p>
                        <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#0F172A;">Analyse fondamentale : lire les données comme un pro</p>
                        <p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.6;">Décryptez les bilans, les ratios financiers et les rapports annuels des entreprises cotées à la BRVM. Apprenez à évaluer si une action vaut son prix.</p>
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding-right:16px;font-size:13px;color:#64748B;">⏱ Durée : <strong>4H</strong></td>
                            <td style="font-size:13px;color:#64748B;">💰 Prix : <strong>20 000 XOF</strong></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Session 3 -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;border:1px solid #FED7AA;border-radius:12px;overflow:hidden;">
                    <tr>
                      <td style="background-color:#FFF7ED;border-left:4px solid #C2410C;padding:18px 20px;">
                        <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#C2410C;text-transform:uppercase;letter-spacing:0.5px;">Session 3 — 27 &amp; 28 juin 2026</p>
                        <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#0F172A;">Analyse technique : lisez les graphiques avant tout le monde</p>
                        <p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.6;">Patterns, indicateurs, timing d'entrée et de sortie — apprenez à identifier les opportunités sur les graphiques BRVM avant qu'elles deviennent évidentes.</p>
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding-right:16px;font-size:13px;color:#64748B;">⏱ Durée : <strong>4H</strong></td>
                            <td style="font-size:13px;color:#64748B;">💰 Prix : <strong>20 000 XOF</strong></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA -->
                  <h2 style="margin:0 0 16px;font-size:18px;font-weight:800;color:#0F172A;border-bottom:2px solid #E2E8F0;padding-bottom:10px;">Comment s'inscrire ?</h2>
                  <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">Cliquez sur le bouton ci-dessous pour accéder à la page des webinaires et choisir votre session :</p>
                  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;">
                    <tr>
                      <td style="background:linear-gradient(135deg,#1D4ED8,#4338CA);border-radius:12px;">
                        <a href="${webinarUrl}" style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;">
                          🎓 Réserver ma place →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Why now -->
                  <h2 style="margin:0 0 16px;font-size:18px;font-weight:800;color:#0F172A;border-bottom:2px solid #E2E8F0;padding-bottom:10px;">Pourquoi ces webinaires maintenant ?</h2>
                  <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.7;">Vous êtes plus de <strong>2 000 utilisateurs</strong> à apprendre sur Afribourse. Beaucoup d'entre vous nous ont posé la même question : <em>« Comment aller plus loin ? »</em></p>
                  <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">Ces webinaires sont notre réponse. Des sessions courtes, intensives, animées par des experts qui connaissent la BRVM — pas des formations génériques importées d'Europe ou d'Amérique. Des formations pensées pour vous, pour vos marchés, pour vos opportunités.<br><br>Les places sont limitées pour garantir la qualité des échanges. Les premiers inscrits bénéficient du tarif préférentiel.</p>

                  <!-- Pack section -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:2px solid #F59E0B;border-radius:14px;overflow:hidden;">
                    <tr>
                      <td style="padding:24px;">
                        <p style="margin:0 0 10px;font-size:16px;font-weight:900;color:#92400E;text-align:center;">⭐ OFFRE PACK — Le Parcours Investisseur Complet ⭐</p>
                        <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#0F172A;">Les 3 sessions + 4 extras exclusifs :</p>
                        <p style="margin:0 0 6px;font-size:14px;color:#374151;">✓ &nbsp;Accès à la Communauté Afribourse — 3 mois</p>
                        <p style="margin:0 0 6px;font-size:14px;color:#374151;">✓ &nbsp;3 Plans d'Action personnalisés (un après chaque session)</p>
                        <p style="margin:0 0 6px;font-size:14px;color:#374151;">✓ &nbsp;Deal Flow hebdomadaire — 12 analyses exclusives sur la BRVM</p>
                        <p style="margin:0 0 16px;font-size:14px;color:#374151;">✓ &nbsp;Certificat Investisseur BRVM Niveau 1 — partageable sur LinkedIn</p>
                        <p style="margin:0 0 4px;font-size:16px;font-weight:900;color:#92400E;text-align:center;">🔥 Tarif préférentiel 7 jours : 25 000 XOF <span style="text-decoration:line-through;font-weight:400;color:#B45309;">au lieu de 35 000 XOF</span></p>
                        <p style="margin:0;font-size:13px;color:#92400E;text-align:center;">Offre valable jusqu'au 2 juin 2026 — 35 000 XOF ensuite</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Important notice -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;background-color:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 8px;font-size:15px;font-weight:800;color:#0F172A;">ℹ️ Important : aucun paiement requis maintenant</p>
                        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">La préinscription est gratuite et immédiate. Elle vous garantit le tarif early-bird si vous êtes parmi les 20 premiers inscrits. Les instructions de paiement (Wave, Orange Money, MTN MoMo) vous seront envoyées par message après votre préinscription.</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Final CTA -->
                  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;display:block;text-align:center;">
                    <tr>
                      <td style="background:linear-gradient(135deg,#1D4ED8,#4338CA);border-radius:12px;">
                        <a href="${webinarUrl}" style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;">
                          Je réserve ma place →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Signature -->
                  <p style="margin:0 0 4px;font-size:15px;color:#374151;">À très bientôt en live,</p>
                  <p style="margin:0 0 2px;font-size:16px;font-weight:800;color:#374151;">SIMBA</p>
                  <p style="margin:0;font-size:13px;color:#64748B;">Coach IA, Afribourse</p>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#F8FAFC;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
                  <p style="margin:0 0 6px;font-size:12px;color:#94A3B8;">Vous recevez cet email car vous êtes inscrit sur <a href="https://www.africbourse.com" style="color:#1D4ED8;text-decoration:none;">AfriBourse</a>.</p>
                  <p style="margin:0;font-size:12px;color:#94A3B8;">© 2026 AfriBourse · <a href="https://www.africbourse.com" style="color:#1D4ED8;text-decoration:none;">africbourse.com</a></p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: '🎓 Maîtrisez la BRVM avec nos experts — 3 webinaires exclusifs',
    html,
    text: `Bonjour ${displayName},\n\nNos webinaires de formation en direct de juin sont ouverts !\n\n3 sessions au programme :\n• Session 1 — 13 juin : Maîtriser les fondamentaux (3H · 10 000 XOF)\n• Session 2 — 20-21 juin : Analyse fondamentale (4H · 20 000 XOF)\n• Session 3 — 27-28 juin : Analyse technique (4H · 20 000 XOF)\n\nPack Parcours Investisseur : 25 000 XOF (tarif préférentiel jusqu'au 2 juin) · 35 000 XOF ensuite\n\n→ Réserver ma place : ${webinarUrl}\n\nÀ très bientôt en live,\nSIMBA — Coach IA, Afribourse`,
  });
}

// ─── Confirmation d'inscription webinaire ─────────────────────────────────────

interface WebinarConfirmationParams {
  email: string;
  firstName: string;
  webinarId: string;
  earlyBird: boolean;
  registrationId: string;
  pack?: string | null;
}

type WebinarCfg = {
  subject: string;
  preheader: string;
  headerBg: string;
  heroGradient: string;
  heroLabel: string;
  heroTitle: string;
  heroSub: string;
  accentColor: string;
  accentLight: string;
  accentBorder: string;
  intro: string;
  recap: string;
  prep: string;
  after: string;
  learning: string[];
  signoff: string;
  amount: string;
};

function getWebinarCfg(webinarId: string, earlyBird: boolean, pack?: string | null): WebinarCfg {
  const eb = earlyBird;

  if (webinarId === 'w1-fondamentaux' || webinarId === 'w1-fondamentaux-juin') {
    return {
      subject: '✅ Votre place est réservée — Webinaire du 18 juillet',
      preheader: 'Tout ce que vous devez savoir avant la session',
      headerBg: '#1D4ED8',
      heroGradient: 'linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 50%,#4338CA 100%)',
      heroLabel: 'Session 1 · 18 juillet 2026',
      heroTitle: '🎉 Inscription confirmée !',
      heroSub: "Maîtriser les fondamentaux de la bourse — votre première étape vers l'investissement sur la BRVM.",
      accentColor: '#1D4ED8',
      accentLight: '#EFF6FF',
      accentBorder: '#BFDBFE',
      intro: 'Votre inscription est confirmée.',
      recap: `
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;width:40%;">Titre</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">Maîtriser les fondamentaux de la bourse</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Date</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">Samedi 18 juillet 2026</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Heure</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">09h00 — 12h00 GMT</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Durée</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">3 heures de formation live</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Format</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">Visioconférence</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Animé par</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">Experts marchés & Analystes Afribourse</td></tr>`,
      prep: `
        <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;">1. <strong>Accédez à africbourse.com</strong> pendant la session — les exercices pratiques seront sur la plateforme.</p>
        <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;">2. <strong>Préparez vos questions.</strong> Notez les concepts qui vous semblent flous dans les modules de formation.</p>
        <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;">3. <strong>Rejoignez 5 min avant le début.</strong> Le lien sera actif à partir de 08h50.</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">4. <strong>Ayez un bloc-notes.</strong> Vous recevrez aussi un résumé par email après la session.</p>`,
      after: `
        <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;"><strong>Le lendemain (19 juillet)</strong> : vous recevrez votre Plan d'Action personnalisé — 3 actions concrètes à réaliser sur la BRVM.</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;"><strong>Sessions 2 & 3</strong> : Analyse fondamentale les 1-2 août. En tant que participant, vous bénéficiez d'un accès prioritaire.</p>`,
      learning: [
        'Comprendre la BRVM : structure, acteurs, fonctionnement des 8 pays UEMOA',
        'Actions vs obligations : différences, rendements, risques',
        'Comment lire une fiche valeur BRVM et interpréter les cours',
        'Les erreurs classiques des débutants et comment les éviter',
        'Ouvrir un compte SGI : les étapes concrètes et les bonnes questions à poser',
      ],
      signoff: 'À samedi 18 juillet,',
      amount: '10 000 XOF',
    };
  }

  if (webinarId === 'w2-fondamentale' || webinarId === 'w2-fondamentale-juin') {
    return {
      subject: "✅ C'est confirmé — Vous analysez comme un pro le 18 juillet",
      preheader: 'Bilans, ratios, rapports annuels — tout commence ici',
      headerBg: '#065F46',
      heroGradient: 'linear-gradient(135deg,#064E3B 0%,#065F46 50%,#047857 100%)',
      heroLabel: 'Sessions 2 & 3 · 1-2 août 2026',
      heroTitle: '✅ Inscription confirmée !',
      heroSub: "Vous avez fait le bon choix. L'analyse fondamentale sépare ceux qui investissent avec méthode de ceux qui investissent à l'instinct.",
      accentColor: '#065F46',
      accentLight: '#ECFDF5',
      accentBorder: '#A7F3D0',
      intro: 'Votre inscription est confirmée.',
      recap: `
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;width:40%;">Titre</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">Analyse fondamentale — lire les données comme un pro</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Dates</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">Samedi 1 août & Dimanche 2 août 2026</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Heure</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">09h00 — 13h00 GMT (chaque jour)</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Durée</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">4 heures de formation live par jour</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Format</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">Visioconférence</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Animé par</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">Analystes financiers Afribourse</td></tr>`,
      prep: `
        <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;">Sur africbourse.com, révisez les modules <strong>« Comprendre les états financiers »</strong> et <strong>« Ratios boursiers »</strong>. Vous aurez une longueur d'avance le 18 juillet.</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;"><strong>Téléchargez le rapport annuel 2024</strong> de 2 sociétés BRVM de votre choix — on les analysera ensemble pendant la session.</p>`,
      after: `
        <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;"><strong>Le 20 juillet</strong> : votre Plan d'Action Analyse Fondamentale — une liste de 3 actions BRVM à étudier avec la méthode apprise, et un template d'analyse à remplir.</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;"><strong>Sessions 4 & 5</strong> : Analyse technique les 15-16 août.</p>`,
      learning: [
        'Lire un bilan comptable et identifier les signaux de solidité financière',
        'Décrypter les ratios clés : PER, PBR, rendement du dividende, dette nette/EBITDA',
        'Analyser un rapport annuel BRVM en moins de 30 minutes',
        'Comparer des entreprises du même secteur pour trouver les valeurs sous-évaluées',
        'Cas pratiques : analyse en direct de 3 sociétés cotées à la BRVM',
      ],
      signoff: 'À samedi 18 juillet,',
      amount: '20 000 XOF',
    };
  }

  if (webinarId === 'w3-technique' || webinarId === 'w3-technique-juin') {
    return {
      subject: '✅ Inscrit — Vous lirez les graphiques avant tout le monde',
      preheader: 'Patterns, indicateurs, timing — votre arsenal complet le 1 août',
      headerBg: '#C2410C',
      heroGradient: 'linear-gradient(135deg,#9A3412 0%,#C2410C 50%,#EA580C 100%)',
      heroLabel: 'Sessions 4 & 5 · 15-16 août 2026',
      heroTitle: '🔥 Inscription confirmée !',
      heroSub: "L'analyse technique, c'est l'art de lire ce que le marché dit déjà — avant que tout le monde ne le voie.",
      accentColor: '#C2410C',
      accentLight: '#FFF7ED',
      accentBorder: '#FED7AA',
      intro: 'Votre inscription est confirmée.',
      recap: `
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;width:40%;">Titre</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">Analyse technique — lisez les graphiques avant tout le monde</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Dates</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">Samedi 15 août & Dimanche 16 août 2026</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Heure</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">09h00 — 13h00 GMT (chaque jour)</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Durée</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">4 heures de formation live par jour</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Format</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">Visioconférence</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Animé par</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">Analystes techniques Afribourse</td></tr>`,
      prep: `
        <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;">Ouvrez le <strong>simulateur de portefeuille Afribourse</strong> et l'outil d'analyse des cours. Vous travaillerez sur les graphiques en temps réel — ayez les deux onglets prêts.</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;"><strong>Choisissez 2-3 actions BRVM</strong> qui vous intéressent. On les analysera ensemble à partir de leurs graphiques réels.</p>`,
      after: `
        <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;"><strong>Le 3 août</strong> : votre Plan d'Action Analyse Technique — une short-list de 3 actions avec les niveaux d'entrée et de sortie identifiés pendant la session.</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;"><strong>Semaine du 4 août</strong> : si vous avez participé aux 5 sessions, votre dossier de candidature au Certificat Investisseur BRVM Niveau 1 est automatiquement ouvert.</p>`,
      learning: [
        'Les patterns de prix incontournables : supports, résistances, tendances',
        "Les indicateurs techniques adaptés à la BRVM : RSI, MACD, moyennes mobiles",
        "Comment identifier une opportunité d'entrée avant qu'elle soit évidente",
        'Gérer le risque : stop-loss, take-profit, position sizing sur petit capital',
        'Analyse en direct : 3 graphiques BRVM décryptés en temps réel',
      ],
      signoff: 'À samedi 1 août,',
      amount: '20 000 XOF',
    };
  }

  // Pack Parcours Investisseur — Cohorte Juillet 2026 (contenu selon le pack)
  const tierCfg = pack && PACK_TIER_PRICES[pack] ? PACK_TIER_PRICES[pack] : null;
  const packAmount = tierCfg ? `${tierCfg.full.toLocaleString('fr-FR')} XOF` : (eb ? '25 000 XOF (Tarif préférentiel)' : '35 000 XOF');
  const packName = tierCfg ? tierCfg.name : 'Pack Parcours Investisseur';
  // Sessions / heures / webinaires & avantages en plus selon le pack (+2 sessions, +6h par palier)
  const tierDetails: Record<string, { sessions: number; hours: number; extras: string[] }> = {
    starter:      { sessions: 5, hours: 15, extras: [] },
    parcours:     { sessions: 7, hours: 21, extras: [
      'Webinaire W6 — Constitution de portefeuille',
      'Webinaire W7 — Gestion du risque',
      'Revue de portefeuille personnalisée + Q&A live mensuelle (×3)',
      'Ouverture compte SGI — session collective live',
    ] },
    investisseur: { sessions: 9, hours: 27, extras: [
      'Webinaire W6 — Constitution de portefeuille',
      'Webinaire W7 — Gestion du risque',
      "Webinaire W8 — Psychologie de l'investisseur",
      'Appel 1:1 de 30 min avec Curtis (revue personnelle)',
      'Investment Policy Statement personnalisé + accès à vie',
      'Ouverture compte SGI — accompagnement main dans la main',
    ] },
  };
  const det = (pack && tierDetails[pack]) ? tierDetails[pack] : tierDetails.starter;
  const extrasHtml = det.extras.length
    ? `<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1D4ED8;">➕ En plus dans votre ${packName} :</p>`
      + det.extras.map((e) => `<p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.6;">✓ <strong>${e}</strong></p>`).join('')
    : '';
  return {
    subject: `🎓 Bienvenue dans le ${packName} — Tout commence maintenant`,
    preheader: 'Votre calendrier complet, vos accès, et ce qui vous attend semaine par semaine',
    headerBg: '#1D4ED8',
    heroGradient: 'linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 40%,#7C3AED 100%)',
    heroLabel: `${packName} · ${det.sessions} sessions · Communauté · Certificat`,
    heroTitle: '🎓 Bienvenue dans le Parcours !',
    heroSub: `D'ici mi-septembre, vous aurez suivi ${det.sessions} sessions live (${det.hours}h de formation), reçu vos plans d'action personnalisés, accédé au Deal Flow exclusif et intégré la Communauté Afribourse.`,
    accentColor: '#1D4ED8',
    accentLight: '#EFF6FF',
    accentBorder: '#BFDBFE',
    intro: 'Vous avez pris une décision importante aujourd\'hui.',
    recap: `
      <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;width:40%;">Pack</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">${packName} · ${det.sessions} sessions · ${det.hours}h</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Session 1 — Fondamentaux</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">Samedi 8 août 2026 · 09h00-12h00 GMT</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Sessions 2 & 3 — Analyse fondamentale</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">22-23 août 2026 · 09h00-12h00 GMT</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Sessions 4 & 5 — Analyse technique</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">5-6 septembre 2026 · 09h00-12h00 GMT</td></tr>`,
    prep: `
      <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;">✓ <strong>${det.sessions} sessions live · ${det.hours}h de formation</strong> (base : 8 août + 22-23 août + 5-6 septembre)</p>
      <p style="margin:0 0 10px;font-size:14px;color:#065F46;line-height:1.7;">📍 <strong>Sessions en présentiel</strong> en Côte d'Ivoire, au Bénin et au Sénégal — en ligne (visio) pour les autres pays.</p>
      ${extrasHtml}
      <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;">✓ <strong>Communauté Afribourse</strong> — 3 mois d'accès (actif mi-septembre)</p>
      <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;">✓ <strong>Plans d'Action personnalisés</strong> — livrés après chaque thème</p>
      <p style="margin:0 0 10px;font-size:14px;color:#374151;line-height:1.7;">✓ <strong>Deal Flow hebdomadaire</strong> — 12 éditions exclusives</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">✓ <strong>Certificat Investisseur BRVM Niveau 1</strong> — disponible fin septembre si quiz complété</p>`,
    after: `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr style="background-color:#F8FAFC;">
          <td style="padding:8px 12px;font-size:13px;color:#1D4ED8;font-weight:700;border-bottom:1px solid #E2E8F0;">Date</td>
          <td style="padding:8px 12px;font-size:13px;color:#1D4ED8;font-weight:700;border-bottom:1px solid #E2E8F0;">Livrable</td>
        </tr>
        <tr><td style="padding:8px 12px;font-size:13px;color:#64748B;border-bottom:1px solid #F1F5F9;">Sam. 8 août</td><td style="padding:8px 12px;font-size:13px;color:#0F172A;border-bottom:1px solid #F1F5F9;">Session 1 live — Fondamentaux (3H)</td></tr>
        <tr><td style="padding:8px 12px;font-size:13px;color:#64748B;border-bottom:1px solid #F1F5F9;">Dim. 9 août</td><td style="padding:8px 12px;font-size:13px;color:#0F172A;border-bottom:1px solid #F1F5F9;">Plan d'Action #1 par email</td></tr>
        <tr><td style="padding:8px 12px;font-size:13px;color:#64748B;border-bottom:1px solid #F1F5F9;">22-23 août</td><td style="padding:8px 12px;font-size:13px;color:#0F172A;border-bottom:1px solid #F1F5F9;">Sessions 2 & 3 — Analyse fondamentale (2×3H)</td></tr>
        <tr><td style="padding:8px 12px;font-size:13px;color:#64748B;border-bottom:1px solid #F1F5F9;">Lun. 24 août</td><td style="padding:8px 12px;font-size:13px;color:#0F172A;border-bottom:1px solid #F1F5F9;">Plan d'Action #2 par email</td></tr>
        <tr><td style="padding:8px 12px;font-size:13px;color:#64748B;border-bottom:1px solid #F1F5F9;">5-6 septembre</td><td style="padding:8px 12px;font-size:13px;color:#0F172A;border-bottom:1px solid #F1F5F9;">Sessions 4 & 5 — Analyse technique (2×3H)</td></tr>
        <tr><td style="padding:8px 12px;font-size:13px;color:#64748B;border-bottom:1px solid #F1F5F9;">Lun. 7 septembre</td><td style="padding:8px 12px;font-size:13px;color:#0F172A;border-bottom:1px solid #F1F5F9;">Plan d'Action #3 par email</td></tr>
        <tr><td style="padding:8px 12px;font-size:13px;color:#64748B;border-bottom:1px solid #F1F5F9;">Mar. 8 septembre</td><td style="padding:8px 12px;font-size:13px;color:#0F172A;border-bottom:1px solid #F1F5F9;">Accès Communauté + 1ère édition Deal Flow</td></tr>
        <tr><td style="padding:8px 12px;font-size:13px;color:#64748B;">Fin septembre</td><td style="padding:8px 12px;font-size:13px;color:#0F172A;">Certificat Investisseur BRVM Niveau 1</td></tr>
      </table>`,
    learning: [
      'S1 : Comprendre la BRVM, ses acteurs et ses mécanismes',
      'S2 & S3 : Lire et analyser les états financiers des entreprises cotées',
      'S4 & S5 : Maîtriser les graphiques, patterns et timing d\'entrée',
      'Deal Flow : analyses BRVM exclusives chaque semaine pendant 3 mois',
      'Certificat nominatif, horodaté et vérifiable par QR code — partageable sur LinkedIn',
    ],
    signoff: 'Bienvenue dans le Parcours,',
    amount: packAmount,
  };
}

export async function sendWebinarConfirmationEmail({
  email,
  firstName,
  webinarId,
  earlyBird,
  registrationId,
  pack,
}: WebinarConfirmationParams): Promise<void> {
  const name = firstName || 'Investisseur';
  const cfg = getWebinarCfg(webinarId, earlyBird, pack);
  const ref = `AFB-WEB-${registrationId.slice(-8).toUpperCase()}`;

  const learningRows = cfg.learning
    .map(
      (item) =>
        `<tr><td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6;">• ${item}</td></tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${cfg.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

  <span style="display:none;max-height:0;overflow:hidden;">${cfg.preheader} &#847;&zwnj;&nbsp;&#847;</span>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F5F9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Logo header -->
          <tr>
            <td style="background-color:#FFFFFF;border-radius:16px 16px 0 0;padding:24px 40px 20px;border-bottom:1px solid #E2E8F0;text-align:center;">
              <span style="font-size:26px;font-weight:900;color:#1D4ED8;letter-spacing:-0.5px;">AFRI</span><span style="font-size:26px;font-weight:900;color:#F97316;">BOURSE</span>
              <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;letter-spacing:1px;text-transform:uppercase;">Formations & Webinaires</p>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background:${cfg.heroGradient};padding:40px 40px 36px;text-align:center;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">${cfg.heroLabel}</p>
              <h1 style="margin:0 0 14px;font-size:30px;font-weight:900;color:#FFFFFF;line-height:1.2;">${cfg.heroTitle}</h1>
              <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.6;max-width:440px;margin-left:auto;margin-right:auto;">${cfg.heroSub}</p>
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);border-radius:100px;padding:8px 20px;">
                    <span style="font-size:13px;font-weight:700;color:#FFFFFF;">Tarif réservé : ${cfg.amount}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#FFFFFF;padding:36px 40px;">

              <p style="margin:0 0 20px;font-size:15px;color:#374151;font-weight:600;">Bonjour ${name},</p>
              <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">${cfg.intro}</p>

              <!-- Session recap -->
              <h2 style="margin:0 0 16px;font-size:17px;font-weight:800;color:#0F172A;border-left:4px solid ${cfg.accentColor};padding-left:12px;">📅 Votre session — Récapitulatif</h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                ${cfg.recap}
                <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;width:40%;">Tarif réservé</td><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:${cfg.accentColor};font-weight:700;">${cfg.amount}</td></tr>
                <tr><td style="padding:10px 0;font-size:14px;color:#64748B;">Référence</td><td style="padding:10px 0;font-size:14px;color:#0F172A;font-weight:600;font-family:monospace;">${ref}</td></tr>
              </table>

              <!-- Webinar link notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background-color:#FEF3C7;border-radius:10px;border:1px solid #FDE68A;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:14px;color:#92400E;font-weight:600;">🔗 Votre lien de connexion</p>
                    <p style="margin:6px 0 0;font-size:13px;color:#92400E;line-height:1.6;">Il vous sera envoyé par email <strong>48h avant la session</strong>. Gardez un œil sur votre boîte de réception.</p>
                  </td>
                </tr>
              </table>

              <!-- Preparation -->
              <h2 style="margin:28px 0 14px;font-size:17px;font-weight:800;color:#0F172A;border-left:4px solid ${cfg.accentColor};padding-left:12px;">🎯 Comment préparer votre session</h2>
              ${cfg.prep}

              <!-- After -->
              <h2 style="margin:28px 0 14px;font-size:17px;font-weight:800;color:#0F172A;border-left:4px solid ${cfg.accentColor};padding-left:12px;">📦 Ce qui arrive après la session</h2>
              ${cfg.after}

              <!-- Learning -->
              <h2 style="margin:28px 0 14px;font-size:17px;font-weight:800;color:#0F172A;border-left:4px solid ${cfg.accentColor};padding-left:12px;">🧠 Ce que vous allez apprendre</h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${cfg.accentLight};border:1px solid ${cfg.accentBorder};border-radius:10px;padding:4px;">
                <tr><td style="padding:12px 16px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${learningRows}
                  </table>
                </td></tr>
              </table>

              <!-- Guarantee -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;background-color:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:14px;color:#065F46;font-weight:700;">🛡️ Garantie satisfaction</p>
                    <p style="margin:0;font-size:13px;color:#065F46;line-height:1.6;">Si le webinaire ne répond pas à vos attentes, on vous rembourse. Sans condition, sans justificatif, en 48h.</p>
                  </td>
                </tr>
              </table>

              <!-- Signoff -->
              <p style="margin:32px 0 6px;font-size:14px;color:#374151;">${cfg.signoff}</p>
              <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#0F172A;">SIMBA</p>
              <p style="margin:0;font-size:13px;color:#64748B;">Fondateur — Afribourse</p>

              <p style="margin:24px 0 0;font-size:13px;color:#94A3B8;border-top:1px solid #F1F5F9;padding-top:20px;">Une question ? Répondez directement à cet email ou contactez-nous sur WhatsApp. Nous répondons sous 24h.</p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0F172A;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#94A3B8;">© 2026 AfriBourse · Plateforme d'investissement BRVM</p>
              <p style="margin:0;font-size:12px;color:#64748B;">Vous recevez cet email suite à votre inscription à un webinaire Afribourse.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Bonjour ${name},\n\n${cfg.intro}\n\nTarif réservé : ${cfg.amount}\nRéférence : ${ref}\n\nVotre lien de connexion vous sera envoyé 48h avant la session.\n\n${cfg.signoff}\nSIMBA — Fondateur, Afribourse`;

  await sendEmail({ to: email, subject: cfg.subject, html, text });
}

// ─── Webinar payment confirmation email ──────────────────────────────────────

interface WebinarPaymentConfirmParams {
  email: string;
  firstName: string;
  webinarId: string;
  amount: string;
  currency: string;
  title?: string; // surcharge du titre (ex: nom du pack choisi)
}

const WEBINAR_LABELS: Record<string, { title: string; date: string; accentColor: string }> = {
  'w1-fondamentaux':             { title: 'Fondamentaux de la bourse',        date: '23 mai 2026',          accentColor: '#1D4ED8' },
  'w2-fondamentale':             { title: 'Analyse fondamentale',              date: '30–31 mai 2026',       accentColor: '#059669' },
  'w3-technique':                { title: 'Analyse technique',                 date: '6–7 juin 2026',        accentColor: '#EA580C' },
  'w1-fondamentaux-juin':        { title: 'Fondamentaux de la bourse',              date: '18 juillet 2026',     accentColor: '#1D4ED8' },
  'w2-fondamentale-juin':        { title: 'Analyse fondamentale',                   date: '1–2 août 2026',       accentColor: '#059669' },
  'w2a-fondamentale-juin':       { title: 'Analyse fondamentale — Partie 1',        date: '1 août 2026',         accentColor: '#059669' },
  'w2b-fondamentale-juin':       { title: 'Analyse fondamentale — Partie 2',        date: '2 août 2026',         accentColor: '#059669' },
  'w3-technique-juin':           { title: 'Analyse technique',                       date: '15–16 août 2026',     accentColor: '#EA580C' },
  'w3a-technique-juin':          { title: 'Analyse technique — Partie 1',            date: '15 août 2026',        accentColor: '#EA580C' },
  'w3b-technique-juin':          { title: 'Analyse technique — Partie 2',            date: '16 août 2026',        accentColor: '#EA580C' },
  'pack-parcours-investisseur':  { title: 'Pack Parcours Investisseur BRVM',         date: '8 août → 6 septembre', accentColor: '#1D4ED8' },
};

export async function sendWebinarPaymentConfirmEmail({
  email, firstName, webinarId, amount, currency, title,
}: WebinarPaymentConfirmParams): Promise<void> {
  const name = firstName || 'Investisseur';
  const label = WEBINAR_LABELS[webinarId] ?? { title: webinarId, date: '—', accentColor: '#1D4ED8' };
  const info = { ...label, title: title || label.title };
  const amountFmt = `${parseInt(amount).toLocaleString('fr-FR')} ${currency}`;
  // Nombre de sessions/heures selon le pack (si l'achat est un pack)
  const packSessions: Record<string, string> = {
    'Pack Starter': '5 sessions live · 15h',
    'Pack Parcours': '7 sessions live · 21h',
    'Pack Investisseur': '9 sessions live · 27h',
  };
  const sessionsLine = title && packSessions[title] ? packSessions[title] : null;
  const sessionsRow = sessionsLine
    ? `<tr><td style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Formule</td><td style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">${sessionsLine}</td></tr>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>✅ Paiement confirmé — ${info.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">Votre place est sécurisée — le lien Zoom arrivera 48h avant &#847;&zwnj;&nbsp;</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5F9;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- Logo -->
        <tr><td style="background:#fff;border-radius:16px 16px 0 0;padding:24px 40px 20px;border-bottom:1px solid #E2E8F0;text-align:center;">
          <span style="font-size:26px;font-weight:900;color:#1D4ED8;">AFRI</span><span style="font-size:26px;font-weight:900;color:#F97316;">BOURSE</span>
          <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;letter-spacing:1px;text-transform:uppercase;">Formations & Webinaires</p>
        </td></tr>

        <!-- Hero vert -->
        <tr><td style="background:linear-gradient(135deg,#065F46 0%,#059669 100%);padding:40px;text-align:center;">
          <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
            <span style="font-size:32px;">✅</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#fff;">Paiement confirmé !</h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);">Votre place pour <strong>${info.title}</strong> est sécurisée.</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:36px 40px;">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;font-weight:600;">Bonjour ${name},</p>
          <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
            Votre paiement de <strong>${amountFmt}</strong> a bien été reçu. Votre inscription à <strong>${info.title}</strong> est maintenant confirmée.
          </p>

          <!-- Récap paiement -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;">Récapitulatif</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;width:45%;">Formule choisie</td>
                  <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">${info.title}</td>
                </tr>
                ${sessionsRow}
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#64748B;">Dates</td>
                  <td style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#0F172A;font-weight:600;">${info.date}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:14px;color:#64748B;">Montant payé</td>
                  <td style="padding:8px 0;font-size:14px;color:#059669;font-weight:700;">${amountFmt}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- Prochaines étapes -->
          <h2 style="margin:0 0 16px;font-size:16px;font-weight:800;color:#0F172A;border-left:4px solid ${info.accentColor};padding-left:12px;">📅 Prochaines étapes</h2>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#374151;">
                <strong style="color:${info.accentColor};">48h avant la session</strong><br>
                Vous recevrez votre lien Zoom par email et WhatsApp
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:14px;color:#374151;">
                <strong style="color:${info.accentColor};">Jour J</strong><br>
                Connectez-vous 5 minutes avant le début pour tester votre audio
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-size:14px;color:#374151;">
                <strong style="color:${info.accentColor};">Après la session</strong><br>
                Votre plan d'action personnalisé vous sera envoyé dans les 24h
              </td>
            </tr>
          </table>

          <!-- Note lien Zoom -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;margin-bottom:8px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:14px;color:#92400E;font-weight:700;">🔗 Votre lien de connexion Zoom</p>
              <p style="margin:0;font-size:13px;color:#92400E;line-height:1.6;">
                Il vous sera envoyé <strong>48h avant la session</strong> sur cet email et sur votre WhatsApp. Vérifiez vos spams si vous ne le recevez pas.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F8FAFC;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
          <p style="margin:0 0 4px;font-size:12px;color:#94A3B8;">Questions ? Répondez à cet email ou contactez-nous sur WhatsApp.</p>
          <p style="margin:0;font-size:12px;color:#CBD5E1;">© 2026 AfriBourse · africbourse.com</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `✅ Paiement confirmé — ${info.title} (${info.date})`,
    html,
    text: `Bonjour ${name}, votre paiement de ${amountFmt} pour ${info.title} est confirmé. Votre lien Zoom arrivera 48h avant la session.`,
  });
}

// ─── Paiement échelonné — email de progression (mensualité réglée) ────────────

interface InstallmentProgressParams {
  email: string;
  firstName: string;
  paidIndex: number;   // nombre de mensualités déjà payées
  total: number;       // nombre total de mensualités
  amountPaid: number;  // cumul payé
  nextAmount: number;  // montant de la prochaine mensualité
  nextDueAt: Date;     // échéance suivante
  payUrl: string;      // lien de paiement de la mensualité suivante
  totalAmount?: number; // montant total du pack
  planName?: string;    // nom du pack (ex: "Pack Parcours")
}

export async function sendInstallmentProgressEmail({
  email, firstName, paidIndex, total, amountPaid, nextAmount, nextDueAt, payUrl, totalAmount, planName,
}: InstallmentProgressParams): Promise<void> {
  const name = firstName || 'Investisseur';
  const dueFmt = nextDueAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const nextFmt = `${nextAmount.toLocaleString('fr-FR')} XOF`;
  const paidFmt = `${amountPaid.toLocaleString('fr-FR')} XOF`;
  const planTitle = planName || 'Pack Parcours Investisseur';
  const totalFmt = `${(totalAmount ?? 35000).toLocaleString('fr-FR')} XOF`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Mensualité ${paidIndex}/${total} reçue — Pack Parcours Investisseur</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">Mensualité ${paidIndex}/${total} reçue — prochaine échéance le ${dueFmt} &#847;&zwnj;&nbsp;</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5F9;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <tr><td style="background:#fff;border-radius:16px 16px 0 0;padding:24px 40px 20px;border-bottom:1px solid #E2E8F0;text-align:center;">
          <span style="font-size:26px;font-weight:900;color:#1D4ED8;">AFRI</span><span style="font-size:26px;font-weight:900;color:#F97316;">BOURSE</span>
          <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;letter-spacing:1px;text-transform:uppercase;">Pack Parcours Investisseur</p>
        </td></tr>

        <tr><td style="background:linear-gradient(135deg,#1E3A8A 0%,#3730A3 100%);padding:36px 40px;text-align:center;">
          <div style="width:60px;height:60px;background:rgba(255,255,255,0.18);border-radius:50%;margin:0 auto 14px;line-height:60px;">
            <span style="font-size:28px;">💸</span>
          </div>
          <h1 style="margin:0 0 6px;font-size:23px;font-weight:900;color:#fff;">Mensualité ${paidIndex}/${total} reçue !</h1>
          <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">Merci — votre accès au parcours reste actif.</p>
        </td></tr>

        <tr><td style="background:#fff;padding:36px 40px;">
          <p style="margin:0 0 18px;font-size:15px;color:#374151;font-weight:600;">Bonjour ${name},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
            Nous avons bien reçu votre mensualité. Vous avez réglé <strong>${paidFmt}</strong> sur les ${totalFmt} du ${planTitle}.
          </p>

          <!-- Prochaine échéance -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:1px;">Prochaine mensualité</p>
              <p style="margin:0 0 2px;font-size:24px;font-weight:900;color:#0F172A;">${nextFmt}</p>
              <p style="margin:0;font-size:14px;color:#64748B;">À régler avant le <strong>${dueFmt}</strong></p>
            </td></tr>
          </table>

          <!-- CTA payer -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr><td align="center">
              <a href="${payUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563EB 0%,#4F46E5 100%);color:#fff;font-size:15px;font-weight:800;text-decoration:none;padding:15px 36px;border-radius:12px;">
                Payer ma mensualité maintenant →
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;text-align:center;">
            Vous pouvez aussi régler depuis la page Webinaires une fois connecté.<br>
            Lien : <a href="${payUrl}" style="color:#2563EB;">${payUrl}</a>
          </p>
        </td></tr>

        <tr><td style="background:#F8FAFC;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
          <p style="margin:0 0 4px;font-size:12px;color:#94A3B8;">Questions ? Répondez à cet email ou contactez-nous sur WhatsApp.</p>
          <p style="margin:0;font-size:12px;color:#CBD5E1;">© 2026 AfriBourse · africbourse.com</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `💸 Mensualité ${paidIndex}/${total} reçue — prochaine échéance le ${dueFmt}`,
    html,
    text: `Bonjour ${name}, mensualité ${paidIndex}/${total} reçue (${paidFmt} payés). Prochaine mensualité : ${nextFmt} avant le ${dueFmt}. Payez ici : ${payUrl}`,
  });
}

// ─── Pré-inscription cohorte (liste d'attente, gratuit) ──────────────────────

interface CohortPreregistrationParams {
  email: string;
  firstName: string;
  pack?: string | null;
}

// Prix par pack (good-better-best) — partagé par les emails
const PACK_TIER_PRICES: Record<string, { name: string; full: number; cohort: number }> = {
  starter:      { name: 'Pack Starter',      full: 70000,  cohort: 70000 },
  parcours:     { name: 'Pack Parcours',     full: 100000, cohort: 100000 },
  investisseur: { name: 'Pack Investisseur', full: 150000, cohort: 150000 },
};
function fmtXof(n: number) { return n.toLocaleString('fr-FR') + ' XOF'; }

export async function sendCohortPreregistrationEmail({
  email, firstName, pack,
}: CohortPreregistrationParams): Promise<void> {
  const name = firstName || 'Investisseur';
  const base = process.env.FRONTEND_URL ?? 'https://www.africbourse.com';
  const payUrl = `${base}/parcours/cohorte-juillet${pack ? `?pack=${pack}` : ''}`;
  const tier = pack && PACK_TIER_PRICES[pack] ? PACK_TIER_PRICES[pack] : null;
  const packTitle = tier ? tier.name : 'Parcours Investisseur BRVM';
  const priceLine = tier ? `<strong style="color:#0F172A;font-size:20px;">${fmtXof(tier.full)}</strong>` : '';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Pré-inscription reçue — Cohorte Août 2026</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">Pré-inscription reçue — finalisez votre paiement pour confirmer votre place &#847;&zwnj;&nbsp;</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5F9;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <tr><td style="background:#fff;border-radius:16px 16px 0 0;padding:24px 40px 20px;border-bottom:1px solid #E2E8F0;text-align:center;">
          <span style="font-size:26px;font-weight:900;color:#1D4ED8;">AFRI</span><span style="font-size:26px;font-weight:900;color:#F97316;">BOURSE</span>
          <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;letter-spacing:1px;text-transform:uppercase;">Parcours Investisseur · Cohorte Août 2026</p>
        </td></tr>

        <tr><td style="background:linear-gradient(135deg,#1E3A8A 0%,#3730A3 100%);padding:40px;text-align:center;">
          <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;line-height:64px;">
            <span style="font-size:32px;">📝</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#fff;">Pré-inscription reçue !</h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);">Dernière étape : finalisez votre paiement pour confirmer votre place.</p>
        </td></tr>

        <tr><td style="background:#fff;padding:36px 40px;">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;font-weight:600;">Bonjour ${name},</p>
          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
            Votre pré-inscription au <strong>${packTitle}</strong> (cohorte d'août) est bien enregistrée.
            <strong>Votre place n'est pas encore confirmée</strong> — il ne reste plus qu'à régler votre paiement.
            Vous recevrez ensuite votre email de confirmation d'inscription avec tous les détails.
          </p>

          ${tier ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:18px 22px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;">${tier.name}</p>
              <p style="margin:0;font-size:15px;color:#374151;">${priceLine}</p>
            </td></tr>
          </table>` : ''}

          <!-- CTA Finaliser le paiement -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr><td align="center">
              <a href="${payUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563EB 0%,#4F46E5 100%);color:#fff;font-size:15px;font-weight:800;text-decoration:none;padding:15px 36px;border-radius:12px;">
                💳 Finaliser mon paiement →
              </a>
              <p style="margin:8px 0 0;font-size:12px;color:#94A3B8;">Paiement en 1 fois ou en 3 fois — Mobile Money sécurisé.</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1D4ED8;text-transform:uppercase;letter-spacing:1px;">Programme — cohorte août</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:6px 0;font-size:14px;color:#374151;">📅 <strong>8 août</strong> — S1 · Fondamentaux de la bourse</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#374151;">📅 <strong>22–23 août</strong> — S2 & S3 · Analyse fondamentale</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#374151;">📅 <strong>5–6 septembre</strong> — S4 & S5 · Analyse technique</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#374151;">🎓 Certificat « Investisseur BRVM — Niveau 1 »</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#065F46;">📍 <strong>Présentiel</strong> en Côte d'Ivoire, au Bénin et au Sénégal — en ligne ailleurs</td></tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;">
            Les places sont limitées à 50 par session. En finalisant rapidement, vous sécurisez la vôtre.
          </p>
        </td></tr>

        <tr><td style="background:#F8FAFC;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
          <p style="margin:0 0 4px;font-size:12px;color:#94A3B8;">Questions ? Répondez à cet email ou contactez-nous sur WhatsApp.</p>
          <p style="margin:0;font-size:12px;color:#CBD5E1;">© 2026 AfriBourse · africbourse.com</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `📝 Pré-inscription reçue — finalisez votre paiement (${packTitle})`,
    html,
    text: `Bonjour ${name}, votre pré-inscription au ${packTitle} (cohorte août) est enregistrée. Votre place n'est pas encore confirmée — finalisez votre paiement ici : ${payUrl}. Vous recevrez ensuite votre confirmation d'inscription. Programme : 8 août (Fondamentaux), 22-23 août (Analyse fondamentale), 5-6 septembre (Analyse technique). Sessions en présentiel en Côte d'Ivoire, au Bénin et au Sénégal — en ligne (visio) pour les autres pays.`,
  });
}

// ─── Webinar zoom link email ──────────────────────────────────────────────────

interface WebinarZoomLinkParams {
  email: string;
  firstName: string;
  webinarId: string;
  zoomUrl: string;
  sessionDate: string; // ex: "samedi 23 mai à 9h00"
}

export async function sendWebinarZoomLinkEmail({
  email, firstName, webinarId, zoomUrl, sessionDate,
}: WebinarZoomLinkParams): Promise<void> {
  const name = firstName || 'Investisseur';
  const info = WEBINAR_LABELS[webinarId] ?? { title: webinarId, date: sessionDate, accentColor: '#1D4ED8' };

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>🔗 Votre lien Zoom — ${info.title}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">Dans 48h — votre lien de connexion est prêt &#847;&zwnj;&nbsp;</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5F9;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <tr><td style="background:#fff;border-radius:16px 16px 0 0;padding:24px 40px 20px;border-bottom:1px solid #E2E8F0;text-align:center;">
          <span style="font-size:26px;font-weight:900;color:#1D4ED8;">AFRI</span><span style="font-size:26px;font-weight:900;color:#F97316;">BOURSE</span>
        </td></tr>

        <tr><td style="background:linear-gradient(135deg,${info.accentColor} 0%,#4338CA 100%);padding:40px;text-align:center;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">Webinaire dans 48h</p>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#fff;">${info.title}</h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);">${sessionDate}</p>
        </td></tr>

        <tr><td style="background:#fff;padding:36px 40px;">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;font-weight:600;">Bonjour ${name},</p>
          <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">
            La session <strong>${info.title}</strong> commence <strong>${sessionDate}</strong>. Voici votre lien de connexion Zoom :
          </p>

          <!-- CTA Zoom -->
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
            <tr><td style="background:${info.accentColor};border-radius:12px;padding:16px 32px;text-align:center;">
              <a href="${zoomUrl}" style="font-size:16px;font-weight:800;color:#fff;text-decoration:none;">🎥 Rejoindre le webinaire Zoom</a>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:13px;color:#64748B;text-align:center;">Ou copiez ce lien : <a href="${zoomUrl}" style="color:${info.accentColor};word-break:break-all;">${zoomUrl}</a></p>

          <!-- Checklist préparation -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;margin-top:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0F172A;">✅ Checklist avant la session</p>
              <p style="margin:0 0 8px;font-size:14px;color:#374151;">📱 Testez votre micro et votre caméra</p>
              <p style="margin:0 0 8px;font-size:14px;color:#374151;">🌐 Connexion internet stable recommandée</p>
              <p style="margin:0 0 8px;font-size:14px;color:#374151;">📓 Ayez un carnet ou doc prêt pour noter</p>
              <p style="margin:0;font-size:14px;color:#374151;">⏰ Connectez-vous 5 min avant pour les tests</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="background:#F8FAFC;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
          <p style="margin:0;font-size:12px;color:#94A3B8;">Problème de connexion ? Répondez à cet email — on vous aide.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `🔗 Votre lien Zoom — ${info.title} · ${sessionDate}`,
    html,
    text: `Bonjour ${name}, votre lien Zoom pour ${info.title} (${sessionDate}) : ${zoomUrl}`,
  });
}

export async function sendFailedPaymentReengagementEmail({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const firstName = (name || 'Investisseur').split(' ')[0];
  const subscriptionUrl = 'https://www.africbourse.com/subscriptions';

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tu avais commencé quelque chose sur Afribourse</title>
    </head>
    <body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

      <span style="display:none;max-height:0;overflow:hidden;">Moitié prix · 4 950 XOF/mois · Sans engagement &#847;&zwnj;&nbsp;&#847;</span>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F5F9;">
        <tr>
          <td align="center" style="padding:32px 16px;">

            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

              <!-- Logo -->
              <tr>
                <td style="background-color:#FFFFFF;border-radius:16px 16px 0 0;padding:28px 40px 20px;border-bottom:1px solid #E2E8F0;text-align:center;">
                  <span style="font-size:26px;font-weight:900;color:#1D4ED8;letter-spacing:-0.5px;">AFRI</span><span style="font-size:26px;font-weight:900;color:#F97316;">BOURSE</span>
                </td>
              </tr>

              <!-- Hero -->
              <tr>
                <td style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 60%,#1D4ED8 100%);padding:36px 40px;text-align:center;">
                  <h1 style="margin:0 0 10px;font-size:24px;font-weight:900;color:#FFFFFF;line-height:1.3;">Tu avais commencé<br>quelque chose.</h1>
                  <p style="margin:0;font-size:15px;color:#93C5FD;line-height:1.6;">On te réserve la place — à moitié prix.</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="background-color:#FFFFFF;padding:36px 40px;">

                  <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.7;">Bonjour ${firstName},</p>

                  <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">Il y a quelques semaines, tu as cliqué pour passer à Investisseur+.</p>

                  <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">Le paiement n'est pas passé. Je ne sais pas si c'est un problème technique, un moment d'hésitation, ou simplement le mauvais moment — et je ne suis pas là pour te juger.</p>

                  <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">Mais je pense que <strong>l'intérêt était réel</strong>. Sinon tu n'aurais pas cliqué.</p>

                  <!-- Offer box -->
                  <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;padding:24px 28px;margin-bottom:28px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#C2410C;letter-spacing:1px;text-transform:uppercase;">Proposition simple</p>
                    <p style="margin:0 0 4px;font-size:28px;font-weight:900;color:#EA580C;">4 950 XOF<span style="font-size:16px;font-weight:600;">/mois</span></p>
                    <p style="margin:0;font-size:14px;color:#9A3412;">pendant 3 mois — <span style="text-decoration:line-through;">9 900 XOF</span> · sans engagement · tu annules quand tu veux</p>
                  </div>

                  <!-- Features -->
                  <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#0F172A;">Ce que tu débloques :</p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
                    <tr><td style="padding:5px 0;font-size:14px;color:#374151;line-height:1.6;">— Le <strong>Score de confiance hybride</strong> sur chaque action BRVM</td></tr>
                    <tr><td style="padding:5px 0;font-size:14px;color:#374151;line-height:1.6;">— <strong>SIMBA sans limite</strong> — ton coach IA disponible à tout moment</td></tr>
                    <tr><td style="padding:5px 0;font-size:14px;color:#374151;line-height:1.6;">— <strong>Time Machine</strong> : revivez la crise 2008 avec de l'argent virtuel</td></tr>
                    <tr><td style="padding:5px 0;font-size:14px;color:#374151;line-height:1.6;">— Les <strong>analyses SIMBA approfondies</strong> sur n'importe quel titre</td></tr>
                  </table>

                  <!-- CTA -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
                    <tr>
                      <td align="center">
                        <a href="${subscriptionUrl}" style="display:inline-block;padding:16px 40px;background-color:#F97316;color:#FFFFFF;text-decoration:none;border-radius:10px;font-size:16px;font-weight:800;">
                          Activer maintenant →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0 0 28px;font-size:14px;color:#6B7280;text-align:center;">Si quelque chose a bloqué techniquement ou si tu as une question,<br>réponds directement à cet email. Je lis tous les messages.</p>

                  <p style="margin:0;font-size:15px;color:#374151;">Curtis Zirignon<br><span style="color:#6B7280;font-size:13px;">Fondateur, Afribourse</span></p>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#F8FAFC;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
                  <p style="margin:0;font-size:12px;color:#9CA3AF;">Afribourse · Marchés financiers africains<br>
                  <a href="https://www.africbourse.com/unsubscribe" style="color:#9CA3AF;">Se désabonner</a></p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;

  const text = `Bonjour ${firstName},

Il y a quelques semaines, tu as cliqué pour passer à Investisseur+.

Le paiement n'est pas passé. Je ne sais pas si c'est un problème technique, un moment d'hésitation, ou simplement le mauvais moment — et je ne suis pas là pour te juger.

Mais je pense que l'intérêt était réel. Sinon tu n'aurais pas cliqué.

Alors voici une proposition simple : Investisseur+ à 4 950 XOF/mois pendant 3 mois, moitié prix. Pas d'engagement, tu annules quand tu veux.

Ce que tu débloques :
— Le Score de confiance hybride sur chaque action BRVM
— SIMBA sans limite — ton coach IA disponible à tout moment
— Time Machine : revivez la crise 2008 avec de l'argent virtuel
— Les analyses SIMBA approfondies sur n'importe quel titre

→ ${subscriptionUrl}

Si quelque chose a bloqué techniquement ou si tu as une question, réponds directement à cet email. Je lis tous les messages.

Curtis Zirignon
Fondateur, Afribourse`;

  await sendEmail({
    to: email,
    subject: 'Tu avais commencé quelque chose sur Afribourse',
    html,
    text,
  });
}

export async function sendInvestisseurPlusPromoEmail({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const firstName = (name || 'Investisseur').split(' ')[0];
  const subscriptionUrl = 'https://www.africbourse.com/subscriptions';

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${firstName}, tu mérites Investisseur+ — voici 50% de réduction</title>
    </head>
    <body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

      <span style="display:none;max-height:0;overflow:hidden;">4 950 XOF/mois pendant 3 mois — offre réservée, sans engagement &#847;&zwnj;&nbsp;&#847;</span>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F5F9;">
        <tr>
          <td align="center" style="padding:32px 16px;">

            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

              <!-- Logo -->
              <tr>
                <td style="background-color:#FFFFFF;border-radius:16px 16px 0 0;padding:28px 40px 20px;border-bottom:1px solid #E2E8F0;text-align:center;">
                  <span style="font-size:26px;font-weight:900;color:#1D4ED8;letter-spacing:-0.5px;">AFRI</span><span style="font-size:26px;font-weight:900;color:#F97316;">BOURSE</span>
                </td>
              </tr>

              <!-- Hero -->
              <tr>
                <td style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 60%,#1D4ED8 100%);padding:40px 40px 36px;text-align:center;">
                  <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#BFDBFE;letter-spacing:2px;text-transform:uppercase;">Offre personnelle · Durée limitée</p>
                  <h1 style="margin:0 0 12px;font-size:27px;font-weight:900;color:#FFFFFF;line-height:1.3;">${firstName}, tu mérites<br>Investisseur+</h1>
                  <p style="margin:0 0 20px;font-size:15px;color:#93C5FD;line-height:1.6;">50% de réduction pendant 3 mois.<br>Sans engagement. Tu annules quand tu veux.</p>
                  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                    <tr>
                      <td style="background-color:#F97316;border-radius:100px;padding:10px 28px;">
                        <span style="font-size:18px;font-weight:900;color:#FFFFFF;">4 950 XOF<span style="font-size:13px;font-weight:600;">/mois</span></span>
                      </td>
                      <td style="padding:0 12px;">
                        <span style="font-size:14px;color:#BFDBFE;text-decoration:line-through;">9 900 XOF/mois</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="background-color:#FFFFFF;padding:36px 40px;">

                  <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.7;">Bonjour ${firstName},</p>

                  <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">Il y a un groupe d'investisseurs BRVM qui prend des décisions différemment — avec des données, pas des intuitions. Qui comprend pourquoi une action monte avant que tout le monde en parle. Qui sait lire un bilan, analyser un secteur, et garder la tête froide quand le marché bouge.</p>

                  <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;"><strong>Tu en fais déjà partie dans ta tête.</strong> Tu l'as prouvé en utilisant Afribourse.</p>

                  <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">Il te manque juste les outils que ce groupe utilise.</p>

                  <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">C'est pour ça que je t'écris personnellement aujourd'hui.</p>

                  <!-- Features -->
                  <div style="background:#F8FAFC;border-radius:12px;padding:24px 28px;margin-bottom:28px;">
                    <p style="margin:0 0 16px;font-size:15px;font-weight:800;color:#0F172A;">Investisseur+ t'ouvre accès à ce que les investisseurs sérieux utilisent sur la BRVM :</p>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr><td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6;">— Le <strong>Score de confiance hybride</strong> sur chaque action</td></tr>
                      <tr><td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6;">— <strong>SIMBA</strong>, ton coach IA disponible à tout moment pour analyser, expliquer, décider</td></tr>
                      <tr><td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6;">— <strong>Time Machine</strong> : revivez les grandes crises et hausses historiques de la BRVM avec de l'argent virtuel — et voyez si vous auriez pris les bonnes décisions</td></tr>
                      <tr><td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6;">— Les <strong>analyses SIMBA approfondies</strong> sur n'importe quel titre coté</td></tr>
                    </table>
                  </div>

                  <!-- CTA -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
                    <tr>
                      <td align="center">
                        <a href="${subscriptionUrl}" style="display:inline-block;padding:16px 40px;background-color:#F97316;color:#FFFFFF;text-decoration:none;border-radius:10px;font-size:16px;font-weight:800;">
                          Activer Investisseur+ →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0 0 28px;font-size:14px;color:#6B7280;text-align:center;">Si le paiement ne passe pas ou si tu as la moindre question,<br>réponds directement à cet email. Je lis tous les messages.</p>

                  <p style="margin:0;font-size:15px;color:#374151;">Curtis Zirignon<br><span style="color:#6B7280;font-size:13px;">Fondateur, Afribourse</span></p>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#F8FAFC;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
                  <p style="margin:0;font-size:12px;color:#9CA3AF;">Afribourse · Marchés financiers africains<br>
                  <a href="https://www.africbourse.com/unsubscribe" style="color:#9CA3AF;">Se désabonner</a></p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;

  const text = `Bonjour ${firstName},

Il y a un groupe d'investisseurs BRVM qui prend des décisions différemment — avec des données, pas des intuitions. Qui comprend pourquoi une action monte avant que tout le monde en parle. Qui sait lire un bilan, analyser un secteur, et garder la tête froide quand le marché bouge.

Tu en fais déjà partie dans ta tête. Tu l'as prouvé en utilisant Afribourse.
Il te manque juste les outils que ce groupe utilise.

C'est pour ça que je t'écris personnellement aujourd'hui.

Investisseur+ t'ouvre accès à ce que les investisseurs sérieux utilisent sur la BRVM :
— Le Score de confiance hybride sur chaque action
— SIMBA, ton coach IA disponible à tout moment pour analyser, expliquer, décider
— Time Machine : revivez les grandes crises et hausses historiques de la BRVM avec de l'argent virtuel — et voyez si vous auriez pris les bonnes décisions
— Les analyses SIMBA approfondies sur n'importe quel titre coté

Normalement : 9 900 XOF/mois.
Pour toi, aujourd'hui : 4 950 XOF/mois pendant 3 mois. Sans engagement. Tu annules quand tu veux.

→ ${subscriptionUrl}

Si le paiement ne passe pas ou si tu as la moindre question, réponds directement à cet email. Je lis tous les messages.

Curtis Zirignon
Fondateur, Afribourse`;

  await sendEmail({
    to: email,
    subject: `${firstName}, tu mérites Investisseur+ — voici 50% de réduction`,
    html,
    text,
  });
}

export async function sendCertificateEmail({
  email,
  name,
  moduleName,
  webinarDate,
  certificateUrl,
}: {
  email: string;
  name: string;
  moduleName: string;
  webinarDate: Date;
  certificateUrl: string;
}): Promise<void> {
  const firstName = (name || 'Apprenant').split(' ')[0];
  const dateStr = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(webinarDate);

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre certificat Afribourse est prêt</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
    .container { background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-radius: 12px; padding: 40px; color: #f1f5f9; }
    .medal { text-align: center; font-size: 56px; margin-bottom: 8px; }
    .brand { text-align: center; font-size: 12px; letter-spacing: 3px; color: #94a3b8; margin-bottom: 24px; }
    h1 { text-align: center; font-size: 24px; color: #F59E0B; margin: 0 0 8px; }
    .subtitle { text-align: center; color: #94a3b8; font-size: 14px; margin-bottom: 32px; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid #334155; border-radius: 8px; padding: 24px; margin: 24px 0; }
    .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 4px; }
    .card-value { font-size: 18px; color: #f1f5f9; font-weight: 600; }
    .cta { display: block; background: linear-gradient(135deg, #D97706, #F59E0B); color: #0F172A !important; text-decoration: none; text-align: center; padding: 16px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 32px 0; }
    .footer { text-align: center; font-size: 12px; color: #475569; margin-top: 32px; }
    .divider { border: none; border-top: 1px solid #334155; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="medal">🏅</div>
    <div class="brand">ACADÉMIE AFRIBOURSE</div>
    <h1>Félicitations, ${firstName} !</h1>
    <div class="subtitle">Votre certificat de participation est prêt</div>
    <hr class="divider">
    <div class="card">
      <div class="card-label">Webinaire complété</div>
      <div class="card-value">${moduleName}</div>
      <div style="margin-top: 12px;">
        <div class="card-label">Date</div>
        <div style="color: #94a3b8; font-size: 14px;">${dateStr}</div>
      </div>
    </div>
    <p style="color: #94a3b8; font-size: 14px; text-align: center;">
      Vous pouvez désormais télécharger votre certificat et le partager sur LinkedIn, WhatsApp et vos autres réseaux.
    </p>
    <a href="${certificateUrl}" class="cta">🎓 Voir et télécharger mon certificat</a>
    <hr class="divider">
    <div class="footer">
      <p>Continuez votre apprentissage sur <a href="https://africbourse.com" style="color: #F59E0B;">africbourse.com</a></p>
      <p style="color: #334155; font-size: 11px; margin-top: 16px;">© Afribourse Académie · BRVM</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Félicitations ${firstName} ! Votre certificat "${moduleName}" est prêt. Téléchargez-le ici : ${certificateUrl}`;

  await sendEmail({
    to: email,
    subject: `🏅 Votre certificat Afribourse est prêt, ${firstName} !`,
    html,
    text,
  });
}

export async function sendPackParcoursBRVMEmail({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const firstName = (name || 'Investisseur').split(' ')[0];
  const webinarUrl = 'https://www.africbourse.com/webinaires';

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🎓 Votre dernière chance d'entrer dans le Parcours Investisseur BRVM</title>
    </head>
    <body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

      <span style="display:none;max-height:0;overflow:hidden;">25 000 XOF · 5 livrables · 1 semaine Investisseur+ offerte — jusqu'à ce soir &#847;&zwnj;&nbsp;&#847;</span>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F5F9;">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

              <!-- Logo -->
              <tr>
                <td style="background-color:#FFFFFF;border-radius:16px 16px 0 0;padding:28px 40px 20px;border-bottom:1px solid #E2E8F0;text-align:center;">
                  <span style="font-size:26px;font-weight:900;color:#1D4ED8;letter-spacing:-0.5px;">AFRI</span><span style="font-size:26px;font-weight:900;color:#F97316;">BOURSE</span>
                </td>
              </tr>

              <!-- Hero -->
              <tr>
                <td style="background:linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 50%,#4338CA 100%);padding:40px 40px 36px;text-align:center;">
                  <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#BFDBFE;letter-spacing:2px;text-transform:uppercase;">Formation Live · BRVM · Certification</p>
                  <h1 style="margin:0 0 12px;font-size:26px;font-weight:900;color:#FFFFFF;line-height:1.3;">🎓 Parcours Investisseur BRVM</h1>
                  <p style="margin:0 0 20px;font-size:15px;color:#BFDBFE;line-height:1.6;">3 sessions intensives · Experts BRVM · Certification officielle</p>
                  <!-- Price badge -->
                  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                    <tr>
                      <td style="background-color:#F97316;border-radius:100px;padding:10px 24px;text-align:center;">
                        <span style="font-size:22px;font-weight:900;color:#FFFFFF;">25 000 XOF</span>
                      </td>
                      <td style="padding:0 12px;">
                        <span style="font-size:14px;color:#BFDBFE;text-decoration:line-through;">35 000 XOF</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="background-color:#FFFFFF;padding:36px 40px;">

                  <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.7;">Bonjour ${firstName},</p>

                  <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">Vous êtes sur Afribourse depuis un moment.</p>
                  <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">Vous avez appris. Vous avez simulé. Vous avez regardé les marchés.</p>
                  <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;"><strong>Il manque une chose :</strong> passer à l'étape suivante avec des experts à vos côtés.</p>

                  <!-- Pack details -->
                  <div style="background:#F8FAFC;border-radius:12px;padding:24px 28px;margin-bottom:28px;">
                    <p style="margin:0 0 16px;font-size:15px;font-weight:800;color:#0F172A;">Ce que contient le Pack :</p>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr><td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6;">✓&nbsp;&nbsp;<strong>3 webinaires live</strong> — Fondamentaux · Analyse fondamentale · Analyse technique</td></tr>
                      <tr><td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6;">✓&nbsp;&nbsp;<strong>Communauté Afribourse</strong> — 3 mois d'accès</td></tr>
                      <tr><td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6;">✓&nbsp;&nbsp;<strong>3 Plans d'Action personnalisés</strong> — un après chaque session</td></tr>
                      <tr><td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6;">✓&nbsp;&nbsp;<strong>Deal Flow hebdomadaire</strong> — 12 analyses exclusives BRVM</td></tr>
                      <tr><td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.6;">✓&nbsp;&nbsp;<strong>Certificat « Investisseur BRVM — Niveau 1 »</strong></td></tr>
                      <tr>
                        <td style="padding:10px 0 6px;">
                          <span style="display:inline-block;background:#FEF3C7;border:1px solid #FDE68A;border-radius:6px;padding:6px 14px;font-size:13px;font-weight:700;color:#92400E;">🎁 BONUS : 1 semaine d'accès Investisseur+ offerte</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- What you'll do -->
                  <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#0F172A;">Ce que vous allez faire d'ici le 20 juin :</p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
                    <tr><td style="padding:5px 0;font-size:14px;color:#374151;line-height:1.6;">— Assister à 3 sessions live animées par des analystes qui connaissent la BRVM par cœur.</td></tr>
                    <tr><td style="padding:5px 0;font-size:14px;color:#374151;line-height:1.6;">— Repartir avec 3 plans d'action concrets — pas de la théorie, des actions réelles à poser.</td></tr>
                    <tr><td style="padding:5px 0;font-size:14px;color:#374151;line-height:1.6;">— Accéder à une communauté d'investisseurs qui apprennent au même rythme que vous.</td></tr>
                    <tr><td style="padding:5px 0;font-size:14px;color:#374151;line-height:1.6;">— Décrocher un certificat que vous pourrez partager — la preuve que vous avez fait le travail.</td></tr>
                  </table>

                  <!-- Urgency notice -->
                  <div style="background:#FEF2F2;border-left:4px solid #EF4444;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:28px;">
                    <p style="margin:0;font-size:14px;color:#991B1B;font-weight:600;">Ce tarif n'est pas permanent. Il disparaît dans quelques jours.</p>
                  </div>

                  <!-- CTA -->
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
                    <tr>
                      <td align="center">
                        <a href="${webinarUrl}" style="display:inline-block;padding:16px 40px;background-color:#1D4ED8;color:#FFFFFF;text-decoration:none;border-radius:10px;font-size:16px;font-weight:800;">
                          S'inscrire maintenant →
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 28px;font-size:13px;color:#6B7280;text-align:center;">Préinscription gratuite · Paiement Wave / Orange Money / MTN MoMo</p>

                  <p style="margin:0 0 28px;font-size:14px;color:#6B7280;text-align:center;">Si vous avez des questions sur le contenu exact du Pack,<br>répondez à cet email. Je vous réponds personnellement.</p>

                  <p style="margin:0;font-size:15px;color:#374151;">SIMBA<br>
                  <span style="color:#6B7280;font-size:13px;">Formateur — Afribourse</span></p>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#F8FAFC;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
                  <p style="margin:0;font-size:12px;color:#9CA3AF;">Afribourse · Marchés financiers africains<br>
                  <a href="https://www.africbourse.com/unsubscribe" style="color:#9CA3AF;">Se désabonner</a></p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `Bonjour ${firstName},

Vous êtes sur Afribourse depuis un moment.
Vous avez appris. Vous avez simulé. Vous avez regardé les marchés.
Il manque une chose : passer à l'étape suivante avec des experts à vos côtés.

Pack Parcours Investisseur BRVM
3 sessions intensives · Experts BRVM · Certification officielle

✓ 3 webinaires live (Fondamentaux · Analyse fondamentale · Analyse technique)
✓ Communauté Afribourse — 3 mois d'accès
✓ 3 Plans d'Action personnalisés — un après chaque session
✓ Deal Flow hebdomadaire — 12 analyses exclusives BRVM
✓ Certificat « Investisseur BRVM — Niveau 1 »
🎁 BONUS : 1 semaine d'accès Investisseur+ offerte

25 000 XOF (au lieu de 35 000 XOF — offre limitée)

Ce tarif n'est pas permanent. Il disparaît dans quelques jours.

Ce que vous allez faire d'ici le 20 juin :
— Assister à 3 sessions live animées par des analystes qui connaissent la BRVM par cœur.
— Repartir avec 3 plans d'action concrets — pas de la théorie, des actions réelles à poser.
— Accéder à une communauté d'investisseurs qui apprennent au même rythme que vous.
— Décrocher un certificat que vous pourrez partager — la preuve que vous avez fait le travail.

→ S'inscrire maintenant : ${webinarUrl}
Préinscription gratuite · Paiement Wave / Orange Money / MTN MoMo

Si vous avez des questions sur le contenu exact du Pack, répondez à cet email. Je vous réponds personnellement.

SIMBA
Formateur — Afribourse`;

  await sendEmail({
    to: email,
    subject: '🎓 Votre dernière chance d\'entrer dans le Parcours Investisseur BRVM',
    html,
    text,
  });
}

export async function sendDangoteIPONewsletterEmail({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const firstName = (name || 'Investisseur').split(' ')[0];
  const newsUrl = 'https://www.africbourse.com/news';

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>AfriBourse — L'IPO du siècle arrive à la BRVM</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .kpi-cell { display: block !important; width: 50% !important; float: left; box-sizing: border-box; }
      .hide-mobile { display: none !important; }
      .hero-title { font-size: 22px !important; line-height: 1.25 !important; }
      .section-title { font-size: 15px !important; }
      .body-text { font-size: 14px !important; }
      .pad-mobile { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">

<!-- PREHEADER -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f0f2f5;">
  La plus grande IPO de l'histoire africaine cible la BRVM. Tout ce qu'il faut savoir sur la cotation de la Dangote Refinery.&nbsp;​&zwnj;&nbsp;
</div>

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f0f2f5;">
<tr><td align="center" style="padding:20px 10px;">
<table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="600" style="margin:auto;">

  <!-- ── HEADER TOPBAR ── -->
  <tr>
    <td style="background-color:#0A1628;border-radius:10px 10px 0 0;padding:16px 32px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#00D4A8;letter-spacing:-0.02em;">Afri</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Bourse</span>
            <span style="display:inline-block;margin-left:10px;font-size:10px;color:#8898B0;letter-spacing:0.1em;text-transform:uppercase;vertical-align:middle;">BRVM · Marchés Africains</span>
          </td>
          <td align="right">
            <span style="font-size:10px;color:#8898B0;">Juin 2026</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── ÉDITION LABEL ── -->
  <tr>
    <td style="background-color:#0d1e38;padding:8px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding-right:8px;">
            <span style="display:inline-block;background-color:rgba(232,75,75,0.2);color:#E84B4B;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:3px 10px;border-radius:100px;">Édition Spéciale</span>
          </td>
          <td style="padding-right:8px;">
            <span style="display:inline-block;background-color:rgba(245,166,35,0.15);color:#F5A623;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:3px 10px;border-radius:100px;">IPO 2026</span>
          </td>
          <td>
            <span style="display:inline-block;background-color:rgba(0,212,168,0.12);color:#00D4A8;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:3px 10px;border-radius:100px;">BRVM · UEMOA</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── SALUTATION PERSONNALISÉE ── -->
  <tr>
    <td style="background-color:#0A1628;padding:24px 32px 0;" class="pad-mobile">
      <p style="margin:0;font-size:15px;line-height:1.6;color:#A8BDD4;">
        Bonjour <strong style="color:#ffffff;">${firstName}</strong>,
      </p>
      <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#8898B0;">
        Cette semaine, nous suivons de très près un événement qui pourrait marquer l'histoire des marchés financiers africains. Bonne lecture.
      </p>
    </td>
  </tr>

  <!-- ── NOTICE ACTUALITÉS ── -->
  <tr>
    <td style="background-color:#0A1628;padding:12px 32px 0;" class="pad-mobile">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="background-color:rgba(0,212,168,0.08);border:1px solid rgba(0,212,168,0.2);border-radius:8px;padding:10px 16px;">
            <p style="margin:0;font-size:12px;line-height:1.5;color:#A8BDD4;">
              📰 <strong style="color:#00D4A8;">Toutes nos actualités BRVM</strong> sont disponibles en temps réel sur AfriBourse —
              <a href="${newsUrl}" style="color:#00D4A8;text-decoration:underline;font-weight:700;">africbourse.com/news</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── HERO SECTION ── -->
  <tr>
    <td style="background-color:#0A1628;padding:24px 32px 28px;" class="pad-mobile">

      <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#00D4A8;">
        🔴 Dossier exclusif
      </p>

      <h1 class="hero-title" style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;line-height:1.2;color:#ffffff;">
        La raffinerie Dangote s'apprête à ouvrir son capital.<br/>
        <span style="color:#00D4A8;">L'Afrique de l'Ouest est invitée à l'IPO du siècle.</span>
      </h1>

      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#A8BDD4;">
        Le plus grand actif industriel privé d'Afrique va entrer en bourse. La BRVM joue un rôle central dans ce projet transfrontalier inédit — une opportunité historique pour les investisseurs de la zone UEMOA.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td style="border-top:1px solid rgba(255,255,255,0.08);font-size:0;">&nbsp;</td></tr>
      </table>

      <p style="margin:14px 0 0;font-size:11px;color:#8898B0;">
        AfriBourse Newsroom &nbsp;·&nbsp; Juin 2026 &nbsp;·&nbsp; Temps de lecture : 4 min
      </p>
    </td>
  </tr>

  <!-- ── BANDE KPI ── -->
  <tr>
    <td style="background-color:#0d1e38;padding:0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td class="kpi-cell" width="33%" style="padding:18px 16px 18px 24px;border-right:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8898B0;">Valorisation</p>
            <p style="margin:0 0 3px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#F5A623;line-height:1;">40–50 Md$</p>
            <p style="margin:0;font-size:10px;color:#8898B0;">Record africain absolu</p>
          </td>
          <td class="kpi-cell" width="33%" style="padding:18px 16px;border-right:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8898B0;">Capital offert</p>
            <p style="margin:0 0 3px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#00D4A8;line-height:1;">~10 %</p>
            <p style="margin:0;font-size:10px;color:#8898B0;">4 à 5 milliards de dollars</p>
          </td>
          <td class="kpi-cell" width="33%" style="padding:18px 24px 18px 16px;">
            <p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8898B0;">Lancement cible</p>
            <p style="margin:0 0 3px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#00D4A8;line-height:1;">Sept. 2026</p>
            <p style="margin:0;font-size:10px;color:#8898B0;">Souscription : août 2026</p>
          </td>
        </tr>
        <tr>
          <td colspan="3" style="border-top:1px solid rgba(255,255,255,0.06);padding:16px 24px;background-color:#0a1830;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td width="50%" style="padding-right:16px;border-right:1px solid rgba(255,255,255,0.06);">
                  <p style="margin:0 0 3px;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8898B0;">Capacité de raffinage</p>
                  <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#ffffff;">650 000 b/j &nbsp;<span style="font-size:11px;color:#8898B0;font-family:Arial,sans-serif;font-weight:400;">N°1 mondial</span></p>
                </td>
                <td width="50%" style="padding-left:16px;">
                  <p style="margin:0 0 3px;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8898B0;">Intérêt pré-IPO</p>
                  <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#F5A623;">~2 Md$ <span style="font-size:11px;color:#8898B0;font-family:Arial,sans-serif;font-weight:400;">demandes avant ouverture publique</span></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── CORPS ARTICLE ── -->
  <tr>
    <td style="background-color:#ffffff;padding:32px 32px 8px;" class="pad-mobile">

      <!-- SECTION 1 -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
        <tr>
          <td style="border-left:3px solid #00D4A8;padding-left:14px;">
            <h2 class="section-title" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;color:#0A1628;">Un géant industriel sort de l'ombre</h2>
          </td>
        </tr>
      </table>

      <p class="body-text" style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#344563;">
        Inaugurée en 2023 à Lekki (Lagos), la <strong style="color:#0A1628;">Dangote Petroleum Refinery</strong> est la plus grande raffinerie à train unique au monde. Avec <strong style="color:#0A1628;">650 000 barils raffinés par jour</strong>, opérant à 99 % de ses capacités, elle a radicalement transformé le paysage énergétique du Nigeria.
      </p>
      <p class="body-text" style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#344563;">
        Construite pour environ 20 milliards de dollars, elle exporte aujourd'hui son diesel, kérosène et polypropylène vers le Ghana, le Togo, le Cameroun et jusqu'en Europe — les exportations de kérosène ayant progressé de <strong style="color:#0A1628;">770 %</strong> entre 2024 et 2026.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:20px 0;">
        <tr>
          <td style="background-color:#FFF9EE;border-left:3px solid #F5A623;border-radius:0 8px 8px 0;padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:14px;font-style:italic;line-height:1.6;color:#5C4A1E;">
              « We are trying to make sure that by September, we'll be out there in the market to sell the IPO. »
            </p>
            <p style="margin:0;font-size:11px;color:#8C7340;">— <strong>Aliko Dangote</strong>, lors de la visite de Femi Otedola au complexe de Lekki, 20 mai 2026</p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
        <tr><td style="border-top:1px solid #E8ECF0;font-size:0;">&nbsp;</td></tr>
      </table>

      <!-- SECTION 2 -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
        <tr>
          <td style="border-left:3px solid #00D4A8;padding-left:14px;">
            <h2 class="section-title" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;color:#0A1628;">L'IPO africaine qui brise tous les records</h2>
          </td>
        </tr>
      </table>

      <p class="body-text" style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#344563;">
        La cession de <strong style="color:#0A1628;">~10 % du capital</strong> représente une transaction de <strong style="color:#0A1628;">4 à 5 milliards de dollars</strong> sur la base d'une valorisation estimée entre 40 et 50 Md$. Pour comparaison, l'IPO MTN Nigeria de 2019 — jusqu'ici la plus grande sur la NGX — avait levé 876 millions de dollars, soit <strong style="color:#0A1628;">5× moins</strong>.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:20px 0;border-radius:8px;overflow:hidden;border:1px solid #E8ECF0;">
        <tr>
          <td style="background-color:#F7F9FC;padding:6px 16px;border-bottom:1px solid #E8ECF0;">
            <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8898B0;">Mise en perspective</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding:8px 12px;background-color:#FFF8ED;border-radius:6px;margin-bottom:6px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td><p style="margin:0;font-size:12px;color:#5C4A1E;font-weight:600;">Dangote Refinery IPO (2026)</p></td>
                      <td align="right"><p style="margin:0;font-size:14px;font-weight:700;color:#F5A623;">4–5 Md$</p></td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td style="height:6px;"></td></tr>
              <tr>
                <td style="padding:8px 12px;background-color:#F7F9FC;border-radius:6px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td><p style="margin:0;font-size:12px;color:#8898B0;">MTN Nigeria (2019, précédent record)</p></td>
                      <td align="right"><p style="margin:0;font-size:14px;font-weight:700;color:#8898B0;">876 M$</p></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
        <tr><td style="border-top:1px solid #E8ECF0;font-size:0;">&nbsp;</td></tr>
      </table>

      <!-- SECTION 3 -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
        <tr>
          <td style="border-left:3px solid #00D4A8;padding-left:14px;">
            <h2 class="section-title" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;color:#0A1628;">La BRVM au cœur du dispositif pan-africain</h2>
          </td>
        </tr>
      </table>

      <p class="body-text" style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#344563;">
        Début avril 2026, le <strong style="color:#0A1628;">Nigerian Exchange Group (NGX)</strong> a réuni à Lagos les dirigeants des cinq grandes bourses africaines pour structurer une cotation multi-marchés simultanée inédite.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0;">
        <tr>
          <td style="padding-right:6px;padding-bottom:6px;">
            <span style="display:inline-block;background-color:#0A1628;color:#00D4A8;font-size:10px;font-weight:700;padding:5px 12px;border-radius:6px;">🇳🇬 NGX Lagos</span>
          </td>
          <td style="padding-right:6px;padding-bottom:6px;">
            <span style="display:inline-block;background-color:#EEF9F6;color:#0A7A60;border:1px solid #B8E8DA;font-size:10px;font-weight:700;padding:5px 12px;border-radius:6px;">🇨🇮 BRVM Abidjan</span>
          </td>
          <td style="padding-right:6px;padding-bottom:6px;">
            <span style="display:inline-block;background-color:#F7F9FC;color:#344563;border:1px solid #E0E6EF;font-size:10px;font-weight:600;padding:5px 12px;border-radius:6px;">🇿🇦 JSE</span>
          </td>
          <td style="padding-right:6px;padding-bottom:6px;">
            <span style="display:inline-block;background-color:#F7F9FC;color:#344563;border:1px solid #E0E6EF;font-size:10px;font-weight:600;padding:5px 12px;border-radius:6px;">🇰🇪 NSE</span>
          </td>
          <td style="padding-bottom:6px;">
            <span style="display:inline-block;background-color:#F7F9FC;color:#344563;border:1px solid #E0E6EF;font-size:10px;font-weight:600;padding:5px 12px;border-radius:6px;">🇬🇭 GSE</span>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;">
        <tr>
          <td style="background-color:#EEF9F6;border-left:3px solid #00D4A8;border-radius:0 8px 8px 0;padding:16px 20px;">
            <p style="margin:0;font-size:14px;line-height:1.6;color:#1A4D3E;">
              <strong style="color:#0A7A60;">Ce que cela signifie concrètement :</strong> Un investisseur basé à Abidjan, Dakar ou Lomé pourrait, sans intermédiaire complexe, devenir actionnaire d'un géant industriel nigérian via son courtier BRVM habituel. C'est la première IPO pan-africaine conçue comme telle dès sa conception.
            </p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
        <tr><td style="border-top:1px solid #E8ECF0;font-size:0;">&nbsp;</td></tr>
      </table>

      <!-- SECTION 4 -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">
        <tr>
          <td style="border-left:3px solid #F5A623;padding-left:14px;">
            <h2 class="section-title" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;color:#0A1628;">Innovation financière : investir en FCFA, encaisser en dollars</h2>
          </td>
        </tr>
      </table>

      <p class="body-text" style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#344563;">
        L'une des caractéristiques les plus remarquables de cette IPO est sa structure de rémunération. Les actions seraient souscrites en monnaie locale — mais les dividendes seraient versés en <strong style="color:#0A1628;">dollars américains</strong>, adossés aux <strong style="color:#0A1628;">6,4 milliards de dollars</strong> de recettes d'exportation annuelles de la raffinerie.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;">
        <tr>
          <td style="background-color:#FFFBF0;border-left:3px solid #F5A623;border-radius:0 8px 8px 0;padding:14px 18px;">
            <p style="margin:0;font-size:13px;line-height:1.6;color:#5C4A1E;">
              ⚠️ <strong>Note :</strong> Cette structure est en attente de validation finale de la SEC nigériane. Si approuvée, elle offrirait aux investisseurs de la zone CFA une protection naturelle contre la dépréciation monétaire, sans sortie de capitaux hors du continent.
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- ── TIMELINE ── -->
  <tr>
    <td style="background-color:#F7F9FC;padding:28px 32px;" class="pad-mobile">

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;">
        <tr>
          <td style="border-left:3px solid #0A1628;padding-left:14px;">
            <h2 class="section-title" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;color:#0A1628;">Le calendrier à retenir</h2>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td width="92" valign="top" style="padding-bottom:16px;padding-right:12px;">
            <span style="display:inline-block;background-color:#EEF9F6;color:#0A7A60;font-size:9px;font-weight:700;letter-spacing:0.05em;padding:4px 8px;border-radius:4px;white-space:nowrap;">Avr. 2026</span>
          </td>
          <td valign="top" style="padding-bottom:16px;border-bottom:1px solid #E0E6EF;">
            <p style="margin:0;font-size:13px;line-height:1.5;color:#344563;"><strong style="color:#0A1628;">Réunion NGX à Lagos</strong> — JSE, NSE, GSE et BRVM autour de la table pour structurer la cotation multi-bourses. Dépôt du prospectus auprès de la SEC Nigeria.</p>
          </td>
        </tr>
        <tr><td colspan="2" style="height:12px;"></td></tr>
        <tr>
          <td width="92" valign="top" style="padding-bottom:16px;padding-right:12px;">
            <span style="display:inline-block;background-color:#FFF8ED;color:#A06D10;font-size:9px;font-weight:700;letter-spacing:0.05em;padding:4px 8px;border-radius:4px;white-space:nowrap;">Mai 2026</span>
          </td>
          <td valign="top" style="padding-bottom:16px;border-bottom:1px solid #E0E6EF;">
            <p style="margin:0;font-size:13px;line-height:1.5;color:#344563;"><strong style="color:#0A1628;">Femi Otedola investit 100 M$</strong> en placement privé. Les demandes pré-IPO avoisinent les 2 Md$. Aliko Dangote confirme septembre 2026 comme cible de lancement.</p>
          </td>
        </tr>
        <tr><td colspan="2" style="height:12px;"></td></tr>
        <tr>
          <td width="92" valign="top" style="padding-bottom:16px;padding-right:12px;">
            <span style="display:inline-block;background-color:#EEF9F6;color:#0A7A60;font-size:9px;font-weight:700;letter-spacing:0.05em;padding:4px 8px;border-radius:4px;white-space:nowrap;">Août 2026</span>
          </td>
          <td valign="top" style="padding-bottom:16px;border-bottom:1px solid #E0E6EF;">
            <p style="margin:0;font-size:13px;line-height:1.5;color:#344563;"><strong style="color:#0A1628;">Ouverture souscription publique</strong> sur la NGX (cotation principale). Fenêtre d'environ 4 semaines pour les investisseurs particuliers et institutionnels.</p>
          </td>
        </tr>
        <tr><td colspan="2" style="height:12px;"></td></tr>
        <tr>
          <td width="92" valign="top" style="padding-right:12px;">
            <span style="display:inline-block;background-color:#0A1628;color:#00D4A8;font-size:9px;font-weight:700;letter-spacing:0.05em;padding:4px 8px;border-radius:4px;white-space:nowrap;">Sept. 2026</span>
          </td>
          <td valign="top">
            <p style="margin:0;font-size:13px;line-height:1.5;color:#344563;"><strong style="color:#0A1628;">Cotation officielle NGX</strong> + lancement multi-bourses. Modalités BRVM en cours de finalisation — répartition du flottant, souscription FCFA, règlement-livraison transfrontalier.</p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:20px;">
        <tr>
          <td style="background-color:#0A1628;border-radius:8px;padding:14px 18px;">
            <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#8898B0;">Banques d'affaires mandatées</p>
            <p style="margin:0;font-size:12px;line-height:1.6;color:#C4D5E8;">
              <strong style="color:#00D4A8;">Stanbic IBTC Capital</strong> — Placement international &nbsp;·&nbsp;
              <strong style="color:#00D4A8;">Vetiva Capital</strong> — Distribution retail &nbsp;·&nbsp;
              <strong style="color:#00D4A8;">FirstCap</strong> — Institutionnels Nigeria
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- ── OPPORTUNITÉS & RISQUES ── -->
  <tr>
    <td style="background-color:#ffffff;padding:28px 32px;" class="pad-mobile">

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;">
        <tr>
          <td style="border-left:3px solid #0A1628;padding-left:14px;">
            <h2 class="section-title" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;color:#0A1628;">Pour les investisseurs UEMOA : ce qu'il faut retenir</h2>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td width="48%" valign="top" style="padding-right:12px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="background-color:#EEF9F6;border-radius:8px;padding:16px 18px;">
                  <p style="margin:0 0 12px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0A7A60;">✦ Opportunités</p>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr><td valign="top" style="padding-bottom:8px;"><p style="margin:0;font-size:12px;line-height:1.5;color:#1A4D3E;"><span style="color:#00D4A8;font-weight:700;">✓</span> Accès inédit à un actif industriel mondial via la BRVM</p></td></tr>
                    <tr><td valign="top" style="padding-bottom:8px;"><p style="margin:0;font-size:12px;line-height:1.5;color:#1A4D3E;"><span style="color:#00D4A8;font-weight:700;">✓</span> Dividendes en dollars — bouclier contre la dépréciation du FCFA</p></td></tr>
                    <tr><td valign="top" style="padding-bottom:8px;"><p style="margin:0;font-size:12px;line-height:1.5;color:#1A4D3E;"><span style="color:#00D4A8;font-weight:700;">✓</span> Diversification : énergie & pétrochimie absents de la cote BRVM</p></td></tr>
                    <tr><td valign="top"><p style="margin:0;font-size:12px;line-height:1.5;color:#1A4D3E;"><span style="color:#00D4A8;font-weight:700;">✓</span> Signal fort pour l'intégration financière africaine</p></td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
          <td width="4%"></td>
          <td width="48%" valign="top">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="background-color:#FFF5F5;border-radius:8px;padding:16px 18px;">
                  <p style="margin:0 0 12px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#C0392B;">⚠ Vigilance</p>
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr><td valign="top" style="padding-bottom:8px;"><p style="margin:0;font-size:12px;line-height:1.5;color:#5A1A1A;"><span style="color:#E84B4B;font-weight:700;">!</span> Flottant limité (5–10 %) : risque de faible liquidité</p></td></tr>
                    <tr><td valign="top" style="padding-bottom:8px;"><p style="margin:0;font-size:12px;line-height:1.5;color:#5A1A1A;"><span style="color:#E84B4B;font-weight:700;">!</span> Valorisation élevée : prime sur le coût de remplacement</p></td></tr>
                    <tr><td valign="top" style="padding-bottom:8px;"><p style="margin:0;font-size:12px;line-height:1.5;color:#5A1A1A;"><span style="color:#E84B4B;font-weight:700;">!</span> Dividendes USD : approbation réglementaire non finalisée</p></td></tr>
                    <tr><td valign="top"><p style="margin:0;font-size:12px;line-height:1.5;color:#5A1A1A;"><span style="color:#E84B4B;font-weight:700;">!</span> Harmonisation multi-juridictions encore en cours</p></td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- ── CTA SUIVI ── -->
  <tr>
    <td style="background-color:#0A1628;padding:28px 32px;" class="pad-mobile">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="border-left:3px solid #00D4A8;padding-left:16px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#00D4A8;">📌 À suivre sur AfriBourse</p>
            <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#A8BDD4;">
              Dès que le prospectus officiel est publié et que les modalités de souscription via la BRVM sont confirmées, nous publierons une analyse complète avec les données financières, les ratios de valorisation et le guide pratique de souscription pour les investisseurs UEMOA.
            </p>
            <a href="${newsUrl}" style="display:inline-block;background-color:#00D4A8;color:#0A1628;font-size:13px;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">Voir toutes les actualités →</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── FOOTER ── -->
  <tr>
    <td style="background-color:#070e1c;border-radius:0 0 10px 10px;padding:24px 32px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
        <tr>
          <td>
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:#00D4A8;">Afri</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:#ffffff;">Bourse</span>
          </td>
          <td align="right">
            <a href="https://www.africbourse.com/news" style="display:inline-block;margin-left:12px;font-size:11px;color:#8898B0;text-decoration:none;">Actualités</a>
            <a href="https://www.africbourse.com" style="display:inline-block;margin-left:12px;font-size:11px;color:#8898B0;text-decoration:none;">Site web</a>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 12px;font-size:11px;line-height:1.6;color:#8898B0;">
        <strong style="color:#C4D5E8;">Sources :</strong> Sika Finance · African Markets · Daba Finance · Legit.ng · Zedcrest Wealth · Agence Ecofin · Billionaires Africa
      </p>

      <p style="margin:0 0 14px;font-size:10px;line-height:1.6;color:#5A6A80;">
        Les informations contenues dans cette newsletter sont fournies à titre informatif uniquement et ne constituent pas un conseil en investissement. Les marchés financiers comportent des risques. Vérifiez toujours les informations auprès des sources officielles avant toute décision d'investissement.
      </p>

      <p style="margin:0;font-size:10px;color:#5A6A80;">
        Vous recevez cet email car vous êtes abonné à la newsletter AfriBourse. &nbsp;·&nbsp;
        <a href="https://www.africbourse.com/news" style="color:#8898B0;text-decoration:underline;">Toutes les actualités</a> &nbsp;·&nbsp;
        <a href="#" style="color:#8898B0;text-decoration:underline;">Se désabonner</a> &nbsp;·&nbsp;
        <a href="#" style="color:#8898B0;text-decoration:underline;">Gérer mes préférences</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `${firstName}, l'IPO du siècle arrive sur la BRVM — Dangote Refinery`,
    html,
    text: `Bonjour ${firstName},\n\nCette semaine, nous suivons de très près un événement qui pourrait marquer l'histoire des marchés financiers africains.\n\n📰 Toutes nos actualités BRVM sont disponibles sur : https://www.africbourse.com/news\n\n──────────────────────────────────────\nL'IPO DANGOTE REFINERY : CE QU'IL FAUT SAVOIR\n──────────────────────────────────────\n\nLa raffinerie Dangote s'apprête à ouvrir son capital. L'Afrique de l'Ouest est invitée à l'IPO du siècle.\n\nChiffres clés :\n• Valorisation : 40–50 Md$ (record africain absolu)\n• Capital offert : ~10 % (4 à 5 milliards de dollars)\n• Lancement cible : septembre 2026\n• Capacité : 650 000 b/j (N°1 mondial)\n\nLa BRVM fait partie des 5 bourses africaines impliquées dans cette cotation multi-marchés inédite. Un investisseur basé à Abidjan, Dakar ou Lomé pourrait devenir actionnaire via son courtier BRVM habituel.\n\nCalendrier :\n→ Avr. 2026 : Réunion NGX + dépôt prospectus SEC Nigeria\n→ Mai 2026 : Femi Otedola investit 100 M$, demandes pré-IPO ~2 Md$\n→ Août 2026 : Ouverture souscription publique NGX\n→ Sept. 2026 : Cotation officielle NGX + lancement multi-bourses\n\nSuivez toute l'actualité sur : https://www.africbourse.com/news\n\nBonne lecture,\nL'équipe AfriBourse\n\nCet email est fourni à titre informatif uniquement — il ne constitue pas un conseil en investissement.`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Newsletter Semaine du 8 au 14 juin 2026
// ─────────────────────────────────────────────────────────────────────────────
export async function sendWeeklyNewsletterJuin2026Email({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const firstName = (name && name.trim()) ? name.trim().split(' ')[0] : 'Investisseur';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AfriBourse — Semaine du 8 au 14 juin 2026</title>
</head>
<body style="margin:0;padding:0;background-color:#0A1628;font-family:'Segoe UI',Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#0A1628;">
<tr><td align="center" style="padding:20px 12px 40px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:680px;">

  <!-- ── HEADER ── -->
  <tr>
    <td style="background-color:#1E3A5F;border-radius:10px 10px 0 0;padding:28px 32px 24px;border-bottom:1px solid #2A4A72;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:900;line-height:1;color:#ffffff;">Afri<span style="color:#00D4A8;">Bourse</span></div>
            <div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#8898AA;margin-top:6px;">Intelligence des marchés UEMOA</div>
          </td>
          <td align="right" valign="top">
            <span style="display:inline-block;background:#00D4A8;color:#0A1628;font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;padding:4px 10px;border-radius:3px;">Édition #24</span>
            <div style="font-size:11px;color:#8898AA;margin-top:6px;font-family:monospace;">8 – 14 juin 2026</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── TICKER (statique) ── -->
  <tr>
    <td style="background-color:#142236;border-bottom:1px solid #2A4A72;padding:10px 32px;">
      <span style="font-size:10px;font-family:monospace;color:#00D4A8;font-weight:600;margin-right:12px;">BRVM LIVE</span>
      <span style="font-size:11px;font-family:monospace;color:#F0F4F8;">ORAC 14 215 <span style="color:#E8473F;">▼ -5,23 %</span></span>
      &nbsp;&nbsp;
      <span style="font-size:11px;font-family:monospace;color:#F0F4F8;">SGBC 33 450 <span style="color:#4ADE80;">▲ +0,45 %</span></span>
      &nbsp;&nbsp;
      <span style="font-size:11px;font-family:monospace;color:#F0F4F8;">CBIBF 22 050 <span style="color:#4ADE80;">▲ +0,23 %</span></span>
      &nbsp;&nbsp;
      <span style="font-size:11px;font-family:monospace;color:#F0F4F8;">PALC 8 680 <span style="color:#4ADE80;">▲ +0,35 %</span></span>
    </td>
  </tr>

  <!-- ── SALUTATION ── -->
  <tr>
    <td style="background-color:#0A1628;padding:28px 32px 0;">
      <p style="margin:0 0 6px;font-size:16px;color:#C8D8E8;">Bonjour <strong style="color:#ffffff;">${firstName}</strong>,</p>
      <p style="margin:0;font-size:14px;color:#8898AA;line-height:1.6;">Voici votre résumé des marchés BRVM pour la semaine du 8 au 14 juin 2026.</p>
    </td>
  </tr>

  <!-- ── LEAD / L'ESSENTIEL ── -->
  <tr>
    <td style="background-color:#0A1628;padding:20px 32px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#142236;border-left:3px solid #00D4A8;border-radius:0 6px 6px 0;">
        <tr>
          <td style="padding:22px 24px;">
            <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#00D4A8;margin-bottom:10px;font-family:monospace;">L'essentiel de la semaine</div>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:700;color:#ffffff;line-height:1.35;margin-bottom:12px;">Stabilité monétaire, dividendes en cascade et une BRVM sous les projecteurs internationaux</div>
            <p style="margin:0;font-size:14px;color:#B8C8D8;line-height:1.75;">Un signal fort venu de Dakar : la BCEAO a maintenu ses taux inchangés dans un contexte de croissance solide et d'inflation quasi nulle. Le marché a marqué une pause après une semaine précédente brillante (+2,75 %). La saison des dividendes continue d'animer les cours, avec Orange CI en vedette involontaire d'une baisse mécanique. La BRVM s'est aussi offert une vitrine internationale à Riga, devant les participants du Forum de la BERD.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── SECTION 1 : BCEAO ── -->
  <tr>
    <td style="background-color:#0A1628;padding:32px 32px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom:1px solid #2A4A72;padding-bottom:16px;margin-bottom:20px;">
        <tr>
          <td valign="top" style="padding-right:14px;" width="30">
            <div style="background:#00D4A8;color:#0A1628;font-family:monospace;font-size:11px;font-weight:600;width:26px;height:26px;border-radius:50%;text-align:center;line-height:26px;">1</div>
          </td>
          <td>
            <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8898AA;margin-bottom:4px;font-family:monospace;">Politique monétaire</div>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#ffffff;line-height:1.3;">La BCEAO maintient tous ses taux — ce que ça signifie pour votre portefeuille</div>
            <div style="font-size:11px;color:#8898AA;font-family:monospace;margin-top:4px;">Réunion CPM · Dakar, 10 juin 2026</div>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 16px;font-size:14.5px;color:#C8D8E8;line-height:1.75;">Le Comité de Politique Monétaire de la BCEAO s'est réuni mardi 10 juin à Dakar. Verdict sans surprise, mais ô combien rassurant : <strong style="color:#fff;">aucun mouvement</strong>. Les trois taux directeurs restent inchangés pour la troisième fois consécutive.</p>

      <!-- Taux cards -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding-right:6px;" width="33%">
            <div style="background:#1E3A5F;border:1px solid #2A4A72;border-radius:6px;padding:16px 14px;text-align:center;">
              <div style="font-size:11px;color:#8898AA;line-height:1.4;margin-bottom:10px;">Taux minimum d'injection de liquidité</div>
              <div style="font-family:monospace;font-size:26px;font-weight:500;color:#00D4A8;line-height:1;">3,00 %</div>
              <div style="display:inline-block;margin-top:8px;font-family:monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#0A1628;background:#00D4A8;padding:2px 8px;border-radius:3px;">Inchangé</div>
            </div>
          </td>
          <td style="padding:0 3px;" width="33%">
            <div style="background:#1E3A5F;border:1px solid #2A4A72;border-radius:6px;padding:16px 14px;text-align:center;">
              <div style="font-size:11px;color:#8898AA;line-height:1.4;margin-bottom:10px;">Taux du guichet de prêt marginal</div>
              <div style="font-family:monospace;font-size:26px;font-weight:500;color:#00D4A8;line-height:1;">5,00 %</div>
              <div style="display:inline-block;margin-top:8px;font-family:monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#0A1628;background:#00D4A8;padding:2px 8px;border-radius:3px;">Inchangé</div>
            </div>
          </td>
          <td style="padding-left:6px;" width="33%">
            <div style="background:#1E3A5F;border:1px solid #2A4A72;border-radius:6px;padding:16px 14px;text-align:center;">
              <div style="font-size:11px;color:#8898AA;line-height:1.4;margin-bottom:10px;">Coefficient de réserves obligatoires</div>
              <div style="font-family:monospace;font-size:26px;font-weight:500;color:#00D4A8;line-height:1;">3,00 %</div>
              <div style="display:inline-block;margin-top:8px;font-family:monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#0A1628;background:#00D4A8;padding:2px 8px;border-radius:3px;">Depuis mars 2026</div>
            </div>
          </td>
        </tr>
      </table>

      <p style="margin:16px 0 0;font-size:14.5px;color:#C8D8E8;line-height:1.75;"><strong style="color:#fff;">Pourquoi c'est structurellement favorable à la BRVM.</strong> Quand les taux restent bas et stables, les banques empruntent moins cher, les entreprises se financent à moindre coût, et les investisseurs ont moins de raisons de quitter la bourse pour des placements obligataires. C'est un environnement porteur pour les valeurs bancaires et industrielles.</p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#142236;border:1px solid #2A4A72;border-radius:6px;margin:16px 0 0;">
        <tr>
          <td style="padding:18px 22px;">
            <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#00D4A8;margin-bottom:12px;">Le contexte macro</div>
            <p style="margin:0 0 8px;font-size:13.5px;color:#C8D8E8;line-height:1.65;"><strong style="color:#fff;">Inflation :</strong> -0,2 % au T1 2026 (légèrement négative) — prévision 1,6 % pour l'année, très en dessous des seuils d'alerte.</p>
            <p style="margin:0 0 8px;font-size:13.5px;color:#C8D8E8;line-height:1.65;"><strong style="color:#fff;">Croissance UEMOA :</strong> +6,1 % au T1 2026, portée par les secteurs extractifs, manufacturiers et agricoles.</p>
            <p style="margin:0;font-size:13.5px;color:#C8D8E8;line-height:1.65;"><strong style="color:#fff;">Risque surveillé :</strong> Les tensions géopolitiques au Moyen-Orient pourraient faire remonter le pétrole et l'inflation importée. Pour l'heure, ce risque reste latent.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── SECTION 2 : PERFORMANCE ── -->
  <tr>
    <td style="background-color:#0A1628;padding:32px 32px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom:1px solid #2A4A72;padding-bottom:16px;margin-bottom:20px;">
        <tr>
          <td valign="top" style="padding-right:14px;" width="30">
            <div style="background:#00D4A8;color:#0A1628;font-family:monospace;font-size:11px;font-weight:600;width:26px;height:26px;border-radius:50%;text-align:center;line-height:26px;">2</div>
          </td>
          <td>
            <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8898AA;margin-bottom:4px;font-family:monospace;">Indices &amp; Performance</div>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#ffffff;line-height:1.3;">Le marché marque une pause après une semaine brillante</div>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding-right:6px;" width="50%">
            <div style="background:#142236;border:1px solid #2A4A72;border-radius:6px;padding:16px 18px;">
              <div style="font-size:10px;color:#8898AA;text-transform:uppercase;letter-spacing:0.08em;font-family:monospace;margin-bottom:8px;">BRVM Composite S-1</div>
              <div style="font-family:monospace;font-size:22px;font-weight:500;color:#4ADE80;line-height:1;">+2,75 %</div>
              <div style="font-size:11px;color:#8898AA;margin-top:4px;">437,24 pts · 1–5 juin</div>
            </div>
          </td>
          <td style="padding-left:6px;" width="50%">
            <div style="background:#142236;border:1px solid #2A4A72;border-radius:6px;padding:16px 18px;">
              <div style="font-size:10px;color:#8898AA;text-transform:uppercase;letter-spacing:0.08em;font-family:monospace;margin-bottom:8px;">BRVM Composite lundi 8 juin</div>
              <div style="font-family:monospace;font-size:22px;font-weight:500;color:#E8473F;line-height:1;">-0,13 %</div>
              <div style="font-size:11px;color:#8898AA;margin-top:4px;">436,68 pts · correction technique</div>
            </div>
          </td>
        </tr>
      </table>

      <p style="margin:16px 0 0;font-size:14.5px;color:#C8D8E8;line-height:1.75;">Le recul de lundi est directement attribué à l'<strong style="color:#fff;">ajustement mécanique du cours d'Orange CI</strong> après son ex-dividende du 5 juin. Le reste de la semaine s'est maintenu en consolidation — une respiration normale dans une tendance haussière de fond. Rappel : la BRVM avait clôturé 2025 avec <strong style="color:#4ADE80;">+25,26 %</strong>.</p>
    </td>
  </tr>

  <!-- ── SECTION 3 : DIVIDENDES ── -->
  <tr>
    <td style="background-color:#0A1628;padding:32px 32px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom:1px solid #2A4A72;padding-bottom:16px;margin-bottom:20px;">
        <tr>
          <td valign="top" style="padding-right:14px;" width="30">
            <div style="background:#00D4A8;color:#0A1628;font-family:monospace;font-size:11px;font-weight:600;width:26px;height:26px;border-radius:50%;text-align:center;line-height:26px;">3</div>
          </td>
          <td>
            <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8898AA;margin-bottom:4px;font-family:monospace;">Saison des dividendes</div>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#ffffff;line-height:1.3;">Qui paie quoi en juin — le calendrier complet</div>
          </td>
        </tr>
      </table>

      <!-- Table dividendes -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
        <thead>
          <tr style="background-color:#1E3A5F;">
            <th style="padding:9px 12px;text-align:left;font-family:monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#8898AA;border-bottom:1px solid #2A4A72;">Date paiement</th>
            <th style="padding:9px 12px;text-align:left;font-family:monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#8898AA;border-bottom:1px solid #2A4A72;">Société</th>
            <th style="padding:9px 12px;text-align:left;font-family:monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#8898AA;border-bottom:1px solid #2A4A72;">Montant / action</th>
            <th style="padding:9px 12px;text-align:left;font-family:monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#8898AA;border-bottom:1px solid #2A4A72;">Ex-date</th>
            <th style="padding:9px 12px;text-align:left;font-family:monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#8898AA;border-bottom:1px solid #2A4A72;">Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #2A4A72;">
            <td style="padding:10px 12px;font-family:monospace;font-size:13px;color:#C8D8E8;">1er juin</td>
            <td style="padding:10px 12px;font-size:13px;color:#fff;font-weight:500;">SICABLE CI <span style="color:#8898AA;font-size:10px;font-family:monospace;">CABC</span></td>
            <td style="padding:10px 12px;font-family:monospace;font-size:13px;font-weight:500;color:#fff;">152,02 FCFA</td>
            <td style="padding:10px 12px;font-family:monospace;font-size:12px;color:#8898AA;">29 mai</td>
            <td style="padding:10px 12px;"><span style="font-family:monospace;font-size:10px;color:#4ADE80;background:rgba(74,222,128,.1);padding:3px 8px;border-radius:12px;">✓ Versé</span></td>
          </tr>
          <tr style="border-bottom:1px solid #2A4A72;">
            <td style="padding:10px 12px;font-family:monospace;font-size:13px;color:#C8D8E8;">8 juin</td>
            <td style="padding:10px 12px;font-size:13px;color:#fff;font-weight:500;">Orange CI <span style="color:#8898AA;font-size:10px;font-family:monospace;">ORAC</span></td>
            <td style="padding:10px 12px;font-family:monospace;font-size:13px;font-weight:500;color:#4ADE80;">800,00 FCFA</td>
            <td style="padding:10px 12px;font-family:monospace;font-size:12px;color:#8898AA;">5 juin</td>
            <td style="padding:10px 12px;"><span style="font-family:monospace;font-size:10px;color:#4ADE80;background:rgba(74,222,128,.1);padding:3px 8px;border-radius:12px;">✓ Versé</span></td>
          </tr>
          <tr style="border-bottom:1px solid #2A4A72;">
            <td style="padding:10px 12px;font-family:monospace;font-size:13px;color:#C8D8E8;">15 juin</td>
            <td style="padding:10px 12px;font-size:13px;color:#fff;font-weight:500;">ONATEL BF <span style="color:#8898AA;font-size:10px;font-family:monospace;">ONTBF</span></td>
            <td style="padding:10px 12px;font-family:monospace;font-size:13px;font-weight:500;color:#fff;">145,32 FCFA</td>
            <td style="padding:10px 12px;font-family:monospace;font-size:12px;color:#8898AA;">12 juin</td>
            <td style="padding:10px 12px;"><span style="font-family:monospace;font-size:10px;color:#F5A623;background:rgba(245,166,35,.1);padding:3px 8px;border-radius:12px;">⚡ Cette semaine</span></td>
          </tr>
          <tr style="border-bottom:1px solid #2A4A72;">
            <td style="padding:10px 12px;font-family:monospace;font-size:13px;color:#C8D8E8;">19 juin</td>
            <td style="padding:10px 12px;font-size:13px;color:#fff;font-weight:500;">Coris Bank International BF <span style="color:#8898AA;font-size:10px;font-family:monospace;">CBIBF</span></td>
            <td style="padding:10px 12px;font-family:monospace;font-size:13px;font-weight:500;color:#F5A623;">900,00 FCFA</td>
            <td style="padding:10px 12px;font-family:monospace;font-size:12px;color:#8898AA;">18 juin</td>
            <td style="padding:10px 12px;"><span style="font-family:monospace;font-size:10px;color:#00D4A8;background:rgba(0,212,168,.1);padding:3px 8px;border-radius:12px;">⏳ Fenêtre ouverte</span></td>
          </tr>
          <tr>
            <td style="padding:10px 12px;font-family:monospace;font-size:13px;color:#C8D8E8;">29 juin</td>
            <td style="padding:10px 12px;font-size:13px;color:#fff;font-weight:500;">PALM CI <span style="color:#8898AA;font-size:10px;font-family:monospace;">PALC</span></td>
            <td style="padding:10px 12px;font-family:monospace;font-size:13px;font-weight:500;color:#F5A623;">501,60 FCFA</td>
            <td style="padding:10px 12px;font-family:monospace;font-size:12px;color:#8898AA;">26 juin</td>
            <td style="padding:10px 12px;"><span style="font-family:monospace;font-size:10px;color:#00D4A8;background:rgba(0,212,168,.1);padding:3px 8px;border-radius:12px;">⏳ Fenêtre ouverte</span></td>
          </tr>
        </tbody>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:rgba(0,212,168,.06);border:1px solid rgba(0,212,168,.2);border-radius:6px;margin:14px 0 0;">
        <tr>
          <td style="padding:14px 18px;">
            <p style="margin:0;font-size:13.5px;color:#A8C8B8;line-height:1.65;"><strong style="color:#00D4A8;">Rappel fondamental :</strong> pour percevoir un dividende à la BRVM, vous devez détenir l'action <strong style="color:#fff;">avant la date ex-dividende</strong>, pas la date de paiement. Il vous reste encore une fenêtre sur <strong style="color:#fff;">Coris Bank (ex-date : 18 juin)</strong> et <strong style="color:#fff;">PALM CI (ex-date : 26 juin)</strong>.</p>
          </td>
        </tr>
      </table>

      <p style="margin:18px 0 10px;font-size:14px;color:#C8D8E8;line-height:1.7;">Plusieurs autres valeurs ont confirmé leurs montants pour l'exercice 2025 mais n'ont pas encore annoncé leurs dates officielles — paiement attendu en juillet :</p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding-right:6px;" width="50%">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr><td style="padding:0 0 6px;">
                <div style="background:#142236;border:1px solid #2A4A72;border-radius:4px;padding:10px 14px;display:flex;justify-content:space-between;">
                  <span style="font-size:13px;color:#C8D8E8;">SGBCI <span style="font-family:monospace;font-size:10px;color:#8898AA;">SGBC</span></span>
                  <span style="font-family:monospace;font-size:13px;font-weight:500;color:#00D4A8;float:right;">1 646 FCFA</span>
                </div>
              </td></tr>
              <tr><td style="padding:0 0 6px;">
                <div style="background:#142236;border:1px solid #2A4A72;border-radius:4px;padding:10px 14px;">
                  <span style="font-size:13px;color:#C8D8E8;">SMB CI <span style="font-family:monospace;font-size:10px;color:#8898AA;">SMBC</span></span>
                  <span style="font-family:monospace;font-size:13px;font-weight:500;color:#00D4A8;float:right;">704 FCFA</span>
                </div>
              </td></tr>
              <tr><td style="padding:0 0 6px;">
                <div style="background:#142236;border:1px solid #2A4A72;border-radius:4px;padding:10px 14px;">
                  <span style="font-size:13px;color:#C8D8E8;">SODECI <span style="font-family:monospace;font-size:10px;color:#8898AA;">SDCC</span></span>
                  <span style="font-family:monospace;font-size:13px;font-weight:500;color:#00D4A8;float:right;">462 FCFA</span>
                </div>
              </td></tr>
              <tr><td>
                <div style="background:#142236;border:1px solid #2A4A72;border-radius:4px;padding:10px 14px;">
                  <span style="font-size:13px;color:#C8D8E8;">Nestlé CI <span style="font-family:monospace;font-size:10px;color:#8898AA;">NTLC</span></span>
                  <span style="font-family:monospace;font-size:13px;font-weight:500;color:#00D4A8;float:right;">369,60 FCFA</span>
                </div>
              </td></tr>
            </table>
          </td>
          <td style="padding-left:6px;" width="50%">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr><td style="padding:0 0 6px;">
                <div style="background:#142236;border:1px solid #2A4A72;border-radius:4px;padding:10px 14px;">
                  <span style="font-size:13px;color:#C8D8E8;">SIB CI <span style="font-family:monospace;font-size:10px;color:#8898AA;">SIBC</span></span>
                  <span style="font-family:monospace;font-size:13px;font-weight:500;color:#00D4A8;float:right;">374 FCFA</span>
                </div>
              </td></tr>
              <tr><td style="padding:0 0 6px;">
                <div style="background:#142236;border:1px solid #2A4A72;border-radius:4px;padding:10px 14px;">
                  <span style="font-size:13px;color:#C8D8E8;">CIE CI <span style="font-family:monospace;font-size:10px;color:#8898AA;">CIEC</span></span>
                  <span style="font-family:monospace;font-size:13px;font-weight:500;color:#00D4A8;float:right;">~205 FCFA</span>
                </div>
              </td></tr>
              <tr><td style="padding:0 0 6px;">
                <div style="background:#142236;border:1px solid #2A4A72;border-radius:4px;padding:10px 14px;">
                  <span style="font-size:13px;color:#C8D8E8;">Vivo Energy CI <span style="font-family:monospace;font-size:10px;color:#8898AA;">SHEC</span></span>
                  <span style="font-family:monospace;font-size:13px;font-weight:500;color:#00D4A8;float:right;">85,07 FCFA</span>
                </div>
              </td></tr>
              <tr><td>
                <div style="background:#142236;border:1px solid #2A4A72;border-radius:4px;padding:10px 14px;">
                  <span style="font-size:13px;color:#C8D8E8;">TotalEnergies SN <span style="font-family:monospace;font-size:10px;color:#8898AA;">TTLS</span></span>
                  <span style="font-family:monospace;font-size:13px;font-weight:500;color:#00D4A8;float:right;">169,81 FCFA</span>
                </div>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── SECTION 4 : PÉDAGOGIE GAP ── -->
  <tr>
    <td style="background-color:#0A1628;padding:32px 32px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom:1px solid #2A4A72;padding-bottom:16px;margin-bottom:20px;">
        <tr>
          <td valign="top" style="padding-right:14px;" width="30">
            <div style="background:#00D4A8;color:#0A1628;font-family:monospace;font-size:11px;font-weight:600;width:26px;height:26px;border-radius:50%;text-align:center;line-height:26px;">4</div>
          </td>
          <td>
            <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8898AA;margin-bottom:4px;font-family:monospace;">Pédagogie investisseur</div>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#ffffff;line-height:1.3;">Pourquoi Orange CI a « baissé » lundi matin — et ce que ça signifie vraiment</div>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 16px;font-size:14.5px;color:#C8D8E8;line-height:1.75;">Lundi 8 juin, beaucoup d'investisseurs ont observé une baisse marquée du cours d'Orange CI. Aucune mauvaise nouvelle pourtant. Ce mouvement était <strong style="color:#fff;">mécanique, prévisible, et parfaitement normal</strong>. Il s'appelle le <em>gap de détachement</em>.</p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#1E3A5F;border-radius:8px;margin-bottom:16px;">
        <tr>
          <td style="padding:22px 24px;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:#fff;margin-bottom:12px;">Le principe en une phrase</div>
            <p style="margin:0 0 10px;font-size:14px;color:#C8D8E8;line-height:1.7;">Quand une entreprise sort de l'argent de sa trésorerie pour le donner à ses actionnaires, elle vaut mécaniquement moins. Son cours s'ajuste à la baisse du montant distribué.</p>
            <p style="margin:0;font-size:14px;color:#C8D8E8;line-height:1.7;">Vous avez reçu 800 FCFA en cash. La valeur boursière de votre action a baissé de 800 FCFA. <strong style="color:#fff;">Votre patrimoine total n'a pas changé d'un franc.</strong></p>
          </td>
        </tr>
      </table>

      <!-- Calcul flow -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
        <tr>
          <td width="33%" style="padding-right:4px;">
            <div style="background:#0A1628;border:1px solid #2A4A72;border-radius:6px;padding:14px;text-align:center;">
              <div style="font-family:monospace;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#8898AA;margin-bottom:6px;">Cours avant détachement</div>
              <div style="font-family:monospace;font-size:20px;font-weight:500;color:#fff;">15 000</div>
              <div style="font-size:11px;color:#8898AA;margin-top:4px;">FCFA · Av. 5 juin</div>
            </div>
          </td>
          <td width="5%" align="center" style="font-size:18px;color:#2A4A72;padding:0 2px;">→</td>
          <td width="33%" style="padding:0 4px;">
            <div style="background:#0A1628;border:1px solid #2A4A72;border-radius:6px;padding:14px;text-align:center;">
              <div style="font-family:monospace;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#8898AA;margin-bottom:6px;">Dividende distribué</div>
              <div style="font-family:monospace;font-size:20px;font-weight:500;color:#F5A623;">800</div>
              <div style="font-size:11px;color:#8898AA;margin-top:4px;">FCFA · Ex-date 5 juin</div>
            </div>
          </td>
          <td width="5%" align="center" style="font-size:18px;color:#2A4A72;padding:0 2px;">=</td>
          <td width="33%" style="padding-left:4px;">
            <div style="background:#0A1628;border:1px solid #00D4A8;border-radius:6px;padding:14px;text-align:center;">
              <div style="font-family:monospace;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#8898AA;margin-bottom:6px;">Cours ajusté théorique</div>
              <div style="font-family:monospace;font-size:20px;font-weight:500;color:#00D4A8;">14 200</div>
              <div style="font-size:11px;color:#8898AA;margin-top:4px;">FCFA · Ouverture 8 juin</div>
            </div>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 12px;font-size:14px;color:#C8D8E8;line-height:1.7;">Ce même mécanisme se répètera dans les prochains jours :</p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#142236;border:1px solid #2A4A72;border-radius:6px;overflow:hidden;">
        <tr>
          <td style="background:#1E3A5F;padding:9px 16px;border-bottom:1px solid #2A4A72;">
            <span style="font-family:monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8898AA;">Prochains gaps à anticiper</span>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid #2A4A72;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td><span style="font-family:monospace;font-size:11px;color:#00D4A8;">18 juin</span></td>
                <td><span style="font-size:13.5px;color:#C8D8E8;">Cours de <strong style="color:#fff;">Coris Bank International BF</strong> ajusté à la baisse</span></td>
                <td align="right"><span style="font-family:monospace;font-size:13px;font-weight:500;color:#F5A623;">- 900 FCFA</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td><span style="font-family:monospace;font-size:11px;color:#00D4A8;">26 juin</span></td>
                <td><span style="font-size:13.5px;color:#C8D8E8;">Cours de <strong style="color:#fff;">PALM CI</strong> ajusté à la baisse</span></td>
                <td align="right"><span style="font-family:monospace;font-size:13px;font-weight:500;color:#F5A623;">- 501,60 FCFA</span></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── SECTION 5 : BRVM INTERNATIONAL ── -->
  <tr>
    <td style="background-color:#0A1628;padding:32px 32px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom:1px solid #2A4A72;padding-bottom:16px;margin-bottom:20px;">
        <tr>
          <td valign="top" style="padding-right:14px;" width="30">
            <div style="background:#00D4A8;color:#0A1628;font-family:monospace;font-size:11px;font-weight:600;width:26px;height:26px;border-radius:50%;text-align:center;line-height:26px;">5</div>
          </td>
          <td>
            <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8898AA;margin-bottom:4px;font-family:monospace;">Rayonnement international</div>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#ffffff;line-height:1.3;">La BRVM sur la scène mondiale : Forum BERD à Riga</div>
            <div style="font-size:11px;color:#8898AA;font-family:monospace;margin-top:4px;">5 juin 2026 · Lettonie</div>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 14px;font-size:14.5px;color:#C8D8E8;line-height:1.75;">Le 5 juin 2026, le Directeur Général de la BRVM, <strong style="color:#fff;">Dr Edoh Kossi Amenounve</strong>, a présenté le modèle du marché financier régional de l'UEMOA devant les participants du Forum annuel de la <strong style="color:#fff;">Banque Européenne pour la Reconstruction et le Développement (BERD)</strong>, à Riga en Lettonie.</p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#142236;border:1px solid #2A4A72;border-radius:6px;">
        <tr>
          <td style="padding:18px 22px;">
            <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#00D4A8;margin-bottom:12px;">Pourquoi c'est important à long terme</div>
            <p style="margin:0 0 10px;font-size:13.5px;color:#C8D8E8;line-height:1.65;">Chaque exposition de la BRVM sur une tribune internationale de ce calibre élargit l'audience des investisseurs potentiels et renforce la crédibilité institutionnelle du marché.</p>
            <p style="margin:0;font-size:13.5px;color:#C8D8E8;line-height:1.65;">La BRVM se positionne comme un marché émergent de référence en Afrique subsaharienne, avec une capitalisation franchissant les <strong style="color:#fff;">14 000 milliards FCFA</strong> et une progression de <strong style="color:#4ADE80;">+25,26 %</strong> en 2025.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── SECTION 6 : SATELLITE ── -->
  <tr>
    <td style="background-color:#0A1628;padding:32px 32px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-bottom:1px solid #2A4A72;padding-bottom:16px;margin-bottom:20px;">
        <tr>
          <td valign="top" style="padding-right:14px;" width="30">
            <div style="background:#00D4A8;color:#0A1628;font-family:monospace;font-size:11px;font-weight:600;width:26px;height:26px;border-radius:50%;text-align:center;line-height:26px;">6</div>
          </td>
          <td>
            <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8898AA;margin-bottom:4px;font-family:monospace;">À suivre</div>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#ffffff;line-height:1.3;">BOA en forme, cacao et pétrole : le contexte satellite</div>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr style="background-color:#1E3A5F;">
          <th style="padding:9px 12px;text-align:left;font-family:monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#8898AA;border-bottom:1px solid #2A4A72;font-weight:400;" width="40%">Actualité</th>
          <th style="padding:9px 12px;text-align:left;font-family:monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#8898AA;border-bottom:1px solid #2A4A72;font-weight:400;" width="45%">Impact BRVM</th>
          <th style="padding:9px 12px;text-align:left;font-family:monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#8898AA;border-bottom:1px solid #2A4A72;font-weight:400;" width="15%">Niveau</th>
        </tr>
        <tr style="border-bottom:1px solid #2A4A72;">
          <td style="padding:12px 12px;font-size:13px;color:#C8D8E8;vertical-align:top;"><strong style="color:#fff;">Résultats Bank of Africa T1 2026</strong><br><span style="font-size:11px;color:#8898AA;">+9 % de bénéfice</span></td>
          <td style="padding:12px 12px;font-size:13px;color:#C8D8E8;vertical-align:top;">Sentiment positif sur BOAB, BOAC, BOABF, BOAS, BOAN. Ces valeurs figurent parmi les meilleurs rendements dividendes de la saison.</td>
          <td style="padding:12px 12px;vertical-align:top;"><span style="font-size:11px;color:#4ADE80;font-weight:500;">Moyen +</span></td>
        </tr>
        <tr style="border-bottom:1px solid #2A4A72;">
          <td style="padding:12px 12px;font-size:13px;color:#C8D8E8;vertical-align:top;"><strong style="color:#fff;">Prix du cacao &amp; caoutchouc</strong><br><span style="font-size:11px;color:#8898AA;">Pas de choc majeur</span></td>
          <td style="padding:12px 12px;font-size:13px;color:#C8D8E8;vertical-align:top;">Influence indirecte via l'économie ivoirienne — SAPH CI, SOGB CI, PALM CI.</td>
          <td style="padding:12px 12px;vertical-align:top;"><span style="font-size:11px;color:#F5A623;">Moyen / Faible</span></td>
        </tr>
        <tr>
          <td style="padding:12px 12px;font-size:13px;color:#C8D8E8;vertical-align:top;"><strong style="color:#fff;">Tensions géopolitiques Moyen-Orient</strong><br><span style="font-size:11px;color:#8898AA;">Pression latente pétrole</span></td>
          <td style="padding:12px 12px;font-size:13px;color:#C8D8E8;vertical-align:top;">Risque inflationniste surveillé par la BCEAO. À monitorer pour Vivo Energy et TotalEnergies CI/SN.</td>
          <td style="padding:12px 12px;vertical-align:top;"><span style="font-size:11px;color:#8898AA;">Indirect</span></td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── SYNTHÈSE ── -->
  <tr>
    <td style="background-color:#0A1628;padding:32px 32px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,#1E3A5F 0%,#0E1E34 100%);border:1px solid #2A4A72;border-radius:8px;">
        <tr>
          <td style="padding:28px 28px;">
            <div style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#00D4A8;margin-bottom:10px;font-family:monospace;">Ce qu'il faut retenir</div>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:16px;line-height:1.3;">Une semaine neutre à légèrement positive, sur des fondamentaux solides</div>
            <p style="margin:0 0 12px;font-size:14px;color:#C8D8E8;line-height:1.75;">La décision de la BCEAO confirme une politique monétaire accommodante dans une zone en croissance. La saison des dividendes entre dans sa dernière ligne droite avec trois paiements encore à venir avant la fin juin.</p>
            <p style="margin:0 0 20px;font-size:14px;color:#C8D8E8;line-height:1.75;">Les prochains gaps de détachement — Coris Bank le 18 juin, PALM CI le 26 juin — ne sont pas des alertes : ce sont des entreprises qui tiennent leurs engagements. Contextualisez-les avant d'interpréter les mouvements de cours.</p>
            <!-- Dates clés pills -->
            <div style="margin-bottom:6px;"><span style="display:inline-block;background:rgba(0,212,168,.12);border:1px solid rgba(0,212,168,.25);border-radius:20px;padding:5px 12px;font-family:monospace;font-size:11px;color:#00D4A8;margin:4px 4px 4px 0;">15 juin — Paiement ONATEL BF (145,32 FCFA)</span></div>
            <div style="margin-bottom:6px;"><span style="display:inline-block;background:rgba(0,212,168,.12);border:1px solid rgba(0,212,168,.25);border-radius:20px;padding:5px 12px;font-family:monospace;font-size:11px;color:#00D4A8;margin:4px 4px 4px 0;">18 juin — Ex-date Coris Bank (900 FCFA)</span></div>
            <div style="margin-bottom:6px;"><span style="display:inline-block;background:rgba(0,212,168,.12);border:1px solid rgba(0,212,168,.25);border-radius:20px;padding:5px 12px;font-family:monospace;font-size:11px;color:#00D4A8;margin:4px 4px 4px 0;">26 juin — Ex-date PALM CI (501,60 FCFA)</span></div>
            <div><span style="display:inline-block;background:rgba(0,212,168,.12);border:1px solid rgba(0,212,168,.25);border-radius:20px;padding:5px 12px;font-family:monospace;font-size:11px;color:#00D4A8;margin:4px 4px 4px 0;">29 juin — Paiement PALM CI</span></div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── CTA : TOUTES LES ACTUALITÉS ── -->
  <tr>
    <td style="background-color:#0A1628;padding:28px 32px 0;text-align:center;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#142236;border:1px solid #2A4A72;border-radius:8px;">
        <tr>
          <td style="padding:24px 28px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:#8898AA;font-family:monospace;letter-spacing:0.08em;text-transform:uppercase;">Restez informé</p>
            <p style="margin:0 0 18px;font-size:15px;color:#C8D8E8;line-height:1.6;">Retrouvez toutes les actualités des marchés BRVM, les analyses et les dernières nouvelles directement sur notre plateforme.</p>
            <a href="https://www.africbourse.com/news" style="display:inline-block;background:#00D4A8;color:#0A1628;font-size:14px;font-weight:700;text-decoration:none;padding:13px 32px;border-radius:6px;letter-spacing:0.02em;">Consulter toutes les actualités</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── FOOTER ── -->
  <tr>
    <td style="background-color:#070e1c;border-radius:0 0 10px 10px;padding:24px 32px;margin-top:28px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
        <tr>
          <td>
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:#00D4A8;">Afri</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:#ffffff;">Bourse</span>
          </td>
          <td align="right">
            <a href="https://www.africbourse.com/news" style="display:inline-block;margin-left:12px;font-size:11px;color:#8898B0;text-decoration:none;">Actualités</a>
            <a href="https://www.africbourse.com" style="display:inline-block;margin-left:12px;font-size:11px;color:#8898B0;text-decoration:none;">Site web</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 12px;font-size:11px;line-height:1.6;color:#8898B0;">
        <strong style="color:#C4D5E8;">Sources :</strong> BCEAO · BOC BRVM · brvm.org · SikaFinance · Financial Afrik
      </p>
      <p style="margin:0 0 14px;font-size:10px;line-height:1.6;color:#5A6A80;">
        Cette newsletter est fournie à titre strictement informatif et éducatif. Elle ne constitue pas un conseil en investissement, une recommandation d'achat ou de vente de valeurs mobilières. Les données de marché, dates de détachement et montants de dividendes sont indicatifs et peuvent évoluer. Consultez les avis officiels de la BRVM et votre SGI avant toute décision d'investissement.
      </p>
      <p style="margin:0;font-size:10px;color:#5A6A80;">
        Vous recevez cet email car vous êtes inscrit sur AfriBourse. &nbsp;·&nbsp;
        <a href="https://www.africbourse.com/news" style="color:#8898B0;text-decoration:underline;">Toutes les actualités</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `${firstName}, votre résumé marchés BRVM — Semaine du 8 au 14 juin 2026`,
    html,
    text: `Bonjour ${firstName},\n\nVoici votre résumé des marchés BRVM pour la semaine du 8 au 14 juin 2026.\n\n📰 Consultez toutes nos actualités sur : https://www.africbourse.com/news\n\n──────────────────────────────────────\nL'ESSENTIEL DE LA SEMAINE\n──────────────────────────────────────\n\n1. BCEAO — Taux inchangés (3e fois consécutive)\nTaux injection : 3,00 % · Prêt marginal : 5,00 % · Réserves : 3,00 %\nCroissance UEMOA : +6,1 % T1 2026 · Inflation : -0,2 % (quasi nulle)\n\n2. PERFORMANCE BRVM\nS-1 (1–5 juin) : BRVM Composite +2,75 %, BRVM 30 +2,92 %\nLundi 8 juin : -0,13 % (correction mécanique Orange CI ex-dividende)\n\n3. DIVIDENDES JUIN\n• 1er juin — SICABLE CI (CABC) : 152,02 FCFA — Versé\n• 8 juin — Orange CI (ORAC) : 800,00 FCFA — Versé\n• 15 juin — ONATEL BF (ONTBF) : 145,32 FCFA — Cette semaine\n• 19 juin — Coris Bank International (CBIBF) : 900,00 FCFA — Ex-date 18 juin (fenêtre ouverte)\n• 29 juin — PALM CI (PALC) : 501,60 FCFA — Ex-date 26 juin (fenêtre ouverte)\n\nAttendus en juillet : SGBC 1 646 FCFA · SMBC 704 FCFA · SDCC 462 FCFA · NTLC 369,60 FCFA · SIBC 374 FCFA · CIEC ~205 FCFA\n\n4. PÉDAGOGIE — GAP DE DÉTACHEMENT\nOrange CI n'a pas « baissé » — la baisse est mécanique :\nCours avant : 15 000 FCFA - Dividende 800 FCFA = Cours ajusté 14 200 FCFA\nVotre patrimoine total n'a pas changé d'un franc.\n\n5. BRVM À RIGA\nLe DG Dr Edoh Kossi Amenounve a présenté la BRVM au Forum BERD (5 juin, Lettonie).\nCapitalisation : >14 000 Mds FCFA · Performance 2025 : +25,26 %\n\n6. À SUIVRE\n• BOA T1 2026 : +9 % de bénéfice → positif pour BOAB/BOAC/BOABF\n• Cacao & caoutchouc : impact indirect sur SAPH CI, SOGB CI, PALM CI\n• Tensions Moyen-Orient : risque pétrolier latent à surveiller\n\n──────────────────────────────────────\nDATES CLÉS\n──────────────────────────────────────\n→ 15 juin : Paiement ONATEL BF (145,32 FCFA)\n→ 18 juin : Ex-date Coris Bank (900 FCFA) — dernière chance !\n→ 19 juin : Paiement Coris Bank\n→ 26 juin : Ex-date PALM CI (501,60 FCFA) — dernière chance !\n→ 29 juin : Paiement PALM CI\n\nBonne lecture,\nL'équipe AfriBourse\nhttps://www.africbourse.com/news\n\nCet email est fourni à titre informatif uniquement — il ne constitue pas un conseil en investissement.`,
  });
}

// ============================================================
// EMAIL : Nouveau post dans une rubrique de communauté
// ============================================================

const SECTION_EMAIL_LABELS: Record<string, { label: string; emoji: string }> = {
  DEAL_FLOW: { label: 'Deal Flow', emoji: '📊' },
  RECAPS_REPLAYS: { label: 'Récaps & Replays', emoji: '🎓' },
  MES_ANALYSES: { label: 'Mes analyses', emoji: '📈' },
  EXERCICES_CHALLENGES: { label: 'Exercices & Challenges', emoji: '🎯' },
  GENERAL: { label: 'Général', emoji: '💬' },
  ANNONCES: { label: 'Annonces', emoji: '📢' },
};

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

interface BroadcastCommunityPostEmailParams {
  communityId: string;
  communityName: string;
  communitySlug: string;
  sectionKey: string;
  postTitle: string | null;
  postContent: string;
  authorName: string;
  excludeUserId: string;
}

/**
 * Envoie un email à tous les membres d'une communauté (sauf l'auteur) lors d'un
 * nouveau post dans une rubrique. Envoi séquentiel en arrière-plan (non bloquant).
 */
export async function broadcastCommunityPostEmail(params: BroadcastCommunityPostEmailParams): Promise<void> {
  const { prisma } = await import('../config/database');

  const members = await prisma.communityMember.findMany({
    where: {
      community_id: params.communityId,
      user_id: { not: params.excludeUserId },
      notifications_enabled: true,
    },
    select: {
      user: { select: { email: true, name: true } },
    },
  });

  const recipients = members
    .map((m) => ({ email: m.user?.email, name: m.user?.name || '' }))
    .filter((r): r is { email: string; name: string } => !!r.email);

  if (recipients.length === 0) return;

  const section = SECTION_EMAIL_LABELS[params.sectionKey] ?? { label: 'Communauté', emoji: '📣' };
  const url = `${config.app.frontendUrl}/communities/${params.communitySlug}`;
  const excerpt = stripHtml(params.postContent).slice(0, 280);
  const heading = params.postTitle || `${section.emoji} ${section.label}`;
  const subject = `${section.emoji} ${params.communityName} — ${params.postTitle || `Nouveau post dans ${section.label}`}`;

  for (const r of recipients) {
    const html = `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
        <div style="background: linear-gradient(135deg,#4f46e5,#7c3aed); padding: 24px; border-radius: 12px 12px 0 0; color: #fff;">
          <div style="font-size: 13px; opacity: .9;">${section.emoji} ${section.label} · ${params.communityName}</div>
          <h1 style="margin: 8px 0 0; font-size: 20px;">${heading}</h1>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
          <p style="color:#374151; line-height:1.6; margin-top:0;">${excerpt}${excerpt.length >= 280 ? '…' : ''}</p>
          <p style="font-size: 13px; color:#6b7280;">Publié par ${params.authorName}</p>
          <a href="${url}" style="display:inline-block; margin-top: 8px; background:#4f46e5; color:#fff; text-decoration:none; padding: 12px 24px; border-radius: 10px; font-weight:600;">
            Voir la publication
          </a>
          <p style="margin-top: 24px; font-size: 12px; color:#9ca3af;">
            Vous recevez cet email car vous êtes membre de ${params.communityName} sur AfriBourse.<br/>
            Questions ? Contactez-nous à contact@africbourse.com
          </p>
        </div>
      </div>`;

    const text = `${section.emoji} ${section.label} — ${params.communityName}\n\n${heading}\n\n${excerpt}\n\nPublié par ${params.authorName}\n\nVoir : ${url}`;

    try {
      await sendEmail({ to: r.email, subject, html, text });
    } catch (err) {
      log.error(`[EMAIL] Échec envoi post communauté à ${r.email}:`, err);
    }
  }
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
  sendWebinarLaunchEmail,
  sendWebinarConfirmationEmail,
  sendWebinarPaymentConfirmEmail,
  sendWebinarZoomLinkEmail,
  sendReengagementEmail0,
  sendReengagementEmail1,
  sendReengagementEmail2,
  sendReengagementEmail3,
  sendInvestisseurPlusPromoEmail,
  sendFailedPaymentReengagementEmail,
  sendPackParcoursBRVMEmail,
  sendDangoteIPONewsletterEmail,
  sendWeeklyNewsletterJuin2026Email,
  sendInvitationNouveauxInscritsEmail,
  sendEmail,
};

// ─────────────────────────────────────────────────────────────────────────────
// Email invitation Parcours — Nouveaux inscrits (compte < 30 jours, plan free)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendInvitationNouveauxInscritsEmail({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const firstName = (name && name.trim()) ? name.trim().split(' ')[0] : 'Investisseur';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Le marché BRVM explose — AfriBourse</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4F8;font-family:'Segoe UI',Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#F0F4F8;">
<tr><td align="center" style="padding:24px 12px 40px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:620px;">

  <!-- ── HEADER ── -->
  <tr>
    <td style="background-color:#0A1628;border-radius:10px 10px 0 0;padding:24px 32px 20px;border-bottom:2px solid #00D4A8;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#ffffff;">Afri</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#00D4A8;">Bourse</span>
            <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8898AA;margin-top:4px;">Investir mieux sur la BRVM</div>
          </td>
          <td align="right" valign="middle">
            <span style="display:inline-block;background:rgba(0,212,168,.15);border:1px solid rgba(0,212,168,.3);color:#00D4A8;font-size:11px;font-weight:600;padding:5px 12px;border-radius:20px;">Parcours Investisseur</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── HERO ── -->
  <tr>
    <td style="background-color:#0A1628;padding:32px 32px 28px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;margin-bottom:16px;">Le marché BRVM explose&nbsp;—<br>et vous n'êtes pas encore positionné</div>
      <p style="margin:0;font-size:14px;color:#8898AA;line-height:1.6;font-family:monospace;letter-spacing:0.02em;">La bourse africaine progresse de 99&nbsp;% sur 5 ans. Voici comment en profiter avant les autres.</p>
    </td>
  </tr>

  <!-- ── CORPS ── -->
  <tr>
    <td style="background-color:#ffffff;padding:32px 32px 8px;">
      <p style="margin:0 0 16px;font-size:15.5px;color:#1E293B;line-height:1.75;">Bonjour <strong>${firstName}</strong>,</p>

      <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.75;">Vous l'avez sûrement senti : quelque chose se passe sur les marchés africains en ce moment. Et vous avez raison de vous y intéresser maintenant.</p>

      <!-- Stat block -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,#0A1628 0%,#1E3A5F 100%);border-radius:8px;margin:0 0 20px;">
        <tr>
          <td style="padding:24px 28px;">
            <div style="font-family:Georgia,serif;font-size:38px;font-weight:900;color:#00D4A8;line-height:1;margin-bottom:8px;">+99 %</div>
            <div style="font-size:14px;color:#C8D8E8;line-height:1.5;">La BRVM sur les <strong style="color:#fff;">5 dernières années</strong>.<br>Pendant que la plupart des épargnants laissaient leur argent dormir.</div>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.75;">Le marché boursier régional — celui de vos 8 pays UEMOA — est en pleine expansion. De nouvelles entreprises s'introduisent. Les volumes augmentent. Et pourtant, <strong>moins de 1&nbsp;% des épargnants de la zone y participent.</strong></p>

      <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.75;">C'est exactement le moment où il faut se positionner : quand le marché monte, mais <strong>avant que tout le monde s'y intéresse.</strong></p>

      <div style="border-left:3px solid #E2E8F0;padding-left:18px;margin:0 0 24px;">
        <p style="margin:0 0 12px;font-size:15px;color:#64748B;line-height:1.75;font-style:italic;">Le vrai obstacle n'est pas l'argent. C'est de savoir par où commencer.</p>
        <p style="margin:0;font-size:14px;color:#94A3B8;line-height:1.7;">La plupart des gens qui veulent investir sur la BRVM restent bloqués à la même étape : ils ne savent pas comment analyser une action, comment ouvrir un compte, ni comment passer leur premier ordre. Résultat : ils attendent. Et pendant qu'ils attendent, le marché avance sans eux.</p>
      </div>

      <p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.75;">C'est précisément pour ça que nous avons créé le <strong>Parcours Investisseur BRVM</strong>.</p>
      <p style="margin:0 0 24px;font-size:14.5px;color:#64748B;line-height:1.7;">Un accompagnement de 90 jours qui vous fait passer de zéro à votre première action achetée — avec des experts à vos côtés à chaque étape.</p>
    </td>
  </tr>

  <!-- ── CE QUE VOUS OBTENEZ ── -->
  <tr>
    <td style="background-color:#ffffff;padding:0 32px 28px;">
      <div style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:24px 24px;">
        <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0A1628;margin-bottom:18px;">Ce que vous obtenez avec le Parcours</div>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr><td style="padding:0 0 13px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td valign="top" width="32" style="padding-top:1px;"><span style="font-size:18px;">🎓</span></td>
                <td><span style="font-size:14.5px;color:#1E293B;line-height:1.5;"><strong>5 webinaires live</strong> avec des analystes qui connaissent la BRVM</span></td>
              </tr>
            </table>
          </td></tr>
          <tr><td style="padding:0 0 13px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td valign="top" width="32" style="padding-top:1px;"><span style="font-size:18px;">📋</span></td>
                <td><span style="font-size:14.5px;color:#1E293B;line-height:1.5;"><strong>Un plan d'action personnalisé</strong> après chaque session</span></td>
              </tr>
            </table>
          </td></tr>
          <tr><td style="padding:0 0 13px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td valign="top" width="32" style="padding-top:1px;"><span style="font-size:18px;">📊</span></td>
                <td><span style="font-size:14.5px;color:#1E293B;line-height:1.5;"><strong>Le Deal Flow chaque semaine</strong> — les valeurs à surveiller</span></td>
              </tr>
            </table>
          </td></tr>
          <tr><td style="padding:0 0 13px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td valign="top" width="32" style="padding-top:1px;"><span style="font-size:18px;">👥</span></td>
                <td><span style="font-size:14.5px;color:#1E293B;line-height:1.5;"><strong>Une communauté d'investisseurs</strong> qui apprennent avec vous</span></td>
              </tr>
            </table>
          </td></tr>
          <tr><td style="padding:0 0 13px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td valign="top" width="32" style="padding-top:1px;"><span style="font-size:18px;">🏦</span></td>
                <td><span style="font-size:14.5px;color:#1E293B;line-height:1.5;"><strong>L'accompagnement</strong> pour ouvrir votre compte et acheter votre première action</span></td>
              </tr>
            </table>
          </td></tr>
          <tr><td>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td valign="top" width="32" style="padding-top:1px;"><span style="font-size:18px;">🏆</span></td>
                <td><span style="font-size:14.5px;color:#1E293B;line-height:1.5;"><strong>Votre Certificat Investisseur BRVM</strong> Niveau 1</span></td>
              </tr>
            </table>
          </td></tr>
        </table>

        <div style="margin-top:18px;padding-top:16px;border-top:1px solid #E2E8F0;text-align:center;">
          <span style="font-size:13px;color:#64748B;">À partir de </span><span style="font-family:monospace;font-size:20px;font-weight:700;color:#0A1628;">35 000 XOF</span>
          <div style="font-size:12px;color:#94A3B8;margin-top:4px;">Un investissement dans une compétence qui vous servira toute votre vie.</div>
        </div>
      </div>
    </td>
  </tr>

  <!-- ── URGENCE ── -->
  <tr>
    <td style="background-color:#ffffff;padding:0 32px 28px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#FFF8ED;border:1px solid #FDE68A;border-radius:8px;">
        <tr>
          <td style="padding:20px 22px;">
            <div style="font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#92400E;margin-bottom:10px;">⏰ Pourquoi maintenant, et pas dans 6 mois ?</div>
            <p style="margin:0 0 10px;font-size:14px;color:#78350F;line-height:1.7;">Parce que les meilleures opportunités se saisissent quand le marché est en mouvement — pas après. Ceux qui se forment aujourd'hui seront positionnés quand les autres commenceront à peine à s'y intéresser.</p>
            <p style="margin:0;font-size:14px;color:#92400E;line-height:1.7;font-weight:500;">La prochaine cohorte démarre bientôt, et les places sont <strong>limitées à 20 personnes</strong> pour garantir la qualité de l'accompagnement.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ── CTA ── -->
  <tr>
    <td style="background-color:#ffffff;padding:0 32px 36px;text-align:center;">
      <a href="https://www.africbourse.com/webinaires" style="display:inline-block;background-color:#00D4A8;color:#0A1628;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:8px;letter-spacing:0.01em;">Je réserve ma place →</a>
      <div style="margin-top:10px;font-size:12px;color:#94A3B8;">Préinscription sans paiement · Vous décidez ensuite</div>
    </td>
  </tr>

  <!-- ── SÉPARATEUR ── -->
  <tr>
    <td style="background-color:#ffffff;padding:0 32px 32px;">
      <div style="border-top:1px solid #E2E8F0;padding-top:24px;">
        <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.75;font-style:italic;text-align:center;">Le marché n'attend pas. Mais nous, on vous accompagne.</p>
        <p style="margin:0;font-size:14px;color:#1E293B;line-height:1.6;"><strong>Curtis Zirignon</strong><br><span style="color:#64748B;font-size:13px;">Fondateur — Afribourse</span></p>
      </div>
    </td>
  </tr>

  <!-- ── PS ── -->
  <tr>
    <td style="background-color:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;">
      <p style="margin:0;font-size:12.5px;color:#64748B;line-height:1.7;"><strong style="color:#475569;">P.S.</strong> — Le chiffre de 99&nbsp;% sur 5 ans n'est pas une promesse de rendement futur. C'est un fait passé qui montre une chose : ce marché mérite votre attention. Ceux qui se forment maintenant prennent une longueur d'avance.</p>
    </td>
  </tr>

  <!-- ── FOOTER ── -->
  <tr>
    <td style="background-color:#0A1628;border-radius:0 0 10px 10px;padding:20px 32px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <span style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#00D4A8;">Afri</span><span style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#fff;">Bourse</span>
          </td>
          <td align="right">
            <a href="https://www.africbourse.com/webinaires" style="font-size:11px;color:#8898AA;text-decoration:none;margin-left:14px;">Webinaires</a>
            <a href="https://www.africbourse.com" style="font-size:11px;color:#8898AA;text-decoration:none;margin-left:14px;">Site web</a>
          </td>
        </tr>
      </table>
      <p style="margin:12px 0 0;font-size:10px;color:#5A6A80;line-height:1.6;">Vous recevez cet email car vous êtes inscrit sur AfriBourse (compte créé il y a moins de 30 jours). Cet email est fourni à titre informatif uniquement et ne constitue pas un conseil en investissement.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: '📈 Le marché BRVM explose — et vous n\'êtes pas encore positionné',
    html,
    text: `Bonjour ${firstName},\n\nVous l'avez sûrement senti : quelque chose se passe sur les marchés africains en ce moment.\n\nLa BRVM a progressé de près de 99% sur les 5 dernières années. Pendant que la plupart des épargnants laissaient leur argent dormir.\n\nC'est exactement le moment où il faut se positionner : quand le marché monte, mais avant que tout le monde s'y intéresse.\n\nNous avons créé le Parcours Investisseur BRVM — un accompagnement de 90 jours qui vous fait passer de zéro à votre première action achetée.\n\nCe que vous obtenez :\n• 5 webinaires live avec des analystes BRVM\n• Un plan d'action personnalisé après chaque session\n• Le Deal Flow chaque semaine\n• Une communauté d'investisseurs\n• L'accompagnement pour ouvrir votre compte\n• Votre Certificat Investisseur BRVM Niveau 1\n\nÀ partir de 35 000 XOF.\n\n→ Réservez votre place (préinscription gratuite) : https://www.africbourse.com/webinaires\n\nLa prochaine cohorte démarre bientôt. Places limitées à 20 personnes.\n\nCurtis Zirignon\nFondateur — Afribourse\n\nP.S. — Le chiffre de 99% sur 5 ans n'est pas une promesse de rendement futur. C'est un fait passé. Ceux qui se forment maintenant prennent une longueur d'avance.`,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAILS AUTOMATISÉS — SEGMENTS COMPORTEMENTAUX
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Segment B — Apprenants (modules complétés, 0 transactions) ───────────────

export async function sendSegmentBEmail({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const firstName = (name && name.trim()) ? name.trim().split(' ')[0] : 'Investisseur';
  const marketsUrl = `${config.app.frontendUrl}/markets`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tu connais la théorie — AfriBourse</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4F8;font-family:'Segoe UI',Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#F0F4F8;">
<tr><td align="center" style="padding:24px 12px 40px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:620px;">

  <tr>
    <td style="background-color:#0A1628;border-radius:10px 10px 0 0;padding:24px 32px 20px;border-bottom:2px solid #00D4A8;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#ffffff;">Afri</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#00D4A8;">Bourse</span>
            <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8898AA;margin-top:4px;">Investir mieux sur la BRVM</div>
          </td>
          <td align="right" valign="middle">
            <span style="display:inline-block;background:rgba(0,212,168,.15);border:1px solid rgba(0,212,168,.3);color:#00D4A8;font-size:11px;font-weight:600;padding:5px 12px;border-radius:20px;">Formation → Action</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="background:#1a2942;padding:28px 32px 24px;">
      <div style="font-size:32px;margin-bottom:10px;">📚→📈</div>
      <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;">${firstName}, tu as les bases.<br>Il manque juste une chose.</h1>
      <p style="margin:0;font-size:15px;color:#8898AA;line-height:1.6;">Tu as complété ta formation sur AfriBourse. C'est impressionnant — la majorité des inscrits ne va pas jusqu'au bout. Mais la vraie frontière entre un apprenant et un investisseur, c'est une seule action : avoir agi.</p>
    </td>
  </tr>

  <tr>
    <td style="background:#ffffff;padding:32px 32px 8px;">
      <p style="margin:0 0 16px;font-size:15px;color:#1a2942;line-height:1.7;">Le simulateur AfriBourse est là exactement pour ça : <strong>faire ton premier achat sans risquer un seul franc</strong>. Tu choisis une action BRVM, tu entres un montant virtuel, et tu regardes ton portefeuille prendre vie en temps réel.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
        <tr>
          <td style="background:#F0FDF4;border-left:4px solid #00D4A8;border-radius:0 8px 8px 0;padding:14px 18px;">
            <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;"><strong>Ce que font les meilleurs investisseurs dès le départ :</strong><br>
            ▸ Ils posent une hypothèse ("je pense que SNTS va monter")<br>
            ▸ Ils l'investissent (même virtuellement)<br>
            ▸ Ils observent, ajustent, apprennent</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:15px;color:#1a2942;line-height:1.7;">Tu as déjà l'analyse. Maintenant, mets-la à l'épreuve.</p>
    </td>
  </tr>

  <tr>
    <td style="background:#ffffff;padding:16px 32px 32px;text-align:center;">
      <a href="${marketsUrl}" style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#00D4A8,#00B894);color:#0A1628;text-decoration:none;border-radius:10px;font-weight:800;font-size:15px;">Simuler mon 1er trade →</a>
      <p style="margin:16px 0 0;font-size:12px;color:#8898AA;">Portefeuille virtuel · Aucun risque · 47 titres BRVM disponibles</p>
    </td>
  </tr>

  <tr>
    <td style="background:#F8FAFC;border-radius:0 0 10px 10px;padding:20px 32px;border-top:1px solid #E2E8F0;">
      <p style="margin:0 0 8px;font-size:13px;color:#374151;line-height:1.6;">— <strong>Curtis Zirignon</strong>, Fondateur AfriBourse</p>
      <p style="margin:0;font-size:11px;color:#9CA3AF;">Vous recevez cet email car vous avez complété au moins un module de formation sur AfriBourse. Cet email ne constitue pas un conseil en investissement.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `${firstName}, tu as les bases — il manque juste une chose`,
    html,
    text: `${firstName},\n\nTu as complété ta formation sur AfriBourse. C'est impressionnant.\n\nMais la vraie frontière entre un apprenant et un investisseur, c'est une seule action : avoir agi.\n\nFais ton premier achat simulé maintenant — sans risquer un franc :\n${marketsUrl}\n\n47 titres BRVM disponibles. Portefeuille virtuel. Résultats en temps réel.\n\n— Curtis Zirignon\nFondateur AfriBourse · africbourse.com`,
  });
}

// ─── Segment C — Impulsifs (transactions OK, 0 modules complétés) ─────────────

export async function sendSegmentCEmail({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const firstName = (name && name.trim()) ? name.trim().split(' ')[0] : 'Investisseur';
  const learnUrl    = `${config.app.frontendUrl}/learn`;
  const webinairesUrl = `${config.app.frontendUrl}/webinaires`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tes trades sont bons — AfriBourse</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4F8;font-family:'Segoe UI',Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#F0F4F8;">
<tr><td align="center" style="padding:24px 12px 40px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:620px;">

  <tr>
    <td style="background-color:#0A1628;border-radius:10px 10px 0 0;padding:24px 32px 20px;border-bottom:2px solid #7C3AED;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#ffffff;">Afri</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#00D4A8;">Bourse</span>
            <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8898AA;margin-top:4px;">Investir mieux sur la BRVM</div>
          </td>
          <td align="right" valign="middle">
            <span style="display:inline-block;background:rgba(124,58,237,.2);border:1px solid rgba(124,58,237,.4);color:#A78BFA;font-size:11px;font-weight:600;padding:5px 12px;border-radius:20px;">Instinct → Méthode</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="background:linear-gradient(135deg,#1a1040,#0d0626);padding:28px 32px 24px;">
      <div style="font-size:32px;margin-bottom:10px;">⚡</div>
      <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;">${firstName}, tu as déjà l'instinct.<br>Voici comment le rendre redoutable.</h1>
      <p style="margin:0;font-size:15px;color:#A78BFA;line-height:1.6;">Tu as déjà passé un ordre sur AfriBourse. C'est plus que 90% des inscrits sur n'importe quelle plateforme d'apprentissage.</p>
    </td>
  </tr>

  <tr>
    <td style="background:#ffffff;padding:32px 32px 8px;">
      <p style="margin:0 0 16px;font-size:15px;color:#1a2942;line-height:1.7;">Mais voici ce que la plupart des traders autodidactes ne voient pas : <strong>sans méthode, un bon trade est souvent de la chance. Avec la méthode, c'est un système reproductible.</strong></p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
        <tr>
          <td width="50%" style="padding-right:8px;vertical-align:top;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="background:#F5F3FF;border-radius:10px;padding:16px;">
                  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#5B21B6;">Sans formation</p>
                  <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.5;">→ Trade basé sur l'intuition<br>→ Aucun critère d'entrée/sortie<br>→ Résultats aléatoires</p>
                </td>
              </tr>
            </table>
          </td>
          <td width="50%" style="padding-left:8px;vertical-align:top;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="background:#F0FDF4;border-radius:10px;padding:16px;">
                  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#166534;">Avec la méthode</p>
                  <p style="margin:0;font-size:13px;color:#166534;line-height:1.5;">→ Trade basé sur l'analyse<br>→ Plan d'action clair<br>→ Résultats reproductibles</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:15px;color:#1a2942;line-height:1.7;">La formation est gratuite sur AfriBourse. Les webinaires commencent le 4 juillet. Les deux ensemble = un avantage que peu d'investisseurs ont sur la BRVM.</p>
    </td>
  </tr>

  <tr>
    <td style="background:#ffffff;padding:16px 32px 32px;text-align:center;">
      <a href="${learnUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:800;font-size:14px;margin-bottom:10px;">Démarrer ma formation →</a>
      <br>
      <a href="${webinairesUrl}" style="display:inline-block;padding:12px 28px;background:#F5F3FF;color:#5B21B6;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;border:1px solid #DDD6FE;">Voir les webinaires →</a>
      <p style="margin:16px 0 0;font-size:12px;color:#8898AA;">Formation en accès libre · Webinaires à partir de 35 000 XOF</p>
    </td>
  </tr>

  <tr>
    <td style="background:#F8FAFC;border-radius:0 0 10px 10px;padding:20px 32px;border-top:1px solid #E2E8F0;">
      <p style="margin:0 0 8px;font-size:13px;color:#374151;line-height:1.6;">— <strong>Curtis Zirignon</strong>, Fondateur AfriBourse</p>
      <p style="margin:0;font-size:11px;color:#9CA3AF;">Vous recevez cet email car vous avez effectué un trade simulé sur AfriBourse. Cet email ne constitue pas un conseil en investissement.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `${firstName}, tes trades sont bons — voici comment les rendre redoutables`,
    html,
    text: `${firstName},\n\nTu as déjà passé un ordre sur AfriBourse. C'est plus que 90% des inscrits.\n\nMais sans méthode, un bon trade est souvent de la chance. Avec la méthode, c'est un système reproductible.\n\nDémarre ta formation (accès libre) :\n${learnUrl}\n\nVoir les prochains webinaires (à partir de 35 000 XOF) :\n${webinairesUrl}\n\n— Curtis Zirignon\nFondateur AfriBourse · africbourse.com`,
  });
}

// ─── Segment D récents — Dormants < 30 jours (0 modules, 0 transactions) ──────

export async function sendSegmentDRecentEmail({
  email,
  name,
}: { email: string; name: string }): Promise<void> {
  const firstName = (name && name.trim()) ? name.trim().split(' ')[0] : 'Investisseur';
  const learnUrl = `${config.app.frontendUrl}/learn`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ton compte AfriBourse t'attend</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4F8;font-family:'Segoe UI',Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#F0F4F8;">
<tr><td align="center" style="padding:24px 12px 40px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:620px;">

  <tr>
    <td style="background-color:#0A1628;border-radius:10px 10px 0 0;padding:24px 32px 20px;border-bottom:2px solid #F59E0B;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#ffffff;">Afri</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#00D4A8;">Bourse</span>
            <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8898AA;margin-top:4px;">Investir mieux sur la BRVM</div>
          </td>
          <td align="right" valign="middle">
            <span style="display:inline-block;background:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.3);color:#F59E0B;font-size:11px;font-weight:600;padding:5px 12px;border-radius:20px;">1er pas</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="background:linear-gradient(135deg,#1c1408,#0d0d00);padding:28px 32px 24px;">
      <div style="font-size:32px;margin-bottom:10px;">🚀</div>
      <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;">${firstName}, ton compte AfriBourse t'attend.</h1>
      <p style="margin:0;font-size:15px;color:#FCD34D;line-height:1.6;">Tu t'es inscrit il y a quelques jours. Ce que tu ne sais peut-être pas encore…</p>
    </td>
  </tr>

  <tr>
    <td style="background:#ffffff;padding:32px 32px 8px;">
      <p style="margin:0 0 16px;font-size:15px;color:#1a2942;line-height:1.7;">Des centaines d'investisseurs ont commencé exactement comme toi — <strong>sans expérience, sans argent à risquer</strong>. Aujourd'hui certains ont doublé leur mise simulée sur la BRVM. La différence ? Ils ont commencé par le premier module.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:16px;">
        <tr>
          <td style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#92400E;">Ce qui t'attend dans le Module 1 :</p>
            <p style="margin:0;font-size:14px;color:#78350F;line-height:1.7;">▸ Comment fonctionne la BRVM (en 8 minutes)<br>▸ Pourquoi investir en Afrique de l'Ouest maintenant<br>▸ Ton premier achat simulé — guidé pas à pas</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:15px;color:#1a2942;line-height:1.7;">8 minutes. C'est tout ce qu'il faut pour que ton compte commence à avoir du sens.</p>
    </td>
  </tr>

  <tr>
    <td style="background:#ffffff;padding:16px 32px 32px;text-align:center;">
      <a href="${learnUrl}" style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#F59E0B,#D97706);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:800;font-size:15px;">Démarrer la formation →</a>
      <p style="margin:16px 0 0;font-size:12px;color:#8898AA;">Gratuit · 8 minutes · Aucune installation requise</p>
    </td>
  </tr>

  <tr>
    <td style="background:#F8FAFC;border-radius:0 0 10px 10px;padding:20px 32px;border-top:1px solid #E2E8F0;">
      <p style="margin:0 0 8px;font-size:13px;color:#374151;line-height:1.6;">— <strong>Curtis Zirignon</strong>, Fondateur AfriBourse</p>
      <p style="margin:0;font-size:11px;color:#9CA3AF;">Vous recevez cet email car vous avez créé un compte AfriBourse récemment. Cet email ne constitue pas un conseil en investissement.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: `${firstName}, ton compte AfriBourse t'attend — 8 minutes pour commencer`,
    html,
    text: `${firstName},\n\nTu t'es inscrit il y a quelques jours sur AfriBourse. Des centaines d'investisseurs ont commencé exactement comme toi — sans expérience, sans argent à risquer.\n\nCommence par le Module 1 (8 minutes) :\n${learnUrl}\n\nTu verras comment fonctionne la BRVM et tu feras ton premier achat simulé, guidé pas à pas.\n\n— Curtis Zirignon\nFondateur AfriBourse · africbourse.com`,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAILS AUTOMATISÉS — PERFORMANCE DE PORTEFEUILLE
// ═══════════════════════════════════════════════════════════════════════════════

// palier : "+25" | "+50" | "+100" | "-15" | "-30"
export async function sendPerformanceEmail({
  email,
  name,
  ticker,
  companyName,
  rendement,
  palier,
}: {
  email: string;
  name: string;
  ticker: string;
  companyName: string;
  rendement: number;
  palier: '+25' | '+50' | '+100' | '-15' | '-30';
}): Promise<void> {
  const firstName = (name && name.trim()) ? name.trim().split(' ')[0] : 'Investisseur';
  const dashboardUrl  = `${config.app.frontendUrl}/dashboard`;
  const stockUrl      = `${config.app.frontendUrl}/stock/${ticker}`;
  const profileUrl    = `${config.app.frontendUrl}/profile`;
  const webinairesUrl = `${config.app.frontendUrl}/webinaires`;

  const pct = Math.round(Math.abs(rendement));
  const isGain = rendement >= 0;

  // ── Config par palier ──────────────────────────────────────────────────────
  const configs: Record<string, {
    subject: string;
    badge: string;
    badgeColor: string;
    headerBg: string;
    accentColor: string;
    emoji: string;
    headline: string;
    subline: string;
    body: string;
    primaryCta: { label: string; url: string; bg: string; color: string };
    secondaryCta?: { label: string; url: string };
  }> = {
    '+25': {
      subject: `${ticker} +${pct}% — hasard ou flair, ${firstName} ?`,
      badge: 'Gain +25%',
      badgeColor: '#00D4A8',
      headerBg: 'linear-gradient(135deg,#0a2a1a,#0A1628)',
      accentColor: '#00D4A8',
      emoji: '📈',
      headline: `${companyName} est en hausse de ${pct}%.`,
      subline: 'Hasard ou flair ?',
      body: `Ta position ${ticker} progresse de <strong>+${rendement.toFixed(1)}%</strong> depuis ton prix d'achat moyen. Ce n'est pas rien. Mais la vraie question n'est pas le chiffre — c'est la compréhension.<br><br>Pourquoi ${ticker} monte ? Est-ce le bon moment de renforcer ? Ou de sécuriser une partie des gains ? KOFI peut t'aider à lire le signal derrière le mouvement.`,
      primaryCta: { label: 'Voir mon portefeuille →', url: dashboardUrl, bg: 'linear-gradient(135deg,#00D4A8,#00B894)', color: '#0A1628' },
      secondaryCta: { label: `Analyser ${ticker} avec KOFI →`, url: stockUrl },
    },
    '+50': {
      subject: `${ticker} +${pct}% — ce gain mérite d'être compris`,
      badge: 'Gain +50%',
      badgeColor: '#00D4A8',
      headerBg: 'linear-gradient(135deg,#0a2a1a,#0A1628)',
      accentColor: '#00D4A8',
      emoji: '🎯',
      headline: `+50% sur ${companyName}.`,
      subline: 'Le gain marquant.',
      body: `Ta position ${ticker} affiche <strong>+${rendement.toFixed(1)}%</strong> depuis ton achat. C'est le type de gain qui reste dans la mémoire d'un investisseur.<br><br>Tu es maintenant dans une position stratégique. Est-ce que tu encaisses une partie ? Tu renforces ta conviction ? Tu laisses courir jusqu'au prochain palier ? C'est exactement là que la méthode fait la différence entre un gain ponctuel et un portefeuille qui croît durablement.`,
      primaryCta: { label: 'Voir mon portefeuille →', url: dashboardUrl, bg: 'linear-gradient(135deg,#00D4A8,#00B894)', color: '#0A1628' },
    },
    '+100': {
      subject: `Tu as doublé ta mise sur ${ticker} 🚀`,
      badge: '×2 — Double mise',
      badgeColor: '#F59E0B',
      headerBg: 'linear-gradient(135deg,#1c1408,#0A1628)',
      accentColor: '#F59E0B',
      emoji: '🏆',
      headline: `Bravo ${firstName}.`,
      subline: `${companyName} t'a offert +${pct}%.`,
      body: `C'est le type de gain que la majorité des épargnants UEMOA ne verra jamais. Non pas parce qu'ils n'ont pas les moyens — mais parce qu'ils n'ont pas pris la décision d'investir et d'apprendre.<br><br>Toi, tu l'as fait. <strong>Ce n'est pas de la chance. C'est de l'analyse, de la patience, et de la conviction.</strong><br><br>Partage cette performance avec ta communauté — tu pourrais être la preuve vivante que les marchés africains sont accessibles et rentables.`,
      primaryCta: { label: 'Partager ma performance →', url: profileUrl, bg: 'linear-gradient(135deg,#F59E0B,#D97706)', color: '#ffffff' },
    },
    '-15': {
      subject: `${ticker} baisse — voici comment y répondre, ${firstName}`,
      badge: 'Alerte position',
      badgeColor: '#F97316',
      headerBg: 'linear-gradient(135deg,#1c0a00,#0A1628)',
      accentColor: '#F97316',
      emoji: '⚠️',
      headline: `Ta position ${ticker} recule de ${pct}%.`,
      subline: 'La première baisse. Voici quoi en faire.',
      body: `${companyName} affiche <strong>-${rendement.toFixed(1)}%</strong> depuis ton achat. C'est une baisse qui mérite attention — <em>pas panique</em>.<br><br>Les meilleurs investisseurs de la BRVM distinguent deux choses : une correction normale (opportunité de renforcer) et un signal de danger (il faut protéger le capital). KOFI analyse les fondamentaux de ${ticker} pour t'aider à faire cette distinction.`,
      primaryCta: { label: `Analyser ${ticker} avec KOFI →`, url: stockUrl, bg: 'linear-gradient(135deg,#F97316,#EA580C)', color: '#ffffff' },
    },
    '-30': {
      subject: `${ticker} -${pct}% — ce que le marché essaie de te dire`,
      badge: 'Baisse significative',
      badgeColor: '#EF4444',
      headerBg: 'linear-gradient(135deg,#1c0000,#0A1628)',
      accentColor: '#EF4444',
      emoji: '📉',
      headline: `${companyName} recule de ${pct}%.`,
      subline: "Le marché parle. Apprends à l'écouter.",
      body: `Ta position ${ticker} affiche <strong>-${rendement.toFixed(1)}%</strong>. C'est une baisse qui fait mal — et qui pose une vraie question : est-ce que tu comprends <em>pourquoi</em> ${ticker} baisse ?<br><br>Derrière chaque mouvement de marché significatif, il y a une information. Les investisseurs formés lisent ces signaux et prennent une décision éclairée. Les autres subissent.<br><br>Les prochaines sessions de formation abordent exactement ce type de situation : gestion du risque, lecture des signaux baissiers, décisions en situation de stress.`,
      primaryCta: { label: 'Voir les prochaines sessions →', url: webinairesUrl, bg: 'linear-gradient(135deg,#EF4444,#DC2626)', color: '#ffffff' },
    },
  };

  const c = configs[palier];

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${c.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4F8;font-family:'Segoe UI',Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#F0F4F8;">
<tr><td align="center" style="padding:24px 12px 40px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:620px;">

  <tr>
    <td style="background-color:#0A1628;border-radius:10px 10px 0 0;padding:24px 32px 20px;border-bottom:2px solid ${c.accentColor};">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#ffffff;">Afri</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#00D4A8;">Bourse</span>
            <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8898AA;margin-top:4px;">Suivi de portefeuille</div>
          </td>
          <td align="right" valign="middle">
            <span style="display:inline-block;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:${c.badgeColor};font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;">${c.badge}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="background:${c.headerBg};padding:28px 32px 24px;">
      <div style="font-size:36px;margin-bottom:10px;">${c.emoji}</div>
      <h1 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#ffffff;line-height:1.2;">${c.headline}</h1>
      <p style="margin:0;font-size:16px;color:${c.badgeColor};font-weight:600;">${c.subline}</p>
    </td>
  </tr>

  <tr>
    <td style="background:#ffffff;padding:32px 32px 8px;">
      <p style="margin:0 0 20px;font-size:15px;color:#1a2942;line-height:1.8;">${c.body}</p>
    </td>
  </tr>

  <tr>
    <td style="background:#ffffff;padding:8px 32px 32px;text-align:center;">
      <a href="${c.primaryCta.url}" style="display:inline-block;padding:15px 32px;background:${c.primaryCta.bg};color:${c.primaryCta.color};text-decoration:none;border-radius:10px;font-weight:800;font-size:15px;margin-bottom:${c.secondaryCta ? '12px' : '0'};">${c.primaryCta.label}</a>
      ${c.secondaryCta ? `<br><a href="${c.secondaryCta.url}" style="display:inline-block;padding:12px 28px;background:#F0F4F8;color:#1a2942;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;border:1px solid #E2E8F0;">${c.secondaryCta.label}</a>` : ''}
    </td>
  </tr>

  <tr>
    <td style="background:#F8FAFC;border-radius:0 0 10px 10px;padding:20px 32px;border-top:1px solid #E2E8F0;">
      <p style="margin:0 0 6px;font-size:13px;color:#374151;">— <strong>L'équipe AfriBourse</strong></p>
      <p style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.6;">Vous recevez cet email car vous détenez une position ${ticker} sur votre portefeuille simulé AfriBourse. Les performances passées ne préjugent pas des performances futures. Cet email ne constitue pas un conseil en investissement.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const textBody = isGain
    ? `${firstName},\n\nVotre position ${ticker} (${companyName}) affiche ${rendement >= 0 ? '+' : ''}${rendement.toFixed(1)}% depuis votre achat.\n\n${c.body.replace(/<[^>]+>/g, '')}\n\n→ ${c.primaryCta.label}\n${c.primaryCta.url}${c.secondaryCta ? `\n\n→ ${c.secondaryCta.label}\n${c.secondaryCta.url}` : ''}\n\n— L'équipe AfriBourse · africbourse.com`
    : `${firstName},\n\nVotre position ${ticker} (${companyName}) affiche ${rendement.toFixed(1)}% depuis votre achat.\n\n${c.body.replace(/<[^>]+>/g, '')}\n\n→ ${c.primaryCta.label}\n${c.primaryCta.url}\n\n— L'équipe AfriBourse · africbourse.com`;

  await sendEmail({
    to: email,
    subject: c.subject,
    html,
    text: textBody,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL BADGE NUDGE — XP progress + badges proches + actions disponibles
// ═══════════════════════════════════════════════════════════════════════════════

export interface BadgeNudgeAction {
  label: string;
  xp: number;
  url: string;
  emoji: string;
}

export interface BadgeNudgeParams {
  email: string;
  name: string;
  currentXP: number;
  currentLevel: number;
  xpNeeded: number;       // XP restant pour passer au niveau suivant
  nextLevel: number;
  progressPercent: number; // 0-100
  unearnedBadges: { name: string; icon: string; description: string; xp_reward: number }[];
  availableActions: BadgeNudgeAction[];
}

export async function sendBadgeNudgeEmail(params: BadgeNudgeParams): Promise<void> {
  const {
    email, name, currentXP, currentLevel, xpNeeded, nextLevel,
    progressPercent, unearnedBadges, availableActions,
  } = params;

  const firstName = (name && name.trim()) ? name.trim().split(' ')[0] : 'Investisseur';
  const frontendUrl = config.app.frontendUrl;

  // Barre de progression textuelle (10 blocs)
  const filled  = Math.round(progressPercent / 10);
  const empty   = 10 - filled;
  const bar     = '█'.repeat(filled) + '░'.repeat(empty);

  // Couleur selon niveau
  const levelColors: Record<string, string> = {
    Débutant:      '#3B82F6',
    Intermédiaire: '#8B5CF6',
    Avancé:        '#10B981',
    Expert:        '#F59E0B',
    Maître:        '#EF4444',
  };
  // Déduire le titre courant
  const levelTitle =
    currentLevel <= 10 ? 'Débutant'
    : currentLevel <= 25 ? 'Intermédiaire'
    : currentLevel <= 50 ? 'Avancé'
    : currentLevel <= 75 ? 'Expert'
    : 'Maître';
  const accentColor = levelColors[levelTitle] ?? '#3B82F6';

  const badgesHtml = unearnedBadges.slice(0, 3).map(b => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td width="40" style="font-size:22px;text-align:center;vertical-align:middle;">${b.icon}</td>
            <td style="padding-left:12px;vertical-align:middle;">
              <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#1E293B;">${b.name}</p>
              <p style="margin:0;font-size:12px;color:#64748B;">${b.description}</p>
            </td>
            <td align="right" width="70" style="vertical-align:middle;white-space:nowrap;">
              <span style="background:#F0FDF4;color:#16A34A;font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;">+${b.xp_reward} XP</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join('');

  const actionsHtml = availableActions.slice(0, 4).map(a => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td width="32" style="font-size:18px;text-align:center;vertical-align:middle;">${a.emoji}</td>
            <td style="padding-left:12px;vertical-align:middle;">
              <a href="${a.url}" style="font-size:14px;font-weight:600;color:#1E293B;text-decoration:none;">${a.label}</a>
            </td>
            <td align="right" width="70" style="vertical-align:middle;white-space:nowrap;">
              <span style="background:#EFF6FF;color:${accentColor};font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;">+${a.xp} XP</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join('');

  const topAction = availableActions[0];

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tu es à ${xpNeeded} XP du niveau ${nextLevel} — AfriBourse</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F4F8;font-family:'Segoe UI',Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#F0F4F8;">
<tr><td align="center" style="padding:24px 12px 40px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:620px;">

  <!-- HEADER -->
  <tr>
    <td style="background-color:#0A1628;border-radius:10px 10px 0 0;padding:24px 32px 20px;border-bottom:2px solid ${accentColor};">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#ffffff;">Afri</span><span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;color:#00D4A8;">Bourse</span>
            <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8898AA;margin-top:4px;">Gamification · Progression</div>
          </td>
          <td align="right" valign="middle">
            <span style="display:inline-block;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:${accentColor};font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px;">Niv. ${currentLevel} · ${levelTitle}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- HERO XP -->
  <tr>
    <td style="background:linear-gradient(135deg,#0f1f3d,#0A1628);padding:28px 32px 24px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#8898AA;text-transform:uppercase;letter-spacing:0.1em;">Ta progression</p>
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;">
        ${firstName}, tu es à <span style="color:${accentColor};">${xpNeeded.toLocaleString('fr-FR')} XP</span><br>du niveau ${nextLevel}.
      </h1>

      <!-- Barre XP -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <div style="background:#1E3A5F;border-radius:8px;height:10px;overflow:hidden;margin-bottom:8px;">
              <div style="background:linear-gradient(90deg,${accentColor},#00D4A8);height:10px;width:${Math.round(progressPercent)}%;border-radius:8px;"></div>
            </div>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="font-size:11px;color:#8898AA;">Niv. ${currentLevel} · ${currentXP.toLocaleString('fr-FR')} XP</td>
                <td align="right" style="font-size:11px;color:#8898AA;">Niv. ${nextLevel} · encore ${xpNeeded.toLocaleString('fr-FR')} XP</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BADGES PROCHES -->
  ${unearnedBadges.length > 0 ? `
  <tr>
    <td style="background:#ffffff;padding:24px 32px 0;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#8898AA;text-transform:uppercase;letter-spacing:0.1em;">Badges que tu peux débloquer</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${badgesHtml}
      </table>
    </td>
  </tr>` : ''}

  <!-- ACTIONS DISPONIBLES -->
  <tr>
    <td style="background:#ffffff;padding:24px 32px 0;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#8898AA;text-transform:uppercase;letter-spacing:0.1em;">Actions pour gagner des XP maintenant</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${actionsHtml}
      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="background:#ffffff;padding:24px 32px 32px;text-align:center;">
      ${topAction ? `<a href="${topAction.url}" style="display:inline-block;padding:15px 36px;background:linear-gradient(135deg,${accentColor},#00D4A8);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:800;font-size:15px;">
        ${topAction.emoji} ${topAction.label} →
      </a>
      <p style="margin:12px 0 0;font-size:12px;color:#94A3B8;">+${topAction.xp} XP garantis · Aucun risque réel</p>` : `
      <a href="${frontendUrl}/dashboard" style="display:inline-block;padding:15px 36px;background:linear-gradient(135deg,${accentColor},#00D4A8);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:800;font-size:15px;">
        Voir ma progression →
      </a>`}
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#F8FAFC;border-radius:0 0 10px 10px;padding:20px 32px;border-top:1px solid #E2E8F0;">
      <p style="margin:0 0 6px;font-size:13px;color:#374151;">— <strong>L'équipe AfriBourse</strong></p>
      <p style="margin:0;font-size:11px;color:#9CA3AF;line-height:1.6;">Vous recevez cet email car vous avez un compte AfriBourse actif. Pour ne plus recevoir ces rappels, ignorez simplement cet email — nous ne vous en enverrons pas plus d'un par mois.</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const actionsText = availableActions.slice(0, 4)
    .map(a => `▸ ${a.label} → +${a.xp} XP — ${a.url}`)
    .join('\n');

  await sendEmail({
    to: email,
    subject: `${firstName}, tu es à ${xpNeeded} XP du niveau ${nextLevel} 🎯`,
    html,
    text: `${firstName},\n\nTu es à ${xpNeeded} XP du niveau ${nextLevel} (actuellement niveau ${currentLevel} · ${Math.round(progressPercent)}% accompli).\n\nActions disponibles :\n${actionsText}\n\n— L'équipe AfriBourse · africbourse.com`,
  });
}
