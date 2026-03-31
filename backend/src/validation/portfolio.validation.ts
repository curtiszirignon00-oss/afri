import zod from 'zod';
import { validate } from '../utils/validate.util';

// Tickers BRVM : 3 à 5 lettres majuscules (ex: SNTS, BOAB, SGBC, ONTBF)
const tickerSchema = zod.string()
    .min(2)
    .max(6)
    .regex(/^[A-Z0-9]+$/, 'Le ticker doit être en majuscules')
    .transform(v => v.toUpperCase());

export const buyStockSchema = zod.object({
    stockTicker: zod.string().min(2).max(6),
    quantity: zod.number().int('La quantité doit être un entier').positive('La quantité doit être positive'),
    pricePerShare: zod.number().positive('Le prix doit être positif'),
    walletType: zod.enum(['SANDBOX', 'CONCOURS']).optional(),
    wallet_type: zod.enum(['SANDBOX', 'CONCOURS']).optional(),
});

export const sellStockSchema = buyStockSchema;

export const validateBuyStock = validate(buyStockSchema);
export const validateSellStock = validate(sellStockSchema);
