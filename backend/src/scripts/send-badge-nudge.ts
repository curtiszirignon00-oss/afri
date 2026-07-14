/**
 * Email Badge Nudge — XP progress + badges proches + actions disponibles
 *
 * Cible : email vérifié · profil existant · total_xp > 50 · dernier nudge > 30 jours
 *
 * Contenu de l'email (personnalisé par user) :
 *   → Barre de progression XP vers le prochain niveau
 *   → Liste des badges non encore débloqués (max 3)
 *   → Actions concrètes disponibles avec XP gagnable (max 4)
 *
 * Usage    : npx tsx src/scripts/send-badge-nudge.ts
 * Dry-run  : DRY_RUN=true npx tsx src/scripts/send-badge-nudge.ts
 * Force    : FORCE=true npx tsx src/scripts/send-badge-nudge.ts  (ignore le cooldown 30j)
 *
 * Ctrl+C sauvegarde la progression. Relancer reprend où on s'est arrêté.
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';
import { sendBadgeNudgeEmail, BadgeNudgeAction } from '../services/email.service';
import { getXPRequiredForLevel, calculateLevelFromXP } from '../services/xp.service';

const DELAY_MS           = 1500;
const DRY_RUN            = process.env.DRY_RUN  === 'true';
const FORCE              = process.env.FORCE     === 'true'; // Ignore cooldown
const NUDGE_COOLDOWN_DAYS = 30;
const PROGRESS_FILE      = path.join(process.cwd(), 'badge-nudge-sent.json');
const FRONTEND_URL       = process.env.FRONTEND_URL ?? 'https://www.africbourse.com';

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
  console.log(`🎯  Badge Nudge — XP & badges proches${DRY_RUN ? ' [DRY-RUN]' : ''}${FORCE ? ' [FORCE]' : ''}`);
  console.log(`    Cooldown : ${FORCE ? 'désactivé' : NUDGE_COOLDOWN_DAYS + ' jours'}`);
  console.log('='.repeat(65) + '\n');

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - NUDGE_COOLDOWN_DAYS);

  const cooldownFilter = FORCE
    ? {}
    : {
        OR: [
          { badge_nudge_email_sent_at: null },
          { badge_nudge_email_sent_at: { lt: cutoff } },
        ],
      };

  const users = await prisma.user.findMany({
    where: {
      email_verified_at: { not: null },
      NOT: { email: { endsWith: '@fake-afribourse.com' } },
      profile: { total_xp: { gt: 50 } },
      ...cooldownFilter,
    },
    select: {
      id: true,
      email: true,
      name: true,
      lastname: true,
      badge_nudge_email_sent_at: true,
      profile: {
        select: {
          total_xp: true,
          level: true,
          current_streak: true,
          achievements: { select: { achievementId: true } },
        },
      },
      portfolios: {
        select: { transactions: { select: { id: true }, take: 1 } },
      },
      learningProgress: {
        where: { is_completed: true },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { created_at: 'asc' },
  });

  // Charger tous les badges disponibles
  const allBadges = await prisma.achievement.findMany({
    where: { is_hidden: false },
    select: { id: true, name: true, icon: true, description: true, xp_reward: true, category: true },
    orderBy: { xp_reward: 'asc' },
  });

  const filtered = users.filter(u => !GENERATED_EMAIL_REGEX.test(u.email) && u.profile);
  const skipped  = users.length - filtered.length;

  console.log(`👥  Utilisateurs éligibles : ${users.length}`);
  if (skipped > 0) console.log(`🚫  Exclus (sans profil/pattern) : ${skipped}`);
  console.log(`🏅  Badges disponibles : ${allBadges.length}`);
  console.log(`📬  À traiter : ${filtered.length}\n`);

  if (filtered.length === 0) {
    console.log('✅  Aucun utilisateur éligible. Fin.\n');
    await prisma.$disconnect();
    return;
  }

  sentIds = loadSent();
  if (sentIds.size > 0) console.log(`⏩  Reprise — ${sentIds.size} email(s) déjà envoyé(s), ignorés.\n`);

  const remaining = filtered.filter(u => !sentIds.has(u.id));
  console.log(`🚀  À envoyer : ${remaining.length}\n`);

  let sent   = 0;
  let errors = 0;
  const failedList: { email: string; error: string }[] = [];

  for (const user of remaining) {
    const profile = user.profile!;

    const totalXP   = profile.total_xp;
    const curLevel  = calculateLevelFromXP(totalXP);
    const nextLevel = curLevel + 1;
    const xpForNext = getXPRequiredForLevel(nextLevel);
    const xpForCur  = curLevel <= 1 ? 0 : getXPRequiredForLevel(curLevel);
    const xpNeeded  = Math.max(0, xpForNext - totalXP);
    const xpInLevel = Math.max(0, totalXP - xpForCur);
    const levelRange = xpForNext - xpForCur;
    const progressPct = levelRange > 0 ? Math.min(100, Math.round((xpInLevel / levelRange) * 100)) : 0;

    // Badges non débloqués
    const earnedIds    = new Set(profile.achievements.map((a: any) => a.achievementId));
    const unearnedBadges = allBadges.filter(b => !earnedIds.has(b.id)).slice(0, 3);

    // Actions disponibles
    const hasTraded  = user.portfolios.some((p: any) => p.transactions.length > 0);
    const hasModule  = user.learningProgress.length > 0;
    const hasStreak7 = profile.current_streak >= 7;

    const actions: BadgeNudgeAction[] = [];
    if (!hasModule) {
      actions.push({ emoji: '📚', label: 'Complète ton premier module de formation', xp: 200, url: `${FRONTEND_URL}/learn` });
    } else {
      actions.push({ emoji: '📚', label: 'Continue ta formation (1 module = 200 XP)', xp: 200, url: `${FRONTEND_URL}/learn` });
    }
    if (!hasTraded) {
      actions.push({ emoji: '📊', label: 'Fais ton premier trade simulé', xp: 200, url: `${FRONTEND_URL}/markets` });
    } else {
      actions.push({ emoji: '📊', label: "Passe un trade aujourd'hui (10 XP/trade)", xp: 10, url: `${FRONTEND_URL}/markets` });
    }
    if (!hasStreak7) {
      const daysLeft = Math.max(1, 7 - profile.current_streak);
      actions.push({ emoji: '🔥', label: `Maintiens ta série ${daysLeft}j de plus → badge Streak 7j`, xp: 200, url: `${FRONTEND_URL}/dashboard` });
    }
    actions.push({ emoji: '👤', label: 'Complète ton profil investisseur', xp: 250, url: `${FRONTEND_URL}/profile` });
    actions.push({ emoji: '🤝', label: 'Invite un ami à rejoindre AfriBourse', xp: 500, url: `${FRONTEND_URL}/profile` });

    const displayName = user.name
      ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}`
      : 'Investisseur';

    const idx = sentIds.size + sent + errors + 1;
    process.stdout.write(
      `   [${idx}/${filtered.length}] ${user.email} · Niv.${curLevel} · −${xpNeeded} XP · ${unearnedBadges.length} badges dispo ... `
    );

    try {
      if (!DRY_RUN) {
        await sendBadgeNudgeEmail({
          email:            user.email,
          name:             displayName,
          currentXP:        totalXP,
          currentLevel:     curLevel,
          xpNeeded,
          nextLevel,
          progressPercent:  progressPct,
          unearnedBadges,
          availableActions: actions,
        });
        await prisma.user.update({
          where: { id: user.id },
          data:  { badge_nudge_email_sent_at: new Date() },
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
