import { Router } from 'express';
import {
  preregisterWebinar,
  getWebinarRegistrations,
  getWebinarCounts,
  sendZoomLinkToRegistrants,
  getWebinarPaymentStats,
} from '../controllers/webinar.controller';
import { auth, admin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/counts', getWebinarCounts);
router.post('/preregister', preregisterWebinar);
router.get('/registrations', admin, getWebinarRegistrations);
router.get('/stats', admin, getWebinarPaymentStats);
router.post('/send-zoom-link', admin, sendZoomLinkToRegistrants);

export default router;
