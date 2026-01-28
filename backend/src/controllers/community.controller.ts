// src/controllers/community.controller.ts
import { Request, Response } from 'express';
import * as communityService from '../services/community.service';

// Plans autorisés à créer des communautés
const ALLOWED_TIERS_FOR_COMMUNITY = ['premium', 'pro', 'max'];

// Extend Request interface to include user
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
        subscriptionTier?: string;
    };
}

// ============= COMMUNITY CRUD =============

export async function createCommunity(req: AuthRequest, res: Response) {
    try {
        const creatorId = req.user?.id;

        if (!creatorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Vérifier que l'utilisateur a un plan premium ou supérieur
        const userTier = req.user?.subscriptionTier || 'free';
        if (!ALLOWED_TIERS_FOR_COMMUNITY.includes(userTier)) {
            return res.status(403).json({
                error: 'La création de communautés est réservée aux abonnés Premium et Max. Passez à un plan supérieur pour créer votre propre communauté.'
            });
        }

        const community = await communityService.createCommunity(creatorId, req.body);
        res.status(201).json({ success: true, data: community });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function updateCommunity(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { communityId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const community = await communityService.updateCommunity(communityId, userId, req.body);
        res.status(200).json({ success: true, data: community });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function deleteCommunity(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { communityId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await communityService.deleteCommunity(communityId, userId);
        res.status(200).json({ success: true, message: 'Community deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function getCommunity(req: AuthRequest, res: Response) {
    try {
        const { idOrSlug } = req.params;
        const viewerId = req.user?.id;

        const community = await communityService.getCommunity(idOrSlug, viewerId);
        res.status(200).json({ success: true, data: community });
    } catch (error: any) {
        if (error.message === 'Community not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
}

export async function listCommunities(req: AuthRequest, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const category = req.query.category as string | undefined;
        const search = req.query.search as string | undefined;
        const featured = req.query.featured === 'true';
        const userId = req.user?.id;

        const result = await communityService.listCommunities(page, limit, {
            category,
            search,
            featured: featured || undefined,
            userId,
        });

        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function getUserCommunities(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await communityService.getUserCommunities(userId, page, limit);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

// ============= MEMBERSHIP =============

export async function joinCommunity(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { communityId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await communityService.joinCommunity(communityId, userId);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function leaveCommunity(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { communityId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await communityService.leaveCommunity(communityId, userId);
        res.status(200).json({ success: true, message: 'Left community successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function processJoinRequest(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { requestId } = req.params;
        const { action, rejectReason } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Must be "approve" or "reject"' });
        }

        const result = await communityService.processJoinRequest(requestId, userId, action, rejectReason);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function getPendingJoinRequests(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { communityId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await communityService.getPendingJoinRequests(communityId, userId, page, limit);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function updateMemberRole(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { communityId, memberId } = req.params;
        const { role } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const member = await communityService.updateMemberRole(communityId, memberId, role, userId);
        res.status(200).json({ success: true, data: member });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function removeMember(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { communityId, memberId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await communityService.removeMember(communityId, memberId, userId);
        res.status(200).json({ success: true, message: 'Member removed successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function getCommunityMembers(req: AuthRequest, res: Response) {
    try {
        const { communityId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const role = req.query.role as any;

        const result = await communityService.getCommunityMembers(communityId, page, limit, role);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

// ============= COMMUNITY POSTS =============

export async function createCommunityPost(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { communityId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const post = await communityService.createCommunityPost(communityId, userId, req.body);
        res.status(201).json({ success: true, data: post });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function getCommunityPosts(req: AuthRequest, res: Response) {
    try {
        const { communityId } = req.params;
        const viewerId = req.user?.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await communityService.getCommunityPosts(communityId, page, limit, viewerId);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function likeCommunityPost(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const like = await communityService.likeCommunityPost(postId, userId);
        res.status(201).json({ success: true, data: like });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function unlikeCommunityPost(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await communityService.unlikeCommunityPost(postId, userId);
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function commentCommunityPost(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;
        const { content, parentId } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const comment = await communityService.commentCommunityPost(postId, userId, content, parentId);
        res.status(201).json({ success: true, data: comment });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function getCommunityPostComments(req: AuthRequest, res: Response) {
    try {
        const { postId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await communityService.getCommunityPostComments(postId, page, limit);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function deleteCommunityPost(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await communityService.deleteCommunityPost(postId, userId);
        res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function togglePinPost(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const post = await communityService.togglePinPost(postId, userId);
        res.status(200).json({ success: true, data: post });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}
