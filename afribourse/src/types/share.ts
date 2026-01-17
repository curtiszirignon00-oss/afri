// src/types/share.ts
export type ShareType =
    | 'PORTFOLIO_VALUE'
    | 'PORTFOLIO_COMPOSITION'
    | 'PERFORMANCE'
    | 'POSITION';

export interface ShareablePortfolioData {
    totalValue: number;
    gainLoss: number;
    gainLossPercent: number;
    cashBalance: number;
    stocksValue: number;
    topPositions?: {
        ticker: string;
        companyName: string;
        value: number;
        percent: number;
    }[];
    allocation?: {
        name: string;
        value: number;
        percent: number;
    }[];
}

export interface ShareablePerformanceData {
    timeFilter: string;
    totalValue: number;
    initialValue: number;
    gainLoss: number;
    gainLossPercent: number;
    dailyPerf: {
        value: number;
        percent: number;
    };
    bestDay?: {
        date: string;
        value: number;
        percent: number;
    };
    worstDay?: {
        date: string;
        value: number;
        percent: number;
    };
    chartData?: {
        date: string;
        value: number;
    }[];
}

export interface ShareablePositionData {
    ticker: string;
    companyName: string;
    quantity: number;
    averageBuyPrice: number;
    currentPrice: number;
    currentValue: number;
    gainLoss: number;
    gainLossPercent: number;
    logoUrl?: string;
}

export interface ShareData {
    type: ShareType;
    data: ShareablePortfolioData | ShareablePerformanceData | ShareablePositionData;
    generatedContent: string;
}
