import { Router } from 'express';
import {
  preregisterWebinar,
  cohortPreregister,
  getWebinarRegistrations,
  getWebinarCounts,
  sendZoomLinkToRegistrants,
  getWebinarPaymentStats,
} from '../controllers/webinar.controller';
import { auth, admin, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/counts', getWebinarCounts);
router.post('/preregister', preregisterWebinar);
router.post('/cohort-preregister', optionalAuth, cohortPreregister);
router.get('/registrations', admin, getWebinarRegistrations);
router.get('/stats', admin, getWebinarPaymentStats);
router.post('/send-zoom-link', admin, sendZoomLinkToRegistrants);

export default router;
