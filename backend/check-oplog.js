// Script pour vérifier l'oplog MongoDB
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkOplog() {
    const uri = process.env.DATABASE_URI;

    if (!uri) {
        console.log('DATABASE_URI non trouvée dans .env');
        return;
    }

    console.log('Connexion à MongoDB...');
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connecté!');

        // Essayer d'accéder à la base local (contient l'oplog)
        const localDb = client.db('local');

        // Lister les collections disponibles dans 'local'
        console.log('\n--- Vérification accès oplog ---');
        try {
            const collections = await localDb.listCollections().toArray();
            console.log('Collections dans "local":', collections.map(c => c.name));

            if (collections.some(c => c.name === 'oplog.rs')) {
                const oplog = localDb.collection('oplog.rs');
                const count = await oplog.estimatedDocumentCount();
                console.log('Nombre d\'entrées oplog:', count);

                // Chercher les dernières opérations de suppression
                const deletions = await oplog.find({
                    op: 'd', // delete operations
                }).sort({ ts: -1 }).limit(10).toArray();

                console.log('Suppressions récentes trouvées:', deletions.length);
                if (deletions.length > 0) {
                    console.log('Première suppression:', JSON.stringify(deletions[0], null, 2));
                }
            } else {
                console.log('oplog.rs non trouvé dans les collections');
            }
        } catch (e) {
            console.log('Erreur accès oplog:', e.message);
            console.log('\n⚠️ L\'accès à l\'oplog est probablement restreint sur MongoDB Atlas M0 (gratuit)');
        }

    } catch (error) {
        console.log('Erreur de connexion:', error.message);
    } finally {
        await client.close();
        console.log('\nDéconnecté.');
    }
}

checkOplog();
