// src/utils/shareFormatters.ts
import type {
    ShareablePortfolioData,
    ShareablePerformanceData,
    ShareablePositionData
} from '../types/share';

/**
 * Format a number as currency (FCFA)
 */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount) + ' FCFA';
}

/**
 * Generate descriptive text for portfolio value share
 */
export function generatePortfolioShareText(data: ShareablePortfolioData): string {
    const perfEmoji = data.gainLoss >= 0 ? '📈' : '📉';

    let text = `${perfEmoji} Mon portefeuille virtuel\n\n`;
    text += `💰 Valeur totale: ${formatCurrency(data.totalValue)}\n`;
    text += `${data.gainLoss >= 0 ? '✅' : '⚠️'} Performance: ${data.gainLoss >= 0 ? '+' : ''}${formatCurrency(data.gainLoss)} (${data.gainLoss >= 0 ? '+' : ''}${data.gainLossPercent.toFixed(2)}%)\n\n`;

    if (data.topPositions && data.topPositions.length > 0) {
        text += `📊 Top positions:\n`;
        data.topPositions.slice(0, 3).forEach((pos, idx) => {
            text += `${idx + 1}. ${pos.ticker} - ${pos.percent.toFixed(1)}%\n`;
        });
    }

    return text.trim();
}

/**
 * Generate descriptive text for performance share
 */
export function generatePerformanceShareText(data: ShareablePerformanceData): string {
    const perfEmoji = data.gainLoss >= 0 ? '📈' : '📉';

    let text = `${perfEmoji} Performance de mon portefeuille\n\n`;
    text += `📅 Période: ${data.timeFilter}\n`;
    text += `💰 Valeur: ${formatCurrency(data.totalValue)}\n`;
    text += `${data.gainLoss >= 0 ? '✅' : '⚠️'} Gain/Perte: ${data.gainLoss >= 0 ? '+' : ''}${formatCurrency(data.gainLoss)} (${data.gainLoss >= 0 ? '+' : ''}${data.gainLossPercent.toFixed(2)}%)\n\n`;

    if (data.dailyPerf) {
        text += `📊 Aujourd'hui: ${data.dailyPerf.value >= 0 ? '+' : ''}${formatCurrency(data.dailyPerf.value)} (${data.dailyPerf.percent >= 0 ? '+' : ''}${data.dailyPerf.percent.toFixed(2)}%)\n`;
    }

    if (data.bestDay) {
        text += `🏆 Meilleure journée: ${data.bestDay.percent >= 0 ? '+' : ''}${data.bestDay.percent.toFixed(2)}%\n`;
    }

    if (data.worstDay) {
        text += `📉 Pire journée: ${data.worstDay.percent >= 0 ? '+' : ''}${data.worstDay.percent.toFixed(2)}%\n`;
    }

    return text.trim();
}

/**
 * Generate descriptive text for position share
 */
export function generatePositionShareText(data: ShareablePositionData): string {
    const perfEmoji = data.gainLoss >= 0 ? '📈' : '📉';

    let text = `${perfEmoji} Ma position ${data.ticker}\n\n`;
    text += `🏢 ${data.companyName}\n`;
    text += `📊 Quantité: ${data.quantity} actions\n`;
    text += `💵 P.R.U.: ${formatCurrency(data.averageBuyPrice)}\n`;
    text += `💰 Prix actuel: ${formatCurrency(data.currentPrice)}\n`;
    text += `📈 Valeur: ${formatCurrency(data.currentValue)}\n`;
    text += `${data.gainLoss >= 0 ? '✅' : '⚠️'} P/L: ${data.gainLoss >= 0 ? '+' : ''}${formatCurrency(data.gainLoss)} (${data.gainLoss >= 0 ? '+' : ''}${data.gainLossPercent.toFixed(2)}%)\n`;

    return text.trim();
}

/**
 * Format share data into a post-friendly structure
 */
export function formatShareData(
    type: string,
    data: ShareablePortfolioData | ShareablePerformanceData | ShareablePositionData
): { content: string; metadata: any } {
    let content = '';

    switch (type) {
        case 'PORTFOLIO_VALUE':
        case 'PORTFOLIO_COMPOSITION':
            content = generatePortfolioShareText(data as ShareablePortfolioData);
            break;
        case 'PERFORMANCE':
            content = generatePerformanceShareText(data as ShareablePerformanceData);
            break;
        case 'POSITION':
            content = generatePositionShareText(data as ShareablePositionData);
            break;
    }

    return {
        content,
        metadata: {
            shareType: type,
            shareData: data,
        },
    };
}
