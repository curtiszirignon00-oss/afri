import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Total visites /news
  const totalVisits = await prisma.pageView.count({
    where: { page_path: '/news' },
  });

  // Sessions uniques sur /news (connectés + anonymes)
  const uniqueSessions = await prisma.pageView.findMany({
    where: { page_path: '/news' },
    select: { sessionId: true },
    distinct: ['sessionId'],
  });

  // Users connectés uniques sur /news
  const uniqueUsers = await prisma.pageView.findMany({
    where: { page_path: '/news', userId: { not: null } },
    select: { userId: true },
    distinct: ['userId'],
  });

  // Durée moyenne sur /news
  const avgDuration = await prisma.pageView.aggregate({
    where: { page_path: '/news', duration: { not: null } },
    _avg: { duration: true },
    _count: true,
  });

  // Actions VIEW_ARTICLE enregistrées
  const articleViews = await (prisma as any).userActionTracking.findMany({
    where: { action_type: 'view_article' },
    select: { action_name: true, metadata: true, created_at: true },
    orderBy: { created_at: 'desc' },
  }).catch(() => []);

  console.log('\n=== STATS PAGE /news ===');
  console.log(`Total visites (page views) :   ${totalVisits}`);
  console.log(`Sessions uniques :             ${uniqueSessions.length}`);
  console.log(`Users connectés uniques :      ${uniqueUsers.length}`);
  console.log(`Durée moyenne sur la page :    ${Math.round(avgDuration._avg.duration ?? 0)}s`);
  console.log(`Vues avec durée enregistrée :  ${avgDuration._count}`);

  if (articleViews.length > 0) {
    console.log('\n=== ARTICLES VUS (view_article) ===');
    const counts: Record<string, number> = {};
    for (const ev of articleViews) {
      counts[ev.action_name] = (counts[ev.action_name] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    for (const [name, count] of sorted) {
      console.log(`  [${count}x] ${name}`);
    }
  } else {
    console.log('\n(Pas encore de données view_article — le tracking vient d\'être ajouté)');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
