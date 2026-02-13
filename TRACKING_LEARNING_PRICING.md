# Tracking des Modules d'Apprentissage et de la Page Pricing

## ✅ Ce qui a été ajouté

### 1. Tracking des Modules d'Apprentissage (LearnPage)

#### Actions trackées :

**a) Ouverture d'un module** (`START_MODULE`)
- **Quand** : Lorsqu'un utilisateur clique sur un module pour l'ouvrir
- **Données collectées** :
  - `moduleSlug` : Identifiant unique du module
  - `moduleTitle` : Titre du module
  - `moduleLevel` : Niveau de difficulté (débutant/intermédiaire/avancé)
- **Fichier** : [LearnPage.tsx:1032-1037](afribourse/src/components/LearnPage.tsx#L1032-L1037)

**b) Début d'un quiz** (`TAKE_QUIZ`)
- **Quand** : Lorsqu'un utilisateur clique sur "Commencer le quiz"
- **Données collectées** :
  - `moduleSlug` : Module concerné
  - `moduleTitle` : Titre du module
  - `moduleLevel` : Niveau du module
- **Fichier** : [LearnPage.tsx:247-252](afribourse/src/components/LearnPage.tsx#L247-L252)

**c) Complétion d'un module** (`COMPLETE_MODULE`)
- **Quand** : Lorsqu'un utilisateur marque un module comme complété ou réussit le quiz
- **Données collectées** :
  - `moduleSlug` : Module complété
  - `moduleTitle` : Titre du module
  - `moduleLevel` : Niveau du module
- **Fichier** : [LearnPage.tsx:411-417](afribourse/src/components/LearnPage.tsx#L411-L417)

### 2. Tracking de la Page Pricing (SubscriptionPage)

#### Actions trackées :

**a) Visite de la page pricing** (`VIEW_PRICING`)
- **Quand** : Automatiquement lors du chargement de la page `/subscriptions`
- **Données collectées** :
  - `userLoggedIn` : Si l'utilisateur est connecté (true/false)
  - `userEmail` : Email de l'utilisateur ou 'anonymous'
- **Fichier** : [SubscriptionPage.tsx:32-36](afribourse/src/components/SubscriptionPage.tsx#L32-L36)
- **Utilité** : Identifier qui visite la page pricing → utilisateurs intéressés par un abonnement

**b) Clic sur un bouton d'abonnement** (`START_CHECKOUT`)
- **Quand** : Lorsqu'un utilisateur clique sur "Passer à Investisseur+" ou "Passer à Pro"
- **Données collectées** :
  - `planId` : ID du plan sélectionné (investisseur-plus, pro)
  - `planName` : Nom du plan
  - `price` : Prix du plan
  - `userEmail` : Email de l'utilisateur
