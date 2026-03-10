// src/routes/moderation.routes.ts
import { Router } from 'express';
import { auth, admin } from '../middlewares/auth.middleware';
import * as moderationController from '../controllers/moderation.controller';
import { reportLimiter } from '../middleware/rateLimiter';

const router = Router();

// ============= REPORTS =============
router.post('/reports', auth, reportLimiter, moderationController.createReport); // Create report - Rate limited
router.get('/reports', admin, moderationController.getReports);                       // List reports (admin)
router.put('/reports/:reportId', admin, moderationController.processReport);          // Process report (admin)

// ============= BANNED KEYWORDS =============
router.get('/keywords', admin, moderationController.getBannedKeywords);               // List keywords (admin)
router.post('/keywords', admin, moderationController.addBannedKeyword);               // Add keyword (admin)
router.delete('/keywords/:keywordId', admin, moderationController.removeBannedKeyword); // Remove keyword (admin)
router.patch('/keywords/:keywordId/toggle', admin, moderationController.toggleBannedKeyword); // Toggle active (admin)
router.post('/keywords/check', auth, moderationController.checkBannedKeywords);      // Check text for keywords

// ============= USER BANS =============
router.post('/bans', admin, moderationController.banUser);                            // Ban user (admin)
router.delete('/bans/:banId', admin, moderationController.unbanUser);                 // Unban user (admin)
router.get('/bans', admin, moderationController.getActiveBans);                       // List active bans (admin)
router.get('/bans/user/:userId', auth, moderationController.getUserBanStatus);       // Check user ban status
router.get('/bans/user/:userId/history', admin, moderationController.getUserBans);    // User ban history (admin)

// ============= MODERATION LOGS =============
router.get('/logs', admin, moderationController.getModerationLogs);                   // Get logs (admin)

// ============= STATISTICS =============
router.get('/stats', admin, moderationController.getModerationStats);                 // Get stats (admin)

export default router;
