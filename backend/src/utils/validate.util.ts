import z from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ errors: result.error.issues });
        }
        next();
        return;
    };
}
