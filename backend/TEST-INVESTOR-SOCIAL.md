# Guide de Test - Investor Profile & Social Features

Ce guide vous explique comment tester les nouvelles fonctionnalités **Investor Profile** et **Social Posts/Follow**.

## 📋 Prérequis

1. **Backend en cours d'exécution**
   ```bash
   cd backend
   npm run dev
   ```

2. **Un compte utilisateur valide**
   - Vous devez avoir un compte créé et confirmé
   - Notez votre email et mot de passe

3. **Outils requis**
   - **Windows**: PowerShell (déjà installé)
   - **Linux/Mac**: Bash et `jq` (pour formatter le JSON)
     ```bash
     # Installation de jq sur Ubuntu/Debian
     sudo apt-get install jq

     # Installation sur Mac
     brew install jq
     ```

## 🚀 Exécution des Tests

### Option 1: Script PowerShell (Windows)

```powershell
cd backend
.\test-investor-social.ps1
```

Le script va:
1. Vous demander votre email et mot de passe
2. Exécuter automatiquement tous les tests
3. Afficher les résultats en couleur (✓ succès, ✗ échec)

### Option 2: Script Bash (Linux/Mac)

```bash
cd backend
chmod +x test-investor-social.sh
./test-investor-social.sh
```

### Option 3: Tests manuels avec cURL

Si vous préférez tester manuellement, suivez les étapes ci-dessous.

## 📝 Tests Manuels Détaillés

### Étape 0: Login et Récupération du Token

```bash
# Login
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre@email.com",
    "password": "votreMotDePasse"
  }'

# Le token JWT sera automatiquement stocké dans cookies.txt
```

### 1. Tests Investor Profile

#### A. Vérifier le Statut d'Onboarding

```bash
curl -b cookies.txt -X GET http://localhost:5000/api/investor-profile/onboarding/status
```

**Réponse attendue:**
```json
{
  "onboardingCompleted": false,
  "message": "Onboarding not completed"
}
```

#### B. Compléter l'Onboarding

```bash
curl -b cookies.txt -X POST http://localhost:5000/api/investor-profile/onboarding/complete \
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

**Réponse attendue:**
```json
{
  "message": "Onboarding completed successfully",
  "profile": {
    "investor_dna": {
      "risk_profile": "MODERATE",
      "investment_horizon": "LONG_TERM",
      ...
    },
    "onboarding_completed": true
  }
}
```

#### C. Récupérer le Profil Complet

```bash
curl -b cookies.txt -X GET http://localhost:5000/api/investor-profile
```

#### D. Mettre à Jour l'ADN Investisseur

```bash
curl -b cookies.txt -X PUT http://localhost:5000/api/investor-profile/dna \
  -H "Content-Type: application/json" \
  -d '{
    "risk_profile": "AGGRESSIVE",
    "monthly_investment": 100000
  }'
```

#### E. Mettre à Jour les Paramètres de Confidentialité

```bash
curl -b cookies.txt -X PUT http://localhost:5000/api/investor-profile/privacy \
  -H "Content-Type: application/json" \
  -d '{
    "show_portfolio": false,
    "show_performance": true,
    "show_activity": true
  }'
```

### 2. Tests Social Posts

#### A. Créer un Post - Opinion

```bash
curl -b cookies.txt -X POST http://localhost:5000/api/social/posts \
  -H "Content-Type: application/json" \
  -d '{
    "type": "OPINION",
    "content": "SONATEL est une excellente opportunité pour les investisseurs à long terme!",
    "stock_symbol": "SNTS",
    "tags": ["BRVM", "Dividendes"],
    "visibility": "PUBLIC"
  }'
```

**Réponse attendue:**
```json
{
  "message": "Post created successfully",
  "post": {
    "_id": "...",
    "type": "OPINION",
    "content": "SONATEL est une excellente opportunité...",
    "author": {...},
    "likes_count": 0,
    "comments_count": 0
  }
}
```

#### B. Créer un Post - Analyse

```bash
curl -b cookies.txt -X POST http://localhost:5000/api/social/posts \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ANALYSIS",
    "content": "Analyse technique de BOABF: Le cours a franchi une résistance importante à 5000 FCFA",
    "stock_symbol": "BOABF",
    "tags": ["Analyse technique", "BRVM"],
    "visibility": "PUBLIC"
  }'
```

#### C. Créer un Post - Question

```bash
curl -b cookies.txt -X POST http://localhost:5000/api/social/posts \
  -H "Content-Type: application/json" \
  -d '{
    "type": "QUESTION",
    "content": "Que pensez-vous de TTLS après l'\''annonce des résultats trimestriels ?",
    "stock_symbol": "TTLS",
    "tags": ["Question", "Résultats"],
    "visibility": "PUBLIC"
  }'
