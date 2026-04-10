import { sendTrialInviteEmail } from '../services/email.service';
import { randomBytes } from 'crypto';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();
const TARGET_EMAIL = 'bossbien1@gmail.com';

async function run() {
  console.log('\n🧪 TEST EMAIL — Essai gratuit IA AfriBourse');
  console.log('='.repeat(55));

  // 1. Trouver l'utilisateur en base
  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    select: { id: true, name: true, email: true, subscriptionTier: true },
  });

  if (!user) {
    console.error(`❌ Aucun utilisateur trouvé avec l'email : ${TARGET_EMAIL}`);
    process.exit(1);
  }

  console.log(`✅ Utilisateur : ${user.name} (${user.email}) — tier: ${user.subscriptionTier}`);

  // 2. Supprimer les anciens tokens non activés
  const deleted = await (prisma as any).freeTrial.deleteMany({
    where: { userId: user.id, claimed: false },
  });
  if (deleted.count > 0) console.log(`🗑️  ${deleted.count} ancien(s) token(s) supprimé(s)`);

  // 3. Créer le token en base
  const token = randomBytes(32).toString('hex');
  await (prisma as any).freeTrial.create({ data: { userId: user.id, token } });

  console.log(`🔑 Token : ${token.substring(0, 24)}...`);
  console.log(`🔗 Lien  : ${process.env.FRONTEND_URL}/essai-gratuit?token=${token}`);
  console.log('\n📤 Envoi en cours...\n');

  // 4. Envoyer l'email
  await sendTrialInviteEmail({ email: user.email, name: user.name ?? 'Membre', token });

  console.log('✅ Email envoyé avec succès !');
  console.log(`👉 Vérifiez la boîte : ${TARGET_EMAIL} (regardez aussi les spams)`);
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error('❌ Échec :', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
