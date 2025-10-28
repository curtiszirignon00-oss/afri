// backend/src/routes/learning.routes.ts

import { Router } from 'express';
import { getModules } from '../controllers/learning.controller';

const router = Router();

// This route is public, no 'auth' middleware needed
router.get('/', getModules); // GET /api/learning-modules

export default router;