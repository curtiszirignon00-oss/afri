// src/components/markets/StockComparison.tsx
import { useState } from 'react';
import { X, Scale, Info, BarChart3, Table } from 'lucide-react';
import { Card } from '../ui';
import ShareButton from './ShareButton';
import ComparisonChart from './ComparisonChart';
import ComparisonCard from './ComparisonCard';
import ComparisonEmptyState from './ComparisonEmptyState';
import type { Stock } from '../../hooks/useApi';

interface StockComparisonProps {
    stocks: Stock[];
    onRemove: (stockId: string) => void;
    onClose: () => void;
}

export default function StockComparison({ stocks, onRemove, onClose }: StockComparisonProps) {
    const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
    const [period, setPeriod] = useState<7 | 30 | 90>(30);

    if (stocks.length === 0) {
        return <ComparisonEmptyState />;
    }

    // Calculate best and worst values
    const calculateBestWorst = () => {
        const results: Array<{
            stockId: string;
            isBest: any;
            isWorst: any;
        }> = [];

        stocks.forEach(stock => {
            const isBest = {
                price: false,
                variation: false,
                pe: false,
                dividend: false,
            };
            const isWorst = {
                price: false,
                variation: false,
                pe: false,
                dividend: false,
            };

            // Prix (le plus bas est meilleur)
            const prices = stocks.map(s => s.current_price);
            if (stock.current_price === Math.min(...prices)) isBest.price = true;
            if (stock.current_price === Math.max(...prices)) isWorst.price = true;

            // Variation (la plus haute est meilleure)
            const variations = stocks.map(s => s.daily_change_percent);
            if (stock.daily_change_percent === Math.max(...variations)) isBest.variation = true;
            if (stock.daily_change_percent === Math.min(...variations)) isWorst.variation = true;

            // P/E Ratio (le plus bas est meilleur, si disponible)
            const peRatios = stocks
                .filter(s => s.fundamentals?.[0]?.pe_ratio)
                .map(s => s.fundamentals![0].pe_ratio!);
            if (peRatios.length > 1 && stock.fundamentals?.[0]?.pe_ratio) {
                if (stock.fundamentals[0].pe_ratio === Math.min(...peRatios)) isBest.pe = true;
                if (stock.fundamentals[0].pe_ratio === Math.max(...peRatios)) isWorst.pe = true;
            }

            // Dividend (le plus haut est meilleur, si disponible)
            const dividends = stocks
                .filter(s => s.fundamentals?.[0]?.dividend_yield)
                .map(s => s.fundamentals![0].dividend_yield!);
            if (dividends.length > 1 && stock.fundamentals?.[0]?.dividend_yield) {
                if (stock.fundamentals[0].dividend_yield === Math.max(...dividends)) isBest.dividend = true;
                if (stock.fundamentals[0].dividend_yield === Math.min(...dividends)) isWorst.dividend = true;
            }

            results.push({ stockId: stock.id, isBest, isWorst });
        });

        return results;
    };

    const bestWorst = calculateBestWorst();

    return (
        <div className="mb-6 comparison-container">
            <Card className="bg-blue-50 border-blue-200 comparison-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2 w-full sm:w-auto">
                        <Scale className="w-5 h-5 text-blue-600" />
                        {/* Tabs */}
                        <div className="flex rounded-lg border border-gray-300 bg-white overflow-hidden">
                            <button
                                onClick={() => setActiveTab('table')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ${activeTab === 'table' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Table className="w-4 h-4" />
                                Tableau
                            </button>
                            <button
                                onClick={() => setActiveTab('chart')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border-l ${activeTab === 'chart' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4" />
                                Graphique
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {/* Legend */}
                        <div className="hidden md:flex items-center gap-3 text-xs mr-4">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-green-100 border border-green-400 rounded"></div>
                                <span className="text-gray-600">Meilleure</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-red-100 border border-red-400 rounded"></div>
                                <span className="text-gray-600">Moins bonne</span>
                            </div>
                        </div>
                        <ShareButton stockIds={stocks.map(s => s.id)} />
                        <button
                            onClick={onClose}
                            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Fermer
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'table' ? (
                    <>
                        {/* Comparison Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {stocks.map((stock) => {
                                const metrics = bestWorst.find(bw => bw.stockId === stock.id);
                                return (
                                    <ComparisonCard
                                        key={stock.id}
                                        stock={stock}
                                        onRemove={() => onRemove(stock.id)}
                                        isBest={metrics?.isBest}
                                        isWorst={metrics?.isWorst}
                                    />
                                );
                            })}
                        </div>

                        {/* Help Text */}
                        <div className="mt-4 flex items-start gap-2 p-3 bg-blue-100 rounded-lg">
                            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-900">
                                <strong>Astuce :</strong> Les valeurs en vert indiquent les meilleures performances,
                                et les valeurs en rouge les moins bonnes. Utilisez cette comparaison pour identifier
                                rapidement les opportunités d'investissement.
                            </p>
                        </div>
                    </>
                ) : (
                    <ComparisonChart
                        stocks={stocks}
                        period={period}
                        onPeriodChange={setPeriod}
                    />
                )}
            </Card>

            {/* CSS Animations */}
            <style>{`
        .comparison-container {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .comparison-card-enter {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .comparison-fade-in {
          animation: fadeInUp 0.3s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
        </div>
    );
}
