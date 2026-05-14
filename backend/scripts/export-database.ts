import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const prisma = new PrismaClient();

const CELL_LIMIT = 32000;

// Aplatit les objets imbriqués/JSON en string pour Excel
function flatten(doc: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc)) {
    if (v === null || v === undefined) {
      out[k] = '';
    } else if (v instanceof Date) {
      out[k] = v.toISOString();
    } else if (typeof v === 'object' && !Array.isArray(v)) {
      const s = JSON.stringify(v);
      out[k] = s.length > CELL_LIMIT ? s.slice(0, CELL_LIMIT) + '…' : s;
    } else if (Array.isArray(v)) {
      const s = v.join(', ');
      out[k] = s.length > CELL_LIMIT ? s.slice(0, CELL_LIMIT) + '…' : s;
    } else if (typeof v === 'string' && v.length > CELL_LIMIT) {
      out[k] = v.slice(0, CELL_LIMIT) + '…';
    } else {
      out[k] = v;
    }
  }
  return out;
}

const COLLECTIONS = [
  { name: 'Utilisateurs',          key: 'users',                   data: () => prisma.user.findMany() },
  { name: 'Profils',               key: 'user_profiles',           data: () => prisma.userProfile.findMany() },
  { name: 'OAuth',                 key: 'oauth_accounts',          data: () => prisma.oAuthAccount.findMany() },
  { name: 'Actions',               key: 'stocks',                  data: () => prisma.stock.findMany() },
  { name: 'Historique cours',      key: 'stock_history',           data: () => prisma.stockHistory.findMany() },
  { name: 'Fondamentaux',          key: 'stock_fundamentals',      data: () => prisma.stockFundamental.findMany() },
  { name: 'Financiers annuels',    key: 'annual_financials',       data: () => prisma.annualFinancials.findMany() },
  { name: 'Indices marché',        key: 'market_indices',          data: () => prisma.marketIndex.findMany() },
  { name: 'Historique indices',    key: 'market_index_history',    data: () => prisma.marketIndexHistory.findMany() },
  { name: 'Infos sociétés',        key: 'company_info',            data: () => prisma.companyInfo.findMany() },
  { name: 'News actions',          key: 'stock_news',              data: () => prisma.stockNews.findMany() },
  { name: 'Actionnaires',          key: 'shareholders',            data: () => prisma.shareholder.findMany() },
  { name: 'Index membres',         key: 'stock_index_members',     data: () => prisma.stockIndexMembership.findMany() },
  { name: 'Portefeuilles',         key: 'portfolios',              data: () => prisma.portfolio.findMany() },
  { name: 'Positions',             key: 'positions',               data: () => prisma.position.findMany() },
  { name: 'Transactions',          key: 'transactions',            data: () => prisma.transaction.findMany() },
  { name: 'Snapshots portef.',     key: 'portfolio_snapshots',     data: () => prisma.portfolioSnapshot.findMany() },
  { name: 'Watchlist',             key: 'watchlist_items',         data: () => prisma.watchlistItem.findMany() },
  { name: 'Modules formation',     key: 'learning_modules',        data: () => prisma.learningModule.findMany() },
  { name: 'Progrès formation',     key: 'learning_progress',       data: () => prisma.learningProgress.findMany() },
  { name: 'Quiz',                  key: 'quizzes',                 data: () => prisma.quiz.findMany() },
  { name: 'Succès définis',        key: 'achievements',            data: () => prisma.achievement.findMany() },
  { name: 'Succès utilisateurs',   key: 'user_achievements',       data: () => prisma.userAchievement.findMany() },
  { name: 'Activités',             key: 'user_activities',         data: () => prisma.userActivity.findMany() },
  { name: 'Follows',               key: 'follows',                 data: () => prisma.follow.findMany() },
  { name: 'Défis hebdo',           key: 'weekly_challenges',       data: () => prisma.weeklyChallenge.findMany() },
  { name: 'Progrès défis',         key: 'user_challenge_progress', data: () => prisma.userChallengeProgress.findMany() },
  { name: 'Récompenses',           key: 'rewards',                 data: () => prisma.reward.findMany() },
  { name: 'Récomp. utilisateurs',  key: 'user_rewards',            data: () => prisma.userReward.findMany() },
  { name: 'Historique XP',         key: 'xp_history',              data: () => prisma.xPHistory.findMany() },
  { name: 'Profil investisseur',   key: 'investor_profiles',       data: () => prisma.investorProfile.findMany() },
  { name: 'Posts',                 key: 'posts',                   data: () => prisma.post.findMany() },
  { name: 'Likes posts',           key: 'post_likes',              data: () => prisma.postLike.findMany() },
  { name: 'Commentaires',          key: 'comments',                data: () => prisma.comment.findMany() },
  { name: 'Communautés',           key: 'communities',             data: () => prisma.community.findMany() },
  { name: 'Membres communautés',   key: 'community_members',       data: () => prisma.communityMember.findMany() },
  { name: 'Posts communautés',     key: 'community_posts',         data: () => prisma.communityPost.findMany() },
  { name: 'Likes comm.',           key: 'community_post_likes',    data: () => prisma.communityPostLike.findMany() },
  { name: 'Coms comm.',            key: 'community_post_comments', data: () => prisma.communityPostComment.findMany() },
  { name: 'Demandes adhésion',     key: 'community_join_requests', data: () => prisma.communityJoinRequest.findMany() },
  { name: 'Notifications',         key: 'notifications',           data: () => prisma.notification.findMany() },
  { name: 'Signalements',          key: 'reports',                 data: () => prisma.report.findMany() },
  { name: 'Mots bannis',           key: 'banned_keywords',         data: () => prisma.bannedKeyword.findMany() },
  { name: 'Logs modération',       key: 'moderation_logs',         data: () => prisma.moderationLog.findMany() },
  { name: 'Bannissements',         key: 'user_bans',               data: () => prisma.userBan.findMany() },
  { name: 'Alertes prix',          key: 'price_alerts',            data: () => prisma.priceAlert.findMany() },
  { name: 'Notifs alertes',        key: 'price_alert_notifs',      data: () => prisma.priceAlertNotification.findMany() },
  { name: 'Intentions abonnement', key: 'subscription_intents',    data: () => prisma.subscriptionIntent.findMany() },
  { name: 'Événements',            key: 'events',                  data: () => prisma.event.findMany() },
  { name: 'Inscriptions événe.',   key: 'event_registrations',     data: () => prisma.eventRegistration.findMany() },
  { name: 'Logs audit',            key: 'audit_logs',              data: () => prisma.auditLog.findMany() },
  { name: 'Push subscriptions',    key: 'push_subscriptions',      data: () => prisma.pushSubscription.findMany() },
  { name: 'Essais gratuits',       key: 'free_trials',             data: () => prisma.freeTrial.findMany() },
  { name: 'Avis',                  key: 'reviews',                 data: () => prisma.review.findMany() },
  { name: 'Articles news',         key: 'news_articles',           data: () => prisma.newsArticle.findMany() },
  { name: 'Messages contact',      key: 'contact_messages',        data: () => prisma.contactMessage.findMany() },
  { name: 'Pages vues',            key: 'page_views',              data: () => prisma.pageView.findMany() },
  { name: 'Actions utilisateurs',  key: 'user_action_tracking',    data: () => prisma.userActionTracking.findMany() },
  { name: 'Usage fonctionnalités', key: 'feature_usage',           data: () => prisma.featureUsage.findMany() },
  { name: 'Participants challenge',key: 'challenge_participants',   data: () => prisma.challengeParticipant.findMany() },
  { name: 'Inscriptions webinaire',key: 'webinar_registrations',   data: () => prisma.webinarRegistration.findMany() },
  { name: 'Scénarios Time Machine',key: 'time_machine_scenarios',  data: () => prisma.timeMachineScenario.findMany() },
  { name: 'Sessions Time Machine', key: 'time_machine_sessions',   data: () => prisma.timeMachineSession.findMany() },
];

