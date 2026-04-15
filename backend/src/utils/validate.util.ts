import z from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const firstIssue = result.error.issues[0];
            const message = firstIssue
                ? `${firstIssue.path.length ? firstIssue.path.join('.') + ': ' : ''}${firstIssue.message}`
                : 'Données invalides';
            return res.status(400).json({ error: message, errors: result.error.issues });
        }
        next();
        return;
    };
}
