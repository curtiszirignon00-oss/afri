// src/routes/notification.routes.ts
import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

// Get user notifications
router.get('/', auth, notificationController.getNotifications);

// Get unread count
router.get('/unread-count', auth, notificationController.getUnreadCount);

// Mark single notification as read
router.put('/:notificationId/read', auth, notificationController.markAsRead);

// Mark all as read
router.put('/read-all', auth, notificationController.markAllAsRead);

export default router;
