// src/routes/community.routes.ts
import { Router } from 'express';
import { auth, optionalAuth } from '../middlewares/auth.middleware';
import * as communityController from '../controllers/community.controller';
import { communityPostCreationLimiter, commentCreationLimiter } from '../middleware/rateLimiter';

const router = Router();

// ============= COMMUNITY CRUD =============
router.get('/', optionalAuth, communityController.listCommunities); // List all communities
router.get('/my', auth, communityController.getUserCommunities); // Get user's communities
router.post('/', auth, communityController.createCommunity); // Create community
router.get('/:idOrSlug', optionalAuth, communityController.getCommunity); // Get community by id or slug
router.put('/:communityId', auth, communityController.updateCommunity); // Update community
router.delete('/:communityId', auth, communityController.deleteCommunity); // Delete community

// ============= MEMBERSHIP =============
router.post('/:communityId/join', auth, communityController.joinCommunity); // Join community
router.delete('/:communityId/leave', auth, communityController.leaveCommunity); // Leave community
router.get('/:communityId/members', communityController.getCommunityMembers); // Get members
router.put('/:communityId/members/:memberId/role', auth, communityController.updateMemberRole); // Update member role
router.delete('/:communityId/members/:memberId', auth, communityController.removeMember); // Remove member

// ============= JOIN REQUESTS =============
router.get('/:communityId/join-requests', auth, communityController.getPendingJoinRequests); // Get pending requests
router.post('/join-requests/:requestId/process', auth, communityController.processJoinRequest); // Process request

// ============= COMMUNITY POSTS =============
router.get('/:communityId/posts', optionalAuth, communityController.getCommunityPosts); // Get posts
router.post('/:communityId/posts', auth, communityPostCreationLimiter, communityController.createCommunityPost); // Create post - Rate limited

// ============= POST INTERACTIONS =============
router.post('/posts/:postId/like', auth, communityController.likeCommunityPost); // Like post
router.delete('/posts/:postId/like', auth, communityController.unlikeCommunityPost); // Unlike post
router.post('/posts/:postId/comments', auth, commentCreationLimiter, communityController.commentCommunityPost); // Comment - Rate limited
router.get('/posts/:postId/comments', communityController.getCommunityPostComments); // Get comments
router.delete('/posts/:postId', auth, communityController.deleteCommunityPost); // Delete post
router.post('/posts/:postId/pin', auth, communityController.togglePinPost); // Pin/unpin post

export default router;
