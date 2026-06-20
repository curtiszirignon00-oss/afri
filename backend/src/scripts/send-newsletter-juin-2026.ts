/**
 * Newsletter hebdomadaire — Semaine du 8 au 14 juin 2026
 *
 * Usage normal  : npx tsx src/scripts/send-newsletter-juin-2026.ts
 * Retry échoués : npx tsx src/scripts/send-newsletter-juin-2026.ts --retry
 *
 * Ctrl+C sauvegarde la progression. Relancer reprend où on s'est arrêté.
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import prisma from '../config/prisma';
import { sendWeeklyNewsletterJuin2026Email } from '../services/email.service';

const DELAY_MS = 1500;
const DRY_RUN  = process.env.DRY_RUN === 'true';
const PROGRESS_FILE = path.join(process.cwd(), 'newsletter-juin-2026-sent.json');
const FAILED_FILE   = path.join(process.cwd(), 'newsletter-juin-2026-failed.json');

// Exclut les comptes générés automatiquement : prenom.nom123@gmail.com
const GENERATED_EMAIL_REGEX = /^[^@]+\.[^@]*\d+@gmail\.com$/i;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Persistance ──────────────────────────────────────────────────────────────

interface FailedEntry { id: string; email: string; error: string }

function loadSent(): Set<string> {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      return new Set<string>(data.sent ?? []);
    }
  } catch { /* corrompu, on repart de zéro */ }
  return new Set<string>();
}

function saveSent(sent: Set<string>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ sent: [...sent] }, null, 2));
}

function loadFailed(): FailedEntry[] {
  try {
    if (fs.existsSync(FAILED_FILE)) {
      const data = JSON.parse(fs.readFileSync(FAILED_FILE, 'utf-8'));
      return data.failed ?? [];
    }
  } catch {}
  return [];
}

function saveFailed(failed: FailedEntry[]) {
  fs.writeFileSync(FAILED_FILE, JSON.stringify({ failed }, null, 2));
}

// ── Ctrl+C ───────────────────────────────────────────────────────────────────

let sentIds: Set<string>;
let failedList: FailedEntry[];

process.on('SIGINT', () => {
  saveSent(sentIds);
  saveFailed(failedList);
  console.log('\n\n⏸️  Envoi interrompu. Progression sauvegardée.');
  console.log(`   → Relancez la commande pour reprendre.\n`);
  process.exit(0);
});

// ── Mode --retry ─────────────────────────────────────────────────────────────

async function runRetry() {
  const previousFailed = loadFailed();
  if (previousFailed.length === 0) {
    console.log('✅  Aucun email échoué à relancer.\n');
    return;
  }

  console.log('='.repeat(65));
  console.log(`🔁  Retry — ${previousFailed.length} email(s) échoué(s) à relancer`);
  console.log('='.repeat(65) + '\n');

  sentIds   = loadSent();
  failedList = [];

  let sent   = 0;
  let errors = 0;

  for (const entry of previousFailed) {
    process.stdout.write(`   [${sent + errors + 1}/${previousFailed.length}] ${entry.email} ... `);
    try {
      if (!DRY_RUN) {
        await sendWeeklyNewsletterJuin2026Email({ email: entry.email, name: 'Investisseur' });
      }
      sentIds.add(entry.id);
      sent++;
      console.log('✅');
    } catch (e: any) {
      failedList.push({ id: entry.id, email: entry.email, error: e.message });
      errors++;
      console.log(`❌ ${e.message}`);
    }
    if (sent + errors < previousFailed.length) await sleep(DELAY_MS);
  }

  saveSent(sentIds);
  saveFailed(failedList);

  console.log('\n' + '='.repeat(65));
  console.log(`✅  Envoyés  : ${sent}`);
  console.log(`❌  Échoués  : ${errors}`);
  if (failedList.length > 0) {
    console.log(`\n   Emails toujours en échec :`);
    failedList.forEach(f => console.log(`   • ${f.email} — ${f.error}`));
  } else {
    console.log('\n🏁  Tous les emails échoués ont été renvoyés avec succès.');
  }
  console.log('='.repeat(65) + '\n');
}

// ── Test SMTP avant envoi ─────────────────────────────────────────────────────

