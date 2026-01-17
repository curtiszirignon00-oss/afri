// backend/src/routes/profile.routes.ts
// Routes pour la gestion du profil social

import { Router } from 'express';
import { auth, optionalAuth } from '../middlewares/auth.middleware';
import {
  getPublicProfile,
  getMyProfile,
  getMyStats,
  updateMyProfile,
  updateMyPrivacy,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getSuggestions
} from '../controllers/profile.controller';

const router = Router();

// =====================================
// ROUTES PROTÉGÉES (Authentification requise)
// IMPORTANT: Ces routes doivent être AVANT /:userId pour éviter
// que "me" soit interprété comme un userId
// =====================================

/**
 * GET /api/profile/me
 * Récupère le profil complet de l'utilisateur connecté
 * Protégé
 */
router.get('/me', auth, getMyProfile);

/**
 * GET /api/profile/me/stats
 * Statistiques de l'utilisateur connecté
 * Protégé
 */
router.get('/me/stats', auth, getMyStats);

/**
 * PUT /api/profile/me
 * Met à jour le profil social
 * Protégé
 */
router.put('/me', auth, updateMyProfile);

/**
 * PATCH /api/profile/me/privacy
 * Met à jour les paramètres de confidentialité
 * Protégé
 */
router.patch('/me/privacy', auth, updateMyPrivacy);

// =====================================
// ROUTES PUBLIQUES
// =====================================

/**
 * GET /api/profile/:userId
 * Récupère le profil public d'un utilisateur
 * Public avec auth optionnelle (pour calculer isFollowing si connecté)
 */
router.get('/:userId', optionalAuth, getPublicProfile);

/**
 * GET /api/profile/:userId/followers
 * Liste des abonnés (selon confidentialité)
 */
router.get('/:userId/followers', getFollowers);

/**
 * GET /api/profile/:userId/following
 * Liste des abonnements (selon confidentialité)
 */
router.get('/:userId/following', getFollowing);

/**
 * POST /api/profile/:userId/follow
 * Suivre un utilisateur
 * Protégé
 */
router.post('/:userId/follow', auth, followUser);

/**
 * DELETE /api/profile/:userId/unfollow
 * Ne plus suivre un utilisateur
 * Protégé
 */
router.delete('/:userId/unfollow', auth, unfollowUser);

/**
 * GET /api/profile/suggestions
 * Suggestions d'amis
 * Protégé
 */
router.get('/suggestions', auth, getSuggestions);

export default router;