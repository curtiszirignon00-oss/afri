# Guide de Confirmation d'Email - AfriBourse

## 📋 Vue d'ensemble

Ce système permet de vérifier l'adresse email des nouveaux utilisateurs lors de leur inscription. Un email contenant un lien de confirmation unique est envoyé automatiquement après l'inscription.

## 🔑 Fonctionnalités implémentées

### 1. Inscription avec envoi d'email de confirmation
- ✅ Génération automatique d'un token unique et sécurisé (64 caractères hexadécimaux)
- ✅ Stockage du token et de sa date d'expiration (24 heures) dans la base de données
- ✅ Envoi automatique d'un email HTML stylisé à l'utilisateur
- ✅ L'utilisateur ne peut pas se connecter tant que son email n'est pas confirmé

### 2. Confirmation d'email
- ✅ Validation du token de confirmation
- ✅ Vérification de l'expiration du token (24 heures)
- ✅ Mise à jour du statut de vérification de l'utilisateur
- ✅ Suppression du token après confirmation

### 3. Renvoi d'email de confirmation
- ✅ Permet de renvoyer un email si l'utilisateur ne l'a pas reçu
- ✅ Génération d'un nouveau token à chaque demande
- ✅ Protection contre la révélation d'emails existants

### 4. Protection de la connexion
- ✅ Blocage de la connexion si l'email n'est pas vérifié
- ✅ Message d'erreur clair pour guider l'utilisateur

## 🗄️ Modifications de la base de données

### Champs ajoutés au modèle User

