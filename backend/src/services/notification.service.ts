// src/services/notification.service.ts
import { prisma } from '../config/database';
import type { NotificationType } from '@prisma/client';

// ============= TYPES =============

interface CreateNotificationDto {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    actorId?: string;
    postId?: string;
    metadata?: any;
}

// ============= SERVICES =============

/**
 * Create a single notification
 */
export async function createNotification(data: CreateNotificationDto) {
    return prisma.notification.create({
        data: {
            user_id: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            actor_id: data.actorId,
            post_id: data.postId,
            metadata: data.metadata,
        },
    });
}

/**
 * Notify all followers of a user about a new post
 */
export async function notifyFollowersOfNewPost(
    authorId: string,
    authorName: string,
    postId: string,
    postTitle?: string
) {
    // Get all followers of this user
    const followers = await prisma.follow.findMany({
        where: { followingId: authorId },
        select: { followerId: true },
    });

    if (followers.length === 0) return;

    const title = 'Nouvelle publication';
    const message = postTitle
        ? `${authorName} a publié: "${postTitle}"`
        : `${authorName} a publié un nouveau post`;

    // Create notifications for all followers
    const notifications = followers.map(f => ({
        user_id: f.followerId,
        type: 'NEW_POST' as NotificationType,
        title,
        message,
        actor_id: authorId,
        post_id: postId,
        is_read: false,
        created_at: new Date(),
    }));

    await prisma.notification.createMany({
        data: notifications,
    });

    return notifications.length;
}

/**
 * Notify user about a new follower
 */
export async function notifyNewFollower(
    followerId: string,
    followerName: string,
    followingId: string
) {
    return createNotification({
        userId: followingId,
        type: 'NEW_FOLLOWER',
        title: 'Nouveau follower',
        message: `${followerName} vous suit maintenant`,
        actorId: followerId,
    });
}

/**
 * Notify post author about a new like
 */
export async function notifyPostLike(
    likerId: string,
    likerName: string,
    postId: string,
    postAuthorId: string
) {
    // Don't notify if user liked their own post
    if (likerId === postAuthorId) return;

    return createNotification({
        userId: postAuthorId,
        type: 'POST_LIKE',
        title: 'Nouveau like',
        message: `${likerName} a aimé votre publication`,
        actorId: likerId,
        postId,
    });
}

/**
 * Notify post author about a new comment
 */
export async function notifyPostComment(
    commenterId: string,
    commenterName: string,
    postId: string,
    postAuthorId: string
) {
    // Don't notify if user commented on their own post
    if (commenterId === postAuthorId) return;

    return createNotification({
        userId: postAuthorId,
        type: 'POST_COMMENT',
        title: 'Nouveau commentaire',
        message: `${commenterName} a commenté votre publication`,
        actorId: commenterId,
        postId,
    });
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
) {
    const skip = (page - 1) * limit;

    const where: any = { user_id: userId };
    if (unreadOnly) {
        where.is_read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                actor: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                    },
                },
            },
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
            where: { user_id: userId, is_read: false },
        }),
    ]);

    return {
        data: notifications,
        total,
        unreadCount,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
        where: {
            id: notificationId,
            user_id: userId,
        },
        data: {
            is_read: true,
            read_at: new Date(),
        },
    });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
        where: {
            user_id: userId,
            is_read: false,
        },
        data: {
            is_read: true,
            read_at: new Date(),
        },
    });
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string) {
    return prisma.notification.count({
        where: {
            user_id: userId,
            is_read: false,
        },
    });
}

/**
 * Delete old notifications (cleanup job)
 */
export async function deleteOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return prisma.notification.deleteMany({
        where: {
            created_at: { lt: cutoffDate },
            is_read: true,
        },
    });
}

/**
 * Notify user about a price alert being triggered
 */
export async function notifyPriceAlert(
    userId: string,
    stockSymbol: string,
    stockName: string,
    currentPrice: number,
    targetPrice: number,
    alertType: 'ABOVE' | 'BELOW'
) {
    const direction = alertType === 'ABOVE' ? 'au-dessus de' : 'en-dessous de';

    return createNotification({
        userId,
        type: 'PRICE_ALERT',
        title: `Alerte ${stockSymbol}`,
        message: `${stockName} est maintenant ${direction} ${targetPrice} FCFA (${currentPrice} FCFA)`,
        metadata: {
            stockSymbol,
            stockName,
            currentPrice,
            targetPrice,
            alertType,
        },
    });
}
