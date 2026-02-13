# 🔧 Guide de Dépannage - Étape 2

## Erreur "Failed to fetch"

Cette erreur signifie que le frontend ne peut pas communiquer avec le backend.

### ✅ Solutions

#### 1. Vérifier que le Backend est Démarré

```bash
# Dans le terminal backend
cd backend
npm run dev
```

**Attendez de voir :**
```
✅ Serveur démarré sur http://localhost:5000
✅ Base de données connectée
```

**Si vous voyez des erreurs TypeScript :**
- Les erreurs dans les fichiers `.backup.ts` peuvent être ignorées
- Les erreurs dans `scripts/` n'empêchent pas le serveur de démarrer
- Seules les erreurs dans `src/index.ts`, `src/controllers/`, `src/services/`, `src/routes/` sont critiques

#### 2. Vérifier les Variables d'Environnement

Assurez-vous que `backend/.env` contient :

```env
DATABASE_URL="votre_url_mongodb"
JWT_SECRET="votre_secret"
PORT=5000
```

#### 3. Vérifier que MongoDB est Accessible

```bash
# Tester la connexion MongoDB
cd backend
npx prisma db pull
```

Si erreur, vérifiez votre `DATABASE_URL`.

#### 4. Régénérer le Client Prisma

```bash
cd backend
npx prisma generate
```

#### 5. Vérifier les Ports

Le backend doit être sur **port 5000**, le frontend sur **port 3000**.

```bash
# Vérifier si le port 5000 est utilisé (Windows)
netstat -ano | findstr :5000

# Si un autre process utilise le port, le tuer
taskkill /PID <PID> /F
```

---

## Erreurs TypeScript dans le Backend

### Erreurs dans les Fichiers Backup

**Symptôme:** Erreurs dans `admin.controller.backup.ts`

**Solution:** Ces fichiers sont ignorés par tsconfig, ils n'affectent pas le serveur.

### Erreurs dans les Scripts

**Symptôme:** Erreurs dans `scripts/delete-user-complete.ts`

**Solution:** Ces scripts ne sont pas chargés au démarrage. Pas de problème.

### Erreur "Property 'user' does not exist on type 'Request'"

**Symptôme:** Dans les controllers

**Solution:** ✅ **DÉJÀ CORRIGÉ**
- Vérifiez que `src/types/express.d.ts` a `export {};` à la fin
- Le serveur redémarrera automatiquement avec nodemon

---

## Erreurs dans le Frontend

### "Cannot find module 'react-router-dom'"

**Solution:**
```bash
cd afribourse
npm install
```

### "useOnboardingRedirect is not defined"

**Solution:** ✅ **DÉJÀ IMPLÉMENTÉ**
- Le hook existe dans `src/hooks/useOnboarding.ts`
- Redémarrer le serveur de dev

### Console: "🔄 Onboarding incomplete, redirecting to: /onboarding" en boucle

**Cause:** `requireOnboarding={true}` sur la route `/onboarding`

**Solution:** Vérifier `App.tsx` ligne 100 :
```tsx
<Route path="/onboarding" element={
  <ProtectedRoute requireOnboarding={false}>  {/* DOIT ÊTRE false */}
    <OnboardingFlow />
  </ProtectedRoute>
} />
```

---

## Tests de Diagnostic

### Test 1: Backend Accessible

```bash
curl http://localhost:5000/api/stocks
```

**Résultat attendu:** JSON avec liste de stocks

**Si erreur:** Backend non démarré ou port incorrect

### Test 2: Endpoint Onboarding

```bash
curl -H "Authorization: Bearer VOTRE_TOKEN" http://localhost:5000/api/investor-profile/onboarding/status
```

**Résultat attendu:**
```json
{
  "success": true,
  "data": {
    "completed": false,
    "hasProfile": false
  }
}
```

**Si 401:** Token invalide ou expiré
**Si 404:** Route non enregistrée (vérifier `src/index.ts`)

### Test 3: Frontend Accessible

Ouvrir http://localhost:3000

**Si erreur:** Frontend non démarré

### Test 4: Console Browser

Ouvrir la console (F12) et chercher :

```
✅ testOnboardingFlow chargé
```

**Si absent:** Problème d'import dans `App.tsx`

---

## Redémarrage Complet

Si tout échoue, redémarrer complètement :

```bash
# 1. Arrêter tous les processus (Ctrl+C dans chaque terminal)

# 2. Backend - Nettoyer et redémarrer
cd backend
rm -rf node_modules
rm -rf dist
npm install
npx prisma generate
npm run dev

# 3. Frontend - Nettoyer et redémarrer (nouveau terminal)
cd afribourse
rm -rf node_modules
rm -rf .next
npm install
npm run dev
```

---

## Vérifications Rapides

### ✅ Checklist Backend

- [ ] MongoDB est accessible
- [ ] `.env` contient `DATABASE_URL`, `JWT_SECRET`, `PORT`
- [ ] `npx prisma generate` exécuté sans erreur
- [ ] Backend démarre sans crash
- [ ] `http://localhost:5000` répond

### ✅ Checklist Frontend

- [ ] `npm install` exécuté
- [ ] Frontend démarre sans crash
- [ ] `http://localhost:3000` accessible
- [ ] Console browser sans erreur rouge

### ✅ Checklist Routes

- [ ] `/onboarding` a `requireOnboarding={false}`
- [ ] `/dashboard` a `requireOnboarding={true}`
- [ ] `express.d.ts` a `export {};` à la fin
- [ ] `tsconfig.json` exclut `**/*.backup.ts`

---

## Logs Utiles

### Backend - Vérifier les Routes Enregistrées

Dans `src/index.ts`, au démarrage, vous devriez voir :

```
✅ Routes enregistrées:
   - /api/investor-profile
   - /api/social
   - /api/stocks
   - ...
```

### Frontend - Console Browser

Messages attendus :

```
✅ testOnboardingFlow chargé
💡 Tapez: testOnboardingFlow.help()
```

Messages de redirection normaux :

```
🔄 Onboarding incomplete, redirecting to: /onboarding
```

Messages d'erreur à corriger :

```
❌ Failed to fetch
❌ Network error
❌ 404 Not Found
```

---

## Contact Support

Si le problème persiste après avoir suivi ce guide :

1. Vérifier les logs complets du backend
2. Vérifier la console browser (F12)
3. Tester les endpoints avec curl/Postman
4. Vérifier les variables d'environnement

---

**Dernière mise à jour:** Janvier 2024
**Version:** Étape 2 - Flux d'Onboarding
