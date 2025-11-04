#!/usr/bin/env node
/**
 * Script de test de connexion MongoDB pour AfriBourse
 * Usage: node test-db-connection.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.DATABASE_URI;

async function testConnection() {
  console.log('🔍 Test de connexion MongoDB...\n');

  if (!uri) {
    console.error('❌ Erreur: DATABASE_URI n\'est pas défini dans le fichier .env');
    console.log('\n📝 Veuillez configurer DATABASE_URI dans /home/user/afri/backend/.env');
    console.log('\nExemples de configuration:');
    console.log('  - MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/afribourse');
    console.log('  - MongoDB Local: mongodb://localhost:27017/afribourse');
    process.exit(1);
  }

  console.log(`📌 URI de connexion: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
  console.log('');

  const client = new MongoClient(uri);

  try {
    // Tenter la connexion
    console.log('⏳ Connexion en cours...');
    await client.connect();

    console.log('✅ Connexion réussie à MongoDB!');

    // Tester l'accès à la base de données
    const db = client.db();
    console.log(`📦 Base de données: ${db.databaseName}`);

    // Lister les collections
    const collections = await db.listCollections().toArray();
    console.log(`📚 Nombre de collections: ${collections.length}`);

    if (collections.length > 0) {
      console.log('\nCollections disponibles:');
      collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }

    // Test d'écriture/lecture simple
    console.log('\n🧪 Test d\'écriture/lecture...');
    const testCollection = db.collection('_connection_test');
    const testDoc = { test: true, timestamp: new Date() };

    await testCollection.insertOne(testDoc);
    console.log('✅ Écriture réussie');

    const found = await testCollection.findOne({ test: true });
    console.log('✅ Lecture réussie');

    // Nettoyage
    await testCollection.deleteOne({ test: true });
    console.log('✅ Suppression réussie');

    console.log('\n🎉 Tous les tests de connexion ont réussi!');
    console.log('\n📝 Prochaines étapes:');
    console.log('  1. Générer le client Prisma: npx prisma generate');
    console.log('  2. Synchroniser le schéma: npx prisma db push');
    console.log('  3. Démarrer l\'application: npm run dev');

  } catch (error) {
    console.error('\n❌ Erreur de connexion MongoDB:');
    console.error(`   ${error.message}`);

    if (error.message.includes('bad auth')) {
      console.log('\n💡 Solutions possibles:');
      console.log('  1. Vérifiez votre nom d\'utilisateur et mot de passe');
      console.log('  2. Assurez-vous que l\'utilisateur existe dans MongoDB Atlas');
      console.log('  3. Encodez les caractères spéciaux dans le mot de passe:');
      console.log('     @ → %40, : → %3A, / → %2F');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Solutions possibles:');
      console.log('  1. MongoDB n\'est pas démarré (pour installation locale)');
      console.log('  2. Vérifiez l\'URL de connexion');
      console.log('  3. Utilisez MongoDB Atlas si vous n\'avez pas MongoDB installé localement');
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.log('\n💡 Solutions possibles:');
      console.log('  1. Allez dans MongoDB Atlas → Network Access');
      console.log('  2. Ajoutez votre adresse IP ou utilisez 0.0.0.0/0 (dev uniquement)');
    }

    console.log('\n📖 Consultez le guide: /home/user/afri/backend/GUIDE-MONGODB-SETUP.md');
    process.exit(1);

  } finally {
    await client.close();
  }
}

// Exécuter le test
testConnection().catch(console.error);
