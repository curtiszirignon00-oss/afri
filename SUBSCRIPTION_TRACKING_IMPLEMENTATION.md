# Système de Tracking d'Intentions d'Abonnement

## Vue d'ensemble

Ce système permet de **mesurer l'intérêt des utilisateurs pour les plans premium SANS implémenter le paiement réel**. L'objectif est de compter combien d'utilisateurs seront intéressés avant de développer le système de paiement complet.

## Stratégie de "Faux Bug"

Au lieu d'afficher un message "Bientôt disponible", nous utilisons une **animation de chargement infini** pour simuler un bug. Cela permet de :
- Créer une expérience réaliste
- Logger l'intention sans éveiller de soupçons
- Éviter de frustrer l'utilisateur avec un message "pas encore disponible"

## Architecture

### 1. Frontend (React + TypeScript)

#### Page d'abonnements
**Fichier**: `afribourse/src/components/SubscriptionPage.tsx`

Présente les 3 plans :
- **Essentiel** (Gratuit)
- **Investisseur+** (9 900 XOF/mois)
- **Pro** (300 000 XOF/mois)

Accessible via : `/subscriptions`

#### Composant Paywall
**Fichier**: `afribourse/src/components/PremiumPaywall.tsx`

Modal qui s'affiche quand l'utilisateur tente d'accéder à une fonctionnalité premium :
- Affiche les détails du plan requis
- Bouton "Passer à [Plan]" avec chargement infini
- Tracking automatique de l'intention

#### Composant Bouton Premium
**Fichier**: `afribourse/src/components/PremiumFeatureButton.tsx`

Bouton réutilisable pour bloquer n'importe quelle fonctionnalité :
```tsx
<PremiumFeatureButton
  feature="Accéder au Coach IA"
  plan="investisseur-plus"
>
  Débloquer avec Premium
</PremiumFeatureButton>
```

### 2. Backend (Node.js + Express + Prisma)

#### Modèle de données
**Fichier**: `backend/prisma/schema.prisma`

```prisma
model SubscriptionIntent {
  id         String    @id @default(auto()) @map("_id") @db.ObjectId
  planId     String    // "investisseur-plus" ou "pro"
  planName   String    // "Investisseur+" ou "Pro"
  price      String    // "9 900 XOF" ou "300 000 XOF"
  feature    String?   // Fonctionnalité qui a déclenché l'intention
  source     String?   // "paywall" ou "subscriptions_page"
  created_at DateTime  @default(now())

  user       User      @relation(fields: [userId], references: [id])
  userId     String    @db.ObjectId
}
```

#### API Routes
**Fichier**: `backend/src/routes/subscription.routes.ts`

- `POST /api/subscriptions/intent` - Logger une intention d'abonnement
- `GET /api/subscriptions/stats` - Obtenir les statistiques (admin)
- `GET /api/subscriptions/my-intents` - Obtenir les intentions d'un utilisateur

#### Contrôleur
**Fichier**: `backend/src/controllers/subscription.controller.ts`

Gère la logique :
- Enregistrement des intentions avec métadonnées
- Calcul des statistiques (total, par plan, par fonctionnalité, par source)
- Liste des intentions récentes

### 3. Dashboard Admin

**Fichier**: `afribourse/src/components/AdminSubscriptionStats.tsx`

Tableau de bord pour visualiser :
- **Total d'intentions** d'abonnement
- **Utilisateurs uniques** intéressés
- **Répartition par plan** (Investisseur+ vs Pro)
- **Répartition par fonctionnalité** (quelle feature attire le plus)
- **Répartition par source** (page abonnements vs paywall contextuel)
- **Liste des intentions récentes** avec détails utilisateur

Accessible via : `/admin/subscription-stats`

## Intégration des Paywalls

### Exemple 1 : Coach IA dans LearnPage

**Fichier**: `afribourse/src/components/LearnPage.tsx`

```tsx
// Import du paywall
import PremiumPaywall from './PremiumPaywall';

// État
const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);

// Bouton qui déclenche le paywall
<button onClick={() => setShowPremiumPaywall(true)}>
  Demander au tuteur IA
</button>

// Composant paywall
<PremiumPaywall
  isOpen={showPremiumPaywall}
  onClose={() => setShowPremiumPaywall(false)}
  feature="Poser vos questions au Coach IA"
  plan="investisseur-plus"
/>
```

### Exemple 2 : Données en temps réel (à implémenter)

```tsx
<PremiumPaywall
  isOpen={showPaywall}
  onClose={() => setShowPaywall(false)}
  feature="Accéder aux données de marché en temps réel"
  plan="investisseur-plus"
/>
```

### Exemple 3 : API Access (à implémenter)

```tsx
<PremiumPaywall
  isOpen={showPaywall}
  onClose={() => setShowPaywall(false)}
  feature="Accéder à l'API AfriBourse"
  plan="pro"
/>
```

## Fonctionnalités à bloquer selon le plan

### Plan Investisseur+ (9 900 XOF/mois)
- ✅ Coach IA (implémenté)
- ⏳ Données en temps réel (à implémenter)
- ⏳ Alertes personnalisées
- ⏳ Screener avancé
- ⏳ Export CSV
- ⏳ Expérience sans publicité
- ⏳ 5 portefeuilles virtuels
- ⏳ Réponses illimitées aux quiz
- ⏳ Audio dans les formations

