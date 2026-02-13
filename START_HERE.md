# 🚀 Démarrage Rapide - AfriBourse

## 📋 Avant de Commencer

Assurez-vous d'avoir :
- ✅ Node.js installé (v18+)
- ✅ MongoDB accessible
- ✅ Fichier `.env` configuré dans `backend/`

---

## ⚡ Démarrage en 3 Étapes

### Étape 1: Configuration Backend

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances (si pas déjà fait)
npm install

# Générer le client Prisma
npx prisma generate

# Vérifier le fichier .env
# Doit contenir: DATABASE_URL, JWT_SECRET, PORT=5000
```

### Étape 2: Démarrer le Backend

```bash
# Dans le dossier backend
npm run dev
```

**✅ Attendez de voir:**
```
✅ Serveur démarré sur http://localhost:5000
✅ Base de données connectée
```

**❌ Si vous voyez des erreurs TypeScript:**
- Les erreurs dans les fichiers `.backup.ts` sont normales
- Les erreurs dans `scripts/` n'empêchent pas le serveur de démarrer
- Ignorez-les pour l'instant

### Étape 3: Démarrer le Frontend

**Dans un NOUVEAU terminal :**

```bash
# Aller dans le dossier frontend
cd afribourse

# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer le serveur de développement
npm run dev
```

**✅ Attendez de voir:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

---

## 🧪 Test du Flux d'Onboarding

Une fois les deux serveurs démarrés :

### 1. Créer un Compte

1. Ouvrir http://localhost:3000
2. Cliquer sur "S'inscrire"
3. Remplir le formulaire
4. Se connecter

### 2. Tester la Redirection

1. Essayer d'accéder à http://localhost:3000/dashboard
2. ✅ **Vous devriez être automatiquement redirigé vers** `/onboarding`

### 3. Compléter l'Onboarding

1. Suivre les 5 étapes du questionnaire :
   - Étape 1: Profil de risque (quiz ou sélection manuelle)
   - Étape 2: Horizon d'investissement
   - Étape 3: Secteurs favoris (min. 2)
   - Étape 4: Paramètres de confidentialité
   - Étape 5: Récapitulatif et confirmation

2. Cliquer sur "Terminer"
3. ✅ **Vous devriez être redirigé vers** `/profile`

### 4. Vérifier l'Accès

1. Aller sur http://localhost:3000/dashboard
2. ✅ **Vous devriez voir le dashboard directement** (pas de redirection)

---

## 🔍 Vérification Rapide

### Backend Opérationnel ?

```bash
# Test rapide (dans un nouveau terminal)
curl http://localhost:5000/api/stocks
```

**Résultat attendu :** JSON avec la liste des stocks

**Si erreur :** Backend non démarré ou problème de port

### Frontend Opérationnel ?

Ouvrir http://localhost:3000 dans le navigateur

**✅ Devrait afficher :** Page d'accueil AfriBourse

### Console Browser (F12)

Ouvrir la console et chercher :

```
✅ testOnboardingFlow chargé
💡 Tapez: testOnboardingFlow.help()
```

**Si présent :** Tout fonctionne !

---

## 🐛 Problèmes Courants

### "Failed to fetch"

**Cause :** Frontend ne peut pas contacter le backend

**Solution :**
1. Vérifier que le backend est démarré sur le port 5000
2. Vérifier `apiClient` dans le frontend pointe vers `http://localhost:5000`

### "Cannot find module..."

**Solution :**
```bash
# Backend
cd backend && npm install

# Frontend
cd afribourse && npm install
```

### Boucle de Redirection sur /onboarding

**Cause :** Configuration incorrecte de la route

**Solution :** Vérifier `afribourse/src/App.tsx` ligne 100 :
```tsx
<Route path="/onboarding" element={
  <ProtectedRoute requireOnboarding={false}>  {/* DOIT ÊTRE false */}
    <OnboardingFlow />
  </ProtectedRoute>
} />
```

### MongoDB Connection Error

**Solution :**
1. Vérifier que MongoDB est démarré
2. Vérifier `DATABASE_URL` dans `backend/.env`
3. Tester la connexion : `cd backend && npx prisma db pull`

---

## 📖 Documentation Complète

- **Guide Principal :** [README_ETAPE_2.md](./README_ETAPE_2.md)
- **Guide Technique :** [ONBOARDING_FLOW_GUIDE.md](./ONBOARDING_FLOW_GUIDE.md)
- **Tests :** [TEST_ONBOARDING_FLOW.md](./TEST_ONBOARDING_FLOW.md)
- **Dépannage :** [TROUBLESHOOTING_ETAPE2.md](./TROUBLESHOOTING_ETAPE2.md)

---

## 🎯 Prochaines Étapes

Une fois le flux d'onboarding testé et validé :

1. **Profil Social** - Personnaliser et publier
2. **Suivre des utilisateurs** - Système de follow
3. **Posts & Interactions** - Créer et liker des posts
4. **Gamification** - Badges, XP, leaderboard

---

## 💡 Commandes Utiles

### Backend

```bash
# Redémarrer le serveur
rs

# Voir les logs
# Ils s'affichent automatiquement

# Arrêter
Ctrl + C
```

### Frontend

```bash
# Redémarrer
Ctrl + C puis npm run dev

# Build de production
npm run build

# Arrêter
Ctrl + C
```

### Base de Données

```bash
cd backend

# Générer le client Prisma
npx prisma generate

# Voir la base de données
npx prisma studio

# Migrer le schéma
npx prisma db push
```

---

## ✅ Checklist de Validation

Avant de passer à l'étape suivante, vérifier que :

- [ ] Backend démarre sans crash
- [ ] Frontend démarre sans crash
- [ ] Peut créer un compte et se connecter
- [ ] Redirection automatique vers `/onboarding` fonctionne
- [ ] Peut compléter les 5 étapes de l'onboarding
- [ ] Redirection vers `/profile` après complétion
- [ ] Peut accéder à `/dashboard` après onboarding
- [ ] Console browser affiche `testOnboardingFlow chargé`

---

**Tout fonctionne ? Félicitations ! 🎉**

Vous pouvez maintenant explorer les fonctionnalités sociales et de gamification.

---

**Besoin d'aide ?** Consultez [TROUBLESHOOTING_ETAPE2.md](./TROUBLESHOOTING_ETAPE2.md)
