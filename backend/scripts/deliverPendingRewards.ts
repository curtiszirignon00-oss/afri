import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const AUTO_DELIVER_TYPES = ['virtual_cash', 'freeze', 'cosmetic', 'feature'];

async function applyReward(userId: string, reward: any) {
  const rewardData = reward.reward_data as Record<string, any>;

  switch (reward.reward_type) {
    case 'virtual_cash': {
      const portfolio = await prisma.portfolio.findFirst({ where: { userId } });
      if (portfolio) {
        await prisma.portfolio.update({
          where: { id: portfolio.id },
          data: {
            cash_balance: { increment: rewardData.amount },
            initial_balance: { increment: rewardData.amount }
          }
        });
      }
      break;
    }
    case 'freeze':
      await prisma.userProfile.update({
        where: { userId },
        data: { streak_freezes: { increment: rewardData.quantity } }
      });
      break;
    case 'cosmetic':
    case 'feature':
      // Actif dès que delivery_status = 'delivered' dans UserReward
      break;
    default:
      break;
  }
}

async function main() {
  console.log('🔄 Backfill des récompenses en attente...\n');

  const pending = await prisma.userReward.findMany({
    where: { delivery_status: 'pending' },
    include: { reward: true }
  });

  console.log(`📦 ${pending.length} récompenses trouvées avec delivery_status = 'pending'\n`);

  let delivered = 0;
  let skipped = 0;
  let errors = 0;

  for (const ur of pending) {
    const isAuto = AUTO_DELIVER_TYPES.includes(ur.reward.reward_type);

    if (!isAuto) {
      console.log(`⏭  [SKIP] "${ur.reward.title}" (${ur.reward.reward_type}) — livraison manuelle requise`);
      skipped++;
      continue;
    }

    try {
      await applyReward(ur.userId, ur.reward);
      await prisma.userReward.update({
        where: { id: ur.id },
        data: {
          claimed: true,
          claimed_at: ur.claimed_at ?? new Date(),
          delivery_status: 'delivered'
        }
      });
      console.log(`✅ [OK] userId=${ur.userId} — "${ur.reward.title}" (${ur.reward.reward_type})`);
      delivered++;
    } catch (e: any) {
      console.error(`❌ [ERR] userId=${ur.userId} — "${ur.reward.title}": ${e.message}`);
      errors++;
    }
  }

  console.log('\n─────────────────────────────');
  console.log(`✅ Livrées  : ${delivered}`);
  console.log(`⏭  Skippées : ${skipped} (manuelles)`);
  console.log(`❌ Erreurs  : ${errors}`);
  console.log('─────────────────────────────\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
