import { Router } from 'express';
import { auth, optionalAuth } from '../middlewares/auth.middleware';
import {
  getMyCertificates,
  getPendingCertificates,
  markViewed,
  trackDownload,
  trackShare,
  getCertificate,
  downloadCertificate,
} from '../controllers/certificate.controller';

const router = Router();

// ─── Apprenant (auth requis) ──────────────────────────────────────────────────
router.get('/my', auth, getMyCertificates);
router.get('/pending', auth, getPendingCertificates);
router.post('/:uuid/viewed', auth, markViewed);
router.post('/:uuid/downloaded', auth, trackDownload);
router.post('/:uuid/shared', auth, trackShare);

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/:uuid', optionalAuth, getCertificate);
router.get('/:uuid/download', downloadCertificate);

export default router;
