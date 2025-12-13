// Script de test rapide de la connexion SMTP Brevo
// Usage: node test-smtp.js

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🧪 Test de connexion SMTP Brevo...\n');

// Afficher la configuration
console.log('📋 Configuration:');
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST}`);
console.log(`   SMTP_PORT: ${process.env.SMTP_PORT}`);
console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NON DÉFINI'}\n`);

// Créer le transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Ne pas échouer sur les certificats invalides
    // Note: Peut être nécessaire si un proxy/antivirus intercepte les connexions SSL
    rejectUnauthorized: false,
  },
});

// Test 1: Vérifier la connexion
console.log('🔌 Test 1: Vérification de la connexion SMTP...');
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erreur de connexion SMTP:', error.message);
    console.log('\n💡 Solutions possibles:');
    console.log('   1. Vérifiez vos identifiants dans .env');
    console.log('   2. Vérifiez que le port 587 n\'est pas bloqué');
    console.log('   3. Vérifiez votre connexion internet');
    process.exit(1);
  } else {
    console.log('✅ Connexion SMTP établie avec succès!\n');

    // Test 2: Demander si on veut envoyer un email de test
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('📧 Voulez-vous envoyer un email de test? (o/n): ', (answer) => {
      if (answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui') {
        readline.question('📮 Entrez votre adresse email: ', async (email) => {
          if (!email || !email.includes('@')) {
            console.log('❌ Adresse email invalide');
            readline.close();
            return;
          }

          console.log(`\n📤 Envoi d'un email de test à ${email}...`);

          try {
            await transporter.sendMail({
              from: `"AfriBourse Test" <${process.env.SMTP_USER}>`,
              to: email,
              subject: 'Test de configuration SMTP - AfriBourse',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .container { background: #f4f4f4; padding: 30px; border-radius: 10px; }
                    .success { color: #22c55e; font-size: 24px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1 class="success">✅ Configuration SMTP réussie!</h1>
                    <p>Votre configuration Brevo fonctionne parfaitement.</p>
                    <p><strong>Serveur:</strong> ${process.env.SMTP_HOST}</p>
                    <p><strong>Port:</strong> ${process.env.SMTP_PORT}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">
                      Cet email a été envoyé par le script de test SMTP d'AfriBourse.
                    </p>
                  </div>
                </body>
                </html>
              `,
              text: `✅ Configuration SMTP réussie!\n\nVotre configuration Brevo fonctionne parfaitement.\n\nServeur: ${process.env.SMTP_HOST}\nPort: ${process.env.SMTP_PORT}\nDate: ${new Date().toLocaleString()}`
            });

            console.log('✅ Email envoyé avec succès!');
            console.log('📬 Vérifiez votre boîte de réception (et le dossier spam)\n');
            console.log('🎉 Tout fonctionne! Le système de confirmation d\'email est opérationnel.');
          } catch (error) {
            console.error('❌ Erreur lors de l\'envoi:', error.message);
          }

          readline.close();
        });
      } else {
        console.log('\n✅ Test de connexion terminé avec succès!');
        console.log('🎉 Votre configuration SMTP est opérationnelle.');
        readline.close();
      }
    });
  }
});