- **Fichier** : [SubscriptionPage.tsx:120-125](afribourse/src/components/SubscriptionPage.tsx#L120-L125)
- **Utilité** : Identifier les utilisateurs qui ont l'intention de payer et quel plan les intéresse

## 📊 Quelles insights vous obtiendrez

### Modules d'Apprentissage
1. **Modules les plus populaires** : Quels modules sont les plus ouverts ?
2. **Taux d'engagement quiz** : Combien d'utilisateurs ouvrent un module ET font le quiz ?
3. **Taux de complétion** : Combien finissent les modules qu'ils commencent ?
4. **Niveaux préférés** : Les utilisateurs préfèrent-ils les modules débutants, intermédiaires ou avancés ?
5. **Abandon** : À quel module les utilisateurs abandonnent-ils le parcours d'apprentissage ?

### Page Pricing
1. **Visiteurs intéressés** : Qui visite la page pricing ? (connectés vs non-connectés)
2. **Plans populaires** : Quel plan attire le plus de clics ? (Investisseur+ vs Pro)
3. **Taux de conversion** :
   - Visiteurs pricing → Clics sur bouton d'abonnement
   - Clics bouton → Paiements effectués (à corréler avec les données de paiement)
4. **Comportement utilisateur** : Les utilisateurs qui utilisent beaucoup le simulateur visitent-ils plus la page pricing ?

## 🧪 Comment Tester

### Test 1 : Tracking des modules d'apprentissage

1. **Connectez-vous** avec un compte utilisateur
2. **Allez sur** `/learn`
3. **Ouvrez un module** en cliquant dessus
4. **Vérifiez dans la console** : Vous devriez voir une requête POST vers `/api/analytics/action` avec `actionType: "start_learning_module"`
5. **Commencez le quiz** (si disponible)
6. **Vérifiez** : Requête avec `actionType: "take_quiz"`
7. **Terminez le module** ou réussissez le quiz
8. **Vérifiez** : Requête avec `actionType: "complete_learning_module"`

9. **Connectez-vous en tant qu'admin**
10. **Allez sur** `/admin/analytics`
11. **Vérifiez** dans "Top Actions" :
    - `start_learning_module` (Ouverture de module)
    - `take_quiz` (Début du quiz)
    - `complete_learning_module` (Module complété)

### Test 2 : Tracking de la page pricing

1. **Déconnectez-vous** (pour tester le tracking anonyme)
2. **Allez sur** `/subscriptions`
3. **Ouvrez les DevTools** (F12) → Onglet Network
4. **Vérifiez** : Une requête POST automatique vers `/api/analytics/action` avec :
   - `actionType: "view_pricing"`
   - `metadata.userLoggedIn: false`
   - `metadata.userEmail: "anonymous"`

5. **Connectez-vous** avec un compte utilisateur
6. **Retournez sur** `/subscriptions`
7. **Vérifiez** : Requête avec `metadata.userLoggedIn: true` et votre email

8. **Cliquez sur** "Passer à Investisseur+"
9. **Vérifiez** : Requête avec :
   - `actionType: "start_checkout"`
   - `metadata.planId: "investisseur-plus"`
   - `metadata.planName: "Investisseur+"`
   - `metadata.price: "9 900"`

10. **En tant qu'admin**, allez sur `/admin/analytics`
11. **Vérifiez** les statistiques :
    - Nombre de `view_pricing` : Combien de personnes ont visité la page
    - Nombre de `start_checkout` : Combien ont cliqué sur un bouton d'abonnement
    - Calculez le **taux de conversion** : (start_checkout / view_pricing) × 100

## 🎯 Analyses Recommandées

### Analyse 1 : Entonnoir d'Apprentissage
```
Utilisateurs actifs
  ↓
Visites page /learn
  ↓
Modules ouverts (start_learning_module)
  ↓
Quiz commencés (take_quiz)
  ↓
Modules complétés (complete_learning_module)
```

**Questions à répondre** :
- Quel % d'utilisateurs actifs visitent la page Learn ?
- Quel % ouvrent au moins un module ?
- Quel % tentent un quiz ?
- Quel % complètent au moins un module ?

### Analyse 2 : Entonnoir de Conversion Pricing
```
Utilisateurs actifs
  ↓
Visites page pricing (view_pricing)
  ↓
Clics sur bouton abonnement (start_checkout)
  ↓
Paiements effectués (à tracker séparément)
```

**Questions à répondre** :
- Combien d'utilisateurs visitent pricing spontanément ?
- Quel est le taux de clic sur les boutons d'abonnement ?
- Quel plan est le plus cliqué ? (Investisseur+ vs Pro)
- Y a-t-il une corrélation entre l'utilisation du simulateur et les visites pricing ?

### Analyse 3 : Segmentation des Utilisateurs Intéressés

**Segment A : Utilisateurs "Apprenants"**
- Ont complété au moins 1 module
- Ont tenté au moins 1 quiz
- Mais n'ont PAS visité pricing
→ **Action** : Leur suggérer les fonctionnalités premium (Coach IA, alertes)

**Segment B : Utilisateurs "Curieux de payer"**
- Ont visité pricing
- Ont cliqué sur un bouton d'abonnement
- Mais n'ont PAS payé
→ **Action** : Email de suivi avec offre limitée dans le temps

**Segment C : Utilisateurs "Actifs non-engagés"**
- Utilisent le simulateur régulièrement
- N'ont PAS visité pricing
→ **Action** : Montrer un CTA vers pricing après certaines actions

## 🔧 Requêtes Utiles pour MongoDB

### Top 5 des modules les plus ouverts
```javascript
db.user_action_tracking.aggregate([
  { $match: { action_type: "start_learning_module" } },
  { $group: {
      _id: "$metadata.moduleTitle",
      count: { $sum: 1 }
  }},
  { $sort: { count: -1 } },
  { $limit: 5 }
])
```

### Taux de complétion par module
```javascript
db.user_action_tracking.aggregate([
  { $match: {
      action_type: { $in: ["start_learning_module", "complete_learning_module"] }
  }},
  { $group: {
      _id: {
        module: "$metadata.moduleTitle",
        action: "$action_type"
      },
      count: { $sum: 1 }
  }}
])
```

### Utilisateurs qui ont visité pricing mais pas cliqué
```javascript
db.user_action_tracking.aggregate([
  { $match: {
      action_type: "view_pricing",
      user_id: { $ne: null }
  }},
  { $lookup: {
      from: "user_action_tracking",
      let: { userId: "$user_id" },
      pipeline: [
        { $match: {
            $expr: { $eq: ["$user_id", "$$userId"] },
            action_type: "start_checkout"
        }}
      ],
      as: "checkouts"
  }},
  { $match: { checkouts: { $size: 0 } }},
  { $project: { user_id: 1, metadata: 1, created_at: 1 }}
])
```

### Plan le plus populaire
```javascript
db.user_action_tracking.aggregate([
  { $match: { action_type: "start_checkout" } },
  { $group: {
      _id: "$metadata.planName",
      clicks: { $sum: 1 },
      users: { $addToSet: "$user_id" }
  }},
  { $project: {
      _id: 1,
      clicks: 1,
      uniqueUsers: { $size: "$users" }
  }},
  { $sort: { clicks: -1 } }
])
```

## 📈 Dashboard Analytics

Dans `/admin/analytics`, vous verrez maintenant :

### Section "Top Actions"
- `start_learning_module` avec le nombre d'ouvertures de modules
- `take_quiz` avec le nombre de tentatives de quiz
- `complete_learning_module` avec le nombre de complétions
- `view_pricing` avec le nombre de visites de la page pricing
- `start_checkout` avec le nombre de clics sur les boutons d'abonnement

### Métriques Calculées (à ajouter éventuellement)
- **Taux d'engagement apprentissage** = (modules_ouverts / utilisateurs_actifs) × 100
- **Taux de complétion** = (modules_complétés / modules_ouverts) × 100
- **Taux de conversion pricing** = (start_checkout / view_pricing) × 100
- **Intention de paiement** = Nombre d'utilisateurs uniques ayant cliqué sur un bouton

## 🎁 Bonus : Suggestions d'Amélioration

### 1. Tracking Audio des Modules
Si vous implémentez l'audio dans les modules (mentionné dans les features), trackez :
```typescript
trackAction(ACTION_TYPES.WATCH_VIDEO, 'Lecture audio du module', {
  moduleSlug,
  duration: audioDuration,
  completed: audioCompleted
});
```

### 2. Tracking des Scrolls de Module
Pour savoir si les utilisateurs lisent vraiment :
```typescript
// Quand l'utilisateur atteint 25%, 50%, 75%, 100% du contenu
trackAction('module_scroll_depth', 'Scroll dans le module', {
  moduleSlug,
  scrollDepth: 75 // en pourcentage
});
```

### 3. Tracking des Tentatives de Quiz
Actuellement, on track le début. On pourrait aussi tracker :
```typescript
trackAction('quiz_submitted', 'Quiz soumis', {
  moduleSlug,
  score,
  passed,
  attempts: numberOfAttempts
});
```

## 🔐 Notes Importantes

- **Tracking anonyme** : La visite de la page pricing est trackée même pour les visiteurs non connectés
- **RGPD** : Les emails sont stockés pour les admins, mais les visiteurs anonymes sont marqués comme "anonymous"
- **Session** : Chaque visite a un `sessionId` unique pour suivre le parcours utilisateur
- **Performances** : Les appels de tracking sont asynchrones et n'affectent pas la performance

## 🚀 Prochaines Étapes

Pour avoir une vue complète du comportement utilisateur :

1. **Tracking du Checkout complet** : Ajouter un événement `checkout_completed` lors du paiement réussi
2. **Tracking des paywalls** : Lorsqu'un utilisateur tente d'accéder à une feature premium sans abonnement
3. **Tracking des annulations** : Si un utilisateur annule son abonnement
4. **Webhooks de paiement** : Intégrer avec FedaPay/CinetPay pour tracker automatiquement les paiements

---

**Le système est maintenant configuré pour identifier qui est intéressé par payer et comment les utilisateurs utilisent les modules d'apprentissage !** 🎉

Consultez `/admin/analytics` après avoir effectué quelques actions pour voir les données en temps réel.
