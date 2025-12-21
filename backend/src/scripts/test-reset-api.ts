/**
 * Script pour tester l'API de réinitialisation de mot de passe
 * Simule exactement ce que fait le frontend
 */

import axios from 'axios';

async function testPasswordResetAPI() {
  const email = process.argv[2] || 'essiomle.ks@gmail.com'; // Email par défaut

  console.log(`🧪 Test de l'API de réinitialisation de mot de passe`);
  console.log(`📧 Email: ${email}\n`);

  try {
    console.log('📤 Envoi de la requête POST /api/request-password-reset...');

    const response = await axios.post(
      'http://localhost:3001/api/request-password-reset',
      { email },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true, // Accepter tous les status codes
      }
    );

    console.log(`\n📥 Réponse reçue:`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log(`\n✅ Succès! L'email devrait être envoyé.`);
    } else {
      console.log(`\n❌ Erreur ${response.status}`);
      console.log(`   Message: ${response.data.error || response.data.message}`);
    }
  } catch (error: any) {
    console.error('\n❌ Erreur lors de la requête:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    } else if (error.request) {
      console.error('   Pas de réponse du serveur');
    } else {
      console.error(`   ${error.message}`);
    }
  }
}

testPasswordResetAPI();
