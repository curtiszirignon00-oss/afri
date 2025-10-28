import {Router} from 'express';
import * as indexController from '../controllers/index.controller';

const router = Router();

router.post('/', indexController.createOrUpdateIndices);
router.get('/', indexController.getIndices);
router.get('/latest', indexController.getLatestIndices); // GET /api/indices/latest
export default router;