// src/routes/upload.routes.ts
import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import {
    handleAvatarUpload,
    handleBannerUpload,
    handlePostImagesUpload,
    handleDeleteImage
} from '../controllers/upload.controller';

const router = Router();

// ========================================
// ROUTES D'UPLOAD (Toutes protégées)
// ========================================

/**
 * POST /api/upload/avatar
 * Upload d'une image de profil (avatar)
 * Body: multipart/form-data avec champ "avatar"
 */
router.post('/avatar', auth, handleAvatarUpload);

/**
 * POST /api/upload/banner
 * Upload d'une bannière de profil
 * Body: multipart/form-data avec champ "banner"
 */
router.post('/banner', auth, handleBannerUpload);

/**
 * POST /api/upload/post-images
 * Upload d'images pour un post (max 5)
 * Body: multipart/form-data avec champ "images"
 */
router.post('/post-images', auth, handlePostImagesUpload);

/**
 * DELETE /api/upload/:type/:filename
 * Suppression d'une image
 * Params: type (avatars, banners, posts), filename
 */
router.delete('/:type/:filename', auth, handleDeleteImage);

export default router;
