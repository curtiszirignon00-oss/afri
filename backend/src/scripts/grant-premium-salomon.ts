/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../services/email.service';
import config from '../config/environnement';

const prisma = new PrismaClient();

const TARGET_EMAIL = 'atchakpolisalomon@gmail.com';
const DURATION_DAYS = 30;

function formatFrDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildEmailHtml(displayName: string, endDate: Date): string {
  const appUrl = config.app.frontendUrl;
  return `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Votre accès Premium AfriBourse</title>
  </head>
  <body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background-color:#f4f4f4;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <div style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:32px 24px;text-align:center;">
          <h2 style="color:#ffffff;margin:0;font-size:24px;">AfriBourse</h2>
          <p style="color:#d1fae5;margin:8px 0 0;font-size:15px;">Votre accès Premium est activé 🎉</p>
        </div>
        <div style="padding:32px 28px;">
          <p style="font-size:16px;">Bonjour ${displayName},</p>
          <p style="font-size:16px;">
            Bonne nouvelle ! Nous venons d'activer un <strong>accès Premium</strong> sur votre compte
            <strong>${TARGET_EMAIL}</strong>.
          </p>
          <p style="font-size:16px;">
            Vous bénéficiez désormais de <strong>l'ensemble des fonctionnalités Premium</strong> d'AfriBourse :
            graphiques avancés et outils de dessin, valorisations fondamentales, analyses illimitées,
            alertes de prix, et bien plus encore.
          </p>
          <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:18px 20px;margin:24px 0;text-align:center;">
            <p style="margin:0;font-size:15px;color:#065f46;">Durée de votre accès</p>
            <p style="margin:6px 0 0;font-size:18px;font-weight:bold;color:#047857;">
              1 mois &middot; jusqu'au ${formatFrDate(endDate)}
            </p>
          </div>
          <div style="text-align:center;margin:28px 0;">
            <a href="${appUrl}" style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;text-decoration:none;border-radius:10px;font-size:16px;font-weight:bold;">
              Accéder à AfriBourse
            </a>
          </div>
          <p style="font-size:14px;color:#666;">
            Cet accès est valable pendant 1 mois. Pour toute question, écrivez-nous à
            <a href="mailto:contact@africbourse.com" style="color:#059669;">contact@africbourse.com</a>.
          </p>
          <p style="font-size:15px;margin-top:24px;">Bonne exploration,<br/>L'équipe AfriBourse</p>
        </div>
        <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">© AfriBourse — contact@africbourse.com</p>
        </div>
      </div>
    </div>
  </body>
  </html>`;
}

async function main() {
  console.log(`🔍 Recherche de l'utilisateur : ${TARGET_EMAIL}...`);
  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });

  if (!user) {
    console.error(`❌ Aucun utilisateur trouvé avec l'email : ${TARGET_EMAIL}`);
    process.exit(1);
  }

  console.log(`✅ Utilisateur trouvé : ${user.name} ${user.lastname || ''}`.trim());
  console.log(`   Rôle actuel        : ${user.role}`);
  console.log(`   Abonnement actuel  : ${user.subscriptionTier}`);

  // Sécurité : on n'accorde QUE le premium, jamais le privilège admin.
  if (user.role === 'admin') {
    console.warn('⚠️  Ce compte est admin — le rôle NE sera PAS modifié. On ajuste uniquement le tier.');
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + DURATION_DAYS);

  const updated = await prisma.user.update({
    where: { email: TARGET_EMAIL },
    data: {
      subscriptionTier: 'premium', // premium uniquement — pas 'max', pas de rôle admin
    },
  });

  console.log(`\n🎉 Accès Premium accordé !`);
  console.log(`   Rôle (inchangé)    : ${updated.role}`);
  console.log(`   Nouvel abonnement  : ${updated.subscriptionTier}`);
  console.log(`   Échéance (1 mois)  : ${endDate.toISOString()} (${formatFrDate(endDate)})`);

  const displayName = (user.name && user.name.trim()) ? user.name.trim() : 'Investisseur';
  console.log(`\n📧 Envoi de l'email de notification à ${TARGET_EMAIL}...`);
  await sendEmail({
    to: TARGET_EMAIL,
    subject: '🎉 Votre accès Premium AfriBourse est activé (1 mois)',
    html: buildEmailHtml(displayName, endDate),
    text:
      `Bonjour ${displayName},\n\n` +
      `Nous venons d'activer un accès Premium sur votre compte ${TARGET_EMAIL}. ` +
      `Vous bénéficiez de toutes les fonctionnalités Premium d'AfriBourse pendant 1 mois, ` +
      `jusqu'au ${formatFrDate(endDate)}.\n\n` +
      `Accédez à AfriBourse : ${config.app.frontendUrl}\n\n` +
      `Pour toute question : contact@africbourse.com\n\nL'équipe AfriBourse`,
  });
  console.log('✅ Email envoyé.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
