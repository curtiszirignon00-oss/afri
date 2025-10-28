// backend/src/routes/watchlist.routes.ts

import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware'; // Protect all watchlist routes
import {
    getMyWatchlist,
    addItemToMyWatchlist,
    removeItemFromMyWatchlist
} from '../controllers/watchlist.controller';

const router = Router();

// All watchlist routes require authentication
router.use(auth); 

router.get('/my', getMyWatchlist);             // GET /api/watchlist/my
router.post('/my', addItemToMyWatchlist);         // POST /api/watchlist/my
router.delete('/my/:ticker', removeItemFromMyWatchlist); // DELETE /api/watchlist/my/SNTS

export default router;