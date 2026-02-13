// check-server.js
// Script simple pour vérifier que le serveur backend démarre

const http = require('http');

console.log('🔍 Vérification du serveur backend...\n');

// Fonction pour tester un endpoint
function testEndpoint(path, description) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            if (res.statusCode === 200 || res.statusCode === 401) {
                console.log(`✅ ${description}: OK (${res.statusCode})`);
                resolve(true);
            } else {
                console.log(`⚠️  ${description}: ${res.statusCode}`);
                resolve(false);
            }
        });

        req.on('error', (error) => {
            console.log(`❌ ${description}: ${error.message}`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log(`⏱️  ${description}: Timeout`);
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

async function checkServer() {
    console.log('📍 Test 1: Serveur backend accessible');
    const test1 = await testEndpoint('/api/stocks', 'GET /api/stocks');

    console.log('\n📍 Test 2: Routes d\'onboarding');
    const test2 = await testEndpoint('/api/investor-profile/onboarding/status', 'GET /api/investor-profile/onboarding/status');

    console.log('\n📍 Test 3: Routes sociales');
    const test3 = await testEndpoint('/api/social/feed', 'GET /api/social/feed');

    console.log('\n📊 Résumé:');
    const total = 3;
    const passed = [test1, test2, test3].filter(Boolean).length;
    console.log(`${passed}/${total} tests réussis`);

    if (passed === total) {
        console.log('\n🎉 Le serveur backend fonctionne correctement!');
        console.log('💡 Vous pouvez maintenant démarrer le frontend: cd afribourse && npm run dev');
    } else {
        console.log('\n⚠️  Certains endpoints ne répondent pas.');
        console.log('💡 Vérifiez que le backend est démarré: cd backend && npm run dev');
    }

    process.exit(passed === total ? 0 : 1);
}

// Attendre 2 secondes pour laisser le serveur démarrer
setTimeout(checkServer, 2000);

console.log('⏳ Attente de 2 secondes pour le démarrage du serveur...\n');
