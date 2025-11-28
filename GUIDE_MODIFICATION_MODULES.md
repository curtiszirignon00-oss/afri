# 📘 GUIDE : MODIFIER LES MODULES FACILEMENT

## 🚀 MÉTHODE SIMPLE : Utiliser Prisma Studio

### Étape 1 : Ouvrir Prisma Studio

```bash
cd c:\Users\HP\OneDrive\Desktop\afri\backend
npx prisma studio
```

👉 Une page web s'ouvre automatiquement à : **http://localhost:5555**

### Étape 2 : Modifier un module

1. **Cliquez sur "LearningModule"** dans la barre de gauche
2. **Trouvez le module** que vous voulez modifier (Module 0, 1, 2, etc.)
3. **Cliquez sur la ligne du module**
4. **Cliquez dans le champ "content"** → Une grande zone de texte s'ouvre
5. **Modifiez le HTML** (voir exemples ci-dessous)
6. **Cliquez sur "Save 1 change"** en haut à droite
7. **Rafraîchissez votre site** (F5) pour voir les changements

---

## 🎨 EXEMPLES DE COULEURS

### Encadré BLEU (Objectif pédagogique)

```html
<div class="bg-blue-100 border-l-4 border-blue-500 rounded-r-xl p-6 my-6">
  <h3 class="text-lg font-bold text-blue-900 mb-3">🎯 Objectif</h3>
  <p>Votre texte ici...</p>
</div>
```

### Encadré JAUNE/ORANGE (Analogie, astuce)

```html
<div class="bg-amber-100 border-l-4 border-amber-500 rounded-r-xl p-6 my-6">
  <h3 class="text-lg font-bold text-amber-900 mb-3">💡 Astuce</h3>
  <p>Votre texte ici...</p>
</div>
```

### Encadré VIOLET (Exemple)

```html
<div class="bg-purple-100 border-l-4 border-purple-500 rounded-r-xl p-6 my-6">
  <h3 class="text-lg font-bold text-purple-900 mb-3">🎯 Exemple</h3>
  <p>Votre texte ici...</p>
</div>
```

### Encadré VERT (Points clés à retenir)

```html
<div class="bg-green-100 border-l-4 border-green-500 rounded-r-xl p-6 my-6">
  <h3 class="text-lg font-bold text-green-900 mb-3">💎 À retenir</h3>
  <ul>
    <li>Point 1</li>
    <li>Point 2</li>
  </ul>
</div>
```

### Encadré ROUGE (Attention, avertissement)

```html
<div class="bg-red-100 border-l-4 border-red-500 rounded-r-xl p-6 my-6">
  <h3 class="text-lg font-bold text-red-900 mb-3">⚠️ Attention</h3>
  <p>Votre texte ici...</p>
</div>
```

---

## 🌈 TOUTES LES COULEURS DISPONIBLES

Remplacez les couleurs dans les exemples ci-dessus :

| Couleur | Remplacer `blue` par : |
|---------|----------------------|
| **Bleu** | `blue` |
| **Indigo** | `indigo` |
| **Violet** | `purple` |
| **Rose** | `pink` |
| **Rouge** | `red` |
| **Orange** | `orange` |
| **Jaune/Ambre** | `amber` ou `yellow` |
| **Vert** | `green` ou `emerald` |
| **Cyan** | `cyan` |
| **Gris** | `gray` |

**Exemple** : Pour un encadré rose :
```html
<div class="bg-pink-100 border-l-4 border-pink-500 rounded-r-xl p-6 my-6">
  <h3 class="text-lg font-bold text-pink-900 mb-3">💝 Conseil</h3>
  <p>Votre texte ici...</p>
</div>
```

---

## 📝 AJOUTER DU TEXTE

### Titre principal

```html
<h2 class="text-2xl font-bold text-gray-900 mb-6 mt-10">
  🧩 Mon titre principal
</h2>
```

### Sous-titre

```html
<h3 class="text-xl font-bold text-gray-800 mb-4 mt-8">
  📊 Mon sous-titre
</h3>
```

### Paragraphe

```html
<p class="text-lg text-gray-700 mb-4">
  Mon paragraphe de texte...
</p>
```

### Texte en gras

```html
<p class="text-lg text-gray-700 mb-4">
  Voici un <strong>mot important</strong> dans le texte.
</p>
```

---

## 📋 AJOUTER DES LISTES

### Liste à puces

```html
<ul class="list-disc list-inside mb-6 space-y-2 text-gray-700 ml-4">
  <li>Premier point</li>
  <li>Deuxième point</li>
  <li>Troisième point</li>
</ul>
```

### Liste numérotée

```html
<ol class="list-decimal list-inside mb-6 space-y-2 text-gray-700 ml-4">
  <li>Première étape</li>
  <li>Deuxième étape</li>
  <li>Troisième étape</li>
</ol>
```

---

## 📏 MODIFIER LA TAILLE DU TEXTE

```html
<!-- Petit texte -->
<p class="text-sm">Petit texte</p>

<!-- Texte normal -->
<p class="text-base">Texte normal</p>

<!-- Texte moyen -->
<p class="text-lg">Texte moyen</p>

<!-- Grand texte -->
<p class="text-xl">Grand texte</p>

<!-- Très grand texte -->
<p class="text-2xl">Très grand texte</p>

<!-- Titre énorme -->
<h2 class="text-3xl font-bold">Titre énorme</h2>
```

