// src/components/markets/ComparisonCard.tsx
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { Button } from '../ui';
import type { Stock } from '../../hooks/useApi';

interface ComparisonCardProps {
    stock: Stock;
    onRemove: () => void;
    isBest?: {
        price?: boolean;
        variation?: boolean;
        pe?: boolean;
        dividend?: boolean;
    };
    isWorst?: {
        price?: boolean;
        variation?: boolean;
        pe?: boolean;
        dividend?: boolean;
    };
}

export default function ComparisonCard({ stock, onRemove, isBest = {}, isWorst = {} }: ComparisonCardProps) {
    const navigate = useNavigate();

    const formatNumber = (num: number, decimals: number = 0): string => {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(num);
    };

    // Determine card border color
    const getBorderColor = () => {
        if (Object.values(isBest).some(v => v)) return 'border-green-400 shadow-green-100';
        if (Object.values(isWorst).some(v => v)) return 'border-red-400 shadow-red-100';
        return 'border-gray-200';
    };

    const getMetricClasses = (isBestValue?: boolean, isWorstValue?: boolean) => {
        if (isBestValue) return 'text-green-700 font-bold';
        if (isWorstValue) return 'text-red-600 font-bold';
        return 'text-gray-700';
    };

    return (
        <div className={`bg-white border-2 rounded-lg p-4 hover:shadow-md transition-all duration-200 ${getBorderColor()} comparison-card-enter`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{stock.symbol}</h3>
                        {Object.values(isBest).filter(v => v).length > 0 && (
                            <span title="Meilleure valeur">
                                <Award className="w-4 h-4 text-green-600" />
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{stock.company_name}</p>
                </div>
                <button
                    onClick={onRemove}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                    title="Retirer de la comparaison"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Metrics */}
            <div className="space-y-2.5 mb-4">
                {/* Prix */}
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Prix</span>
                    <div className="flex items-center gap-1">
                        <span className={`text-base font-semibold ${getMetricClasses(isBest.price, isWorst.price)}`}>
                            {formatNumber(stock.current_price)} F
                        </span>
                    </div>
                </div>

                {/* Variation */}
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Variation</span>
                    <div className="flex items-center gap-1">
                        <span
                            className={`text-sm font-semibold ${stock.daily_change_percent >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                                } ${isBest.variation || isWorst.variation ? 'font-bold' : ''}`}
                        >
                            {stock.daily_change_percent >= 0 ? (
                                <TrendingUp className="w-3 h-3 inline mr-0.5" />
                            ) : (
                                <TrendingDown className="w-3 h-3 inline mr-0.5" />
                            )}
                            {stock.daily_change_percent >= 0 ? '+' : ''}
                            {formatNumber(stock.daily_change_percent, 2)}%
                        </span>
                    </div>
                </div>

                {/* P/E Ratio */}
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">P/E Ratio</span>
                    <span className={`text-sm font-medium ${getMetricClasses(isBest.pe, isWorst.pe)}`}>
                        {stock.fundamentals && stock.fundamentals.length > 0 && stock.fundamentals[0].pe_ratio
                            ? formatNumber(stock.fundamentals[0].pe_ratio, 2)
                            : '-'}
                    </span>
                </div>

                {/* Dividende */}
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Dividende</span>
                    <span className={`text-sm font-medium ${getMetricClasses(isBest.dividend, isWorst.dividend)}`}>
                        {stock.fundamentals && stock.fundamentals.length > 0 && stock.fundamentals[0].dividend_yield
                            ? `${formatNumber(stock.fundamentals[0].dividend_yield, 2)}%`
                            : '-'}
                    </span>
                </div>

                {/* Volume */}
                <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Volume</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                        {formatNumber(stock.volume)}
                    </span>
                </div>

                {/* Cap. Boursière */}
                <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Cap. Bours.</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                        {formatNumber(stock.market_cap / 1000000)} M
                    </span>
                </div>
            </div>

            {/* Action Button */}
            <Button
                onClick={() => navigate(`/stock/${stock.symbol}`, { state: stock })}
                variant="outline"
                className="w-full text-sm hover:bg-blue-50 hover:border-blue-400 transition-colors"
            >
                <ExternalLink className="w-3 h-3 mr-1" />
                Voir détails
            </Button>
        </div>
    );
}
