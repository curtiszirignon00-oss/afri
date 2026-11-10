/**
 * Campagne — Invitation au groupe WhatsApp AfriBourse (suivi BRVM + articles)
 *
 * Simulation (défaut, rien n'est envoyé) : npx tsx src/scripts/send-whatsapp-group-invite.ts
 * Test sur une adresse               : npx tsx src/scripts/send-whatsapp-group-invite.ts --test=moi@exemple.com
 * Envoi réel                         : npx tsx src/scripts/send-whatsapp-group-invite.ts --send
 * Relancer les échecs                : npx tsx src/scripts/send-whatsapp-group-invite.ts --send --retry
 *
 * Ctrl+C sauvegarde la progression ; relancer reprend là où on s'est arrêté.
 *
 * Filtre « vrais utilisateurs » (même règle que les campagnes précédentes) :
 *  - email vérifié
 *  - hors comptes de test @fake-afribourse.com
 *  - hors comptes générés prenom.nom123@gmail.com
 *  - hors adresses jetables (yopmail, mailinator…)
 *  - respecte profile.email_notifications = false
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import prisma from '../config/prisma';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/L8NQTnsr4pR4vMH9YCPJd6';
const SITE_URL = 'https://www.africbourse.com';

const SEND = process.argv.includes('--send');
const RETRY = process.argv.includes('--retry');
const TEST_EMAIL = process.argv.find(a => a.startsWith('--test='))?.split('=')[1];
const DELAY_MS = 1200;

const PROGRESS_FILE = path.join(process.cwd(), 'whatsapp-invite-sent.json');
const FAILED_FILE = path.join(process.cwd(), 'whatsapp-invite-failed.json');

const GENERATED_EMAIL_REGEX = /^[^@]+\.[^@]*\d+@gmail\.com$/i;
// Domaines non délivrables ou manifestement bidons (placeholder OAuth, fautes de frappe, saisies au hasard, domaine interne)
const JUNK_DOMAINS = ['oauth.afribourse.com', 'example.com', 'example.org', 'gmai.com', 'gtg.com', 'azert.com', 'tret.com', 'ut.com', 'africbourse.com', 'afribourse.com'];
const DISPOSABLE = ['yopmail', 'mailinator', 'guerrillamail', 'tempmail', 'throwam', 'sharklasers', 'dispostable', 'trashmail', 'fakeinbox', 'spamgourmet'];

const SUBJECT = 'La BRVM bouge vite. Ne ratez plus rien 📲';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Contenu ─────────────────────────────────────────────────────────────────

function esc(s: string) {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

function buildHtml(firstName: string): string {
  const name = esc(firstName);
  const btn = (label: string) => `
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr><td style="background-color:#25D366;border-radius:12px;">
        <a href="${WHATSAPP_GROUP_URL}" target="_blank" style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;">${label}</a>
      </td></tr>
    </table>`;

  const item = (emoji: string, title: string, text: string) => `
    <tr><td style="padding:0 0 14px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="40" valign="top" style="font-size:22px;line-height:1;">${emoji}</td>
        <td valign="top" style="font-size:14px;color:#374151;line-height:1.6;"><strong style="color:#0F172A;">${title}</strong><br>${text}</td>
      </tr></table>
    </td></tr>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${SUBJECT}</title></head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">Le point BRVM du jour, les analyses et l'actualité des marchés, directement sur WhatsApp. Gratuit.&#847;&zwnj;&nbsp;&#847;</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F5F9;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <tr><td style="background-color:#FFFFFF;border-radius:16px 16px 0 0;padding:26px 40px 18px;border-bottom:1px solid #E2E8F0;text-align:center;">
          <span style="font-size:26px;font-weight:900;color:#1D4ED8;">AFRI</span><span style="font-size:26px;font-weight:900;color:#F97316;">BOURSE</span>
        </td></tr>

        <tr><td style="background-color:#075E54;background:linear-gradient(135deg,#075E54 0%,#128C7E 60%,#25D366 100%);padding:40px 40px 36px;text-align:center;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#D1FAE5;letter-spacing:2px;text-transform:uppercase;">Communauté AfriBourse · WhatsApp</p>
          <h1 style="margin:0 0 12px;font-size:26px;font-weight:900;color:#FFFFFF;line-height:1.3;">Suivre les marchés, c'est un travail à plein temps.<br>On le fait pour vous.</h1>
          <p style="margin:0;font-size:15px;color:#D1FAE5;line-height:1.6;">L'essentiel de la BRVM, chaque jour, là où vous êtes déjà : sur WhatsApp.</p>
        </td></tr>

        <tr><td style="background-color:#FFFFFF;padding:36px 40px;">
          <p style="margin:0 0 18px;font-size:15px;color:#374151;font-weight:600;">Bonjour ${name},</p>
          <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">Résultats d'entreprises, annonces de dividendes, variations de cours, décisions de la BCEAO… Sur les marchés financiers, l'information tombe tous les jours, et une nouvelle manquée peut être une opportunité ratée.</p>
          <p style="margin:0 0 26px;font-size:15px;color:#374151;line-height:1.7;">Rester à l'affût de tout, seul, c'est difficile. C'est pour ça que nous lançons le <strong>groupe WhatsApp AfriBourse</strong> : un seul endroit pour être alerté de ce qui compte vraiment, sans y passer vos journées.</p>

          <h2 style="margin:0 0 18px;font-size:17px;font-weight:800;color:#0F172A;border-bottom:2px solid #E2E8F0;padding-bottom:10px;">Ce que vous recevrez</h2>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            ${item('📊', 'Le point BRVM du jour', 'Clôture, indices, plus fortes hausses et baisses de la séance.')}
            ${item('🔔', 'Les alertes qui comptent', 'Résultats, dividendes, introductions en bourse, annonces importantes.')}
            ${item('📰', 'Nos nouveaux articles et analyses', 'Dès leur publication, pour comprendre ce qui se passe et pourquoi.')}
            ${item('🤝', 'Une communauté d\'investisseurs', 'Des passionnés de la BRVM qui, comme vous, veulent investir mieux.')}
          </table>

          ${btn('📲 Rejoindre le groupe WhatsApp')}
          <p style="margin:12px 0 28px;font-size:12px;color:#64748B;text-align:center;">Gratuit · Un clic suffit · Vous pouvez quitter le groupe à tout moment</p>

          <p style="margin:0 0 26px;font-size:15px;color:#374151;line-height:1.7;">Les marchés n'attendent personne. Avec AfriBourse, vous ne serez plus le dernier informé.</p>

          <p style="margin:0 0 4px;font-size:15px;color:#374151;">À tout de suite sur WhatsApp,</p>
          <p style="margin:0;font-size:16px;font-weight:800;color:#374151;">L'équipe AfriBourse</p>
        </td></tr>

        <tr><td style="background-color:#F8FAFC;border-radius:0 0 16px 16px;padding:18px 40px;text-align:center;border-top:1px solid #E2E8F0;">
          <p style="margin:0 0 4px;font-size:11px;color:#94A3B8;">Le bouton ne fonctionne pas ? Copiez ce lien : <a href="${WHATSAPP_GROUP_URL}" style="color:#128C7E;">${WHATSAPP_GROUP_URL}</a></p>
          <p style="margin:0 0 4px;font-size:11px;color:#94A3B8;">Vous recevez cet email car vous êtes inscrit sur <a href="${SITE_URL}" style="color:#1D4ED8;text-decoration:none;">AfriBourse</a>. Gérez vos préférences email depuis votre profil.</p>
          <p style="margin:0;font-size:11px;color:#94A3B8;">© ${new Date().getFullYear()} AfriBourse · <a href="${SITE_URL}" style="color:#1D4ED8;text-decoration:none;">africbourse.com</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildText(firstName: string): string {
  return `Bonjour ${firstName},

Résultats d'entreprises, dividendes, variations de cours, décisions de la BCEAO… Sur les marchés, l'information tombe tous les jours, et une nouvelle manquée peut être une opportunité ratée.

Rester à l'affût de tout, seul, c'est difficile. Rejoignez le groupe WhatsApp AfriBourse :
- Le point BRVM du jour (clôture, plus fortes hausses et baisses)
- Les alertes qui comptent (résultats, dividendes, annonces)
- Nos nouveaux articles et analyses
- Une communauté d'investisseurs BRVM

Rejoindre le groupe (gratuit) : ${WHATSAPP_GROUP_URL}

À tout de suite sur WhatsApp,
L'équipe AfriBourse — ${SITE_URL}`;
}

// ── Destinataires ───────────────────────────────────────────────────────────

async function getRecipients() {
  const users = await prisma.user.findMany({
    where: {
      email_verified_at: { not: null },
      NOT: { email: { endsWith: '@fake-afribourse.com' } },
    },
    select: { id: true, email: true, name: true, investorProfile: { select: { email_notifications: true } } },
    orderBy: { created_at: 'asc' },
  });
  const total = await prisma.user.count();

  let generated = 0, disposable = 0, optedOut = 0;
  const seen = new Set<string>();
  const kept = users.filter(u => {
    const e = u.email.toLowerCase().trim();
    if (GENERATED_EMAIL_REGEX.test(e)) { generated++; return false; }
    if (DISPOSABLE.some(d => e.includes(d)) || JUNK_DOMAINS.includes(e.split('@')[1])) { disposable++; return false; }
    if (u.investorProfile && u.investorProfile.email_notifications === false) { optedOut++; return false; }
    if (seen.has(e)) return false;
    seen.add(e);
    return true;
  });

  return { kept, stats: { total, verifiedNonTest: users.length, generated, disposable, optedOut } };
}

// ── Envoi ───────────────────────────────────────────────────────────────────

function makeTransport() {
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
  });
}

const FROM = `"${process.env.SMTP_FROM_NAME || 'AfriBourse'}" <${process.env.SMTP_FROM_EMAIL || 'noreply@africbourse.com'}>`;

function firstNameOf(name: string | null) {
  const n = (name ?? '').trim().split(/\s+/)[0];
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : 'Investisseur';
}

interface Failed { id: string; email: string; error: string }
const load = <T>(f: string, key: string, def: T): T => {
  try { return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf-8'))[key] ?? def : def; } catch { return def; }
};

async function main() {
  console.log('='.repeat(65));
  console.log(`📲  Campagne — Invitation groupe WhatsApp ${SEND ? '[ENVOI RÉEL]' : TEST_EMAIL ? '[TEST]' : '[SIMULATION]'}`);
  console.log('='.repeat(65));

  // Aperçu HTML local pour relecture
  const previewPath = path.join(process.cwd(), 'whatsapp-invite-preview.html');
  fs.writeFileSync(previewPath, buildHtml('Aminata'));
  console.log(`🖼️   Aperçu : ${previewPath}`);

  if (TEST_EMAIL) {
    const t = makeTransport();
    await t.verify();
    await t.sendMail({ from: FROM, to: TEST_EMAIL, subject: `[TEST] ${SUBJECT}`, html: buildHtml('Investisseur'), text: buildText('Investisseur') });
    console.log(`✅  Email de test envoyé à ${TEST_EMAIL}`);
    return;
  }

  const { kept, stats } = await getRecipients();
  console.log(`\n👥  Comptes en base                 : ${stats.total}`);
  console.log(`🚫  Non vérifiés / comptes de test  : ${stats.total - stats.verifiedNonTest}`);
  console.log(`🚫  Générés (prenom.nom123@gmail)   : ${stats.generated}`);
  console.log(`🚫  Jetables / domaines bidons       : ${stats.disposable}`);
  console.log(`🚫  Désinscrits des emails          : ${stats.optedOut}`);
  console.log(`📨  Destinataires réels             : ${kept.length}`);

  if (!SEND) {
    console.log('\nÉchantillon de destinataires :');
    kept.slice(0, 8).forEach(u => console.log(`   - ${u.email}`));
    console.log('\nℹ️  Simulation : aucun email envoyé. Ajoutez --send pour envoyer.');
    return;
  }

  const transporter = makeTransport();
  await transporter.verify();
  console.log('✅  SMTP OK\n');

  const sentIds = new Set<string>(load<string[]>(PROGRESS_FILE, 'sent', []));
  let failed: Failed[] = load<Failed[]>(FAILED_FILE, 'failed', []);
  const save = () => {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ sent: [...sentIds] }));
    fs.writeFileSync(FAILED_FILE, JSON.stringify({ failed }, null, 2));
  };
  process.on('SIGINT', () => { save(); console.log('\n⏸️  Interrompu, progression sauvegardée.'); process.exit(0); });

  const failedIds = new Set(failed.map(f => f.id));
  const queue = RETRY ? kept.filter(u => failedIds.has(u.id)) : kept.filter(u => !sentIds.has(u.id));
  if (sentIds.size) console.log(`⏩  ${sentIds.size} déjà envoyés, ignorés.`);
  console.log(`📤  ${queue.length} à envoyer\n`);

  let ok = 0, ko = 0;
  for (const u of queue) {
    const fn = firstNameOf(u.name);
    process.stdout.write(`   [${ok + ko + 1}/${queue.length}] ${u.email} ... `);
    try {
      await transporter.sendMail({ from: FROM, to: u.email, subject: SUBJECT, html: buildHtml(fn), text: buildText(fn) });
      sentIds.add(u.id);
      failed = failed.filter(f => f.id !== u.id);
      ok++; console.log('✅');
    } catch (e: any) {
      ko++; console.log(`❌ ${e.message}`);
      if (!failed.find(f => f.id === u.id)) failed.push({ id: u.id, email: u.email, error: e.message });
    }
    if ((ok + ko) % 10 === 0) save();
    await sleep(DELAY_MS);
  }
  save();

  console.log('\n' + '='.repeat(65));
  console.log(`✅  Envoyés : ${ok}   ❌ Échecs : ${ko}   📊 Cumul : ${sentIds.size}/${kept.length}`);
  if (failed.length) console.log(`   → Relancer : npx tsx src/scripts/send-whatsapp-group-invite.ts --send --retry`);
  console.log('='.repeat(65));
}

main()
  .catch(err => { console.error('💥 Erreur fatale :', err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
