# Quiz Module 1 - Les Fondations de la Bourse et de la BRVM

## ✅ Configuration du Quiz

### Paramètres
- **Nombre total de questions dans la banque**: 15 questions
- **Nombre de questions par test**: 10 questions (sélectionnées aléatoirement)
- **Score minimum requis**: 80%
- **Nombre de tentatives autorisées**: 2 tentatives
- **Délai après échec des 2 tentatives**: 8 heures

### Logique de Fonctionnement

#### 1. Sélection des Questions
Lorsqu'un étudiant démarre le quiz :
- Le système sélectionne **10 questions aléatoires** parmi les 15 disponibles
- Chaque tentative peut avoir un ensemble différent de questions
- Les questions sont mélangées pour garantir la variété

#### 2. Système de Tentatives
- **Première tentative**: L'étudiant peut passer le quiz immédiatement
- **Deuxième tentative**: Si l'étudiant échoue (< 80%), il peut réessayer immédiatement
- **Après 2 échecs**: L'étudiant doit attendre **8 heures** avant de pouvoir repasser le quiz
- Les compteurs de tentatives sont réinitialisés après le délai d'attente

#### 3. Conditions de Réussite
- Score ≥ 80% = **Module débloqué**
- Score < 80% = **Tentative comptabilisée**

## 📋 Liste des 15 Questions

### Question 1
**Selon le module, quelle est la meilleure analogie pour décrire un marché financier?**
- A. Un distributeur automatique où l'on retire de l'argent.
- **B. Le Grand Marché central de la ville.** ✅
- C. Un compte d'épargne bloqué à long terme.
- D. Une usine de production de biens physiques.
- E. Une institution bancaire classique.

### Question 2
**Quel type de titre financier représente une "part de propriété" dans une entreprise?**
- A. Les obligations.
- B. Les bons du Trésor.
- **C. Les actions.** ✅
- D. Les devises.

### Question 3
**Quelle est l'une des trois grandes fonctions essentielles des marchés financiers?**
- A. Garantir un taux d'intérêt fixe sur l'épargne.
- B. Financer uniquement les projets des États.
- **C. Canaliser l'épargne vers l'investissement productif.** ✅
- D. Assurer la stabilité des prix des titres.
- E. Remplacer le rôle des banques.

### Question 4
**La BRVM est unique au monde pour quelle raison?**
- A. Elle n'échange que des titres agricoles.
- **B. Elle est commune à huit pays africains (UEMOA).** ✅
- C. Elle est la plus ancienne bourse d'Afrique.
- D. Elle est détenue à 100 % par les États.

### Question 5
**Quel acteur veille au respect des règles de transparence?**
- A. La BRVM.
- B. Les SGI.
- C. Le DC/BR.
- **D. Le CREPMF.** ✅

### Question 6
**Quel marché est votre "terrain de jeu principal"?**
- A. Le marché des devises (Forex).
- B. Le marché primaire.
- C. Le marché monétaire.
- **D. Le marché secondaire.** ✅

### Question 7
**Dans le marché primaire, à qui va l'argent?**
- A. Aux courtiers (SGI).
- **B. Directement à l'entreprise ou l'État.** ✅
- C. À un autre investisseur.
- D. Au régulateur (CREPMF).

### Question 8
**Qu'est-ce que l'indice "BRVM 10"?**
- A. Les 10 entreprises les moins performantes.
- B. Les 10 entreprises nouvellement cotées.
- C. L'ensemble des sociétés (BRVM Composite).
- **D. Les 10 entreprises les plus liquides.** ✅

### Question 9
**Quel pays ne fait PAS partie de l'UEMOA?**
- A. Le Sénégal.
- B. La Côte d'Ivoire.
- **C. Le Cameroun.** ✅
- D. Le Niger.
- E. Le Togo.

