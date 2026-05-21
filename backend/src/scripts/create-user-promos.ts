/**
 * Seeder : crée les promos Investisseur+ 50% pour les utilisateurs
 * ayant exprimé une intention de paiement.
 *
 * - 3 utilisations max (= 3 mois à moitié prix)
 * - Expire le 31 août 2026
 * - Idempotent : skip si la promo existe déjà pour cet utilisateur
 *
 * Usage : npx tsx src/scripts/create-user-promos.ts
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const TARGET_EMAILS = [
  // Vague 1 — intention de paiement
  'amadouniane230@gmail.com',
  'bossbien1@gmail.com',
  'siemamadoutoure@gmail.com',
  'kaudjr@gmail.com',
  'solangeiyolopembe@yahoo.fr',
  'sanei4152@gmail.com',
  'adissif1@gmail.com',
  'tannant.rox26@gmail.com',
  'sherleynguessan521@gmail.com',
  'nianeahmedtidiane@gmail.com',
  'sidicki780@gmail.com',
  'antoinehoungbedji144@gmail.com',
  // Vague 2 — paiement échoué / interrompu
  'mt706524@gmail.com',
  'jujusessi@gmail.com',
  'juleskouame36@gmail.com',
  'nevillesow@gmail.com',
  'amademaiga064@gmail.com',
  'konateamadou421@gmail.com',
  'anone1337@proton.me',
  'blackamericain888@gmail.com',
  'me@valerymelou.com',
  'bachirmorou69@gmail.com',
];

const PROMO = {
  planId: 'investisseur-plus',
  discountPercent: 50,
  maxUses: 3,
  expiresAt: new Date('2026-08-31T23:59:59Z'),
};

async function run() {
  console.log('\n🎯 Création des promos Investisseur+ 50%');
  console.log('='.repeat(60));

  let created = 0;
  let skipped = 0;
  let notFound = 0;

  for (const email of TARGET_EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      console.log(`⚠️  Introuvable en DB : ${email}`);
      notFound++;
      continue;
    }

    const existing = await prisma.userPromo.findFirst({
      where: { userId: user.id, planId: PROMO.planId },
    });

    if (existing) {
      console.log(`⏭️  Déjà existante   : ${email} (usedCount: ${existing.usedCount}/${existing.maxUses})`);
      skipped++;
      continue;
    }

    await prisma.userPromo.create({
      data: { userId: user.id, ...PROMO },
    });

    console.log(`✅ Créée            : ${email} (${user.name ?? 'sans nom'})`);
    created++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Créées    : ${created}`);
  console.log(`⏭️  Existantes: ${skipped}`);
  console.log(`⚠️  Absents DB: ${notFound}`);
  console.log('='.repeat(60));
  console.log('\n💡 Lance ensuite la campagne email :\n   npx tsx src/scripts/send-investisseur-plus-promo.ts\n');
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Erreur fatale :', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
