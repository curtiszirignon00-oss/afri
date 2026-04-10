import { Router } from 'express';
import {
  createReview,
  getPublishedReviews,
  getAllReviews,
  updateReviewStatus,
} from '../controllers/reviews.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', auth, createReview);                   // Soumettre un avis
router.get('/published', getPublishedReviews);          // Avis publiés (public)
router.get('/', auth, getAllReviews);                   // Tous les avis (admin)
router.patch('/:id/status', auth, updateReviewStatus); // Modérer (admin)

export default router;
