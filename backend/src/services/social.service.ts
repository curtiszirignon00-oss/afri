// src/services/social.service.ts
import { prisma } from '../config/database';
import type { PostType, VisibilityLevel } from '@prisma/client';
import * as notificationService from './notification.service';

// ============= TYPES =============

export interface CreatePostDto {
    type: PostType;
    content: string;
    title?: string;
    stock_symbol?: string;
    stock_price?: number;
    stock_change?: number;
    images?: string[];
    video_url?: string;
    tags?: string[];
    visibility?: VisibilityLevel;
    metadata?: any; // Portfolio share data
}

// ============= FOLLOW SERVICES =============

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
        throw new Error('Cannot follow yourself');
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId,
                followingId,
            },
        },
    });

    if (existing) {
        throw new Error('Already following this user');
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
        data: {
            followerId,
            followingId,
        },
    });

    // Update counters - use upsert in case UserProfile doesn't exist yet
    await Promise.all([
        prisma.userProfile.upsert({
            where: { userId: followerId },
            update: { following_count: { increment: 1 } },
            create: { userId: followerId, following_count: 1, followers_count: 0, posts_count: 0 },
        }),
        prisma.userProfile.upsert({
            where: { userId: followingId },
            update: { followers_count: { increment: 1 } },
            create: { userId: followingId, followers_count: 1, following_count: 0, posts_count: 0 },
        }),
    ]);

    // Notify the user being followed
    const follower = await prisma.user.findUnique({
        where: { id: followerId },
        select: { name: true, lastname: true },
    });
    if (follower) {
        notificationService.notifyNewFollower(followerId, `${follower.name} ${follower.lastname}`, followingId)
            .catch(err => console.error('Error notifying new follower:', err));
    }

    return follow;
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string) {
    const deleted = await prisma.follow.delete({
        where: {
            followerId_followingId: {
                followerId,
                followingId,
            },
        },
    });

    // Update counters - use upsert to handle edge cases
    await Promise.all([
        prisma.userProfile.upsert({
            where: { userId: followerId },
            update: { following_count: { decrement: 1 } },
            create: { userId: followerId, following_count: 0, followers_count: 0, posts_count: 0 },
        }),
        prisma.userProfile.upsert({
            where: { userId: followingId },
            update: { followers_count: { decrement: 1 } },
            create: { userId: followingId, followers_count: 0, following_count: 0, posts_count: 0 },
        }),
    ]);

    return deleted;
}

/**
 * Get followers list
 */
