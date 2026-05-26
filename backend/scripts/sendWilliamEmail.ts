import * as dotenv from 'dotenv';
dotenv.config();

import { sendWebinarPaymentConfirmEmail } from '../src/services/email.service';

async function main() {
  console.log('Envoi email confirmation à William...');
  await sendWebinarPaymentConfirmEmail({
    email: 'kouangawilliam92@gmail.com',
    firstName: 'William',
    webinarId: 'pack-parcours-investisseur',
    amount: '25000',
    currency: 'XAF',
  });
  console.log('✅ Email envoyé à kouangawilliam92@gmail.com');
}

main().catch(e => { console.error('❌ Erreur:', e.message); process.exit(1); });
