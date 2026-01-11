// backend/src/routes/price-alert.routes.ts

import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import {
  getUserAlerts,
  createAlert,
  updateAlert,
  toggleAlert,
  deleteAlert,
  getAlertNotifications,
} from '../controllers/price-alert.controller';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(auth);

router.get('/', getUserAlerts);                         // GET /api/price-alerts?stockTicker=SIVC
router.post('/', createAlert);                          // POST /api/price-alerts
router.put('/:id', updateAlert);                        // PUT /api/price-alerts/:id
router.patch('/:id/toggle', toggleAlert);               // PATCH /api/price-alerts/:id/toggle
router.delete('/:id', deleteAlert);                     // DELETE /api/price-alerts/:id
router.get('/:id/notifications', getAlertNotifications); // GET /api/price-alerts/:id/notifications

export default router;
