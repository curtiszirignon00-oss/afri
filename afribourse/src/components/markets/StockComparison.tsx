// src/components/markets/StockComparison.tsx
import { useState, useRef, useEffect } from 'react';
import { X, Scale, Info, BarChart3, Table, Plus, Search } from 'lucide-react';
import { Card } from '../ui';
import ShareButton from './ShareButton';
import ComparisonChart from './ComparisonChart';
import ComparisonCard from './ComparisonCard';
import type { Stock } from '../../hooks/useApi';
import type { ComparisonPeriod } from './PeriodSelector';
import { getStockLogo } from '../../utils/stockLogos';

interface StockComparisonProps {
    stocks: Stock[];
    allStocks: Stock[];
    onRemove: (stockId: string) => void;
    onAdd: (stock: Stock) => void;
    onClose: () => void;
    comparisonLimit: number;
}

export default function StockComparison({ stocks, allStocks, onRemove, onAdd, onClose, comparisonLimit }: StockComparisonProps) {
    const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
    const [period, setPeriod] = useState<ComparisonPeriod>(30);
    const [showAddDropdown, setShowAddDropdown] = useState(false);
    const [addSearch, setAddSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const availableStocks = allStocks
        .filter(s => !stocks.find(cs => cs.id === s.id))
        .filter(s =>
            addSearch === '' ||
            s.symbol.toLowerCase().includes(addSearch.toLowerCase()) ||
            s.company_name.toLowerCase().includes(addSearch.toLowerCase())
        );

    const canAddMore = stocks.length < comparisonLimit;

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowAddDropdown(false);
                setAddSearch('');
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const handleAdd = (stock: Stock) => {
        onAdd(stock);
        setShowAddDropdown(false);
        setAddSearch('');
    };

    // Calculate best and worst values
    const calculateBestWorst = () => {
        const results: Array<{ stockId: string; isBest: any; isWorst: any }> = [];

        stocks.forEach(stock => {
            const isBest = { price: false, variation: false, pe: false, dividend: false };
            const isWorst = { price: false, variation: false, pe: false, dividend: false };

            const prices = stocks.map(s => s.current_price);
            if (stock.current_price === Math.min(...prices)) isBest.price = true;
            if (stock.current_price === Math.max(...prices)) isWorst.price = true;

            const variations = stocks.map(s => s.daily_change_percent);
            if (stock.daily_change_percent === Math.max(...variations)) isBest.variation = true;
            if (stock.daily_change_percent === Math.min(...variations)) isWorst.variation = true;

            const peRatios = stocks.filter(s => s.fundamentals?.[0]?.pe_ratio).map(s => s.fundamentals![0].pe_ratio!);
            if (peRatios.length > 1 && stock.fundamentals?.[0]?.pe_ratio) {
                if (stock.fundamentals[0].pe_ratio === Math.min(...peRatios)) isBest.pe = true;
                if (stock.fundamentals[0].pe_ratio === Math.max(...peRatios)) isWorst.pe = true;
            }

            const dividends = stocks.filter(s => s.fundamentals?.[0]?.dividend_yield).map(s => s.fundamentals![0].dividend_yield!);
            if (dividends.length > 1 && stock.fundamentals?.[0]?.dividend_yield) {
                if (stock.fundamentals[0].dividend_yield === Math.max(...dividends)) isBest.dividend = true;
                if (stock.fundamentals[0].dividend_yield === Math.min(...dividends)) isWorst.dividend = true;
            }

            results.push({ stockId: stock.id, isBest, isWorst });
        });

        return results;
    };

    const bestWorst = stocks.length > 0 ? calculateBestWorst() : [];

    // Shared "Ajouter un titre" dropdown button
    const addButton = (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => canAddMore && setShowAddDropdown(!showAddDropdown)}
                disabled={!canAddMore}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    canAddMore
                        ? 'border-blue-300 text-blue-700 bg-white hover:bg-blue-50'
                        : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                }`}
                title={!canAddMore ? `Limite de ${comparisonLimit} titres atteinte` : 'Ajouter un titre'}
            >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter un titre</span>
            </button>

            {showAddDropdown && (
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                    {/* Search */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                value={addSearch}
                                onChange={e => setAddSearch(e.target.value)}
                                placeholder="Rechercher un titre..."
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-64 overflow-y-auto">
                        {availableStocks.length === 0 ? (
                            <p className="p-4 text-sm text-gray-500 text-center">
                                {addSearch ? 'Aucun résultat' : 'Tous les titres sont déjà ajoutés'}
                            </p>
                        ) : (
                            availableStocks.map(stock => {
                                const logo = getStockLogo(stock.symbol, stock.logo_url);
                                return (
                                    <button
                                        key={stock.id}
                                        onClick={() => handleAdd(stock)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                                    >
                                        {logo ? (
                                            <img src={logo} alt={stock.symbol} className="w-7 h-7 rounded object-contain bg-gray-50 border border-gray-100 flex-shrink-0" onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                                        ) : (
                                            <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                                                {stock.symbol.slice(0, 2)}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-gray-900">{stock.symbol}</div>
                                            <div className="text-xs text-gray-500 truncate">{stock.company_name}</div>
                                        </div>
                                        <div className={`ml-auto text-xs font-semibold flex-shrink-0 ${stock.daily_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {stock.daily_change_percent >= 0 ? '+' : ''}{stock.daily_change_percent.toFixed(2)}%
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer hint */}
                    <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-400 text-center">
                        {stocks.length}/{comparisonLimit === Infinity ? '∞' : comparisonLimit} titres sélectionnés
                    </div>
                </div>
            )}
        </div>
    );

    // Empty state
    if (stocks.length === 0) {
        return (
            <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-xl comparison-fade-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-blue-200">
                    <div className="flex items-center gap-2">
                        <Scale className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900 text-sm">Comparaison de titres</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {addButton}
                        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="p-8 text-center">
                    <Scale className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-700 mb-1">Aucun titre sélectionné</p>
                    <p className="text-xs text-gray-500">Utilisez le bouton <strong>Ajouter un titre</strong> ou cliquez sur <strong>+</strong> dans le tableau</p>
                </div>
            </div>
        );
    }

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
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ${activeTab === 'table' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Table className="w-4 h-4" />
                                Tableau
                            </button>
                            <button
                                onClick={() => setActiveTab('chart')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border-l ${activeTab === 'chart' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                <BarChart3 className="w-4 h-4" />
                                Graphique
                            </button>
                        </div>

                        {/* Add dropdown — next to tabs */}
                        {addButton}
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
                        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory scrollbar-hide pb-3 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0">
                            {stocks.map((stock) => {
                                const metrics = bestWorst.find(bw => bw.stockId === stock.id);
                                return (
                                    <div key={stock.id} className="w-[260px] sm:w-auto flex-shrink-0 sm:flex-shrink snap-start">
                                        <ComparisonCard
                                            stock={stock}
                                            onRemove={() => onRemove(stock.id)}
                                            isBest={metrics?.isBest}
                                            isWorst={metrics?.isWorst}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend on mobile */}
                        <div className="flex sm:hidden items-center justify-center gap-4 mt-3 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-green-100 border border-green-400 rounded"></div>
                                <span className="text-gray-600">Meilleure</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-red-100 border border-red-400 rounded"></div>
                                <span className="text-gray-600">Moins bonne</span>
                            </div>
                        </div>

                        <div className="mt-3 sm:mt-4 flex items-start gap-2 p-2.5 sm:p-3 bg-blue-100 rounded-lg">
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

            <style>{`
        .comparison-container { animation: slideDown 0.3s ease-out; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .comparison-fade-in { animation: fadeInUp 0.3s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
        </div>
    );
}