\`\`\`prisma
model User {
  // ... champs existants
  email_verified_at           DateTime?  // Date de vérification de l'email
  email_confirmation_token    String?    // Token de confirmation unique
  email_confirmation_expires  DateTime?  // Date d'expiration du token
}
\`\`\`

**Note:** Le client Prisma a déjà été régénéré avec ces nouveaux champs.

## 🛣️ Endpoints API

### POST /api/auth/register
**Description:** Inscription d'un nouvel utilisateur avec envoi d'email de confirmation

**Corps de la requête:**
\`\`\`json
{
  "name": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "password": "motdepasse123"
}
\`\`\`

**Réponse (201):**
\`\`\`json
{
  "message": "Inscription réussie ! Un email de confirmation a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception.",
  "user": {
    "id": "...",
    "name": "John",
    "lastname": "Doe",
    "email": "john.doe@example.com",
    "role": "user"
  },
  "emailSent": true
}
\`\`\`

---

### GET /api/auth/confirm-email?token={token}
**Description:** Confirme l'email de l'utilisateur avec le token fourni

**Paramètres de requête:**
- \`token\` (string, requis): Le token de confirmation reçu par email

**Réponse succès (200):**
\`\`\`json
{
  "message": "Votre email a été confirmé avec succès ! Vous pouvez maintenant vous connecter.",
  "verified": true
}
\`\`\`

**Réponse email déjà confirmé (200):**
\`\`\`json
{
  "message": "Votre email a déjà été confirmé. Vous pouvez vous connecter.",
  "alreadyVerified": true
}
\`\`\`

**Réponse erreur - token expiré (400):**
\`\`\`json
{
  "error": "Le token de confirmation a expiré. Veuillez demander un nouveau lien."
}
\`\`\`

---

### POST /api/auth/resend-confirmation
**Description:** Renvoie un email de confirmation à l'utilisateur

**Corps de la requête:**
\`\`\`json
{
  "email": "john.doe@example.com"
}
\`\`\`

**Réponse (200):**
\`\`\`json
{
  "message": "Un nouvel email de confirmation a été envoyé à votre adresse.",
  "emailSent": true
}
\`\`\`

**Note:** Pour des raisons de sécurité, l'API ne révèle pas si l'email existe ou non dans le système.

---

### POST /api/auth/login
**Description:** Connexion de l'utilisateur (nécessite un email vérifié)

**Corps de la requête:**
\`\`\`json
{
  "email": "john.doe@example.com",
  "password": "motdepasse123"
}
\`\`\`

**Réponse erreur - email non vérifié (403):**
\`\`\`json
{
  "error": "Veuillez confirmer votre adresse email avant de vous connecter. Vérifiez votre boîte de réception."
}
\`\`\`

## ⚙️ Configuration SMTP

### 1. Variables d'environnement requises

Ajoutez ces variables dans votre fichier \`.env\`:

\`\`\`env
# Configuration des emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application

# URL du frontend (pour les liens de confirmation)
FRONTEND_URL=http://localhost:5173

# URL du backend
BACKEND_URL=http://localhost:3001
\`\`\`

### 2. Configuration pour Gmail

Si vous utilisez Gmail, vous devez:

1. **Activer l'authentification à deux facteurs** sur votre compte Google
2. **Générer un mot de passe d'application:**
   - Allez dans votre compte Google → Sécurité
   - Recherchez "Mots de passe d'application"
   - Sélectionnez "Autre (nom personnalisé)"
   - Entrez "AfriBourse Backend"
   - Copiez le mot de passe généré (16 caractères)
   - Utilisez ce mot de passe dans \`SMTP_PASS\`

### 3. Autres services SMTP

Vous pouvez utiliser d'autres services comme:

**Mailtrap (pour le développement):**
\`\`\`env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=votre-username-mailtrap
SMTP_PASS=votre-password-mailtrap
\`\`\`

**SendGrid:**
\`\`\`env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=votre-api-key-sendgrid
\`\`\`

**Outlook/Hotmail:**
\`\`\`env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=votre-email@outlook.com
SMTP_PASS=votre-mot-de-passe
\`\`\`

## 🎨 Template d'email

L'email envoyé aux utilisateurs contient:
- ✅ Logo et branding AfriBourse
- ✅ Message de bienvenue personnalisé
- ✅ Bouton de confirmation cliquable
- ✅ Lien de confirmation en texte (au cas où le bouton ne fonctionnerait pas)
- ✅ Avertissement d'expiration (24 heures)
- ✅ Design responsive et professionnel
- ✅ Version texte pour les clients email qui ne supportent pas HTML

## 🔧 Fichiers créés/modifiés

### Nouveaux fichiers
- \`backend/src/services/email.service.ts\` - Service d'envoi d'emails
- \`backend/src/utils/token.utils.ts\` - Utilitaires de génération de tokens
- \`backend/CONFIRMATION_EMAIL_GUIDE.md\` - Ce guide

### Fichiers modifiés
- \`backend/prisma/schema.prisma\` - Ajout des champs de confirmation
- \`backend/src/config/environnement.ts\` - Ajout de la config \`app.frontendUrl\`
- \`backend/src/controllers/auth.controller.ts\` - Ajout des fonctions de confirmation
- \`backend/src/services/users.service.prisma.ts\` - Ajout des méthodes de confirmation
- \`backend/src/routes/auth.routes.ts\` - Ajout des routes de confirmation

## 🧪 Tests

### Test manuel du flux complet

1. **Inscription:**
   \`\`\`bash
   curl -X POST http://localhost:3001/api/auth/register \\
     -H "Content-Type: application/json" \\
     -d '{
       "name": "Test",
       "lastname": "User",
       "email": "test@example.com",
       "password": "password123"
     }'
   \`\`\`

2. **Vérifier l'email** et cliquer sur le lien de confirmation

3. **Tenter de se connecter avant confirmation (devrait échouer):**
   \`\`\`bash
   curl -X POST http://localhost:3001/api/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   \`\`\`

4. **Confirmer l'email:**
   \`\`\`bash
   curl -X GET "http://localhost:3001/api/auth/confirm-email?token={TOKEN_REÇU_PAR_EMAIL}"
   \`\`\`

5. **Se connecter après confirmation (devrait réussir):**
   \`\`\`bash
   curl -X POST http://localhost:3001/api/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   \`\`\`

6. **Renvoyer l'email de confirmation:**
   \`\`\`bash
   curl -X POST http://localhost:3001/api/auth/resend-confirmation \\
     -H "Content-Type: application/json" \\
     -d '{
       "email": "test@example.com"
     }'
   \`\`\`

## 🎯 Flux utilisateur complet

1. **Utilisateur s'inscrit** → Reçoit un email avec un lien de confirmation
2. **Utilisateur clique sur le lien** → Email confirmé, peut maintenant se connecter
3. **Si l'email n'arrive pas** → Utilisateur peut demander un renvoi
4. **Si le token expire (>24h)** → Utilisateur doit demander un nouveau lien
5. **Utilisateur se connecte** → Accès complet à la plateforme

## 🚀 Déploiement en production

### Points importants:

1. **Configurer les variables d'environnement:**
   - \`FRONTEND_URL\`: URL de votre frontend en production (ex: https://afribourse.com)
   - \`SMTP_*\`: Utiliser un service SMTP fiable (SendGrid, Mailgun, etc.)

2. **Sécurité:**
   - ✅ Les tokens sont générés avec \`crypto.randomBytes\` (sécurisé)
   - ✅ Les tokens expirent après 24 heures
   - ✅ Les tokens sont supprimés après utilisation
   - ✅ Les mots de passe sont hashés avec bcrypt

3. **Performance:**
   - Les emails sont envoyés de manière asynchrone
   - En cas d'échec d'envoi, l'inscription n'est pas bloquée
   - L'utilisateur peut toujours renvoyer l'email

## 📝 Notes importantes

- Le système ne révèle jamais si un email existe dans la base de données (sécurité)
- Les tokens de confirmation sont à usage unique
- Un utilisateur peut demander plusieurs fois le renvoi d'email (nouveau token à chaque fois)
- L'ancien token est invalidé lors de la génération d'un nouveau

## 🐛 Dépannage

### L'email n'est pas envoyé
1. Vérifiez les variables SMTP dans le \`.env\`
2. Vérifiez les logs du serveur pour voir les erreurs
3. Testez avec Mailtrap en développement
4. Vérifiez que le port SMTP n'est pas bloqué par votre firewall

### Le lien de confirmation ne fonctionne pas
1. Vérifiez que \`FRONTEND_URL\` est correct dans le \`.env\`
2. Vérifiez que le token n'a pas expiré (24h)
3. Vérifiez que le frontend a bien une route \`/confirmer-inscription\`

### L'utilisateur ne peut pas se connecter
1. Vérifiez que l'email a bien été confirmé (champ \`email_verified_at\` dans la DB)
2. Vérifiez les logs pour voir le message d'erreur exact

## 📞 Support

Pour toute question ou problème, consultez:
- La documentation de Nodemailer: https://nodemailer.com
- Les logs du serveur backend
- Ce guide de configuration

---

**Développé pour AfriBourse** 📈
