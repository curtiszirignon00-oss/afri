// src/routes/community.routes.ts
import { Router } from 'express';
import { auth, optionalAuth } from '../middlewares/auth.middleware';
import * as communityController from '../controllers/community.controller';
import { communityPostCreationLimiter, commentCreationLimiter } from '../middleware/rateLimiter';
import {
    validateCreateCommunity, validateUpdateCommunity, validateUpdateMemberRole,
    validateProcessJoinRequest, validateCreateCommunityPost, validateCommentCommunityPost,
} from '../validation/community.validation';

const router = Router();

// ============= UNSEEN POSTS =============
router.get('/unseen-count', auth, communityController.getUnseenPostsCount); // Get unseen post count
router.post('/mark-visited', auth, communityController.markCommunityVisited); // Mark community as visited

// ============= COMMUNITY CRUD =============
router.get('/', optionalAuth, communityController.listCommunities); // List all communities
router.get('/my', auth, communityController.getUserCommunities); // Get user's communities
router.post('/', auth, validateCreateCommunity, communityController.createCommunity); // Create community

// ============= INVITE LINKS (avant /:idOrSlug pour éviter le conflit) =============
router.get('/invite/:token', optionalAuth, communityController.getCommunityPreviewByInvite); // Preview community via invite (no auth)
router.post('/invite/:token/join', auth, communityController.joinByInvite); // Join via invite link

// ============= ROUTES DYNAMIQUES (doivent être après les routes statiques) =============
router.get('/:idOrSlug', optionalAuth, communityController.getCommunity); // Get community by id or slug
router.put('/:communityId', auth, validateUpdateCommunity, communityController.updateCommunity); // Update community
router.delete('/:communityId', auth, communityController.deleteCommunity); // Delete community
router.get('/:communityId/invite', auth, communityController.getOrCreateInviteLink); // Get/create invite token (admin/owner)
router.post('/:communityId/invite/regenerate', auth, communityController.regenerateInviteLink); // Regenerate invite token

// ============= MEMBERSHIP =============
router.post('/:communityId/join', auth, communityController.joinCommunity); // Join community
router.delete('/:communityId/leave', auth, communityController.leaveCommunity); // Leave community
router.get('/:communityId/members', optionalAuth, communityController.getCommunityMembers); // Get members
router.put('/:communityId/members/:memberId/role', auth, validateUpdateMemberRole, communityController.updateMemberRole); // Update member role
router.delete('/:communityId/members/:memberId', auth, communityController.removeMember); // Remove member

// ============= JOIN REQUESTS =============
router.get('/:communityId/join-requests', auth, communityController.getPendingJoinRequests); // Get pending requests
router.post('/join-requests/:requestId/process', auth, validateProcessJoinRequest, communityController.processJoinRequest); // Process request

// ============= COMMUNITY POSTS =============
router.get('/:communityId/posts', optionalAuth, communityController.getCommunityPosts); // Get posts
router.post('/:communityId/posts', auth, communityPostCreationLimiter, validateCreateCommunityPost, communityController.createCommunityPost); // Create post - Rate limited

// ============= TASK LISTS =============
router.get('/posts/:postId/tasks/checks', optionalAuth, communityController.getTaskChecks); // Get task checks
router.post('/posts/:postId/tasks/:taskId/check', auth, communityController.toggleTaskCheck); // Toggle task check

// ============= SURVEYS =============
router.get('/posts/:postId/survey/responses', auth, communityController.getSurveyResponses); // Get responses
router.post('/posts/:postId/survey/respond', auth, communityController.submitSurveyResponse); // Submit response
router.post('/posts/:postId/survey/toggle-public', auth, communityController.toggleSurveyResponsesPublic); // Toggle public

// ============= SINGLE POST =============
router.get('/posts/:postId', optionalAuth, communityController.getCommunityPost); // Get a single post (page dédiée HTML)

// ============= POST INTERACTIONS =============
router.post('/posts/:postId/like', auth, communityController.likeCommunityPost); // Like post
router.delete('/posts/:postId/like', auth, communityController.unlikeCommunityPost); // Unlike post
router.post('/posts/:postId/comments', auth, commentCreationLimiter, validateCommentCommunityPost, communityController.commentCommunityPost); // Comment - Rate limited
router.get('/posts/:postId/comments', optionalAuth, communityController.getCommunityPostComments); // Get comments
router.delete('/posts/:postId', auth, communityController.deleteCommunityPost); // Delete post
router.post('/posts/:postId/pin', auth, communityController.togglePinPost); // Pin/unpin post

export default router;
