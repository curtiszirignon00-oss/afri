import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, X } from 'lucide-react';
import { useStocks } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { getStockLogo } from '../../utils/stockLogos';

export default function StockQuickSearch({ currentSymbol }: { currentSymbol?: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 250);

  const { data: stocks = [], isFetching } = useStocks(
    debouncedQuery.trim().length > 0
      ? { search: debouncedQuery.trim() }
      : {}
  );

  const results = stocks
    .filter(s => s.symbol !== currentSymbol)
    .slice(0, 8);

  const openSearch = useCallback(() => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(-1);
  }, []);

  const goToStock = useCallback((symbol: string) => {
    closeSearch();
    navigate(`/stock/${symbol}`);
  }, [navigate, closeSearch]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, closeSearch]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { closeSearch(); return; }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      goToStock(results[activeIndex].symbol);
    }
  }

  const showDropdown = open && (debouncedQuery.trim().length > 0 || results.length > 0);

  return (
    <div ref={containerRef} className="relative">
      {!open ? (
        <button
          onClick={openSearch}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm shadow-sm"
          title="Rechercher une action"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-medium">Changer d'action</span>
        </button>
      ) : (
        <div className="flex items-center bg-white border border-blue-400 rounded-lg shadow-lg overflow-hidden w-64 sm:w-72">
          <Search className="w-4 h-4 text-blue-500 ml-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Symbole ou nom..."
            className="flex-1 px-2 py-2 text-sm text-gray-800 bg-transparent outline-none placeholder-gray-400"
          />
          {isFetching && (
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-500 mr-2 flex-shrink-0" />
          )}
          <button
            onClick={closeSearch}
            className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showDropdown && (
        <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {results.length === 0 && !isFetching && debouncedQuery.trim().length > 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Aucune action trouvée
            </div>
          )}
          {results.length === 0 && debouncedQuery.trim().length === 0 && (
            <div className="px-4 py-3 text-xs text-gray-400 text-center">
              Tapez pour rechercher une action BRVM
            </div>
          )}
          {results.map((stock, idx) => {
            const logo = getStockLogo(stock.symbol, stock.logo_url);
            const positive = stock.daily_change_percent >= 0;
            return (
              <button
                key={stock.symbol}
                onClick={() => goToStock(stock.symbol)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 text-left transition-colors ${
                  idx === activeIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                } ${idx > 0 ? 'border-t border-gray-100' : ''}`}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt={stock.symbol}
                    className="w-8 h-8 rounded-lg object-contain bg-gray-50 border border-gray-100 flex-shrink-0"
                    onError={e => (e.target as HTMLImageElement).style.display = 'none'}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">{stock.symbol.slice(0, 2)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-gray-900 text-sm">{stock.symbol}</span>
                    {stock.sector && (
                      <span className="text-xs text-gray-400 truncate">{stock.sector}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{stock.company_name}</p>
                </div>
                <div className={`flex items-center space-x-0.5 text-xs font-medium flex-shrink-0 ${
                  positive ? 'text-green-600' : 'text-red-500'
                }`}>
                  {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{positive ? '+' : ''}{stock.daily_change_percent.toFixed(2)}%</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
