// src/utils/testOnboarding.ts
/**
 * Utilitaire pour tester le flux d'onboarding
 * À utiliser dans la console du navigateur pour déboguer
 */

export const testOnboardingFlow = {
    /**
     * Vérifier le statut d'onboarding dans le localStorage/cache
     */
    checkCache: () => {
        const queryCache = (window as any).__REACT_QUERY_DEVTOOLS__;
        if (queryCache) {
            console.log('✅ React Query DevTools détecté');
            console.log('📦 Ouvrez les DevTools pour voir le cache ["onboarding", "status"]');
        } else {
            console.log('⚠️ React Query DevTools non disponible');
        }

        const token = localStorage.getItem('token');
        console.log('🔑 Token:', token ? 'Présent' : 'Absent');

        const user = localStorage.getItem('user');
        if (user) {
            try {
                const userData = JSON.parse(user);
                console.log('👤 Utilisateur:', userData);
            } catch (e) {
                console.log('❌ Erreur parsing user data');
            }
        }
    },

    /**
     * Simuler un nouveau utilisateur sans onboarding
     */
    simulateNewUser: () => {
        console.log('🎭 Simulation: Nouvel utilisateur sans onboarding');
        console.log('1. Connectez-vous via /login');
        console.log('2. Essayez d\'accéder à /dashboard');
        console.log('3. Vous devriez être redirigé vers /onboarding');
    },

    /**
     * Vérifier les routes protégées
     */
    checkProtectedRoutes: () => {
        const protectedRoutes = [
            { path: '/dashboard', requiresOnboarding: true },
            { path: '/profile', requiresOnboarding: true },
            { path: '/transactions', requiresOnboarding: true },
            { path: '/checkout', requiresOnboarding: true }
        ];

        const publicRoutes = [
            { path: '/', requiresOnboarding: false },
            { path: '/markets', requiresOnboarding: false },
            { path: '/news', requiresOnboarding: false },
            { path: '/profile/:userId', requiresOnboarding: false }
        ];

        const authRoutes = [
            { path: '/signup', requiresOnboarding: false },
            { path: '/login', requiresOnboarding: false },
            { path: '/onboarding', requiresOnboarding: false }
        ];

        console.log('🔒 Routes Protégées (requireOnboarding=true):');
        console.table(protectedRoutes);

        console.log('🌍 Routes Publiques:');
        console.table(publicRoutes);

        console.log('🔐 Routes d\'Authentification:');
        console.table(authRoutes);
    },

    /**
     * Guide de test rapide
     */
    quickTestGuide: () => {
        console.log('📋 GUIDE DE TEST RAPIDE\n');
        console.log('TEST 1: Nouvel Utilisateur');
        console.log('  1. Créer un compte sur /signup');
        console.log('  2. Se connecter sur /login');
        console.log('  3. Aller sur /dashboard');
        console.log('  4. ✅ Devrait rediriger vers /onboarding\n');

        console.log('TEST 2: Complétion Onboarding');
        console.log('  1. Être sur /onboarding');
        console.log('  2. Remplir toutes les étapes');
        console.log('  3. Cliquer sur "Terminer"');
        console.log('  4. ✅ Devrait rediriger vers /profile\n');

        console.log('TEST 3: Accès Post-Onboarding');
        console.log('  1. Avoir complété l\'onboarding');
        console.log('  2. Aller sur /dashboard');
        console.log('  3. ✅ Devrait afficher le dashboard\n');

        console.log('TEST 4: Profil Public');
        console.log('  1. Ne PAS compléter l\'onboarding');
        console.log('  2. Aller sur /profile/autre-user-id');
        console.log('  3. ✅ Devrait afficher le profil sans redirection\n');

        console.log('Pour plus de détails, voir: TEST_ONBOARDING_FLOW.md');
    },

    /**
     * Afficher l'état actuel
     */
    getCurrentState: async () => {
        const currentPath = window.location.pathname;
        const token = localStorage.getItem('token');
        const isAuthenticated = !!token;

        console.log('📍 État Actuel:\n');
        console.log('  Page:', currentPath);
        console.log('  Authentifié:', isAuthenticated);

        if (!isAuthenticated) {
            console.log('  ⚠️ Vous devez vous connecter pour tester l\'onboarding');
            return;
        }

        // Essayer de récupérer le statut d'onboarding
        try {
            const response = await fetch('http://localhost:5000/api/investor-profile/onboarding/status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('  Onboarding complété:', data.data.completed);
                console.log('  A un profil:', data.data.hasProfile);

                if (data.data.completed) {
                    console.log('\n  ✅ Onboarding complété - Accès à toutes les pages');
                } else {
                    console.log('\n  ⚠️ Onboarding incomplet - Redirection active vers /onboarding');
                }
            } else {
                console.log('  ❌ Erreur lors de la récupération du statut');
            }
        } catch (error) {
            console.log('  ❌ Erreur réseau:', error);
        }
    },

    /**
     * Tester la redirection
     */
    testRedirect: () => {
        console.log('🔄 Test de Redirection\n');
        console.log('1. Ouvrez la console du navigateur');
        console.log('2. Observez les messages de redirection');
        console.log('3. Cherchez: "🔄 Onboarding incomplete, redirecting to: /onboarding"');
        console.log('\n💡 Si vous voyez ce message en boucle, vérifiez que requireOnboarding={false} sur /onboarding');
    },

    /**
     * Aide complète
     */
    help: () => {
        console.log('🆘 AIDE - Test du Flux d\'Onboarding\n');
        console.log('Commandes disponibles (via testOnboardingFlow):');
        console.log('  .checkCache()         - Vérifier le cache et le localStorage');
        console.log('  .checkProtectedRoutes() - Lister toutes les routes et leur config');
        console.log('  .getCurrentState()    - Afficher l\'état actuel de l\'utilisateur');
        console.log('  .quickTestGuide()     - Guide de test rapide');
        console.log('  .testRedirect()       - Tester la redirection');
        console.log('  .help()               - Afficher cette aide\n');
        console.log('📚 Documentation complète: ONBOARDING_FLOW_GUIDE.md');
        console.log('🧪 Plan de test: TEST_ONBOARDING_FLOW.md');
    }
};

// Exposer globalement pour utilisation dans la console
if (typeof window !== 'undefined') {
    (window as any).testOnboardingFlow = testOnboardingFlow;
    console.log('✅ testOnboardingFlow chargé');
    console.log('💡 Tapez: testOnboardingFlow.help()');
}

export default testOnboardingFlow;
