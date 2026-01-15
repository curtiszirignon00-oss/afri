// src/services/social.service.ts
import { prisma } from '../config/database';
import type { PostType, VisibilityLevel } from '@prisma/client';

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

    // Update counters
    await Promise.all([
        prisma.userProfile.update({
            where: { userId: followerId },
            data: { following_count: { increment: 1 } },
        }),
        prisma.userProfile.update({
            where: { userId: followingId },
            data: { followers_count: { increment: 1 } },
        }),
    ]);

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

    // Update counters
    await Promise.all([
        prisma.userProfile.update({
            where: { userId: followerId },
            data: { following_count: { decrement: 1 } },
        }),
        prisma.userProfile.update({
            where: { userId: followingId },
            data: { followers_count: { decrement: 1 } },
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

    await prisma.userProfile.update({
        where: { userId: authorId },
        data: { posts_count: { increment: 1 } },
    });

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
    await prisma.post.update({
        where: { id: postId },
        data: { likes_count: { increment: 1 } },
    });

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
    await prisma.post.update({
        where: { id: postId },
        data: { comments_count: { increment: 1 } },
    });

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

    await prisma.userProfile.update({
        where: { userId: authorId },
        data: { posts_count: { decrement: 1 } },
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
 * Get post comments
 */
export async function getPostComments(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
        prisma.comment.findMany({
            where: {
                post_id: postId,
                parent_id: null, // Only top-level comments
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
                            },
                        },
                    },
                },
                replies: {
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
                    orderBy: { created_at: 'asc' },
                },
            },
        }),
        prisma.comment.count({
            where: {
                post_id: postId,
                parent_id: null,
                is_hidden: false,
            },
        }),
    ]);

    return {
        data: comments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}
