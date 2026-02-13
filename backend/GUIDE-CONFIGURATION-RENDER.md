# 🚀 Guide Complet : Configurer Render pour l'Envoi d'Emails Automatique

**Plateforme Backend:** Render
**Plateforme Frontend:** Vercel
**Base de données:** MongoDB Atlas
**Service Email:** Brevo (SMTP)

---

## 📋 Table des Matières

1. [Comprendre le Problème](#comprendre-le-problème)
2. [Prérequis](#prérequis)
3. [Étape 1 : Se Connecter à Render](#étape-1--se-connecter-à-render)
4. [Étape 2 : Localiser Votre Service Backend](#étape-2--localiser-votre-service-backend)
5. [Étape 3 : Configurer les Variables d'Environnement](#étape-3--configurer-les-variables-denvironnement)
6. [Étape 4 : Redéployer l'Application](#étape-4--redéployer-lapplication)
7. [Étape 5 : Vérifier les Logs](#étape-5--vérifier-les-logs)
8. [Étape 6 : Tester l'Envoi d'Emails](#étape-6--tester-lenvoi-demails)
9. [Dépannage](#dépannage)
10. [Vérification Finale](#vérification-finale)

---

## 🎯 Comprendre le Problème

### Pourquoi les Emails ne S'Envoient Pas ?

Sur **Render**, les fichiers `.env` ne sont **PAS utilisés automatiquement**. Contrairement au développement local où le fichier `.env` est lu par `dotenv`, **en production sur Render** :

❌ **Ce fichier est IGNORÉ** :
```
backend/.env
```

✅ **Il faut configurer les variables ICI** :
```
Dashboard Render → Service → Environment → Environment Variables
```

### Analogie Simple

C'est comme avoir une clé dans votre poche (`.env` local) vs avoir la clé accrochée au mur de votre maison (variables Render). Quand vous êtes sur le serveur Render, il faut que les clés soient **sur le serveur**, pas dans votre poche locale !

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir :

- [ ] Un compte Render actif
- [ ] Accès au dashboard Render (https://dashboard.render.com)
- [ ] Votre service backend déjà déployé sur Render
- [ ] Les identifiants SMTP Brevo (déjà configurés dans votre `.env` local)

---

## Étape 1 : Se Connecter à Render

### 1.1 Aller sur le Dashboard

1. Ouvrez votre navigateur
2. Allez sur : **https://dashboard.render.com**
3. Connectez-vous avec vos identifiants

### 1.2 Vue du Dashboard

Vous devriez voir une liste de vos services :

```
┌─────────────────────────────────────────────────────┐
│ Render Dashboard                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Services                                            │
│                                                     │
│ 🟢 afribourse-backend        Web Service           │
│    https://afribourse-backend.onrender.com         │
│                                                     │
│ 🟢 autre-service             Web Service           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Étape 2 : Localiser Votre Service Backend

### 2.1 Trouver le Bon Service

Cherchez votre service backend dans la liste. Il pourrait s'appeler :
- `afribourse-backend`
- `africbourse-api`
- `backend`
- Ou un nom similaire que vous avez choisi

### 2.2 Cliquer sur le Service

Cliquez sur le nom du service pour ouvrir sa page de détails.

### 2.3 Identifier l'URL de Production

Notez l'URL de votre backend, par exemple :
```
https://afribourse-backend.onrender.com
```

ou

```
https://africbourse-api.onrender.com
```

**⚠️ IMPORTANT** : Vous aurez besoin de cette URL pour la variable `BACKEND_URL` !

---

## Étape 3 : Configurer les Variables d'Environnement

### 3.1 Accéder aux Variables d'Environnement

Dans la page de votre service :

1. Regardez le menu de gauche
2. Cliquez sur **"Environment"**
3. Vous verrez une section **"Environment Variables"**

```
┌─────────────────────────────────────────────────────┐
│ Menu                                                │
├─────────────────────────────────────────────────────┤
│ ○ Dashboard                                         │
│ ● Environment          ← CLIQUEZ ICI               │
│ ○ Settings                                          │
│ ○ Logs                                              │
│ ○ Shell                                             │
│ ○ Events                                            │
└─────────────────────────────────────────────────────┘
```

### 3.2 Variables Existantes

Vous verrez probablement déjà quelques variables :

```
┌─────────────────────────────────────────────────────┐
│ Environment Variables                               │
├─────────────────────────────────────────────────────┤
│ NODE_ENV = production                               │
│ PORT = 3001                                         │
│ DATABASE_URI = mongodb+srv://...                    │
└─────────────────────────────────────────────────────┘
```

### 3.3 Ajouter les Variables SMTP

Cliquez sur **"Add Environment Variable"** ou **"+ Add"**.

Pour chaque variable ci-dessous, suivez ces étapes :

1. Cliquez sur **"Add Environment Variable"**
2. Dans le champ **"Key"**, tapez le nom de la variable
3. Dans le champ **"Value"**, tapez la valeur
4. Cliquez sur **"Save"** ou continuez avec la suivante

#### Variables à Ajouter (une par une)

| Key | Value | Description |
|-----|-------|-------------|
| `SMTP_HOST` | `smtp-relay.brevo.com` | Serveur SMTP Brevo |
| `SMTP_PORT` | `587` | Port SMTP (TLS) |
| `SMTP_USER` | `9ab467001@smtp-brevo.com` | Identifiant SMTP Brevo |
| `SMTP_PASS` | `***REMOVED***` | Mot de passe SMTP Brevo |
| `SMTP_FROM_EMAIL` | `noreply@africbourse.com` | Email expéditeur |
| `SMTP_FROM_NAME` | `AfriBourse` | Nom de l'expéditeur |

#### Variables d'URL à Ajouter/Vérifier

| Key | Value | Description |
|-----|-------|-------------|
| `FRONTEND_URL` | `https://www.africbourse.com` | URL du frontend Vercel |
| `BACKEND_URL` | `https://VOTRE-SERVICE.onrender.com` | URL de votre backend Render |

**⚠️ IMPORTANT** : Remplacez `VOTRE-SERVICE.onrender.com` par la vraie URL de votre service Render !

#### Variables Supplémentaires (si absentes)

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Mode de production |
| `JWT_SECRET` | `votre-clé-secrète-unique-et-complexe` | Clé JWT (changez-la !) |
| `JWT_EXPIRES_IN` | `7d` | Durée de validité du token |
| `CORS_ORIGIN` | `https://www.africbourse.com,https://africbourse.com` | Origines CORS autorisées |

### 3.4 Exemple Visuel

Après avoir ajouté toutes les variables, vous devriez voir :

```
┌─────────────────────────────────────────────────────────────────┐
│ Environment Variables                                           │
├─────────────────────────────────────────────────────────────────┤
│ NODE_ENV = production                                           │
│ PORT = 3001                                                     │
│ DATABASE_URI = mongodb+srv://afribourse_admin:...               │
│                                                                 │
│ SMTP_HOST = smtp-relay.brevo.com                                │
│ SMTP_PORT = 587                                                 │
│ SMTP_USER = 9ab467001@smtp-brevo.com                            │
│ SMTP_PASS = ******************** (masqué)                       │
│ SMTP_FROM_EMAIL = noreply@africbourse.com                       │
│ SMTP_FROM_NAME = AfriBourse                                     │
│                                                                 │
│ FRONTEND_URL = https://www.africbourse.com                      │
│ BACKEND_URL = https://afribourse-backend.onrender.com           │
│                                                                 │
│ JWT_SECRET = ******************** (masqué)                      │
│ JWT_EXPIRES_IN = 7d                                             │
│ CORS_ORIGIN = https://www.africbourse.com,https://africbourse...│
│                                                                 │
│ [+ Add Environment Variable]                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 Sauvegarder les Changements

1. Vérifiez que toutes les variables sont correctes
2. Cliquez sur **"Save Changes"** en haut de la page

---

## Étape 4 : Redéployer l'Application

### 4.1 Redéploiement Automatique

**Bonne nouvelle** : Render redéploie **automatiquement** votre service quand vous modifiez les variables d'environnement !

Vous verrez un message comme :
```
🔄 Deploying...
⏳ Your service is being redeployed with the new environment variables.
```

### 4.2 Redéploiement Manuel (si nécessaire)

Si le redéploiement automatique ne se lance pas :

1. Allez dans le menu de gauche
2. Cliquez sur **"Manual Deploy"**
3. Sélectionnez **"Deploy latest commit"**
4. Cliquez sur **"Deploy"**

```
┌─────────────────────────────────────────────────────┐
│ Manual Deploy                                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Branch: master                        ✓             │
│                                                     │
│ [Clear build cache & deploy]                        │
│ [Deploy latest commit]              ← CLIQUEZ ICI  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.3 Suivre le Déploiement

Le déploiement peut prendre **2 à 5 minutes**.

Vous verrez les étapes :
```
Building...
Installing dependencies...
Starting server...
Live ✅
```

Attendez que le statut devienne **"Live"** avec un point vert 🟢.

---

## Étape 5 : Vérifier les Logs

### 5.1 Accéder aux Logs

1. Dans le menu de gauche, cliquez sur **"Logs"**
2. Les logs s'affichent en temps réel

```
┌─────────────────────────────────────────────────────┐
│ Menu                                                │
├─────────────────────────────────────────────────────┤
│ ○ Dashboard                                         │
│ ○ Environment                                       │
│ ○ Settings                                          │
│ ● Logs                 ← CLIQUEZ ICI               │
│ ○ Shell                                             │
│ ○ Events                                            │
└─────────────────────────────────────────────────────┘
```

### 5.2 Messages à Chercher

#### ✅ Signes de Succès

Cherchez ces lignes dans les logs :

```
🚀 Serveur lancé sur http://0.0.0.0:3001
✅ Base de données connectée
```

ou

```
Server is running on port 3001
Connected to MongoDB successfully
```

#### ❌ Signes d'Erreur

Si vous voyez des erreurs liées à SMTP :

```
❌ Error: Environment variable SMTP_HOST is required
```
→ **Solution** : La variable n'a pas été ajoutée. Retournez à l'Étape 3.

```
❌ Error: connect ETIMEDOUT smtp-relay.brevo.com:587
```
→ **Solution** : Render bloque le port 587. Voir [Dépannage](#dépannage).

```
❌ Error: Invalid login: 535 Authentication failed
```
→ **Solution** : Vérifiez `SMTP_USER` et `SMTP_PASS`.

### 5.3 Filtrer les Logs

Pour voir uniquement les logs liés aux emails :

1. Utilisez la barre de recherche dans les logs
2. Cherchez : `EMAIL` ou `SMTP` ou `REGISTER`

---

## Étape 6 : Tester l'Envoi d'Emails

### 6.1 Test via l'API Directement

Utilisez `curl` ou Postman pour tester l'inscription :

```bash
curl -X POST https://VOTRE-SERVICE.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "lastname": "Render",
    "email": "votre-email-reel@example.com",
    "password": "Test123456"
  }'
```

**⚠️ Remplacez** :
- `VOTRE-SERVICE.onrender.com` par votre vraie URL Render
- `votre-email-reel@example.com` par un VRAI email que vous possédez

#### Réponse Attendue

```json
{
  "message": "Inscription réussie ! Un email de confirmation a été envoyé...",
  "emailSent": true,
  "user": {
    "id": "...",
    "name": "Test",
    "email": "votre-email-reel@example.com"
  }
}
```

**✅ Si `emailSent: true`** → L'email a été envoyé !

### 6.2 Vérifier dans les Logs Render

En même temps que le test, regardez les logs :

```
📧 [REGISTER] Préparation de l'envoi de l'email de confirmation pour votre-email-reel@example.com
   → Token: abc123...
   → Expire le: 2026-01-06T...
📧 [EMAIL] Tentative d'envoi d'email:
   → Destinataire: votre-email-reel@example.com
   → Sujet: Confirmez votre inscription - AfriBourse
   → Expéditeur: "AfriBourse" <noreply@africbourse.com>
   → Serveur SMTP: smtp-relay.brevo.com:587
✅ [EMAIL] Email envoyé avec succès!
   → Message ID: <abc123@africbourse.com>
✅ [REGISTER] Email de confirmation envoyé avec succès
```

### 6.3 Vérifier dans Brevo

1. Allez sur **https://app.brevo.com**
2. Connectez-vous
3. Allez dans **Campaigns** → **Transactional**
4. Vous devriez voir l'email envoyé dans les statistiques

### 6.4 Vérifier Votre Boîte Mail

1. Ouvrez votre boîte email (celle que vous avez utilisée pour le test)
2. Cherchez un email de **AfriBourse** ou **noreply@africbourse.com**
3. **Vérifiez aussi le dossier SPAM !**

#### Email Reçu

L'email devrait ressembler à :

```
De: AfriBourse <noreply@africbourse.com>
Sujet: Confirmez votre inscription - AfriBourse

Bienvenue Test !

Merci de vous être inscrit sur AfriBourse...

[Confirmer mon email]

Ce lien expire dans 24 heures.
```

### 6.5 Test depuis le Frontend

1. Allez sur **https://www.africbourse.com/inscription**
2. Remplissez le formulaire avec un **VRAI email**
3. Soumettez le formulaire
4. Vérifiez votre boîte mail (et SPAM)

---

## 🔧 Dépannage

### Problème 1 : Port 587 Bloqué par Render

#### Symptôme

Dans les logs :
```
❌ Error: connect ETIMEDOUT smtp-relay.brevo.com:587
```

#### Cause

Render Free Tier bloque parfois le port 587 (SMTP).

#### Solution A : Utiliser le Port 465 (SSL)

1. **Modifier le code** dans `src/config/mailer.ts` :

```typescript
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: 465, // ← CHANGÉ de 587 à 465
  secure: true, // ← CHANGÉ de false à true
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});
```

2. **Sur Render, changer la variable** :
   - `SMTP_PORT` = `465` (au lieu de `587`)

3. **Redéployer** :
   - Pousser le code sur GitHub
   - Render redéploiera automatiquement

4. **Tester à nouveau**

#### Solution B : Passer au Plan Payant Render

Le plan payant (7$/mois) n'a pas de restrictions de ports.

1. Allez dans **Settings**
2. Cherchez **Upgrade Plan**
3. Choisissez le plan Starter (7$/mois)

#### Solution C : Utiliser SendGrid

Alternative à Brevo :

1. Créez un compte sur **https://sendgrid.com** (2000 emails/mois gratuits)
2. Obtenez une API Key
3. Modifiez le code pour utiliser SendGrid au lieu de SMTP

---

### Problème 2 : Variables Non Prises en Compte

#### Symptôme

Les logs montrent :
```
❌ Environment variable SMTP_HOST is required
```

#### Cause

Les variables ne sont pas configurées ou mal sauvegardées.

#### Solution

1. Retournez dans **Environment**
2. Vérifiez que **toutes** les variables SMTP sont présentes
3. Cliquez sur **"Save Changes"**
4. Forcez un redéploiement manuel

---

### Problème 3 : Identifiants SMTP Invalides

#### Symptôme

```
❌ Error: Invalid login: 535 Authentication failed
```

#### Cause

`SMTP_USER` ou `SMTP_PASS` est incorrect.

#### Solution

1. Vérifiez dans votre compte Brevo :
   - Allez sur https://app.brevo.com
   - **Settings** → **SMTP & API**
   - Vérifiez le **SMTP Login** et régénérez le **SMTP Key** si nécessaire

2. Mettez à jour sur Render :
   - Modifiez `SMTP_USER` et `SMTP_PASS`
   - Sauvegardez

---

### Problème 4 : Emails Vont en SPAM

#### Symptôme

Les emails sont envoyés mais arrivent dans le dossier SPAM.

#### Solutions

1. **Vérifier le domaine dans Brevo** :
   - Allez sur https://app.brevo.com
   - **Senders, Domains & Dedicated IPs**
   - Ajoutez et vérifiez le domaine `africbourse.com`
   - Configurez les enregistrements DNS (SPF, DKIM)

2. **Utiliser un email vérifié** :
   - Changez `SMTP_FROM_EMAIL` pour utiliser un email du domaine vérifié

3. **Éviter les mots-clés SPAM** :
   - Vérifiez le contenu de l'email dans `email.service.ts`

---

### Problème 5 : Le Service ne Redémarre Pas

#### Symptôme

Après avoir changé les variables, rien ne se passe.

#### Solution

1. Forcez un redéploiement manuel :
   - Menu → **Manual Deploy**
   - **"Deploy latest commit"**

2. Ou redémarrez le service :
   - Menu → **Settings**
   - Scroll vers le bas
   - **"Suspend Service"** puis **"Resume Service"**

---

## ✅ Vérification Finale

### Checklist Complète

Avant de considérer que tout fonctionne, vérifiez :

#### Sur Render Dashboard

- [ ] Toutes les variables SMTP sont configurées
- [ ] `SMTP_HOST` = `smtp-relay.brevo.com`
- [ ] `SMTP_PORT` = `587` (ou `465` si port 587 bloqué)
- [ ] `SMTP_USER` = `9ab467001@smtp-brevo.com`
- [ ] `SMTP_PASS` = `***REMOVED***`
- [ ] `SMTP_FROM_EMAIL` = `noreply@africbourse.com`
- [ ] `SMTP_FROM_NAME` = `AfriBourse`
- [ ] `FRONTEND_URL` = `https://www.africbourse.com`
- [ ] `BACKEND_URL` = URL de votre service Render
- [ ] Le service est **Live** 🟢

#### Dans les Logs

- [ ] Aucune erreur SMTP
- [ ] Message `🚀 Serveur lancé sur...`
- [ ] Message `✅ Base de données connectée`

#### Tests d'Envoi

- [ ] Test via `curl` → `emailSent: true`
- [ ] Email reçu dans la boîte de réception (ou SPAM)
- [ ] Email visible dans les statistiques Brevo
- [ ] Inscription depuis le frontend fonctionne

---

## 🎯 Récapitulatif : Ce Que Vous Avez Fait

1. ✅ Vous avez configuré les variables d'environnement sur Render
2. ✅ Vous avez redéployé votre service backend
3. ✅ Vous avez vérifié les logs pour détecter les erreurs
4. ✅ Vous avez testé l'envoi d'emails
5. ✅ Vous avez vérifié la réception des emails

---

## 📞 Support

### Si Ça Ne Fonctionne Toujours Pas

Collectez ces informations :

1. **Nom de votre service Render** : `_____________`
2. **URL de votre backend** : `https://_______________.onrender.com`
3. **Les 20 dernières lignes des logs** (copiez-les)
4. **Résultat du test curl** (copiez la réponse JSON)
5. **Capture d'écran des variables d'environnement** (masquez les mots de passe)

Avec ces informations, vous pourrez demander de l'aide ou déboguer plus facilement.

---

## 🎉 Félicitations !

Si vous avez suivi toutes les étapes et que les tests fonctionnent, **vos emails sont maintenant envoyés automatiquement** lors des inscriptions sur votre plateforme AfriBourse !

Les utilisateurs recevront désormais leurs emails de confirmation sans intervention manuelle. 🚀

---

**Dernière mise à jour** : 05 Janvier 2026
**Plateforme** : Render + Vercel + MongoDB Atlas + Brevo