async function exportDatabase() {
  console.log('\n=== EXPORT BASE DE DONNÉES → EXCEL ===\n');

  const wb = XLSX.utils.book_new();
  const stats: { feuille: string; documents: number }[] = [];
  let totalDocs = 0;

  for (const col of COLLECTIONS) {
    process.stdout.write(`  ${col.name.padEnd(25)} `);
    try {
      const docs = await col.data() as Record<string, unknown>[];
      const rows = docs.length > 0 ? docs.map(flatten) : [{}];
      const ws = XLSX.utils.json_to_sheet(rows);
      // Limiter le nom de feuille à 31 caractères (limite Excel)
      const sheetName = col.name.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      stats.push({ feuille: col.name, documents: docs.length });
      totalDocs += docs.length;
      console.log(`${docs.length} documents`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`ERREUR: ${msg}`);
      stats.push({ feuille: col.name, documents: 0 });
    }
  }

  // Feuille récapitulatif
  const summaryWs = XLSX.utils.json_to_sheet(stats);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Récapitulatif');

  // Sauvegarde
  const exportDir = path.join(process.cwd(), 'exports');
  fs.mkdirSync(exportDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `afribourse-db-${timestamp}.xlsx`;
  const filepath = path.join(exportDir, filename);

  XLSX.writeFile(wb, filepath);

  const sizeMb = (fs.statSync(filepath).size / 1024 / 1024).toFixed(1);

  console.log('\n=== RÉSUMÉ ===');
  console.log(`Feuilles    : ${COLLECTIONS.length + 1} (+ récapitulatif)`);
  console.log(`Documents   : ${totalDocs}`);
  console.log(`Taille      : ${sizeMb} MB`);
  console.log(`Fichier     : ${filepath}`);
  console.log('\nExport terminé.');
}

exportDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erreur fatale:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
