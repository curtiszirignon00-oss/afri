import {Router} from 'express';
import * as indexController from '../controllers/index.controller';

const router = Router();

router.post('/', indexController.createOrUpdateIndices);
router.get('/', indexController.getIndices);
router.get('/latest', indexController.getLatestIndices); // GET /api/indices/latest
router.get('/history/:indexName', indexController.getIndexHistory); // GET /api/indices/history/:indexName?period=1Y

export default router;