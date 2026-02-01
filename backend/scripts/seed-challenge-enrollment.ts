// scripts/seed-challenge-enrollment.ts
// Inscrit les 1000 fake users à la communauté Challenge AfriBourse + ChallengeParticipant
// Usage: npx tsx scripts/seed-challenge-enrollment.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// DONNÉES ALÉATOIRES POUR LE CHALLENGE
// ==========================================

const EXPERIENCE_LEVELS = ['DEBUTANT', 'DEBUTANT', 'DEBUTANT', 'INTERMEDIAIRE', 'INTERMEDIAIRE', 'EXPERT'];
const DISCOVERY_SOURCES = ['SOCIAL_MEDIA', 'SOCIAL_MEDIA', 'FRIEND', 'FRIEND', 'SCHOOL', 'OTHER'];
const PRIMARY_GOALS = ['WIN_PRIZE', 'LEARN', 'LEARN', 'NETWORK'];
const PREFERRED_SECTORS = ['BANK', 'TELECOM', 'AGRICULTURE', 'INDUSTRY', 'SERVICES'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBool(chance = 0.5): boolean {
  return Math.random() < chance;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ==========================================
// MAIN
// ==========================================

async function main() {
  // 1. Récupérer tous les fake users
  const fakeUsers = await prisma.user.findMany({
    where: { email: { endsWith: '@fake-afribourse.com' } },
    select: { id: true, created_at: true },
  });

  console.log(`📋 ${fakeUsers.length} fake users trouvés`);
  if (fakeUsers.length === 0) {
    console.log('❌ Aucun fake user. Lance d\'abord seed-fake-users.ts');
    return;
  }

  // 2. Trouver ou créer la communauté "Challenge AfriBourse 2026"
  const COMMUNITY_SLUG = 'challenge-afribourse-2026';
  let community = await prisma.community.findUnique({ where: { slug: COMMUNITY_SLUG } });

  if (!community) {
    // On a besoin d'un créateur (premier fake user ou un admin)
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    const creatorId = admin?.id || fakeUsers[0].id;

    community = await prisma.community.create({
      data: {
        creator_id: creatorId,
        name: 'Challenge AfriBourse 2026',
        slug: COMMUNITY_SLUG,
        description: 'Communauté officielle du Challenge AfriBourse 2026. Rejoignez la compétition et montrez vos talents d\'investisseur !',
        visibility: 'PUBLIC',
        category: 'challenge',
        tags: ['challenge', 'trading', 'competition', '2026'],
        is_verified: true,
        is_featured: true,
        members_count: 0,
        posts_count: 0,
      },
    });
    console.log(`✅ Communauté "${community.name}" créée (id: ${community.id})`);
  } else {
    console.log(`📌 Communauté "${community.name}" existante (id: ${community.id})`);
  }

  const communityId = community.id;

  // 3. Vérifier les inscriptions existantes pour éviter les doublons
  const existingMembers = await prisma.communityMember.findMany({
    where: { community_id: communityId },
    select: { user_id: true },
  });
  const existingMemberIds = new Set(existingMembers.map(m => m.user_id));

  const existingParticipants = await prisma.challengeParticipant.findMany({
    select: { userId: true },
  });
  const existingParticipantIds = new Set(existingParticipants.map(p => p.userId));

  const usersToEnroll = fakeUsers.filter(
    u => !existingMemberIds.has(u.id) && !existingParticipantIds.has(u.id)
  );

  console.log(`🎯 ${usersToEnroll.length} users à inscrire (${fakeUsers.length - usersToEnroll.length} déjà inscrits)`);

  // 4. Inscrire par batch
  const BATCH_SIZE = 50;
  let enrolled = 0;

  for (let i = 0; i < usersToEnroll.length; i += BATCH_SIZE) {
    const batch = usersToEnroll.slice(i, i + BATCH_SIZE);

    // Date d'enrollment : entre la date de création du user et maintenant
    const now = new Date();

    const memberData = batch.map(user => {
      const userCreated = user.created_at || new Date('2024-08-01');
      const joinedAt = randomDate(userCreated, now);
      return {
        community_id: communityId,
        user_id: user.id,
        role: 'MEMBER' as const,
        joined_at: joinedAt,
      };
    });

    const participantData = batch.map(user => {
      const userCreated = user.created_at || new Date('2024-08-01');
      const enrollmentDate = randomDate(userCreated, now);
      return {
        userId: user.id,
        experience_level: pick(EXPERIENCE_LEVELS),
        has_real_account: randomBool(0.25),
        discovery_source: pick(DISCOVERY_SOURCES),
        primary_goal: pick(PRIMARY_GOALS),
        preferred_sector: pick(PREFERRED_SECTORS),
        referral_code: randomBool(0.15) ? `REF${Math.random().toString(36).slice(2, 8).toUpperCase()}` : null,
        status: 'ACTIVE' as const,
        enrollment_date: enrollmentDate,
        accepted_rules: true,
        rules_accepted_at: enrollmentDate,
        valid_transactions: 0,
        is_eligible: false,
      };
    });

    // Portfolio challenge (wallet CONCOURS) pour chaque user
    const portfolioData = batch.map(user => {
      const userCreated = user.created_at || new Date('2024-08-01');
      return {
        name: 'Challenge AfriBourse 2026',
        initial_balance: 1000000,
        cash_balance: 1000000,
        is_virtual: true,
        wallet_type: 'CONCOURS' as const,
        status: 'ACTIVE' as const,
        userId: user.id,
        created_at: randomDate(userCreated, now),
      };
    });

    await Promise.all([
      prisma.communityMember.createMany({ data: memberData }),
      prisma.challengeParticipant.createMany({ data: participantData }),
      prisma.portfolio.createMany({ data: portfolioData }),
    ]);

    enrolled += batch.length;
    console.log(`✅ ${enrolled}/${usersToEnroll.length} inscrits`);
  }

  // 5. Mettre à jour le compteur de membres de la communauté
  await prisma.community.update({
    where: { id: communityId },
    data: { members_count: { increment: usersToEnroll.length } },
  });

  console.log(`\n🎉 Terminé !`);
  console.log(`👥 ${usersToEnroll.length} users ajoutés à la communauté "${community.name}"`);
  console.log(`🏆 ${usersToEnroll.length} ChallengeParticipant créés`);
  console.log(`💰 ${usersToEnroll.length} portefeuilles CONCOURS créés (1M FCFA chacun)`);
}

main()
  .catch(err => {
    console.error('❌ Erreur:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
