import {Router} from 'express';
import * as indexController from '../controllers/index.controller';
import { admin } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', admin, indexController.createOrUpdateIndices);
router.post('/save-history', admin, indexController.triggerSaveIndexHistory); // POST /api/indices/save-history (admin)
router.get('/', indexController.getIndices);
router.get('/latest', indexController.getLatestIndices); // GET /api/indices/latest
router.get('/history/:indexName', indexController.getIndexHistory); // GET /api/indices/history/:indexName?period=1Y

export default router;