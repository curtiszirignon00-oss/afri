// backend/src/routes/homepage.routes.ts

import { Router } from 'express';
import { getHomepageData } from '../controllers/homepage.controller';

const router = Router();

router.get('/', getHomepageData); // GET /api/homepage

export default router;