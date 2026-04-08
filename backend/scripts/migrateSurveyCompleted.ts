/**
 * Migration: set survey_completed = true for all users who have already
 * completed the KYC onboarding (onboarding_completed = true).
 * Also sets profile_type = 'investisseur' and avatar_color for those users.
 *
 * Run: npx ts-node scripts/migrateSurveyCompleted.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find all users with completed KYC
  const completedProfiles = await prisma.investorProfile.findMany({
    where: { onboarding_completed: true },
    select: { user_id: true },
  });

  console.log(`Found ${completedProfiles.length} users with completed KYC.`);

  let updated = 0;

  for (const { user_id } of completedProfiles) {
    await prisma.userProfile.upsert({
      where: { userId: user_id },
      create: {
        userId: user_id,
        survey_completed: true,
        avatar_color: 'from-violet-500 to-purple-600',
        discovery_survey: {
          q1: 'C',
          q2: null,
          q3: 'B',
          profile_type: 'investisseur',
          urgency: 'medium',
          completed_at: new Date().toISOString(),
          migrated: true,
        },
      },
      update: {
        survey_completed: true,
        // Only set avatar_color if not already set
      },
    });
    updated++;
  }

  console.log(`Migration complete. Updated ${updated} users.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
