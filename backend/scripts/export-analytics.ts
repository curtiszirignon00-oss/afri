/**
 * Script d'export analytique complet — AfriBourse
 * Exporte toutes les collections nécessaires à l'analyse des comportements utilisateurs
 * en un seul fichier Excel multi-onglets organisé par domaine.
 * Les ~2000 comptes fictifs (@fake-afribourse.com) sont exclus de tous les exports.
 *
 * Usage: npx ts-node scripts/export-analytics.ts [--days=90]
 *
 * Onglets générés:
 *   1.  KPIs Résumé          — métriques clés en un coup d'œil
 *   2.  Utilisateurs         — base utilisateurs + profils
 *   3.  ADN Investisseur     — questionnaire risque/horizon
 *   4.  Navigation           — pages vues (PageView)
 *   5.  Actions              — actions trackées (UserActionTracking)
 *   6.  Paywall & Features   — utilisation features + blocages paywall
 *   7.  Rétention            — cohortes D+1 / D+7 / D+30 par semaine d'inscription
 *   8.  Gamification XP      — historique XP par raison
 *   9.  Achievements         — badges débloqués par utilisateur
 *   10. Apprentissage        — progression par module
 *   11. Simulation Trading   — transactions + snapshots portfolio
 *   12. Watchlist            — titres suivis par utilisateur
 *   13. Social Posts         — posts + engagement
 *   14. Social Communautés   — adhésions communautés
 *   15. Follows              — graphe social (qui suit qui)
 *   16. Intents Abonnement   — intentions de souscription (funnel revenue)
 *   17. Essais Gratuits      — free trials activés / expirés
 *   18. Challenge 2026       — participants + progression
 *   19. Alertes Prix         — alertes créées + déclenchées
 *   20. Événements           — inscriptions événements
 *   21. Audit Sécurité       — logins / echecs / actions sensibles
 *   22. Avis Utilisateurs    — reviews + notes
 *   23. Modération           — signalements + bans
 */

import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

// Filtre Prisma pour exclure les comptes fictifs dans TOUTES les requêtes
const REAL_USER = { email: { not: { endsWith: '@fake-afribourse.com' } } } as const;

// ─── helpers ───────────────────────────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

function daysAgo(n: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d;
}

function fmt(d: Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR');
}

function styleHeader(row: ExcelJS.Row, color: string) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
  row.height = 20;
}

function autoWidth(ws: ExcelJS.Worksheet) {
  ws.columns.forEach((col) => {
    let maxLen = (col.header as string)?.length ?? 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const v = cell.value?.toString() ?? '';
      if (v.length > maxLen) maxLen = v.length;
    });
    col.width = Math.min(maxLen + 2, 60);
  });
}

