/// <reference types="node" />
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

/**
 * Script de test de la connexion SMTP
 * Usage: npx tsx src/scripts/test-smtp.ts
 */

async function testSMTPConnection() {
  console.log('\n🔍 TEST DE CONNEXION SMTP');
  console.log('='.repeat(60));

  // 1. Vérifier les variables d'environnement
  console.log('\n📋 Configuration SMTP:');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log(`   Pass: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NON DÉFINI'}`);
  console.log(`   From: ${process.env.SMTP_FROM_EMAIL}`);
  console.log(`   From Name: ${process.env.SMTP_FROM_NAME}`);

  // 2. Vérifier que toutes les variables sont définies
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('\n❌ Variables d\'environnement manquantes:', missingVars.join(', '));
    process.exit(1);
  }

  // 3. Créer le transporteur
  console.log('\n🔧 Création du transporteur nodemailer...');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT!, 10),
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    debug: true, // Active les logs détaillés
    logger: true, // Active le logger
  });

  // 4. Vérifier la connexion
  console.log('\n🔌 Test de connexion au serveur SMTP...');
  try {
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie!');
  } catch (error) {
    console.error('❌ Échec de la connexion SMTP:', error);
    process.exit(1);
  }

  // 5. Envoyer un email de test
  console.log('\n📧 Envoi d\'un email de test...');
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: process.env.SMTP_USER, // Envoyer à soi-même pour le test
      subject: 'Test SMTP - AfriBourse',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f97316;">Test SMTP - AfriBourse</h1>
          <p>Ceci est un email de test envoyé le ${new Date().toLocaleString('fr-FR')}.</p>
          <p>Si vous recevez cet email, la configuration SMTP fonctionne correctement! ✅</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Configuration:<br>
            • Host: ${process.env.SMTP_HOST}<br>
            • Port: ${process.env.SMTP_PORT}<br>
            • User: ${process.env.SMTP_USER}<br>
            • From: ${process.env.SMTP_FROM_EMAIL}
          </p>
        </div>
      `,
      text: `Test SMTP - AfriBourse\n\nCeci est un email de test.\nConfiguration: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`,
    });

    console.log('✅ Email de test envoyé avec succès!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
  } catch (error) {
    console.error('❌ Échec de l\'envoi de l\'email:', error);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ TOUS LES TESTS RÉUSSIS!');
  console.log('='.repeat(60) + '\n');
}

// Exécuter le test
testSMTPConnection()
  .then(() => {
    console.log('👍 Test terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
