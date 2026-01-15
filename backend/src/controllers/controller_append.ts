import { Request, Response, NextFunction } from 'express';
import * as stockService from '../services/stock.service.prisma';

// Get stock history for comparison charts
export async function getComparisonHistory(req: Request, res: Response, next: NextFunction) {
    try {
        const symbols = (req.query.symbols as string)?.split(',');
        const period = parseInt(req.query.period as string) || 30;

        if (!symbols || symbols.length === 0) {
            return res.status(400).json({ success: false, message: 'Symbols parameter is required' });
        }

        if (![7, 30, 90].includes(period)) {
            return res.status(400).json({ success: false, message: 'Period must be 7, 30, or 90' });
        }

        const history = await stockService.getHistoryForComparison(symbols, period);
        return res.status(200).json({ success: true, data: history });
    } catch (error) {
        return next(error);
    }
}