// ─── main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const windowDays = parseInt(args.days ?? '365');
  const since = daysAgo(windowDays);
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 16);

  console.log(`\n📊 Export analytique AfriBourse — fenêtre ${windowDays} jours (depuis ${fmtDate(since)})\n`);

  const exportsDir = path.join(__dirname, '..', 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'AfriBourse Analytics';
  wb.created = now;

  // Créer l'onglet KPIs en premier (sera peuplé en dernier une fois toutes les données chargées)
  const wsKpi = wb.addWorksheet('KPIs Résumé', { properties: { tabColor: { argb: 'FFD50000' } } });

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 1 — DONNÉES BRUTES UTILISATEURS
  // ════════════════════════════════════════════════════════════════════════════

  // ── Onglet 2 : Utilisateurs ──────────────────────────────────────────────
  console.log('👥 [2/23] Export utilisateurs...');
  const users = await prisma.user.findMany({
    where: { ...REAL_USER },
    include: { profile: true },
    orderBy: { created_at: 'desc' },
  });
  // IDs des vrais utilisateurs — utilisés pour filtrer les tables sans relation User directe
  const realUserIds = users.map(u => u.id);

  {
    const ws = wb.addWorksheet('Utilisateurs');
    ws.columns = [
      { header: 'User ID', key: 'id' },
      { header: 'Prénom', key: 'name' },
      { header: 'Nom', key: 'lastname' },
      { header: 'Email', key: 'email' },
      { header: 'Téléphone', key: 'telephone' },
      { header: 'Rôle', key: 'role' },
      { header: 'Abonnement', key: 'subscriptionTier' },
      { header: 'Email vérifié', key: 'email_verified' },
      { header: 'Date vérif email', key: 'email_verified_at' },
      { header: 'Inscrit le', key: 'created_at' },
      { header: 'Dernier login', key: 'last_login_at' },
      { header: 'Onboardé le', key: 'onboardedAt' },
      { header: 'Nouveau user', key: 'isNewUser' },
      { header: 'Username', key: 'username' },
      { header: 'Pays', key: 'country' },
      { header: 'Profession', key: 'profession' },
      { header: 'Niveau', key: 'level' },
      { header: 'XP Total', key: 'total_xp' },
      { header: 'Streak actuel', key: 'current_streak' },
      { header: 'Streak max', key: 'longest_streak' },
      { header: 'Rang global', key: 'global_rank' },
      { header: 'Rang pays', key: 'country_rank' },
      { header: 'Followers', key: 'followers_count' },
      { header: 'Following', key: 'following_count' },
      { header: 'Posts', key: 'posts_count' },
      { header: 'Score réput.', key: 'reputation_score' },
      { header: 'Profil public', key: 'is_public' },
      { header: 'Survey complété', key: 'survey_completed' },
      { header: 'Canal découverte', key: 'discovery_channel' },
      { header: 'Reengag. email0', key: 'reengage0' },
      { header: 'Reengag. email1', key: 'reengage1' },
      { header: 'Reengag. email2', key: 'reengage2' },
      { header: 'Reengag. email3', key: 'reengage3' },
    ];
    styleHeader(ws.getRow(1), 'FF1565C0');

    for (const u of users) {
      ws.addRow({
        id: u.id,
        name: u.name,
        lastname: u.lastname,
        email: u.email,
        telephone: u.telephone ?? '',
        role: u.role,
        subscriptionTier: u.subscriptionTier,
        email_verified: u.email_verified_at ? 'Oui' : 'Non',
        email_verified_at: fmt(u.email_verified_at),
        created_at: fmt(u.created_at),
        last_login_at: fmt(u.last_login_at),
        onboardedAt: fmt(u.onboardedAt),
        isNewUser: u.isNewUser ? 'Oui' : 'Non',
        username: u.profile?.username ?? '',
        country: u.profile?.country ?? '',
        profession: u.profile?.profession ?? '',
        level: u.profile?.level ?? 1,
        total_xp: u.profile?.total_xp ?? 0,
        current_streak: u.profile?.current_streak ?? 0,
        longest_streak: u.profile?.longest_streak ?? 0,
        global_rank: u.profile?.global_rank ?? '',
        country_rank: u.profile?.country_rank ?? '',
        followers_count: u.profile?.followers_count ?? 0,
        following_count: u.profile?.following_count ?? 0,
        posts_count: u.profile?.posts_count ?? 0,
        reputation_score: u.profile?.reputation_score ?? 0,
        is_public: u.profile?.is_public ? 'Oui' : 'Non',
        survey_completed: u.profile?.survey_completed ? 'Oui' : 'Non',
        discovery_channel: u.profile?.discovery_channel ?? '',
        reengage0: u.reengagement_email0_sent ? 'Envoyé' : 'Non',
        reengage1: u.reengagement_email1_sent ? 'Envoyé' : 'Non',
        reengage2: u.reengagement_email2_sent ? 'Envoyé' : 'Non',
        reengage3: u.reengagement_email3_sent ? 'Envoyé' : 'Non',
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${users.length} utilisateurs`);
  }

  // ── Onglet 3 : ADN Investisseur ──────────────────────────────────────────
  console.log('🧬 [3/23] Export ADN Investisseur...');
  const investorProfiles = await prisma.investorProfile.findMany({
    where: { user: REAL_USER },
    include: { user: { select: { name: true, lastname: true, email: true, subscriptionTier: true } } },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('ADN Investisseur');
    ws.columns = [
      { header: 'User ID', key: 'user_id' },
      { header: 'Nom', key: 'name' },
      { header: 'Email', key: 'email' },
      { header: 'Abonnement', key: 'subscriptionTier' },
      { header: 'Onboarding complété', key: 'onboarding_completed' },
      { header: 'Date onboarding', key: 'onboarding_date' },
      { header: 'Profil de risque', key: 'risk_profile' },
      { header: 'Horizon investissement', key: 'investment_horizon' },
      { header: 'Secteurs favoris', key: 'favorite_sectors' },
      { header: 'Style investissement', key: 'investment_style' },
      { header: 'Fréquence trading', key: 'trading_frequency' },
      { header: 'Montant mensuel (FCFA)', key: 'monthly_investment' },
      { header: 'Niveau expérience', key: 'experience_level' },
      { header: 'Objectif de vie', key: 'life_goal' },
      { header: 'Source de revenus', key: 'income_source' },
      { header: 'Budget mensuel (FCFA)', key: 'monthly_budget' },
      { header: 'Score investisseur', key: 'investor_score' },
      { header: 'Compte réel existant', key: 'has_real_account_text' },
      { header: 'Disclaimer accepté', key: 'disclaimer_accepted_at' },
      { header: 'Créé le', key: 'created_at' },
    ];
    styleHeader(ws.getRow(1), 'FF6A1B9A');

    for (const ip of investorProfiles) {
      ws.addRow({
        user_id: ip.user_id,
        name: `${ip.user.name} ${ip.user.lastname}`,
        email: ip.user.email,
        subscriptionTier: ip.user.subscriptionTier,
        onboarding_completed: ip.onboarding_completed ? 'Oui' : 'Non',
        onboarding_date: fmt(ip.onboarding_date),
        risk_profile: ip.risk_profile ?? '',
        investment_horizon: ip.investment_horizon ?? '',
        favorite_sectors: ip.favorite_sectors.join(', '),
        investment_style: ip.investment_style ?? '',
        trading_frequency: ip.trading_frequency ?? '',
        monthly_investment: ip.monthly_investment ?? '',
        experience_level: ip.experience_level ?? '',
        life_goal: ip.life_goal ?? '',
        income_source: ip.income_source ?? '',
        monthly_budget: ip.monthly_budget ?? '',
        investor_score: ip.investor_score ?? '',
        has_real_account_text: '',
        disclaimer_accepted_at: fmt(ip.disclaimer_accepted_at),
        created_at: fmt(ip.created_at),
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${investorProfiles.length} profils investisseur`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 2 — COMPORTEMENT & ANALYTICS
  // ════════════════════════════════════════════════════════════════════════════

  // ── Onglet 4 : Navigation (PageViews) ────────────────────────────────────
  console.log('📄 [4/23] Export navigation (page views)...');
  const pageViews = await prisma.pageView.findMany({
    where: {
      created_at: { gte: since },
      OR: [{ userId: null }, { user: REAL_USER }],
    },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Navigation');
    ws.columns = [
      { header: 'ID', key: 'id' },
      { header: 'User ID', key: 'userId' },
      { header: 'Session ID', key: 'sessionId' },
      { header: 'Page', key: 'page_path' },
      { header: 'Titre', key: 'page_title' },
      { header: 'Référent', key: 'referrer' },
      { header: 'Durée (s)', key: 'duration' },
      { header: 'Device', key: 'device_type' },
      { header: 'Navigateur', key: 'browser' },
      { header: 'OS', key: 'os' },
      { header: 'Date', key: 'created_at' },
    ];
    styleHeader(ws.getRow(1), 'FF00695C');

    for (const pv of pageViews) {
      ws.addRow({
        id: pv.id,
        userId: pv.userId ?? 'anonyme',
        sessionId: pv.sessionId,
        page_path: pv.page_path,
        page_title: pv.page_title ?? '',
        referrer: pv.referrer ?? '',
        duration: pv.duration ?? '',
        device_type: pv.device_type ?? '',
        browser: pv.browser ?? '',
        os: pv.os ?? '',
        created_at: fmt(pv.created_at),
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${pageViews.length} page views`);
  }

  // ── Onglet 5 : Actions utilisateurs ─────────────────────────────────────
  console.log('🎯 [5/23] Export actions utilisateurs...');
  const actions = await prisma.userActionTracking.findMany({
    where: { created_at: { gte: since }, user: REAL_USER },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Actions');
    ws.columns = [
      { header: 'ID', key: 'id' },
      { header: 'User ID', key: 'userId' },
      { header: 'Session ID', key: 'sessionId' },
      { header: 'Type action', key: 'action_type' },
      { header: 'Nom action', key: 'action_name' },
      { header: 'Page', key: 'page_path' },
      { header: 'Métadonnées', key: 'metadata' },
      { header: 'Date', key: 'created_at' },
    ];
    styleHeader(ws.getRow(1), 'FFE65100');

    for (const a of actions) {
      ws.addRow({
        id: a.id,
        userId: a.userId,
        sessionId: a.sessionId,
        action_type: a.action_type,
        action_name: a.action_name,
        page_path: a.page_path ?? '',
        metadata: a.metadata ? JSON.stringify(a.metadata) : '',
        created_at: fmt(a.created_at),
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${actions.length} actions`);
  }

  // ── Onglet 6 : Paywall & Features ────────────────────────────────────────
  console.log('💳 [6/23] Export feature usage & paywall...');
  const featureUsage = await prisma.featureUsage.findMany({
    where: { created_at: { gte: since }, user: REAL_USER },
    include: { user: { select: { email: true, subscriptionTier: true } } },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Paywall & Features');
    ws.columns = [
      { header: 'ID', key: 'id' },
      { header: 'User ID', key: 'userId' },
      { header: 'Email', key: 'email' },
      { header: 'Abonnement', key: 'subscriptionTier' },
      { header: 'Feature', key: 'feature_name' },
      { header: 'Type feature', key: 'feature_type' },
      { header: 'Accès accordé', key: 'access_granted' },
      { header: 'Bloqué paywall', key: 'blocked_by_paywall' },
      { header: 'Page', key: 'page_path' },
      { header: 'Métadonnées', key: 'metadata' },
      { header: 'Date', key: 'created_at' },
    ];
    styleHeader(ws.getRow(1), 'FFC62828');

    for (const f of featureUsage) {
      const row = ws.addRow({
        id: f.id,
        userId: f.userId,
        email: f.user.email,
        subscriptionTier: f.user.subscriptionTier,
        feature_name: f.feature_name,
        feature_type: f.feature_type,
        access_granted: f.access_granted ? 'Oui' : 'Non',
        blocked_by_paywall: f.blocked_by_paywall ? 'OUI' : 'Non',
        page_path: f.page_path ?? '',
        metadata: f.metadata ? JSON.stringify(f.metadata) : '',
        created_at: fmt(f.created_at),
      });
      if (f.blocked_by_paywall) {
        row.getCell('blocked_by_paywall').fill = {
          type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' },
        };
        row.getCell('blocked_by_paywall').font = { bold: true, color: { argb: 'FFC62828' } };
      }
    }
    autoWidth(ws);
    console.log(`   ✅ ${featureUsage.length} feature usages (${featureUsage.filter(f => f.blocked_by_paywall).length} paywall blocks)`);
  }

  // ── Onglet 7 : Rétention par cohorte ─────────────────────────────────────
  console.log('📈 [7/23] Calcul rétention par cohorte...');
  const allUsers = await (prisma.user.findMany as any)({
    where: { ...REAL_USER },
    select: { id: true, created_at: true, last_login_at: true },
  }) as Array<{ id: string; created_at: Date | null; last_login_at: Date | null }>;

  {
    const ws = wb.addWorksheet('Rétention');
    ws.columns = [
      { header: 'Semaine inscription', key: 'cohort_week' },
      { header: 'Nb inscrits', key: 'signups' },
      { header: 'Retenus D+1', key: 'retained_d1' },
      { header: 'Taux D+1 (%)', key: 'rate_d1' },
      { header: 'Retenus D+7', key: 'retained_d7' },
      { header: 'Taux D+7 (%)', key: 'rate_d7' },
      { header: 'Retenus D+30', key: 'retained_d30' },
      { header: 'Taux D+30 (%)', key: 'rate_d30' },
    ];
    styleHeader(ws.getRow(1), 'FF2E7D32');

    // Grouper par semaine d'inscription
    const cohortMap = new Map<string, typeof allUsers>();
    for (const u of allUsers) {
      if (!u.created_at) continue;
      const d = new Date(u.created_at);
      // Début de semaine (lundi)
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const key = monday.toISOString().split('T')[0];
      if (!cohortMap.has(key)) cohortMap.set(key, []);
      cohortMap.get(key)!.push(u);
    }

    const retentionInCohort = (cohortUsers: typeof allUsers, daysThreshold: number) => {
      const eligible = cohortUsers.filter(u => {
        if (!u.created_at) return false;
        return new Date(u.created_at) <= daysAgo(daysThreshold, now);
      });
      const retained = eligible.filter(u => {
        if (!u.last_login_at || !u.created_at) return false;
        return new Date(u.last_login_at).getTime() >
          new Date(u.created_at).getTime() + daysThreshold * 24 * 3600 * 1000;
      });
      return { eligible: eligible.length, retained: retained.length };
    };

    const sortedCohorts = Array.from(cohortMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    for (const [week, cohortUsers] of sortedCohorts) {
      const r1 = retentionInCohort(cohortUsers, 1);
      const r7 = retentionInCohort(cohortUsers, 7);
      const r30 = retentionInCohort(cohortUsers, 30);

      const row = ws.addRow({
        cohort_week: week,
        signups: cohortUsers.length,
        retained_d1: r1.retained,
        rate_d1: r1.eligible > 0 ? Math.round((r1.retained / r1.eligible) * 100) : '',
        retained_d7: r7.retained,
        rate_d7: r7.eligible > 0 ? Math.round((r7.retained / r7.eligible) * 100) : '',
        retained_d30: r30.retained,
        rate_d30: r30.eligible > 0 ? Math.round((r30.retained / r30.eligible) * 100) : '',
      });

      // Colorier les taux (vert = bon, rouge = mauvais)
      for (const key of ['rate_d1', 'rate_d7', 'rate_d30'] as const) {
        const cell = row.getCell(key);
        const val = typeof cell.value === 'number' ? cell.value : -1;
        if (val >= 40) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8E6C9' } };
        else if (val >= 20) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
        else if (val >= 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } };
      }
    }
    autoWidth(ws);
    console.log(`   ✅ ${sortedCohorts.length} cohortes hebdomadaires`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 3 — GAMIFICATION
  // ════════════════════════════════════════════════════════════════════════════

  // ── Onglet 8 : XP History ────────────────────────────────────────────────
  console.log('⭐ [8/23] Export XP History...');
  const xpHistory = await prisma.xPHistory.findMany({
    where: { created_at: { gte: since }, userId: { in: realUserIds } },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Gamification XP');
    ws.columns = [
      { header: 'ID', key: 'id' },
      { header: 'User ID', key: 'userId' },
      { header: 'XP Gagné', key: 'amount' },
      { header: 'Raison', key: 'reason' },
      { header: 'Description', key: 'description' },
      { header: 'Date', key: 'created_at' },
    ];
    styleHeader(ws.getRow(1), 'FFF57F17');

    for (const xp of xpHistory) {
      const row = ws.addRow({
        id: xp.id,
        userId: xp.userId,
        amount: xp.amount,
        reason: xp.reason,
        description: xp.description ?? '',
        created_at: fmt(xp.created_at),
      });
      if (xp.amount > 0) {
        row.getCell('amount').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8E6C9' } };
      } else {
        row.getCell('amount').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } };
      }
    }
    autoWidth(ws);
    console.log(`   ✅ ${xpHistory.length} entrées XP`);
  }

  // ── Onglet 9 : Achievements ──────────────────────────────────────────────
  console.log('🏆 [9/23] Export achievements...');
  const userAchievements = await prisma.userAchievement.findMany({
    where: { unlocked_at: { gte: since }, userId: { in: realUserIds } },
    include: {
      achievement: { select: { code: true, name: true, category: true, rarity: true, xp_reward: true } },
    },
    orderBy: { unlocked_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Achievements');
    ws.columns = [
      { header: 'User ID', key: 'userId' },
      { header: 'Badge code', key: 'code' },
      { header: 'Nom badge', key: 'name' },
      { header: 'Catégorie', key: 'category' },
      { header: 'Rareté', key: 'rarity' },
      { header: 'XP accordé', key: 'xp_reward' },
      { header: 'Débloqué le', key: 'unlocked_at' },
      { header: 'Affiché profil', key: 'is_displayed' },
      { header: 'Notifié', key: 'is_notified' },
    ];
    styleHeader(ws.getRow(1), 'FFF57F17');

    for (const ua of userAchievements) {
      ws.addRow({
        userId: ua.userId,
        code: ua.achievement.code,
        name: ua.achievement.name,
        category: ua.achievement.category,
        rarity: ua.achievement.rarity,
        xp_reward: ua.achievement.xp_reward,
        unlocked_at: fmt(ua.unlocked_at),
        is_displayed: ua.is_displayed ? 'Oui' : 'Non',
        is_notified: ua.is_notified ? 'Oui' : 'Non',
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${userAchievements.length} badges débloqués`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 4 — APPRENTISSAGE
  // ════════════════════════════════════════════════════════════════════════════

  // ── Onglet 10 : Learning Progress ────────────────────────────────────────
  console.log('📚 [10/23] Export apprentissage...');
  const learningProgress = await prisma.learningProgress.findMany({
    where: { user: REAL_USER },
    include: {
      user: { select: { name: true, lastname: true, email: true, subscriptionTier: true } },
      module: { select: { title: true, slug: true, difficulty_level: true, content_type: true, duration_minutes: true } },
    },
    orderBy: { last_accessed_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Apprentissage');
    ws.columns = [
      { header: 'User ID', key: 'userId' },
      { header: 'Nom', key: 'name' },
      { header: 'Email', key: 'email' },
      { header: 'Abonnement', key: 'subscriptionTier' },
      { header: 'Module', key: 'module_title' },
      { header: 'Slug', key: 'slug' },
      { header: 'Niveau', key: 'difficulty_level' },
      { header: 'Type contenu', key: 'content_type' },
      { header: 'Durée prévue (min)', key: 'duration_minutes' },
      { header: 'Complété', key: 'is_completed' },
      { header: 'Score quiz (%)', key: 'quiz_score' },
      { header: 'Tentatives quiz', key: 'quiz_attempts' },
      { header: 'Temps passé (min)', key: 'time_spent_minutes' },
      { header: 'Dernier accès', key: 'last_accessed_at' },
      { header: 'Complété le', key: 'completed_at' },
    ];
    styleHeader(ws.getRow(1), 'FF0277BD');

    for (const lp of learningProgress) {
      ws.addRow({
        userId: lp.userId,
        name: `${lp.user.name} ${lp.user.lastname}`,
        email: lp.user.email,
        subscriptionTier: lp.user.subscriptionTier,
        module_title: lp.module.title,
        slug: lp.module.slug,
        difficulty_level: lp.module.difficulty_level,
        content_type: lp.module.content_type,
        duration_minutes: lp.module.duration_minutes ?? '',
        is_completed: lp.is_completed ? 'Oui' : 'Non',
        quiz_score: lp.quiz_score ?? '',
        quiz_attempts: lp.quiz_attempts,
        time_spent_minutes: lp.time_spent_minutes ?? '',
        last_accessed_at: fmt(lp.last_accessed_at),
        completed_at: fmt(lp.completed_at),
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${learningProgress.length} progressions modules`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 5 — SIMULATION TRADING
  // ════════════════════════════════════════════════════════════════════════════

  // ── Onglet 11 : Transactions ─────────────────────────────────────────────
  console.log('💰 [11/23] Export transactions simulation...');
  const transactions = await prisma.transaction.findMany({
    where: { created_at: { gte: since }, portfolio: { user: REAL_USER } },
    include: {
      portfolio: {
        select: { userId: true, wallet_type: true, name: true, status: true },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Simulation Trading');
    ws.columns = [
      { header: 'Transaction ID', key: 'id' },
      { header: 'User ID', key: 'userId' },
      { header: 'Portfolio', key: 'portfolio_name' },
      { header: 'Type wallet', key: 'wallet_type' },
      { header: 'Statut wallet', key: 'wallet_status' },
      { header: 'Ticker', key: 'stock_ticker' },
      { header: 'Type', key: 'type' },
      { header: 'Quantité', key: 'quantity' },
      { header: 'Prix unitaire (FCFA)', key: 'price_per_share' },
      { header: 'Montant total (FCFA)', key: 'total_amount' },
      { header: 'Jour exécution', key: 'execution_day' },
      { header: 'Weekend?', key: 'was_weekend' },
      { header: 'Date', key: 'created_at' },
    ];
    styleHeader(ws.getRow(1), 'FF1B5E20');

    for (const t of transactions) {
      ws.addRow({
        id: t.id,
        userId: t.portfolio.userId,
        portfolio_name: t.portfolio.name,
        wallet_type: t.portfolio.wallet_type,
        wallet_status: t.portfolio.status,
        stock_ticker: t.stock_ticker,
        type: t.type,
        quantity: t.quantity,
        price_per_share: t.price_per_share,
        total_amount: t.quantity * t.price_per_share,
        execution_day: t.execution_day ?? '',
        was_weekend: t.was_weekend ? 'Oui' : 'Non',
        created_at: fmt(t.created_at),
      });
    }
    ws.getColumn('price_per_share').numFmt = '#,##0 "FCFA"';
    ws.getColumn('total_amount').numFmt = '#,##0 "FCFA"';
    autoWidth(ws);
    console.log(`   ✅ ${transactions.length} transactions`);
  }

  // ── Onglet 12 : Watchlist ─────────────────────────────────────────────────
  console.log('👀 [12/23] Export watchlist...');
  const watchlistItems = await prisma.watchlistItem.findMany({
    where: { user: REAL_USER },
    include: { user: { select: { email: true, subscriptionTier: true } } },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Watchlist');
    ws.columns = [
      { header: 'User ID', key: 'userId' },
      { header: 'Email', key: 'email' },
      { header: 'Abonnement', key: 'subscriptionTier' },
      { header: 'Ticker', key: 'stock_ticker' },
      { header: 'Prix entrée', key: 'entry_price' },
      { header: 'Note', key: 'note' },
      { header: 'Tags', key: 'tags' },
      { header: 'Ajouté le', key: 'created_at' },
    ];
    styleHeader(ws.getRow(1), 'FF1B5E20');

    for (const w of watchlistItems) {
      ws.addRow({
        userId: w.userId,
        email: w.user.email,
        subscriptionTier: w.user.subscriptionTier,
        stock_ticker: w.stock_ticker,
        entry_price: w.entry_price ?? '',
        note: w.note ?? '',
        tags: w.tags.join(', '),
        created_at: fmt(w.created_at),
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${watchlistItems.length} éléments watchlist`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 6 — SOCIAL
  // ════════════════════════════════════════════════════════════════════════════

  // ── Onglet 13 : Posts sociaux ─────────────────────────────────────────────
  console.log('💬 [13/23] Export posts sociaux...');
  const posts = await prisma.post.findMany({
    where: { created_at: { gte: since }, author: REAL_USER },
    include: { author: { select: { email: true, subscriptionTier: true } } },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Social Posts');
    ws.columns = [
      { header: 'Post ID', key: 'id' },
      { header: 'Author ID', key: 'author_id' },
      { header: 'Email auteur', key: 'email' },
      { header: 'Abonnement', key: 'subscriptionTier' },
      { header: 'Type', key: 'type' },
      { header: 'Ticker', key: 'stock_symbol' },
      { header: 'Visibilité', key: 'visibility' },
      { header: 'Likes', key: 'likes_count' },
      { header: 'Commentaires', key: 'comments_count' },
      { header: 'Partages', key: 'shares_count' },
      { header: 'Vues', key: 'views_count' },
      { header: 'Signalé', key: 'is_reported' },
      { header: 'Masqué', key: 'is_hidden' },
      { header: 'Publié le', key: 'created_at' },
    ];
    styleHeader(ws.getRow(1), 'FF880E4F');

    for (const p of posts) {
      ws.addRow({
        id: p.id,
        author_id: p.author_id,
        email: p.author.email,
        subscriptionTier: p.author.subscriptionTier,
        type: p.type,
        stock_symbol: p.stock_symbol ?? '',
        visibility: p.visibility,
        likes_count: p.likes_count,
        comments_count: p.comments_count,
        shares_count: p.shares_count,
        views_count: p.views_count,
        is_reported: p.is_reported ? 'Oui' : 'Non',
        is_hidden: p.is_hidden ? 'Oui' : 'Non',
        created_at: fmt(p.created_at),
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${posts.length} posts`);
  }

  // ── Onglet 14 : Communautés ──────────────────────────────────────────────
  console.log('🏘️  [14/23] Export communautés...');
  const communityMembers = await prisma.communityMember.findMany({
    where: { joined_at: { gte: since }, user: REAL_USER },
    include: {
      community: { select: { name: true, slug: true, visibility: true, category: true } },
      user: { select: { email: true } },
    },
    orderBy: { joined_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Social Communautés');
    ws.columns = [
      { header: 'User ID', key: 'user_id' },
      { header: 'Email', key: 'email' },
      { header: 'Communauté', key: 'community_name' },
      { header: 'Slug', key: 'community_slug' },
      { header: 'Visibilité', key: 'visibility' },
      { header: 'Catégorie', key: 'category' },
      { header: 'Rôle', key: 'role' },
      { header: 'Notifs actives', key: 'notifications_enabled' },
      { header: 'Muté', key: 'is_muted' },
      { header: 'Rejoint le', key: 'joined_at' },
    ];
    styleHeader(ws.getRow(1), 'FF880E4F');

    for (const m of communityMembers) {
      ws.addRow({
        user_id: m.user_id,
        email: m.user.email,
        community_name: m.community.name,
        community_slug: m.community.slug,
        visibility: m.community.visibility,
        category: m.community.category ?? '',
        role: m.role,
        notifications_enabled: m.notifications_enabled ? 'Oui' : 'Non',
        is_muted: m.is_muted ? 'Oui' : 'Non',
        joined_at: fmt(m.joined_at),
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${communityMembers.length} adhésions communautés`);
  }

  // ── Onglet 15 : Follows ──────────────────────────────────────────────────
  console.log('👥 [15/23] Export follows...');
  const follows = await prisma.follow.findMany({
    where: { created_at: { gte: since }, follower: { user: REAL_USER } },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Follows');
    ws.columns = [
      { header: 'Follower ID (qui suit)', key: 'followerId' },
      { header: 'Following ID (suivi)', key: 'followingId' },
      { header: 'Date', key: 'created_at' },
    ];
    styleHeader(ws.getRow(1), 'FF880E4F');

    for (const f of follows) {
      ws.addRow({ followerId: f.followerId, followingId: f.followingId, created_at: fmt(f.created_at) });
    }
    autoWidth(ws);
    console.log(`   ✅ ${follows.length} follows`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 7 — REVENUE & MONÉTISATION
  // ════════════════════════════════════════════════════════════════════════════

  // ── Onglet 16 : Intents abonnement ───────────────────────────────────────
  console.log('💸 [16/23] Export intents abonnement...');
  const subscriptionIntents = await prisma.subscriptionIntent.findMany({
    where: { user: REAL_USER },
    include: { user: { select: { email: true, name: true, lastname: true, subscriptionTier: true } } },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Intents Abonnement');
    ws.columns = [
      { header: 'ID', key: 'id' },
      { header: 'User ID', key: 'userId' },
      { header: 'Nom', key: 'name' },
      { header: 'Email', key: 'email' },
      { header: 'Abonnement actuel', key: 'subscriptionTier' },
      { header: 'Plan visé', key: 'planId' },
      { header: 'Nom plan', key: 'planName' },
      { header: 'Prix', key: 'price' },
      { header: 'Feature déclencheur', key: 'feature' },
      { header: 'Source', key: 'source' },
      { header: 'Méthode paiement', key: 'paymentMethod' },
      { header: 'Date', key: 'created_at' },
    ];
    styleHeader(ws.getRow(1), 'FF01579B');

    for (const si of subscriptionIntents) {
      ws.addRow({
        id: si.id,
        userId: si.userId,
        name: `${si.user.name} ${si.user.lastname}`,
        email: si.user.email,
        subscriptionTier: si.user.subscriptionTier,
        planId: si.planId,
        planName: si.planName,
        price: si.price,
        feature: si.feature ?? '',
        source: si.source ?? '',
        paymentMethod: si.paymentMethod ?? '',
        created_at: fmt(si.created_at),
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${subscriptionIntents.length} intentions abonnement`);
  }

  // ── Onglet 17 : Essais gratuits ──────────────────────────────────────────
  console.log('🆓 [17/23] Export free trials...');
  const freeTrials = await prisma.freeTrial.findMany({
    where: { user: REAL_USER },
    include: { user: { select: { email: true, subscriptionTier: true } } },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Essais Gratuits');
    ws.columns = [
      { header: 'User ID', key: 'userId' },
      { header: 'Email', key: 'email' },
      { header: 'Abonnement', key: 'subscriptionTier' },
      { header: 'Réclamé', key: 'claimed' },
      { header: 'Activé le', key: 'activatedAt' },
      { header: 'Expire le', key: 'expiresAt' },
      { header: 'Statut', key: 'status' },
      { header: 'Créé le', key: 'created_at' },
    ];
    styleHeader(ws.getRow(1), 'FF01579B');

    for (const ft of freeTrials) {
      const status = !ft.claimed ? 'Non utilisé'
        : !ft.activatedAt ? 'Réclamé non activé'
        : ft.expiresAt && ft.expiresAt < now ? 'Expiré'
        : 'Actif';
      ws.addRow({
        userId: ft.userId,
        email: ft.user.email,
        subscriptionTier: ft.user.subscriptionTier,
        claimed: ft.claimed ? 'Oui' : 'Non',
        activatedAt: fmt(ft.activatedAt),
        expiresAt: fmt(ft.expiresAt),
        status,
        created_at: fmt(ft.created_at),
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${freeTrials.length} free trials`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 8 — CHALLENGE 2026
  // ════════════════════════════════════════════════════════════════════════════

  // ── Onglet 18 : Challenge 2026 ───────────────────────────────────────────
  console.log('🏁 [18/23] Export Challenge 2026...');
  const challengeParticipants = await prisma.challengeParticipant.findMany({
    where: { user: REAL_USER },
    include: {
      user: {
        select: { email: true, name: true, lastname: true,
          profile: { select: { global_rank: true, total_xp: true, level: true } } },
      },
    },
    orderBy: { enrollment_date: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Challenge 2026');
    ws.columns = [
      { header: 'User ID', key: 'userId' },
      { header: 'Nom', key: 'name' },
      { header: 'Email', key: 'email' },
      { header: 'Niveau expérience', key: 'experience_level' },
      { header: 'Compte réel', key: 'has_real_account' },
      { header: 'Source découverte', key: 'discovery_source' },
      { header: 'Objectif principal', key: 'primary_goal' },
      { header: 'Secteur préféré', key: 'preferred_sector' },
      { header: 'Code parrainage', key: 'referral_code' },
      { header: 'Statut', key: 'status' },
      { header: 'Transactions valides', key: 'valid_transactions' },
      { header: 'Éligible', key: 'is_eligible' },
      { header: 'Rang top3', key: 'top3_rank' },
      { header: 'Streak top3', key: 'top3_streak' },
      { header: 'Rang global XP', key: 'global_rank' },
      { header: 'Niveau XP', key: 'level' },
      { header: 'XP Total', key: 'total_xp' },
      { header: 'Règles acceptées', key: 'accepted_rules' },
      { header: 'Date règles', key: 'rules_accepted_at' },
      { header: 'Inscrit le', key: 'enrollment_date' },
    ];
    styleHeader(ws.getRow(1), 'FFBF360C');

    for (const cp of challengeParticipants) {
      ws.addRow({
        userId: cp.userId,
        name: `${cp.user.name} ${cp.user.lastname}`,
        email: cp.user.email,
        experience_level: cp.experience_level,
        has_real_account: cp.has_real_account ? 'Oui' : 'Non',
        discovery_source: cp.discovery_source,
        primary_goal: cp.primary_goal,
        preferred_sector: cp.preferred_sector,
        referral_code: cp.referral_code ?? '',
        status: cp.status,
        valid_transactions: cp.valid_transactions,
        is_eligible: cp.is_eligible ? 'Oui' : 'Non',
        top3_rank: cp.top3_rank ?? '',
        top3_streak: cp.top3_streak,
        global_rank: cp.user.profile?.global_rank ?? '',
        level: cp.user.profile?.level ?? '',
        total_xp: cp.user.profile?.total_xp ?? '',
        accepted_rules: cp.accepted_rules ? 'Oui' : 'Non',
        rules_accepted_at: fmt(cp.rules_accepted_at),
        enrollment_date: fmt(cp.enrollment_date),
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${challengeParticipants.length} participants Challenge 2026`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 9 — ALERTES & ÉVÉNEMENTS
  // ════════════════════════════════════════════════════════════════════════════

  // ── Onglet 19 : Alertes Prix ─────────────────────────────────────────────
  console.log('🔔 [19/23] Export alertes prix...');
  const priceAlerts = await prisma.priceAlert.findMany({
    where: { user: REAL_USER },
    include: { user: { select: { email: true } } },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Alertes Prix');
    ws.columns = [
      { header: 'User ID', key: 'userId' },
      { header: 'Email', key: 'email' },
      { header: 'Ticker', key: 'stock_ticker' },
      { header: 'Type alerte', key: 'alert_type' },
      { header: 'Prix cible (FCFA)', key: 'target_price' },
      { header: 'Active', key: 'is_active' },
      { header: 'Déclenchée', key: 'is_notified' },
      { header: 'Date déclenchement', key: 'triggered_at' },
      { header: 'Prix au déclenchement', key: 'triggered_price' },
      { header: 'Notif email', key: 'notify_email' },
      { header: 'Notif in-app', key: 'notify_in_app' },
      { header: 'Créée le', key: 'created_at' },
    ];
    styleHeader(ws.getRow(1), 'FF4A148C');

    for (const pa of priceAlerts) {
      ws.addRow({
        userId: pa.userId,
        email: pa.user.email,
        stock_ticker: pa.stock_ticker,
        alert_type: pa.alert_type,
        target_price: pa.target_price,
        is_active: pa.is_active ? 'Oui' : 'Non',
        is_notified: pa.is_notified ? 'Oui' : 'Non',
        triggered_at: fmt(pa.triggered_at),
        triggered_price: pa.triggered_price ?? '',
        notify_email: pa.notify_email ? 'Oui' : 'Non',
        notify_in_app: pa.notify_in_app ? 'Oui' : 'Non',
        created_at: fmt(pa.created_at),
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${priceAlerts.length} alertes prix`);
  }

  // ── Onglet 20 : Événements ───────────────────────────────────────────────
  console.log('📅 [20/23] Export événements...');
  const eventRegistrations = await prisma.eventRegistration.findMany({
    where: { user: REAL_USER },
    include: {
      event: { select: { title: true, type: true, event_date: true, status: true } },
      user: { select: { email: true } },
    },
    orderBy: { registered_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Événements');
    ws.columns = [
      { header: 'User ID', key: 'user_id' },
      { header: 'Email', key: 'email' },
      { header: 'Événement', key: 'event_title' },
      { header: 'Type', key: 'event_type' },
      { header: 'Date événement', key: 'event_date' },
      { header: 'Statut événement', key: 'event_status' },
      { header: 'A participé', key: 'attended' },
      { header: 'Annulé', key: 'cancelled' },
      { header: 'Inscrit le', key: 'registered_at' },
    ];
    styleHeader(ws.getRow(1), 'FF4A148C');

    for (const er of eventRegistrations) {
      ws.addRow({
        user_id: er.user_id,
        email: er.user.email,
        event_title: er.event.title,
        event_type: er.event.type,
        event_date: fmt(er.event.event_date),
        event_status: er.event.status,
        attended: er.attended ? 'Oui' : 'Non',
        cancelled: er.cancelled ? 'Oui' : 'Non',
        registered_at: fmt(er.registered_at),
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${eventRegistrations.length} inscriptions événements`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 10 — SÉCURITÉ & MODÉRATION
  // ════════════════════════════════════════════════════════════════════════════

  // ── Onglet 21 : Audit Sécurité ───────────────────────────────────────────
  console.log('🔒 [21/23] Export audit sécurité...');
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      created_at: { gte: since },
      NOT: { userEmail: { endsWith: '@fake-afribourse.com' } },
    },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Audit Sécurité');
    ws.columns = [
      { header: 'User ID', key: 'userId' },
      { header: 'Email', key: 'userEmail' },
      { header: 'Rôle', key: 'userRole' },
      { header: 'Action', key: 'action' },
      { header: 'Ressource', key: 'resource' },
      { header: 'Succès', key: 'success' },
      { header: 'Erreur', key: 'errorMsg' },
      { header: 'IP', key: 'ip' },
      { header: 'Date', key: 'created_at' },
    ];
    styleHeader(ws.getRow(1), 'FF37474F');

    for (const al of auditLogs) {
      const row = ws.addRow({
        userId: al.userId ?? '',
        userEmail: al.userEmail ?? '',
        userRole: al.userRole ?? '',
        action: al.action,
        resource: al.resource ?? '',
        success: al.success ? 'Succès' : 'Échec',
        errorMsg: al.errorMsg ?? '',
        ip: al.ip ?? '',
        created_at: fmt(al.created_at),
      });
      if (!al.success) {
        row.getCell('success').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } };
      }
    }
    autoWidth(ws);
    const failed = auditLogs.filter(a => !a.success).length;
    console.log(`   ✅ ${auditLogs.length} entrées audit (${failed} échecs)`);
  }

  // ── Onglet 22 : Avis utilisateurs ───────────────────────────────────────
  console.log('⭐ [22/23] Export avis...');
  const reviews = await prisma.review.findMany({
    where: { user: REAL_USER },
    include: { user: { select: { email: true, subscriptionTier: true } } },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Avis Utilisateurs');
    ws.columns = [
      { header: 'User ID', key: 'userId' },
      { header: 'Email', key: 'email' },
      { header: 'Abonnement', key: 'subscriptionTier' },
      { header: 'Note (1-5)', key: 'rating' },
      { header: 'Commentaire', key: 'text' },
      { header: 'Statut', key: 'status' },
      { header: 'Date', key: 'created_at' },
    ];
    styleHeader(ws.getRow(1), 'FF37474F');

    for (const r of reviews) {
      ws.addRow({
        userId: r.userId,
        email: r.user.email,
        subscriptionTier: r.user.subscriptionTier,
        rating: r.rating,
        text: r.text,
        status: r.status,
        created_at: fmt(r.created_at),
      });
    }
    autoWidth(ws);
    console.log(`   ✅ ${reviews.length} avis`);
  }

  // ── Onglet 23 : Modération ───────────────────────────────────────────────
  console.log('🛡️  [23/23] Export modération...');
  const reports = await prisma.report.findMany({
    where: { created_at: { gte: since }, reporter: REAL_USER },
    include: { reporter: { select: { email: true } } },
    orderBy: { created_at: 'desc' },
  });
  const userBans = await prisma.userBan.findMany({
    where: { user: REAL_USER },
    include: { user: { select: { email: true } } },
    orderBy: { created_at: 'desc' },
  });

  {
    const ws = wb.addWorksheet('Modération');

    // Signalements
    ws.addRow(['=== SIGNALEMENTS ===']).font = { bold: true };
    ws.addRow(['Reporter ID', 'Email reporter', 'Type contenu', 'Raison', 'Statut', 'Date'])
      .eachCell(c => { c.font = { bold: true }; });
    for (const r of reports) {
      ws.addRow([r.reporter_id, r.reporter.email, r.content_type, r.reason, r.status, fmt(r.created_at)]);
    }

    ws.addRow([]);
    ws.addRow(['=== BANS UTILISATEURS ===']).font = { bold: true };
    ws.addRow(['User ID', 'Email', 'Type ban', 'Raison', 'Actif', 'Débute le', 'Finit le'])
      .eachCell(c => { c.font = { bold: true }; });
    for (const b of userBans) {
      ws.addRow([b.user_id, b.user.email, b.ban_type, b.reason,
        b.is_active ? 'Actif' : 'Levé', fmt(b.starts_at), fmt(b.ends_at)]);
    }

    autoWidth(ws);
    console.log(`   ✅ ${reports.length} signalements + ${userBans.length} bans`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ONGLET 1 — KPIs RÉSUMÉ (en dernier pour avoir toutes les données)
  // ════════════════════════════════════════════════════════════════════════════
  console.log('\n📊 [1/23] Génération du résumé KPIs...');

  const totalUsers = users.length;
  const verifiedUsers = users.filter(u => u.email_verified_at).length;
  const premiumUsers = users.filter(u => u.subscriptionTier !== 'free').length;
  const activeUsers30d = allUsers.filter(u => u.last_login_at && new Date(u.last_login_at) >= daysAgo(30)).length;
  const activeUsers7d = allUsers.filter(u => u.last_login_at && new Date(u.last_login_at) >= daysAgo(7)).length;
  const newUsersWindow = users.filter(u => u.created_at && new Date(u.created_at) >= since).length;
  const paywallBlocks = featureUsage.filter(f => f.blocked_by_paywall).length;
  const conversionIntents = subscriptionIntents.length;
  const challengeEligible = challengeParticipants.filter(c => c.is_eligible).length;
  const modulesCompleted = learningProgress.filter(lp => lp.is_completed).length;
  const totalTransactions = transactions.length;
  const totalPosts = posts.length;
  const totalFollows = follows.length;

  // Rétention globale D+7
  const eligibleD7 = allUsers.filter(u => u.created_at && new Date(u.created_at) <= daysAgo(7));
  const retainedD7 = eligibleD7.filter(u => {
    if (!u.last_login_at || !u.created_at) return false;
    return new Date(u.last_login_at).getTime() > new Date(u.created_at).getTime() + 7 * 24 * 3600 * 1000;
  });
  const retentionD7 = eligibleD7.length > 0 ? Math.round((retainedD7.length / eligibleD7.length) * 100) : 0;

  // wsKpi a été créé en premier (en tête du workbook), on le récupère ici pour le peupler
  wsKpi.properties.tabColor = { argb: 'FFD50000' };
  wb.views = [{ activeTab: 0 }];

  wsKpi.getColumn('A').width = 40;
  wsKpi.getColumn('B').width = 20;
  wsKpi.getColumn('C').width = 30;

  const addKpiSection = (title: string, rows: [string, string | number, string?][]) => {
    const titleRow = wsKpi.addRow([title]);
    titleRow.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF263238' } };
    titleRow.height = 22;

    for (const [label, value, note] of rows) {
      const row = wsKpi.addRow([label, value, note ?? '']);
      row.getCell(2).alignment = { horizontal: 'right' };
      row.getCell(2).font = { bold: true };
    }
    wsKpi.addRow([]);
  };

  addKpiSection('👥 BASE UTILISATEURS', [
    ['Total inscrits', totalUsers],
    ['Inscrits (fenêtre ' + windowDays + 'j)', newUsersWindow],
    ['Emails vérifiés', verifiedUsers, `${Math.round((verifiedUsers / totalUsers) * 100)}%`],
    ['Abonnés premium/pro', premiumUsers, `${Math.round((premiumUsers / totalUsers) * 100)}%`],
    ['Actifs 7 derniers jours', activeUsers7d, `${Math.round((activeUsers7d / totalUsers) * 100)}%`],
    ['Actifs 30 derniers jours', activeUsers30d, `${Math.round((activeUsers30d / totalUsers) * 100)}%`],
  ]);

  addKpiSection('📈 RÉTENTION', [
    ['Taux rétention D+7 (global)', retentionD7 + '%'],
    ['Utilisateurs éligibles D+7', eligibleD7.length],
    ['Utilisateurs retenus D+7', retainedD7.length],
  ]);

  addKpiSection('💰 MONÉTISATION', [
    ['Intents abonnement (total)', conversionIntents],
    ['Blocages paywall (fenêtre)', paywallBlocks],
    ['Free trials créés (total)', freeTrials.length],
    ['Free trials actifs', freeTrials.filter(ft => ft.claimed && ft.expiresAt && ft.expiresAt > now).length],
  ]);

  addKpiSection('📚 APPRENTISSAGE', [
    ['Progressions de modules (total)', learningProgress.length],
    ['Modules complétés', modulesCompleted, `${Math.round((modulesCompleted / Math.max(learningProgress.length, 1)) * 100)}%`],
    ['Profils ADN investisseur', investorProfiles.length],
    ['ADN onboarding complété', investorProfiles.filter(ip => ip.onboarding_completed).length],
  ]);

  addKpiSection('💹 SIMULATION', [
    ['Transactions (fenêtre)', totalTransactions],
    ['Transactions SANDBOX', transactions.filter(t => t.portfolio.wallet_type === 'SANDBOX').length],
    ['Transactions CONCOURS', transactions.filter(t => t.portfolio.wallet_type === 'CONCOURS').length],
    ['Éléments watchlist', watchlistItems.length],
  ]);

  addKpiSection('🏁 CHALLENGE 2026', [
    ['Participants inscrits', challengeParticipants.length],
    ['Participants éligibles', challengeEligible, `${Math.round((challengeEligible / Math.max(challengeParticipants.length, 1)) * 100)}%`],
    ['Actuellement dans top 3', challengeParticipants.filter(c => c.top3_rank !== null).length],
  ]);

  addKpiSection('💬 ENGAGEMENT SOCIAL', [
    ['Posts publiés (fenêtre)', totalPosts],
    ['Follows (fenêtre)', totalFollows],
    ['Adhésions communautés (fenêtre)', communityMembers.length],
    ['Alertes prix créées', priceAlerts.length],
    ['Alertes déclenchées', priceAlerts.filter(pa => pa.is_notified).length],
  ]);

  addKpiSection('📊 COMPORTEMENT', [
    ['Page views (fenêtre)', pageViews.length],
    ['Actions trackées (fenêtre)', actions.length],
    ['Sessions uniques (nav)', new Set(pageViews.map(pv => pv.sessionId)).size],
    ['Utilisateurs actifs (page views)', new Set(pageViews.map(pv => pv.userId).filter(Boolean)).size],
  ]);

  addKpiSection('📅 ÉVÉNEMENTS', [
    ['Inscriptions événements', eventRegistrations.length],
    ['Participants présents', eventRegistrations.filter(er => er.attended).length],
  ]);

  addKpiSection('🛡️ MODÉRATION & SÉCURITÉ', [
    ['Signalements (fenêtre)', reports.length],
    ['Bans actifs', userBans.filter(b => b.is_active).length],
    ['Connexions échouées (fenêtre)', auditLogs.filter(al => al.action === 'LOGIN_FAILED').length],
    ['Avis utilisateurs', reviews.length],
    ['Note moyenne', reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : 'N/A'],
  ]);

  // ── Écriture du fichier ──────────────────────────────────────────────────
  const outputFile = path.join(exportsDir, `analytics_${timestamp}.xlsx`);
  await wb.xlsx.writeFile(outputFile);

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Export terminé : ${outputFile}`);
  console.log('═'.repeat(60));
  console.log(`📁 ${wb.worksheets.length} onglets générés`);
  console.log(`📊 Fenêtre d'analyse : ${windowDays} jours (depuis ${fmtDate(since)})`);
  console.log('\nOnglets:');
  for (const ws of wb.worksheets) {
    console.log(`   • ${ws.name} (${ws.rowCount - 1} lignes)`);
  }
}

main()
  .catch(e => { console.error('❌ Erreur:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
