/**
 * Script de migration — Programme ambassadeur Pack Parcours
 * Met à jour isPackParticipant = true pour tous les users ayant une
 * inscription payée au pack (pack-parcours-investisseur).
 *
 * Usage : npx ts-node src/scripts/migrate-pack-participants.ts
 */
import { prisma } from '../config/database';

async function main() {
  console.log('🔍 Recherche des inscriptions payées au Pack Parcours...');

  const paidRegistrations = await prisma.webinarRegistration.findMany({
    where: {
      webinarId: 'pack-parcours-investisseur',
      paymentStatus: 'paid',
      userId: { not: null },
    },
    select: { userId: true, email: true },
  });

  console.log(`📋 ${paidRegistrations.length} inscription(s) payée(s) trouvée(s).`);

  let updated = 0;
  let skipped = 0;

  for (const reg of paidRegistrations) {
    if (!reg.userId) { skipped++; continue; }

    const user = await prisma.user.findUnique({
      where: { id: reg.userId },
      select: { id: true, email: true, isPackParticipant: true },
    });

    if (!user) { skipped++; continue; }
    if (user.isPackParticipant) { skipped++; continue; }

    await prisma.user.update({
      where: { id: user.id },
      data: { isPackParticipant: true },
    });

    console.log(`  ✅ ${user.email} → isPackParticipant = true`);
    updated++;
  }

  console.log(`\n✔ Migration terminée : ${updated} mis à jour, ${skipped} ignorés (déjà marqués ou sans userId).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Erreur migration :', e);
  prisma.$disconnect();
  process.exit(1);
});
