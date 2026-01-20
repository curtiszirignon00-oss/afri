// src/components/challenge/WeeklyStocks.tsx
import React from 'react';
import { useWeeklyStocks } from '../../hooks/useChallenge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './WeeklyStocks.css';

interface WeeklyStocksProps {
  className?: string;
}

export function WeeklyStocks({ className = '' }: WeeklyStocksProps) {
  const { data: weeklyStocks, isLoading, error } = useWeeklyStocks();

  if (isLoading) {
    return (
      <div className={`weekly-stocks ${className}`}>
        <div className="weekly-stocks-loading">
          <div className="loading-spinner"></div>
          <span>Chargement du baromètre...</span>
        </div>
      </div>
    );
  }

  if (error || !weeklyStocks) {
    return (
      <div className={`weekly-stocks ${className}`}>
        <div className="weekly-stocks-error">
          Impossible de charger le baromètre du marché
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  return (
    <div className={`weekly-stocks ${className}`}>
      <div className="weekly-stocks-header">
        <h3>
          <span className="header-icon">📊</span>
          Baromètre du Marché
        </h3>
        <span className="header-subtitle">Actions les plus échangées cette semaine</span>
      </div>

      <div className="stocks-grid">
        {/* Top 3 */}
        <div className="stocks-section top-section">
          <div className="section-header">
            <TrendingUp className="section-icon positive" />
            <h4>Top 3 de la Semaine</h4>
          </div>
          <div className="stocks-list">
            {weeklyStocks.top3.map((stock, idx) => (
              <div key={stock.ticker} className="stock-item positive">
                <div className="stock-rank">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </div>
                <div className="stock-info">
                  <span className="stock-ticker">{stock.ticker}</span>
                  <span className="stock-name">{stock.company_name}</span>
                </div>
                <div className="stock-metrics">
                  <span className="stock-change positive">
                    {formatPercent(stock.change_percent)}
                  </span>
                  <span className="stock-price">{formatPrice(stock.current_price)} FCFA</span>
                  <span className="stock-volume">{stock.tradingVolume} trades</span>
                </div>
              </div>
            ))}
            {weeklyStocks.top3.length === 0 && (
              <div className="no-data">Pas de données disponibles</div>
            )}
          </div>
        </div>

        {/* Flop 3 */}
        <div className="stocks-section flop-section">
          <div className="section-header">
            <TrendingDown className="section-icon negative" />
            <h4>Flop 3 de la Semaine</h4>
          </div>
          <div className="stocks-list">
            {weeklyStocks.flop3.map((stock, idx) => (
              <div key={stock.ticker} className="stock-item negative">
                <div className="stock-rank">
                  #{idx + 1}
                </div>
                <div className="stock-info">
                  <span className="stock-ticker">{stock.ticker}</span>
                  <span className="stock-name">{stock.company_name}</span>
                </div>
                <div className="stock-metrics">
                  <span className="stock-change negative">
                    {formatPercent(stock.change_percent)}
                  </span>
                  <span className="stock-price">{formatPrice(stock.current_price)} FCFA</span>
                  <span className="stock-volume">{stock.tradingVolume} trades</span>
                </div>
              </div>
            ))}
            {weeklyStocks.flop3.length === 0 && (
              <div className="no-data">Pas de données disponibles</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
