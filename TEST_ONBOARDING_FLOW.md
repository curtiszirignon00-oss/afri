# Plan de Test - Flux d'Onboarding

## 🧪 Tests à Effectuer

### Test 1: Nouvel Utilisateur Sans Onboarding

**Objectif:** Vérifier que l'utilisateur est redirigé vers /onboarding

**Étapes:**
1. Créer un nouveau compte via `/signup`
2. Se connecter via `/login`
3. Tenter d'accéder à `/dashboard`

**Résultat Attendu:**
- ✅ Redirection automatique vers `/onboarding`
- ✅ Message console: `🔄 Onboarding incomplete, redirecting to: /onboarding`
- ✅ Affichage de l'étape 1 du questionnaire

---

### Test 2: Complétion de l'Onboarding

**Objectif:** Vérifier que l'onboarding sauvegarde correctement et redirige

**Étapes:**
1. Être sur `/onboarding`
2. Compléter l'étape 1 (Profil de risque)
3. Compléter l'étape 2 (Horizon d'investissement)
4. Compléter l'étape 3 (Secteurs favoris)
5. Compléter l'étape 4 (Confidentialité)
6. Cliquer sur "Terminer" à l'étape 5

**Résultat Attendu:**
- ✅ Spinner pendant l'envoi
- ✅ Toast de succès: "Profil créé avec succès !"
- ✅ Redirection vers `/profile`
- ✅ Affichage du profil avec ADN d'investisseur

---

### Test 3: Accès aux Pages Protégées Après Onboarding

**Objectif:** Vérifier que l'utilisateur peut accéder aux pages une fois l'onboarding complété

**Étapes:**
1. Avoir complété l'onboarding (Test 2)
2. Naviguer vers `/dashboard`
3. Naviguer vers `/profile`
4. Naviguer vers `/transactions`

**Résultat Attendu:**
- ✅ Accès direct sans redirection
- ✅ Pas de spinner prolongé
- ✅ Contenu de la page affiché

---

### Test 4: Profil Public Accessible Sans Onboarding

**Objectif:** Vérifier que les profils publics sont accessibles même sans onboarding

**Étapes:**
1. Se connecter avec un compte SANS onboarding complété
2. Naviguer vers `/profile/autre-user-id` (remplacer par un vrai ID)

**Résultat Attendu:**
- ✅ Pas de redirection vers /onboarding
- ✅ Affichage du profil public de l'autre utilisateur

---

### Test 5: Accès Direct à /onboarding

**Objectif:** Vérifier qu'on peut accéder à /onboarding sans boucle infinie

**Étapes:**
1. Se connecter avec un compte SANS onboarding
2. Taper manuellement `/onboarding` dans l'URL

**Résultat Attendu:**
- ✅ Affichage de la page d'onboarding
- ✅ PAS de redirection en boucle
- ✅ Pas d'erreur console

---

### Test 6: Déconnexion et Reconnexion

**Objectif:** Vérifier que le statut d'onboarding persiste après reconnexion

**Scénario A: Avec Onboarding Complété**
1. Compléter l'onboarding (Test 2)
2. Se déconnecter
3. Se reconnecter
4. Naviguer vers `/dashboard`

**Résultat Attendu:**
- ✅ Accès direct au dashboard
- ✅ Pas de redirection vers /onboarding

**Scénario B: Sans Onboarding**
1. Se connecter avec compte SANS onboarding
2. Se déconnecter
3. Se reconnecter
4. Naviguer vers `/dashboard`

**Résultat Attendu:**
- ✅ Redirection vers /onboarding
- ✅ Message de redirection dans la console

---

### Test 7: Navigation Retour Pendant l'Onboarding

**Objectif:** Vérifier la navigation entre les étapes

**Étapes:**
1. Être sur `/onboarding` étape 3
2. Cliquer sur "Précédent"
3. Vérifier qu'on est à l'étape 2
4. Cliquer sur "Précédent"
5. Vérifier qu'on est à l'étape 1

**Résultat Attendu:**
- ✅ Navigation fluide entre les étapes
- ✅ Données des étapes précédentes conservées
- ✅ Barre de progression mise à jour

---

### Test 8: Abandon de l'Onboarding

**Objectif:** Vérifier le comportement si l'utilisateur quitte en cours d'onboarding

**Étapes:**
1. Commencer l'onboarding (être à l'étape 2 ou 3)
2. Naviguer manuellement vers `/markets` (page publique)
3. Tenter d'accéder à `/dashboard`

**Résultat Attendu:**
- ✅ Accès aux pages publiques sans problème
- ✅ Redirection vers /onboarding lors de l'accès à une page protégée
- ✅ Reprise de l'onboarding depuis le début (données non sauvegardées)

---

