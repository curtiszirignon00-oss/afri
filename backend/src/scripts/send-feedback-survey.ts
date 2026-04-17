/// <reference types="node" />
/**
 * Script : envoie l'email de sondage feedback à tous les utilisateurs réels
 * Utilisateurs réels = email vérifié + pas de domaine @fake-afribourse.com
 *
 * Usage : npx tsx src/scripts/send-feedback-survey.ts
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../services/email.service';

dotenv.config();

const prisma = new PrismaClient();

const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScJg2qejSJFpuWBKt4mMHndidgG06hkhrR7q35P9RTd9O7xBg/viewform?usp=publish-editor';

function buildEmailHtml(prenom: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aide-nous à construire Afribourse</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.7;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 10px;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #f97316;
      margin-bottom: 30px;
    }
    p {
      color: #4b5563;
      font-size: 15px;
      margin: 0 0 18px;
    }
    .cta-wrapper {
      text-align: center;
      margin: 32px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #f97316;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
      padding: 14px 32px;
      border-radius: 8px;
    }
    .signature {
      margin-top: 36px;
      color: #6b7280;
      font-size: 14px;
    }
    .signature strong {
      color: #1f2937;
    }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">AfriBourse</div>

    <p>Bonjour ${prenom},</p>

    <p>Tu fais partie des premières personnes à vraiment utiliser Afribourse. En un mois, tes visites nous ont appris énormément — mais on a besoin d'entendre ta voix, pas seulement tes clics.</p>

    <p><strong>3 questions. 3 minutes.</strong> Tes réponses vont directement influencer ce qu'on construit ce trimestre.</p>

    <div class="cta-wrapper">
      <a href="${FORM_URL}" class="cta-button">Répondre maintenant — 3 min</a>
    </div>

    <div class="signature">
      <p>Curtis Zirignon<br /><strong>Fondateur, Afribourse</strong></p>
    </div>

    <div class="footer">
      Tu reçois cet email car tu es inscrit(e) sur AfriBourse.<br />
      &copy; ${new Date().getFullYear()} AfriBourse
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  console.log('\n📧 ENVOI DU SONDAGE FEEDBACK — AfriBourse');
  console.log('='.repeat(60));

  try {
    // Utilisateurs réels : email vérifié, pas faux
    const users = await prisma.user.findMany({
      where: {
        email_verified_at: { not: null },
        email: { not: { endsWith: '@fake-afribourse.com' } },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: { created_at: 'asc' },
    });

    console.log(`\n👥 ${users.length} utilisateur(s) réel(s) trouvé(s)\n`);

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur réel trouvé. Arrêt.');
      return;
    }

    users.forEach((u, i) => {
      const prenom = u.name ?? u.email;
      console.log(`   ${i + 1}. ${u.email} (${prenom})`);
    });

    console.log('\n' + '='.repeat(60));
    console.log(`🚀 Démarrage de l'envoi pour ${users.length} utilisateur(s)...`);
    console.log('='.repeat(60) + '\n');

    let success = 0;
    let errors = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const prenom = user.name ?? 'Membre';
      const progress = `[${i + 1}/${users.length}]`;

      try {
        process.stdout.write(`${progress} ${user.email} ... `);

        await sendEmail({
          to: user.email,
          subject: 'Aide-nous à construire Afribourse — 3 minutes suffisent',
          html: buildEmailHtml(prenom),
          text: `Bonjour ${prenom},\n\nTu fais partie des premières personnes à vraiment utiliser Afribourse. En un mois, tes visites nous ont appris énormément — mais on a besoin d'entendre ta voix, pas seulement tes clics.\n\n3 questions. 3 minutes. Tes réponses vont directement influencer ce qu'on construit ce trimestre.\n\nRépondre maintenant : ${FORM_URL}\n\nCurtis Zirignon\nFondateur, Afribourse`,
        });

        console.log('✅');
        success++;

        // Délai pour éviter le rate-limiting SMTP
        if (i < users.length - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      } catch (err: any) {
        console.log(`❌ ERREUR: ${err.message}`);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(60));
    console.log(`Total      : ${users.length}`);
    console.log(`✅ Succès  : ${success}`);
    console.log(`❌ Erreurs : ${errors}`);
    if (users.length > 0) {
      console.log(`📈 Taux    : ${((success / users.length) * 100).toFixed(1)}%`);
    }
    console.log('='.repeat(60));
  } catch (err) {
    console.error('\n💥 Erreur fatale :', err);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n👋 Terminé');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Erreur critique :', err);
    process.exit(1);
  });
