/**
 * Envoi de la newsletter IPO Dangote à tous les utilisateurs confirmés.
 * Usage: npx tsx src/scripts/send-dangote-ipo-newsletter.ts
 *
 * Arrêt : Ctrl+C — la progression est sauvegardée dans dangote-newsletter-sent.json
 * Reprise : relancer la même commande, les emails déjà envoyés sont ignorés.
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';
import { sendDangoteIPONewsletterEmail } from '../services/email.service';

const DELAY_MS = 1500;
const PROGRESS_FILE = path.join(process.cwd(), 'dangote-newsletter-sent.json');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Chargement / sauvegarde de la progression ───────────────────────────────

function loadSent(): Set<string> {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      return new Set<string>(data.sent ?? []);
    }
  } catch { /* fichier corrompu, on repart de zéro */ }
  return new Set<string>();
}

function saveSent(sent: Set<string>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ sent: [...sent] }, null, 2));
}

// ── Gestion Ctrl+C propre ────────────────────────────────────────────────────

let sentIds: Set<string>;

process.on('SIGINT', () => {
  saveSent(sentIds);
  console.log('\n\n⏸️  Envoi interrompu. Progression sauvegardée.');
  console.log(`   → Relancez la commande pour reprendre là où vous vous êtes arrêté.\n`);
  process.exit(0);
});

// ── Script principal ─────────────────────────────────────────────────────────

async function run() {
  sentIds = loadSent();
  const isResume = sentIds.size > 0;

  console.log('='.repeat(65));
  console.log('📧  Newsletter IPO Dangote — Envoi à tous les utilisateurs');
  console.log('='.repeat(65));
  if (isResume) {
    console.log(`\n⏩  Reprise détectée — ${sentIds.size} email(s) déjà envoyé(s), ignorés.\n`);
  } else {
    console.log();
  }

  const users = await prisma.user.findMany({
    where: {
      email_verified_at: { not: null },
    },
    select: { id: true, email: true, name: true, lastname: true },
    orderBy: { created_at: 'asc' },
  });

  const remaining = users.filter(u => !sentIds.has(u.id));
  console.log(`👥  ${remaining.length} utilisateur(s) restant(s) sur ${users.length} total\n`);

  let sent = 0;
  let errors = 0;

  for (const user of remaining) {
    const displayName = user.name
      ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}`
      : 'Investisseur';

    process.stdout.write(`   [${sentIds.size + sent + errors + 1}/${users.length}] ${user.email} ... `);

    try {
      await sendDangoteIPONewsletterEmail({ email: user.email, name: displayName });
      sentIds.add(user.id);
      sent++;
      console.log('✅');
    } catch (e: any) {
      errors++;
      console.log(`❌ ${e.message}`);
    }

    // Sauvegarde toutes les 10 emails
    if ((sent + errors) % 10 === 0) saveSent(sentIds);

    if (sent + errors < remaining.length) await sleep(DELAY_MS);
  }

  // Sauvegarde finale
  saveSent(sentIds);

  console.log('\n' + '='.repeat(65));
  console.log(`✅  Envoyés cette session : ${sent}`);
  console.log(`❌  Erreurs              : ${errors}`);
  console.log(`📊  Total envoyés (cumul): ${sentIds.size} / ${users.length}`);
  console.log('='.repeat(65) + '\n');

  if (sentIds.size >= users.length) {
    // Nettoyage du fichier de progression une fois terminé
    fs.unlinkSync(PROGRESS_FILE);
    console.log('🏁  Envoi complet — fichier de progression supprimé.\n');
  }
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error('💥 Erreur fatale:', err); process.exit(1); });
