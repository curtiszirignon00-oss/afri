# 📁 Instructions pour les images

## 🖼️ Images à copier

Pour que les images s'affichent correctement, copiez les fichiers depuis le backend vers ces dossiers :

### Images de fond (backgrounds)

Copiez depuis `backend/public/images/` vers `afribourse/public/images/` :
- `brvm-growth.png`
- `financial-ratios.png`
- `sonatel-dividend.png`

### Avatars (témoignages)

Copiez depuis `backend/public/avatars/` vers `afribourse/public/avatars/` :
- `aminata.png`
- `kwame.png`
- `fatou.png`

## 💻 Commande rapide

```bash
# Depuis la racine du projet
cp backend/public/images/* afribourse/public/images/ 2>/dev/null || true
cp backend/public/avatars/* afribourse/public/avatars/ 2>/dev/null || true
```

Ou sur Windows :

```cmd
xcopy backend\public\images\* afribourse\public\images\ /Y
xcopy backend\public\avatars\* afribourse\public\avatars\ /Y
```

## 📝 Alternative : Images de placeholder

Si vous n'avez pas les images, vous pouvez utiliser des placeholders en attendant :

- https://via.placeholder.com/800x600/0ea5e9/ffffff?text=BRVM+Growth
- https://via.placeholder.com/800x600/10b981/ffffff?text=Financial+Ratios
- https://via.placeholder.com/800x600/f59e0b/ffffff?text=Sonatel+Dividend

Pour les avatars :
- https://ui-avatars.com/api/?name=Aminata+Diallo&background=0ea5e9&color=fff
- https://ui-avatars.com/api/?name=Kwame+Mensah&background=10b981&color=fff
- https://ui-avatars.com/api/?name=Fatou+Kone&background=f59e0b&color=fff

## ⚠️ Important

Ces images seront incluses dans le build du frontend (`npm run build`) et déployées avec l'application.

Si les images sont très volumineuses, envisagez d'utiliser un CDN (Cloudinary, AWS S3, etc.).
