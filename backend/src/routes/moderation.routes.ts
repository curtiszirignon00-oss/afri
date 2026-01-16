// src/routes/moderation.routes.ts
import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import * as moderationController from '../controllers/moderation.controller';

const router = Router();

// ============= REPORTS =============
router.post('/reports', auth, moderationController.createReport);                    // Create report
router.get('/reports', auth, moderationController.getReports);                       // List reports (admin)
router.put('/reports/:reportId', auth, moderationController.processReport);          // Process report (admin)

// ============= BANNED KEYWORDS =============
router.get('/keywords', auth, moderationController.getBannedKeywords);               // List keywords (admin)
router.post('/keywords', auth, moderationController.addBannedKeyword);               // Add keyword (admin)
router.delete('/keywords/:keywordId', auth, moderationController.removeBannedKeyword); // Remove keyword (admin)
router.patch('/keywords/:keywordId/toggle', auth, moderationController.toggleBannedKeyword); // Toggle active (admin)
router.post('/keywords/check', auth, moderationController.checkBannedKeywords);      // Check text for keywords

// ============= USER BANS =============
router.post('/bans', auth, moderationController.banUser);                            // Ban user (admin)
router.delete('/bans/:banId', auth, moderationController.unbanUser);                 // Unban user (admin)
router.get('/bans', auth, moderationController.getActiveBans);                       // List active bans (admin)
router.get('/bans/user/:userId', auth, moderationController.getUserBanStatus);       // Check user ban status
router.get('/bans/user/:userId/history', auth, moderationController.getUserBans);    // User ban history (admin)

// ============= MODERATION LOGS =============
router.get('/logs', auth, moderationController.getModerationLogs);                   // Get logs (admin)

// ============= STATISTICS =============
router.get('/stats', auth, moderationController.getModerationStats);                 // Get stats (admin)

export default router;
