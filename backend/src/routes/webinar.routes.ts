import { Router } from 'express';
import { preregisterWebinar, getWebinarRegistrations } from '../controllers/webinar.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/webinars/preregister — public (no auth required, email is enough)
router.post('/preregister', preregisterWebinar);

// GET /api/webinars/registrations — admin only
router.get('/registrations', auth, getWebinarRegistrations);

export default router;
