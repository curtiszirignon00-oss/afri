/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

dotenv.config();

const prisma = new PrismaClient();

async function check() {
  const email = 'arisadedjouma@gmail.com';
  console.log(`\n🔍 Investigation de: ${email}`);
  console.log('='.repeat(70));

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      learningProgress: {
        include: { module: { select: { title: true, slug: true } } },
        orderBy: { last_accessed_at: 'desc' },
        take: 5,
      },
    },
  });

  if (!user) {
    console.log('❌ Utilisateur NON trouvé en base de données');
    console.log('   → Le compte nexiste pas ou lemail est différent');
    await prisma.$disconnect();
    return;
  }

  console.log('\n✅ Utilisateur trouvé:');
  console.log(`   ID:               ${user.id}`);
  console.log(`   Email:            ${user.email}`);
  console.log(`   Nom:              ${user.name} ${user.lastname}`);
  console.log(`   Rôle:             ${user.role}`);
  console.log(`   Abonnement:       ${user.subscriptionTier}`);
  console.log(`   Inscrit le:       ${new Date(user.created_at!).toLocaleString('fr-FR')}`);
  console.log(`   Email vérifié:    ${user.email_verified_at ? 'OUI ✅ (' + new Date(user.email_verified_at).toLocaleString('fr-FR') + ')' : 'NON ❌'}`);
  console.log(`   Token confirm.:   ${user.email_confirmation_token ? user.email_confirmation_token.substring(0, 20) + '...' : 'AUCUN'}`);

  if (user.email_confirmation_expires) {
    const expires = new Date(user.email_confirmation_expires);
    const now = new Date();
    console.log(`   Token expire:     ${expires.toLocaleString('fr-FR')} ${expires < now ? '⏰ EXPIRÉ' : '✅ Valide'}`);
  }

  // --- Analyse de l'état auth ---
  console.log('\n📋 Analyse auth:');
  console.log('-'.repeat(70));

  if (!user.email_verified_at) {
    console.log('🔴 PROBLÈME: Email NON vérifié → login bloqué (require confirmation)');
  } else {
    console.log('✅ Email vérifié → connexion possible');
  }

  // --- Générer un nouveau JWT valide pour tester ---
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  const testToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: '7d' }
  );

  // --- Vérifier que le JWT est décodable ---
  try {
    const decoded = jwt.verify(testToken, secret) as any;
    console.log(`✅ JWT vérifiable: exp=${new Date(decoded.exp * 1000).toLocaleString('fr-FR')}`);
  } catch (e: any) {
    console.log(`❌ Erreur JWT: ${e.message}`);
  }

  // --- Progression quiz ---
  const progress = (user as any).learningProgress;
  console.log('\n📚 Progression quizzes (5 derniers modules):');
  console.log('-'.repeat(70));
  if (!progress || progress.length === 0) {
    console.log('   Aucune progression enregistrée');
  } else {
    for (const p of progress) {
      console.log(`   Module: ${p.module.title}`);
      console.log(`     - Score quiz:    ${p.quiz_score ?? 'aucun'}`);
      console.log(`     - Tentatives:    ${p.quiz_attempts}`);
      console.log(`     - Dernier essai: ${p.last_quiz_attempt_at ? new Date(p.last_quiz_attempt_at).toLocaleString('fr-FR') : 'jamais'}`);
      console.log(`     - Complété:      ${p.is_completed ? 'OUI ✅' : 'NON'}`);
      console.log('');
    }
  }

  await prisma.$disconnect();
}

check()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
