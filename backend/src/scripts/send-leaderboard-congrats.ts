/// <reference types="node" />
// Script pour envoyer un email de félicitations au Top 5 du classement portfolios
// Usage: npx ts-node src/scripts/send-leaderboard-congrats.ts

import prisma from '../config/prisma';
import { sendLeaderboardCongratulationEmail } from '../services/email.service';
import { getMonthlyROILeaderboard } from '../services/gamification-leaderboard.service';

async function sendLeaderboardCongrats() {
  console.log('🏆 Envoi des emails de félicitations au Top 5 du classement\n');
  console.log('='.repeat(60));

  try {
    // Récupérer le top 5
    const leaderboard = await getMonthlyROILeaderboard(5);
    const entries = leaderboard.entries;

    if (entries.length === 0) {
      console.log('❌ Aucun participant trouvé dans le classement.');
      return;
    }

    console.log(`\n📊 Top ${entries.length} des meilleurs portfolios simulés:\n`);

    for (const entry of entries) {
      const roi = entry.total_xp / 100; // total_xp stores ROI * 100

      // Récupérer l'email de l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: entry.userId },
        select: { email: true, name: true, lastname: true },
      });

      if (!user) {
        console.log(`   ⚠️  #${entry.rank} - Utilisateur ${entry.userId} introuvable`);
        continue;
      }

      const displayName = `${user.name} ${user.lastname}`.trim() || entry.username;
      const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '🏅';

      console.log(`   ${rankEmoji} #${entry.rank} - ${displayName} (${user.email}) → ROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%`);

      try {
        await sendLeaderboardCongratulationEmail({
          email: user.email,
          name: displayName,
          rank: entry.rank,
          roi,
        });
        console.log(`      ✅ Email envoyé avec succès !`);
      } catch (emailError: any) {
        console.error(`      ❌ Erreur d'envoi: ${emailError.message}`);
      }

      // Pause de 2s entre chaque envoi pour ne pas surcharger le serveur SMTP
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Envoi terminé !');
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

sendLeaderboardCongrats();
