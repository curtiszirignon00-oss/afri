import { Router } from 'express';
import { trackMetaEvent } from '../controllers/meta.controller';

const router = Router();

// POST /api/meta/track — relais navigateur → API Conversions Meta
router.post('/track', trackMetaEvent);

export default router;
