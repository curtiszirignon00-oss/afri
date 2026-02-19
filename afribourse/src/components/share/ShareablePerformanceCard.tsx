// src/components/share/ShareablePerformanceCard.tsx
import { TrendingUp, TrendingDown, Activity, Trophy, AlertCircle } from 'lucide-react';
import type { ShareablePerformanceData } from '../../types/share';
import CardBranding from './CardBranding';

interface ShareablePerformanceCardProps {
    data: ShareablePerformanceData;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount) + ' FCFA';
}

export default function ShareablePerformanceCard({ data }: ShareablePerformanceCardProps) {
    const isPositive = data.gainLoss >= 0;

    return (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPositive ? 'bg-green-600' : 'bg-red-600'}`}>
                        {isPositive ? (
                            <TrendingUp className="w-5 h-5 text-white" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-white" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Performance</h3>
                        <p className="text-xs text-gray-500">{data.timeFilter}</p>
                    </div>
                </div>
            </div>

            {/* Main Performance */}
            <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Valeur Actuelle</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(data.totalValue)}</p>

                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                    <p className={`font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(data.gainLoss)}
                        <span className="text-sm ml-2">
                            ({isPositive ? '+' : ''}{data.gainLossPercent.toFixed(2)}%)
                        </span>
                    </p>
                </div>
            </div>

            {/* Daily Performance */}
            {data.dailyPerf && (
                <div className="bg-white/60 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <p className="text-xs font-medium text-gray-600">Aujourd'hui</p>
                    </div>
                    <p className={`font-semibold ${data.dailyPerf.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.dailyPerf.value >= 0 ? '+' : ''}{formatCurrency(data.dailyPerf.value)}
                        <span className="text-sm ml-2">
                            ({data.dailyPerf.percent >= 0 ? '+' : ''}{data.dailyPerf.percent.toFixed(2)}%)
                        </span>
                    </p>
                </div>
            )}

            {/* Best & Worst Days */}
            <div className="grid grid-cols-2 gap-3">
                {data.bestDay && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                        <div className="flex items-center gap-1 mb-1">
                            <Trophy className="w-3 h-3 text-green-600" />
                            <p className="text-xs font-medium text-green-700">Meilleur jour</p>
                        </div>
                        <p className="text-sm font-bold text-green-700">
                            +{data.bestDay.percent.toFixed(2)}%
                        </p>
                    </div>
                )}

                {data.worstDay && (
                    <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                        <div className="flex items-center gap-1 mb-1">
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            <p className="text-xs font-medium text-red-700">Pire jour</p>
                        </div>
                        <p className="text-sm font-bold text-red-700">
                            {data.worstDay.percent.toFixed(2)}%
                        </p>
                    </div>
                )}
            </div>

            {/* Branding */}
            <CardBranding />
        </div>
    );
}
