import { Router } from 'express';
import { preregisterWebinar, getWebinarRegistrations, getWebinarCounts } from '../controllers/webinar.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/webinars/counts — public, retourne le nombre d'inscrits par webinaire
router.get('/counts', getWebinarCounts);

// POST /api/webinars/preregister — public (no auth required, email is enough)
router.post('/preregister', preregisterWebinar);

// GET /api/webinars/registrations — admin only
router.get('/registrations', auth, getWebinarRegistrations);

export default router;