```

#### D. Récupérer le Feed

```bash
curl -b cookies.txt -X GET "http://localhost:5000/api/social/feed?page=1&limit=10"
```

#### E. Récupérer les Posts d'un Utilisateur

```bash
curl -b cookies.txt -X GET "http://localhost:5000/api/social/posts/USER_ID_HERE"
```

### 3. Tests Likes

#### A. Liker un Post

```bash
curl -b cookies.txt -X POST http://localhost:5000/api/social/posts/POST_ID_HERE/like
```

**Réponse attendue:**
```json
{
  "message": "Post liked successfully",
  "likes_count": 1
}
```

#### B. Unliker un Post

```bash
curl -b cookies.txt -X DELETE http://localhost:5000/api/social/posts/POST_ID_HERE/like
```

### 4. Tests Comments

#### A. Commenter un Post

```bash
curl -b cookies.txt -X POST http://localhost:5000/api/social/posts/POST_ID_HERE/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Très bonne analyse, je suis d'\''accord avec votre point de vue!"
  }'
```

#### B. Récupérer les Commentaires

```bash
curl -b cookies.txt -X GET "http://localhost:5000/api/social/posts/POST_ID_HERE/comments"
```

### 5. Tests Follow System

#### A. Suivre un Utilisateur

```bash
curl -b cookies.txt -X POST http://localhost:5000/api/social/follow/USER_ID_HERE
```

**Réponse attendue:**
```json
{
  "message": "Successfully followed user",
  "following_count": 1
}
```

#### B. Ne Plus Suivre

```bash
curl -b cookies.txt -X DELETE http://localhost:5000/api/social/follow/USER_ID_HERE
```

#### C. Récupérer les Followers

```bash
curl -b cookies.txt -X GET http://localhost:5000/api/social/followers/USER_ID_HERE
```

#### D. Récupérer les Following

```bash
curl -b cookies.txt -X GET http://localhost:5000/api/social/following/USER_ID_HERE
```

## 🔍 Vérifications à Faire

### 1. Base de Données

Vérifiez que les collections sont créées:

```bash
# Connectez-vous à MongoDB
mongosh

# Sélectionnez votre base de données
use afribourse

# Vérifiez les collections
show collections

# Vérifiez les données
db.investorprofiles.find().pretty()
db.socialposts.find().pretty()
db.follows.find().pretty()
```

### 2. Logs Backend

Surveillez les logs du backend pendant les tests:

```bash
cd backend
npm run dev
```

Les logs devraient afficher:
- `✓ POST /api/investor-profile/onboarding/complete 200`
- `✓ POST /api/social/posts 201`
- `✓ GET /api/social/feed 200`

### 3. Validation des Données

#### Investor Profile
- ✓ `onboarding_completed` doit être `true` après onboarding
- ✓ `investor_dna` doit contenir toutes les données
- ✓ `privacy_settings` doit avoir les valeurs par défaut

#### Social Posts
- ✓ `author` doit contenir `username`, `avatar`, `investor_level`
- ✓ `likes_count` et `comments_count` doivent être corrects
- ✓ `type` doit être l'un de: OPINION, ANALYSIS, QUESTION, NEWS

#### Follow System
- ✓ Impossible de se suivre soi-même
- ✓ Impossible de suivre deux fois la même personne
- ✓ Les compteurs `followers_count` et `following_count` doivent être corrects

## ❌ Erreurs Courantes

### 1. "Token not found"
**Solution:** Assurez-vous d'être connecté et d'utiliser le cookie token

### 2. "Onboarding already completed"
**Solution:** C'est normal si vous avez déjà complété l'onboarding. Testez les autres fonctionnalités.

### 3. "Cannot follow yourself"
**Solution:** Vous essayez de vous suivre vous-même. Utilisez un autre USER_ID.

### 4. "Already following this user"
**Solution:** Vous suivez déjà cet utilisateur. Testez le unfollow d'abord.

### 5. "Post not found"
**Solution:** Vérifiez que le POST_ID existe et est correct.

## 📊 Résultats Attendus

Après avoir exécuté tous les tests avec succès:

- ✓ **13/13 tests** devraient être en **vert** (✓)
- ✓ Votre profil investisseur doit être complet
- ✓ Vous devez avoir créé au moins 2 posts
- ✓ Les likes et commentaires doivent fonctionner
- ✓ Le système de follow doit être opérationnel

## 🆘 Support

Si vous rencontrez des problèmes:

1. Vérifiez que le backend est lancé: `npm run dev`
2. Vérifiez que MongoDB est connecté
3. Consultez les logs du backend
4. Vérifiez que votre compte est confirmé
5. Assurez-vous d'utiliser le bon token JWT

## 📝 Notes

- Les scripts automatisés créent des données de test réalistes
- Vous pouvez réexécuter les scripts autant de fois que nécessaire
- Les données de test ne seront pas supprimées automatiquement
- Utilisez les mêmes scripts pour tester en développement et en production