export async function getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
        prisma.follow.findMany({
            where: { followingId: userId },
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                follower: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                lastname: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.follow.count({
            where: { followingId: userId },
        }),
    ]);

    return {
        data: followers.map(f => ({
            id: f.follower.user.id,
            name: f.follower.user.name,
            lastname: f.follower.user.lastname,
            username: f.follower.username,
            bio: f.follower.bio,
            avatar_url: f.follower.avatar_url,
            followers_count: f.follower.followers_count,
            verified_investor: f.follower.verified_investor,
            followed_at: f.created_at,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Get following list
 */
export async function getFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
        prisma.follow.findMany({
            where: { followerId: userId },
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                following: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                lastname: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.follow.count({
            where: { followerId: userId },
        }),
    ]);

    return {
        data: following.map(f => ({
            id: f.following.user.id,
            name: f.following.user.name,
            lastname: f.following.user.lastname,
            username: f.following.username,
            bio: f.following.bio,
            avatar_url: f.following.avatar_url,
            followers_count: f.following.followers_count,
            verified_investor: f.following.verified_investor,
            followed_at: f.created_at,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

// ============= SUGGESTION SERVICES =============

const SUGGESTION_COUNT = 3;
const CANDIDATE_POOL_SIZE = 30;

/** Simple hash for deterministic daily rotation */
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash >>> 0; // unsigned
}

/**
 * Get follow suggestions for a user
 * Returns up to 3 profiles scored by affinity (sectors, country, risk, popularity, verified)
 */
export async function getFollowSuggestions(userId: string) {
    // Phase 1: Gather current user context + exclusion list in parallel
    const [currentUserProfile, currentInvestorProfile, alreadyFollowing] = await Promise.all([
        prisma.userProfile.findUnique({
            where: { userId },
            select: { country: true, level: true },
        }),
        prisma.investorProfile.findUnique({
            where: { user_id: userId },
            select: { risk_profile: true, favorite_sectors: true },
        }),
        prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        }),
    ]);

    const followingIds = alreadyFollowing.map(f => f.followingId);
    const excludeIds = [userId, ...followingIds];

    // Phase 2: Fetch candidate pool
    const candidates = await prisma.userProfile.findMany({
        where: {
            userId: { notIn: excludeIds },
            is_public: true,
            appear_in_suggestions: true,
            username: { not: null },
        },
        select: {
            userId: true,
            username: true,
            avatar_url: true,
            avatar_color: true,
            bio: true,
            level: true,
            followers_count: true,
            posts_count: true,
            verified_investor: true,
            country: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    lastname: true,
                    investorProfile: {
                        select: {
                            risk_profile: true,
                            favorite_sectors: true,
                        },
                    },
                },
            },
        },
        take: CANDIDATE_POOL_SIZE,
        orderBy: { followers_count: 'desc' },
    });

    // Daily seed: rotate suggestions every day based on userId + date
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const dailySeed = hashCode(userId + today);

    // Phase 3: Score each candidate
    const riskOrder = ['CONSERVATIVE', 'MODERATE', 'BALANCED', 'GROWTH', 'AGGRESSIVE'];

    const scored = candidates.map((candidate, index) => {
        let score = 0;
        const candidateInvestor = candidate.user.investorProfile;

        // Factor 1: Shared favorite sectors (max 30 pts)
        if (currentInvestorProfile?.favorite_sectors?.length && candidateInvestor?.favorite_sectors?.length) {
            const currentSectors = new Set(currentInvestorProfile.favorite_sectors);
            const sharedCount = candidateInvestor.favorite_sectors.filter(s => currentSectors.has(s)).length;
            const maxPossible = Math.min(
                currentInvestorProfile.favorite_sectors.length,
                candidateInvestor.favorite_sectors.length
            );
            if (maxPossible > 0) {
                score += Math.round((sharedCount / maxPossible) * 30);
            }
        }

        // Factor 2: Same country (20 pts)
        if (currentUserProfile?.country && candidate.country === currentUserProfile.country) {
            score += 20;
        }

        // Factor 3: Same risk profile (max 15 pts, partial for adjacent)
        if (currentInvestorProfile?.risk_profile && candidateInvestor?.risk_profile) {
            if (candidateInvestor.risk_profile === currentInvestorProfile.risk_profile) {
                score += 15;
            } else {
                const currentIdx = riskOrder.indexOf(currentInvestorProfile.risk_profile);
                const candidateIdx = riskOrder.indexOf(candidateInvestor.risk_profile);
                const distance = Math.abs(currentIdx - candidateIdx);
                if (distance === 1) score += 8;
                else if (distance === 2) score += 3;
            }
        }

        // Factor 4: Popularity / Activity (max 20 pts)
        const followerScore = Math.min(Math.log2((candidate.followers_count || 0) + 1) * 2, 12);
        const activityScore = Math.min(Math.log2((candidate.posts_count || 0) + 1) * 2, 8);
        score += Math.round(followerScore + activityScore);

        // Factor 5: Verified investor (15 pts)
        if (candidate.verified_investor) {
            score += 15;
        }

        // Daily rotation: add deterministic daily bonus (0-10 pts) per candidate
        // This shifts the ranking each day so different profiles surface
        const dailyBonus = ((dailySeed + index * 2654435761) >>> 0) % 11;
        score += dailyBonus;

        return {
            id: candidate.user.id,
            name: candidate.user.name,
            lastname: candidate.user.lastname,
            username: candidate.username,
            avatar_url: candidate.avatar_url,
            avatar_color: candidate.avatar_color,
            bio: candidate.bio,
            level: candidate.level,
            followers_count: candidate.followers_count,
            verified_investor: candidate.verified_investor,
            country: candidate.country,
            _score: score,
        };
    });

    // Phase 4: Sort by score desc, deterministic daily tie-breaking
    scored.sort((a, b) => b._score - a._score);

    // Phase 5: Take top 3, strip internal score
    return scored.slice(0, SUGGESTION_COUNT).map(({ _score, ...profile }) => profile);
}

// ============= POST SERVICES =============

/**
 * Create a post
 */
export async function createPost(authorId: string, postData: CreatePostDto) {
    // Extract only valid fields to avoid passing null values for non-nullable fields
    const {
        type,
        content,
        title,
        stock_symbol,
        stock_price,
        stock_change,
        images,
        video_url,
        tags,
        visibility,
        metadata,
    } = postData;

    const post = await prisma.post.create({
        data: {
            author_id: authorId,
            type,
            content,
            ...(title && { title }),
            ...(stock_symbol && { stock_symbol }),
            ...(stock_price !== undefined && { stock_price }),
            ...(stock_change !== undefined && { stock_change }),
            ...(images && images.length > 0 && { images }),
            ...(video_url && { video_url }),
            ...(tags && tags.length > 0 && { tags }),
            ...(visibility && { visibility }),
            ...(metadata && { metadata }),
        },
        include: {
            author: {
                include: {
                    profile: {
                        select: {
                            username: true,
                            avatar_url: true,
                            verified_investor: true,
                        },
                    },
                },
            },
        },
    });

    // Increment user posts count
    await prisma.user.update({
        where: { id: authorId },
        data: { posts_count: { increment: 1 } },
    });

    await prisma.userProfile.upsert({
        where: { userId: authorId },
        update: { posts_count: { increment: 1 } },
        create: { userId: authorId, posts_count: 1, followers_count: 0, following_count: 0 },
    });

    // Notify followers about the new post (only for public posts)
    if (!visibility || visibility === 'PUBLIC') {
        const authorName = `${post.author.name} ${post.author.lastname}`;
        notificationService.notifyFollowersOfNewPost(authorId, authorName, post.id, title)
            .catch(err => console.error('Error notifying followers:', err));
    }

    return post;
}

/**
 * Like a post
 */
export async function likePost(userId: string, postId: string) {
    // Check if already liked
    const existing = await prisma.postLike.findUnique({
        where: {
            post_id_user_id: {
                post_id: postId,
                user_id: userId,
            },
        },
    });

    if (existing) {
        throw new Error('Already liked this post');
    }

    const like = await prisma.postLike.create({
        data: {
            post_id: postId,
            user_id: userId,
        },
    });

    // Increment likes count
    const post = await prisma.post.update({
        where: { id: postId },
        data: { likes_count: { increment: 1 } },
    });

    // Notify post author about the like
    const liker = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, lastname: true },
    });
    if (liker && post.author_id !== userId) {
        notificationService.notifyPostLike(userId, `${liker.name} ${liker.lastname}`, postId, post.author_id)
            .catch(err => console.error('Error notifying post like:', err));
    }

    return like;
}

