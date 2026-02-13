# Guide du Flux d'Onboarding - Étape 2 ✅

## 📋 Vue d'ensemble

Le flux d'onboarding permet de collecter l'**ADN d'investisseur** des nouveaux utilisateurs avant qu'ils n'accèdent aux fonctionnalités principales de l'application.

---

## 🎯 Fonctionnement

### 1. Logique de Redirection Automatique

Lorsqu'un utilisateur **authentifié** tente d'accéder à une page protégée :

```
1. ProtectedRoute vérifie l'authentification
2. Si authentifié → Vérifie le statut d'onboarding via useOnboardingRedirect
3. Si onboarding incomplet → Redirection automatique vers /onboarding
4. Si onboarding complet → Accès autorisé à la page
```

### 2. Pages Concernées

#### ✅ Pages qui VÉRIFIENT l'onboarding (requireOnboarding=true)
- `/dashboard` - Tableau de bord
- `/profile` - Mon profil
- `/transactions` - Historique des transactions
- `/checkout` - Page de paiement

#### ⛔ Pages qui NE VÉRIFIENT PAS l'onboarding
- `/onboarding` - La page d'onboarding elle-même (évite la boucle infinie)
- `/profile/:userId` - Profils publics (accessible sans onboarding)
- Routes publiques (home, markets, news, etc.)
- Routes d'authentification (signup, login, etc.)

---

## 🔧 Composants Implémentés

### 1. Hook `useOnboardingRedirect`

**Fichier:** `src/hooks/useOnboarding.ts`

```typescript
useOnboardingRedirect({
    enabled: true,              // Active la vérification
    redirectTo: '/onboarding',  // Destination si incomplet
    allowedPaths: ['/onboarding', '/logout'] // Chemins exemptés
})
```

**Retourne:**
- `isOnboardingComplete` - Boolean indiquant si l'onboarding est complété
- `isLoading` - État de chargement
- `error` - Erreur éventuelle
- `needsOnboarding` - Boolean indiquant si l'utilisateur a besoin de l'onboarding

### 2. Composant `ProtectedRoute`

**Fichier:** `src/components/ProtectedRoute.tsx`

```tsx
<ProtectedRoute requireOnboarding={true}>
    <DashboardPage />
</ProtectedRoute>
```

**Props:**
- `children` - Contenu à protéger
- `requireOnboarding` - (optionnel, défaut: true) Vérifie le statut d'onboarding

**Comportement:**
1. Vérifie l'authentification (token)
2. Si `requireOnboarding=true`, vérifie le statut d'onboarding
3. Affiche un spinner pendant les vérifications
4. Redirige si nécessaire (login ou onboarding)

### 3. Configuration des Routes

**Fichier:** `src/App.tsx`

```tsx
// Route publique - Pas de vérification
<Route path="/" element={<HomePage />} />

// Onboarding - Authentification requise, pas de vérification onboarding
<Route path="/onboarding" element={
    <ProtectedRoute requireOnboarding={false}>
        <OnboardingFlow />
    </ProtectedRoute>
} />

// Dashboard - Authentification + Onboarding requis
<Route path="/dashboard" element={
    <ProtectedRoute requireOnboarding={true}>
        <DashboardPage />
    </ProtectedRoute>
} />
```

---

## 📊 Flux Utilisateur Complet

### Scénario 1: Nouvel Utilisateur

```
1. User s'inscrit → /signup
2. User se connecte → /login
3. User essaie d'accéder à /dashboard
4. ProtectedRoute détecte l'onboarding incomplet
5. → Redirection automatique vers /onboarding
6. User complète les 5 étapes du questionnaire
7. Soumission réussie → Redirection vers /profile
8. User peut maintenant accéder à toutes les pages protégées
```

### Scénario 2: Utilisateur avec Onboarding Complété

```
1. User se connecte → /login
2. User accède à /dashboard
3. ProtectedRoute vérifie le statut d'onboarding
4. Statut: completed ✅
5. → Accès direct au dashboard
```

### Scénario 3: Utilisateur qui abandonne l'Onboarding

```
1. User sur /onboarding (étape 2/5)
2. User ferme l'onglet
3. User revient plus tard et se connecte
4. User essaie d'accéder à /profile
5. ProtectedRoute détecte l'onboarding incomplet
6. → Redirection vers /onboarding
7. User reprend depuis le début (données non sauvegardées)
```

---

## 🎨 Étapes de l'Onboarding

### Étape 1: Profil de Risque
- Quiz interactif (3 questions)
- Calcul automatique du profil (CONSERVATIVE, MODERATE, BALANCED, GROWTH, AGGRESSIVE)
- Option de sélection manuelle

### Étape 2: Horizon d'Investissement
- 4 options (SHORT_TERM, MEDIUM_TERM, LONG_TERM, VERY_LONG_TERM)
- Cartes visuelles avec descriptions

