import { Router } from 'express';
import {
  preregisterWebinar,
  getWebinarRegistrations,
  getWebinarCounts,
  sendZoomLinkToRegistrants,
  getWebinarPaymentStats,
} from '../controllers/webinar.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/counts', getWebinarCounts);
router.post('/preregister', preregisterWebinar);
router.get('/registrations', auth, getWebinarRegistrations);
router.get('/stats', auth, getWebinarPaymentStats);
router.post('/send-zoom-link', auth, sendZoomLinkToRegistrants);

export default router;
