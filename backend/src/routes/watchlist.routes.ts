// backend/src/routes/watchlist.routes.ts

import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware'; // Protect all watchlist routes
import {
    getMyWatchlist,
    getMyWatchlistEnriched,
    getMyWatchlistScores,
    addItemToMyWatchlist,
    updateMyWatchlistItem,
    removeItemFromMyWatchlist
} from '../controllers/watchlist.controller';
import { validateAddWatchlistItem, validateUpdateWatchlistItem } from '../validation/watchlist.validation';

const router = Router();

// All watchlist routes require authentication
router.use(auth);

router.get('/my', getMyWatchlist);                        // GET /api/watchlist/my
router.get('/my/enriched', getMyWatchlistEnriched);       // GET /api/watchlist/my/enriched
router.get('/my/scores', getMyWatchlistScores);           // GET /api/watchlist/my/scores
router.post('/my', validateAddWatchlistItem, addItemToMyWatchlist);                  // POST /api/watchlist/my
router.patch('/my/:ticker', validateUpdateWatchlistItem, updateMyWatchlistItem);     // PATCH /api/watchlist/my/SNTS
router.delete('/my/:ticker', removeItemFromMyWatchlist);   // DELETE /api/watchlist/my/SNTS

export default router;