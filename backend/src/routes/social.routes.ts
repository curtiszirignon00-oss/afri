// src/routes/social.routes.ts
import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import * as socialController from '../controllers/social.controller';

const router = Router();

// ============= FOLLOW ROUTES =============
router.post('/follow/:userId', auth, socialController.followUser);
router.delete('/follow/:userId', auth, socialController.unfollowUser);
router.get('/followers/:userId', socialController.getFollowers);
router.get('/following/:userId', socialController.getFollowing);

// ============= POST ROUTES =============
router.get('/community', socialController.getPublicPosts); // Public community feed (no auth required)
router.get('/feed', auth, socialController.getFeed);
router.get('/posts/:userId', socialController.getUserPosts);
router.post('/posts', auth, socialController.createPost);
router.get('/post/:postId', auth, socialController.getPost);
router.put('/post/:postId', auth, socialController.updatePost);
router.delete('/post/:postId', auth, socialController.deletePost);

// ============= LIKE ROUTES =============
router.post('/posts/:postId/like', auth, socialController.likePost);
router.delete('/posts/:postId/like', auth, socialController.unlikePost);

// ============= COMMENT ROUTES =============
router.post('/posts/:postId/comments', auth, socialController.commentPost);
router.get('/posts/:postId/comments', socialController.getPostComments);

export default router;
