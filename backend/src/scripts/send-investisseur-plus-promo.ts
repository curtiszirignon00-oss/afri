/**
 * Campagne email "Investisseur+ — 50% de réduction" ciblée
 * Cible : utilisateurs ayant exprimé une intention de paiement
 *
 * Usage    : npx tsx src/scripts/send-investisseur-plus-promo.ts
 * Dry-run  : DRY_RUN=true npx tsx src/scripts/send-investisseur-plus-promo.ts
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { sendInvestisseurPlusPromoEmail } from '../services/email.service';

dotenv.config();

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === 'true';
const DELAY_MS = 1500;

const TARGET_EMAILS = [
  'amadouniane230@gmail.com',
  'bossbien1@gmail.com',
  'siemamadoutoure@gmail.com',
  'kaudjr@gmail.com',
  'solangeiyolopembe@yahoo.fr',
  'sanei4152@gmail.com',
  'adissif1@gmail.com',
  'tannant.rox26@gmail.com',
  'sherleynguessan521@gmail.com',
  'nianeahmedtidiane@gmail.com',
  'sidicki780@gmail.com',
  'antoinehoungbedji144@gmail.com',
];

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('\n🎯 Campagne Investisseur+ — 50% de réduction');
  console.log('='.repeat(60));
  if (DRY_RUN) {
    console.log('⚠️  MODE DRY-RUN actif — aucun email ne sera envoyé\n');
  }

  // Récupère les noms depuis la DB pour personnaliser le prénom
  const dbUsers = await prisma.user.findMany({
    where: { email: { in: TARGET_EMAILS } },
    select: { email: true, name: true },
  });

  const nameByEmail = new Map(dbUsers.map(u => [u.email.toLowerCase(), u.name ?? '']));

  console.log(`📬 Cibles        : ${TARGET_EMAILS.length}`);
  console.log(`🔍 Trouvés en DB : ${dbUsers.length}`);
  console.log('='.repeat(60));

  let sent = 0;
  let failed = 0;
  const errors: { email: string; error: string }[] = [];

  for (let i = 0; i < TARGET_EMAILS.length; i++) {
    const email = TARGET_EMAILS[i];
    const name = nameByEmail.get(email.toLowerCase()) ?? '';
    const progress = `[${i + 1}/${TARGET_EMAILS.length}]`;

    try {
      if (!DRY_RUN) {
        await sendInvestisseurPlusPromoEmail({ email, name });
      }

      const firstName = (name || 'Investisseur').split(' ')[0];
      console.log(`${progress} ✅  ${email} (${firstName})${DRY_RUN ? ' (dry-run)' : ''}`);
      sent++;

      if (!DRY_RUN && i < TARGET_EMAILS.length - 1) {
        await sleep(DELAY_MS);
      }
    } catch (err: any) {
      console.error(`${progress} ❌  ${email} — ${err.message}`);
      failed++;
      errors.push({ email, error: err.message });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RAPPORT FINAL');
  console.log('='.repeat(60));
  console.log(`✅ Envoyés avec succès : ${sent}`);
  console.log(`❌ Échecs              : ${failed}`);

  if (errors.length > 0) {
    console.log('\n⚠️  Détail des échecs :');
    errors.forEach(e => console.log(`   • ${e.email} → ${e.error}`));
  }

  if (DRY_RUN) {
    console.log('\n💡 Relancez sans DRY_RUN=true pour envoyer réellement.\n');
  } else {
    console.log('\n🎉 Campagne terminée.\n');
  }
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Erreur fatale :', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
