// src/components/share/ShareablePositionCard.tsx
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import type { ShareablePositionData } from '../../types/share';
import CardBranding from './CardBranding';

interface ShareablePositionCardProps {
    data: ShareablePositionData;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount) + ' FCFA';
}

export default function ShareablePositionCard({ data }: ShareablePositionCardProps) {
    const isPositive = data.gainLoss >= 0;

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
            {/* Header with Stock Info */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {data.logoUrl ? (
                        <img src={data.logoUrl} alt={data.ticker} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        data.ticker.substring(0, 2)
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{data.ticker}</h3>
                    <p className="text-sm text-gray-600">{data.companyName}</p>
                </div>
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                </div>
            </div>

            {/* Position Details */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Quantité</p>
                    <p className="font-semibold text-gray-900">{data.quantity} actions</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">P.R.U.</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(data.averageBuyPrice)}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Prix Actuel</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(data.currentPrice)}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Valeur Totale</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(data.currentValue)}</p>
                </div>
            </div>

            {/* Performance */}
            <div className={`p-4 rounded-lg ${isPositive ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isPositive ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                        <p className="text-sm font-medium text-gray-700">Plus/Moins Value</p>
                    </div>
                    <div className="text-right">
                        <p className={`text-lg font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(data.gainLoss)}
                        </p>
                        <p className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            ({isPositive ? '+' : ''}{data.gainLossPercent.toFixed(2)}%)
                        </p>
                    </div>
                </div>
            </div>

            {/* Branding */}
            <CardBranding />
        </div>
    );
}
