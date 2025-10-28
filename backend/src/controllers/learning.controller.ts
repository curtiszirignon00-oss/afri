// backend/src/controllers/learning.controller.ts

import { Request, Response, NextFunction } from 'express';
import * as learningService from '../services/learning.service.prisma';

// Controller for GET /api/learning-modules
export async function getModules(req: Request, res: Response, next: NextFunction) {
  try {
    // Get optional difficulty filter from query parameters (e.g., /api/learning-modules?difficulty=debutant)
    const difficulty = req.query.difficulty as string | undefined;

    const modules = await learningService.getPublishedModules(difficulty);
    return res.status(200).json(modules);

  } catch (error) {
    return next(error);
  }
}