### Étape 3: Secteurs Favoris
- Multi-sélection (8 secteurs disponibles)
- Minimum 2 secteurs requis
- Technologies, Finance, Santé, Énergie, Consommation, Immobilier, Industrie, Agriculture

### Étape 4: Paramètres de Confidentialité
- Visibilité du portefeuille (PUBLIC/FOLLOWERS/PRIVATE)
- Affichage des performances (oui/non)
- Affichage des transactions (oui/non)

### Étape 5: Récapitulatif & Confirmation
- Résumé de toutes les sélections
- Bouton de confirmation
- Soumission vers l'API

---

## 🔄 Endpoints API

### `GET /api/investor-profile/onboarding/status`
**Réponse:**
```json
{
    "success": true,
    "data": {
        "completed": false,
        "hasProfile": false
    }
}
```

### `POST /api/investor-profile/onboarding/complete`
**Body:**
```json
{
    "risk_profile": "BALANCED",
    "investment_horizon": "LONG_TERM",
    "favorite_sectors": ["Technology", "Finance"],
    "quiz_score": 8,
    "portfolio_visibility": "PUBLIC",
    "show_performance": true,
    "show_transactions": false
}
```

**Réponse:**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "user_id": "user-uuid",
        "risk_profile": "BALANCED",
        "investment_horizon": "LONG_TERM",
        "favorite_sectors": ["Technology", "Finance"],
        "created_at": "2024-01-15T10:00:00Z"
    },
    "message": "Profil d'investisseur créé avec succès"
}
```

---

## ⚙️ Configuration Technique

### allowedPaths dans useOnboardingRedirect

Les chemins suivants **NE déclenchent PAS** de redirection vers /onboarding :
- `/onboarding` - La page d'onboarding elle-même
- `/logout` - Page de déconnexion
- `/login` - Page de connexion
- `/signup` - Page d'inscription

### Cache et React Query

Le statut d'onboarding est mis en cache avec React Query :

```typescript
queryKey: ['onboarding', 'status']
```

Après complétion de l'onboarding, le cache est invalidé automatiquement.

---

## 🐛 Dépannage

### Problème: Boucle Infinie sur /onboarding

**Cause:** `requireOnboarding=true` sur la route `/onboarding`

**Solution:** Toujours utiliser `requireOnboarding={false}` pour la route onboarding

```tsx
<Route path="/onboarding" element={
    <ProtectedRoute requireOnboarding={false}>
        <OnboardingFlow />
    </ProtectedRoute>
} />
```

### Problème: Redirection alors que l'onboarding est complété

**Cause:** Cache React Query non invalidé ou problème backend

**Solution:**
1. Vérifier la réponse de `/api/investor-profile/onboarding/status`
2. Vérifier que `completed: true` est retourné
3. Invalider manuellement le cache si nécessaire

### Problème: Utilisateur peut accéder aux pages protégées sans onboarding

**Cause:** `requireOnboarding={false}` sur une route qui devrait le vérifier

**Solution:** Toujours utiliser `requireOnboarding={true}` (ou omettre, c'est la valeur par défaut)

```tsx
<Route path="/dashboard" element={
    <ProtectedRoute> {/* requireOnboarding=true par défaut */}
        <DashboardPage />
    </ProtectedRoute>
} />
```

---

## ✅ Checklist d'Implémentation

- [x] Hook `useOnboardingRedirect` créé
- [x] `ProtectedRoute` mis à jour avec vérification onboarding
- [x] Routes configurées dans `App.tsx`
- [x] Page `/onboarding` exemptée de la vérification
- [x] Pages protégées avec `requireOnboarding=true`
- [x] Profils publics accessibles sans onboarding
- [x] Redirection après complétion vers `/profile`
- [x] Spinners de chargement pendant les vérifications
- [x] Gestion des erreurs avec toast notifications

---

## 🚀 Prochaines Étapes (Étape 3)

Une fois l'onboarding complété, l'utilisateur peut :
1. Accéder à son profil social (`/profile`)
2. Voir son ADN d'investisseur affiché
3. Commencer à utiliser les fonctionnalités de gamification
4. Suivre d'autres utilisateurs
5. Publier des posts et interagir socialement

---

## 📝 Notes Importantes

1. **Sécurité:** Toutes les routes protégées vérifient l'authentification AVANT l'onboarding
2. **UX:** Les spinners sont affichés pendant les vérifications pour éviter les "flash" de contenu
3. **Performance:** React Query met en cache le statut d'onboarding pour éviter les appels répétés
4. **Flexibilité:** Le système permet d'activer/désactiver la vérification par route via `requireOnboarding`

---

**Auteur:** Implémentation Étape 2 - Flux d'Onboarding
**Date:** 2024
**Version:** 1.0