### Question 10
**Le siège de la BRVM est situé à...**
- A. Dakar (Sénégal).
- B. Cotonou (Bénin).
- C. Ouagadougou (Burkina Faso).
- **D. Abidjan (Côte d'Ivoire).** ✅

### Question 11
**Le terme 'IPO' signifie:**
- A. Indice des Performances Obligations.
- **B. Introduction en bourse.** ✅
- C. Investissement Permanent Obligatoire.
- D. Intérêt Prioritaire d'Ouverture.

### Question 12
**Quelle raison n'est PAS un motif d'entrer en bourse?**
- A. Améliorer sa visibilité.
- **B. Accéder à des capitaux sans transparence.** ✅
- C. Permettre aux actionnaires de vendre.
- D. Lever des capitaux sans s'endetter.

### Question 13
**Quel est l'intermédiaire agréé pour acheter/vendre?**
- A. Le DC/BR.
- B. Le CREPMF.
- C. La BRVM.
- **D. La SGI.** ✅

### Question 14
**Sur quel marché s'échangent les titres entre investisseurs?**
- A. Le marché des changes.
- B. Le marché monétaire.
- C. Le marché primaire.
- **D. Le marché secondaire.** ✅
- E. Le marché obligataire.

### Question 15
**Quelle fonction permet de "revendre vos titres à tout moment"?**
- A. Canaliser l'épargne.
- **B. Faciliter la liquidité.** ✅
- C. Rendre l'économie transparente.
- D. Diversifier les sources de financement.

## 🔧 Commandes Utiles

### Créer/Recréer le quiz
```bash
cd backend
npx ts-node scripts/create-module1-quiz.ts
```

### Vérifier le quiz dans la base de données
```bash
cd backend
npx prisma studio
```
Naviguer vers : `quizzes` et chercher le quiz lié au module `fondations-bourse-brvm`

## 📊 API Endpoints

### 1. Obtenir le quiz
```
GET /api/learning-modules/fondations-bourse-brvm/quiz
```
- Retourne 10 questions aléatoires (sans les réponses correctes)
- Les questions changent à chaque appel

### 2. Soumettre le quiz
```
POST /api/learning-modules/fondations-bourse-brvm/submit-quiz
Headers: Authorization: Bearer <token>
Body: {
  "answers": [1, 2, 0, 3, ...], // Array de 10 index
  "timeSpent": 300 // secondes (optionnel)
}
```

### 3. Vérifier les tentatives
```
GET /api/learning-modules/fondations-bourse-brvm/quiz-attempts
Headers: Authorization: Bearer <token>
```
Response:
```json
{
  "quiz_attempts": 1,
  "quiz_score": 70,
  "last_quiz_attempt_at": "2024-01-15T10:30:00Z",
  "is_completed": false
}
```

## 🎯 Exemple de Flux Utilisateur

1. **Première tentative**
   - L'étudiant démarre le quiz
   - Obtient 10 questions aléatoires
   - Score: 60% (échec)
   - Tentatives restantes: 1

2. **Deuxième tentative**
   - L'étudiant peut immédiatement réessayer
   - Obtient 10 nouvelles questions aléatoires
   - Score: 70% (échec)
   - Tentatives restantes: 0
   - Doit attendre 8 heures

3. **Après 8 heures**
   - Les tentatives sont réinitialisées
   - L'étudiant peut repasser le quiz
   - Score: 85% (réussite) ✅
   - Module débloqué

## 🔐 Sécurité

- Les bonnes réponses ne sont **jamais** envoyées au client lors de la récupération du quiz
- Les réponses correctes sont stockées uniquement côté serveur
- La validation se fait entièrement côté backend
- Authentification requise pour soumettre le quiz

## 📝 Notes Importantes

- Chaque tentative compte, même si l'étudiant ferme le navigateur
- Le délai de 8 heures est calculé à partir de la dernière tentative échouée
- Le meilleur score est conservé dans la progression de l'étudiant
- Les explications sont fournies uniquement après la soumission du quiz
