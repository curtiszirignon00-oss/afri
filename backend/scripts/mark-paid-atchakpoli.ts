import { PrismaClient } from '@prisma/client';
import { sendWebinarPaymentConfirmEmail } from '../src/services/email.service';

const prisma = new PrismaClient();
const TARGET_EMAIL = 'atchakpolisalomon@gmail.com';

async function main() {
  // Trouver toutes les inscriptions de cet email
  const registrations = await prisma.webinarRegistration.findMany({
    where: { email: TARGET_EMAIL },
    orderBy: { created_at: 'desc' },
  });

  if (registrations.length === 0) {
    console.log(`❌ Aucune inscription trouvée pour ${TARGET_EMAIL}`);
    return;
  }

  console.log(`\nInscriptions trouvées pour ${TARGET_EMAIL}:`);
  registrations.forEach((r, i) => {
    console.log(`  [${i}] id=${r.id} | webinarId=${r.webinarId} | status=${r.paymentStatus} | créé=${r.created_at}`);
  });

  // Traiter toutes les inscriptions non payées
  const unpaid = registrations.filter(r => r.paymentStatus !== 'paid');

  if (unpaid.length === 0) {
    console.log('\n✅ Toutes les inscriptions sont déjà marquées comme payées.');
    return;
  }

  for (const reg of unpaid) {
    // Déterminer le montant selon le webinaire
    const AMOUNTS: Record<string, string> = {
      'w1-fondamentaux-juin':    '10000',
      'w2-fondamentale-juin':    '20000',
      'w3-technique-juin':       '20000',
      'pack-parcours-investisseur': '35000',
      'w1-fondamentaux':         '10000',
      'w2-fondamentale':         '20000',
      'w3-technique':            '20000',
    };
    const amount = AMOUNTS[reg.webinarId] ?? '10000';

    // Marquer comme payé en DB
    await prisma.webinarRegistration.update({
      where: { id: reg.id },
      data: { paymentStatus: 'paid', paidAt: new Date() },
    });
    console.log(`\n✅ [${reg.webinarId}] Marqué comme payé`);

    // Envoyer le mail de confirmation de paiement
    await sendWebinarPaymentConfirmEmail({
      email: reg.email,
      firstName: reg.firstName ?? '',
      webinarId: reg.webinarId,
      amount,
      currency: 'XOF',
    });
    console.log(`📧 Mail de confirmation envoyé à ${reg.email} pour ${reg.webinarId}`);
  }

  console.log('\n✅ Terminé.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
