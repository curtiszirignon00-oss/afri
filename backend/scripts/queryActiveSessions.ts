/// <reference types="node" />
import prisma from '../src/config/prisma';

async function main() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  console.log('\n═══════════════════════════════════════════');
  console.log('  Diagnostic données — 30 derniers jours');
  console.log('═══════════════════════════════════════════\n');

  // ── 1. État des collections analytics ───────────────────────────────────
  const [pvTotal, pvRecent, actionTotal, actionRecent] = await Promise.all([
    prisma.pageView.count(),
    prisma.pageView.count({ where: { created_at: { gte: since } } }),
    prisma.userActionTracking.count(),
    prisma.userActionTracking.count({ where: { created_at: { gte: since } } }),
  ]);

  console.log('  Collections analytics :');
  console.log(`    PageView total          : ${pvTotal}  (dont ${pvRecent} sur 30j)`);
  console.log(`    UserActionTracking total: ${actionTotal}  (dont ${actionRecent} sur 30j)\n`);

  // ── 2. Données users (source fiable indépendante du tracking) ───────────
  const [totalUsers, activeUsers, verifiedUsers, newUsers30d] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { last_login_at: { gte: since } } }),
    prisma.user.count({ where: { email_verified_at: { not: null } } }),
    prisma.user.count({ where: { created_at: { gte: since } } }),
  ]);

  console.log('  Données users (source: table users) :');
  console.log(`    Total inscrits          : ${totalUsers}`);
  console.log(`    Nouveaux (30j)          : ${newUsers30d}`);
  console.log(`    Email vérifié           : ${verifiedUsers}`);
  console.log(`    Actifs 30j (last_login) : ${activeUsers}\n`);

  // ── Détail des users actifs ──────────────────────────────────────────────
  const activeUsersList = await prisma.user.findMany({
    where: { last_login_at: { gte: since } },
    select: {
      id: true,
      name: true,
      lastname: true,
      email: true,
      role: true,
      subscriptionTier: true,
      created_at: true,
      last_login_at: true,
      email_verified_at: true,
    },
    orderBy: { last_login_at: 'desc' },
  });

  console.log('  Détail des users actifs (30j) :\n');
  console.log('    #   Nom                    Email                          Rôle      Plan     Inscrit       Dernière connexion');
  console.log('    ─'.repeat(105));
  activeUsersList.forEach((u, i) => {
    const nom = `${u.name} ${u.lastname}`.substring(0, 22).padEnd(22);
    const email = u.email.substring(0, 32).padEnd(32);
    const role = (u.role || 'user').padEnd(9);
    const plan = (u.subscriptionTier || 'free').padEnd(8);
    const inscrit = u.created_at ? u.created_at.toISOString().split('T')[0] : '—';
    const login = u.last_login_at ? u.last_login_at.toISOString().replace('T', ' ').substring(0, 16) : '—';
    console.log(`    ${String(i + 1).padStart(2)}  ${nom}  ${email}  ${role} ${plan} ${inscrit}  ${login}`);
  });
  console.log('');

  // ── 3. Sessions via PageView si données dispo ────────────────────────────
  if (pvRecent > 0) {
    const pageViews = await prisma.pageView.findMany({
      where: { created_at: { gte: since }, userId: { not: null } },
      select: { userId: true, sessionId: true },
    });

    const sessionsByUser = new Map<string, Set<string>>();
    for (const pv of pageViews) {
      if (!pv.userId) continue;
      if (!sessionsByUser.has(pv.userId)) sessionsByUser.set(pv.userId, new Set());
      sessionsByUser.get(pv.userId)!.add(pv.sessionId);
    }

    const total = sessionsByUser.size;
    const moreThan2 = [...sessionsByUser.values()].filter((s) => s.size > 2).length;
    const moreThan5 = [...sessionsByUser.values()].filter((s) => s.size > 5).length;

    const dist: Record<string, number> = {};
    for (const s of sessionsByUser.values()) {
      const b = s.size === 1 ? '1' : s.size === 2 ? '2' : s.size <= 5 ? '3-5' : s.size <= 10 ? '6-10' : '11+';
      dist[b] = (dist[b] || 0) + 1;
    }

    console.log('  Sessions via PageView :');
    console.log(`    Users trackés           : ${total}`);
    console.log(`    Users > 2 sessions      : ${moreThan2}  (${total > 0 ? Math.round(moreThan2 / total * 100) : 0}%)`);
    console.log(`    Users > 5 sessions      : ${moreThan5}  (${total > 0 ? Math.round(moreThan5 / total * 100) : 0}%)`);
    console.log('\n  Distribution :');
    for (const [bucket, count] of Object.entries(dist).sort()) {
      const bar = '█'.repeat(Math.ceil(count / Math.max(...Object.values(dist)) * 20));
      console.log(`    ${bucket.padEnd(5)} sessions : ${String(count).padStart(4)}  ${bar}`);
    }
    console.log('');

  } else if (actionRecent > 0) {
    // ── 4. Fallback : sessions via UserActionTracking ──────────────────────
    const actions = await prisma.userActionTracking.findMany({
      where: { created_at: { gte: since } },
      select: { userId: true, sessionId: true },
    });

    const sessionsByUser = new Map<string, Set<string>>();
    for (const a of actions) {
      if (!sessionsByUser.has(a.userId)) sessionsByUser.set(a.userId, new Set());
      sessionsByUser.get(a.userId)!.add(a.sessionId);
    }

    const total = sessionsByUser.size;
    const moreThan2 = [...sessionsByUser.values()].filter((s) => s.size > 2).length;

    console.log('  Sessions via UserActionTracking (fallback) :');
    console.log(`    Users trackés           : ${total}`);
    console.log(`    Users > 2 sessions      : ${moreThan2}  (${total > 0 ? Math.round(moreThan2 / total * 100) : 0}%)\n`);

  } else {
    console.log('  ⚠️  Aucune donnée de session (PageView et UserActionTracking vides).');
    console.log('     Le tracking frontend n\'envoie pas encore de données en prod.\n');
    console.log(`  👉 Proxy disponible : ${activeUsers} users ont un last_login_at sur 30j.\n`);
  }

  // ── 5. Activité via UserActivity (gamification) ──────────────────────────
  const [activityCount, activeViaActivity] = await Promise.all([
    prisma.userActivity.count({ where: { created_at: { gte: since } } }),
    prisma.userActivity.groupBy({
      by: ['userId'],
      where: { created_at: { gte: since } },
      _count: { id: true },
    }),
  ]);

  const powerUsers = activeViaActivity.filter((u) => u._count.id > 5).length;

  console.log('  Activité via UserActivity (badges/trades/modules) :');
  console.log(`    Événements sur 30j      : ${activityCount}`);
  console.log(`    Users avec activité     : ${activeViaActivity.length}`);
  console.log(`    "Power users" (>5 actes): ${powerUsers}\n`);
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
