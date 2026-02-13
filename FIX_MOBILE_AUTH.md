# Correction du Problème d'Authentification Mobile

## 🐛 Problème
Sur téléphone, même connecté, l'utilisateur devait se reconnecter pour acheter/vendre des actions.

## 🔍 Cause Identifiée
Le token d'authentification n'était pas correctement transmis dans les requêtes API :
1. **Frontend** : Le token était récupéré uniquement pour les appareils mobiles détectés
2. **Backend** : Le token du header Authorization n'était accepté que si le user-agent était mobile

## ✅ Corrections Apportées

### 1. Frontend - `afribourse/src/hooks/useApi.ts`

#### Changement 1 : Récupération du token améliorée (ligne 19-34)
**Avant** :
```typescript
const getAuthToken = (): string | null => {
  if (isMobileDevice()) {
    return localStorage.getItem('auth_token');
  }
  return null;
};
```

**Après** :
```typescript
const getAuthToken = (): string | null => {
  // Essayer d'abord 'auth_token', puis 'token' comme fallback
  const authToken = localStorage.getItem('auth_token');
  if (authToken) {
    return authToken;
  }

  // Fallback pour compatibilité
  const token = localStorage.getItem('token');
  if (token) {
    return token;
  }

  return null;
};
```

**Bénéfices** :
- ✅ Cherche le token avec plusieurs clés possibles
- ✅ Fonctionne sur tous les appareils (mobile ET desktop)
- ✅ Compatibilité avec différentes implémentations

#### Changement 2 : Ajout du token sans distinction mobile/desktop (ligne 52-57)
**Avant** :
```typescript
// Sur mobile, ajouter le token dans le header Authorization
const token = getAuthToken();
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

**Après** :
```typescript
// Ajouter le token dans le header Authorization s'il existe
const token = getAuthToken();
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
  console.log('🔐 [API] Using auth token for request to', endpoint);
}
```

**Bénéfices** :
- ✅ Le token est toujours envoyé s'il existe
- ✅ Log ajouté pour faciliter le debug
- ✅ Fonctionne indépendamment de la plateforme

### 2. Backend - `backend/src/utils/index.ts`

#### Changement : Récupération universelle du token (ligne 25-47)
**Avant** :
```typescript
export const getUserFromToken = async (req: Request) => {
    try {
        const isMobile = isUserOnMobile(req)
        const token = isMobile ? req.headers['authorization']?.split(' ')[1] : req.cookies.token
        if(!token) throw createError.badRequest("Le token n'existe pas.")
        // ... reste du code
    } catch (error) {
        return {error}
    }
}
```

**Après** :
```typescript
export const getUserFromToken = async (req: Request) => {
    try {
        // Essayer d'abord le header Authorization (mobile et desktop)
        let token = req.headers['authorization']?.split(' ')[1];

        // Si pas de token dans le header, essayer le cookie (desktop)
        if (!token) {
            token = req.cookies.token;
        }

        if(!token) throw createError.badRequest("Le token n'existe pas.")
        // ... reste du code
    } catch (error) {
        return {error}
    }
}
```

**Bénéfices** :
- ✅ Accepte le token depuis le header Authorization en priorité
- ✅ Fallback sur les cookies si pas de header
- ✅ Plus besoin de détecter le type d'appareil
- ✅ Compatible avec tous les clients (mobile, desktop, apps natives)

## 🧪 Comment Tester

### Test sur Mobile
1. **Connectez-vous** sur votre téléphone
2. **Ouvrez les DevTools** du navigateur mobile (Chrome Remote Debugging ou Safari Web Inspector)
3. **Allez sur le dashboard** `/dashboard`
4. **Essayez d'acheter une action**
5. **Vérifiez dans la console** :
   - Vous devriez voir `🔐 [API] Using auth token for request to /portfolios/my/buy`
   - La requête devrait retourner 200 OK (pas 401 Unauthorized)

### Test sur Desktop (pour vérifier qu'on n'a rien cassé)
1. **Connectez-vous** sur desktop
2. **Ouvrez les DevTools** (F12)
3. **Allez sur le dashboard** `/dashboard`
4. **Essayez d'acheter une action**
5. **Vérifiez dans la console** :
   - La requête devrait fonctionner normalement
   - Aucune erreur d'authentification

### Vérification des Logs Backend
Dans les logs du serveur backend, vous devriez voir :
```
🔒 [AUTH] Headers: ...
✅ [AUTH] User authenticated: user@example.com
```

Si vous voyez plutôt :
```
❌ [AUTH] No user found, error: Le token n'existe pas.
```
Alors le token n'est toujours pas transmis correctement.

## 🔧 Debug Supplémentaire

Si le problème persiste sur mobile, vérifiez :

### 1. Le token est-il dans localStorage ?
Dans la console mobile :
```javascript
console.log('auth_token:', localStorage.getItem('auth_token'));
console.log('token:', localStorage.getItem('token'));
```

### 2. Le token est-il envoyé dans la requête ?
Dans l'onglet Network des DevTools :
- Cliquez sur la requête `/portfolios/my/buy`
- Regardez l'onglet "Headers"
- Vérifiez qu'il y a bien : `Authorization: Bearer ey...`

### 3. Le backend reçoit-il le token ?
Dans les logs backend, vérifiez :
```typescript
console.log('Authorization header:', req.headers['authorization']);
```

## 📝 Notes Importantes

1. **Cookies vs Headers** :
   - Desktop utilise les cookies HTTP-only (plus sécurisé)
   - Mobile utilise localStorage + Authorization header (nécessaire pour les apps natives)
   - Notre solution supporte les deux méthodes

2. **Sécurité** :
   - Les cookies HTTP-only sont plus sécurisés contre les attaques XSS
   - localStorage est nécessaire pour les applications mobiles natives
   - Le token JWT a une expiration pour limiter les risques

3. **Compatibilité** :
   - Cette solution fonctionne sur tous les navigateurs
   - Compatible avec les apps React Native
   - Compatible avec les PWAs

## 🚀 Prochaines Étapes (Optionnel)

Si vous souhaitez améliorer encore plus l'authentification mobile :

1. **Refresh Token** : Implémenter un système de refresh token pour ne pas avoir à se reconnecter
2. **Biométrie** : Ajouter Face ID / Touch ID sur mobile
3. **Session persistante** : Garder l'utilisateur connecté plus longtemps
4. **Détection de déconnexion** : Intercepter les 401 et rediriger vers login automatiquement

---

**Les modifications sont maintenant actives et prêtes à être testées !** 🎉
