/**
 * Script : envoie un email d'essai gratuit à TOUS les utilisateurs réels
 * — Exclut les emails contenant "fake-afribourse"
 * — Exclut les utilisateurs ayant déjà un token de trial en base
 * — Crée un token persisté en base avant chaque envoi
 * — Pause de 1,5 s entre chaque envoi pour éviter le rate-limiting SMTP
 *
 * Usage : npx tsx src/scripts/send-trial-all-users.ts
 * Dry-run : DRY_RUN=true npx tsx src/scripts/send-trial-all-users.ts
 */

import { randomBytes } from 'crypto';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { sendTrialInviteEmail } from '../services/email.service';

dotenv.config();

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === 'true';
const DELAY_MS = 1500; // pause entre chaque email

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('\n🚀 Envoi mass trial — AfriBourse');
  console.log('='.repeat(55));
  if (DRY_RUN) {
    console.log('⚠️  MODE DRY-RUN actif — aucun email ne sera envoyé\n');
  }

  // 1. Récupérer tous les utilisateurs réels
  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, subscriptionTier: true },
    orderBy: { created_at: 'asc' },
  });

  // 2. Filtrer les faux comptes
  const realUsers = allUsers.filter(
    u => !u.email.includes('fake-afribourse')
  );

  console.log(`👥 Utilisateurs totaux       : ${allUsers.length}`);
  console.log(`🚫 Comptes fake exclus       : ${allUsers.length - realUsers.length}`);
  console.log(`✅ Candidats retenus         : ${realUsers.length}\n`);

  // 3. Identifier ceux qui ont déjà un trial en base
  const existingTrials = await (prisma as any).freeTrial.findMany({
    select: { userId: true },
  });
  const usersWithTrial = new Set(existingTrials.map((t: any) => t.userId));

  const targets = realUsers.filter(u => !usersWithTrial.has(u.id));
  const skipped = realUsers.length - targets.length;

  console.log(`⏭️  Déjà un trial en base     : ${skipped}`);
  console.log(`📬 À traiter maintenant      : ${targets.length}`);
  console.log('='.repeat(55));

  if (targets.length === 0) {
    console.log('\n✅ Rien à envoyer — tous les utilisateurs réels ont déjà un trial.\n');
    return;
  }

  let sent = 0;
  let failed = 0;
  const errors: { email: string; error: string }[] = [];

  for (let i = 0; i < targets.length; i++) {
    const user = targets[i];
    const progress = `[${i + 1}/${targets.length}]`;

    try {
      // Supprimer les anciens tokens non activés pour éviter les doublons
      await (prisma as any).freeTrial.deleteMany({
        where: { userId: user.id, claimed: false },
      });

      const token = randomBytes(32).toString('hex');

      if (!DRY_RUN) {
        // Créer le token en base
        await (prisma as any).freeTrial.create({
          data: { userId: user.id, token },
        });

        // Envoyer l'email
        await sendTrialInviteEmail({
          email: user.email,
          name: user.name ?? 'Membre',
          token,
        });
      }

      console.log(`${progress} ✅  ${user.email} ${DRY_RUN ? '(dry-run)' : ''}`);
      sent++;

      // Pause pour ne pas saturer le serveur SMTP
      if (!DRY_RUN && i < targets.length - 1) {
        await sleep(DELAY_MS);
      }
    } catch (err: any) {
      console.error(`${progress} ❌  ${user.email} — ${err.message}`);
      failed++;
      errors.push({ email: user.email, error: err.message });
    }
  }

  // Rapport final
  console.log('\n' + '='.repeat(55));
  console.log('📊 RAPPORT FINAL');
  console.log('='.repeat(55));
  console.log(`✅ Envoyés avec succès : ${sent}`);
  console.log(`❌ Échecs              : ${failed}`);
  console.log(`⏭️  Déjà traités        : ${skipped}`);
  console.log(`🚫 Fake exclus         : ${allUsers.length - realUsers.length}`);

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
