// backend/src/routes/health.routes.ts
import { Router } from 'express';
import * as healthController from '../controllers/health.controller';

const router = Router();

// Liveness check - simple ping
router.get('/', healthController.liveness);

// Readiness check - core dependencies
router.get('/ready', healthController.readiness);

// Deep check - all dependencies (internal use only)
router.get('/deep', healthController.deepCheck);

export default router;
