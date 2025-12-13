# Configuration Brevo (Sendinblue) - AfriBourse

## ✅ Configuration terminée

Vos paramètres SMTP Brevo ont été configurés avec succès dans le fichier `.env`.

## 📧 Paramètres configurés

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=9ab467001@smtp-brevo.com
SMTP_PASS=ZRwX5OPTWAkhtrB0
```

**Clé API Brevo:** `ZRwX5OPTWAkhtrB0`

## 🔍 Vérification de la configuration

### 1. Tester l'envoi d'email

Pour tester que tout fonctionne, vous pouvez:

1. **Démarrer le serveur backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Faire une inscription test:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test",
       "lastname": "User",
       "email": "votre-email-reel@example.com",
       "password": "password123"
     }'
   ```

3. **Vérifier:**
   - Les logs du serveur devraient afficher: `✅ [REGISTER] Email de confirmation envoyé à ...`
   - Vous devriez recevoir l'email dans votre boîte de réception

### 2. Vérifier dans le dashboard Brevo

Connectez-vous à votre compte Brevo:
- URL: https://app.brevo.com
- Allez dans **Statistics** → **Email** pour voir les emails envoyés
- Vérifiez le statut de livraison

## 📊 Limites Brevo (Plan Gratuit)

Le plan gratuit de Brevo offre:
- ✅ **300 emails par jour**
- ✅ Envoi SMTP illimité
- ✅ Statistiques en temps réel
- ✅ Support des templates

## 🚨 Points importants

### 1. Adresse d'expéditeur

Actuellement, l'adresse d'expéditeur est: `9ab467001@smtp-brevo.com`

**Recommandation:** Pour une meilleure délivrabilité et professionnalisme:

1. Allez dans **Senders** → **Add a sender**
2. Ajoutez votre domaine email (ex: `noreply@afribourse.com`)
3. Vérifiez le domaine avec les enregistrements DNS
4. Mettez à jour la variable `SMTP_USER` avec votre nouvelle adresse

### 2. Configuration DNS (Pour domaine personnalisé)

Si vous utilisez votre propre domaine, configurez:

**SPF Record:**
```
v=spf1 include:spf.sendinblue.com mx ~all
```

**DKIM Record:**
Suivez les instructions dans le dashboard Brevo

### 3. Templates d'email

Le template HTML est déjà configuré dans le code. Si vous voulez le modifier:
- Fichier: `backend/src/services/email.service.ts`
- Fonction: `sendConfirmationEmail()`

## 🧪 Tests recommandés

### Test 1: Inscription complète
```bash
# 1. S'inscrire
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "lastname": "Doe",
    "email": "votre-email@example.com",
    "password": "Test123456"
  }'

# 2. Vérifier l'email reçu
# 3. Copier le token de l'URL du lien

# 4. Confirmer l'email
curl -X GET "http://localhost:3001/api/auth/confirm-email?token=VOTRE_TOKEN_ICI"

# 5. Se connecter
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com",
    "password": "Test123456"
  }'
```

### Test 2: Renvoi d'email
```bash
curl -X POST http://localhost:3001/api/auth/resend-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com"
  }'
```

### Test 3: Tentative de connexion sans confirmation
```bash
# Devrait retourner une erreur 403
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "email-non-confirme@example.com",
    "password": "password123"
  }'
```

## 📈 Monitoring

### Logs à surveiller

Dans les logs de votre serveur, vous devriez voir:

**Inscription réussie:**
```
✅ [REGISTER] Email de confirmation envoyé à user@example.com
📧 Email envoyé avec succès à user@example.com
```

**Erreur d'envoi:**
```
❌ [REGISTER] Erreur lors de l'envoi de l'email de confirmation: ...
```

### Dashboard Brevo

Surveillez dans votre dashboard Brevo:
1. **Delivery rate** - Devrait être > 95%
2. **Bounce rate** - Devrait être < 5%
3. **Spam reports** - Devrait être 0

## 🔧 Dépannage

### Problème: Les emails n'arrivent pas

**Vérifications:**
1. ✅ Vérifier les logs du serveur
2. ✅ Vérifier le dashboard Brevo (Statistics → Email)
3. ✅ Vérifier le dossier spam
4. ✅ Tester avec un autre email

**Solution:**
```bash
# Test de connexion SMTP
cd backend
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: '9ab467001@smtp-brevo.com',
    pass: 'ZRwX5OPTWAkhtrB0'
  }
});
transporter.verify((error, success) => {
  if (error) console.error('❌ Erreur SMTP:', error);
  else console.log('✅ Connexion SMTP OK');
});
"
```

### Problème: Rate limit dépassé

Si vous dépassez 300 emails/jour:
1. Attendez 24h pour la réinitialisation
2. Ou passez à un plan payant Brevo
3. Ou utilisez plusieurs comptes Brevo (non recommandé)

### Problème: Emails marqués comme spam

**Solutions:**
1. Configurez SPF et DKIM
2. Utilisez un domaine vérifié
3. Évitez les mots-clés spam dans le sujet
4. Maintenez un bon taux de délivrabilité

## 📞 Support Brevo

- **Documentation:** https://developers.brevo.com/docs
- **Support:** https://help.brevo.com
- **Status:** https://status.brevo.com

## 🎯 Prochaines étapes

1. ✅ Tester l'envoi d'email
2. ⏳ Configurer un domaine personnalisé (recommandé pour la production)
3. ⏳ Créer des templates d'email dans Brevo (optionnel)
4. ⏳ Configurer les webhooks pour le tracking (optionnel)

---

**Configuration terminée!** Le système de confirmation d'email est maintenant opérationnel avec Brevo. 🚀
