/// <reference types="node" />
// Newsletter mars 2026 : Badges, Dashboards et Challenge 10M FCFA
// Envoie un email à tous les utilisateurs réels confirmés (hors fake-afribourse)
// Usage: npx ts-node src/scripts/send-newsletter-march-2026.ts

import prisma from '../config/prisma';
import { sendNewsletterMarch2026Email } from '../services/email.service';

const BATCH_SIZE = 10;
const DELAY_BETWEEN_EMAILS_MS = 1500;
const DELAY_BETWEEN_BATCHES_MS = 5000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendNewsletter() {
  console.log('🚀 Newsletter Mars 2026 — Badges, Dashboards & Challenge 10M FCFA\n');
  console.log('='.repeat(60));

  try {
    const users = await prisma.user.findMany({
      where: {
        email: { not: { endsWith: '@fake-afribourse.com' } },
        email_verified_at: { not: null },
      },
      select: { id: true, email: true, name: true, lastname: true },
      orderBy: { created_at: 'asc' },
    });

    console.log(`\n📊 ${users.length} utilisateurs réels confirmés trouvés\n`);
    console.log('📧 Envoi des emails...\n');

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const displayName = `${user.name} ${user.lastname}`.trim() || 'Investisseur';

      try {
        await sendNewsletterMarch2026Email({ email: user.email, name: displayName });
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
    console.log('🎉 Newsletter envoyée !');
    console.log(`   → Emails envoyés  : ${sent}`);
    console.log(`   → Emails échoués  : ${failed}`);
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

sendNewsletter();
