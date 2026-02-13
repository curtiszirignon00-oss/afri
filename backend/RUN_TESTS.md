# 🚀 Comment Exécuter les Tests - Guide Rapide

## ✅ Prérequis

Le backend doit être en cours d'exécution sur http://localhost:3001

## 🎯 Méthode 1: Script PowerShell (Recommandé pour Windows)

### Étape 1: Ouvrir PowerShell dans le dossier backend

```powershell
cd C:\Users\HP\OneDrive\Desktop\afri\backend
```

### Étape 2: Exécuter le script de test

```powershell
.\test-investor-social.ps1
```

### Étape 3: Entrer vos identifiants

Le script va vous demander:
- **Email:** Votre email de compte Afribourse
- **Password:** Votre mot de passe

### Résultat Attendu

```
=========================================
  Investor Profile & Social Tests
=========================================

Step 1: Login to get JWT token
Enter your email: votre@email.com
Enter your password: ********
✓ Login successful
User ID: 6789abc123...

Step 2: Check Onboarding Status
{
  "onboardingCompleted": false
}
✓ Onboarding status retrieved

Step 3: Complete Onboarding
{
  "message": "Onboarding completed successfully"
}
✓ Onboarding completed

... (et ainsi de suite pour tous les tests)

=========================================
  Tests Completed!
=========================================
```

---

## 🎯 Méthode 2: Tests Manuels avec cURL

### A. Login

```bash
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre@email.com",
    "password": "votreMotDePasse"
  }'
```

### B. Compléter l'Onboarding

```bash
curl -b cookies.txt -X POST http://localhost:3001/api/investor-profile/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "risk_profile": "MODERATE",
    "investment_horizon": "LONG_TERM",
    "favorite_sectors": ["Technologie", "Finance"],
    "monthly_investment": 50000,
    "investment_goals": ["Retraite"],
    "experience_level": "Intermédiaire",
    "quiz_score": 75
  }'
```

### C. Créer un Post Social

```bash
curl -b cookies.txt -X POST http://localhost:3001/api/social/posts \
  -H "Content-Type: application/json" \
  -d '{
    "type": "OPINION",
    "content": "SONATEL est une excellente opportunité!",
    "stock_symbol": "SNTS",
    "tags": ["BRVM", "Dividendes"],
    "visibility": "PUBLIC"
  }'
```

### D. Récupérer le Feed

```bash
curl -b cookies.txt http://localhost:3001/api/social/feed?page=1&limit=10
```

---

## 🎯 Méthode 3: Postman

### 1. Créer une Collection

**Nom:** Afribourse Tests

### 2. Variables de Collection

- `base_url`: http://localhost:3001
- `token`: (sera rempli après login)

### 3. Requêtes à Créer

#### a) Login
```
POST {{base_url}}/api/auth/login
Body (JSON):
{
  "email": "votre@email.com",
  "password": "votreMotDePasse"
}

Script (Tests):
pm.collectionVariables.set("token", pm.response.json().token);
```

#### b) Get Investor Profile
```
GET {{base_url}}/api/investor-profile
Headers:
Cookie: token={{token}}
```

#### c) Complete Onboarding
```
POST {{base_url}}/api/investor-profile/onboarding/complete
Headers:
Cookie: token={{token}}
Body (JSON):
{
  "risk_profile": "MODERATE",
  "investment_horizon": "LONG_TERM",
  "favorite_sectors": ["Technologie", "Finance"],
  "monthly_investment": 50000,
  "investment_goals": ["Retraite"],
  "experience_level": "Intermédiaire",
  "quiz_score": 75
}
```

#### d) Create Social Post
```
POST {{base_url}}/api/social/posts
Headers:
Cookie: token={{token}}
Body (JSON):
{
  "type": "OPINION",
  "content": "SONATEL est une excellente opportunité!",
  "stock_symbol": "SNTS",
  "tags": ["BRVM", "Dividendes"],
  "visibility": "PUBLIC"
}
```

#### e) Get Feed
```
GET {{base_url}}/api/social/feed?page=1&limit=10
Headers:
Cookie: token={{token}}
```

---

## 📊 Checklist des Tests

### Investor Profile
- [ ] Vérifier statut onboarding
- [ ] Compléter onboarding
- [ ] Récupérer profil investisseur
- [ ] Mettre à jour DNA investisseur
- [ ] Mettre à jour confidentialité

### Social Posts
- [ ] Créer post Opinion
- [ ] Créer post Analyse
- [ ] Créer post Question
- [ ] Récupérer feed
- [ ] Récupérer posts utilisateur
- [ ] Liker un post
- [ ] Unliker un post
- [ ] Commenter un post
- [ ] Récupérer commentaires

### Follow System
- [ ] Suivre un utilisateur
- [ ] Ne plus suivre
- [ ] Récupérer followers
- [ ] Récupérer following

---

## ❌ Dépannage

### Le script PowerShell ne s'exécute pas

**Erreur:** "Impossible de charger le fichier... car l'exécution de scripts est désactivée"

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Le backend n'est pas accessible

**Erreur:** "Connection refused" ou "Cannot connect"

**Solution:**
```bash
cd backend
npm run dev
```

### Token non valide

**Erreur:** "Unauthorized" ou "Token not found"

**Solution:**
- Vérifiez que vous êtes connecté
- Relancez le login
- Vérifiez que le cookie est bien envoyé

### Onboarding déjà complété

**Erreur:** "Onboarding already completed"

**Solution:**
C'est normal si vous avez déjà complété l'onboarding. Passez aux tests suivants.

---

## 📝 Notes Importantes

1. **Les tests créent de vraies données** dans la base MongoDB
2. **Le token JWT expire** après un certain temps (vérifiez le .env)
3. **Les cookies sont stockés** dans `cookies.txt` ou `test-cookies.txt`
4. **Le port par défaut** est 3001 (peut être changé dans .env)

---

## 🎉 Tout est Prêt!

Vous pouvez maintenant:
1. ✅ Exécuter le script automatisé
2. ✅ Tester manuellement avec cURL
3. ✅ Utiliser Postman
4. ✅ Intégrer avec le frontend

**Backend:** http://localhost:3001
**Status:** ✅ Opérationnel
**Documentation complète:** `TEST-INVESTOR-SOCIAL.md`
