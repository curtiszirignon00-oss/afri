/**
 * Script one-shot — Enregistrer manuellement un paiement pack confirmé hors webhook.
 * Usage : npx tsx src/scripts/register-manual-pack-payment.ts
 */
import { prisma } from '../config/database';

async function main() {
  const email = 'mariofadegnon@gmail.com';
  const firstName = 'Mario';
  const lastName = 'Fadegnon';
  const webinarId = 'pack-parcours-investisseur';
  const amount = '35000';
  const currency = 'XOF';

  // 1. Vérifier si une inscription existe déjà
  const existing = await prisma.webinarRegistration.findFirst({
    where: { webinarId, email },
  });

  if (existing) {
    if (existing.paymentStatus === 'paid') {
      console.log(`ℹ️  Inscription déjà marquée comme payée (id: ${existing.id}). Rien à faire.`);
    } else {
      // Mettre à jour le statut
      const updated = await prisma.webinarRegistration.update({
        where: { id: existing.id },
        data: { paymentStatus: 'paid', paidAt: new Date() },
      });
      console.log(`✅ Inscription existante marquée payée (id: ${updated.id})`);
    }
  } else {
    // Créer l'inscription payée
    const reg = await prisma.webinarRegistration.create({
      data: {
        webinarId,
        type: 'pack',
        firstName,
        lastName,
        email,
        earlyBird: false,
        paymentStatus: 'paid',
        paidAt: new Date(),
      },
    });
    console.log(`✅ Inscription créée et marquée payée (id: ${reg.id})`);
  }

  // 2. Marquer isPackParticipant sur le compte user si existant
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isPackParticipant: true },
    });
    console.log(`✅ User ${email} → isPackParticipant = true`);
  } else {
    console.log(`ℹ️  Aucun compte utilisateur trouvé pour ${email} (inscription sans compte, normal).`);
  }

  console.log('\n✔ Terminé. Mario Fadegnon apparaît maintenant dans le dashboard admin → Webinaires.');
  await prisma.$disconnect();
}

main().catch((e) => { console.error('❌ Erreur :', e); prisma.$disconnect(); process.exit(1); });
