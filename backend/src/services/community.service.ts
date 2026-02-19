// src/services/community.service.ts
import { prisma } from '../config/database';
import type { CommunityVisibility, CommunityMemberRole, PostType } from '@prisma/client';
import * as notificationService from './notification.service';

// ============= TYPES =============

export interface CreateCommunityDto {
    name: string;
    description?: string;
    avatar_url?: string;
    banner_url?: string;
    visibility?: CommunityVisibility;
    rules?: Array<{ title: string; description: string }>;
    category?: string;
    tags?: string[];
    settings?: {
        allow_posts?: boolean;
        require_post_approval?: boolean;
        min_level?: number;
        allow_invitations?: boolean;
    };
}

export interface UpdateCommunityDto extends Partial<CreateCommunityDto> { }

export interface CreateCommunityPostDto {
    type?: PostType;
    content: string;
    title?: string;
    stock_symbol?: string;
    stock_price?: number;
    stock_change?: number;
    images?: string[];
    video_url?: string;
    tags?: string[];
}

// ============= HELPER FUNCTIONS =============

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/-+/g, '-') // Replace multiple - with single -
        .trim();
}

async function generateUniqueSlug(name: string): Promise<string> {
    let slug = generateSlug(name);
    let counter = 0;
    let uniqueSlug = slug;

    while (await prisma.community.findUnique({ where: { slug: uniqueSlug } })) {
        counter++;
        uniqueSlug = `${slug}-${counter}`;
    }

    return uniqueSlug;
}

// ============= COMMUNITY CRUD =============

/**
 * Create a new community
 */
export async function createCommunity(creatorId: string, data: CreateCommunityDto) {
    const slug = await generateUniqueSlug(data.name);

    // Create community with creator as owner member
    const community = await prisma.community.create({
        data: {
            creator_id: creatorId,
            name: data.name,
            slug,
            description: data.description,
            avatar_url: data.avatar_url,
            banner_url: data.banner_url,
            visibility: data.visibility || 'PUBLIC',
            rules: data.rules || [],
            category: data.category,
            tags: data.tags || [],
            settings: data.settings || {
                allow_posts: true,
                require_post_approval: false,
                min_level: 0,
                allow_invitations: true,
            },
            members_count: 1,
        },
        include: {
            creator: {
                select: {
                    id: true,
                    name: true,
                    lastname: true,
                    profile: {
                        select: {
                            username: true,
                            avatar_url: true,
                        },
                    },
                },
            },
        },
    });

    // Add creator as OWNER member
    await prisma.communityMember.create({
        data: {
            community_id: community.id,
            user_id: creatorId,
            role: 'OWNER',
        },
    });

    return community;
}

/**
 * Update a community
 */
