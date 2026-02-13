// scripts/reset-fake-users-social.ts
// Remet à zéro les abonnés, abonnements et publications des fake users
// Usage: npx tsx scripts/reset-fake-users-social.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Reset des stats sociales des fake users ===\n');

  // 1. Récupérer tous les fake users
  const fakeUsers = await prisma.user.findMany({
    where: { email: { endsWith: '@fake-afribourse.com' } },
    select: { id: true, email: true },
  });

  if (fakeUsers.length === 0) {
    console.log('Aucun fake user trouvé.');
    return;
  }

  console.log(`${fakeUsers.length} fake users trouvés.\n`);

  const fakeUserIds = fakeUsers.map((u) => u.id);

  // 2. Supprimer les Follow records où les fake users sont follower
  //    → Décrémente followers_count des users suivis par les fakes
  const followsAsFaker = await prisma.follow.findMany({
    where: { followerId: { in: fakeUserIds } },
    select: { followingId: true },
  });

  const followedByFakeIds = [...new Set(followsAsFaker.map((f) => f.followingId))];
  console.log(`Follows en tant que follower: ${followsAsFaker.length} (affecte ${followedByFakeIds.length} users réels)`);

  // 3. Supprimer les Follow records où les fake users sont suivis
  //    → Décrémente following_count des followers des fakes
  const followsAsFollowed = await prisma.follow.findMany({
    where: { followingId: { in: fakeUserIds } },
    select: { followerId: true },
  });

  const followersOfFakeIds = [...new Set(followsAsFollowed.map((f) => f.followerId))];
  console.log(`Follows en tant que suivi: ${followsAsFollowed.length} (affecte ${followersOfFakeIds.length} users réels)`);

  // 4. Supprimer tous les Follow records impliquant des fake users
  const deletedFollows = await prisma.follow.deleteMany({
    where: {
      OR: [
        { followerId: { in: fakeUserIds } },
        { followingId: { in: fakeUserIds } },
      ],
    },
  });
  console.log(`\n✓ ${deletedFollows.count} follows supprimés`);

  // 5. Supprimer les PostLikes des fake users
  const deletedLikes = await prisma.postLike.deleteMany({
    where: { user_id: { in: fakeUserIds } },
  });
  console.log(`✓ ${deletedLikes.count} likes supprimés`);

  // 6. Supprimer les Comments des fake users
  const deletedComments = await prisma.comment.deleteMany({
    where: { author_id: { in: fakeUserIds } },
  });
  console.log(`✓ ${deletedComments.count} commentaires supprimés`);

  // 7. Supprimer les Posts des fake users
  const deletedPosts = await prisma.post.deleteMany({
    where: { author_id: { in: fakeUserIds } },
  });
  console.log(`✓ ${deletedPosts.count} posts supprimés`);

  // 8. Remettre à zéro les compteurs et la progression des fake users
  const updatedProfiles = await prisma.userProfile.updateMany({
    where: { userId: { in: fakeUserIds } },
    data: {
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      level: 1,
      total_xp: 0,
      current_streak: 0,
      longest_streak: 0,
      reputation_score: 0,
    },
  });
  console.log(`✓ ${updatedProfiles.count} profils fake remis à zéro (social + XP/level/streak)`);

  // 9. Recalculer les compteurs des vrais users affectés
  //    (ceux qui étaient suivis par des fakes ou qui suivaient des fakes)
  const affectedRealUserIds = [...new Set([...followedByFakeIds, ...followersOfFakeIds])]
    .filter((id) => !fakeUserIds.includes(id));

  console.log(`\nRecalcul des compteurs pour ${affectedRealUserIds.length} vrais users affectés...`);

  let recalculated = 0;
  for (const userId of affectedRealUserIds) {
    const [followersCount, followingCount, postsCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.post.count({ where: { author_id: userId } }),
    ]);

    await prisma.userProfile.updateMany({
      where: { userId },
      data: {
        followers_count: followersCount,
        following_count: followingCount,
        posts_count: postsCount,
      },
    });
    recalculated++;
  }
  console.log(`✓ ${recalculated} vrais users recalculés`);

  console.log('\n=== Reset terminé ===');
}

main()
  .catch((e) => {
    console.error('Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
