# 🎨 GUIDE RAPIDE - MODIFIER LES COULEURS DES MODULES

## ✅ Résumé de la situation

**Actuellement** : Les couleurs fonctionnent via le CSS (classes `.pedagogical-objective`, `.analogy-box`, etc.)

**Problème** : Les classes Tailwind (`bg-blue-600`, `bg-amber-100`, etc.) dans le HTML des modules ne s'affichent PAS car le CSS les surcharge.

---

## 🚀 SOLUTION : 2 façons de colorer vos modules

### **Option 1 : Utiliser les classes CSS (FONCTIONNE DÉJÀ)**

Dans Prisma Studio, utilisez ces classes dans votre HTML :

```html
<!-- Encadré BLEU (objectif) -->
<div class="pedagogical-objective">
  <h2>🎯 Objectif</h2>
  <p>Votre contenu...</p>
</div>

<!-- Encadré JAUNE (analogie) -->
<div class="analogy-box">
  <h3>💡 Analogie</h3>
  <p>Votre contenu...</p>
</div>

<!-- Encadré VIOLET (exemple) -->
<div class="example-box">
  <h3>🎯 Exemple</h3>
  <p>Votre contenu...</p>
</div>

<!-- Encadré VERT (points clés) -->
<div class="key-points-box">
  <h3>💎 À retenir</h3>
  <p>Votre contenu...</p>
</div>

<!-- Encadré ROUGE (attention) -->
<div class="warning-box">
  <h3>⚠️ Attention</h3>
  <p>Votre contenu...</p>
</div>
```

### **Option 2 : Utiliser les classes Tailwind directes (NE FONCTIONNE PAS ENCORE)**

Si vous voulez utiliser les classes Tailwind du HTML (`bg-blue-600`, etc.), il faut **supprimer** le fichier `module-professional.css` complètement.

---

## 💡 RECOMMANDATION

**Utilisez l'Option 1** (classes CSS) car :
- ✅ Ça fonctionne déjà
- ✅ Design cohérent
- ✅ Facile à modifier
- ✅ Pas besoin de connaître tous les noms de classes Tailwind

---

## 📝 MODIFIER UN MODULE (Étape par étape)

### Étape 1 : Ouvrir Prisma Studio
```bash
cd c:\Users\HP\OneDrive\Desktop\afri\backend
npx prisma studio
```
👉 Ouvre http://localhost:5555

### Étape 2 : Sélectionner le module
1. Cliquez sur **LearningModule** à gauche
2. Trouvez le module que vous voulez modifier
3. Cliquez dessus

### Étape 3 : Modifier le contenu
1. Cliquez dans le champ **content**
2. Remplacez le HTML par le nouveau contenu
3. Utilisez les exemples ci-dessous
4. Cliquez sur **Save 1 change**

### Étape 4 : Voir le résultat
1. Allez sur votre site
2. Appuyez sur **F5** (ou Ctrl+R) pour rafraîchir
3. Ouvrez le module modifié

---

## 🎯 TEMPLATE COMPLET

Copiez ce template dans le champ `content` de Prisma Studio :

```html
<!-- OBJECTIF PÉDAGOGIQUE -->
<div class="pedagogical-objective">
  <h2>🎯 Objectif Pédagogique</h2>
  <p>À la fin de ce module, vous serez capable :</p>
  <ul>
    <li>Premier objectif</li>
    <li>Deuxième objectif</li>
    <li>Troisième objectif</li>
  </ul>
</div>

<!-- TITRE PRINCIPAL -->
<h2>🧩 Premier chapitre</h2>

<p>Votre paragraphe d'introduction ici...</p>

<!-- ANALOGIE (Jaune/Orange) -->
<div class="analogy-box">
  <h3>💡 L'analogie à retenir</h3>
  <p>Imaginez que la bourse est comme...</p>
</div>

<!-- EXEMPLE (Violet) -->
<div class="example-box">
  <h3>🎯 Exemple concret</h3>
  <p>Par exemple, si vous investissez 100 000 FCFA...</p>
</div>

<!-- POINTS CLÉS (Vert) -->
<div class="key-points-box">
  <h3>💎 À retenir</h3>
  <ul>
    <li>Point important numéro 1</li>
    <li>Point important numéro 2</li>
    <li>Point important numéro 3</li>
  </ul>
</div>

<!-- ATTENTION (Rouge) -->
<div class="warning-box">
  <h3>⚠️ Attention</h3>
  <p>N'oubliez jamais que...</p>
</div>

<!-- DEUXIÈME CHAPITRE -->
<h2>📊 Deuxième chapitre</h2>

<p>Votre contenu ici...</p>
```

---

## ✨ PERSONNALISATION

### Changer les couleurs du CSS

Si vous voulez changer les couleurs par défaut des encadrés, modifiez le fichier :
`c:\Users\HP\OneDrive\Desktop\afri\afribourse\src\styles\module-professional.css`

**Exemple** : Pour changer l'encadré jaune en rose :

**AVANT** :
```css
.module-content .analogy-box {
  @apply bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-r-xl p-6 my-6 shadow-sm;
}
```

**APRÈS** :
```css
.module-content .analogy-box {
  @apply bg-gradient-to-br from-pink-50 to-rose-50 border-l-4 border-pink-500 rounded-r-xl p-6 my-6 shadow-sm;
}
```

### Couleurs disponibles

Remplacez `amber` par l'une de ces couleurs :
- `blue` (bleu)
- `indigo` (indigo)
- `purple` (violet)
- `pink` (rose)
- `red` (rouge)
- `orange` (orange)
- `yellow` (jaune)
- `green` (vert)
- `emerald` (émeraude)
- `cyan` (cyan)
- `gray` (gris)

---

## 🛠️ DÉPANNAGE

### Les couleurs n'apparaissent pas ?

1. **Rafraîchissez** avec Ctrl+Shift+R (rafraîchissement forcé)
2. **Vérifiez** que vous avez utilisé les bonnes classes : `pedagogical-objective`, `analogy-box`, `example-box`, `key-points-box`, `warning-box`
3. **Vérifiez** qu'il n'y a pas d'erreur dans le HTML (balises fermantes manquantes)

### Le texte est mal formaté ?

- Vérifiez que chaque `<div>` a son `</div>`
- Vérifiez que chaque `<p>` a son `</p>`
- Vérifiez que chaque `<h2>` a son `</h2>`

### Je veux revenir en arrière ?

Si vous cassez un module, ouvrez Prisma Studio et cliquez sur **"Discard changes"** avant de sauvegarder.

---

## 📞 AIDE RAPIDE

**Pour modifier un module** : Prisma Studio → LearningModule → Cliquer sur le module → Modifier `content` → Save

**Classes disponibles** :
- `pedagogical-objective` = Bleu
- `analogy-box` = Jaune/Orange
- `example-box` = Violet
- `key-points-box` = Vert
- `warning-box` = Rouge

**Modifier les couleurs** : Éditez `afribourse/src/styles/module-professional.css`

---

Bon courage ! 🚀