/**
 * Unlike a post
 */
export async function unlikePost(userId: string, postId: string) {
    const deleted = await prisma.postLike.delete({
        where: {
            post_id_user_id: {
                post_id: postId,
                user_id: userId,
            },
        },
    });

    // Decrement likes count
    await prisma.post.update({
        where: { id: postId },
        data: { likes_count: { decrement: 1 } },
    });

    return deleted;
}

/**
 * Comment on a post
 */
export async function commentPost(userId: string, postId: string, content: string, parentId?: string) {
    const comment = await prisma.comment.create({
        data: {
            post_id: postId,
            author_id: userId,
            parent_id: parentId,
            content,
        },
        include: {
            author: {
                include: {
                    profile: {
                        select: {
                            username: true,
                            avatar_url: true,
                            verified_investor: true,
                        },
                    },
                },
            },
        },
    });

    // Increment comments count
    const post = await prisma.post.update({
        where: { id: postId },
        data: { comments_count: { increment: 1 } },
    });

    // Notify post author about the comment
    const commenter = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, lastname: true },
    });
    if (commenter && post.author_id !== userId) {
        notificationService.notifyPostComment(userId, `${commenter.name} ${commenter.lastname}`, postId, post.author_id)
            .catch(err => console.error('Error notifying post comment:', err));
    }

    // If this is a reply to another comment, notify the parent comment author
    if (parentId) {
        const parentComment = await prisma.comment.findUnique({
            where: { id: parentId },
            select: { author_id: true },
        });
        if (parentComment && parentComment.author_id !== userId && commenter) {
            notificationService.createNotification({
                userId: parentComment.author_id,
                type: 'COMMENT_REPLY',
                title: 'Nouvelle réponse',
                message: `${commenter.name} ${commenter.lastname} a répondu à votre commentaire`,
                actorId: userId,
                postId: postId,
            }).catch(err => console.error('Error notifying comment reply:', err));
        }
    }

    return comment;
}