### Test 9: Erreur Backend lors de l'Onboarding

**Objectif:** Vérifier la gestion des erreurs

**Étapes:**
1. Compléter toutes les étapes de l'onboarding
2. (Simulation) Couper la connexion réseau
3. Cliquer sur "Terminer"

**Résultat Attendu:**
- ✅ Toast d'erreur affiché
- ✅ Utilisateur reste sur la page d'onboarding
- ✅ Peut réessayer après rétablissement du réseau

---

### Test 10: Vérification du Cache React Query

**Objectif:** Vérifier que le cache est invalidé après l'onboarding

**Étapes:**
1. Ouvrir les DevTools React Query
2. Observer la clé `['onboarding', 'status']`
3. Compléter l'onboarding
4. Observer l'invalidation du cache

**Résultat Attendu:**
- ✅ Cache montrant `completed: false` initialement
- ✅ Cache invalidé après succès
- ✅ Nouveau fetch montrant `completed: true`

---

## 🔍 Points de Vérification Backend

### Endpoint: `GET /api/investor-profile/onboarding/status`

**Test A: Utilisateur sans profil**
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/investor-profile/onboarding/status
```

**Réponse Attendue:**
```json
{
    "success": true,
    "data": {
        "completed": false,
        "hasProfile": false
    }
}
```

**Test B: Utilisateur avec profil complété**
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/investor-profile/onboarding/status
```

**Réponse Attendue:**
```json
{
    "success": true,
    "data": {
        "completed": true,
        "hasProfile": true,
        "profile": {
            "risk_profile": "BALANCED",
            "investment_horizon": "LONG_TERM",
            ...
        }
    }
}
```

### Endpoint: `POST /api/investor-profile/onboarding/complete`

**Test: Complétion réussie**
```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "risk_profile": "BALANCED",
    "investment_horizon": "LONG_TERM",
    "favorite_sectors": ["Technology", "Finance"],
    "quiz_score": 8
  }' \
  http://localhost:5000/api/investor-profile/onboarding/complete
```

**Réponse Attendue:**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "user_id": "user-uuid",
        "risk_profile": "BALANCED",
        ...
    },
    "message": "Profil d'investisseur créé avec succès"
}
```

---

## 📋 Checklist de Test Complet

- [ ] Test 1: Redirection nouvel utilisateur
- [ ] Test 2: Complétion onboarding complète
- [ ] Test 3: Accès pages protégées après onboarding
- [ ] Test 4: Profils publics accessibles
- [ ] Test 5: Accès direct /onboarding sans boucle
- [ ] Test 6A: Reconnexion avec onboarding complété
- [ ] Test 6B: Reconnexion sans onboarding
- [ ] Test 7: Navigation retour pendant onboarding
- [ ] Test 8: Abandon de l'onboarding
- [ ] Test 9: Gestion erreurs backend
- [ ] Test 10: Vérification cache React Query
- [ ] Backend: GET status (sans profil)
- [ ] Backend: GET status (avec profil)
- [ ] Backend: POST complete (succès)
- [ ] Backend: POST complete (validation erreur)

---

## 🐛 Bugs Potentiels à Surveiller

### 1. Boucle Infinie
**Symptôme:** Redirection continue entre /onboarding et une autre page

**Causes Possibles:**
- `requireOnboarding=true` sur la route `/onboarding`
- Problème dans `allowedPaths` du hook

### 2. Flash de Contenu
**Symptôme:** Contenu protégé visible pendant 1 frame avant redirection

**Cause:** Vérification asynchrone non gérée

**Solution:** Spinner de chargement pendant `isLoading`

### 3. Redirection après Onboarding Complété
**Symptôme:** Redirection vers /onboarding alors que le profil existe

**Causes Possibles:**
- Cache React Query non invalidé
- Backend ne retourne pas `completed: true`
- Problème de synchronisation

### 4. 401 sur les Endpoints d'Onboarding
**Symptôme:** Erreur "Non autorisé" lors de l'accès aux endpoints

**Cause:** Token d'authentification manquant ou expiré

**Solution:** Vérifier que `apiClient` inclut le token dans les headers

---

## ✅ Critères de Succès

L'implémentation est considérée comme réussie si :

1. ✅ Tous les tests 1-10 passent sans erreur
2. ✅ Aucune boucle infinie détectée
3. ✅ Les spinners s'affichent pendant les chargements
4. ✅ Les toasts de succès/erreur fonctionnent
5. ✅ Le backend répond correctement aux deux endpoints
6. ✅ Le cache React Query est géré correctement
7. ✅ Les logs console sont clairs (pas d'erreurs)
8. ✅ L'UX est fluide sans "flash" de contenu

---

**Note:** Effectuer ces tests dans l'ordre pour une validation complète du flux.
