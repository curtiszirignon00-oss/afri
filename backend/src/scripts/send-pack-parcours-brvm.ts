/**
 * Campagne email — Pack Parcours Investisseur BRVM
 * Objet : 🎓 Votre dernière chance d'entrer dans le Parcours Investisseur BRVM
 *
 * Cible : tous les utilisateurs
 *
 * Usage    : npx tsx src/scripts/send-pack-parcours-brvm.ts
 * Dry-run  : DRY_RUN=true npx tsx src/scripts/send-pack-parcours-brvm.ts
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { sendPackParcoursBRVMEmail } from '../services/email.service';

dotenv.config();

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === 'true';
const DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('\n🎓 Campagne — Pack Parcours Investisseur BRVM');
  console.log('='.repeat(60));
  if (DRY_RUN) {
    console.log('⚠️  MODE DRY-RUN actif — aucun email ne sera envoyé\n');
  }

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { created_at: 'asc' },
  });

  const targets = allUsers;

  console.log(`👥 Utilisateurs totaux  : ${allUsers.length}`);
  console.log(`📬 À envoyer           : ${targets.length}`);
  console.log('='.repeat(60));

  let sent = 0;
  let failed = 0;
  const errors: { email: string; error: string }[] = [];

  for (let i = 0; i < targets.length; i++) {
    const user = targets[i];
    const progress = `[${i + 1}/${targets.length}]`;

    try {
      if (!DRY_RUN) {
        await sendPackParcoursBRVMEmail({
          email: user.email,
          name: user.name ?? '',
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

  if (errors.length > 0) {
    console.log('\n⚠️  Détail des échecs :');
    errors.forEach(e => console.log(`   • ${e.email} → ${e.error}`));
  }

  if (DRY_RUN) {
    console.log('\n💡 Relancez sans DRY_RUN=true pour envoyer réellement.\n');
  } else {
    console.log('\n🎉 Campagne Pack Parcours BRVM terminée.\n');
  }
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Erreur fatale :', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
