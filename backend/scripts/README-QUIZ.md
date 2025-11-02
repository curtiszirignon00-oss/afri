# 📝 Guide de Création de Quiz

Ce guide explique comment créer et gérer des quiz pour les modules d'apprentissage.

## 🚀 Utilisation Rapide

### 1. Créer un quiz pour un module

```bash
npm run create-quiz
```

Ce script crée automatiquement un quiz exemple pour le module `introduction-brvm`.

### 2. Personnaliser le quiz

Modifiez le fichier `scripts/create-quiz.ts` :

```typescript
// Changer le slug du module cible
const module = await prisma.learningModule.findFirst({
  where: { slug: 'votre-module-slug' } // Modifier ici
});

// Changer le score de passage
passing_score: 80, // Défaut: 70%

// Ajouter/modifier les questions
questions: [
  {
    id: 'q1',
    question: "Votre question ici ?",
    options: [
      "Réponse A",
      "Réponse B (correcte)",
      "Réponse C",
      "Réponse D"
    ],
    correct_answer: 1, // Index de la bonne réponse (0-based)
    explanation: "Explication de la réponse correcte"
  }
]
```

## 📋 Structure d'un Quiz

### Format JSON dans MongoDB

```json
{
  "_id": "ObjectId",
  "moduleId": "ObjectId du module",
  "passing_score": 70,
  "questions": [
    {
      "id": "q1",
      "question": "Qu'est-ce que la BRVM ?",
      "options": [
        "Option 1",
        "Option 2 (correcte)",
        "Option 3"
      ],
      "correct_answer": 1,
      "explanation": "Explication détaillée"
    }
  ],
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

### Champs obligatoires

| Champ | Type | Description |
|-------|------|-------------|
| `moduleId` | ObjectId | ID du module d'apprentissage |
| `passing_score` | Number | Score minimum pour réussir (0-100) |
| `questions` | Array | Liste des questions du quiz |

### Structure d'une question

| Champ | Type | Description | Obligatoire |
|-------|------|-------------|-------------|
| `id` | String | Identifiant unique de la question | ✅ |
| `question` | String | Texte de la question | ✅ |
| `options` | Array\<String\> | Liste des réponses possibles | ✅ |
| `correct_answer` | Number | Index de la bonne réponse (0-based) | ✅ |
| `explanation` | String | Explication de la réponse | ❌ |

## ✅ Bonnes Pratiques

### 1. Questions claires et précises
- ✅ Utilisez un langage simple
- ✅ Évitez les questions pièges
- ✅ Une seule bonne réponse par question

### 2. Options de réponse
- ✅ 3 à 4 options par question (recommandé)
- ✅ Options de longueur similaire
- ✅ Pas d'indices évidents (ex: toujours la plus longue)

### 3. Explications
- ✅ Toujours fournir une explication
- ✅ Expliquer POURQUOI la réponse est correcte
- ✅ Mentionner les concepts importants

### 4. Nombre de questions
- ✅ 5-15 questions par quiz (recommandé)
- ✅ Couvre tous les concepts du module
- ✅ Difficulté progressive

### 5. Score de passage
- ✅ 70% pour les modules débutants
- ✅ 80% pour les modules intermédiaires
- ✅ 90% pour les modules avancés

## 🔧 Gestion des Quiz

### Lister tous les quiz

```bash
npx prisma studio
# Ouvrir la table "quizzes"
```

### Modifier un quiz existant

```typescript
await prisma.quiz.update({
  where: { id: 'quiz-id' },
  data: {
    passing_score: 80,
    questions: [/* nouvelles questions */]
  }
});
```

### Supprimer un quiz

```typescript
await prisma.quiz.delete({
  where: { id: 'quiz-id' }
});

// Mettre à jour le module
await prisma.learningModule.update({
  where: { id: 'module-id' },
  data: { has_quiz: false }
});
```

## 📊 Exemple Complet

Voici un quiz complet avec bonnes pratiques :

```typescript
{
  moduleId: module.id,
  passing_score: 75,
  questions: [
    {
      id: 'intro-q1',
      question: "Qu'est-ce que la BRVM ?",
      options: [
        "Une banque centrale",
        "Une bourse régionale",
        "Un marché de change",
        "Une agence de notation"
      ],
      correct_answer: 1,
      explanation: "La BRVM est la Bourse Régionale des Valeurs Mobilières de l'UEMOA, créée en 1996."
    },
    {
      id: 'intro-q2',
      question: "Combien de pays composent l'UEMOA ?",
      options: [
        "6 pays",
        "8 pays",
        "10 pays",
        "15 pays"
      ],
      correct_answer: 1,
      explanation: "L'UEMOA regroupe 8 pays: Bénin, Burkina Faso, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal et Togo."
    },
    {
      id: 'intro-q3',
      question: "Dans quelle ville se trouve le siège de la BRVM ?",
      options: [
        "Dakar",
        "Abidjan",
        "Ouagadougou",
        "Lomé"
      ],
      correct_answer: 1,
      explanation: "Le siège de la BRVM est situé à Abidjan, capitale économique de la Côte d'Ivoire."
    }
  ]
}
```

## 🎯 Système de Limitation

### Règles par défaut
- ✅ **3 tentatives maximum** par quiz
- ✅ **Délai de 8 heures** après la 3ème tentative
- ✅ Le compteur se **réinitialise** après 8h

### Modifier les limites

Dans `src/services/learning.service.prisma.ts` :

```typescript
const MAX_ATTEMPTS = 3;           // Nombre de tentatives
const RETRY_DELAY_HOURS = 8;      // Délai en heures
```

## 📝 Checklist avant Publication

Avant de publier un quiz en production :

- [ ] Au moins 5 questions par quiz
- [ ] Toutes les questions ont des explications
- [ ] Le score de passage est approprié
- [ ] Les options de réponse n'ont pas d'indices évidents
- [ ] Testé avec succès
- [ ] Le module a `has_quiz: true`
- [ ] Questions couvrent tous les concepts du module

## 🐛 Dépannage

### "Module non trouvé"
Vérifiez le slug du module :
```bash
npx prisma studio
# Table: learning_modules → Colonne: slug
```

### "Quiz existe déjà"
Le script vous demandera si vous voulez le remplacer.

### Erreur Prisma
```bash
npx prisma generate
npm run dev
```

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs/)
- [Documentation MongoDB](https://www.mongodb.com/docs/)
- [Guide des Quiz Pédagogiques](https://www.edutopia.org/article/creating-effective-quizzes)

---

💡 **Astuce** : Utilisez Prisma Studio pour visualiser et modifier vos quiz en mode graphique !

```bash
npx prisma studio
```
