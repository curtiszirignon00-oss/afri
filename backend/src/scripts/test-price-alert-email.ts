/// <reference types="node" />
// Script pour tester l'envoi d'email d'alerte de prix
import { sendPriceAlertEmail } from '../services/email.service';
import * as fs from 'fs';
import * as path from 'path';
import config from '../config/environnement';

async function testPriceAlertEmail() {
  console.log('📧 Test d\'envoi d\'email d\'alerte de prix\n');
  console.log('='.repeat(50));

  // Données de test
  const testData = {
    email: 'test@example.com', // Remplacez par votre email pour tester
    name: 'Jean Kouadio',
    stockTicker: 'SIVC',
    alertType: 'ABOVE' as 'ABOVE' | 'BELOW',
    targetPrice: 1250,
    currentPrice: 1280,
  };

  console.log('\n📋 Données de test:');
  console.log(`   → Email: ${testData.email}`);
  console.log(`   → Nom: ${testData.name}`);
  console.log(`   → Action: ${testData.stockTicker}`);
  console.log(`   → Type: ${testData.alertType === 'ABOVE' ? 'Au-dessus' : 'En-dessous'}`);
  console.log(`   → Prix cible: ${testData.targetPrice.toLocaleString('fr-FR')} FCFA`);
  console.log(`   → Prix actuel: ${testData.currentPrice.toLocaleString('fr-FR')} FCFA`);

  // Générer le HTML pour visualisation
  const alertTypeText = testData.alertType === 'ABOVE' ? 'dépassé' : 'descendu sous';
  const displayName = testData.name || 'Investisseur';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Alerte Prix - ${testData.stockTicker} - AfriBourse</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .logo-text {
          font-size: 32px;
          font-weight: bold;
          color: #f97316;
          margin: 0;
        }
        h1 {
          color: #1f2937;
          font-size: 24px;
          margin-bottom: 20px;
        }
        p {
          color: #4b5563;
          margin-bottom: 15px;
        }
        .alert-box {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          padding: 25px;
          border-radius: 12px;
          margin: 30px 0;
          text-align: center;
        }
        .alert-box h2 {
          margin: 0 0 15px 0;
          font-size: 28px;
          color: white;
        }
        .price-info {
          display: flex;
          justify-content: space-around;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .price-item {
          background-color: rgba(255,255,255,0.2);
          padding: 15px 20px;
          border-radius: 8px;
          margin: 5px;
          min-width: 120px;
        }
        .price-label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 5px;
        }
        .price-value {
          font-size: 20px;
          font-weight: bold;
        }
        .button {
          display: inline-block;
          padding: 15px 30px;
          background-color: #f97316;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .button:hover {
          background-color: #ea580c;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        .info-box {
          background-color: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box p {
          margin: 0;
          color: #1e40af;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-container">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M17 6H23V12" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h2 class="logo-text">AfriBourse</h2>
          </div>
        </div>

        <h1>🔔 Alerte Prix Déclenchée</h1>

        <p>Bonjour ${displayName},</p>

        <p>Votre alerte de prix pour <strong>${testData.stockTicker}</strong> a été déclenchée !</p>

        <div class="alert-box">
          <h2>${testData.stockTicker}</h2>
          <p style="margin: 0; font-size: 18px;">Le prix a ${alertTypeText} votre seuil cible</p>

          <div class="price-info">
            <div class="price-item">
              <div class="price-label">Prix Cible</div>
              <div class="price-value">${testData.targetPrice.toLocaleString('fr-FR')} FCFA</div>
            </div>
            <div class="price-item">
              <div class="price-label">Prix Actuel</div>
              <div class="price-value">${testData.currentPrice.toLocaleString('fr-FR')} FCFA</div>
            </div>
          </div>
        </div>

        <div class="info-box">
          <p><strong>ℹ️ Information :</strong> Cette alerte a été automatiquement désactivée. Vous pouvez la réactiver depuis votre tableau de bord si vous souhaitez continuer à surveiller ce prix.</p>
        </div>

        <p>Consultez les détails complets de l'action et décidez de votre stratégie d'investissement :</p>

        <div style="text-align: center;">
          <a href="${config.app.frontendUrl}/stocks/${testData.stockTicker}" class="button">Voir ${testData.stockTicker}</a>
        </div>

        <div class="footer">
          <p>Cet email a été envoyé par AfriBourse - Système d'alertes de prix</p>
          <p>Si vous ne souhaitez plus recevoir ces alertes, vous pouvez les désactiver depuis votre profil.</p>
          <p>Questions ? Contactez-nous à contact@africbourse.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Sauvegarder le HTML dans un fichier pour visualisation
  const previewPath = path.join(__dirname, '../../preview-price-alert-email.html');
  fs.writeFileSync(previewPath, htmlContent);
  console.log(`\n📄 Aperçu HTML sauvegardé dans: ${previewPath}`);
  console.log('   → Ouvrez ce fichier dans un navigateur pour voir le rendu');

  // Version texte
  const textContent = `
    Alerte Prix - ${testData.stockTicker} - AfriBourse

    Bonjour ${displayName},

    Votre alerte de prix pour ${testData.stockTicker} a été déclenchée !

    Le prix a ${alertTypeText} votre seuil cible.

    Prix Cible: ${testData.targetPrice.toLocaleString('fr-FR')} FCFA
    Prix Actuel: ${testData.currentPrice.toLocaleString('fr-FR')} FCFA

    Cette alerte a été automatiquement désactivée. Vous pouvez la réactiver depuis votre tableau de bord.

    Consultez les détails: ${config.app.frontendUrl}/stocks/${testData.stockTicker}

    AfriBourse - Votre plateforme d'apprentissage boursier
  `;

  console.log('\n📝 Version texte de l\'email:');
  console.log('='.repeat(50));
  console.log(textContent);
  console.log('='.repeat(50));

  // Tentative d'envoi réel (commenté par défaut)
  console.log('\n⚠️  Pour envoyer un vrai email, décommentez le code ci-dessous');
  console.log('   et remplacez test@example.com par votre adresse email réelle\n');

  /*
  try {
    console.log('\n📤 Envoi de l\'email de test...');
    await sendPriceAlertEmail(testData);
    console.log('✅ Email envoyé avec succès!');
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi:', error.message);
  }
  */

  console.log('\n✅ Test terminé!');
}

// Exécuter le test
testPriceAlertEmail()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
