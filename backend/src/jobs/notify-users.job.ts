/**
 * Job d'envoi des emails de notification aux utilisateurs récupérés
 *
 * Planifié pour s'exécuter DIMANCHE 25 JANVIER 2026 à 10h00
 * Ce job s'exécutera UNE SEULE FOIS puis se désactivera
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import transporter from '../config/mailer';
import config from '../config/environnement';

const prisma = new PrismaClient();

// Cron expression: "0 10 25 1 *" = À 10h00, le 25 janvier 2026
// Aujourd'hui dimanche 25 janvier 2026
const NOTIFY_SCHEDULE = '0 10 25 1 *';

let jobExecuted = false;

// Template de l'email
function generateRecoveryEmail(name: string): { subject: string; html: string; text: string } {
  const resetUrl = `${config.app.frontendUrl}/reinitialiser-mot-de-passe`;

  const subject = "Important: Réinitialisation de votre compte AfriBourse";

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réinitialisation de votre compte - AfriBourse</title>
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
        .warning-box {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .warning-box p {
          margin: 0;
          color: #92400e;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        ul {
          color: #4b5563;
          padding-left: 20px;
        }
        li {
          margin-bottom: 8px;
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

        <h1>Bonjour ${name},</h1>

        <p>Nous vous contactons suite à un <strong>incident technique</strong> survenu sur notre plateforme.</p>

        <div class="warning-box">
          <p><strong>Que s'est-il passé ?</strong></p>
          <p>Suite à une erreur technique, certaines données de notre base ont été temporairement perdues. Nous avons pu récupérer votre compte, mais votre mot de passe doit être réinitialisé.</p>
        </div>

        <div class="info-box">
          <p><strong>Bonne nouvelle !</strong></p>
          <p>Votre compte a été restauré et votre email est déjà confirmé. Vous n'avez qu'à définir un nouveau mot de passe pour retrouver l'accès.</p>
        </div>

        <p><strong>Ce que vous devez faire :</strong></p>
        <ul>
          <li>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe</li>
          <li>Entrez votre adresse email</li>
          <li>Suivez les instructions reçues par email</li>
        </ul>

        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
        </div>

        <p>Nous nous excusons sincèrement pour ce désagrément et vous remercions de votre compréhension.</p>

        <p>Si vous avez des questions ou besoin d'aide, n'hésitez pas à nous contacter à <a href="mailto:contact@africbourse.com">contact@africbourse.com</a>.</p>

        <p>Cordialement,<br><strong>L'équipe AfriBourse</strong></p>

        <div class="footer">
          <p>Cet email a été envoyé par AfriBourse</p>
          <p>Si vous avez des questions, contactez-nous à contact@africbourse.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bonjour ${name},

Nous vous contactons suite à un incident technique survenu sur notre plateforme.

QUE S'EST-IL PASSÉ ?
Suite à une erreur technique, certaines données de notre base ont été temporairement perdues. Nous avons pu récupérer votre compte, mais votre mot de passe doit être réinitialisé.

BONNE NOUVELLE !
Votre compte a été restauré et votre email est déjà confirmé. Vous n'avez qu'à définir un nouveau mot de passe pour retrouver l'accès.

CE QUE VOUS DEVEZ FAIRE :
1. Rendez-vous sur ${resetUrl}
2. Entrez votre adresse email
3. Suivez les instructions reçues par email

Nous nous excusons sincèrement pour ce désagrément et vous remercions de votre compréhension.

Si vous avez des questions, contactez-nous à contact@africbourse.com

Cordialement,
L'équipe AfriBourse
  `;

  return { subject, html, text };
}

async function sendNotificationEmails(): Promise<void> {
  if (jobExecuted) {
    console.log('📧 [NOTIFY JOB] Job déjà exécuté, ignoré');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📧 [NOTIFY JOB] Envoi des emails de notification...');
  console.log('='.repeat(60));

  try {
    // D'abord, marquer tous les emails comme confirmés
    const confirmResult = await prisma.user.updateMany({
      where: { email_verified_at: null },
      data: { email_verified_at: new Date() },
    });
    console.log(`✅ ${confirmResult.count} emails marqués comme confirmés`);

    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
      },
    });

    console.log(`📤 Envoi à ${users.length} utilisateurs...`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      const name = user.name
        ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}`
        : 'Utilisateur';

      try {
        const emailContent = generateRecoveryEmail(name);

        await transporter.sendMail({
          from: `"AfriBourse" <${config.mail.from}>`,
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        console.log(`   ✅ ${user.email}`);
        successCount++;

        // Délai de 1 seconde entre chaque email
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`   ❌ ${user.email}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 [NOTIFY JOB] RÉSUMÉ');
    console.log('='.repeat(60));
    console.log(`   ✅ Emails envoyés: ${successCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);

    jobExecuted = true;
    console.log('\n✅ [NOTIFY JOB] Job terminé - ne sera plus exécuté');

  } catch (error: any) {
    console.error(`❌ [NOTIFY JOB] Erreur:`, error.message);
  }
}

// Initialisation du job
console.log('📧 [NOTIFY JOB] Initialisation du job de notification');
console.log(`   📅 Planification: Dimanche 25 janvier 2026 à 10h00`);
console.log(`   📧 Enverra un email à tous les utilisateurs récupérés`);

const task = cron.schedule(NOTIFY_SCHEDULE, async () => {
  await sendNotificationEmails();
}, {
  timezone: 'Africa/Abidjan' // GMT+0
});

console.log('✅ [NOTIFY JOB] Job de notification activé');

export { sendNotificationEmails };
export default task;
