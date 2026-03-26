// src/components/watchlist/WatchlistAlertButton.tsx
import { useState, useRef, useEffect } from 'react';
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, X, Loader2 } from 'lucide-react';
import { useStockAlerts, useCreatePriceAlert, useDeletePriceAlert } from '../../hooks/usePriceAlerts';

interface Props {
  ticker: string;
  currentPrice: number | null;
}

export default function WatchlistAlertButton({ ticker, currentPrice }: Props) {
  const [open, setOpen] = useState(false);
  const [alertType, setAlertType] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const { data: alerts = [], isLoading } = useStockAlerts(ticker);
  const createMut = useCreatePriceAlert();
  const deleteMut = useDeletePriceAlert();

  const activeAlerts = alerts.filter(a => a.is_active);
  const hasAlerts = activeAlerts.length > 0;

  // Pre-fill price suggestion
  useEffect(() => {
    if (open && currentPrice && !targetPrice) {
      setTargetPrice(currentPrice.toFixed(0));
    }
  }, [open, currentPrice]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function handleCreate() {
    const price = parseFloat(targetPrice);
    if (!price || price <= 0) return;
    createMut.mutate(
      { stockTicker: ticker, alertType, targetPrice: price, notifyInApp: true, notifyEmail: true },
      { onSuccess: () => { setTargetPrice(''); setOpen(false); } }
    );
  }

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`relative p-1.5 rounded-lg transition-colors ${
          hasAlerts
            ? 'text-amber-500 hover:bg-amber-50'
            : 'text-gray-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100'
        }`}
        title={hasAlerts ? `${activeAlerts.length} alerte(s) active(s)` : 'Créer une alerte'}
      >
        {hasAlerts ? <Bell className="w-4 h-4 fill-amber-200" /> : <Bell className="w-4 h-4" />}
        {hasAlerts && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-8 z-50 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Alertes — {ticker}
            </p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Existing alerts */}
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          ) : activeAlerts.length > 0 ? (
            <div className="space-y-1.5">
              {activeAlerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5">
                    {alert.alert_type === 'ABOVE'
                      ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                    <span className="text-xs font-semibold text-gray-800">
                      {alert.alert_type === 'ABOVE' ? '≥' : '≤'}{' '}
                      {new Intl.NumberFormat('fr-FR').format(alert.target_price)} FCFA
                    </span>
                  </div>
                  <button
                    onClick={() => deleteMut.mutate(alert.id)}
                    disabled={deleteMut.isPending}
                    className="text-gray-400 hover:text-red-500 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-1">Aucune alerte active</p>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Create new alert */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Nouvelle alerte</p>

            {/* Type toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              <button
                onClick={() => setAlertType('ABOVE')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium transition-colors ${
                  alertType === 'ABOVE' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="w-3 h-3" /> Au-dessus
              </button>
              <button
                onClick={() => setAlertType('BELOW')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium transition-colors ${
                  alertType === 'BELOW' ? 'bg-red-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <TrendingDown className="w-3 h-3" /> En-dessous
              </button>
            </div>

            {/* Price input */}
            <div className="flex gap-2">
              <input
                type="number"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Prix cible (FCFA)"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-400"
              />
              <button
                onClick={handleCreate}
                disabled={createMut.isPending || !targetPrice}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                {createMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              </button>
            </div>

            {currentPrice && (
              <p className="text-[10px] text-gray-400">
                Prix actuel : {new Intl.NumberFormat('fr-FR').format(currentPrice)} FCFA
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
