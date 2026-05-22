import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

  const link = await (prisma as any).paymentLink.create({
    data: {
      token,
      planId: 'pack-parcours-investisseur',
      planName: 'Pack Parcours Investisseur BRVM',
      amount: 25000,
      currency: 'XOF',
      email: 'kouangawilliam92@gmail.com',
      firstName: 'William',
      note: 'Tarif spécial — 25 000 XOF au lieu de 35 000 XOF',
      expiresAt,
    },
  });

  const url = `https://www.africbourse.com/pay/${token}`;
  console.log('\n✅ Lien créé avec succès !');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔗 URL : ${url}`);
  console.log(`📧 Email : ${link.email}`);
  console.log(`💰 Montant : ${link.amount.toLocaleString('fr-FR')} XOF`);
  console.log(`⏰ Expire le : ${expiresAt.toLocaleDateString('fr-FR')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
