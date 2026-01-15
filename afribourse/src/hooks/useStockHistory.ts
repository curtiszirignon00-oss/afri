// src/hooks/useStockHistory.ts
import { useQuery } from '@tanstack/react-query';

interface StockHistoryData {
    date: string;
    [symbol: string]: number | string;
}

export function useStockHistory(symbols: string[], period: 7 | 30 | 90) {
    return useQuery<StockHistoryData[]>({
        queryKey: ['stockHistory', symbols, period],
        queryFn: async () => {
            const params = new URLSearchParams({
                symbols: symbols.join(','),
                period: period.toString(),
            });

            const response = await fetch(`http://localhost:3001/api/stocks/comparison-history?${params}`);

            if (!response.ok) {
                throw new Error('Failed to fetch stock history');
            }

            const result = await response.json();
            return result.data;
        },
        enabled: symbols.length > 0,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
