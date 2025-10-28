// backend/src/controllers/index.controller.ts

import * as indexService from '../services/index.service.prisma';
import { Request, Response, NextFunction } from 'express';

export async function createOrUpdateIndices(req: Request, res: Response, next: NextFunction) {
    const indicesData = req.body;

    try {
        await indexService.saveIndices(indicesData);
        // CORRECTION: Added 'return'
        return res.status(200).json({ message: 'Indices saved successfully' });
    } catch (error) {
        // CORRECTION: Added 'return'
        return next(error);
    }
}

export async function getIndices(req: Request, res: Response, next: NextFunction) {
    try {
        const indices = await indexService.getAllIndices();
        // CORRECTION: Added 'return'
        return res.status(200).json(indices);
    } catch (error) {
        // CORRECTION: Added 'return'
        return next(error);
    }
}
// Controller for GET /api/indices/latest
export async function getLatestIndices(req: Request, res: Response, next: NextFunction) {
    try {
        const limit = parseInt(req.query.limit as string || '2', 10); // Default limit 2
        const indices = await indexService.getLatestIndices(limit);
        return res.status(200).json(indices);
    } catch (error) {
        return next(error);
    }
}