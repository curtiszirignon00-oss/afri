import zod from 'zod';
import { validate } from '../utils/validate.util';

export const addWatchlistItemSchema = zod.object({
    stockTicker: zod.string()
        .min(2, 'Ticker trop court')
        .max(6, 'Ticker trop long')
        .regex(/^[A-Za-z0-9]+$/, 'Le ticker ne doit contenir que des lettres et chiffres'),
});

export const updateWatchlistItemSchema = zod.object({
    entry_price: zod.number().positive('Le prix d\'entrée doit être positif').optional(),
    note: zod.string().max(1000, 'La note ne peut pas dépasser 1000 caractères').optional(),
    tags: zod.array(zod.string().max(50)).max(20).optional(),
}).refine(
    data => Object.keys(data).length > 0,
    { message: 'Au moins un champ est requis pour la mise à jour' }
);

export const validateAddWatchlistItem = validate(addWatchlistItemSchema);
export const validateUpdateWatchlistItem = validate(updateWatchlistItemSchema);
