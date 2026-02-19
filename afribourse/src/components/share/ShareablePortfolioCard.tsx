// src/components/share/ShareablePortfolioCard.tsx
import { Wallet, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import type { ShareablePortfolioData } from '../../types/share';
import CardBranding from './CardBranding';

interface ShareablePortfolioCardProps {
    data: ShareablePortfolioData;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount) + ' FCFA';
}

export default function ShareablePortfolioCard({ data }: ShareablePortfolioCardProps) {
    const isPositive = data.gainLoss >= 0;

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Portefeuille Virtuel</h3>
                    <p className="text-xs text-gray-500">Snapshot partagé</p>
                </div>
            </div>

            {/* Main Value */}
            <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Valeur Totale</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.totalValue)}</p>
            </div>

            {/* Performance */}
            <div className={`flex items-center gap-2 p-3 rounded-lg ${isPositive ? 'bg-green-50' : 'bg-red-50'} mb-4`}>
                {isPositive ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <div className="flex-1">
                    <p className="text-xs text-gray-600">Performance Totale</p>
                    <p className={`font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(data.gainLoss)}
                        <span className="text-sm ml-2">
                            ({isPositive ? '+' : ''}{data.gainLossPercent.toFixed(2)}%)
                        </span>
                    </p>
                </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">💰 Liquidités</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(data.cashBalance)}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">📊 Actions</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(data.stocksValue)}</p>
                </div>
            </div>

            {/* Top Positions */}
            {data.topPositions && data.topPositions.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <PieChart className="w-4 h-4 text-gray-600" />
                        <p className="text-xs font-medium text-gray-600">Top Positions</p>
                    </div>
                    <div className="space-y-2">
                        {data.topPositions.slice(0, 3).map((position, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white/60 rounded-lg p-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{position.ticker}</p>
                                        <p className="text-xs text-gray-500">{position.companyName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-blue-600">{position.percent.toFixed(1)}%</p>
                                    <p className="text-xs text-gray-500">{formatCurrency(position.value)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Branding */}
            <CardBranding />
        </div>
    );
}
