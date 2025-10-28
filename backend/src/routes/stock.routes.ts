// backend/src/routes/stock.routes.ts

import { Router } from "express";
import { getStocks, getStock } from "../controllers/stock.controller";

const router = Router();

router.get('/', getStocks);       // Route pour lister toutes les actions
router.get('/:symbol', getStock); // Route pour voir une action par son symbole

export default router;