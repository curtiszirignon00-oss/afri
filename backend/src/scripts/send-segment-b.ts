/**
 * Email Segment B — Apprenants
 * Cible : email vérifié · plan free · ≥ 1 module complété · 0 transactions
 *         ET segment_b_email_sent = false
 *
 * Usage    : npx tsx src/scripts/send-segment-b.ts
 * Dry-run  : DRY_RUN=true npx tsx src/scripts/send-segment-b.ts
 *
 * Ctrl+C sauvegarde la progression. Relancer reprend où on s'est arrêté.
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';
import { sendSegmentBEmail } from '../services/email.service';

const DELAY_MS      = 1500;
const DRY_RUN       = process.env.DRY_RUN === 'true';
const PROGRESS_FILE = path.join(process.cwd(), 'segment-b-sent.json');

// Exclut les comptes générés automatiquement : prenom.nom123@gmail.com
const GENERATED_EMAIL_REGEX = /^[^@]+\.[^@]*\d+@gmail\.com$/i;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function loadSent(): Set<string> {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      return new Set<string>(data.sent ?? []);
    }
  } catch {}
  return new Set<string>();
}

function saveSent(sent: Set<string>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ sent: [...sent] }, null, 2));
}

let sentIds: Set<string>;

process.on('SIGINT', () => {
  saveSent(sentIds);
  console.log('\n\n⏸️  Interrompu. Progression sauvegardée.');
  console.log('   → Relancez la commande pour reprendre.\n');
  process.exit(0);
});

async function run() {
  console.log('='.repeat(65));
  console.log(`📚  Segment B — Apprenants${DRY_RUN ? ' [DRY-RUN]' : ''}`);
  console.log('    Cible : ≥ 1 module complété · 0 transactions · email non envoyé');
  console.log('='.repeat(65) + '\n');

  const users = await prisma.user.findMany({
    where: {
      email_verified_at:   { not: null },
      subscriptionTier:    'free',
      segment_b_email_sent: false,
      NOT: { email: { endsWith: '@fake-afribourse.com' } },
      learningProgress: { some: { is_completed: true } },
      portfolios:       { none: { transactions: { some: {} } } },
    },
    select: { id: true, email: true, name: true, lastname: true },
    orderBy: { created_at: 'asc' },
  });

  const filtered = users.filter(u => !GENERATED_EMAIL_REGEX.test(u.email));
  const skipped  = users.length - filtered.length;

  console.log(`👥  Utilisateurs éligibles : ${users.length}`);
  if (skipped > 0) console.log(`🚫  Exclus (pattern)       : ${skipped}`);
  console.log(`📬  À traiter              : ${filtered.length}\n`);

  if (filtered.length === 0) {
    console.log('✅  Aucun utilisateur éligible. Fin.\n');
    await prisma.$disconnect();
    return;
  }

  sentIds = loadSent();
  const isResume = sentIds.size > 0;
  if (isResume) console.log(`⏩  Reprise — ${sentIds.size} email(s) déjà envoyé(s), ignorés.\n`);

  const remaining = filtered.filter(u => !sentIds.has(u.id));
  console.log(`🚀  À envoyer : ${remaining.length}\n`);

  let sent   = 0;
  let errors = 0;
  const failedList: { email: string; error: string }[] = [];

  for (const user of remaining) {
    const displayName = user.name
      ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}`
      : 'Investisseur';

    process.stdout.write(`   [${sentIds.size + sent + errors + 1}/${filtered.length}] ${user.email} ... `);

    try {
      if (!DRY_RUN) {
        await sendSegmentBEmail({ email: user.email, name: displayName });
        // Marquer en DB pour éviter les doublons lors des prochaines exécutions
        await prisma.user.update({
          where: { id: user.id },
          data:  { segment_b_email_sent: true },
        });
      }
      sentIds.add(user.id);
      sent++;
      console.log(DRY_RUN ? '✅ (dry-run)' : '✅');
    } catch (e: any) {
      errors++;
      failedList.push({ email: user.email, error: e.message });
      console.log(`❌ ${e.message}`);
    }

    if ((sent + errors) % 10 === 0) saveSent(sentIds);
    if (sent + errors < remaining.length) await sleep(DELAY_MS);
  }

  saveSent(sentIds);

  console.log('\n' + '='.repeat(65));
  console.log(`✅  Envoyés  : ${sent}`);
  console.log(`❌  Échoués  : ${errors}`);
  console.log(`📊  Cumul    : ${sentIds.size} / ${filtered.length}`);

  if (failedList.length > 0) {
    console.log('\n⚠️  Emails en échec :');
    failedList.forEach(f => console.log(`   • ${f.email} — ${f.error}`));
  }

  console.log('='.repeat(65) + '\n');

  if (sentIds.size >= filtered.length) {
    if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
    console.log('🏁  Envoi complet — fichier de progression supprimé.\n');
  }

  await prisma.$disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error('💥 Erreur fatale:', err); process.exit(1); });
