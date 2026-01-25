/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { sendConfirmationEmail } from '../services/email.service';
import { generateConfirmationToken, getTokenExpirationDate } from '../utils/token.utils';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Script pour renvoyer les emails à TOUS les utilisateurs non confirmés
 * Sans confirmation interactive - exécution directe
 */
async function resendAll() {
  console.log('\n📧 RENVOI AUTOMATIQUE DES EMAILS DE CONFIRMATION');
  console.log('='.repeat(80));

  try {
    // Trouver TOUS les utilisateurs où email_verified_at est NULL
    const unconfirmed = await prisma.user.findMany({
      where: {
        OR: [
          { email_verified_at: null },
          { email_verified_at: { equals: null } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        created_at: true,
        email_verified_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    console.log(`\n📊 Utilisateurs trouvés: ${unconfirmed.length}`);

    if (unconfirmed.length === 0) {
      console.log('\n✅ Aucun utilisateur non confirmé !');
      await prisma.$disconnect();
      return;
    }

    console.log('\n📋 Liste des utilisateurs:');
    console.log('-'.repeat(80));
    unconfirmed.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email} - ${user.name} ${user.lastname}`);
      console.log(`   Inscrit: ${new Date(user.created_at).toLocaleString('fr-FR')}`);
      console.log(`   Confirmé: ${user.email_verified_at ? 'OUI' : 'NON'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`🚀 Démarrage de l'envoi pour ${unconfirmed.length} utilisateurs...`);
    console.log('='.repeat(80));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < unconfirmed.length; i++) {
      const user = unconfirmed[i];
      const progress = `[${i + 1}/${unconfirmed.length}]`;

      try {
        console.log(`\n${progress} ${user.email}`);

        // Générer un nouveau token
        const confirmationToken = generateConfirmationToken();
        const tokenExpiration = getTokenExpirationDate(24);

        // Mettre à jour dans la base
        await prisma.user.update({
          where: { id: user.id },
          data: {
            email_confirmation_token: confirmationToken,
            email_confirmation_expires: tokenExpiration,
          },
        });

        console.log(`   → Token: ${confirmationToken.substring(0, 15)}...`);

        // Envoyer l'email
        await sendConfirmationEmail({
          email: user.email,
          name: user.name,
          confirmationToken,
        });

        console.log(`   ✅ Envoyé avec succès!`);
        successCount++;

        // Délai entre les envois
        if (i < unconfirmed.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error: any) {
        console.error(`   ❌ ERREUR: ${error.message}`);
        errorCount++;
      }
    }

    // Résumé
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(80));
    console.log(`Total:    ${unconfirmed.length}`);
    console.log(`✅ Succès: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📈 Taux: ${((successCount / unconfirmed.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(80));

    if (successCount > 0) {
      console.log('\n💡 IMPORTANT:');
      console.log('• Demandez aux utilisateurs de vérifier leur dossier SPAM');
      console.log('• Les liens expirent dans 24 heures');
      console.log(`• Frontend URL: ${process.env.FRONTEND_URL}`);
    }

  } catch (error) {
    console.error('\n💥 Erreur fatale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resendAll()
  .then(() => {
    console.log('\n👋 Terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur critique:', error);
    process.exit(1);
  });
