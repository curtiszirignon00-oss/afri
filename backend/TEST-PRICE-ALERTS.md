# 🔔 Guide de Test des Alertes de Prix

Ce guide vous explique comment tester le système d'alertes de prix et vérifier l'envoi des emails.

## 📋 Prérequis

1. Configuration SMTP dans votre fichier `.env`:
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com (ou votre serveur SMTP)
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app
EMAIL_FROM=noreply@africbourse.com
EMAIL_FROM_NAME=AfriBourse
```

2. Base de données MongoDB connectée
3. Backend démarré

## 🎨 Visualiser le Rendu de l'Email (Sans Envoi)

Pour voir à quoi ressemble l'email sans l'envoyer:

```bash
cd backend
npx ts-node src/scripts/test-price-alert-email.ts
```

Cela génère un fichier HTML: `backend/preview-price-alert-email.html`

**Ouvrez ce fichier dans votre navigateur** pour voir le rendu exact de l'email.

### 📧 Aperçu de l'Email

L'email contient:
- ✅ **Header** avec logo AfriBourse (orange #f97316)
- ✅ **Titre**: "🔔 Alerte Prix Déclenchée"
- ✅ **Message personnalisé** avec le nom de l'utilisateur
- ✅ **Box d'alerte orange** avec gradient
  - Ticker de l'action (ex: SIVC)
  - Message "Le prix a dépassé/descendu sous votre seuil cible"
  - Prix Cible et Prix Actuel côte à côte
- ✅ **Info box bleue** expliquant que l'alerte est désactivée
- ✅ **Bouton CTA** "Voir {TICKER}" vers la page de l'action
- ✅ **Footer** avec informations de contact

## 📤 Envoyer un Email de Test Réel

Pour envoyer un vrai email à votre adresse:

```bash
cd backend
npx ts-node src/scripts/send-test-price-alert.ts
```

Le script vous demandera:
1. Votre adresse email
2. Confirmation d'envoi

**Exemple de session:**
```
📧 Envoi d'un email d'alerte de test

============================================================

Entrez votre adresse email pour recevoir le test: votre@email.com

📋 Configuration de l'email de test:
   → Destinataire: votre@email.com
   → Action: SIVC
   → Type d'alerte: Au-dessus
   → Prix cible: 1,250 FCFA
   → Prix actuel: 1,280 FCFA

⚠️  Voulez-vous envoyer cet email de test? (o/n): o

📤 Envoi de l'email en cours...

✅ Email envoyé avec succès!

📬 Vérifiez votre boîte de réception: votre@email.com
   → Sujet: 🔔 Alerte Prix: SIVC a atteint 1 280 FCFA
   → N'oubliez pas de vérifier les spams si vous ne le voyez pas
```

## 🧪 Tester le Système Complet (Cron Job)

Pour tester le déclenchement automatique des alertes:

### 1. Créer une alerte de test via l'API

```bash
# Authentification
POST http://localhost:5000/api/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "votre-mot-de-passe"
}

# Créer une alerte
POST http://localhost:5000/api/price-alerts
Content-Type: application/json
Cookie: token=votre-token-jwt

{
  "stockTicker": "SIVC",
  "alertType": "ABOVE",
  "targetPrice": 1000,
  "notifyEmail": true,
  "notifyInApp": true
}
```

### 2. Attendre le prochain cron job

Le cron job s'exécute **toutes les heures** à H:00 (ex: 14:00, 15:00, 16:00...)

Vous verrez dans les logs:
```
🔄 Tâche de scraping exécutée toutes les heures
✅ Scraping et sauvegarde terminés avec succès
🔔 Vérification des alertes de prix...
📊 1 alerte(s) active(s) à vérifier
🎯 Alerte déclenchée pour SIVC (Prix: 1280)
✉️  Email envoyé à test@example.com pour SIVC
✅ Vérification des alertes terminée: 1 alerte(s) déclenchée(s)
```

### 3. Ou déclencher manuellement le cron

Vous pouvez aussi importer et appeler la fonction directement:

```typescript
import { checkPriceAlerts } from './jobs/scraping.job';

