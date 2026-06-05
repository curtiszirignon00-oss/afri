/**
 * Script one-shot — Envoyer manuellement un email de confirmation de paiement pack.
 * Usage : npx ts-node src/scripts/send-payment-confirm-manual.ts
 */
import { sendWebinarPaymentConfirmEmail } from '../services/email.service';

async function main() {
  await sendWebinarPaymentConfirmEmail({
    email: 'mariofadegnon@gmail.com',
    firstName: 'Mario',
    webinarId: 'pack-parcours-investisseur',
    amount: '35000',
    currency: 'XOF',
  });
  console.log('✅ Email de confirmation envoyé à mariofadegnon@gmail.com');
}

main().catch((e) => { console.error('❌ Erreur :', e); process.exit(1); });
