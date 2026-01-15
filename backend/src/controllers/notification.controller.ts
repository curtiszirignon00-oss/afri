// src/controllers/notification.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as notificationService from '../services/notification.service';

/**
 * Get user notifications
 */
export async function getNotifications(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const unreadOnly = req.query.unread === 'true';

        const result = await notificationService.getUserNotifications(userId, page, limit, unreadOnly);
        res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const count = await notificationService.getUnreadCount(userId);
        res.status(200).json({ success: true, count });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const { notificationId } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await notificationService.markAsRead(notificationId, userId);
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await notificationService.markAllAsRead(userId);
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}
