import prisma from './config/prisma';
import { upsertUserProfile } from './services/users.service.prisma';

async function run() {
  try {
    // Try to get an existing user, otherwise create one
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Test',
          lastname: 'User',
          email: `test.user.${Date.now()}@example.com`,
          password: 'hashed_pw',
          role: 'user'
        }
      });
      console.log('Created test user:', user.id);
    } else {
      console.log('Using existing user:', user.id);
    }

    const profileData = {
      first_name: 'Jean',
      last_name: 'Dupont',
      country: 'CI',
      birth_date: '1990-01-01',
      has_invested: 'oui',
      experience_level: 'intermediaire',
      main_goals: ['investir', 'apprendre'],
      monthly_amount: '50000',
      profile_type: 'investor',
      avatar_url: 'https://example.com/avatar.png',
      is_public: true,
      bio: 'Profil de test',
      social_links: ['https://twitter.com/test']
    } as any;

    const result = await upsertUserProfile(user.id, profileData);
    console.log('Upsert result:', result);
  } catch (e) {
    console.error('Error during test upsert:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