### Plan Pro (300 000 XOF/mois)
- ⏳ Accès API
- ⏳ Rapports sectoriels exclusifs
- ⏳ Webinaires mensuels
- ⏳ Données fondamentales (10 ans)
- ⏳ Compte multi-utilisateurs
- ⏳ Support prioritaire

## Comment ajouter un nouveau paywall

1. **Identifier la fonctionnalité** à bloquer

2. **Importer le composant**
```tsx
import PremiumPaywall from './PremiumPaywall';
```

3. **Ajouter l'état**
```tsx
const [showPaywall, setShowPaywall] = useState(false);
```

4. **Remplacer l'action par le paywall**
```tsx
// Au lieu de :
onClick={() => doAction()}

// Faire :
onClick={() => setShowPaywall(true)}
```

5. **Ajouter le composant paywall**
```tsx
<PremiumPaywall
  isOpen={showPaywall}
  onClose={() => setShowPaywall(false)}
  feature="Description de la fonctionnalité"
  plan="investisseur-plus" // ou "pro"
/>
```

## Flux utilisateur

1. **Utilisateur clique** sur une fonctionnalité premium (ex: Coach IA)
2. **Modal paywall s'affiche** avec détails du plan
3. **Utilisateur clique** sur "Passer à Investisseur+"
4. **Animation de chargement** démarre (infinie)
5. **Backend enregistre** l'intention en base de données
6. **L'utilisateur attend** indéfiniment (simule un bug)

## Données trackées

Pour chaque intention, on enregistre :
- `userId` - ID de l'utilisateur
- `planId` - Plan choisi ("investisseur-plus" ou "pro")
- `planName` - Nom du plan ("Investisseur+" ou "Pro")
- `price` - Prix affiché
- `feature` - Fonctionnalité qui a déclenché l'intention
- `source` - Source du clic ("paywall" ou "subscriptions_page")
- `created_at` - Date/heure

## Analyse des résultats

Le dashboard admin permet de répondre aux questions :

1. **Combien d'utilisateurs sont intéressés ?**
   → Voir "Utilisateurs Uniques"

2. **Quel plan attire le plus ?**
   → Comparer "Investisseur+" vs "Pro"

3. **Quelle fonctionnalité génère le plus d'intérêt ?**
   → Voir "Par Fonctionnalité"

4. **D'où viennent les intentions ?**
   → Voir "Par Source" (page abonnements vs paywall contextuel)

5. **Qui sont les utilisateurs intéressés ?**
   → Voir "Intentions Récentes" avec emails

## Migration vers paiement réel

Quand vous serez prêt à implémenter le paiement :

1. **Intégrer un système de paiement** (Stripe, PayPal, MTN Mobile Money, etc.)

2. **Remplacer le chargement infini** par un redirect vers le paiement :
```tsx
// Dans PremiumPaywall.tsx
// Remplacer :
setIsProcessing(true);
// Le chargement infini - on ne désactive jamais isProcessing

// Par :
window.location.href = '/checkout?plan=' + planId;
```

3. **Garder le tracking** pour continuer à analyser les conversions

4. **Ajouter un champ** `converted` au modèle pour tracker qui a payé :
```prisma
model SubscriptionIntent {
  // ... champs existants
  converted   Boolean  @default(false)
  convertedAt DateTime?
}
```

## Commandes utiles

### Générer le client Prisma après modification du schéma
```bash
cd backend
npx prisma generate
```

### Voir la base de données
```bash
cd backend
npx prisma studio
```

### Tester l'API
```bash
# Logger une intention
curl -X POST http://localhost:5000/api/subscriptions/intent \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "investisseur-plus",
    "planName": "Investisseur+",
    "price": "9 900 XOF",
    "feature": "Coach IA",
    "source": "paywall"
  }'

# Obtenir les stats (admin)
curl http://localhost:5000/api/subscriptions/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Sécurité

- ✅ Routes protégées par authentification
- ✅ Stats réservées aux admins (vérification du rôle)
- ✅ Validation des données côté backend
- ✅ Pas d'exposition de données sensibles

## Prochaines étapes

1. ✅ Page d'abonnements
2. ✅ Paywall contextuel
3. ✅ Tracking des intentions
4. ✅ Dashboard admin
5. ✅ Intégration dans Coach IA
6. ⏳ Ajouter paywalls sur autres fonctionnalités
7. ⏳ Analyser les données pendant 2-4 semaines
8. ⏳ Décider d'implémenter le paiement ou ajuster l'offre
9. ⏳ Intégrer le système de paiement réel

## Notes importantes

- **Le chargement infini est intentionnel** - Ne le corrigez pas !
- **Les utilisateurs ne doivent pas savoir** que c'est un test
- **Analysez les données régulièrement** pour ajuster votre offre
- **Communiquez avec les utilisateurs intéressés** quand le paiement sera prêt

## Support

Pour toute question sur l'implémentation :
1. Voir ce fichier de documentation
2. Consulter les commentaires dans le code
3. Vérifier les logs serveur pour les erreurs
