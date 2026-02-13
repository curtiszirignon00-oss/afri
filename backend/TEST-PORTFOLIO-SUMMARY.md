# 📊 Guide de Test des Résumés de Portefeuille

Ce guide vous explique comment tester le système de résumés bi-hebdomadaires de portefeuille et vérifier l'envoi des emails.

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
4. Au moins un utilisateur avec un portefeuille simulateur et des positions actives

## 🎨 Visualiser le Rendu de l'Email (Sans Envoi)

Pour voir à quoi ressemble l'email sans l'envoyer:

```bash
cd backend
npx ts-node src/scripts/test-portfolio-summary-preview.ts
```

Cela génère un fichier HTML: `backend/preview-portfolio-summary.html`

**Ouvrez ce fichier dans votre navigateur** pour voir le rendu exact de l'email.

### 📧 Aperçu de l'Email

L'email contient:
- ✅ **Header** avec logo AfriBourse (orange #f97316)
- ✅ **Titre**: "📊 Résumé de Votre Portefeuille"
- ✅ **Message personnalisé** avec nom et période
- ✅ **Box de résumé bleue** avec gradient
  - Valeur totale du portefeuille
  - Gain/Perte total avec pourcentage
- ✅ **Grille de statistiques** (2x2)
  - Liquidités (cash balance)
  - Investi (invested value)
  - Nombre de positions
  - Performance globale
- ✅ **Section Meilleures Performances** (Top 3)
  - Ticker de l'action
  - Pourcentage de gain (vert)
- ✅ **Section Moins Bonnes Performances** (Top 3)
  - Ticker de l'action
  - Pourcentage de perte (rouge)
- ✅ **Conseil personnalisé** selon performance
  - Conseil différent si profit ou perte
- ✅ **Bouton CTA** "Voir Mon Dashboard"
- ✅ **Footer** avec informations de contact

## 📤 Envoyer un Email de Test Réel

Pour envoyer un vrai email à votre adresse:

```bash
cd backend
npx ts-node src/scripts/send-test-portfolio-summary.ts
```

Le script vous demandera:
1. Votre adresse email
2. Confirmation d'envoi

**Exemple de session:**
```
📊 Envoi d'un email de résumé de portefeuille de test

============================================================

Entrez votre adresse email pour recevoir le test: votre@email.com

📋 Configuration de l'email de test:
   → Destinataire: votre@email.com
   → Valeur totale: 5 780 000 FCFA
   → Performance: +1.78%
   → Positions: 8
   → Période: du 1er au 14 janvier 2026

⚠️  Voulez-vous envoyer cet email de test? (o/n): o

📤 Envoi de l'email en cours...

✅ Email envoyé avec succès!

📬 Vérifiez votre boîte de réception: votre@email.com
   → Sujet: 📊 Résumé de Votre Portefeuille - AfriBourse
   → N'oubliez pas de vérifier les spams si vous ne le voyez pas
```

## 🧪 Tester le Système Complet (Cron Job)

Le système envoie automatiquement les résumés **tous les lundis à 9h00**, mais seulement **toutes les 2 semaines**.

### 1. Planification du Cron Job

Le cron job est configuré dans `src/jobs/scraping.job.ts`:

```typescript
cron.schedule('0 9 * * 1', async () => { // Tous les lundis à 9h
  // Logique pour envoyer seulement toutes les 2 semaines
});
```

**Timing:**
- **Fréquence**: Tous les lundis
- **Heure**: 9h00 du matin
- **Cycle**: Toutes les 2 semaines (semaines paires)

### 2. Créer un Utilisateur avec Portefeuille de Test

Pour tester le système complet, vous avez besoin d'un utilisateur avec des positions actives:

```bash
# Via MongoDB ou Prisma Studio
# 1. Créer un utilisateur
# 2. Créer un simulatorProfile pour cet utilisateur
# 3. Ajouter des portfolioPositions avec quantity > 0
```

**Exemple de données MongoDB:**

```javascript
// Utilisateur
{
  _id: "user123",
  email: "test@example.com",
  first_name: "Jean",
  last_name: "Kouadio"
}

// SimulatorProfile
{
  _id: "profile123",
  userId: "user123",
  cash_balance: 1200000
}

// PortfolioPositions
[
  {
    profileId: "profile123",
    stock_ticker: "SIVC",
    quantity: 100,
    average_purchase_price: 1200
  },
  {
    profileId: "profile123",
    stock_ticker: "ONTBF",
    quantity: 50,
    average_purchase_price: 3000
  }
]
```

### 3. Tester Manuellement la Fonction

Vous pouvez tester la fonction d'envoi sans attendre le cron:

```typescript
// Dans un fichier test ou via ts-node
import { sendBiweeklyPortfolioSummaries } from './services/portfolio-summary.service';

// Déclencher manuellement l'envoi
await sendBiweeklyPortfolioSummaries();
```

Ou créer un script de test:

```bash
cd backend
npx ts-node -e "import('./src/services/portfolio-summary.service').then(m => m.sendBiweeklyPortfolioSummaries())"
```

### 4. Vérifier les Logs

Lors de l'exécution, vous verrez dans les logs:

```
📊 Début de l'envoi des résumés bi-hebdomadaires de portefeuille...
📧 5 utilisateur(s) avec positions actives trouvé(s)
✅ Email envoyé à test1@example.com (Jean Kouadio)
✅ Email envoyé à test2@example.com (Marie Diallo)
...

📊 Résumé de l'envoi:
   → Succès: 5
   → Erreurs: 0
   → Total: 5
```

## 🔍 Vérification des Données

### Vérifier les Utilisateurs Éligibles

```javascript
// Dans MongoDB
db.users.aggregate([
  {
    $lookup: {
      from: 'simulator_profiles',
      localField: '_id',
      foreignField: 'userId',
      as: 'profile'
    }
  },
  {
    $lookup: {
      from: 'portfolio_positions',
      localField: 'profile._id',
      foreignField: 'profileId',
      as: 'positions'
    }
  },
  {
    $match: {
      'positions.quantity': { $gt: 0 }
    }
  }
])
```

### Vérifier les Prix Actuels des Actions

```javascript
// Prix des actions pour le calcul de performance
db.stocks.find({
  symbol: { $in: ['SIVC', 'ONTBF', 'BOABF', 'SDCC'] }
}, {
  symbol: 1,
  current_price: 1
})
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
Recherchez les messages d'erreur commençant par `[PORTFOLIO SUMMARY]`

### Aucun email envoyé

1. **Vérifiez qu'il y a des utilisateurs avec positions**
```javascript
db.portfolio_positions.countDocuments({ quantity: { $gt: 0 } })
```

2. **Vérifiez les prix des actions**
```javascript
db.stocks.find({ current_price: { $exists: true, $ne: null } })
```

3. **Vérifiez les logs**
Si vous voyez "Pas de stats disponibles pour user...", cela signifie que l'utilisateur n'a pas de portefeuille actif.

### Le cron ne s'exécute pas

1. **Vérifiez que le serveur est démarré**
Le cron job s'exécute uniquement quand le serveur Node.js tourne.

2. **Attendez le bon jour/heure**
Le cron s'exécute **tous les lundis à 9h**, mais seulement **toutes les 2 semaines** (semaines paires).

3. **Vérifiez la semaine actuelle**
```typescript
const now = new Date();
const weekNumber = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
console.log('Semaine actuelle:', weekNumber);
console.log('Est pair (envoi):', weekNumber % 2 === 0);
```

## 📊 Exemple d'Email Envoyé

**Sujet:** 📊 Résumé de Votre Portefeuille - AfriBourse

**Corps (version texte):**
```
Résumé de Portefeuille - AfriBourse

Bonjour Jean Kouadio,

Voici le résumé de votre portefeuille pour la période du 1er au 14 janvier 2026.

Valeur Totale: 5 780 000 FCFA
Performance: +80 000 FCFA (+1.78%)

Liquidités: 1 200 000 FCFA
Investi: 4 500 000 FCFA
Positions: 8

Meilleures Performances:
- SIVC: +12.50%
- ONTBF: +8.30%
- BOABF: +5.20%

Moins Bonnes Performances:
- SDCC: -3.50%
- TTLC: -2.10%
- NEIC: -1.20%

Conseil: Votre portefeuille est en croissance ! Continuez à surveiller vos positions.

Voir Mon Dashboard: https://www.africbourse.com/dashboard

AfriBourse - Votre plateforme d'apprentissage boursier
```

**Corps (HTML):** Voir le fichier `preview-portfolio-summary.html` généré

## ✅ Checklist de Vérification

- [ ] Variables SMTP configurées dans .env
- [ ] Serveur backend démarré
- [ ] Base de données connectée
- [ ] Utilisateurs avec portefeuilles actifs créés
- [ ] Prix des actions à jour dans la DB
- [ ] Aperçu HTML généré et vérifié
- [ ] Email de test envoyé et reçu
- [ ] Service de calcul testé manuellement
- [ ] Cron job configuré (lundi 9h, bi-hebdomadaire)
- [ ] Logs vérifiés pour confirmer l'exécution

## 🎯 Architecture du Système

### Fichiers Créés

1. **`src/services/portfolio-summary.service.ts`**
   - `calculateUserPortfolioStats()` - Calcule les stats d'un utilisateur
   - `sendBiweeklyPortfolioSummaries()` - Envoie les résumés à tous les utilisateurs
   - `getBiweeklyPeriod()` - Génère la période formatée
   - `getCurrentPrice()` - Récupère le prix actuel d'une action

2. **`src/services/email.service.ts`** (modifié)
   - `sendPortfolioSummaryEmail()` - Envoie l'email de résumé

3. **`src/jobs/scraping.job.ts`** (modifié)
   - Ajout du cron job bi-hebdomadaire

4. **`src/scripts/send-test-portfolio-summary.ts`**
   - Script interactif pour tester l'envoi d'email

5. **`src/scripts/test-portfolio-summary-preview.ts`**
   - Génère un aperçu HTML sans envoi

### Flux de Données

```
1. Cron Job (Lundi 9h, semaine paire)
   ↓
2. sendBiweeklyPortfolioSummaries()
   ↓
3. Pour chaque utilisateur avec positions:
   - calculateUserPortfolioStats()
     ↓
   - Récupération des positions
   - Calcul des prix actuels
   - Calcul gains/pertes
   - Tri par performance
     ↓
   - sendPortfolioSummaryEmail()
     ↓
   - Email envoyé via SMTP
```

## 🎯 Prochaines Étapes

Une fois les tests réussis:

1. **Déployer en production** avec vraies credentials SMTP
2. **Monitorer les logs** pour s'assurer que les emails partent
3. **Vérifier la réception** des emails par les utilisateurs
4. **Ajuster le timing** si nécessaire (actuellement lundi 9h)
5. **Ajouter des métriques** pour suivre le taux d'ouverture
6. **Permettre aux utilisateurs** de désactiver ces emails (préférences)

---

**Besoin d'aide?** Consultez les logs avec `tail -f backend/server.log` ou contactez l'équipe dev.
