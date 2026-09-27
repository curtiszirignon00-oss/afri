// backend/src/routes/valuation.routes.ts
//
// Lecture : reservee aux connectes (le gating premium fin est applique cote client,
// l'onglet n'etant pour l'instant accessible que par lien direct).
// Ecriture (hypotheses, runs) : admin seulement.

import { Router } from 'express';
import { auth, admin } from '../middlewares/auth.middleware';
import {
  getInputs,
  getPublished,
  getRuns,
  getSector,
  postRun,
  putAssumptions
} from '../controllers/valuation.controller';

const router = Router();

// --- Lecture
router.get('/sector/:sector', auth, getSector);          // GET /api/valuation/sector/:sector
router.get('/:symbol/inputs', auth, getInputs);          // GET /api/valuation/:symbol/inputs
router.get('/:symbol/published', auth, getPublished);    // GET /api/valuation/:symbol/published

// --- Ecriture (admin)
router.get('/:symbol/runs', auth, admin, getRuns);       // GET /api/valuation/:symbol/runs
router.post('/:symbol/runs', auth, admin, postRun);      // POST /api/valuation/:symbol/runs
router.put('/:symbol/assumptions', auth, admin, putAssumptions);

export default router;
