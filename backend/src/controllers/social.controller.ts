// src/controllers/social.controller.ts
import { Request, Response } from 'express';
import * as socialService from '../services/social.service';
// Import gamification services
import * as xpService from '../services/xp.service';
import * as streakService from '../services/streak.service';
import * as achievementService from '../services/achievement.service';
import * as weeklyChallengeService from '../services/weekly-challenge.service';
import { prisma } from '../config/database';

// Extend Request interface to include user
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
    };
}

// ============= FOLLOW CONTROLLERS =============

export async function followUser(req: AuthRequest, res: Response) {
    try {
        const followerId = req.user?.id;
        const { userId } = req.params;

        if (!followerId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const follow = await socialService.followUser(followerId, userId);

        // ========== GAMIFICATION TRIGGERS ==========
        let gamificationData: any = {};

        try {
            // 1. Enregistrer activité streak pour le follower
            await streakService.recordActivity(followerId, 'follow_user');

            // 2. Mettre à jour progression défis hebdomadaires (follow)
            await weeklyChallengeService.updateChallengeProgress(followerId, 'social', 1);

            // 3. Vérifier badges sociaux pour l'utilisateur suivi (nombre de followers)
            const followerCount = await prisma.follow.count({
                where: { followingId: userId }
            });

            // Paliers de followers: 10, 50, 100, 150, 200, 500
            const followerMilestones = [10, 50, 100, 150, 200, 500];
            if (followerMilestones.includes(followerCount)) {
                // L'utilisateur suivi reçoit XP pour le palier atteint
                await xpService.addXPForAction(userId, 'FOLLOWER_MILESTONE');

                // Vérifier badges sociaux pour l'utilisateur suivi
                const unlockedBadges = await achievementService.checkSocialAchievements(userId);
                if (unlockedBadges.length > 0) {
                    gamificationData.targetUserBadges = unlockedBadges.map(a => a.name);
                }
            }

        } catch (gamificationError) {
            console.error('Erreur gamification (follow):', gamificationError);
        }
        // ========== FIN GAMIFICATION ==========

        res.status(201).json({ success: true, data: follow, gamification: gamificationData });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function unfollowUser(req: AuthRequest, res: Response) {
    try {
        const followerId = req.user?.id;
        const { userId } = req.params;

        if (!followerId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await socialService.unfollowUser(followerId, userId);
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function getFollowers(req: Request, res: Response) {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await socialService.getFollowers(userId, page, limit);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function getFollowing(req: Request, res: Response) {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await socialService.getFollowing(userId, page, limit);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

// ============= POST CONTROLLERS =============

export async function createPost(req: AuthRequest, res: Response) {
    try {
        const authorId = req.user?.id;

        if (!authorId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const post = await socialService.createPost(authorId, req.body);
        res.status(201).json({ success: true, data: post });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function likePost(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const like = await socialService.likePost(userId, postId);
        res.status(201).json({ success: true, data: like });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function unlikePost(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await socialService.unlikePost(userId, postId);
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function commentPost(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;
        const { content, parentId } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const comment = await socialService.commentPost(userId, postId, content, parentId);

        // ========== GAMIFICATION TRIGGERS ==========
        try {
            // 1. Enregistrer activité streak
            await streakService.recordActivity(userId, 'comment');

            // 2. Mettre à jour progression défis hebdomadaires (interactions)
            await weeklyChallengeService.updateChallengeProgress(userId, 'social', 1);

        } catch (gamificationError) {
            console.error('Erreur gamification (comment):', gamificationError);
        }
        // ========== FIN GAMIFICATION ==========

        res.status(201).json({ success: true, data: comment });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function getFeed(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await socialService.getFeed(userId, page, limit);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function getUserPosts(req: AuthRequest, res: Response) {
    try {
        const { userId } = req.params;
        const viewerId = req.user?.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await socialService.getUserPosts(userId, viewerId, page, limit);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function getPostComments(req: Request, res: Response) {
    try {
        const { postId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await socialService.getPostComments(postId, page, limit);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function updatePost(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const post = await socialService.updatePost(postId, userId, req.body);
        res.status(200).json({ success: true, data: post });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function deletePost(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { postId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await socialService.deletePost(postId, userId);
        res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export async function getPost(req: AuthRequest, res: Response) {
    try {
        const { postId } = req.params;
        const viewerId = req.user?.id;

        const post = await socialService.getPostById(postId, viewerId);
        res.status(200).json({ success: true, data: post });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Get public posts for community feed
 */
export async function getPublicPosts(req: AuthRequest, res: Response) {
    try {
        const viewerId = req.user?.id; // Optional - for like status
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await socialService.getPublicPosts(page, limit, viewerId);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}
