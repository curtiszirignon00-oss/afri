/// <reference types="node" />
// Script pour envoyer l'email d'annonce PWA à tous les vrais utilisateurs
// Usage: npx ts-node src/scripts/send-pwa-announcement.ts

import prisma from '../config/prisma';
import { sendPWAAnnouncementEmail } from '../services/email.service';

const BATCH_SIZE = 10;
const DELAY_BETWEEN_EMAILS_MS = 1500; // 1.5s entre chaque email
const DELAY_BETWEEN_BATCHES_MS = 5000; // 5s entre chaque batch

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendPWAAnnouncement() {
  console.log('📱 Envoi de l\'email d\'annonce PWA à tous les utilisateurs\n');
  console.log('='.repeat(60));

  try {
    // Récupérer tous les vrais utilisateurs (exclure les fakes et non confirmés)
    const users = await prisma.user.findMany({
      where: {
        email: {
          not: { endsWith: '@fake-afribourse.com' },
        },
        email_verified_at: { not: null },
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
      },
      orderBy: { created_at: 'asc' },
    });

    console.log(`\n📊 ${users.length} utilisateurs réels confirmés trouvés\n`);

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const displayName = `${user.name} ${user.lastname}`.trim() || 'Investisseur';

      try {
        await sendPWAAnnouncementEmail({
          email: user.email,
          name: displayName,
        });
        sent++;
        console.log(`   ✅ [${sent + failed}/${users.length}] ${displayName} (${user.email})`);
      } catch (error: any) {
        failed++;
        console.error(`   ❌ [${sent + failed}/${users.length}] ${user.email} - ${error.message}`);
      }

      // Pause entre chaque email
      await sleep(DELAY_BETWEEN_EMAILS_MS);

      // Pause plus longue entre chaque batch
      if ((i + 1) % BATCH_SIZE === 0 && i < users.length - 1) {
        console.log(`\n   ⏳ Pause de ${DELAY_BETWEEN_BATCHES_MS / 1000}s après ${i + 1} emails...\n`);
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Envoi terminé !`);
    console.log(`   → Envoyés: ${sent}`);
    console.log(`   → Échoués: ${failed}`);
    console.log(`   → Total: ${users.length}`);
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

sendPWAAnnouncement();
