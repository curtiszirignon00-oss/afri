/**
 * Service de Backup Automatique - AfriBourse
 *
 * Sauvegarde toutes les données importantes de la base de données
 * en fichiers JSON et Excel pour récupération en cas de problème.
 *
 * Planifié pour s'exécuter chaque dimanche à 23h
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Dossier de sauvegarde
const BACKUP_DIR = path.join(__dirname, '../../backups');

/**
 * Crée le dossier de backup s'il n'existe pas
 */
function ensureBackupDir(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  return backupPath;
}

/**
 * Sauvegarde une collection en JSON
 */
function saveToJson(data: any[], filename: string, backupPath: string): void {
  const filePath = path.join(backupPath, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  ✅ ${filename}.json (${data.length} enregistrements)`);
}

/**
 * Sauvegarde une collection en Excel
 */
function saveToExcel(data: any[], filename: string, backupPath: string): void {
  if (data.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, filename);

  const filePath = path.join(backupPath, `${filename}.xlsx`);
  XLSX.writeFile(workbook, filePath);
  console.log(`  ✅ ${filename}.xlsx`);
}

/**
 * Backup des utilisateurs
 */
async function backupUsers(backupPath: string): Promise<number> {
  console.log('\n👤 Sauvegarde des utilisateurs...');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      lastname: true,
      email: true,
      telephone: true,
      address: true,
      role: true,
      email_verified_at: true,
      created_at: true,
      updated_at: true,
      posts_count: true,
    }
  });

  saveToJson(users, 'users', backupPath);

  // Version Excel simplifiée
  const usersExcel = users.map(u => ({
    ID: u.id,
    Prénom: u.name,
    Nom: u.lastname,
    Email: u.email,
    Téléphone: u.telephone || 'Non renseigné',
    Rôle: u.role,
    'Email vérifié': u.email_verified_at ? 'Oui' : 'Non',
    'Date inscription': u.created_at?.toISOString() || '',
  }));
  saveToExcel(usersExcel, 'users', backupPath);

  return users.length;
}

/**
 * Backup des profils utilisateurs
 */
async function backupUserProfiles(backupPath: string): Promise<number> {
  console.log('\n📋 Sauvegarde des profils...');

  const profiles = await prisma.userProfile.findMany({
    include: {
      user: {
        select: { email: true }
      }
    }
  });

  const profilesData = profiles.map(p => ({
    ...p,
    user_email: p.user.email,
    user: undefined
  }));

  saveToJson(profilesData, 'user_profiles', backupPath);
  return profiles.length;
}

/**
 * Backup des portfolios
 */
async function backupPortfolios(backupPath: string): Promise<number> {
  console.log('\n💼 Sauvegarde des portfolios...');

  const portfolios = await prisma.portfolio.findMany({
    include: {
      user: { select: { email: true } },
      positions: true,
      transactions: true,
    }
  });

  const portfoliosData = portfolios.map(p => ({
    ...p,
    user_email: p.user.email,
    user: undefined,
  }));

  saveToJson(portfoliosData, 'portfolios', backupPath);

  // Excel simplifié
  const portfoliosExcel = portfolios.map(p => ({
    ID: p.id,
    Nom: p.name,
    'Email utilisateur': p.user.email,
    'Balance initiale': p.initial_balance,
    'Balance cash': p.cash_balance,
    'Type': p.wallet_type,
    'Statut': p.status,
    'Nb positions': p.positions.length,
    'Nb transactions': p.transactions.length,
    'Créé le': p.created_at?.toISOString() || '',
  }));
  saveToExcel(portfoliosExcel, 'portfolios', backupPath);

  return portfolios.length;
}

/**
 * Backup des positions
 */
async function backupPositions(backupPath: string): Promise<number> {
  console.log('\n📊 Sauvegarde des positions...');

  const positions = await prisma.position.findMany({
    include: {
      portfolio: {
        include: {
          user: { select: { email: true } }
        }
      }
    }
  });

  const positionsData = positions.map(p => ({
    id: p.id,
    portfolio_id: p.portfolioId,
    user_email: p.portfolio.user.email,
    stock_ticker: p.stock_ticker,
    quantity: p.quantity,
    average_buy_price: p.average_buy_price,
  }));

  saveToJson(positionsData, 'positions', backupPath);
  saveToExcel(positionsData, 'positions', backupPath);

  return positions.length;
}

/**
 * Backup des transactions
 */
async function backupTransactions(backupPath: string): Promise<number> {
  console.log('\n💸 Sauvegarde des transactions...');

  const transactions = await prisma.transaction.findMany({
    include: {
      portfolio: {
        include: {
          user: { select: { email: true } }
        }
      }
    }
  });

  const transactionsData = transactions.map(t => ({
    id: t.id,
    portfolio_id: t.portfolioId,
    user_email: t.portfolio.user.email,
    stock_ticker: t.stock_ticker,
    type: t.type,
    quantity: t.quantity,
    price_per_share: t.price_per_share,
    created_at: t.created_at?.toISOString() || '',
  }));

  saveToJson(transactionsData, 'transactions', backupPath);
  saveToExcel(transactionsData, 'transactions', backupPath);

  return transactions.length;
}

/**
 * Backup de la progression d'apprentissage
 */
async function backupLearningProgress(backupPath: string): Promise<number> {
  console.log('\n📚 Sauvegarde de la progression d\'apprentissage...');

  const progress = await prisma.learningProgress.findMany({
    include: {
      user: { select: { email: true } },
      module: { select: { title: true, slug: true } }
    }
  });

  const progressData = progress.map(p => ({
    id: p.id,
    user_email: p.user.email,
    module_title: p.module.title,
    module_slug: p.module.slug,
    is_completed: p.is_completed,
    quiz_score: p.quiz_score,
    quiz_attempts: p.quiz_attempts,
    time_spent_minutes: p.time_spent_minutes,
    completed_at: p.completed_at?.toISOString() || null,
    last_accessed_at: p.last_accessed_at?.toISOString() || null,
  }));

  saveToJson(progressData, 'learning_progress', backupPath);
  saveToExcel(progressData, 'learning_progress', backupPath);

  return progress.length;
}

/**
 * Backup des alertes de prix
 */
async function backupPriceAlerts(backupPath: string): Promise<number> {
  console.log('\n🔔 Sauvegarde des alertes de prix...');

  const alerts = await prisma.priceAlert.findMany({
    include: {
      user: { select: { email: true } }
    }
  });

  const alertsData = alerts.map(a => ({
    id: a.id,
    user_email: a.user.email,
    stock_ticker: a.stock_ticker,
    alert_type: a.alert_type,
    target_price: a.target_price,
    is_active: a.is_active,
    is_notified: a.is_notified,
    created_at: a.created_at.toISOString(),
  }));

  saveToJson(alertsData, 'price_alerts', backupPath);

  return alerts.length;
}

/**
 * Backup des watchlists
 */
async function backupWatchlists(backupPath: string): Promise<number> {
  console.log('\n👁️ Sauvegarde des watchlists...');

  const watchlists = await prisma.watchlistItem.findMany({
    include: {
      user: { select: { email: true } }
    }
  });

  const watchlistData = watchlists.map(w => ({
    id: w.id,
    user_email: w.user.email,
    stock_ticker: w.stock_ticker,
    created_at: w.created_at?.toISOString() || '',
  }));

  saveToJson(watchlistData, 'watchlists', backupPath);

  return watchlists.length;
}

/**
 * Backup des achievements utilisateurs
 */
async function backupAchievements(backupPath: string): Promise<number> {
  console.log('\n🏆 Sauvegarde des achievements...');

  const achievements = await prisma.userAchievement.findMany({
    include: {
      achievement: { select: { name: true, code: true } },
      userProfile: {
        include: {
          user: { select: { email: true } }
        }
      }
    }
  });

  const achievementsData = achievements.map(a => ({
    id: a.id,
    user_email: a.userProfile.user.email,
    achievement_name: a.achievement.name,
    achievement_code: a.achievement.code,
    unlocked_at: a.unlocked_at.toISOString(),
  }));

  saveToJson(achievementsData, 'user_achievements', backupPath);

  return achievements.length;
}

/**
 * Backup des posts sociaux
 */
async function backupPosts(backupPath: string): Promise<number> {
  console.log('\n📝 Sauvegarde des posts...');

  const posts = await prisma.post.findMany({
    include: {
      author: { select: { email: true } }
    }
  });

  const postsData = posts.map(p => ({
    id: p.id,
    author_email: p.author.email,
    type: p.type,
    content: p.content,
    title: p.title,
    stock_symbol: p.stock_symbol,
    likes_count: p.likes_count,
    comments_count: p.comments_count,
    created_at: p.created_at.toISOString(),
  }));

  saveToJson(postsData, 'posts', backupPath);

  return posts.length;
}

/**
 * Backup des communautés
 */
async function backupCommunities(backupPath: string): Promise<number> {
  console.log('\n👥 Sauvegarde des communautés...');

  const communities = await prisma.community.findMany({
    include: {
      creator: { select: { email: true } },
      members: {
        include: {
          user: { select: { email: true } }
        }
      }
    }
  });

  const communitiesData = communities.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    creator_email: c.creator.email,
    visibility: c.visibility,
    members_count: c.members_count,
    members: c.members.map(m => ({
      email: m.user.email,
      role: m.role,
      joined_at: m.joined_at.toISOString()
    })),
    created_at: c.created_at.toISOString(),
  }));

  saveToJson(communitiesData, 'communities', backupPath);

  return communities.length;
}

/**
 * Backup des participants au challenge
 */
async function backupChallengeParticipants(backupPath: string): Promise<number> {
  console.log('\n🏅 Sauvegarde des participants au challenge...');

  const participants = await prisma.challengeParticipant.findMany({
    include: {
      user: { select: { email: true } }
    }
  });

  const participantsData = participants.map(p => ({
    id: p.id,
    user_email: p.user.email,
    experience_level: p.experience_level,
    has_real_account: p.has_real_account,
    discovery_source: p.discovery_source,
    primary_goal: p.primary_goal,
    preferred_sector: p.preferred_sector,
    status: p.status,
    is_eligible: p.is_eligible,
    enrollment_date: p.enrollment_date.toISOString(),
  }));

  saveToJson(participantsData, 'challenge_participants', backupPath);

  return participants.length;
}

/**
 * Nettoie les vieux backups (garde les 4 derniers = 1 mois)
 */
function cleanOldBackups(): void {
  console.log('\n🧹 Nettoyage des anciens backups...');

  if (!fs.existsSync(BACKUP_DIR)) return;

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-'))
    .sort()
    .reverse();

  const toKeep = 4; // Garder 4 semaines de backups

  if (backups.length > toKeep) {
    const toDelete = backups.slice(toKeep);
    for (const backup of toDelete) {
      const backupPath = path.join(BACKUP_DIR, backup);
      fs.rmSync(backupPath, { recursive: true, force: true });
      console.log(`  🗑️ Supprimé: ${backup}`);
    }
  }

  console.log(`  ✅ ${Math.min(backups.length, toKeep)} backup(s) conservé(s)`);
}

/**
 * Exécute le backup complet
 */
export async function runFullBackup(): Promise<string> {
  console.log('═'.repeat(60));
  console.log('🔄 BACKUP AUTOMATIQUE AFRIBOURSE');
  console.log('═'.repeat(60));
  console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`);

  const startTime = Date.now();
  const backupPath = ensureBackupDir();

  console.log(`📁 Dossier: ${backupPath}`);

  const stats = {
    users: 0,
    profiles: 0,
    portfolios: 0,
    positions: 0,
    transactions: 0,
    learningProgress: 0,
    priceAlerts: 0,
    watchlists: 0,
    achievements: 0,
    posts: 0,
    communities: 0,
    challengeParticipants: 0,
  };

  try {
    stats.users = await backupUsers(backupPath);
    stats.profiles = await backupUserProfiles(backupPath);
    stats.portfolios = await backupPortfolios(backupPath);
    stats.positions = await backupPositions(backupPath);
    stats.transactions = await backupTransactions(backupPath);
    stats.learningProgress = await backupLearningProgress(backupPath);
    stats.priceAlerts = await backupPriceAlerts(backupPath);
    stats.watchlists = await backupWatchlists(backupPath);
    stats.achievements = await backupAchievements(backupPath);
    stats.posts = await backupPosts(backupPath);
    stats.communities = await backupCommunities(backupPath);
    stats.challengeParticipants = await backupChallengeParticipants(backupPath);

    // Créer un fichier résumé
    const summary = {
      date: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      stats,
      backup_path: backupPath,
    };

    fs.writeFileSync(
      path.join(backupPath, '_backup_summary.json'),
      JSON.stringify(summary, null, 2)
    );

    // Nettoyer les vieux backups
    cleanOldBackups();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ BACKUP TERMINÉ AVEC SUCCÈS');
    console.log('═'.repeat(60));
    console.log(`⏱️ Durée: ${duration}s`);
    console.log(`📊 Statistiques:`);
    console.log(`   👤 Utilisateurs: ${stats.users}`);
    console.log(`   💼 Portfolios: ${stats.portfolios}`);
    console.log(`   📊 Positions: ${stats.positions}`);
    console.log(`   💸 Transactions: ${stats.transactions}`);
    console.log(`   📚 Progressions: ${stats.learningProgress}`);
    console.log(`   🔔 Alertes: ${stats.priceAlerts}`);
    console.log(`   📝 Posts: ${stats.posts}`);
    console.log(`📁 Sauvegardé dans: ${backupPath}`);

    return backupPath;
  } catch (error: any) {
    console.error('\n❌ ERREUR LORS DU BACKUP:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export pour utilisation dans les jobs
export default { runFullBackup };