async function checkSmtp(): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);

  console.log('\n🔌 Vérification SMTP...');
  console.log(`   Host : ${host}`);
  console.log(`   Port : ${port}`);
  console.log(`   User : ${user}`);
  console.log(`   Pass : ${pass ? pass.slice(0, 4) + '****' + pass.slice(-2) : '(vide)'}`);

  if (!host || !user || !pass) {
    console.error('\n❌ Credentials SMTP manquants dans le .env — impossible d\'envoyer.');
    console.error('   Copiez SMTP_HOST / SMTP_USER / SMTP_PASS depuis le dashboard Render.');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host, port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
  });

  try {
    await transporter.verify();
    console.log('   ✅ Connexion SMTP OK\n');
    return true;
  } catch (err: any) {
    console.error(`\n❌ Connexion SMTP échouée : ${err.message}`);
    console.error('   → Le SMTP_PASS du .env local est probablement expiré ou différent de Render.');
    console.error('   → Récupérez la clé active sur : app.brevo.com → SMTP & API → Clés SMTP');
    console.error('   → Ou lancez le script directement depuis le shell Render.');
    return false;
  }
}

// ── Mode normal ───────────────────────────────────────────────────────────────

async function run() {
  const smtpOk = DRY_RUN ? true : await checkSmtp();
  if (!smtpOk) { await prisma.$disconnect(); process.exit(1); }

  sentIds    = loadSent();
  failedList = loadFailed();
  const isResume = sentIds.size > 0;

  console.log('='.repeat(65));
  console.log(`📧  Newsletter Juin 2026 — Semaine du 8 au 14 juin${DRY_RUN ? ' [DRY-RUN]' : ''}`);
  console.log('='.repeat(65));
  if (isResume) {
    console.log(`\n⏩  Reprise — ${sentIds.size} email(s) déjà envoyé(s), ignorés.`);
  }
  if (failedList.length > 0) {
    console.log(`⚠️   ${failedList.length} email(s) en échec lors d'une session précédente (utilisez --retry pour les relancer).`);
  }
  console.log();

  const users = await prisma.user.findMany({
    where: {
      email_verified_at: { not: null },
      NOT: { email: { endsWith: '@fake-afribourse.com' } },
    },
    select: { id: true, email: true, name: true, lastname: true },
    orderBy: { created_at: 'asc' },
  });

  const filtered = users.filter(u => !GENERATED_EMAIL_REGEX.test(u.email));
  const skipped  = users.length - filtered.length;
  if (skipped > 0) console.log(`🚫  ${skipped} compte(s) exclus (pattern prenom.nom123@gmail.com)`);

  const remaining = filtered.filter(u => !sentIds.has(u.id));
  console.log(`👥  ${remaining.length} utilisateur(s) restant(s) sur ${filtered.length} éligibles\n`);

  let sent   = 0;
  let errors = 0;

  for (const user of remaining) {
    const displayName = user.name
      ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}`
      : 'Investisseur';

    process.stdout.write(`   [${sentIds.size + sent + errors + 1}/${filtered.length}] ${user.email} ... `);

    try {
      if (!DRY_RUN) {
        await sendWeeklyNewsletterJuin2026Email({ email: user.email, name: displayName });
      }
      sentIds.add(user.id);
      sent++;
      console.log(DRY_RUN ? '✅ (dry-run)' : '✅');
      failedList = failedList.filter(f => f.id !== user.id);
    } catch (e: any) {
      errors++;
      console.log(`❌ ${e.message}`);
      // Ajouter à la liste des échecs (sans doublon)
      if (!failedList.find(f => f.id === user.id)) {
        failedList.push({ id: user.id, email: user.email, error: e.message });
      }
    }

    if ((sent + errors) % 10 === 0) { saveSent(sentIds); saveFailed(failedList); }

    if (sent + errors < remaining.length) await sleep(DELAY_MS);
  }

  saveSent(sentIds);
  saveFailed(failedList);

  console.log('\n' + '='.repeat(65));
  console.log(`✅  Envoyés cette session  : ${sent}`);
  console.log(`❌  Échoués cette session  : ${errors}`);
  console.log(`📊  Total envoyés (cumul)  : ${sentIds.size} / ${filtered.length}`);

  if (failedList.length > 0) {
    console.log(`\n⚠️   ${failedList.length} email(s) en échec (sauvegardés dans newsletter-juin-2026-failed.json) :`);
    failedList.forEach(f => console.log(`   • ${f.email} — ${f.error}`));
    console.log(`\n   → Pour relancer : npx tsx src/scripts/send-newsletter-juin-2026.ts --retry`);
  }

  console.log('='.repeat(65) + '\n');

  if (sentIds.size >= filtered.length && failedList.length === 0) {
    fs.unlinkSync(PROGRESS_FILE);
    fs.unlinkSync(FAILED_FILE);
    console.log('🏁  Envoi complet — fichiers de progression supprimés.\n');
  }

  await prisma.$disconnect();
}

// ── Entrée ───────────────────────────────────────────────────────────────────

const isRetry = process.argv.includes('--retry');

(isRetry ? runRetry() : run())
  .then(() => process.exit(0))
  .catch(err => { console.error('💥 Erreur fatale:', err); process.exit(1); });