---

## ⬜ MODIFIER LES ESPACEMENTS

```html
<!-- Espacement en bas -->
<div class="mb-2">Petit espacement (0.5rem)</div>
<div class="mb-4">Moyen espacement (1rem)</div>
<div class="mb-6">Grand espacement (1.5rem)</div>
<div class="mb-8">Très grand espacement (2rem)</div>

<!-- Espacement en haut -->
<div class="mt-4">Espacement en haut</div>

<!-- Padding (espace intérieur) -->
<div class="p-4">Padding normal</div>
<div class="p-6">Padding moyen</div>
<div class="p-8">Grand padding</div>
```

---

## 📊 AJOUTER UN TABLEAU

```html
<table class="w-full border-collapse my-8 shadow-md rounded-lg overflow-hidden">
  <thead class="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
    <tr>
      <th class="px-6 py-4 text-left font-bold">Colonne 1</th>
      <th class="px-6 py-4 text-left font-bold">Colonne 2</th>
      <th class="px-6 py-4 text-left font-bold">Colonne 3</th>
    </tr>
  </thead>
  <tbody>
    <tr class="bg-white">
      <td class="px-6 py-4 border-b">Donnée 1</td>
      <td class="px-6 py-4 border-b">Donnée 2</td>
      <td class="px-6 py-4 border-b">Donnée 3</td>
    </tr>
    <tr class="bg-gray-50">
      <td class="px-6 py-4 border-b">Donnée 4</td>
      <td class="px-6 py-4 border-b">Donnée 5</td>
      <td class="px-6 py-4 border-b">Donnée 6</td>
    </tr>
  </tbody>
</table>
```

---

## 🎯 TEMPLATE COMPLET

Copiez ce template et modifiez-le selon vos besoins :

```html
<!-- OBJECTIF (BLEU) -->
<div class="bg-blue-100 border-l-4 border-blue-500 rounded-r-xl p-6 my-6">
  <h3 class="text-lg font-bold text-blue-900 mb-3">🎯 Objectif</h3>
  <p>À la fin de ce module, vous serez capable de :</p>
  <ul class="list-disc ml-6 mt-2">
    <li>Objectif 1</li>
    <li>Objectif 2</li>
  </ul>
</div>

<!-- TITRE PRINCIPAL -->
<h2 class="text-2xl font-bold text-gray-900 mb-6 mt-10">
  🧩 Mon titre de section
</h2>

<!-- PARAGRAPHE -->
<p class="text-lg text-gray-700 mb-4">
  Mon paragraphe d'introduction...
</p>

<!-- ANALOGIE (JAUNE) -->
<div class="bg-amber-100 border-l-4 border-amber-500 rounded-r-xl p-6 my-6">
  <h3 class="text-lg font-bold text-amber-900 mb-3">💡 Analogie</h3>
  <p>Imaginez que...</p>
</div>

<!-- EXEMPLE (VIOLET) -->
<div class="bg-purple-100 border-l-4 border-purple-500 rounded-r-xl p-6 my-6">
  <h3 class="text-lg font-bold text-purple-900 mb-3">🎯 Exemple</h3>
  <p>Par exemple, si vous...</p>
</div>

<!-- POINTS CLÉS (VERT) -->
<div class="bg-green-100 border-l-4 border-green-500 rounded-r-xl p-6 my-6">
  <h3 class="text-lg font-bold text-green-900 mb-3">💎 À retenir</h3>
  <ul class="list-disc ml-6">
    <li>Point important 1</li>
    <li>Point important 2</li>
  </ul>
</div>

<!-- ATTENTION (ROUGE) -->
<div class="bg-red-100 border-l-4 border-red-500 rounded-r-xl p-6 my-6">
  <h3 class="text-lg font-bold text-red-900 mb-3">⚠️ Attention</h3>
  <p>Message d'avertissement...</p>
</div>
```

---

## ✅ CONSEILS PRATIQUES

1. **Toujours fermer les balises** : `<div>` doit avoir `</div>`, `<p>` doit avoir `</p>`
2. **Sauvegarder souvent** dans Prisma Studio
3. **Rafraîchir le navigateur** (F5) pour voir les changements
4. **Tester sur un module** avant de modifier les autres
5. **Copier/coller** les exemples ci-dessus et modifier le texte

## ⚠️ À ÉVITER

- ❌ Ne supprimez pas les guillemets dans `class="..."`
- ❌ Ne mélangez pas les balises (ex: `<div><p></div></p>` est incorrect)
- ❌ N'oubliez pas de sauvegarder après chaque modification

---

## 🆘 EN CAS DE PROBLÈME

**Si vous cassez le HTML par accident :**
1. Dans Prisma Studio, cliquez sur **"Discard changes"** (annuler)
2. Ou rechargez la page de Prisma Studio (F5)

**Si les changements n'apparaissent pas :**
1. Vérifiez que vous avez cliqué sur **"Save 1 change"**
2. Rafraîchissez votre site avec **Ctrl+Shift+R** (rafraîchissement forcé)

---

**Bonne modification ! 🎨**
