// scripts/send-webinar-launch-email.ts
// Envoie l'email de lancement des webinaires à tous les utilisateurs réels
// Usage: npx tsx scripts/send-webinar-launch-email.ts
// Usage dry-run: npx tsx scripts/send-webinar-launch-email.ts --dry-run

import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Brevo SMTP ───────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
});

// ─── Filtrage comptes fake ────────────────────────────────────────────────────

const FAKE_PATTERNS = [
  'afribourse', 'africbourse', 'yopmail', 'mailinator',
  'guerrillamail', 'tempmail', 'throwam', 'sharklasers',
  'dispostable', 'trashmail', 'fakeinbox', 'spamgourmet',
];

function isRealEmail(email: string): boolean {
  const e = email.toLowerCase();
  return !FAKE_PATTERNS.some((p) => e.includes(p));
}

// ─── Template HTML ────────────────────────────────────────────────────────────

function buildHtml(displayName: string): string {
  const webinarUrl = 'https://www.africbourse.com/webinaires';
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎓 Maîtrisez la BRVM avec nos experts — 3 webinaires exclusifs</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

  <span style="display:none;max-height:0;overflow:hidden;">Places limitées · Tarif spécial pour les 20 premiers inscrits &#847;&zwnj;&nbsp;&#847;</span>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F5F9;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- Logo -->
        <tr>
          <td style="background-color:#FFFFFF;border-radius:16px 16px 0 0;padding:28px 40px 20px;border-bottom:1px solid #E2E8F0;text-align:center;">
            <span style="font-size:26px;font-weight:900;color:#1D4ED8;">AFRI</span><span style="font-size:26px;font-weight:900;color:#F97316;">BOURSE</span>
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td style="background:linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 50%,#4338CA 100%);padding:40px 40px 36px;text-align:center;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#BFDBFE;letter-spacing:2px;text-transform:uppercase;">Formation Live · BRVM</p>
            <h1 style="margin:0 0 12px;font-size:26px;font-weight:900;color:#FFFFFF;line-height:1.3;">🎓 Nos premiers webinaires<br>de formation arrivent !</h1>
            <p style="margin:0 0 20px;font-size:14px;color:#BFDBFE;line-height:1.6;">3 sessions live animées par des experts marchés et analystes BRVM.<br>Places limitées — tarif préférentiel pour les 20 premiers.</p>
            <span style="display:inline-block;background-color:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:100px;padding:6px 18px;font-size:12px;font-weight:700;color:#FFFFFF;">3 webinaires · 1 parcours complet · Des experts à vos côtés</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background-color:#FFFFFF;padding:36px 40px;">

            <p style="margin:0 0 20px;font-size:15px;color:#374151;font-weight:600;">Bonjour ${displayName},</p>
            <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.7;">Depuis que vous avez rejoint Afribourse, vous apprenez à votre rythme sur les marchés africains.</p>
            <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">Aujourd'hui, nous franchissons une nouvelle étape ensemble : nos <strong>premiers webinaires de formation en direct</strong>, animés par des experts et analystes de marché.</p>

            <h2 style="margin:0 0 20px;font-size:17px;font-weight:800;color:#0F172A;border-bottom:2px solid #E2E8F0;padding-bottom:10px;">Les 3 sessions au programme</h2>

            <!-- Session 1 -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;border:1px solid #BFDBFE;border-radius:12px;">
              <tr><td style="background-color:#EFF6FF;border-left:4px solid #1D4ED8;border-radius:0 8px 8px 0;padding:18px 20px;">
                <p style="margin:0 0 5px;font-size:12px;font-weight:800;color:#1D4ED8;text-transform:uppercase;letter-spacing:0.5px;">Session 1 — Samedi 25 mai 2026</p>
                <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0F172A;">Maîtriser les fondamentaux de la bourse</p>
                <p style="margin:0 0 10px;font-size:13px;color:#374151;line-height:1.6;">Passez de zéro à investisseur en une seule session. Comprendre la BRVM, les actions, les obligations, et poser vos premières bases solides.</p>
                <p style="margin:0;font-size:12px;color:#64748B;">⏱ 3H &nbsp;·&nbsp; 💰 5 000 XOF &nbsp;·&nbsp; <span style="color:#92400E;">🔥 Early-bird 20 premiers : <strong>2 500 XOF</strong></span></p>
              </td></tr>
            </table>

            <!-- Session 2 -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;border:1px solid #A7F3D0;border-radius:12px;">
              <tr><td style="background-color:#ECFDF5;border-left:4px solid #065F46;border-radius:0 8px 8px 0;padding:18px 20px;">
                <p style="margin:0 0 5px;font-size:12px;font-weight:800;color:#065F46;text-transform:uppercase;letter-spacing:0.5px;">Session 2 — 30 &amp; 31 mai 2026</p>
                <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0F172A;">Analyse fondamentale : lire les données comme un pro</p>
                <p style="margin:0 0 10px;font-size:13px;color:#374151;line-height:1.6;">Décryptez les bilans, les ratios financiers et les rapports annuels des entreprises cotées à la BRVM. Apprenez à évaluer si une action vaut son prix.</p>
                <p style="margin:0;font-size:12px;color:#64748B;">⏱ 8H &nbsp;·&nbsp; 💰 10 000 XOF &nbsp;·&nbsp; <span style="color:#92400E;">🔥 Early-bird 20 premiers : <strong>5 000 XOF</strong></span></p>
              </td></tr>
            </table>

            <!-- Session 3 -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;border:1px solid #FED7AA;border-radius:12px;">
              <tr><td style="background-color:#FFF7ED;border-left:4px solid #C2410C;border-radius:0 8px 8px 0;padding:18px 20px;">
                <p style="margin:0 0 5px;font-size:12px;font-weight:800;color:#C2410C;text-transform:uppercase;letter-spacing:0.5px;">Session 3 — 6 &amp; 7 juin 2026</p>
                <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0F172A;">Analyse technique : lisez les graphiques avant tout le monde</p>
                <p style="margin:0 0 10px;font-size:13px;color:#374151;line-height:1.6;">Patterns, indicateurs, timing d'entrée et de sortie — apprenez à identifier les opportunités sur les graphiques BRVM avant qu'elles deviennent évidentes.</p>
                <p style="margin:0;font-size:12px;color:#64748B;">⏱ 8H &nbsp;·&nbsp; 💰 10 000 XOF &nbsp;·&nbsp; <span style="color:#92400E;">🔥 Early-bird 20 premiers : <strong>5 000 XOF</strong></span></p>
              </td></tr>
            </table>

            <!-- CTA -->
            <h2 style="margin:0 0 14px;font-size:17px;font-weight:800;color:#0F172A;border-bottom:2px solid #E2E8F0;padding-bottom:10px;">Comment s'inscrire ?</h2>
            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">Cliquez sur le bouton ci-dessous pour choisir votre session :</p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px;">
              <tr><td style="background:linear-gradient(135deg,#1D4ED8,#4338CA);border-radius:12px;">
                <a href="${webinarUrl}" style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;">🎓 Réserver ma place →</a>
              </td></tr>
            </table>

            <!-- Pourquoi -->
            <h2 style="margin:0 0 14px;font-size:17px;font-weight:800;color:#0F172A;border-bottom:2px solid #E2E8F0;padding-bottom:10px;">Pourquoi ces webinaires maintenant ?</h2>
            <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.7;">Vous êtes plus de <strong>2 000 utilisateurs</strong> à apprendre sur Afribourse. Beaucoup d'entre vous nous ont posé la même question : <em>« Comment aller plus loin ? »</em></p>
            <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.7;">Ces webinaires sont notre réponse. Des sessions courtes, intensives, animées par des experts qui connaissent la BRVM — pas des formations génériques importées d'Europe ou d'Amérique. Des formations pensées pour vous, pour vos marchés, pour vos opportunités.<br><br>Les places sont limitées pour garantir la qualité des échanges. Les premiers inscrits bénéficient du tarif préférentiel.</p>

            <!-- Pack -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:2px solid #F59E0B;border-radius:14px;">
              <tr><td style="padding:22px 24px;">
                <p style="margin:0 0 10px;font-size:15px;font-weight:900;color:#92400E;text-align:center;">⭐ OFFRE PACK — Le Parcours Investisseur Complet ⭐</p>
                <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0F172A;">Les 3 sessions + 4 extras exclusifs :</p>
                <p style="margin:0 0 5px;font-size:13px;color:#374151;">✓ &nbsp;Accès à la Communauté Afribourse — 3 mois</p>
                <p style="margin:0 0 5px;font-size:13px;color:#374151;">✓ &nbsp;3 Plans d'Action personnalisés (un après chaque session)</p>
                <p style="margin:0 0 5px;font-size:13px;color:#374151;">✓ &nbsp;Deal Flow hebdomadaire — 12 analyses exclusives sur la BRVM</p>
                <p style="margin:0 0 14px;font-size:13px;color:#374151;">✓ &nbsp;Certificat Investisseur BRVM Niveau 1 — partageable sur LinkedIn</p>
                <p style="margin:0 0 4px;font-size:15px;font-weight:900;color:#92400E;text-align:center;">Pack Early-bird : 20 000 XOF <span style="text-decoration:line-through;font-weight:400;font-size:13px;color:#B45309;">au lieu de 35 000 XOF</span></p>
                <p style="margin:0;font-size:12px;color:#92400E;text-align:center;">Tarif early-bird valable 72h seulement après ouverture des inscriptions</p>
              </td></tr>
            </table>

            <!-- Notice -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;background-color:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;">
              <tr><td style="padding:18px 22px;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:800;color:#0F172A;">ℹ️ Important : aucun paiement requis maintenant</p>
                <p style="margin:0;font-size:13px;color:#374151;line-height:1.7;">La préinscription est gratuite et immédiate. Elle vous garantit le tarif early-bird si vous êtes parmi les 20 premiers inscrits. Les instructions de paiement (Wave, Orange Money, MTN MoMo) vous seront envoyées par message après votre préinscription.</p>
              </td></tr>
            </table>

            <!-- CTA final -->
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
              <tr><td style="background:linear-gradient(135deg,#1D4ED8,#4338CA);border-radius:12px;">
                <a href="${webinarUrl}" style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;">Je réserve ma place →</a>
              </td></tr>
            </table>

            <!-- Signature -->
            <p style="margin:0 0 4px;font-size:15px;color:#374151;">À très bientôt en live,</p>
            <p style="margin:0 0 2px;font-size:16px;font-weight:800;color:#374151;">SIMBA</p>
            <p style="margin:0;font-size:13px;color:#64748B;">Coach IA, Afribourse</p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#F8FAFC;border-radius:0 0 16px 16px;padding:18px 40px;text-align:center;border-top:1px solid #E2E8F0;">
            <p style="margin:0 0 4px;font-size:11px;color:#94A3B8;">Vous recevez cet email car vous êtes inscrit sur <a href="https://www.africbourse.com" style="color:#1D4ED8;text-decoration:none;">AfriBourse</a>.</p>
            <p style="margin:0;font-size:11px;color:#94A3B8;">© 2026 AfriBourse · <a href="https://www.africbourse.com" style="color:#1D4ED8;text-decoration:none;">africbourse.com</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Campagne email — Lancement Webinaires Afribourse ===\n');
  if (DRY_RUN) console.log('⚠️  MODE DRY-RUN — aucun email ne sera envoyé\n');

  // 1. Vérification SMTP
  if (!DRY_RUN) {
    try {
      await transporter.verify();
      console.log('✅ Connexion SMTP Brevo OK\n');
    } catch (err) {
      console.error('❌ Connexion SMTP échouée :', err);
      process.exit(1);
    }
  }

  // 2. Récupération des utilisateurs
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
  });
  console.log(`👥 Total users en base : ${allUsers.length}`);

  const users = allUsers.filter((u) => isRealEmail(u.email));
  const excluded = allUsers.length - users.length;
  console.log(`🚫 Comptes exclus (fake) : ${excluded}`);
  console.log(`📨 Destinataires réels  : ${users.length}\n`);

  if (users.length === 0) {
    console.log('Aucun destinataire. Arrêt.');
    return;
  }

  if (DRY_RUN) {
    console.log('Aperçu des 5 premiers destinataires :');
    users.slice(0, 5).forEach((u) => console.log(`  - ${u.email} (${u.name || 'sans prénom'})`));
    console.log(`  ... et ${Math.max(0, users.length - 5)} autres\n`);
    console.log('✅ Dry-run terminé. Relancez sans --dry-run pour envoyer.');
    return;
  }

  // 3. Envoi par lots
  const BATCH_SIZE = 50;
  const BATCH_DELAY_MS = 2000;
  let sent = 0;
  let failed = 0;
  const errors: { email: string; error: string }[] = [];

  const FROM = `"${process.env.SMTP_FROM_NAME || 'AfriBourse'}" <${process.env.SMTP_FROM_EMAIL || 'noreply@africbourse.com'}>`;
  const SUBJECT = '🎓 Maîtrisez la BRVM avec nos experts — 3 webinaires exclusifs';

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(users.length / BATCH_SIZE);
    process.stdout.write(`Lot ${batchNum}/${totalBatches} (${batch.length} emails)... `);

    await Promise.allSettled(
      batch.map(async (u) => {
        const displayName = u.name || 'Investisseur';
        try {
          await transporter.sendMail({
            from: FROM,
            to: u.email,
            subject: SUBJECT,
            html: buildHtml(displayName),
            text: `Bonjour ${displayName},\n\nNos premiers webinaires de formation arrivent !\n\nSession 1 — 25 mai : Fondamentaux (3H · 5 000 XOF · early-bird 2 500 XOF)\nSession 2 — 30-31 mai : Analyse fondamentale (8H · 10 000 XOF · early-bird 5 000 XOF)\nSession 3 — 6-7 juin : Analyse technique (8H · 10 000 XOF · early-bird 5 000 XOF)\n\nPack Parcours Investisseur : 20 000 XOF early-bird (35 000 XOF tarif plein)\n\nAucun paiement requis — préinscription gratuite et immédiate.\n\n→ https://www.africbourse.com/webinaires\n\nÀ très bientôt en live,\nSIMBA — Coach IA, Afribourse`,
          });
          sent++;
        } catch (err: any) {
          failed++;
          errors.push({ email: u.email, error: err?.message ?? 'unknown' });
        }
      })
    );

    console.log(`✅ (total envoyés : ${sent})`);

    if (i + BATCH_SIZE < users.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  // 4. Rapport final
  console.log('\n═══════════════════════════════════════');
  console.log('  RAPPORT DE CAMPAGNE');
  console.log('═══════════════════════════════════════');
  console.log(`  Destinataires ciblés : ${users.length}`);
  console.log(`  Emails envoyés       : ${sent}`);
  console.log(`  Échecs               : ${failed}`);
  if (errors.length > 0) {
    console.log('\n  Erreurs :');
    errors.forEach((e) => console.log(`    - ${e.email} : ${e.error}`));
  }
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((err) => { console.error('Erreur fatale :', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
