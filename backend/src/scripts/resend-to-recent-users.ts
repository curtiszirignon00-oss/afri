/// <reference types="node" />
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { sendConfirmationEmail } from '../services/email.service';
import { generateConfirmationToken, getTokenExpirationDate } from '../utils/token.utils';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Renvoyer les emails aux 30 derniers utilisateurs inscrits
 */
async function resendToRecent() {
  console.log('\n📧 RENVOI DES EMAILS AUX UTILISATEURS RÉCENTS');
  console.log('='.repeat(80));

  try {
    // Prendre les 30 derniers utilisateurs inscrits
    const recentUsers = await prisma.user.findMany({
      take: 30,
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        created_at: true,
        email_verified_at: true,
      },
    });

    console.log(`\n📊 ${recentUsers.length} utilisateurs récents trouvés\n`);

    // Filtrer ceux qui n'ont PAS confirmed (affiche comme NON confirmé)
    const needsConfirmation = recentUsers.filter(u => !u.email_verified_at);

    console.log(`📧 ${needsConfirmation.length} utilisateurs SANS confirmation\n`);

    if (needsConfirmation.length === 0) {
      console.log('✅ Tous les utilisateurs récents ont confirmé!');
      await prisma.$disconnect();
      return;
    }

    console.log('📋 Liste:');
    console.log('-'.repeat(80));
    needsConfirmation.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email} - ${user.name} ${user.lastname}`);
      console.log(`   Inscrit: ${new Date(user.created_at!).toLocaleString('fr-FR')}\n`);
    });

    console.log('='.repeat(80));
    console.log(`🚀 Envoi en cours pour ${needsConfirmation.length} utilisateurs...`);
    console.log('='.repeat(80));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < needsConfirmation.length; i++) {
      const user = needsConfirmation[i];
      const progress = `[${i + 1}/${needsConfirmation.length}]`;

      try {
        console.log(`\n${progress} ${user.email}`);

        // Générer token
        const confirmationToken = generateConfirmationToken();
        const tokenExpiration = getTokenExpirationDate(24);

        // Mettre à jour
        await prisma.user.update({
          where: { id: user.id },
          data: {
            email_confirmation_token: confirmationToken,
            email_confirmation_expires: tokenExpiration,
          },
        });

        // Envoyer
        await sendConfirmationEmail({
          email: user.email,
          name: user.name,
          confirmationToken,
        });

        console.log(`   ✅ Envoyé!`);
        successCount++;

        // Délai
        if (i < needsConfirmation.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 seconde
        }

      } catch (error: any) {
        console.error(`   ❌ ERREUR: ${error.message}`);
        errorCount++;
      }
    }

    // Résumé
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ FINAL');
    console.log('='.repeat(80));
    console.log(`Total traité:  ${needsConfirmation.length}`);
    console.log(`✅ Succès:      ${successCount}`);
    console.log(`❌ Erreurs:     ${errorCount}`);
    console.log(`📈 Taux:        ${((successCount / needsConfirmation.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(80));

    console.log('\n💡 ACTIONS IMPORTANTES:');
    console.log('1. Informez ces utilisateurs de vérifier leur dossier SPAM');
    console.log('2. Les liens expirent dans 24 heures');
    console.log(`3. URL frontend: ${process.env.FRONTEND_URL}`);
    console.log('4. Surveillez le dashboard Brevo pour la délivrabilité');

  } catch (error) {
    console.error('\n💥 Erreur fatale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resendToRecent()
  .then(() => {
    console.log('\n👋 Terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erreur critique:', error);
    process.exit(1);
  });
