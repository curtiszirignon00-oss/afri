// backend/scripts/backfillUsernames.ts
// Génère un username auto pour tous les profils utilisateurs réels qui n'en ont pas.
// Exclut les comptes de test (@fake-afribourse.com).
//
// Usage :
//   tsx scripts/backfillUsernames.ts --dry-run   (simulation, aucune écriture)
//   tsx scripts/backfillUsernames.ts             (applique les changements)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');
const FAKE_DOMAIN = 'fake-afribourse.com';

const RESERVED_USERNAMES = [
  'afribourse', 'admin', 'administrator', 'support', 'official',
  'help', 'contact', 'info', 'service', 'team',
];

function normalizeUsernameBase(input: string): string {
  return (input || 'investisseur')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retirer les accents
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20) || 'investisseur';
}

async function backfillUsernames() {
  console.log(`🔍 Recherche des profils sans username${DRY_RUN ? ' (DRY RUN)' : ''}...\n`);

  // Profils sans username
  const profiles = await prisma.userProfile.findMany({
    where: { OR: [{ username: null }, { username: '' }] },
    select: {
      userId: true,
      user: { select: { name: true, lastname: true, email: true } },
    },
  });

  // Exclure les comptes de test
  const realProfiles = profiles.filter(p => !(p.user?.email || '').toLowerCase().endsWith(`@${FAKE_DOMAIN}`));
  const skippedFake = profiles.length - realProfiles.length;

  console.log(`👤 ${profiles.length} profil(s) sans username — dont ${skippedFake} compte(s) de test exclu(s).`);
  console.log(`➡️  ${realProfiles.length} profil(s) réel(s) à traiter.\n`);

  if (realProfiles.length === 0) {
    console.log('✅ Rien à faire.');
    return;
  }

  // Charger tous les usernames existants pour détecter les collisions en mémoire
  const existing = await prisma.userProfile.findMany({
    where: { username: { not: null } },
    select: { username: true },
  });
  const used = new Set(existing.map(p => (p.username as string).toLowerCase()));

  let updated = 0;

  for (const p of realProfiles) {
    const base = normalizeUsernameBase(p.user?.name || p.user?.lastname || 'investisseur');

    // Stratégie : base → base_brvm → base + chiffres
    const candidates = [base, `${base}_brvm`];
    let username = '';
    for (const c of candidates) {
      if (c.length >= 3 && !RESERVED_USERNAMES.includes(c) && !used.has(c)) {
        username = c;
        break;
      }
    }
    if (!username) {
      for (let i = 0; i < 100; i++) {
        const suffix = Math.floor(100 + Math.random() * 9900);
        const c = `${base}${suffix}`;
        if (!RESERVED_USERNAMES.includes(c) && !used.has(c)) {
          username = c;
          break;
        }
      }
    }
    if (!username) username = `${base}_${Date.now().toString(36)}`;

    used.add(username.toLowerCase());

    if (DRY_RUN) {
      console.log(`📝 [dry] ${p.user?.email} → ${username}`);
    } else {
      await prisma.userProfile.update({
        where: { userId: p.userId },
        data: { username },
      });
      console.log(`✅ ${p.user?.email} → ${username}`);
    }
    updated++;
  }

  console.log(`\n🎉 Terminé : ${updated} username(s) ${DRY_RUN ? 'simulés' : 'générés'}, ${skippedFake} compte(s) de test ignorés.`);
}

backfillUsernames()
  .catch(err => { console.error('❌ Erreur :', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
