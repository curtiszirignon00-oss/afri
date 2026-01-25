/// <reference types="node" />
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

/**
 * Script de test SMTP spécifique pour Render
 * À exécuter directement sur Render Shell ou en local
 */

console.log('🔍 DIAGNOSTIC SMTP - RENDER');
console.log('='.repeat(70));
console.log('');

// 1. Afficher les variables d'environnement
console.log('📋 ÉTAPE 1 : Vérification des Variables d\'Environnement');
console.log('-'.repeat(70));

const requiredVars = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM_EMAIL',
  'SMTP_FROM_NAME',
];

let allVarsPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value === 'undefined') {
    console.log(`❌ ${varName} : MANQUANT`);
    allVarsPresent = false;
  } else {
    // Masquer les mots de passe
    if (varName === 'SMTP_PASS') {
      console.log(`✅ ${varName} : ${'*'.repeat(20)} (masqué)`);
    } else {
      console.log(`✅ ${varName} : ${value}`);
    }
  }
});

console.log('');

if (!allVarsPresent) {
  console.log('❌ ERREUR : Des variables d\'environnement sont manquantes !');
  console.log('');
  console.log('🔧 SOLUTION :');
  console.log('   1. Sur Render Dashboard → Environment → Environment Variables');
  console.log('   2. Ajoutez toutes les variables manquantes');
  console.log('   3. Cliquez sur "Save Changes"');
  console.log('   4. Attendez le redéploiement automatique (3-5 min)');
  console.log('   5. Relancez ce script');
  console.log('');
  process.exit(1);
}

console.log('✅ Toutes les variables d\'environnement sont présentes\n');

// 2. Test de configuration du transporter
console.log('📋 ÉTAPE 2 : Configuration du Transporter Nodemailer');
console.log('-'.repeat(70));

const port = parseInt(process.env.SMTP_PORT!, 10);
const isPort465 = port === 465;

console.log(`   Port SMTP : ${port}`);
console.log(`   Mode sécurisé : ${isPort465 ? 'true (SSL)' : 'false (TLS)'}`);
console.log('');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: port,
  secure: isPort465, // true pour 465, false pour 587
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
  tls: {
    rejectUnauthorized: false,
  },
  // Timeout plus long pour Render
  connectionTimeout: 10000, // 10 secondes
  greetingTimeout: 10000,
});

console.log('✅ Transporter configuré\n');

// 3. Test de connexion
console.log('📋 ÉTAPE 3 : Test de Connexion au Serveur SMTP');
console.log('-'.repeat(70));

try {
  console.log(`   Connexion à ${process.env.SMTP_HOST}:${port}...`);

  await transporter.verify();

  console.log('✅ Connexion SMTP réussie !');
  console.log('   Le serveur SMTP est accessible depuis Render.\n');
} catch (error: any) {
  console.error('❌ Échec de la connexion SMTP\n');
  console.error('📊 Détails de l\'erreur :');
  console.error(`   Type : ${error.name || 'Unknown'}`);
  console.error(`   Message : ${error.message || 'Aucun message'}`);
  console.error(`   Code : ${error.code || 'N/A'}`);
  console.error('');

  // Diagnostic selon le type d'erreur
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
    console.error('🔍 DIAGNOSTIC :');
    console.error('   Le port 587 est probablement BLOQUÉ par Render Free Tier.');
    console.error('');
    console.error('🔧 SOLUTION :');
    console.error('   Option 1 (RECOMMANDÉ) : Utiliser le port 465 (SSL)');
    console.error('     1. Sur Render, changez SMTP_PORT de "587" à "465"');
    console.error('     2. Sauvegardez et attendez le redéploiement');
    console.error('     3. Relancez ce script');
    console.error('');
    console.error('   Option 2 : Passer au plan Render Paid (7$/mois)');
    console.error('     Le plan payant n\'a pas de restrictions de ports.');
    console.error('');
  } else if (error.code === 'EAUTH' || error.responseCode === 535) {
    console.error('🔍 DIAGNOSTIC :');
    console.error('   Les identifiants SMTP sont INVALIDES.');
    console.error('');
    console.error('🔧 SOLUTION :');
    console.error('   1. Allez sur https://app.brevo.com');
    console.error('   2. Settings → SMTP & API');
    console.error('   3. Vérifiez SMTP_USER et régénérez SMTP_PASS si nécessaire');
    console.error('   4. Mettez à jour les variables sur Render');
    console.error('');
  } else {
    console.error('🔧 SOLUTION :');
    console.error('   1. Vérifiez que toutes les variables SMTP sont correctes sur Render');
    console.error('   2. Assurez-vous que le service a été redéployé après les modifications');
    console.error('   3. Si le problème persiste, essayez le port 465 au lieu de 587');
    console.error('');
  }

  process.exit(1);
}

// 4. Test d'envoi d'email
console.log('📋 ÉTAPE 4 : Test d\'Envoi d\'Email Réel');
console.log('-'.repeat(70));

const testEmail = process.env.TEST_EMAIL || 'test@example.com';

console.log(`   Envoi d'un email de test à : ${testEmail}`);
console.log(`   Expéditeur : "${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`);
console.log('');

