/**
 * Script : envoie l'email "SAFC — Augmentation de capital 2026" à tous les utilisateurs réels
 * — Exclut les emails contenant "---"
 * — Pause de 1,5 s entre chaque envoi pour respecter les limites SMTP Brevo
 *
 * Usage    : npx tsx src/scripts/send-safc-article-email.ts
 * Dry-run  : DRY_RUN=true npx tsx src/scripts/send-safc-article-email.ts
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { sendSAFCArticleEmail } from '../services/email.service';

dotenv.config();

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === 'true';
const DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('\n📰 Campagne email — SAFC Augmentation de Capital 2026');
  console.log('='.repeat(60));
  if (DRY_RUN) {
    console.log('⚠️  MODE DRY-RUN actif — aucun email ne sera envoyé\n');
  }

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { created_at: 'asc' },
  });

  const targets = allUsers.filter(u => !u.email.includes('---'));
  const excluded = allUsers.length - targets.length;

  console.log(`👥 Utilisateurs totaux  : ${allUsers.length}`);
  console.log(`🚫 Comptes fake exclus : ${excluded}`);
  console.log(`📬 À envoyer           : ${targets.length}`);
  console.log('='.repeat(60));

  if (targets.length === 0) {
    console.log('\n✅ Aucun utilisateur à traiter.\n');
    return;
  }

  let sent = 0;
  let failed = 0;
  const errors: { email: string; error: string }[] = [];

  for (let i = 0; i < targets.length; i++) {
    const user = targets[i];
    const progress = `[${i + 1}/${targets.length}]`;

    try {
      if (!DRY_RUN) {
        await sendSAFCArticleEmail({
          email: user.email,
          name: user.name ?? 'Membre',
        });
      }

      console.log(`${progress} ✅  ${user.email}${DRY_RUN ? ' (dry-run)' : ''}`);
      sent++;

      if (!DRY_RUN && i < targets.length - 1) {
        await sleep(DELAY_MS);
      }
    } catch (err: any) {
      console.error(`${progress} ❌  ${user.email} — ${err.message}`);
      failed++;
      errors.push({ email: user.email, error: err.message });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT FINAL');
  console.log('='.repeat(60));
  console.log(`✅ Envoyés avec succès : ${sent}`);
  console.log(`❌ Échecs              : ${failed}`);
  console.log(`🚫 Fake exclus         : ${excluded}`);

  if (errors.length > 0) {
    console.log('\n⚠️  Détail des échecs :');
    errors.forEach(e => console.log(`   • ${e.email} → ${e.error}`));
  }

  if (DRY_RUN) {
    console.log('\n💡 Relancez sans DRY_RUN=true pour envoyer réellement.\n');
  } else {
    console.log('\n🎉 Campagne SAFC terminée.\n');
  }
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Erreur fatale :', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