/**
 * Get user feed (posts from followed users)
 */
export async function getFeed(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Get IDs of users being followed
    const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId); // Include own posts

    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where: {
                author_id: { in: followingIds },
                visibility: { in: ['PUBLIC', 'FOLLOWERS'] },
                is_hidden: false,
            },
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                author: {
                    include: {
                        profile: {
                            select: {
                                username: true,
                                avatar_url: true,
                                verified_investor: true,
                                followers_count: true,
                                following_count: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        }),
        prisma.post.count({
            where: {
                author_id: { in: followingIds },
                visibility: { in: ['PUBLIC', 'FOLLOWERS'] },
                is_hidden: false,
            },
        }),
    ]);

    return {
        data: posts,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Get user posts
 */
export async function getUserPosts(
    userId: string,
    viewerId?: string,
    page: number = 1,
    limit: number = 10
) {
    const skip = (page - 1) * limit;
    const isOwner = viewerId === userId;

    // Determine visibility filter
    let visibilityFilter: any = { visibility: 'PUBLIC' };
    if (isOwner) {
        visibilityFilter = {}; // Owner sees all
    } else if (viewerId) {
        // Check if viewer is following
        const isFollowing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: viewerId,
                    followingId: userId,
                },
            },
        });

        if (isFollowing) {
            visibilityFilter = { visibility: { in: ['PUBLIC', 'FOLLOWERS'] } };
        }
    }

    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where: {
                author_id: userId,
                is_hidden: false,
                ...visibilityFilter,
            },
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                author: {
                    include: {
                        profile: {
                            select: {
                                username: true,
                                avatar_url: true,
                                verified_investor: true,
                                followers_count: true,
                                following_count: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        }),
        prisma.post.count({
            where: {
                author_id: userId,
                is_hidden: false,
                ...visibilityFilter,
            },
        }),
    ]);

    return {
        data: posts,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Update a post
 */
export async function updatePost(postId: string, authorId: string, updateData: Partial<CreatePostDto>) {
    // Check if post exists and belongs to user
    const post = await prisma.post.findUnique({
        where: { id: postId },
    });

    if (!post) {
        throw new Error('Post not found');
    }

    if (post.author_id !== authorId) {
        throw new Error('You can only edit your own posts');
    }

    const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
            ...updateData,
            updated_at: new Date(),
        },
        include: {
            author: {
                include: {
                    profile: {
                        select: {
                            username: true,
                            avatar_url: true,
                            verified_investor: true,
                        },
                    },
                },
            },
        },
    });

    return updatedPost;
}

/**
 * Delete a post
 */