try {
  const info = await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: testEmail,
    subject: '✅ Test SMTP Render - AfriBourse',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; }
          .container { background-color: #ffffff; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
          h1 { color: #f97316; }
          .success { background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
          .info { background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Test SMTP Réussi !</h1>

          <div class="success">
            <p><strong>Félicitations !</strong></p>
            <p>Si vous recevez cet email, cela signifie que la configuration SMTP sur Render fonctionne parfaitement.</p>
          </div>

          <div class="info">
            <p><strong>Informations techniques :</strong></p>
            <ul>
              <li><strong>Serveur SMTP :</strong> ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}</li>
              <li><strong>Mode :</strong> ${isPort465 ? 'SSL (Port 465)' : 'TLS (Port 587)'}</li>
              <li><strong>Expéditeur :</strong> ${process.env.SMTP_FROM_EMAIL}</li>
              <li><strong>Date d'envoi :</strong> ${new Date().toLocaleString('fr-FR')}</li>
            </ul>
          </div>

          <p>Les emails d'inscription devraient maintenant s'envoyer automatiquement sur votre plateforme AfriBourse ! 🚀</p>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            Cet email a été envoyé par le script de test SMTP Render<br>
            AfriBourse - Plateforme d'apprentissage boursier
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
✅ Test SMTP Réussi !

Félicitations ! Si vous recevez cet email, cela signifie que la configuration SMTP sur Render fonctionne parfaitement.

Informations techniques :
- Serveur SMTP : ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}
- Mode : ${isPort465 ? 'SSL (Port 465)' : 'TLS (Port 587)'}
- Expéditeur : ${process.env.SMTP_FROM_EMAIL}
- Date d'envoi : ${new Date().toLocaleString('fr-FR')}

Les emails d'inscription devraient maintenant s'envoyer automatiquement sur votre plateforme AfriBourse ! 🚀

AfriBourse - Plateforme d'apprentissage boursier
    `,
  });

  console.log('✅ Email de test envoyé avec succès !\n');
  console.log('📊 Détails de l\'envoi :');
  console.log(`   Message ID : ${info.messageId}`);
  console.log(`   Response : ${info.response}`);
  console.log(`   Accepted : ${info.accepted?.join(', ') || 'N/A'}`);
  console.log(`   Rejected : ${info.rejected?.join(', ') || 'Aucun'}`);
  console.log('');

  console.log('📧 Vérification :');
  console.log(`   1. Vérifiez la boîte email : ${testEmail}`);
  console.log('   2. Vérifiez aussi le dossier SPAM');
  console.log('   3. Vérifiez les statistiques Brevo : https://app.brevo.com');
  console.log('');

} catch (error: any) {
  console.error('❌ Échec de l\'envoi de l\'email\n');
  console.error('📊 Détails de l\'erreur :');
  console.error(`   Type : ${error.name || 'Unknown'}`);
  console.error(`   Message : ${error.message || 'Aucun message'}`);
  console.error(`   Code : ${error.code || 'N/A'}`);

  if (error.responseCode) {
    console.error(`   Response Code : ${error.responseCode}`);
  }

  if (error.response) {
    console.error(`   SMTP Response : ${error.response}`);
  }

  console.error('');

  // Diagnostic selon le type d'erreur
  if (error.responseCode === 554 || error.message?.includes('Sender address rejected')) {
    console.error('🔍 DIAGNOSTIC :');
    console.error(`   L'adresse expéditeur "${process.env.SMTP_FROM_EMAIL}" n'est pas vérifiée dans Brevo.`);
    console.error('');
    console.error('🔧 SOLUTION RAPIDE :');
    console.error('   Sur Render, changez SMTP_FROM_EMAIL en :');
    console.error(`   "${process.env.SMTP_USER}"`);
    console.error('   (C\'est l\'email Brevo par défaut qui est toujours autorisé)');
    console.error('');
    console.error('🔧 SOLUTION DÉFINITIVE :');
    console.error('   1. Allez sur https://app.brevo.com');
    console.error('   2. Senders, Domains & Dedicated IPs → Senders');
    console.error('   3. Ajoutez et vérifiez noreply@africbourse.com');
    console.error('');
  }

  process.exit(1);
}

// 5. Résumé final
console.log('='.repeat(70));
console.log('🎉 TOUS LES TESTS SONT RÉUSSIS !');
console.log('='.repeat(70));
console.log('');
console.log('✅ Variables d\'environnement : OK');
console.log('✅ Connexion SMTP : OK');
console.log('✅ Envoi d\'email : OK');
console.log('');
console.log('🚀 Votre configuration SMTP sur Render est OPÉRATIONNELLE !');
console.log('');
console.log('📝 Prochaines étapes :');
console.log('   1. Testez une inscription depuis le frontend : https://www.africbourse.com/inscription');
console.log('   2. Surveillez les logs Render pendant l\'inscription');
console.log('   3. Vérifiez que l\'email de confirmation arrive bien');
console.log('');
console.log('💡 Si les emails d\'inscription ne s\'envoient toujours pas :');
console.log('   - Vérifiez que le code backend sur Render est à jour (dernier commit)');
console.log('   - Assurez-vous que le frontend appelle la bonne URL backend');
console.log('   - Consultez DIAGNOSTIC-RENDER.md pour plus d\'aide');
console.log('');

process.exit(0);
