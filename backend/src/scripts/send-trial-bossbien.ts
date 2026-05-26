/**
 * Script : envoie un vrai email d'essai gratuit à bossbien1@gmail.com
 * avec un token persisté en base de données.
 *
 * Usage : npx tsx src/scripts/send-trial-bossbien.ts
 */

import { randomBytes } from 'crypto';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { sendTrialInviteEmail } from '../services/email.service';

dotenv.config();

const TARGET_EMAIL = 'bossbien1@gmail.com';

async function run() {
  const prisma = new PrismaClient();

  console.log('\n🚀 Envoi essai gratuit réel — AfriBourse');
  console.log('='.repeat(50));

  try {
    // 1. Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: TARGET_EMAIL },
      select: { id: true, name: true, email: true, subscriptionTier: true },
    });

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email : ${TARGET_EMAIL}`);
      console.log('   Vérifiez que cet utilisateur est bien inscrit sur AfriBourse.');
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé :`);
    console.log(`   ID   : ${user.id}`);
    console.log(`   Nom  : ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Tier : ${user.subscriptionTier}`);

    // 2. Supprimer tout trial non activé existant pour éviter les doublons
    const deleted = await (prisma as any).freeTrial.deleteMany({
      where: { userId: user.id, claimed: false },
    });
    if (deleted.count > 0) {
      console.log(`\n🗑️  ${deleted.count} ancien(s) token(s) non activé(s) supprimé(s)`);
    }

    // 3. Créer un nouveau token en base
    const token = randomBytes(32).toString('hex');
    const trialRecord = await (prisma as any).freeTrial.create({
      data: { userId: user.id, token },
    });

    console.log(`\n🔑 Token créé en base :`);
    console.log(`   ID    : ${trialRecord.id}`);
    console.log(`   Token : ${token.substring(0, 24)}...`);
    console.log(`\n🔗 Lien complet :`);
    console.log(`   ${process.env.FRONTEND_URL}/essai-gratuit?token=${token}`);

    // 4. Envoyer l'email
    console.log(`\n📤 Envoi de l'email...`);
    await sendTrialInviteEmail({ email: user.email, name: user.name ?? 'Membre', token });

    console.log('\n✅ Email envoyé avec succès !');
    console.log('='.repeat(50));
    console.log(`\n📬 Vérifiez la boîte : ${TARGET_EMAIL}`);
    console.log('   (regardez aussi les spams)\n');
    console.log('📝 Ce que le test devra valider :');
    console.log('   1. Email reçu avec le bon design');
    console.log('   2. Clic sur le bouton → page /essai-gratuit');
    console.log('   3. Si connecté → trial activé 14 jours');
    console.log('   4. Si non connecté → login → retour → trial activé');
    console.log('   5. Accès SIMBA + Conseiller Financier IA débloqué');

  } finally {
    await prisma.$disconnect();
  }
}

run().then(() => process.exit(0)).catch((err) => {
  console.error('💥 Erreur fatale :', err);
  process.exit(1);
});
