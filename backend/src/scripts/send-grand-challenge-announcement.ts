/// <reference types="node" />
// Script pour annoncer le lancement du Grand Challenge AfriBourse
// Envoie : email + notification in-app + push notification à tous les utilisateurs réels confirmés
// Usage: npx ts-node src/scripts/send-grand-challenge-announcement.ts

import prisma from '../config/prisma';
import { sendGrandChallengeAnnouncementEmail } from '../services/email.service';
import { sendPushToAll } from '../services/push-notification.service';

const BATCH_SIZE = 10;
const DELAY_BETWEEN_EMAILS_MS = 1500;
const DELAY_BETWEEN_BATCHES_MS = 5000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendGrandChallengeAnnouncement() {
  console.log('🏆 Lancement du Grand Challenge AfriBourse\n');
  console.log('='.repeat(60));

  try {
    // 1. Récupérer tous les vrais utilisateurs confirmés
    const users = await prisma.user.findMany({
      where: {
        email: { not: { endsWith: '@fake-afribourse.com' } },
        email_verified_at: { not: null },
      },
      select: { id: true, email: true, name: true, lastname: true },
      orderBy: { created_at: 'asc' },
    });

    console.log(`\n📊 ${users.length} utilisateurs réels confirmés trouvés\n`);

    // 2. Notifications in-app pour tous les utilisateurs
    console.log('📲 Création des notifications in-app...');
    const notifData = users.map(u => ({
      user_id: u.id,
      type: 'SYSTEM' as const,
      title: '🏆 Le Grand Challenge AfriBourse a commencé !',
      message:
        'Les règles, les échéances, le classement et les prix sont disponibles dans la communauté. Bonne chance — que les meilleurs gagnent !',
      is_read: false,
      created_at: new Date(),
    }));

    await prisma.notification.createMany({ data: notifData });
    console.log(`   ✅ ${notifData.length} notifications in-app créées\n`);

    // 3. Push notifications à tous les abonnés
    console.log('🔔 Envoi des push notifications...');
    const pushSent = await sendPushToAll({
      title: '🏆 Grand Challenge AfriBourse',
      body: 'Le Grand Challenge a commencé ! Consultez la communauté pour les règles et les prix.',
      url: '/challenge',
      tag: 'grand-challenge-launch',
    });
    console.log(`   ✅ ${pushSent} push notifications envoyées\n`);

    // 4. Emails à tous les utilisateurs
    console.log('📧 Envoi des emails...');
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const displayName = `${user.name} ${user.lastname}`.trim() || 'Investisseur';

      try {
        await sendGrandChallengeAnnouncementEmail({ email: user.email, name: displayName });
        sent++;
        console.log(`   ✅ [${sent + failed}/${users.length}] ${displayName} (${user.email})`);
      } catch (error: any) {
        failed++;
        console.error(`   ❌ [${sent + failed}/${users.length}] ${user.email} - ${error.message}`);
      }

      await sleep(DELAY_BETWEEN_EMAILS_MS);

      if ((i + 1) % BATCH_SIZE === 0 && i < users.length - 1) {
        console.log(`\n   ⏳ Pause de ${DELAY_BETWEEN_BATCHES_MS / 1000}s après ${i + 1} emails...\n`);
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Annonce du Grand Challenge terminée !');
    console.log(`   → Emails envoyés : ${sent}`);
    console.log(`   → Emails échoués : ${failed}`);
    console.log(`   → Notifications in-app : ${notifData.length}`);
    console.log(`   → Push notifications : ${pushSent}`);
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

sendGrandChallengeAnnouncement();
