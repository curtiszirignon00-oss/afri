// Script one-time: vérifier et attribuer les badges à tous les utilisateurs
import { PrismaClient } from '@prisma/client';
import * as achievementService from '../services/achievement.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🏆 Vérification des badges pour TOUS les utilisateurs...\n');

  const users = await prisma.user.findMany({
    where: { email_verified_at: { not: null } },
    select: { id: true, email: true }
  });

  console.log(`📊 ${users.length} utilisateurs à vérifier\n`);

  let totalUnlocked = 0;
  let usersChecked = 0;

  for (const user of users) {
    try {
      const result = await achievementService.checkAllAchievements(user.id);
      usersChecked++;
      if (result.total > 0) {
        totalUnlocked += result.total;
        console.log(`🏆 ${user.email}: ${result.total} badge(s) débloqué(s)`);
        if (result.formation.length > 0) console.log(`   📚 Formation: ${result.formation.map((r: any) => r.achievement?.name).join(', ')}`);
        if (result.trading.length > 0) console.log(`   📈 Trading: ${result.trading.map((r: any) => r.achievement?.name).join(', ')}`);
        if (result.social.length > 0) console.log(`   🤝 Social: ${result.social.map((r: any) => r.achievement?.name).join(', ')}`);
        if (result.engagement.length > 0) console.log(`   🔥 Engagement: ${result.engagement.map((r: any) => r.achievement?.name).join(', ')}`);
        if (result.special.length > 0) console.log(`   ⭐ Spécial: ${result.special.map((r: any) => r.achievement?.name).join(', ')}`);
      }
    } catch (err) {
      console.error(`❌ Erreur pour ${user.email}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Terminé!`);
  console.log(`   Utilisateurs vérifiés: ${usersChecked}`);
  console.log(`   Badges débloqués: ${totalUnlocked}`);
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
