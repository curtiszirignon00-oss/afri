/// <reference types="node" />
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function exportUsersToExcel() {
  console.log('\n📊 EXPORT DES UTILISATEURS VERS EXCEL');
  console.log('='.repeat(80));

  const client = new MongoClient(process.env.DATABASE_URI || '');

  try {
    await client.connect();
    console.log('\n✅ Connecté à MongoDB');

    const db = client.db();

    // Récupérer toutes les collections nécessaires
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('user_profiles');
    const portfoliosCollection = db.collection('portfolios');
    const positionsCollection = db.collection('positions');
    const transactionsCollection = db.collection('transactions');
    const watchlistCollection = db.collection('watchlist_items');
    const learningProgressCollection = db.collection('learning_progress');
    const learningModulesCollection = db.collection('learning_modules');
    const achievementsCollection = db.collection('user_achievements');
    const achievementsDefCollection = db.collection('achievements');
    const challengeProgressCollection = db.collection('user_challenge_progress');
    const challengesCollection = db.collection('weekly_challenges');
    const followsCollection = db.collection('follows');

    const users = await usersCollection.find({}).toArray();
    console.log(`\n✅ ${users.length} utilisateurs trouvés`);

    // Récupérer toutes les données associées
    const profiles = await profilesCollection.find({}).toArray();
    const portfolios = await portfoliosCollection.find({}).toArray();
    const positions = await positionsCollection.find({}).toArray();
    const transactions = await transactionsCollection.find({}).toArray();
    const watchlist = await watchlistCollection.find({}).toArray();
    const learningProgress = await learningProgressCollection.find({}).toArray();
    const modules = await learningModulesCollection.find({}).toArray();
    const userAchievements = await achievementsCollection.find({}).toArray();
    const achievementsDef = await achievementsDefCollection.find({}).toArray();
    const challengeProgress = await challengeProgressCollection.find({}).toArray();
    const challenges = await challengesCollection.find({}).toArray();
    const follows = await followsCollection.find({}).toArray();

    // ===========================
    // FEUILLE 1: INFORMATIONS PRINCIPALES
    // ===========================
    const mainData = users.map((user) => ({
      'ID': user._id.toString(),
      'Prénom': user.name || '',
      'Nom': user.lastname || '',
      'Email': user.email || '',
      'Téléphone': user.telephone || 'Non renseigné',
      'Adresse': user.address || 'Non renseigné',
      'Rôle': user.role || 'user',
      'Email vérifié': user.email_verified_at ? 'Oui' : 'Non',
      'Date de vérification': user.email_verified_at
        ? new Date(user.email_verified_at).toLocaleString('fr-FR')
        : 'Non vérifié',
      'Date d\'inscription': user.created_at
        ? new Date(user.created_at).toLocaleString('fr-FR')
        : 'Non renseigné',
      'Dernière mise à jour': user.updated_at
        ? new Date(user.updated_at).toLocaleString('fr-FR')
        : 'Non renseigné',
    }));

    // ===========================
    // FEUILLE 2: PROFILS UTILISATEURS
    // ===========================
    const profileData = users
      .map((user) => {
        const profile = profiles.find((p) => p.userId?.toString() === user._id.toString());
        const followers = follows.filter((f) => f.followingId?.toString() === user._id.toString());
        const following = follows.filter((f) => f.followerId?.toString() === user._id.toString());
        const achievements = userAchievements.filter((ua) => ua.userId?.toString() === user._id.toString());

        if (!profile) return null;

        return {
          'Email utilisateur': user.email,
          'Username': profile.username || 'Non défini',
          'Bio': profile.bio || 'Pas de bio',
          'Pays': profile.country || 'Non renseigné',
          'Date de naissance': profile.birth_date
            ? new Date(profile.birth_date).toLocaleDateString('fr-FR')
            : 'Non renseigné',
          'Niveau d\'expérience': profile.experience_level || 'Non renseigné',
          'Objectifs d\'investissement': profile.investment_goals || 'Non renseignés',
          'A déjà investi': profile.has_invested ? 'Oui' : 'Non',
          'Montant mensuel': profile.monthly_amount || 'Non renseigné',
          'Type de profil': profile.profile_type || 'Non renseigné',
          'Profil public': profile.is_public ? 'Oui' : 'Non',
          'Niveau (gamification)': profile.level || 1,
          'XP Total': profile.total_xp || 0,
          'Streak actuel': profile.current_streak || 0,
          'Meilleur streak': profile.longest_streak || 0,
          'Classement global': profile.global_rank || 'Non classé',
          'Classement pays': profile.country_rank || 'Non classé',
          'Nombre de followers': followers.length,
          'Nombre de following': following.length,
          'Nombre de succès': achievements.length,
        };
      })
      .filter((p) => p !== null);

    // ===========================
    // FEUILLE 3: PORTEFEUILLES
    // ===========================
    const portfolioData = users.flatMap((user) => {
      const userPortfolios = portfolios.filter((p) => p.userId?.toString() === user._id.toString());

      return userPortfolios.map((portfolio) => {
        const portfolioPositions = positions.filter((pos) => pos.portfolioId?.toString() === portfolio._id.toString());
        const portfolioTransactions = transactions.filter((tx) => tx.portfolioId?.toString() === portfolio._id.toString());
        const totalValue = portfolioPositions.reduce((sum, pos) => sum + (pos.quantity * pos.average_buy_price), 0);

        return {
          'Email utilisateur': user.email,
          'Nom du portefeuille': portfolio.name,
          'Balance initiale': portfolio.initial_balance,
          'Cash disponible': portfolio.cash_balance,
          'Est virtuel': portfolio.is_virtual ? 'Oui' : 'Non',
          'Nombre de positions': portfolioPositions.length,
          'Nombre de transactions': portfolioTransactions.length,
          'Valeur totale positions': totalValue.toFixed(2),
          'Date de création': portfolio.created_at
            ? new Date(portfolio.created_at).toLocaleString('fr-FR')
            : 'N/A',
        };
      });
    });

    // ===========================
    // FEUILLE 4: PROGRÈS D'APPRENTISSAGE
    // ===========================
    const learningData = users.flatMap((user) => {
      const userProgress = learningProgress.filter((lp) => lp.userId?.toString() === user._id.toString());

      return userProgress.map((progress) => {
        const module = modules.find((m) => m._id.toString() === progress.moduleId?.toString());

        return {
          'Email utilisateur': user.email,
          'Module': module?.title || 'Module inconnu',
          'Difficulté': module?.difficulty_level || 'N/A',
          'Complété': progress.is_completed ? 'Oui' : 'Non',
          'Score Quiz': progress.quiz_score || 'Pas de score',
          'Nombre de tentatives': progress.quiz_attempts || 0,
          'Temps passé (min)': progress.time_spent_minutes || 0,
          'Dernier accès': progress.last_accessed_at
            ? new Date(progress.last_accessed_at).toLocaleString('fr-FR')
            : 'Jamais',
          'Date de complétion': progress.completed_at
            ? new Date(progress.completed_at).toLocaleString('fr-FR')
            : 'Non complété',
        };
      });
    });

    // ===========================
    // FEUILLE 5: SUCCÈS (ACHIEVEMENTS)
    // ===========================
    const achievementData = users.flatMap((user) => {
      const userAchs = userAchievements.filter((ua) => ua.userId?.toString() === user._id.toString());

      return userAchs.map((ua) => {
        const achievement = achievementsDef.find((a) => a._id.toString() === ua.achievementId?.toString());

        return {
          'Email utilisateur': user.email,
          'Succès': achievement?.name || 'Succès inconnu',
          'Description': achievement?.description || 'N/A',
          'Catégorie': achievement?.category || 'N/A',
          'Rareté': achievement?.rarity || 'N/A',
          'XP gagné': achievement?.xp_reward || 0,
          'Débloqué le': ua.unlocked_at ? new Date(ua.unlocked_at).toLocaleString('fr-FR') : 'N/A',
          'Affiché sur le profil': ua.is_displayed ? 'Oui' : 'Non',
        };
      });
    });

    // ===========================
    // FEUILLE 6: DÉFIS HEBDOMADAIRES
    // ===========================
    const challengeData = users.flatMap((user) => {
      const userChallenges = challengeProgress.filter((cp) => cp.userId?.toString() === user._id.toString());

      return userChallenges.map((cp) => {
        const challenge = challenges.find((c) => c._id.toString() === cp.challengeId?.toString());

        return {
          'Email utilisateur': user.email,
          'Défi': challenge?.title || 'Défi inconnu',
          'Type': challenge?.challenge_type || 'N/A',
          'Progression': `${cp.current || 0}/${challenge?.target || 0}`,
          'Complété': cp.completed ? 'Oui' : 'Non',
          'Récompense récupérée': cp.claimed ? 'Oui' : 'Non',
          'Date de complétion': cp.completed_at
            ? new Date(cp.completed_at).toLocaleString('fr-FR')
            : 'Non complété',
        };
      });
    });

    // ===========================
    // FEUILLE 7: WATCHLIST
    // ===========================
    const watchlistData = users.flatMap((user) => {
      const userWatchlist = watchlist.filter((w) => w.userId?.toString() === user._id.toString());

      return userWatchlist.map((item) => ({
        'Email utilisateur': user.email,
        'Ticker': item.stock_ticker,
        'Ajouté le': item.created_at
          ? new Date(item.created_at).toLocaleString('fr-FR')
          : 'N/A',
      }));
    });

    // ===========================
    // FEUILLE 8: STATISTIQUES GÉNÉRALES
    // ===========================
    const statsData = [
      {
        'Métrique': 'Total utilisateurs',
        'Valeur': users.length,
      },
      {
        'Métrique': 'Utilisateurs avec email vérifié',
        'Valeur': users.filter((u) => u.email_verified_at).length,
      },
      {
        'Métrique': 'Utilisateurs avec profil',
        'Valeur': profiles.length,
      },
      {
        'Métrique': 'Utilisateurs avec portefeuille',
        'Valeur': new Set(portfolios.map((p) => p.userId?.toString())).size,
      },
      {
        'Métrique': 'Total de portefeuilles',
        'Valeur': portfolios.length,
      },
      {
        'Métrique': 'Utilisateurs avec modules complétés',
        'Valeur': new Set(
          learningProgress.filter((lp) => lp.is_completed).map((lp) => lp.userId?.toString())
        ).size,
      },
      {
        'Métrique': 'Total modules complétés',
        'Valeur': learningProgress.filter((lp) => lp.is_completed).length,
      },
      {
        'Métrique': 'Utilisateurs avec succès débloqués',
        'Valeur': new Set(userAchievements.map((ua) => ua.userId?.toString())).size,
      },
      {
        'Métrique': 'Total succès débloqués',
        'Valeur': userAchievements.length,
      },
      {
        'Métrique': 'Total relations sociales (follows)',
        'Valeur': follows.length,
      },
    ];

    // ===========================
    // CRÉATION DU WORKBOOK EXCEL
    // ===========================
    const workbook = XLSX.utils.book_new();

    // Ajouter les feuilles
    const ws1 = XLSX.utils.json_to_sheet(mainData);
    const ws2 = XLSX.utils.json_to_sheet(profileData);
    const ws3 = XLSX.utils.json_to_sheet(portfolioData);
    const ws4 = XLSX.utils.json_to_sheet(learningData);
    const ws5 = XLSX.utils.json_to_sheet(achievementData);
    const ws6 = XLSX.utils.json_to_sheet(challengeData);
    const ws7 = XLSX.utils.json_to_sheet(watchlistData);
    const ws8 = XLSX.utils.json_to_sheet(statsData);

    XLSX.utils.book_append_sheet(workbook, ws1, 'Utilisateurs');
    XLSX.utils.book_append_sheet(workbook, ws2, 'Profils');
    XLSX.utils.book_append_sheet(workbook, ws3, 'Portefeuilles');
    XLSX.utils.book_append_sheet(workbook, ws4, 'Apprentissage');
    XLSX.utils.book_append_sheet(workbook, ws5, 'Succès');
    XLSX.utils.book_append_sheet(workbook, ws6, 'Défis');
    XLSX.utils.book_append_sheet(workbook, ws7, 'Watchlist');
    XLSX.utils.book_append_sheet(workbook, ws8, 'Statistiques');

    // ===========================
    // SAUVEGARDE DU FICHIER
    // ===========================
    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `users-export-${timestamp}.xlsx`;
    const filepath = path.join(exportsDir, filename);

    XLSX.writeFile(workbook, filepath);

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ EXPORT TERMINÉ !`);
    console.log(`\n📁 Fichier créé: ${filepath}`);
    console.log('\n📊 Contenu du fichier:');
    console.log(`   - Feuille 1: ${mainData.length} utilisateurs (infos principales)`);
    console.log(`   - Feuille 2: ${profileData.length} profils`);
    console.log(`   - Feuille 3: ${portfolioData.length} portefeuilles`);
    console.log(`   - Feuille 4: ${learningData.length} progressions d'apprentissage`);
    console.log(`   - Feuille 5: ${achievementData.length} succès débloqués`);
    console.log(`   - Feuille 6: ${challengeData.length} progressions de défis`);
    console.log(`   - Feuille 7: ${watchlistData.length} items en watchlist`);
    console.log(`   - Feuille 8: Statistiques générales`);
    console.log('\n' + '='.repeat(80));
  } catch (error) {
    console.error('\n💥 Erreur lors de l\'export:', error);
    throw error;
  } finally {
    await client.close();
  }
}

exportUsersToExcel()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