export async function deletePost(postId: string, authorId: string) {
    // Check if post exists and belongs to user
    const post = await prisma.post.findUnique({
        where: { id: postId },
    });

    if (!post) {
        throw new Error('Post not found');
    }

    if (post.author_id !== authorId) {
        throw new Error('You can only delete your own posts');
    }

    // Delete associated likes and comments first
    await prisma.postLike.deleteMany({
        where: { post_id: postId },
    });

    await prisma.comment.deleteMany({
        where: { post_id: postId },
    });

    // Delete the post
    await prisma.post.delete({
        where: { id: postId },
    });

    // Decrement user posts count
    await prisma.user.update({
        where: { id: authorId },
        data: { posts_count: { decrement: 1 } },
    });

    await prisma.userProfile.upsert({
        where: { userId: authorId },
        update: { posts_count: { decrement: 1 } },
        create: { userId: authorId, posts_count: 0, followers_count: 0, following_count: 0 },
    });

    return { success: true };
}

/**
 * Get a single post by ID
 */
export async function getPostById(postId: string, viewerId?: string) {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            author: {
                include: {
                    profile: {
                        select: {
                            username: true,
                            avatar_url: true,
                            verified_investor: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    likes: true,
                    comments: true,
                },
            },
        },
    });

    if (!post) {
        throw new Error('Post not found');
    }

    // Check if viewer has liked this post
    let hasLiked = false;
    if (viewerId) {
        const like = await prisma.postLike.findUnique({
            where: {
                post_id_user_id: {
                    post_id: postId,
                    user_id: viewerId,
                },
            },
        });
        hasLiked = !!like;
    }

    return {
        ...post,
        hasLiked,
    };
}

/**
 * Get public posts for community feed (no auth required)
 */
export async function getPublicPosts(page: number = 1, limit: number = 10, viewerId?: string) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where: {
                visibility: 'PUBLIC',
                is_hidden: false,
            },
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                author: {
                    include: {
                        profile: {
                            select: {
                                username: true,
                                avatar_url: true,
                                verified_investor: true,
                                level: true,
                                country: true,
                                followers_count: true,
                                following_count: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        }),
        prisma.post.count({
            where: {
                visibility: 'PUBLIC',
                is_hidden: false,
            },
        }),
    ]);

    // Check if viewer has liked posts and is following authors
    let postsWithStatus: any[] = posts;
    if (viewerId) {
        // Get liked posts
        const likedPostIds = await prisma.postLike.findMany({
            where: {
                user_id: viewerId,
                post_id: { in: posts.map(p => p.id) },
            },
            select: { post_id: true },
        });
        const likedSet = new Set(likedPostIds.map(l => l.post_id));

        // Get followed authors
        const authorIds = [...new Set(posts.map(p => p.author_id))];
        const followedAuthors = await prisma.follow.findMany({
            where: {
                followerId: viewerId,
                followingId: { in: authorIds },
            },
            select: { followingId: true },
        });
        const followedSet = new Set(followedAuthors.map(f => f.followingId));

        postsWithStatus = posts.map(post => ({
            ...post,
            hasLiked: likedSet.has(post.id),
            isFollowingAuthor: followedSet.has(post.author_id),
        }));
    }

    return {
        data: postsWithStatus,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Get post comments
 */
export async function getPostComments(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Get all comments for this post first
    const allComments = await prisma.comment.findMany({
        where: {
            post_id: postId,
            is_hidden: false,
        },
        orderBy: { created_at: 'desc' },
        include: {
            author: {
                include: {
                    profile: {
                        select: {
                            username: true,
                            avatar_url: true,
                            verified_investor: true,
                        },
                    },
                },
            },
        },
    });

    // Separate top-level comments and replies
    const topLevelComments = allComments.filter(c => !c.parent_id);
    const replies = allComments.filter(c => c.parent_id);

    // Attach replies to their parent comments
    const commentsWithReplies = topLevelComments.map(comment => ({
        ...comment,
        replies: replies.filter(r => r.parent_id === comment.id).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
    }));

    // Paginate
    const paginatedComments = commentsWithReplies.slice(skip, skip + limit);
    const total = topLevelComments.length;

    return {
        data: paginatedComments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}
