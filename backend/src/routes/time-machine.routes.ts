import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import {
  listScenarios,
  getScenario,
  getStepContext,
  createSession,
  getSession,
  getUserSessions,
  submitStep,
  completeSession,
  getKofiFeedback,
  getKofiRecap,
  getFundamentals,
  importToSandbox,
} from '../controllers/time-machine.controller';

const router = Router();

// ─── Scénarios (lecture) ─────────────────────────────────────────────────────
router.get('/scenarios', auth, listScenarios);
router.get('/scenarios/:slug', auth, getScenario);
router.get('/scenarios/:slug/step/:year', auth, getStepContext);

// ─── Sessions ─────────────────────────────────────────────────────────────────
router.post('/sessions', auth, createSession);
router.get('/sessions', auth, getUserSessions);
router.get('/sessions/:id', auth, getSession);
router.put('/sessions/:id/step', auth, submitStep);
router.post('/sessions/:id/complete', auth, completeSession);

// ─── KOFI IA ──────────────────────────────────────────────────────────────────
router.post('/sessions/:id/kofi', auth, getKofiFeedback);
router.post('/sessions/:id/kofi-recap', auth, getKofiRecap);

// ─── Bridge SANDBOX ───────────────────────────────────────────────────────────
router.post('/sessions/:id/import-to-sandbox', auth, importToSandbox);

// ─── Données de référence ─────────────────────────────────────────────────────
router.get('/fundamentals/:ticker/:year', auth, getFundamentals);

export default router;
