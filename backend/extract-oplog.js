// Script pour extraire toutes les données de l'oplog MongoDB
const { MongoClient } = require('mongodb');
const fs = require('fs');
require('dotenv').config();

async function extractFromOplog() {
    const uri = process.env.DATABASE_URI;

    if (!uri) {
        console.log('DATABASE_URI non trouvée dans .env');
        return;
    }

    console.log('Connexion à MongoDB...');
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connecté!\n');

        const localDb = client.db('local');
        const oplog = localDb.collection('oplog.rs');

        console.log('=== Extraction de TOUTES les entrées oplog ===\n');

        // Récupérer TOUTES les entrées de l'oplog
        const allEntries = await oplog.find({}).sort({ ts: 1 }).toArray();
        console.log('Total entrées trouvées:', allEntries.length);

        // Grouper par type d'opération
        const byOperation = {};
        allEntries.forEach(entry => {
            const op = entry.op;
            if (!byOperation[op]) byOperation[op] = [];
            byOperation[op].push(entry);
        });

        console.log('\n--- Par type d\'opération ---');
        Object.keys(byOperation).forEach(op => {
            const opName = op === 'i' ? 'INSERT' : op === 'd' ? 'DELETE' : op === 'u' ? 'UPDATE' : op === 'n' ? 'NOOP' : op === 'c' ? 'COMMAND' : op;
            console.log(`${opName}: ${byOperation[op].length} entrées`);
        });

        // Grouper par namespace (collection)
        const byNamespace = {};
        allEntries.forEach(entry => {
            const ns = entry.ns || 'unknown';
            if (!byNamespace[ns]) byNamespace[ns] = [];
            byNamespace[ns].push(entry);
        });

        console.log('\n--- Par collection ---');
        Object.keys(byNamespace).forEach(ns => {
            console.log(`${ns}: ${byNamespace[ns].length} entrées`);
        });

        // Extraire les INSERTIONS - ce sont les données qu'on peut récupérer
        const insertions = byOperation['i'] || [];
        console.log('\n=== INSERTIONS RÉCUPÉRABLES ===');
        console.log('Total insertions:', insertions.length);

        // Regrouper les insertions par collection
        const insertsByCollection = {};
        insertions.forEach(entry => {
            const ns = entry.ns || 'unknown';
            if (!insertsByCollection[ns]) insertsByCollection[ns] = [];
            // L'objet inséré est dans entry.o
            if (entry.o) {
                insertsByCollection[ns].push(entry.o);
            }
        });

        // Sauvegarder les données récupérées
        const recoveredData = {
            extractionDate: new Date().toISOString(),
            totalOperations: allEntries.length,
            summary: {
                inserts: insertions.length,
                byCollection: {}
            },
            data: insertsByCollection
        };

        Object.keys(insertsByCollection).forEach(ns => {
            recoveredData.summary.byCollection[ns] = insertsByCollection[ns].length;
        });

        // Écrire dans un fichier JSON
        const outputPath = './oplog-recovery.json';
        fs.writeFileSync(outputPath, JSON.stringify(recoveredData, null, 2));
        console.log(`\n✅ Données sauvegardées dans: ${outputPath}`);

        // Afficher un aperçu des données récupérées
        console.log('\n=== APERÇU DES DONNÉES RÉCUPÉRÉES ===');
        Object.keys(insertsByCollection).forEach(ns => {
            console.log(`\n📁 ${ns} (${insertsByCollection[ns].length} documents):`);
            // Afficher les 2 premiers documents de chaque collection
            insertsByCollection[ns].slice(0, 2).forEach((doc, i) => {
                console.log(`  Document ${i + 1}:`, JSON.stringify(doc, null, 2).substring(0, 200) + '...');
            });
        });

    } catch (error) {
        console.log('Erreur:', error.message);
    } finally {
        await client.close();
        console.log('\nDéconnecté.');
    }
}

extractFromOplog();
