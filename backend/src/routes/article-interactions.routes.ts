import { Router } from 'express';
import { auth, optionalAuth } from '../middlewares/auth.middleware';
import {
  getLikes,
  toggleLike,
  getComments,
  addComment,
  deleteComment,
  incrementView,
  batchCounts,
} from '../controllers/article-interactions.controller';

const router = Router({ mergeParams: true });

// Compteurs en batch (segment unique — placé avant les routes /:id pour la lisibilité)
router.post('/batch-counts', batchCounts);

router.get('/:id/likes', optionalAuth, getLikes);
router.post('/:id/like', auth, toggleLike);
router.post('/:id/view', incrementView);
router.get('/:id/comments', optionalAuth, getComments);
router.post('/:id/comments', auth, addComment);
router.delete('/:id/comments/:commentId', auth, deleteComment);

export default router;
