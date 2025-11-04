# Solutions pour l'erreur EPERM de Prisma Generate

## Problème
```
Error: EPERM: operation not permitted, rename
'C:\Users\HP\OneDrive\Desktop\afri\backend\node_modules\.prisma\client\query_engine-windows.dll.node.tmp...'
```

Cette erreur survient lorsque **OneDrive** synchronise votre dossier de projet et verrouille les fichiers dans `node_modules\.prisma`.

---

## ✅ Solution 1: Script Automatique (RECOMMANDÉ)

Exécutez simplement le script PowerShell fourni :

```powershell
.\fix-prisma-generate.ps1
```

Ou utilisez le script npm :

```bash
npm run prisma:clean
```

---

## ✅ Solution 2: Nettoyage Manuel

### Étape 1: Arrêter tous les processus Node
Dans PowerShell :
```powershell
Get-Process node | Stop-Process -Force
```

### Étape 2: Supprimer les dossiers Prisma
```powershell
Remove-Item -Path .\node_modules\.prisma -Recurse -Force
Remove-Item -Path .\node_modules\@prisma\client -Recurse -Force
```

### Étape 3: Régénérer
```bash
npx prisma generate
```

---

## ✅ Solution 3: Exclure node_modules de OneDrive (MEILLEURE SOLUTION À LONG TERME)

Cette solution empêche OneDrive de synchroniser `node_modules`, ce qui résout définitivement le problème.

### Méthode 1: Via les attributs Windows
```powershell
attrib +U "C:\Users\HP\OneDrive\Desktop\afri\backend\node_modules"
```

### Méthode 2: Via les paramètres OneDrive
1. Clic droit sur l'icône **OneDrive** dans la barre des tâches
2. Sélectionnez **Paramètres**
3. Allez dans l'onglet **Compte** → **Choisir des dossiers**
4. Décochez le dossier `backend\node_modules`

### Méthode 3: Créer un .gitignore local pour OneDrive
OneDrive respecte certains fichiers spéciaux. Créez un fichier nommé `.odignore` :
```
node_modules/
.prisma/
dist/
```

---

## ✅ Solution 4: Exécuter en tant qu'Administrateur

Parfois, les permissions Windows nécessitent des droits d'administrateur :

1. Clic droit sur **PowerShell** ou **Terminal**
2. Sélectionnez **Exécuter en tant qu'administrateur**
3. Naviguez vers le projet :
```powershell
cd "C:\Users\HP\OneDrive\Desktop\afri\backend"
```
4. Exécutez :
```bash
npx prisma generate
```

---

## ✅ Solution 5: Déplacer le projet hors de OneDrive

Si aucune des solutions ci-dessus ne fonctionne, déplacez le projet vers un dossier qui n'est pas synchronisé par OneDrive :

```powershell
# Exemple: déplacer vers C:\Projects
xcopy "C:\Users\HP\OneDrive\Desktop\afri" "C:\Projects\afri" /E /I /H
cd C:\Projects\afri\backend
npm install
npx prisma generate
```

---

## ✅ Solution 6: Ajouter une exception à l'antivirus

Certains antivirus bloquent les opérations sur les fichiers `.dll.node`.

### Windows Defender
1. Ouvrez **Sécurité Windows**
2. **Protection contre les virus et menaces** → **Gérer les paramètres**
3. **Exclusions** → **Ajouter ou supprimer des exclusions**
4. Ajoutez le dossier : `C:\Users\HP\OneDrive\Desktop\afri\backend\node_modules`

---

## 🔧 Scripts npm disponibles

Le fichier `package.json` inclut maintenant ces scripts utiles :

```bash
# Nettoyer et régénérer Prisma
npm run prisma:clean

# Juste régénérer
npm run prisma:generate

# Ouvrir Prisma Studio
npm run prisma:studio
```

---

## 📋 Checklist de Diagnostic

Si le problème persiste, vérifiez :

- [ ] Aucun processus Node.js n'est en cours (`Get-Process node`)
- [ ] Aucun serveur de développement n'est actif
- [ ] OneDrive ne synchronise pas `node_modules`
- [ ] Vous avez les droits d'administrateur
- [ ] Votre antivirus ne bloque pas l'opération
- [ ] Le fichier `.env` contient bien `DATABASE_URI`
- [ ] La connexion MongoDB fonctionne (test déjà fait ✅)

---

## 🎯 Prochaines Étapes

Une fois Prisma généré avec succès :

1. **Démarrer le serveur** :
```bash
npm run dev
```

2. **Tester la connexion à MongoDB** :
```bash
node test-mongo-conn.js
```

3. **Explorer la base de données** :
```bash
npm run prisma:studio
```

---

## 🆘 Besoin d'aide ?

Si aucune de ces solutions ne fonctionne :
1. Vérifiez les logs complets de l'erreur
2. Essayez de redémarrer votre ordinateur
3. Assurez-vous que OneDrive a terminé toutes les synchronisations en cours
