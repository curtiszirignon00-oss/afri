/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const prisma = new PrismaClient();

async function exportUsersToExcel() {
  console.log('\n📊 EXPORT DES UTILISATEURS VERS EXCEL');
  console.log('='.repeat(80));

  try {
    // Récupérer tous les utilisateurs de manière brute pour éviter les erreurs de validation
    const allUsers = await prisma.user.findMany({
      include: {
        profile: {
          include: {
            achievements: {
              include: {
                achievement: true,
              },
            },
            followers: true,
            following: true,
            rewards: {
              include: {
                reward: true,
              },
            },
          },
        },
        portfolios: {
          include: {
            positions: true,
            transactions: true,
          },
        },
        watchlistItems: true,
        learningProgress: {
          include: {
            module: true,
          },
        },
        challengeProgress: {
          include: {
            challenge: true,
          },
        },
      },
    }).catch(async (error) => {
      // Si l'erreur est liée aux dates nulles, on récupère les utilisateurs sans tri
      console.log('\n⚠️  Détection de données avec dates nulles, récupération en mode safe...');

      const userIds = await prisma.user.findMany({
        select: { id: true },
      });

      return Promise.all(
        userIds.map(async ({ id }) => {
          const user = await prisma.user.findUnique({
            where: { id },
            include: {
              profile: {
                include: {
                  achievements: {
                    include: {
                      achievement: true,
                    },
                  },
                  followers: true,
                  following: true,
                  rewards: {
                    include: {
                      reward: true,
                    },
                  },
                },
              },
              portfolios: {
                include: {
                  positions: true,
                  transactions: true,
                },
              },
              watchlistItems: true,
              learningProgress: {
                include: {
                  module: true,
                },
              },
              challengeProgress: {
                include: {
                  challenge: true,
                },
              },
            },
          });
          return user!;
        })
      );
    });

    const users = allUsers;

    console.log(`\n✅ ${users.length} utilisateurs trouvés`);

    // ===========================
    // FEUILLE 1: INFORMATIONS PRINCIPALES
    // ===========================
    const mainData = users.map((user) => ({
      'ID': user.id,
      'Prénom': user.name,
      'Nom': user.lastname,
      'Email': user.email,
      'Téléphone': user.telephone || 'Non renseigné',
      'Adresse': user.address || 'Non renseigné',
      'Rôle': user.role,
      'Email vérifié': user.email_verified_at ? 'Oui' : 'Non',
      'Date de vérification': user.email_verified_at
        ? new Date(user.email_verified_at).toLocaleString('fr-FR')
        : 'Non vérifié',
      'Date d\'inscription': user.created_at
        ? new Date(user.created_at).toLocaleString('fr-FR')
        : 'N/A',
      'Dernière mise à jour': user.updated_at
        ? new Date(user.updated_at).toLocaleString('fr-FR')
        : 'N/A',
    }));

    // ===========================
    // FEUILLE 2: PROFILS UTILISATEURS
    // ===========================
    const profileData = users
      .filter((user) => user.profile)
      .map((user) => ({
        'Email utilisateur': user.email,
        'Username': user.profile?.username || 'Non défini',
        'Bio': user.profile?.bio || 'Pas de bio',
        'Pays': user.profile?.country || 'Non renseigné',
        'Date de naissance': user.profile?.birth_date
          ? new Date(user.profile.birth_date).toLocaleDateString('fr-FR')
          : 'Non renseigné',
        'Niveau d\'expérience': user.profile?.experience_level || 'Non renseigné',
        'Objectifs d\'investissement': user.profile?.investment_goals || 'Non renseignés',
        'A déjà investi': user.profile?.has_invested ? 'Oui' : 'Non',
        'Montant mensuel': user.profile?.monthly_amount || 'Non renseigné',
        'Type de profil': user.profile?.profile_type || 'Non renseigné',
        'Profil public': user.profile?.is_public ? 'Oui' : 'Non',
        'Niveau (gamification)': user.profile?.level || 1,
        'XP Total': user.profile?.total_xp || 0,
        'Streak actuel': user.profile?.current_streak || 0,
        'Meilleur streak': user.profile?.longest_streak || 0,
        'Classement global': user.profile?.global_rank || 'Non classé',
        'Classement pays': user.profile?.country_rank || 'Non classé',
        'Nombre de followers': user.profile?.followers.length || 0,
        'Nombre de following': user.profile?.following.length || 0,
        'Nombre de succès': user.profile?.achievements.length || 0,
      }));

    // ===========================
    // FEUILLE 3: PORTEFEUILLES
    // ===========================
    const portfolioData = users.flatMap((user) =>
      user.portfolios.map((portfolio) => ({
        'Email utilisateur': user.email,
        'Nom du portefeuille': portfolio.name,
        'Balance initiale': portfolio.initial_balance,
        'Cash disponible': portfolio.cash_balance,
        'Est virtuel': portfolio.is_virtual ? 'Oui' : 'Non',
        'Nombre de positions': portfolio.positions.length,
        'Nombre de transactions': portfolio.transactions.length,
        'Valeur totale positions': portfolio.positions.reduce(
          (sum, pos) => sum + pos.quantity * pos.average_buy_price,
          0
        ).toFixed(2),
        'Date de création': portfolio.created_at
          ? new Date(portfolio.created_at).toLocaleString('fr-FR')
          : 'N/A',
      }))
    );

    // ===========================
    // FEUILLE 4: PROGRÈS D'APPRENTISSAGE
    // ===========================
    const learningData = users.flatMap((user) =>
      user.learningProgress.map((progress) => ({
        'Email utilisateur': user.email,
        'Module': progress.module.title,
        'Difficulté': progress.module.difficulty_level,
        'Complété': progress.is_completed ? 'Oui' : 'Non',
        'Score Quiz': progress.quiz_score || 'Pas de score',
        'Nombre de tentatives': progress.quiz_attempts,
        'Temps passé (min)': progress.time_spent_minutes || 0,
        'Dernier accès': progress.last_accessed_at
          ? new Date(progress.last_accessed_at).toLocaleString('fr-FR')
          : 'Jamais',
        'Date de complétion': progress.completed_at
          ? new Date(progress.completed_at).toLocaleString('fr-FR')
          : 'Non complété',
      }))
    );

    // ===========================
    // FEUILLE 5: SUCCÈS (ACHIEVEMENTS)
    // ===========================
    const achievementData = users.flatMap((user) =>
      user.profile?.achievements.map((ua) => ({
        'Email utilisateur': user.email,
        'Succès': ua.achievement.name,
        'Description': ua.achievement.description,
        'Catégorie': ua.achievement.category,
        'Rareté': ua.achievement.rarity,
        'XP gagné': ua.achievement.xp_reward,
        'Débloqué le': new Date(ua.unlocked_at).toLocaleString('fr-FR'),
        'Affiché sur le profil': ua.is_displayed ? 'Oui' : 'Non',
      })) || []
    );

    // ===========================
    // FEUILLE 6: DÉFIS HEBDOMADAIRES
    // ===========================
    const challengeData = users.flatMap((user) =>
      user.challengeProgress.map((cp) => ({
        'Email utilisateur': user.email,
        'Défi': cp.challenge.title,
        'Type': cp.challenge.challenge_type,
        'Progression': `${cp.current}/${cp.challenge.target}`,
        'Complété': cp.completed ? 'Oui' : 'Non',
        'Récompense récupérée': cp.claimed ? 'Oui' : 'Non',
        'Date de complétion': cp.completed_at
          ? new Date(cp.completed_at).toLocaleString('fr-FR')
          : 'Non complété',
      }))
    );

    // ===========================
    // FEUILLE 7: WATCHLIST
    // ===========================
    const watchlistData = users.flatMap((user) =>
      user.watchlistItems.map((item) => ({
        'Email utilisateur': user.email,
        'Ticker': item.stock_ticker,
        'Ajouté le': item.created_at
          ? new Date(item.created_at).toLocaleString('fr-FR')
          : 'N/A',
      }))
    );

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
        'Valeur': users.filter((u) => u.profile).length,
      },
      {
        'Métrique': 'Utilisateurs avec portefeuille',
        'Valeur': users.filter((u) => u.portfolios.length > 0).length,
      },
      {
        'Métrique': 'Total de portefeuilles',
        'Valeur': users.reduce((sum, u) => sum + u.portfolios.length, 0),
      },
      {
        'Métrique': 'Utilisateurs avec modules complétés',
        'Valeur': users.filter((u) =>
          u.learningProgress.some((lp) => lp.is_completed)
        ).length,
      },
      {
        'Métrique': 'Total modules complétés',
        'Valeur': users.reduce(
          (sum, u) => sum + u.learningProgress.filter((lp) => lp.is_completed).length,
          0
        ),
      },
      {
        'Métrique': 'Utilisateurs avec succès débloqués',
        'Valeur': users.filter((u) => (u.profile?.achievements.length || 0) > 0).length,
      },
      {
        'Métrique': 'Total succès débloqués',
        'Valeur': users.reduce((sum, u) => sum + (u.profile?.achievements.length || 0), 0),
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
    await prisma.$disconnect();
  }
}

exportUsersToExcel()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
