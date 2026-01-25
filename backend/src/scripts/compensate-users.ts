/**
 * Script de compensation pour les utilisateurs récupérés
 *
 * Ce script attribue aux 100 utilisateurs récupérés:
 * 1. Badge "Pionnier AfriBourse" (exclusif)
 * 2. +500,000 FCFA de capital virtuel bonus
 * 3. Les 2 premiers modules de formation débloqués
 * 4. Une notification personnalisée de bienvenue
 *
 * Usage: npx ts-node src/scripts/compensate-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BONUS_CAPITAL = 500000; // 500,000 FCFA
const BONUS_XP = 500; // 500 XP

async function main() {
  console.log('═'.repeat(60));
  console.log('🎁 COMPENSATION DES UTILISATEURS RÉCUPÉRÉS');
  console.log('═'.repeat(60));
  console.log('');

  try {
    // ============================================
    // 1. CRÉER LE BADGE "PIONNIER AFRIBOURSE"
    // ============================================
    console.log('🏅 Étape 1: Création du badge "Pionnier AfriBourse"...');

    let achievement = await prisma.achievement.findUnique({
      where: { code: 'pioneer_2026' },
    });

    if (!achievement) {
      achievement = await prisma.achievement.create({
        data: {
          code: 'pioneer_2026',
          name: 'Pionnier AfriBourse',
          description: 'Membre fondateur de la communauté AfriBourse. Merci pour votre confiance et votre fidélité !',
          icon: '🚀',
          category: 'special',
          rarity: 'legendary',
          xp_reward: BONUS_XP,
          criteria: { type: 'special', reason: 'early_adopter_recovery_2026' },
          is_hidden: false,
        },
      });
      console.log(`   ✅ Badge créé: ${achievement.name}`);
    } else {
      console.log(`   ℹ️  Badge existe déjà: ${achievement.name}`);
    }

    // ============================================
    // 2. RÉCUPÉRER TOUS LES UTILISATEURS
    // ============================================
    console.log('');
    console.log('👥 Récupération des utilisateurs...');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        profile: {
          select: {
            id: true,
            userId: true,
            total_xp: true,
            level: true,
          },
        },
        portfolios: {
          where: { wallet_type: 'SANDBOX' },
          select: {
            id: true,
            cash_balance: true,
          },
        },
      },
    });

    console.log(`   📊 ${users.length} utilisateurs trouvés`);

    // ============================================
    // 3. RÉCUPÉRER LES 2 PREMIERS MODULES
    // ============================================
    console.log('');
    console.log('📚 Récupération des premiers modules de formation...');

    const firstModules = await prisma.learningModule.findMany({
      where: { is_published: true },
      orderBy: { order_index: 'asc' },
      take: 2,
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    console.log(`   📖 Modules à débloquer:`);
    firstModules.forEach((m, i) => {
      console.log(`      ${i + 1}. ${m.title}`);
    });

    // ============================================
    // 4. APPLIQUER LES COMPENSATIONS
    // ============================================
    console.log('');
    console.log('🎁 Application des compensations...');
    console.log('');

    let badgesAttribues = 0;
    let capitalAjoute = 0;
    let modulesDebloques = 0;
    let notificationsCreees = 0;
    let xpAjoute = 0;

    for (const user of users) {
      const userName = user.name || 'Utilisateur';
      process.stdout.write(`   → ${user.email}... `);

      try {
        // 4a. Attribuer le badge (si pas déjà)
        if (user.profile) {
          const existingBadge = await prisma.userAchievement.findUnique({
            where: {
              userId_achievementId: {
                userId: user.profile.userId,
                achievementId: achievement.id,
              },
            },
          });

          if (!existingBadge) {
            await prisma.userAchievement.create({
              data: {
                userId: user.profile.userId,
                achievementId: achievement.id,
                is_displayed: true,
                is_notified: true,
              },
            });
            badgesAttribues++;
          }

          // 4b. Ajouter le bonus XP
          await prisma.userProfile.update({
            where: { userId: user.id },
            data: {
              total_xp: { increment: BONUS_XP },
            },
          });
          xpAjoute++;
        }

        // 4c. Ajouter le capital bonus au portefeuille sandbox
        if (user.portfolios.length > 0) {
          const portfolio = user.portfolios[0];
          await prisma.portfolio.update({
            where: { id: portfolio.id },
            data: {
              cash_balance: { increment: BONUS_CAPITAL },
              initial_balance: { increment: BONUS_CAPITAL },
            },
          });
          capitalAjoute++;
        }

        // 4d. Débloquer les premiers modules
        for (const module of firstModules) {
          const existingProgress = await prisma.learningProgress.findUnique({
            where: {
              userId_moduleId: {
                userId: user.id,
                moduleId: module.id,
              },
            },
          });

          if (!existingProgress) {
            await prisma.learningProgress.create({
              data: {
                userId: user.id,
                moduleId: module.id,
                is_completed: true,
                completed_at: new Date(),
                quiz_score: 100, // Score parfait offert
                quiz_attempts: 1,
                time_spent_minutes: 15,
              },
            });
            modulesDebloques++;
          }
        }

        // 4e. Créer la notification personnalisée
        await prisma.notification.create({
          data: {
            user_id: user.id,
            type: 'SYSTEM',
            title: '🎉 Bienvenue, Pionnier !',
            message: `Merci ${userName} pour votre fidélité ! Suite à notre maintenance, nous vous offrons: le badge exclusif "Pionnier AfriBourse", +${BONUS_CAPITAL.toLocaleString()} FCFA de capital virtuel, +${BONUS_XP} XP, et vos 2 premiers modules de formation complétés. Bonne continuation sur AfriBourse !`,
            metadata: {
              type: 'compensation',
              bonus_capital: BONUS_CAPITAL,
              bonus_xp: BONUS_XP,
              badge: 'pioneer_2026',
            },
            is_read: false,
          },
        });
        notificationsCreees++;

        console.log('✅');

      } catch (error: any) {
        console.log(`❌ ${error.message}`);
      }
    }

    // ============================================
    // 5. RÉSUMÉ
    // ============================================
    console.log('');
    console.log('═'.repeat(60));
    console.log('📊 RÉSUMÉ DES COMPENSATIONS');
    console.log('═'.repeat(60));
    console.log(`   🏅 Badges "Pionnier AfriBourse" attribués: ${badgesAttribues}`);
    console.log(`   ⭐ Bonus XP (+${BONUS_XP}) ajoutés: ${xpAjoute}`);
    console.log(`   💰 Capital bonus (+${BONUS_CAPITAL.toLocaleString()} FCFA) ajouté: ${capitalAjoute}`);
    console.log(`   📚 Modules débloqués: ${modulesDebloques}`);
    console.log(`   🔔 Notifications créées: ${notificationsCreees}`);
    console.log('');
    console.log('✅ Compensation terminée avec succès !');

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
