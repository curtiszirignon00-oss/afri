import { Router } from 'express';
import { auth, optionalAuth } from '../middlewares/auth.middleware';
import {
  getLikes,
  toggleLike,
  getComments,
  addComment,
  deleteComment,
} from '../controllers/article-interactions.controller';

const router = Router({ mergeParams: true });

router.get('/:id/likes', optionalAuth, getLikes);
router.post('/:id/like', auth, toggleLike);
router.get('/:id/comments', optionalAuth, getComments);
router.post('/:id/comments', auth, addComment);
router.delete('/:id/comments/:commentId', auth, deleteComment);

export default router;
