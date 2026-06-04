import { Router } from 'express';
import { getPlatformStats, getPremiumIntents, forceVerifyUser, getTrialStats, getAIFeedbackStats, sendWebinarLaunchCampaign } from '../controllers/admin.controller';
import { listAdminArticles, getAdminArticle, createAdminArticle, updateAdminArticle, deleteAdminArticle, uploadArticleCover } from '../controllers/articles.controller';
import { uploadSingleImage } from '../config/upload.config';
import { listModules, createModule, updateModule, issueCertificate, listCertificatesAdmin, revokeCertificate, resendCertificateEmail } from '../controllers/certificate.controller';
import { admin } from '../middlewares/auth.middleware';

const router = Router();

// Obtenir toutes les statistiques de la plateforme (admin uniquement)
router.get('/platform-stats', admin, getPlatformStats);

// Obtenir la liste des utilisateurs avec intentions premium
router.get('/premium-intents', admin, getPremiumIntents);

// Forcer la vérification d'email d'un utilisateur
router.post('/force-verify-email', admin, forceVerifyUser);

// Statistiques free trial IA
router.get('/trial-stats', admin, getTrialStats);

// Statistiques feedback IA (pouces levé/baissé)
router.get('/ai-feedback-stats', admin, getAIFeedbackStats);

// Campagne email — lancement webinaires (admin uniquement, irréversible)
router.post('/send-webinar-launch-email', admin, sendWebinarLaunchCampaign);

// ── Gestion des modules webinaires ────────────────────────────────────────────
router.get('/webinar-modules', admin, listModules);
router.post('/webinar-modules', admin, createModule);
router.put('/webinar-modules/:id', admin, updateModule);

// ── Gestion des certificats ───────────────────────────────────────────────────
router.post('/certificates', admin, issueCertificate);
router.get('/certificates', admin, listCertificatesAdmin);
router.post('/certificates/:id/revoke', admin, revokeCertificate);
router.post('/certificates/:id/resend-email', admin, resendCertificateEmail);

// ── Gestion des articles (admin) ─────────────────────────────────────────────
router.post('/articles/upload-cover', admin, uploadSingleImage, uploadArticleCover);
router.get('/articles', admin, listAdminArticles);
router.get('/articles/:id', admin, getAdminArticle);
router.post('/articles', admin, createAdminArticle);
router.put('/articles/:id', admin, updateAdminArticle);
router.delete('/articles/:id', admin, deleteAdminArticle);

export default router;