// Déclencher manuellement
await checkPriceAlerts();
```

## 🔍 Vérification des Alertes

### Via l'API

```bash
# Lister toutes vos alertes
GET http://localhost:5000/api/price-alerts
Cookie: token=votre-token-jwt

# Lister les alertes pour une action spécifique
GET http://localhost:5000/api/price-alerts?stockTicker=SIVC
Cookie: token=votre-token-jwt

# Voir l'historique des notifications d'une alerte
GET http://localhost:5000/api/price-alerts/:alertId/notifications
Cookie: token=votre-token-jwt
```

### Via la Base de Données

```javascript
// Dans MongoDB
db.price_alerts.find({ userId: "votre-user-id" })

// Voir les notifications envoyées
db.price_alert_notifications.find({})
```

## 🐛 Dépannage

### L'email ne part pas

1. **Vérifiez les variables d'environnement**
```bash
echo $EMAIL_HOST
echo $EMAIL_PORT
echo $EMAIL_USER
```

2. **Testez la connexion SMTP**
```bash
cd backend
npx ts-node src/scripts/test-smtp-render.ts
```

3. **Vérifiez les logs du serveur**
Recherchez les messages d'erreur commençant par `[EMAIL]`

### L'alerte ne se déclenche pas

1. **Vérifiez que l'alerte est active**
```javascript
db.price_alerts.findOne({ _id: "alert-id" })
// is_active doit être true
// is_notified doit être false
```

2. **Vérifiez le prix actuel de l'action**
```javascript
db.stocks.findOne({ symbol: "SIVC" })
// current_price doit être >= target_price (pour ABOVE)
// ou <= target_price (pour BELOW)
```

3. **Vérifiez les logs du cron job**
Le cron s'exécute toutes les heures. Attendez la prochaine exécution ou redémarrez le serveur.

## 📊 Exemple d'Email Envoyé

**Sujet:** 🔔 Alerte Prix: SIVC a atteint 1 280 FCFA

**Corps (version texte):**
```
Alerte Prix - SIVC - AfriBourse

Bonjour Jean Kouadio,

Votre alerte de prix pour SIVC a été déclenchée !

Le prix a dépassé votre seuil cible.

Prix Cible: 1 250 FCFA
Prix Actuel: 1 280 FCFA

Cette alerte a été automatiquement désactivée.
Vous pouvez la réactiver depuis votre tableau de bord.

Consultez les détails: https://www.africbourse.com/stocks/SIVC

AfriBourse - Votre plateforme d'apprentissage boursier
```

**Corps (HTML):** Voir le fichier `preview-price-alert-email.html` généré

## ✅ Checklist de Vérification

- [ ] Variables SMTP configurées dans .env
- [ ] Serveur backend démarré
- [ ] Base de données connectée
- [ ] Aperçu HTML généré et vérifié
- [ ] Email de test envoyé et reçu
- [ ] Alerte créée via l'API
- [ ] Prix de test configuré pour déclencher l'alerte
- [ ] Cron job exécuté (attendre l'heure pile)
- [ ] Email d'alerte réel reçu
- [ ] Alerte marquée comme déclenchée dans la DB
- [ ] Notification enregistrée dans price_alert_notifications

## 🎯 Prochaines Étapes

Une fois les tests réussis:

1. **Déployer en production** avec vraies credentials SMTP
2. **Configurer les alertes utilisateurs** via le frontend
3. **Monitorer les logs** pour s'assurer que les emails partent
4. **Ajuster la fréquence** du cron si nécessaire (actuellement 1h)

---

**Besoin d'aide?** Consultez les logs avec `tail -f backend/server.log` ou contactez l'équipe dev.
