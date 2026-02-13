import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Export XLS des données AfriBourse ---\n');

  const exportDir = path.join(__dirname, '..', 'exports');
  fs.mkdirSync(exportDir, { recursive: true });

  // 1. Export Users
  console.log('Récupération des utilisateurs...');
  const users = await prisma.user.findMany({
    include: { profile: true },
  });
  console.log(`  → ${users.length} utilisateurs trouvés`);

  const usersRows = users.map((u) => ({
    ID: u.id,
    Nom: u.name,
    Prénom: u.lastname,
    Email: u.email,
    Téléphone: u.telephone || '',
    Rôle: u.role,
    Abonnement: u.subscriptionTier,
    'Email vérifié': u.email_verified_at ? 'Oui' : 'Non',
    'Date vérification': u.email_verified_at ? new Date(u.email_verified_at).toLocaleDateString('fr-FR') : '',
    Pays: u.profile?.country || '',
    Profession: u.profile?.profession || '',
    Niveau: u.profile?.level || 1,
    XP: u.profile?.total_xp || 0,
    'Streak actuel': u.profile?.current_streak || 0,
    Followers: u.profile?.followers_count || 0,
    Following: u.profile?.following_count || 0,
    Posts: u.profile?.posts_count || 0,
    Username: u.profile?.username || '',
    'Inscrit le': u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '',
  }));

  // 2. Export Transactions
  console.log('Récupération des transactions...');
  const transactions = await prisma.transaction.findMany({
    include: {
      portfolio: {
        select: {
          name: true,
          userId: true,
          wallet_type: true,
        },
      },
    },
  });
  console.log(`  → ${transactions.length} transactions trouvées`);

  const transactionsRows = transactions.map((t) => ({
    ID: t.id,
    Ticker: t.stock_ticker,
    Type: t.type,
    Quantité: t.quantity,
    'Prix unitaire': t.price_per_share,
    'Montant total': t.quantity * t.price_per_share,
    Portfolio: t.portfolio?.name || '',
    'Type wallet': t.portfolio?.wallet_type || '',
    'User ID': t.portfolio?.userId || '',
    Date: t.created_at ? new Date(t.created_at).toLocaleDateString('fr-FR') : '',
  }));

  // Créer le workbook Excel avec 2 feuilles
  const wb = XLSX.utils.book_new();

  const wsUsers = XLSX.utils.json_to_sheet(usersRows);
  // Ajuster la largeur des colonnes
  wsUsers['!cols'] = [
    { wch: 26 }, // ID
    { wch: 20 }, // Nom
    { wch: 20 }, // Prénom
    { wch: 30 }, // Email
    { wch: 15 }, // Téléphone
    { wch: 10 }, // Rôle
    { wch: 12 }, // Abonnement
    { wch: 14 }, // Email vérifié
    { wch: 18 }, // Date vérification
    { wch: 15 }, // Pays
    { wch: 18 }, // Profession
    { wch: 8 },  // Niveau
    { wch: 8 },  // XP
    { wch: 14 }, // Streak
    { wch: 10 }, // Followers
    { wch: 10 }, // Following
    { wch: 8 },  // Posts
    { wch: 20 }, // Username
    { wch: 14 }, // Inscrit le
  ];
  XLSX.utils.book_append_sheet(wb, wsUsers, 'Users');

  const wsTransactions = XLSX.utils.json_to_sheet(transactionsRows);
  wsTransactions['!cols'] = [
    { wch: 26 }, // ID
    { wch: 10 }, // Ticker
    { wch: 8 },  // Type
    { wch: 10 }, // Quantité
    { wch: 14 }, // Prix unitaire
    { wch: 16 }, // Montant total
    { wch: 20 }, // Portfolio
    { wch: 14 }, // Type wallet
    { wch: 26 }, // User ID
    { wch: 14 }, // Date
  ];
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions');

  // Écrire le fichier
  const outputFile = path.join(exportDir, 'afribourse-export.xlsx');
  XLSX.writeFile(wb, outputFile);

  console.log(`\n--- Export terminé ! ---`);
  console.log(`Fichier: ${outputFile}`);
  console.log(`  → Feuille "Users": ${users.length} lignes`);
  console.log(`  → Feuille "Transactions": ${transactions.length} lignes`);
}

main()
  .catch((e) => {
    console.error('Erreur lors de l\'export:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