export async function updateCommunity(communityId: string, userId: string, data: UpdateCommunityDto) {
    // Check if user is owner or admin
    const membership = await prisma.communityMember.findUnique({
        where: {
            community_id_user_id: {
                community_id: communityId,
                user_id: userId,
            },
        },
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        throw new Error('You do not have permission to update this community');
    }

    // If name changed, update slug
    let updateData: any = { ...data };
    if (data.name) {
        const existingCommunity = await prisma.community.findUnique({ where: { id: communityId } });
        if (existingCommunity && existingCommunity.name !== data.name) {
            updateData.slug = await generateUniqueSlug(data.name);
        }
    }

    const community = await prisma.community.update({
        where: { id: communityId },
        data: updateData,
        include: {
            creator: {
                select: {
                    id: true,
                    name: true,
                    lastname: true,
                    profile: {
                        select: {
                            username: true,
                            avatar_url: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    members: true,
                    posts: true,
                },
            },
        },
    });

    return community;
}

/**
 * Delete a community (owner only)
 */
export async function deleteCommunity(communityId: string, userId: string) {
    const community = await prisma.community.findUnique({
        where: { id: communityId },
    });

    if (!community) {
        throw new Error('Community not found');
    }

    if (community.creator_id !== userId) {
        throw new Error('Only the creator can delete this community');
    }

    // Delete all related data
    await prisma.communityPostComment.deleteMany({
        where: { post: { community_id: communityId } },
    });
    await prisma.communityPostLike.deleteMany({
        where: { post: { community_id: communityId } },
    });
    await prisma.communityPost.deleteMany({
        where: { community_id: communityId },
    });
    await prisma.communityJoinRequest.deleteMany({
        where: { community_id: communityId },
    });
    await prisma.communityMember.deleteMany({
        where: { community_id: communityId },
    });
    await prisma.community.delete({
        where: { id: communityId },
    });

    return { success: true };
}

/**
 * Get community by ID or slug
 */
export async function getCommunity(idOrSlug: string, viewerId?: string) {
    // Check if idOrSlug is a valid MongoDB ObjectID (24 hex characters)
    const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(idOrSlug);

    const community = await prisma.community.findFirst({
        where: {
            ...(isValidObjectId
                ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
                : { slug: idOrSlug }
            ),
            is_active: true,
        },
        include: {
            creator: {
                select: {
                    id: true,
                    name: true,
                    lastname: true,
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
                    members: true,
                    posts: true,
                },
            },
        },
    });

    if (!community) {
        throw new Error('Community not found');
    }

    // Check if secret community and viewer is not a member
    if (community.visibility === 'SECRET' && viewerId) {
        const isMember = await prisma.communityMember.findUnique({
            where: {
                community_id_user_id: {
                    community_id: community.id,
                    user_id: viewerId,
                },
            },
        });

        if (!isMember) {
            throw new Error('Community not found');
        }
    } else if (community.visibility === 'SECRET' && !viewerId) {
        throw new Error('Community not found');
    }

    // Get viewer's membership status
    let membership = null;
    let pendingRequest = null;
    if (viewerId) {
        membership = await prisma.communityMember.findUnique({
            where: {
                community_id_user_id: {
                    community_id: community.id,
                    user_id: viewerId,
                },
            },
        });

        if (!membership) {
            pendingRequest = await prisma.communityJoinRequest.findUnique({
                where: {
                    community_id_user_id: {
                        community_id: community.id,
                        user_id: viewerId,
                    },
                },
            });
        }
    }

    return {
        ...community,
        isMember: !!membership,
        memberRole: membership?.role || null,
        hasPendingRequest: pendingRequest?.status === 'PENDING',
    };
}

/**
 * List communities with filters
 */
export async function listCommunities(
    page: number = 1,
    limit: number = 20,
    options: {
        category?: string;
        search?: string;
        visibility?: CommunityVisibility;
        featured?: boolean;
        userId?: string; // To check membership
    } = {}
) {
    const skip = (page - 1) * limit;

    const where: any = {
        is_active: true,
        visibility: { not: 'SECRET' }, // Don't show secret communities in list
    };

    if (options.category) {
        where.category = options.category;
    }

    if (options.search) {
        where.OR = [
            { name: { contains: options.search, mode: 'insensitive' } },
            { description: { contains: options.search, mode: 'insensitive' } },
        ];
    }

    if (options.visibility) {
        where.visibility = options.visibility;
    }

    if (options.featured) {
        where.is_featured = true;
    }

    const [communities, total] = await Promise.all([
        prisma.community.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ is_featured: 'desc' }, { members_count: 'desc' }, { created_at: 'desc' }],
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        profile: {
                            select: {
                                username: true,
                                avatar_url: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        members: true,
                        posts: true,
                    },
                },
            },
        }),
        prisma.community.count({ where }),
    ]);

    // Check membership for each community if userId provided
    let communitiesWithMembership = communities;
    if (options.userId) {
        const memberships = await prisma.communityMember.findMany({
            where: {
                user_id: options.userId,
                community_id: { in: communities.map((c) => c.id) },
            },
            select: { community_id: true, role: true },
        });

        const membershipMap = new Map(memberships.map((m) => [m.community_id, m.role]));

        communitiesWithMembership = communities.map((c) => ({
            ...c,
            isMember: membershipMap.has(c.id),
            memberRole: membershipMap.get(c.id) || null,
        }));
    }

    return {
        data: communitiesWithMembership,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Get user's communities (created + joined)
 */
export async function getUserCommunities(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [memberships, total] = await Promise.all([
        prisma.communityMember.findMany({
            where: { user_id: userId },
            skip,
            take: limit,
            orderBy: { joined_at: 'desc' },
            include: {
                community: {
                    include: {
                        creator: {
                            select: {
                                id: true,
                                name: true,
                                lastname: true,
                                profile: {
                                    select: {
                                        username: true,
                                        avatar_url: true,
                                    },
                                },
                            },
                        },
                        _count: {
                            select: {
                                members: true,
                                posts: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.communityMember.count({
            where: { user_id: userId },
        }),
    ]);

    return {
        data: memberships.map((m) => ({
            ...m.community,
            memberRole: m.role,
            joinedAt: m.joined_at,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

// ============= MEMBERSHIP MANAGEMENT =============

/**
 * Join a community (for public communities)
 */
export async function joinCommunity(communityId: string, userId: string) {
    const community = await prisma.community.findUnique({
        where: { id: communityId },
    });

    if (!community || !community.is_active) {
        throw new Error('Community not found');
    }

    // Check if already a member
    const existingMember = await prisma.communityMember.findUnique({
        where: {
            community_id_user_id: {
                community_id: communityId,
                user_id: userId,
            },
        },
    });

    if (existingMember) {
        throw new Error('You are already a member of this community');
    }

    // Check visibility
    if (community.visibility === 'SECRET') {
        throw new Error('This community requires an invitation to join');
    }

    if (community.visibility === 'PRIVATE') {
        // Create a join request instead
        const existingRequest = await prisma.communityJoinRequest.findUnique({
            where: {
                community_id_user_id: {
                    community_id: communityId,
                    user_id: userId,
                },
            },
        });

        if (existingRequest) {
            if (existingRequest.status === 'PENDING') {
                throw new Error('You already have a pending request to join this community');
            }
            if (existingRequest.status === 'REJECTED') {
                throw new Error('Your request to join this community was rejected');
            }
        }

        const request = await prisma.communityJoinRequest.create({
            data: {
                community_id: communityId,
                user_id: userId,
            },
        });

        // Notify community owner
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, lastname: true },
        });

        if (user) {
            notificationService
                .createNotification({
                    userId: community.creator_id,
                    type: 'JOIN_REQUEST',
                    title: 'Nouvelle demande d\'adhésion',
                    message: `${user.name} ${user.lastname} souhaite rejoindre ${community.name}`,
                    actorId: userId,
                    metadata: { communityId: community.id, communityName: community.name },
                })
                .catch((err) => console.error('Error notifying join request:', err));
        }

        return { status: 'pending', request };
    }

    // Public community - join directly
    const member = await prisma.communityMember.create({
        data: {
            community_id: communityId,
            user_id: userId,
            role: 'MEMBER',
        },
    });

    // Update member count
    await prisma.community.update({
        where: { id: communityId },
        data: { members_count: { increment: 1 } },
    });

    // Notify community owner
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, lastname: true },
    });

    if (user) {
        notificationService
            .createNotification({
                userId: community.creator_id,
                type: 'COMMUNITY_JOIN',
                title: 'Nouveau membre',
                message: `${user.name} ${user.lastname} a rejoint ${community.name}`,
                actorId: userId,
                metadata: { communityId: community.id, communityName: community.name },
            })
            .catch((err) => console.error('Error notifying community join:', err));
    }

    return { status: 'joined', member };
}

/**
 * Leave a community
 */
export async function leaveCommunity(communityId: string, userId: string) {
    const membership = await prisma.communityMember.findUnique({
        where: {
            community_id_user_id: {
                community_id: communityId,
                user_id: userId,
            },
        },
    });

    if (!membership) {
        throw new Error('You are not a member of this community');
    }

    if (membership.role === 'OWNER') {
        throw new Error('The owner cannot leave the community. Transfer ownership or delete the community instead.');
    }

    await prisma.communityMember.delete({
        where: {
            community_id_user_id: {
                community_id: communityId,
                user_id: userId,
            },
        },
    });

    // Update member count
    await prisma.community.update({
        where: { id: communityId },
        data: { members_count: { decrement: 1 } },
    });

    return { success: true };
}

/**
 * Process join request (approve/reject)
 */
export async function processJoinRequest(
    requestId: string,
    processorId: string,
    action: 'approve' | 'reject',
    rejectReason?: string
) {
    const request = await prisma.communityJoinRequest.findUnique({
        where: { id: requestId },
        include: {
            community: true,
            user: {
                select: { id: true, name: true, lastname: true },
            },
        },
    });

    if (!request) {
        throw new Error('Join request not found');
    }

    if (request.status !== 'PENDING') {
        throw new Error('This request has already been processed');
    }

    // Check if processor has permission
    const processorMembership = await prisma.communityMember.findUnique({
        where: {
            community_id_user_id: {
                community_id: request.community_id,
                user_id: processorId,
            },
        },
    });

    if (!processorMembership || !['OWNER', 'ADMIN'].includes(processorMembership.role)) {
        throw new Error('You do not have permission to process join requests');
    }

    if (action === 'approve') {
        // Update request
        await prisma.communityJoinRequest.update({
            where: { id: requestId },
            data: {
                status: 'APPROVED',
                processed_by: processorId,
                processed_at: new Date(),
            },
        });

        // Add member
        await prisma.communityMember.create({
            data: {
                community_id: request.community_id,
                user_id: request.user_id,
                role: 'MEMBER',
            },
        });

        // Update member count
        await prisma.community.update({
            where: { id: request.community_id },
            data: { members_count: { increment: 1 } },
        });

        // Notify user
        notificationService
            .createNotification({
                userId: request.user_id,
                type: 'JOIN_APPROVED',
                title: 'Demande approuvée',
                message: `Votre demande pour rejoindre ${request.community.name} a été approuvée`,
                actorId: processorId,
                metadata: { communityId: request.community_id, communityName: request.community.name },
            })
            .catch((err) => console.error('Error notifying join approved:', err));

        return { status: 'approved' };
    } else {
        // Reject
        await prisma.communityJoinRequest.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED',
                processed_by: processorId,
                processed_at: new Date(),
                reject_reason: rejectReason,
            },
        });

        // Notify user
        notificationService
            .createNotification({
                userId: request.user_id,
                type: 'JOIN_REJECTED',
                title: 'Demande refusée',
                message: `Votre demande pour rejoindre ${request.community.name} a été refusée`,
                actorId: processorId,
                metadata: { communityId: request.community_id, reason: rejectReason },
            })
            .catch((err) => console.error('Error notifying join rejected:', err));

        return { status: 'rejected' };
    }
}

/**
 * Get pending join requests for a community
 */
export async function getPendingJoinRequests(communityId: string, userId: string, page: number = 1, limit: number = 20) {
    // Check if user has permission
    const membership = await prisma.communityMember.findUnique({
        where: {
            community_id_user_id: {
                community_id: communityId,
                user_id: userId,
            },
        },
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        throw new Error('You do not have permission to view join requests');
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
        prisma.communityJoinRequest.findMany({
            where: {
                community_id: communityId,
                status: 'PENDING',
            },
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        profile: {
                            select: {
                                username: true,
                                avatar_url: true,
                                level: true,
                                verified_investor: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.communityJoinRequest.count({
            where: {
                community_id: communityId,
                status: 'PENDING',
            },
        }),
    ]);

    return {
        data: requests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Update member role
 */
export async function updateMemberRole(
    communityId: string,
    memberId: string,
    newRole: CommunityMemberRole,
    updaterId: string
) {
    // Check updater permissions
    const updaterMembership = await prisma.communityMember.findUnique({
        where: {
            community_id_user_id: {
                community_id: communityId,
                user_id: updaterId,
            },
        },
    });

    if (!updaterMembership || updaterMembership.role !== 'OWNER') {
        throw new Error('Only the owner can change member roles');
    }

    // Cannot change own role as owner
    if (memberId === updaterId) {
        throw new Error('Cannot change your own role');
    }

    // Cannot make someone else owner (must transfer ownership)
    if (newRole === 'OWNER') {
        throw new Error('Use transfer ownership to change the owner');
    }

    const member = await prisma.communityMember.update({
        where: {
            community_id_user_id: {
                community_id: communityId,
                user_id: memberId,
            },
        },
        data: { role: newRole },
    });

    return member;
}

/**
 * Remove a member from community
 */
export async function removeMember(communityId: string, memberId: string, removerId: string) {
    // Check remover permissions
    const removerMembership = await prisma.communityMember.findUnique({
        where: {
            community_id_user_id: {
                community_id: communityId,
                user_id: removerId,
            },
        },
    });

    if (!removerMembership || !['OWNER', 'ADMIN'].includes(removerMembership.role)) {
        throw new Error('You do not have permission to remove members');
    }

    const targetMembership = await prisma.communityMember.findUnique({
        where: {
            community_id_user_id: {
                community_id: communityId,
                user_id: memberId,
            },
        },
    });

    if (!targetMembership) {
        throw new Error('Member not found');
    }

    // Cannot remove owner
    if (targetMembership.role === 'OWNER') {
        throw new Error('Cannot remove the owner');
    }

    // Admins can only be removed by owner
    if (targetMembership.role === 'ADMIN' && removerMembership.role !== 'OWNER') {
        throw new Error('Only the owner can remove admins');
    }

    await prisma.communityMember.delete({
        where: {
            community_id_user_id: {
                community_id: communityId,
                user_id: memberId,
            },
        },
    });

    // Update member count
    await prisma.community.update({
        where: { id: communityId },
        data: { members_count: { decrement: 1 } },
    });

    return { success: true };
}

/**
 * Get community members list
 */
export async function getCommunityMembers(communityId: string, page: number = 1, limit: number = 20, role?: CommunityMemberRole) {
    const skip = (page - 1) * limit;

    const where: any = { community_id: communityId };
    if (role) {
        where.role = role;
    }

    const [members, total] = await Promise.all([
        prisma.communityMember.findMany({
            where,
            skip,
            take: limit,
            orderBy: [{ role: 'asc' }, { joined_at: 'asc' }],
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        profile: {
                            select: {
                                username: true,
                                avatar_url: true,
                                level: true,
                                verified_investor: true,
                                country: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.communityMember.count({ where }),
    ]);

    return {
        data: members,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

// ============= COMMUNITY POSTS =============

/**
 * Create a post in a community
 */
export async function createCommunityPost(communityId: string, authorId: string, postData: CreateCommunityPostDto) {
    // Check if member
    const membership = await prisma.communityMember.findUnique({
        where: {
            community_id_user_id: {
                community_id: communityId,
                user_id: authorId,
            },
        },
    });

    if (!membership) {
        throw new Error('You must be a member to post in this community');
    }

    if (membership.is_muted) {
        throw new Error('You are muted in this community');
    }

    const community = await prisma.community.findUnique({
        where: { id: communityId },
    });

    if (!community) {
        throw new Error('Community not found');
    }

    const settings = community.settings as any || {};
    const requireApproval = settings.require_post_approval && !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role);

    const post = await prisma.communityPost.create({
        data: {
            community_id: communityId,
            author_id: authorId,
            type: postData.type || 'OPINION',
            content: postData.content,
            title: postData.title,
            stock_symbol: postData.stock_symbol,
            stock_price: postData.stock_price,
            stock_change: postData.stock_change,
            images: postData.images || [],
            video_url: postData.video_url,
            tags: postData.tags || [],
            is_approved: !requireApproval,
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    lastname: true,
                    profile: {
                        select: {
                            username: true,
                            avatar_url: true,
                            verified_investor: true,
                        },
                    },
                },
            },
            community: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    });

    // Update post count
    await prisma.community.update({
        where: { id: communityId },
        data: { posts_count: { increment: 1 } },
    });

    // Notify community members about new post (only if approved)
    if (!requireApproval && post.community) {
        notificationService
            .notifyCommunityNewPost(
                communityId,
                post.community.name,
                post.community.slug,
                post.id,
                authorId,
                `${post.author.name} ${post.author.lastname}`,
                postData.title
            )
            .catch((err) => console.error('Error notifying community post:', err));
    }

    // Always notify platform admins about new community posts for review
    notificationService
        .notifyAdminsNewCommunityPost(
            communityId,
            post.community?.name || 'Unknown',
            post.community?.slug || '',
            post.id,
            authorId,
            `${post.author.name} ${post.author.lastname}`,
            postData.content
        )
        .catch((err) => console.error('Error notifying admins:', err));

    return post;
}

/**
 * Get community posts
 */
export async function getCommunityPosts(
    communityId: string,
    page: number = 1,
    limit: number = 10,
    viewerId?: string
) {
    const skip = (page - 1) * limit;

    // Check if viewer is a member (for private communities)
    const community = await prisma.community.findUnique({
        where: { id: communityId },
    });

    if (!community) {
        throw new Error('Community not found');
    }

    if (community.visibility !== 'PUBLIC' && viewerId) {
        const isMember = await prisma.communityMember.findUnique({
            where: {
                community_id_user_id: {
                    community_id: communityId,
                    user_id: viewerId,
                },
            },
        });

        if (!isMember) {
            throw new Error('You must be a member to view posts in this community');
        }
    } else if (community.visibility !== 'PUBLIC' && !viewerId) {
        throw new Error('You must be logged in to view posts in this community');
    }

    const [posts, total] = await Promise.all([
        prisma.communityPost.findMany({
            where: {
                community_id: communityId,
                is_approved: true,
                is_hidden: false,
            },
            skip,
            take: limit,
            orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        profile: {
                            select: {
                                username: true,
                                avatar_url: true,
                                verified_investor: true,
                                level: true,
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
        prisma.communityPost.count({
            where: {
                community_id: communityId,
                is_approved: true,
                is_hidden: false,
            },
        }),
    ]);

    // Check if viewer has liked posts
    let postsWithLikeStatus = posts;
    if (viewerId) {
        const likedPostIds = await prisma.communityPostLike.findMany({
            where: {
                user_id: viewerId,
                post_id: { in: posts.map((p) => p.id) },
            },
            select: { post_id: true },
        });
        const likedSet = new Set(likedPostIds.map((l) => l.post_id));

        postsWithLikeStatus = posts.map((post) => ({
            ...post,
            hasLiked: likedSet.has(post.id),
        }));
    }

    return {
        data: postsWithLikeStatus,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Like a community post
 */
export async function likeCommunityPost(postId: string, userId: string) {
    const post = await prisma.communityPost.findUnique({
        where: { id: postId },
    });

    if (!post) {
        throw new Error('Post not found');
    }

    // Check if member
    const isMember = await prisma.communityMember.findUnique({
        where: {
            community_id_user_id: {
                community_id: post.community_id,
                user_id: userId,
            },
        },
    });

    if (!isMember) {
        throw new Error('You must be a member to like posts');
    }

    const existing = await prisma.communityPostLike.findUnique({
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

    const like = await prisma.communityPostLike.create({
        data: {
            post_id: postId,
            user_id: userId,
        },
    });

    await prisma.communityPost.update({
        where: { id: postId },
        data: { likes_count: { increment: 1 } },
    });

    return like;
}

/**
 * Unlike a community post
 */
export async function unlikeCommunityPost(postId: string, userId: string) {
    await prisma.communityPostLike.delete({
        where: {
            post_id_user_id: {
                post_id: postId,
                user_id: userId,
            },
        },
    });

    await prisma.communityPost.update({
        where: { id: postId },
        data: { likes_count: { decrement: 1 } },
    });

    return { success: true };
}

/**
 * Comment on a community post
 */
export async function commentCommunityPost(postId: string, userId: string, content: string, parentId?: string) {
    const post = await prisma.communityPost.findUnique({
        where: { id: postId },
    });

    if (!post) {
        throw new Error('Post not found');
    }

    // Check if member
    const membership = await prisma.communityMember.findUnique({
        where: {
            community_id_user_id: {
                community_id: post.community_id,
                user_id: userId,
            },
        },
    });

    if (!membership) {
        throw new Error('You must be a member to comment');
    }

    if (membership.is_muted) {
        throw new Error('You are muted in this community');
    }

    const comment = await prisma.communityPostComment.create({
        data: {
            post_id: postId,
            author_id: userId,
            content,
            parent_id: parentId,
        },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    lastname: true,
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

    await prisma.communityPost.update({
        where: { id: postId },
        data: { comments_count: { increment: 1 } },
    });

    return comment;
}

/**
 * Get comments for a community post
 */
export async function getCommunityPostComments(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const allComments = await prisma.communityPostComment.findMany({
        where: {
            post_id: postId,
            is_hidden: false,
        },
        orderBy: { created_at: 'desc' },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    lastname: true,
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

    const topLevelComments = allComments.filter((c) => !c.parent_id);
    const replies = allComments.filter((c) => c.parent_id);

    const commentsWithReplies = topLevelComments.map((comment) => ({
        ...comment,
        replies: replies
            .filter((r) => r.parent_id === comment.id)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    }));

    const paginatedComments = commentsWithReplies.slice(skip, skip + limit);
    const total = topLevelComments.length;

    return {
        data: paginatedComments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Delete a community post
 */
export async function deleteCommunityPost(postId: string, userId: string) {
    const post = await prisma.communityPost.findUnique({
        where: { id: postId },
    });

    if (!post) {
        throw new Error('Post not found');
    }

    // Check permissions
    const membership = await prisma.communityMember.findUnique({
        where: {
            community_id_user_id: {
                community_id: post.community_id,
                user_id: userId,
            },
        },
    });

    const canDelete = post.author_id === userId || (membership && ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role));

    if (!canDelete) {
        throw new Error('You do not have permission to delete this post');
    }

    // Delete comments and likes
    await prisma.communityPostComment.deleteMany({
        where: { post_id: postId },
    });
    await prisma.communityPostLike.deleteMany({
        where: { post_id: postId },
    });
    await prisma.communityPost.delete({
        where: { id: postId },
    });

    // Update post count
    await prisma.community.update({
        where: { id: post.community_id },
        data: { posts_count: { decrement: 1 } },
    });

    return { success: true };
}

/**
 * Get unseen community posts count for a user
 * Counts all approved, non-hidden posts across all communities created after user's last visit
 */
export async function getUnseenCommunityPostsCount(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { last_community_visit: true },
    });

    const lastVisit = user?.last_community_visit;

    // Count all community posts created after last visit (or all if never visited)
    const count = await prisma.communityPost.count({
        where: {
            is_approved: true,
            is_hidden: false,
            ...(lastVisit ? { created_at: { gt: lastVisit } } : {}),
        },
    });

    return count;
}

/**
 * Mark community as visited - updates user's last_community_visit timestamp
 */
export async function markCommunityVisited(userId: string): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { last_community_visit: new Date() },
    });
}

/**
 * Pin/Unpin a community post
 */
export async function togglePinPost(postId: string, userId: string) {
    const post = await prisma.communityPost.findUnique({
        where: { id: postId },
    });

    if (!post) {
        throw new Error('Post not found');
    }

    const membership = await prisma.communityMember.findUnique({
        where: {
            community_id_user_id: {
                community_id: post.community_id,
                user_id: userId,
            },
        },
    });

    if (!membership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
        throw new Error('You do not have permission to pin posts');
    }

    const updatedPost = await prisma.communityPost.update({
        where: { id: postId },
        data: { is_pinned: !post.is_pinned },
    });

    return updatedPost;
}
